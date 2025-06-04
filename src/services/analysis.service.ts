import { AppError } from '@/middleware/errorHandler';
import { AnalysisResult } from '@/schemas/analysis.schema';
import { parse } from 'csv-parse/sync';
import { runWithTracking } from '@/utils/agent-runner';
import { createDetectiveAgent } from '@/agent/detective.agent';
import { createProfilerAgent } from '@/agent/profiler.agent';
import { createStorytellerAgent } from '@/agent/storyteller.agent';
import { SessionService } from './session.service';
import fs from 'fs';
import path from 'path';
import { createAdditionalContextAgent } from '@/agent/additional-context.agent';

export class AnalysisService {
  static analyzeDatasetWithAgents = async (req: any): Promise<AnalysisResult> => {
    const records = AnalysisService.parseCsv(req.file || undefined);
    return AnalysisService.analyzeWithAgents(req, records);
  };

  static analyzeDefaultDataset = async (req: any): Promise<AnalysisResult> => {
    const testFilePath = path.join(
      process.cwd(),
      'test/Environmental_Antecedents_of_Foodborne_Illness_Outbreaks.csv'
    );
    const fileContent = fs.readFileSync(testFilePath);
    const records = AnalysisService.parseBuffer(fileContent);
    return AnalysisService.analyzeWithAgents(req, records);
  };

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

  static parseBuffer = (buffer: Buffer): any[] => {
    const records = parse(buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
    });

    if (!records.length) {
      throw new AppError(400, 'No data found in CSV file');
    }

    return records;
  };

  static analyzeWithAgents = async (req: any, records: any[]) => {
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

    const storytellerAgent = createStorytellerAgent(
      records,
      profilerResult.finalOutput,
      detectiveResult.finalOutput
    );

    const storytellerResult = await runWithTracking(
      storytellerAgent,
      'Please perform a comprehensive analysis of the uploaded dataset',
      req.session.id
    );

    const additionalContextAgent = createAdditionalContextAgent(
      records,
      profilerResult.finalOutput,
      detectiveResult.finalOutput,
      storytellerResult.finalOutput
    );

    const additionalContextResult = await runWithTracking(
      additionalContextAgent,
      'Please perform a comprehensive analysis of the uploaded dataset',
      req.session.id
    );

    const result: AnalysisResult = {
      profile: profilerResult.finalOutput,
      insights: detectiveResult.finalOutput,
      narrative: storytellerResult.finalOutput,
      additionalContexts: additionalContextResult.finalOutput,
    };

    SessionService.saveAnalysisState(req, result, records);

    return result;
  };
}
