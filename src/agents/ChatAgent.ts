import { ChatAgent as IChatAgent } from '../types/agents';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { AppError, handleOpenAIError } from '../middleware/errorHandler';
import { runAnalysisPipeline, AnalysisPrompts } from '../utils/analysisPipeline';
import { sanitizeText } from '../utils/textSanitizer';
import { CHAT_AGENT_PROMPTS } from '../config/prompts';
import { DatasetProfile, Insight, AnalysisState } from '../types/data';

interface AnswerEvaluation {
  needsReanalysis: boolean;
  reason?: string;
  focusAreas?: string[];
}

export class ChatAgent implements IChatAgent {
  name = 'The Chat Agent';
  role = 'Interactive Q&A and Analysis Refinement';
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async answerQuestion(analysisState: AnalysisState, question: string): Promise<string> {
    try {
      this.validateState(analysisState);

      // Generate initial answer
      const initialAnswer = await this.generateAnswer(analysisState, question);

      // Evaluate answer quality
      const evaluation = await this.evaluateAnswerQuality(question, initialAnswer);

      let currentState = analysisState;

      if (evaluation.needsReanalysis) {
        logger.info(`Answer needs improvement. Reason: ${evaluation.reason}`);
        logger.info('Focus areas for reanalysis:', evaluation.focusAreas);

        // Generate improved prompts and perform reanalysis
        const prompts = await this.generateAnalysisPrompts(question, evaluation);
        const newAnalysis = await runAnalysisPipeline(
          currentState.originalData,
          process.env.OPENAI_API_KEY!,
          prompts
        );

        // Update the analysis state with the new results
        currentState = {
          ...newAnalysis,
          originalData: currentState.originalData,
        };

        logger.info('Targeted reanalysis completed');

        // Generate final answer with the new analysis
        return await this.generateAnswer(currentState, question);
      }

      return initialAnswer;
    } catch (error: unknown) {
      handleOpenAIError(error);
    }
  }

  private async generateAnalysisPrompts(
    question: string,
    evaluation: AnswerEvaluation
  ): Promise<AnalysisPrompts> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: CHAT_AGENT_PROMPTS.system.promptGeneration,
          },
          {
            role: 'user',
            content: `Question: ${question}
            Evaluation: ${JSON.stringify(evaluation)}
            
            Generate improved analysis prompts for each agent.`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const prompts = JSON.parse(content);
      this.validatePrompts(prompts);
      return prompts;
    } catch (error: unknown) {
      logger.error('Error generating analysis prompts:', error);
      return {
        profilerPrompt: CHAT_AGENT_PROMPTS.defaultPrompts.profiler(question),
        detectivePrompt: CHAT_AGENT_PROMPTS.defaultPrompts.detective(question),
        storytellerPrompt: CHAT_AGENT_PROMPTS.defaultPrompts.storyteller(question),
      };
    }
  }

  private async evaluateAnswerQuality(question: string, answer: string): Promise<AnswerEvaluation> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: CHAT_AGENT_PROMPTS.system.qualityControl,
          },
          {
            role: 'user',
            content: `Question: ${question}\nAnswer: ${answer}\n\nEvaluate if this answer needs reanalysis with a different approach.`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const evaluation = JSON.parse(content);
      this.validateEvaluation(evaluation);
      return evaluation;
    } catch (error: unknown) {
      logger.error('Error evaluating answer quality:', error);
      return { needsReanalysis: false, reason: 'Error evaluating answer quality' };
    }
  }

  private async generateAnswer(analysisState: AnalysisState, question: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(analysisState),
          },
          {
            role: 'user',
            content: question,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const answer = response.choices[0]?.message?.content;
      if (!answer) {
        throw new Error('No content in OpenAI response');
      }

      return sanitizeText(answer);
    } catch (error: unknown) {
      return handleOpenAIError(error);
    }
  }

  private buildSystemPrompt(analysisState: AnalysisState): string {
    this.validateState(analysisState);
    return CHAT_AGENT_PROMPTS.system.base
      .replace('{profile}', JSON.stringify(analysisState.profile, null, 2))
      .replace('{insights}', JSON.stringify(analysisState.insights, null, 2));
  }

  private validateState(analysisState: AnalysisState | null): void {
    if (!analysisState) {
      throw new AppError(400, 'No analysis available. Please provide a valid analysis state.');
    }
    // Add more specific checks if needed, e.g., ensuring profile and insights exist on the passed state
    if (!analysisState.profile || !analysisState.insights) {
      throw new AppError(400, 'Invalid analysis state: profile and insights are required.');
    }
  }

  public static validateInput(profile: DatasetProfile, insights: Insight[]): void {
    if (!profile || !insights.length) {
      throw new AppError(400, 'Invalid input: profile and insights are required');
    }
  }

  private validatePrompts(prompts: any): void {
    if (!prompts.profilerPrompt || !prompts.detectivePrompt || !prompts.storytellerPrompt) {
      throw new Error('Invalid prompts structure');
    }
  }

  private validateEvaluation(evaluation: any): void {
    if (typeof evaluation.needsReanalysis !== 'boolean') {
      throw new Error('Invalid evaluation: needsReanalysis must be a boolean');
    }
    if (evaluation.reason && typeof evaluation.reason !== 'string') {
      throw new Error('Invalid evaluation: reason must be a string');
    }
    if (evaluation.focusAreas && !Array.isArray(evaluation.focusAreas)) {
      throw new Error('Invalid evaluation: focusAreas must be an array');
    }
  }
}
