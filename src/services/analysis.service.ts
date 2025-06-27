import { AppError } from '@/middleware/errorHandler';
import { AnalysisResult } from '@/schemas/analysis.schema';
import { parse } from 'csv-parse/sync';
import { createDetectiveAgent } from '@/agent/detective.agent';
import { createProfilerAgent } from '@/agent/profiler.agent';
import { createStorytellerAgent } from '@/agent/storyteller.agent';
import { SessionService } from './session.service';
import fs from 'fs';
import path from 'path';
import { createAdditionalContextAgent } from '@/agent/additional-context.agent';
import { run } from '@openai/agents';
import {
  AdditionalContext,
  AdditionalContextAgentResult,
} from '@/schemas/additional-context.schema';
import { Insight, InsightAgentResult } from '@/schemas/insight.schema';
import { DatasetProfile } from '@/schemas/dataset-profile.schema';

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
    try {
      // Clear any previous status
      await SessionService.clearAgentStatus(req);

      console.log('Running Profiler Agent with full dataset...');
      await SessionService.updateAgentStatus(
        req,
        'Profiler Agent',
        'starting',
        'Initializing dataset profiling...'
      );

      const profilerAgent = createProfilerAgent(records);
      await SessionService.updateAgentStatus(
        req,
        'Profiler Agent',
        'running',
        'Analyzing dataset structure and statistics...'
      );

      const profilerResult = await run(
        profilerAgent,
        'Please perform a comprehensive analysis of the uploaded dataset'
      );
      const profile: DatasetProfile = profilerResult.finalOutput as DatasetProfile;

      await SessionService.updateAgentStatus(
        req,
        'Profiler Agent',
        'completed',
        'Dataset profiling completed successfully'
      );

      console.log('Running Detective Agent with full dataset...');
      await SessionService.updateAgentStatus(
        req,
        'Detective Agent',
        'starting',
        'Initializing pattern detection...'
      );

      const detectiveAgent = createDetectiveAgent(records, profile);
      await SessionService.updateAgentStatus(
        req,
        'Detective Agent',
        'running',
        'Detecting patterns, correlations, and insights...'
      );

      const detectiveResult = await run(
        detectiveAgent,
        'Please perform a comprehensive analysis of the uploaded dataset'
      );
      const { insights }: { insights: Insight[] } =
        detectiveResult.finalOutput as InsightAgentResult;

      await SessionService.updateAgentStatus(
        req,
        'Detective Agent',
        'completed',
        'Pattern detection completed successfully'
      );

      console.log('Running Storyteller Agent with sampled dataset...');
      await SessionService.updateAgentStatus(
        req,
        'Storyteller Agent',
        'starting',
        'Initializing narrative generation...'
      );

      const storytellerAgent = createStorytellerAgent(records, profile, insights);
      await SessionService.updateAgentStatus(
        req,
        'Storyteller Agent',
        'running',
        'Generating human-readable narrative...'
      );

      const storytellerResult = await run(
        storytellerAgent,
        'Please create a narrative summary based on the analysis results'
      );
      const narrative: string = storytellerResult.finalOutput as string;

      await SessionService.updateAgentStatus(
        req,
        'Storyteller Agent',
        'completed',
        'Narrative generation completed successfully'
      );

      console.log('Running Additional Context Agent with sampled dataset...');
      await SessionService.updateAgentStatus(
        req,
        'Additional Context Agent',
        'starting',
        'Initializing context research...'
      );

      const additionalContextAgent = await createAdditionalContextAgent(
        records,
        profile,
        insights,
        narrative
      );
      await SessionService.updateAgentStatus(
        req,
        'Additional Context Agent',
        'running',
        'Researching relevant FDA context...'
      );

      const additionalContextResult = await run(
        additionalContextAgent,
        'Please find relevant FDA context for this dataset'
      );
      const { contexts }: { contexts: AdditionalContext[] } =
        additionalContextResult.finalOutput as AdditionalContextAgentResult;

      await SessionService.updateAgentStatus(
        req,
        'Additional Context Agent',
        'completed',
        'Context research completed successfully'
      );

      const result: AnalysisResult = {
        profile: profile,
        insights: insights,
        narrative: narrative,
        additionalContexts: contexts,
      };

      console.log('Analysis pipeline completed successfully');
      await SessionService.updateAgentStatus(
        req,
        'Analysis Pipeline',
        'completed',
        'All agents completed successfully'
      );
      SessionService.saveAnalysisState(req, result, records);

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      await SessionService.updateAgentStatus(
        req,
        'Analysis Pipeline',
        'error',
        `Analysis failed: ${errorMessage}`
      );
      throw error;
    }
  };
}
