import {  StoryAnalysis, DatasetProfile, Insight } from '../types/data';
import { StorytellerAgent as IStorytellerAgent } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError, handleOpenAIError } from '../middleware/errorHandler';
import { STORYTELLER_AGENT_PROMPTS } from '../config/prompts';

export class StorytellerAgent implements IStorytellerAgent {
  name = 'Storyteller';
  role = 'Narrative Generator';
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyze(profile: DatasetProfile, insights: Insight[], customPrompt?: string): Promise<StoryAnalysis> {
    try {
      const prompt = this.buildPrompt(profile, insights, customPrompt);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: STORYTELLER_AGENT_PROMPTS.system
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

      const story = this.parseResponse(content);
      return story;
    } catch (error: any) {
      handleOpenAIError(error);
    }
  }

  private buildPrompt(profile: DatasetProfile, insights: Insight[], customPrompt?: string): string {
    const basePrompt = `
      Dataset Profile:
      ${JSON.stringify(profile, null, 2)}

      Key Insights:
      ${JSON.stringify(insights, null, 2)}
    `;

    return customPrompt ? `${basePrompt}\n\nAdditional context: ${customPrompt}` : basePrompt;
  }

  private parseResponse(response: string): StoryAnalysis {
    try {
      const story = JSON.parse(response);
      if (!story.narrative || !story.keyPoints || !story.conclusion) {
        throw new Error('Response must contain narrative, keyPoints, and conclusion');
      }
      return story;
    } catch (error) {
      logger.error('Error parsing storyteller response:', error);
      throw new AppError(500, 'Invalid response format from OpenAI');
    }
  }
} 