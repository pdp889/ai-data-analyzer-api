import { AppError } from '@/middleware/errorHandler';
import { AnalysisResult, AnalysisState } from '@/schemas/analysis.schema';
import { parse } from 'csv-parse/sync';
import { runWithTracking } from '@/utils/agent-runner';
import { createDetectiveAgent } from '@/agent/detective.agent';
import { createProfilerAgent } from '@/agent/profiler.agent';
import { createStorytellerAgent } from '@/agent/storyteller.agent';
import { SessionService } from './session.service';
export class AnalysisService {

  static analyzeDatasetWithAgents = async (req: any): Promise<AnalysisResult> => {
    const records = AnalysisService.parseCsv(req.file || undefined);

    const profilerAgent = createProfilerAgent(records);

    const profilerResult = await runWithTracking(
      profilerAgent,
      'Please perform a comprehensive analysis of the uploaded dataset',
      req.session.id
    );

    const detectiveAgent = createDetectiveAgent(records, profilerResult.finalOutput);

    const detectiveResult = await runWithTracking(
      detectiveAgent,
      'Please perform a comprehensive analysis of the uploaded dataset',
      req.session.id
    );

    const storytellerAgent = createStorytellerAgent(records, profilerResult.finalOutput, detectiveResult.finalOutput);

    const storytellerResult = await runWithTracking(
      storytellerAgent,
      'Please perform a comprehensive analysis of the uploaded dataset',
      req.session.id
    );

    const result : AnalysisResult = {
      profile: profilerResult.finalOutput,
      insights: detectiveResult.finalOutput,
      narrative: storytellerResult.finalOutput,
    }

    SessionService.saveAnalysisState(req, result, records);

    return result;
    
  }

  
  static parseCsv = (file: Express.Multer.File | undefined): any[] => {
    if (!file) {
      throw new AppError(400, 'No file uploaded');
    }
  
    const records = parse(file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
    });
  
    if (!records.length) {
      throw new AppError(400, 'No data found in CSV file');
    }
  
    return records;
  };
  
}