import { Agent, DatasetProfile, Insight } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { runAnalysisPipeline, AnalysisPrompts, AnalysisResult } from '../utils/analysisPipeline';

export class ChatAgent implements Agent {
  name = 'The Chat Agent';
  role = 'Interactive Q&A and Analysis Refinement';
  private openai: OpenAI;
  private analysisState: {
    profile: DatasetProfile;
    insights: Insight[];
    narrative: string;
    originalData: any[];
  } | null = null;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  private async evaluateAnswerQuality(question: string, answer: string): Promise<{
    needsReanalysis: boolean;
    reason?: string;
    focusAreas?: string[];
  }> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a quality control expert evaluating the adequacy of an answer to a data analysis question.
          Evaluate if the answer is complete, accurate, and properly supported by the available data.
          
          Consider:
          1. Does the answer directly address the question?
          2. Is the answer supported by the analysis data?
          3. Are there any gaps in the analysis that prevent a complete answer?
          4. Would additional analysis provide more valuable insights?
          
          If reanalysis is needed, identify specific areas of focus for the new analysis.
          
          Respond with a JSON object containing:
          {
            "needsReanalysis": boolean,
            "reason": "string explaining why reanalysis is needed or not",
            "focusAreas": ["array of specific areas to focus on in reanalysis"]
          }`
        },
        {
          role: "user",
          content: `Question: ${question}\nAnswer: ${answer}\n\nEvaluate if this answer needs reanalysis with a different approach.`
        }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in OpenAI response');

    try {
      return JSON.parse(content);
    } catch (error) {
      logger.error('Error parsing evaluation response:', error);
      return { needsReanalysis: false, reason: 'Error evaluating answer quality' };
    }
  }

  private async generateAnalysisPrompts(question: string, evaluation: { needsReanalysis: boolean; reason?: string; focusAreas?: string[] }): Promise<AnalysisPrompts> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert in data analysis and prompt engineering.
          Generate improved prompts for each agent in the analysis pipeline to better answer the question.
          
          Consider:
          1. The original question
          2. The evaluation feedback and focus areas
          3. The specific role of each agent:
             - ProfilerAgent: Dataset profiling and statistics
             - DetectiveAgent: Pattern discovery and insights
             - StorytellerAgent: Narrative synthesis
          
          You MUST respond with a valid JSON object in this exact format:
          {
            "profilerPrompt": "string",
            "detectivePrompt": "string",
            "storytellerPrompt": "string"
          }
          
          Each prompt should be a clear, focused string that guides the agent to better address the question.`
        },
        {
          role: "user",
          content: `Question: ${question}
          Evaluation: ${JSON.stringify(evaluation)}
          
          Generate improved analysis prompts for each agent. Remember to respond with a valid JSON object.`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in OpenAI response');

    try {
      const prompts = JSON.parse(content);
      
      // Validate the response structure
      if (!prompts.profilerPrompt || !prompts.detectivePrompt || !prompts.storytellerPrompt) {
        throw new Error('Invalid prompts structure');
      }

      return prompts;
    } catch (error) {
      logger.error('Error parsing prompts response:', error);
      logger.error('Raw response:', content);
      
      // Return default prompts if parsing fails
      return {
        profilerPrompt: `Analyze the dataset structure and statistics, focusing on aspects relevant to: ${question}`,
        detectivePrompt: `Investigate patterns and relationships in the data that could help answer: ${question}`,
        storytellerPrompt: `Create a narrative that synthesizes the analysis findings to address: ${question}`
      };
    }
  }

  async analyze(profile: DatasetProfile, insights: Insight[], originalData: any[]): Promise<void> {
    try {
      if (!profile || !insights.length) {
        throw new AppError(400, 'Invalid input: profile and insights are required');
      }

      // Store the analysis state for Q&A
      this.analysisState = {
        profile,
        insights,
        narrative: '', // Will be set by StorytellerAgent
        originalData
      };

      logger.info('Analysis state stored for Q&A');
    } catch (error: any) {
      logger.error('Error in ChatAgent:', error);
      throw error;
    }
  }

  async answerQuestion(question: string): Promise<string> {
    try {
      if (!this.analysisState) {
        throw new AppError(400, 'No analysis available. Please run an analysis first.');
      }

      let currentAnswer = '';

      // First attempt to answer the question
      const context = {
        datasetProfile: {
          rowCount: this.analysisState.profile.rowCount,
          columns: this.analysisState.profile.columns.map(col => ({
            name: col.name,
            type: col.type,
            uniqueValues: col.uniqueValues,
            missingValues: col.missingValues
          })),
          summary: this.analysisState.profile.summary,
          anomalies: this.analysisState.profile.anomalies
        },
        insights: this.analysisState.insights.map(insight => ({
          type: insight.type,
          description: insight.description,
          confidence: insight.confidence,
          evidence: insight.supportingData?.evidence
        })),
        narrative: this.analysisState.narrative
      };

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional data analyst answering questions about a data analysis report.
            Guidelines:
            - Provide clear, concise answers based on the available analysis
            - Use a professional, objective tone
            - If the question cannot be answered from the available data, say so
            - Focus on factual information from the analysis
            - Avoid speculation beyond what the data shows
            - Use precise, technical language where appropriate
            - Maintain a formal business writing style`
          },
          {
            role: "user",
            content: `Context of the analysis:\n${JSON.stringify(context, null, 2)}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content in OpenAI response');

      currentAnswer = content
        .replace(/[#*_`]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\n\s*\n/g, '\n\n');

      // Evaluate the answer quality once
      const evaluation = await this.evaluateAnswerQuality(question, currentAnswer);
      
      if (evaluation.needsReanalysis) {
        logger.info(`Answer needs improvement. Reason: ${evaluation.reason}`);
        logger.info('Focus areas for reanalysis:', evaluation.focusAreas);
        
        // Generate improved prompts and perform reanalysis
        const prompts = await this.generateAnalysisPrompts(question, evaluation);
        const newAnalysis = await runAnalysisPipeline(
          this.analysisState.originalData,
          process.env.OPENAI_API_KEY!,
          prompts
        );
        
        // Update the analysis state with the new results
        this.analysisState = {
          ...newAnalysis,
          originalData: this.analysisState.originalData
        };
        
        logger.info('Targeted reanalysis completed');

        // Generate final answer with the new analysis
        const finalResponse = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a professional data analyst answering questions about a data analysis report.
              Guidelines:
              - Provide clear, concise answers based on the available analysis
              - Use a professional, objective tone
              - If the question cannot be answered from the available data, say so
              - Focus on factual information from the analysis
              - Avoid speculation beyond what the data shows
              - Use precise, technical language where appropriate
              - Maintain a formal business writing style`
            },
            {
              role: "user",
              content: `Context of the analysis:\n${JSON.stringify({
                datasetProfile: {
                  rowCount: newAnalysis.profile.rowCount,
                  columns: newAnalysis.profile.columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    uniqueValues: col.uniqueValues,
                    missingValues: col.missingValues
                  })),
                  summary: newAnalysis.profile.summary,
                  anomalies: newAnalysis.profile.anomalies
                },
                insights: newAnalysis.insights.map(insight => ({
                  type: insight.type,
                  description: insight.description,
                  confidence: insight.confidence,
                  evidence: insight.supportingData?.evidence
                })),
                narrative: newAnalysis.narrative
              }, null, 2)}\n\nQuestion: ${question}`
            }
          ],
          temperature: 0.3,
        });

        const finalContent = finalResponse.choices[0].message.content;
        if (!finalContent) throw new Error('No content in OpenAI response');

        currentAnswer = finalContent
          .replace(/[#*_`]/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s+|\s+$/g, '')
          .replace(/\n\s*\n/g, '\n\n');
      }

      return currentAnswer;
    } catch (error: any) {
      logger.error('Error in ChatAgent Q&A:', error);
      
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