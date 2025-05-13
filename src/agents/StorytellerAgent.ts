import { Agent, DatasetProfile, Insight } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class StorytellerAgent implements Agent {
  name = 'The Storyteller';
  role = 'Narrative Synthesis and Report Generation';
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  private async synthesizeNarrative(profile: DatasetProfile, insights: Insight[], customPrompt?: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a data storytelling expert. Create a clear, concise narrative that synthesizes the dataset profile and insights.
            Guidelines:
            - Focus on the most significant findings and patterns
            - Use clear, professional language
            - Maintain a logical flow between insights
            - Highlight key relationships and trends
            - Aim for a concise narrative (ideally 5 sentences, but not strictly required)
            - Avoid technical jargon unless necessary
            - Ensure the narrative is self-contained and meaningful
            
            You MUST respond with a valid JSON object in this exact format:
            {
              "narrative": "string containing the synthesized narrative"
            }`
          },
          {
            role: "user",
            content: `Dataset Profile:\n${JSON.stringify(profile, null, 2)}\n\nInsights:\n${JSON.stringify(insights, null, 2)}\n\n${customPrompt || 'Create a narrative that synthesizes these findings.'}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content in OpenAI response');

      try {
        const result = JSON.parse(content);
        if (!result.narrative || typeof result.narrative !== 'string') {
          throw new Error('Invalid narrative format in response');
        }
        return result.narrative;
      } catch (error) {
        logger.error('Error parsing narrative response:', error);
        logger.error('Raw response:', content);
        throw new Error('Failed to parse narrative response');
      }
    } catch (error: any) {
      logger.error('Error in narrative synthesis:', error);
      if (error.status === 429) {
        throw new AppError(429, 'OpenAI API rate limit exceeded. Please try again later.');
      }
      if (error.status === 401) {
        throw new AppError(401, 'Invalid OpenAI API key. Please check your configuration.');
      }
      throw error;
    }
  }

  async analyze(profile: DatasetProfile, insights: Insight[], customPrompt?: string): Promise<string> {
    try {
      if (!profile || !insights.length) {
        throw new AppError(400, 'Invalid input: profile and insights are required');
      }

      logger.info('Starting narrative synthesis');
      const narrative = await this.synthesizeNarrative(profile, insights, customPrompt);
      logger.info('Narrative synthesis completed');

      return narrative;
    } catch (error: any) {
      logger.error('Error in StorytellerAgent:', error);
      
      if (error.message?.includes('insufficient_quota') || error.message?.includes('exceeded your current quota')) {
        throw new AppError(429, 'OpenAI API quota exceeded. Please check your billing details and try again later.');
      }
      
      if (error.status === 429) {
        throw new AppError(429, 'OpenAI API rate limit exceeded. Please try again later.');
      }
      
      if (error.status === 401) {
        throw new AppError(401, 'Invalid OpenAI API key. Please check your configuration.');
      }
      
      throw error;
    }
  }
} 