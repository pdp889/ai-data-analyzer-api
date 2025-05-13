import { ProfilerAgent } from '../agents/ProfilerAgent';
import { DetectiveAgent } from '../agents/DetectiveAgent';
import { StorytellerAgent } from '../agents/StorytellerAgent';
import { DatasetProfile, Insight } from '../types/agents';
import { logger } from './logger';
import { AppError } from '../middleware/errorHandler';

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
    const insights = await detectiveAgent.analyze(data, profile, prompts?.detectivePrompt);
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      throw new AppError(500, 'Failed to generate insights');
    }
    logger.info(`Generated ${insights.length} insights`);
    
    // Step 3: Create narrative
    logger.info('Starting narrative synthesis...');
    const narrative = await storytellerAgent.analyze(profile, insights, prompts?.storytellerPrompt);
    if (!narrative) {
      throw new AppError(500, 'Failed to generate narrative');
    }
    logger.info('Narrative synthesis completed');

    return { profile, insights, narrative };
  } catch (error: any) {
    logger.error('Error in analysis pipeline:', error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    if (error.message?.includes('insufficient_quota') || error.message?.includes('exceeded your current quota')) {
      throw new AppError(429, 'OpenAI API quota exceeded. Please check your billing details and try again later.');
    }
    
    if (error.status === 429) {
      throw new AppError(429, 'OpenAI API rate limit exceeded. Please try again later.');
    }
    
    if (error.status === 401) {
      throw new AppError(401, 'Invalid OpenAI API key. Please check your configuration.');
    }
    
    throw new AppError(500, 'An error occurred during the analysis pipeline');
  }
} 