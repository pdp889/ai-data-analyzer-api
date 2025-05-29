import { DetectiveAnalysis, DatasetProfile } from '../types/data';
import { DetectiveAgent as IDetectiveAgent } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError, handleOpenAIError } from '../middleware/errorHandler';
import { DETECTIVE_AGENT_PROMPTS } from '../config/prompts';

export class DetectiveAgent implements IDetectiveAgent {
  name = 'Detective';
  role = 'Insight Generator';
  private openai: OpenAI;
  private readonly MAX_SAMPLE_SIZE = 10000;
  private readonly CHUNK_THRESHOLD = 20000;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyze(
    data: any[],
    profile: DatasetProfile,
    customPrompt?: string
  ): Promise<DetectiveAnalysis> {
    try {
      // If dataset is small enough, analyze it directly
      if (data.length <= this.CHUNK_THRESHOLD) {
        logger.info(`Analyzing ${data.length} rows in a single request`);
        const prompt = this.buildPrompt(data, profile, customPrompt);
        return await this.processData(prompt);
      }

      // For larger datasets, analyze in chunks
      logger.info(`Dataset size (${data.length} rows) exceeds threshold, analyzing in chunks`);
      const windows = this.createAnalysisWindows(data);
      logger.info(`Analyzing ${windows.length} windows of data`);

      const results = await Promise.all(
        windows.map((window) => {
          const prompt = this.buildPrompt(window, profile, customPrompt);
          return this.processData(prompt);
        })
      );

      // Merge insights from all windows
      const mergedInsights = this.mergeInsights(results);
      return { insights: mergedInsights };
    } catch (error: any) {
      handleOpenAIError(error);
    }
  }

  private async processData(prompt: string): Promise<DetectiveAnalysis> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: DETECTIVE_AGENT_PROMPTS.system,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 32000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AppError(500, 'No response received from OpenAI');
    }

    const insights = this.parseResponse(content);
    return { insights };
  }

  private buildPrompt(data: any[], profile: DatasetProfile, customPrompt?: string): string {
    // Take a larger sample and ensure it's representative
    const sampleSize = Math.min(this.MAX_SAMPLE_SIZE, data.length);
    const sample = this.getRepresentativeSample(data, sampleSize);

    const basePrompt = `
      Dataset Profile:
      ${JSON.stringify(profile, null, 2)}

      Representative Data Sample (${sample.length} rows):
      ${JSON.stringify(sample, null, 2)}
    `;

    return customPrompt ? `${basePrompt}\n\nAdditional context: ${customPrompt}` : basePrompt;
  }

  private getRepresentativeSample(data: any[], size: number): any[] {
    if (data.length <= size) return data;

    // Take evenly spaced samples to ensure coverage
    const step = Math.floor(data.length / size);
    const sample = [];
    for (let i = 0; i < size; i++) {
      sample.push(data[i * step]);
    }
    return sample;
  }

  private createAnalysisWindows(data: any[]): any[][] {
    const windows: any[][] = [];
    const windowSize = Math.ceil(data.length / Math.ceil(data.length / this.MAX_SAMPLE_SIZE));

    for (let i = 0; i < data.length; i += windowSize) {
      const window = data.slice(i, i + windowSize);
      if (window.length > 0) {
        windows.push(window);
      }
    }

    return windows;
  }

  private mergeInsights(results: DetectiveAnalysis[]): any[] {
    const allInsights = results.flatMap((result) => result.insights);
    
    // Remove duplicate insights based on description
    const uniqueInsights = Array.from(
      new Map(allInsights.map((insight) => [insight.description, insight])).values()
    );

    // Sort by confidence
    return uniqueInsights.sort((a, b) => b.confidence - a.confidence);
  }

  private parseResponse(response: string): any[] {
    try {
      const parsed = JSON.parse(response);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format');
      }

      // Handle both direct array and object with insights property
      const insights = Array.isArray(parsed) ? parsed : parsed.insights;

      if (!Array.isArray(insights)) {
        throw new Error('Response must contain an array of insights');
      }

      // Validate each insight
      insights.forEach((insight, index) => {
        if (!insight.type || !insight.description || typeof insight.confidence !== 'number') {
          throw new Error(`Invalid insight at index ${index}: missing required fields`);
        }
        if (!insight.supportingData?.evidence || !insight.supportingData?.statistics) {
          throw new Error(`Invalid insight at index ${index}: missing supporting data`);
        }
      });

      return insights;
    } catch (error) {
      logger.error('Error parsing detective response:', error);
      throw new AppError(500, 'Invalid response format from OpenAI');
    }
  }
}
