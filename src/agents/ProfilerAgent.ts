import { Agent, DatasetProfile } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';

export class ProfilerAgent implements Agent {
  name = 'The Profiler';
  role = 'Dataset Analysis and Profiling';
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyze(data: any): Promise<DatasetProfile> {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a data profiling expert. Analyze the dataset and provide detailed information about its structure, types, and potential issues."
          },
          {
            role: "user",
            content: `Please analyze this dataset and provide a detailed profile:\n${dataStr}`
          }
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content in OpenAI response');

      // Parse the response into a structured profile
      return {
        columns: [],
        rowCount: 0,
        summary: content,
        anomalies: []
      };
    } catch (error) {
      logger.error('Error in ProfilerAgent:', error);
      throw error;
    }
  }
} 