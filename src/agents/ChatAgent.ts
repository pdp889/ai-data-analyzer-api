import { Agent, DatasetProfile, Insight, AnswerEvaluation, AnalysisState } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { runAnalysisPipeline, AnalysisPrompts } from '../utils/analysisPipeline';
import { sanitizeText } from '../utils/textSanitizer';
import { handleOpenAIError } from '../utils/errorHandler';
import { CHAT_AGENT_PROMPTS } from '../config/prompts';

export class ChatAgent implements Agent {
  name = 'The Chat Agent';
  role = 'Interactive Q&A and Analysis Refinement';
  private openai: OpenAI;
  private analysisState: AnalysisState | null = null;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyze(profile: DatasetProfile, insights: Insight[], originalData: any[]): Promise<void> {
    if (!profile || !insights.length) {
      throw new AppError(400, 'Invalid input: profile and insights are required');
    }

    this.analysisState = {
      profile,
      insights,
      narrative: '', 
      originalData
    };

    logger.info('Analysis state stored for Q&A');
  }

  async answerQuestion(question: string): Promise<string> {
    try {
      if (!this.analysisState) {
        throw new AppError(400, 'No analysis available. Please run an analysis first.');
      }

      // Generate initial answer
      const initialAnswer = await this.generateAnswer(question);

      // Evaluate answer quality
      const evaluation = await this.evaluateAnswerQuality(question, initialAnswer);
      
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
        return await this.generateAnswer(question);
      }

      return initialAnswer;
    } catch (error) {
      return handleOpenAIError(error);
    }
  }

  private async generateAnalysisPrompts(
    question: string, 
    evaluation: AnswerEvaluation
  ): Promise<AnalysisPrompts> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: CHAT_AGENT_PROMPTS.system.promptGeneration
          },
          {
            role: "user",
            content: `Question: ${question}
            Evaluation: ${JSON.stringify(evaluation)}
            
            Generate improved analysis prompts for each agent.`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content in OpenAI response');

      const prompts = JSON.parse(content);
      
      if (!prompts.profilerPrompt || !prompts.detectivePrompt || !prompts.storytellerPrompt) {
        throw new Error('Invalid prompts structure');
      }

      return prompts;
    } catch (error) {
      logger.error('Error generating analysis prompts:', error);
      return {
        profilerPrompt: CHAT_AGENT_PROMPTS.defaultPrompts.profiler(question),
        detectivePrompt: CHAT_AGENT_PROMPTS.defaultPrompts.detective(question),
        storytellerPrompt: CHAT_AGENT_PROMPTS.defaultPrompts.storyteller(question)
      };
    }
  }

  private async evaluateAnswerQuality(
    question: string, 
    answer: string
  ): Promise<AnswerEvaluation> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: CHAT_AGENT_PROMPTS.system.qualityControl
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

      return JSON.parse(content);
    } catch (error) {
      logger.error('Error evaluating answer quality:', error);
      return { needsReanalysis: false, reason: 'Error evaluating answer quality' };
    }
  }

  private async generateAnswer(question: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt()
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const answer = response.choices[0]?.message?.content;
      if (!answer) {
        throw new Error('No content in OpenAI response');
      }

      return sanitizeText(answer);
    } catch (error) {
      return handleOpenAIError(error);
    }
  }

  private buildSystemPrompt(): string {
    if (!this.analysisState) {
      throw new AppError(400, 'No analysis available. Please run an analysis first.');
    }

    return CHAT_AGENT_PROMPTS.system.base
      .replace('{profile}', JSON.stringify(this.analysisState.profile, null, 2))
      .replace('{insights}', JSON.stringify(this.analysisState.insights, null, 2));
  }
} 