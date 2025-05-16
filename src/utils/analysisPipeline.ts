import { ProfilerAgent } from '../agents/ProfilerAgent';
import { DetectiveAgent } from '../agents/DetectiveAgent';
import { StorytellerAgent } from '../agents/StorytellerAgent';
import { DatasetProfile, Insight } from '../types/data';
import { logger } from './logger';
import { AppError, handleOpenAIError } from '../middleware/errorHandler';

export interface AnalysisPrompts {
  profilerPrompt?: string;
  detectivePrompt?: string;
  storytellerPrompt?: string;
}

export interface AnalysisResult {
  profile: DatasetProfile;
  insights: Insight[];
  narrative: string;
}

export async function runAnalysisPipeline(
  data: any[],
  apiKey: string,
  prompts?: AnalysisPrompts
): Promise<AnalysisResult> {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new AppError(400, 'Invalid or empty dataset provided');
    }

    if (!apiKey) {
      throw new AppError(401, 'OpenAI API key is required');
    }

    // Create new instances of the agents
    const profilerAgent = new ProfilerAgent(apiKey);
    const detectiveAgent = new DetectiveAgent(apiKey);
    const storytellerAgent = new StorytellerAgent(apiKey);

    // Step 1: Profile the dataset
    logger.info('Starting dataset profiling...');
    const profile = await profilerAgent.analyze(data, prompts?.profilerPrompt);
    if (!profile) {
      throw new AppError(500, 'Failed to generate dataset profile');
    }
    logger.info('Dataset profiling completed');

    // Step 2: Generate insights
    logger.info('Starting insight generation...');
    const detectiveAnalysis = await detectiveAgent.analyze(data, profile, prompts?.detectivePrompt);
    if (
      !detectiveAnalysis ||
      !detectiveAnalysis.insights ||
      detectiveAnalysis.insights.length === 0
    ) {
      throw new AppError(500, 'Failed to generate insights');
    }
    logger.info(`Generated ${detectiveAnalysis.insights.length} insights`);

    // Step 3: Create narrative
    logger.info('Starting narrative synthesis...');
    const storyAnalysis = await storytellerAgent.analyze(
      profile,
      detectiveAnalysis.insights,
      prompts?.storytellerPrompt
    );
    if (!storyAnalysis || !storyAnalysis.narrative) {
      throw new AppError(500, 'Failed to generate narrative');
    }
    logger.info('Narrative synthesis completed');

    return {
      profile,
      insights: detectiveAnalysis.insights,
      narrative: storyAnalysis.narrative,
    };
  } catch (error: any) {
    handleOpenAIError(error);
  }
}
