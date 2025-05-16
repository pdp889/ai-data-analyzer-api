import { DatasetProfile, ColumnInfo } from '../types/data';
import { ProfilerAgent as IProfilerAgent } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { handleOpenAIError } from '../middleware/errorHandler';
import { PROFILER_AGENT_PROMPTS } from '../config/prompts';
import { AppError } from '../middleware/errorHandler';

export class ProfilerAgent implements IProfilerAgent {
  name = 'The Profiler Agent';
  role = 'Dataset Structure and Statistics Analysis';
  private openai: OpenAI;
  private readonly MAX_SAMPLE_SIZE = 100; // Maximum rows to send to GPT at once
  private readonly MAX_ROWS = 3000; // Maximum total rows allowed
  private readonly MAX_RETRIES = 2; // Maximum number of retries for failed requests

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyze(data: any[], customPrompt?: string): Promise<DatasetProfile> {
    try {
      if (!data.length) {
        throw new Error('Empty dataset provided');
      }

      if (data.length > this.MAX_ROWS) {
        throw new AppError(
          400,
          `Dataset too large. Maximum allowed rows is ${this.MAX_ROWS}, but received ${data.length} rows.`
        );
      }

      // If dataset is small enough, analyze it directly
      if (data.length <= this.MAX_SAMPLE_SIZE) {
        const profile = await this.processDataWithRetry(data, customPrompt);
        this.validate(profile);
        return profile;
      }

      // For larger datasets, analyze in overlapping windows
      const windows = this.createAnalysisWindows(data);
      logger.info(`Analyzing ${windows.length} windows of data`);

      const results = await Promise.all(
        windows.map((window) => this.processDataWithRetry(window, customPrompt))
      );

      // Merge results from all windows
      const profile = this.mergeChunkResults(results, data.length);
      this.validate(profile);

      logger.info(`Generated profile with ${profile.columns.length} columns`);
      return profile;
    } catch (error: unknown) {
      return handleOpenAIError(error);
    }
  }

  private async processDataWithRetry(
    data: any[],
    customPrompt?: string,
    retryCount = 0
  ): Promise<DatasetProfile> {
    try {
      return await this.processData(data, customPrompt);
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        logger.warn(`Retry ${retryCount + 1}/${this.MAX_RETRIES} for data processing`);
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.processDataWithRetry(data, customPrompt, retryCount + 1);
      }
      throw error;
    }
  }

  private createAnalysisWindows(data: any[]): any[][] {
    const windows: any[][] = [];

    for (let i = 0; i < data.length; i += this.MAX_SAMPLE_SIZE) {
      const window = data.slice(i, i + this.MAX_SAMPLE_SIZE);
      if (window.length > 0) {
        windows.push(window);
      }
    }

    return windows;
  }

  private async processData(data: any[], customPrompt?: string): Promise<DatasetProfile> {
    const systemPrompt = customPrompt
      ? `${PROFILER_AGENT_PROMPTS.system}\n\nAdditional instructions: ${customPrompt}`
      : PROFILER_AGENT_PROMPTS.system;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Please analyze this data and provide a comprehensive profile in JSON format. This is a sample of ${data.length} rows:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 4000, // Increased token limit for response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const profile = JSON.parse(content);
      this.validate(profile);
      return profile;
    } catch (error) {
      logger.error('Failed to parse GPT response:', content);
      throw new AppError(500, 'Invalid response format from GPT. Please try again.');
    }
  }

  private mergeChunkResults(chunkResults: DatasetProfile[], totalRows: number): DatasetProfile {
    if (chunkResults.length === 1) {
      return chunkResults[0];
    }

    const mergedProfile: DatasetProfile = {
      columns: [],
      rowCount: totalRows, // Use actual total rows instead of summing window sizes
      summary: chunkResults[0].summary, // Keep summary from first chunk
    };

    // Merge column statistics
    const columnMap = new Map<string, ColumnInfo>();

    for (const profile of chunkResults) {
      for (const column of profile.columns) {
        const existing = columnMap.get(column.name);
        if (existing) {
          // Merge statistics
          existing.missingValues = (existing.missingValues || 0) + (column.missingValues || 0);
        } else {
          columnMap.set(column.name, {
            ...column,
            missingValues: column.missingValues || 0,
          } as ColumnInfo);
        }
      }
    }

    mergedProfile.columns = Array.from(columnMap.values()).map((col) => ({
      name: col.name,
      type: col.type,
      missingValues: col.missingValues || 0,
    }));
    return mergedProfile;
  }

  private validate(profile: DatasetProfile): void {
    // Validate profile structure
    if (!profile.columns || !Array.isArray(profile.columns)) {
      throw new Error('Invalid response format: columns is not an array');
    }

    if (typeof profile.rowCount !== 'number') {
      throw new Error('Invalid response format: rowCount is not a number');
    }

    if (typeof profile.summary !== 'string') {
      throw new Error('Invalid response format: summary is not a string');
    }

    // Validate each column
    profile.columns.forEach((column: any, index: number) => {
      if (!column.name || !column.type || typeof column.missingValues !== 'number') {
        throw new Error(`Invalid column at index ${index}: missing required fields`);
      }
    });
  }
}
