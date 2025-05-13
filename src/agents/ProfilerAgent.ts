import { Agent, DatasetProfile, ColumnInfo } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class ProfilerAgent implements Agent {
  name = 'The Profiler';
  role = 'Dataset Analysis and Profiling';
  private openai: OpenAI;
  private readonly MAX_CHUNK_SIZE = 100; // Reduced chunk size
  private readonly MAX_SAMPLE_SIZE = 50; // Maximum number of rows to sample per chunk
  private readonly MAX_TOKENS = 15000;
  private readonly MAX_SYNTHESIS_CHUNKS = 5; // Maximum number of chunk analyses to synthesize at once

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  private sampleData(data: any[]): any[] {
    if (data.length <= this.MAX_SAMPLE_SIZE) {
      return data;
    }
    
    // Get first and last few rows
    const firstRows = data.slice(0, Math.floor(this.MAX_SAMPLE_SIZE / 2));
    const lastRows = data.slice(-Math.floor(this.MAX_SAMPLE_SIZE / 2));
    
    // Get random middle rows
    const middleRows = data.slice(
      Math.floor(this.MAX_SAMPLE_SIZE / 2),
      -Math.floor(this.MAX_SAMPLE_SIZE / 2)
    );
    
    const randomMiddleRows = middleRows
      .sort(() => Math.random() - 0.5)
      .slice(0, this.MAX_SAMPLE_SIZE - firstRows.length - lastRows.length);
    
    return [...firstRows, ...randomMiddleRows, ...lastRows];
  }

  private chunkData(data: any[]): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < data.length; i += this.MAX_CHUNK_SIZE) {
      const chunk = data.slice(i, i + this.MAX_CHUNK_SIZE);
      // Sample the chunk to reduce token count
      chunks.push(this.sampleData(chunk));
    }
    return chunks;
  }

  private async analyzeChunk(chunk: any[], chunkIndex: number, totalChunks: number, customPrompt?: string): Promise<string> {
    // Create a more compact representation of the data
    const dataSummary = {
      sampleSize: chunk.length,
      columns: Object.keys(chunk[0] || {}),
      firstRow: chunk[0],
      lastRow: chunk[chunk.length - 1],
      sampleRows: chunk.slice(1, -1).slice(0, 3) // Include a few middle rows
    };

    const dataStr = JSON.stringify(dataSummary, null, 2);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: customPrompt || `You are a data profiling expert. Analyze this chunk (${chunkIndex + 1}/${totalChunks}) of the dataset and provide detailed information about its structure, types, and potential issues.`
        },
        {
          role: "user",
          content: `Please analyze this chunk of the dataset and provide a detailed profile. This is chunk ${chunkIndex + 1} of ${totalChunks}:\n${dataStr}`
        }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in OpenAI response');
    return content;
  }

  private async synthesizeChunkAnalyses(analyses: string[], customPrompt?: string): Promise<string> {
    // If we have too many analyses, synthesize them in groups
    if (analyses.length > this.MAX_SYNTHESIS_CHUNKS) {
      const groups: string[][] = [];
      for (let i = 0; i < analyses.length; i += this.MAX_SYNTHESIS_CHUNKS) {
        groups.push(analyses.slice(i, i + this.MAX_SYNTHESIS_CHUNKS));
      }

      // Synthesize each group
      const groupSyntheses = await Promise.all(
        groups.map((group, index) => 
          this.synthesizeChunkAnalyses(group, customPrompt)
        )
      );

      // Final synthesis of all group syntheses
      return this.synthesizeChunkAnalyses(groupSyntheses, customPrompt);
    }

    // For smaller groups, do a single synthesis
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: customPrompt || "You are a data profiling expert. Synthesize multiple chunk analyses into a comprehensive dataset profile."
        },
        {
          role: "user",
          content: `Please synthesize these ${analyses.length} chunk analyses into a comprehensive dataset profile:\n${JSON.stringify(analyses, null, 2)}`
        }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in OpenAI response');
    return content;
  }

  private inferColumnTypes(data: any[]): ColumnInfo[] {
    if (!data.length) return [];
    
    const columns = Object.keys(data[0]);
    return columns.map(name => {
      const values = data.map(row => row[name]);
      const uniqueValues = new Set(values).size;
      const missingValues = values.filter(v => v === null || v === undefined || v === '').length;
      
      // Simple type inference
      let type: ColumnInfo['type'] = 'text';
      const firstValue = values[0];
      
      if (typeof firstValue === 'number') {
        type = 'numeric';
      } else if (firstValue instanceof Date || !isNaN(Date.parse(firstValue))) {
        type = 'datetime';
      } else if (uniqueValues < values.length * 0.5) { // If less than 50% unique values
        type = 'categorical';
      }
      
      return {
        name,
        type,
        uniqueValues,
        missingValues
      };
    });
  }

  async analyze(data: any[], customPrompt?: string): Promise<DatasetProfile> {
    try {
      if (!data.length) {
        throw new AppError(400, 'Empty dataset provided');
      }

      // Split data into manageable chunks
      const chunks = this.chunkData(data);
      logger.info(`Split data into ${chunks.length} chunks for analysis`);

      // Analyze each chunk
      const chunkAnalyses = await Promise.all(
        chunks.map((chunk, index) => {
          logger.info(`Analyzing chunk ${index + 1}/${chunks.length}`);
          return this.analyzeChunk(chunk, index, chunks.length, customPrompt);
        })
      );

      // Synthesize all chunk analyses
      logger.info('Synthesizing chunk analyses');
      const finalAnalysis = await this.synthesizeChunkAnalyses(chunkAnalyses, customPrompt);
      logger.info('Final analysis done');
      logger.info(`Analysis length: ${finalAnalysis.length} characters`);

      // Infer column types
      const columns = this.inferColumnTypes(data);
      logger.info(`Inferred ${columns.length} columns:`, columns.map(c => `${c.name} (${c.type})`).join(', '));

      // Return the structured profile
      const profile: DatasetProfile = {
        columns,
        rowCount: data.length,
        summary: finalAnalysis,
        anomalies: []
      };
      
      logger.info('Profile created successfully', {
        rowCount: profile.rowCount,
        columnCount: profile.columns.length,
        summaryLength: profile.summary.length
      });

      return profile;
    } catch (error: any) {
      logger.error('Error in ProfilerAgent:', error);
      
      // Handle specific OpenAI API errors
      if (error.message?.includes('insufficient_quota') || error.message?.includes('exceeded your current quota')) {
        throw new AppError(429, 'OpenAI API quota exceeded. Please check your billing details and try again later.');
      }
      
      if (error.message?.includes('context_length_exceeded')) {
        throw new AppError(400, 'Dataset is too large to analyze. Please try with a smaller dataset or contact support for assistance.');
      }
      
      // Handle other OpenAI API errors
      if (error.status === 429) {
        throw new AppError(429, 'OpenAI API rate limit exceeded. Please try again later.');
      }
      
      if (error.status === 401) {
        throw new AppError(401, 'Invalid OpenAI API key. Please check your configuration.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }
} 