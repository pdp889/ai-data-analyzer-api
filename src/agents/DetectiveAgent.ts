import { Agent, DatasetProfile, Insight } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class DetectiveAgent implements Agent {
  name = 'The Data Detective';
  role = 'Deep Data Analysis and Pattern Discovery';
  private readonly MAX_SAMPLE_SIZE = 100; // Increased sample size for better pattern recognition
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  private sampleData(data: any[]): any[] {
    if (data.length <= this.MAX_SAMPLE_SIZE) {
      return data;
    }

    // For time-series data, we want to preserve the temporal patterns
    const hasDateColumn = data[0] && Object.keys(data[0]).some(key => 
      typeof data[0][key] === 'string' && !isNaN(Date.parse(data[0][key]))
    );

    if (hasDateColumn) {
      // For time-series data, use systematic sampling to preserve patterns
      const step = Math.floor(data.length / this.MAX_SAMPLE_SIZE);
      return data.filter((_, index) => index % step === 0);
    }

    // For non-time-series data, use stratified sampling
    // Get first and last few rows to preserve boundaries
    const firstRows = data.slice(0, Math.floor(this.MAX_SAMPLE_SIZE * 0.2));
    const lastRows = data.slice(-Math.floor(this.MAX_SAMPLE_SIZE * 0.2));
    
    // For the middle section, use systematic sampling
    const middleRows = data.slice(
      Math.floor(this.MAX_SAMPLE_SIZE * 0.2),
      -Math.floor(this.MAX_SAMPLE_SIZE * 0.2)
    );
    
    const step = Math.floor(middleRows.length / (this.MAX_SAMPLE_SIZE - firstRows.length - lastRows.length));
    const sampledMiddleRows = middleRows.filter((_, index) => index % step === 0);
    
    return [...firstRows, ...sampledMiddleRows, ...lastRows];
  }

  private async investigatePatterns(data: any[], profile: DatasetProfile, customPrompt?: string): Promise<Insight[]> {
    try {
      // Create a comprehensive data summary
      const dataSummary = {
        sampleSize: data.length,
        columns: profile.columns.map(col => ({
          name: col.name,
          type: col.type,
          uniqueValues: col.uniqueValues,
          missingValues: col.missingValues,
          // Add distribution information if available
          distribution: col.distribution
        })),
        sampleData: this.sampleData(data),
        // Add metadata about the sampling
        samplingInfo: {
          totalRows: data.length,
          sampledRows: this.sampleData(data).length,
          samplingMethod: 'stratified'
        },
        summary: profile.summary
      };

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: customPrompt || `You are a data detective analyzing patterns and relationships in a dataset.
            Your task is to identify meaningful insights about the data.
            
            Important: The data you receive is a stratified sample of the original dataset. Consider this when making observations about patterns or gaps.
            
            You MUST respond with a valid JSON object in this exact format:
            {
              "insights": [
                {
                  "type": "correlation|trend|anomaly|pattern",
                  "description": "Clear description of the insight",
                  "confidence": number between 0 and 1,
                  "supportingData": {
                    "evidence": "Specific data points or patterns that support this insight"
                  }
                }
              ]
            }
            
            Guidelines:
            - Focus on significant patterns and relationships
            - Provide clear, specific descriptions
            - Include supporting evidence
            - Assign appropriate confidence levels
            - Generate at least 5-7 insights
            - Look for both obvious and subtle patterns
            - Consider relationships between different columns
            - Identify any anomalies or outliers
            - Note any trends or correlations
            
            When analyzing time-series data or looking for gaps:
            1. Consider that the data is sampled systematically
            2. Verify patterns against the sampling information
            3. Be cautious about inferring gaps that might be sampling artifacts
            
            Remember: Your response MUST be a valid JSON object with an "insights" array containing the insights. The response format must be valid JSON.`
          },
          {
            role: "user",
            content: `Please analyze this dataset and provide detailed insights. Note that this is a stratified sample of the data. Your response must be a valid JSON object with an "insights" array containing the insights:\n${JSON.stringify(dataSummary, null, 2)}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        logger.error('No content in OpenAI response');
        throw new Error('No content in OpenAI response');
      }

      try {
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object') {
          logger.error('Invalid response format: not an object', { content });
          throw new Error('Invalid response format: not an object');
        }
        
        const insights = parsed.insights;
        if (!insights || !Array.isArray(insights)) {
          logger.error('Invalid response format: insights is not an array', { content });
          throw new Error('Invalid response format: insights is not an array');
        }

        // Validate each insight
        const validInsights = insights.filter(insight => {
          const isValid = (
            insight &&
            typeof insight === 'object' &&
            ['correlation', 'trend', 'anomaly', 'pattern'].includes(insight.type) &&
            typeof insight.description === 'string' &&
            typeof insight.confidence === 'number' &&
            insight.confidence >= 0 &&
            insight.confidence <= 1 &&
            insight.supportingData &&
            typeof insight.supportingData.evidence === 'string'
          );

          if (!isValid) {
            logger.warn('Invalid insight found:', insight);
          }

          return isValid;
        });

        if (validInsights.length === 0) {
          logger.warn('No valid insights found in response', { content });
          // Generate a default insight if no valid insights were found
          return [{
            type: 'pattern',
            description: 'Initial analysis of the dataset structure and content',
            confidence: 0.8,
            supportingData: {
              evidence: `Dataset contains ${data.length} rows with ${profile.columns.length} columns`
            }
          }];
        }

        logger.info(`Successfully parsed ${validInsights.length} insights from response`);
        return validInsights;
      } catch (error) {
        logger.error('Error parsing insights:', error);
        logger.error('Raw response:', content);
        
        // Return a default insight if parsing fails
        return [{
          type: 'pattern',
          description: 'Initial analysis of the dataset structure and content',
          confidence: 0.8,
          supportingData: {
            evidence: `Dataset contains ${data.length} rows with ${profile.columns.length} columns`
          }
        }];
      }
    } catch (error: any) {
      logger.error('Error in investigatePatterns:', error);
      throw error;
    }
  }

  async analyze(data: any[], profile: DatasetProfile, customPrompt?: string): Promise<Insight[]> {
    try {
      if (!data.length) {
        throw new AppError(400, 'Empty dataset provided');
      }

      if (!profile) {
        throw new AppError(400, 'Dataset profile is required');
      }

      // Sample the data for analysis
      const sampledData = this.sampleData(data);
      logger.info(`Sampled ${sampledData.length} rows from ${data.length} total rows`);

      // Investigate patterns in the sampled data
      const insights = await this.investigatePatterns(sampledData, profile, customPrompt);
      logger.info(`Generated ${insights.length} insights`);

      return insights;
    } catch (error: any) {
      logger.error('Error in DetectiveAgent:', error);
      
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