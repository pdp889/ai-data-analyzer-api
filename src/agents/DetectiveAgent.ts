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
  private readonly MAX_SAMPLE_SIZE = 20; // Increased sample size for better pattern recognition

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyze(data: any[], profile: DatasetProfile, customPrompt?: string): Promise<DetectiveAnalysis> {
    try {
      const prompt = this.buildPrompt(data, profile, customPrompt);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: DETECTIVE_AGENT_PROMPTS.system
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError(500, 'No response received from OpenAI');
      }

      const insights = this.parseResponse(content);
      return { insights };
    } catch (error: any) {
      handleOpenAIError(error);
    }
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