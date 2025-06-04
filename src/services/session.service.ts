import { ConversationMessage } from '@/tools/conversation.tool';
import { AnalysisState } from '@/schemas/analysis.schema';
import { AnalysisResult } from '@/schemas/analysis.schema';
import { createClient } from 'redis';
import { logger } from '@/utils/logger';

export class SessionService {
  private static redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  static async init(): Promise<void> {
    try {
      await this.redisClient.connect();
      logger.info('SessionService initialized with Redis connection');
    } catch (error) {
      logger.error('Failed to initialize SessionService:', error);
      throw error;
    }
  }

  static async getAnalysisState(req: any): Promise<AnalysisState | null> {
    const sessionData = await this.getSessionData(req);
    return sessionData?.analysisState || null;
  }

  static async getConversationHistory(req: any): Promise<ConversationMessage[]> {
    const sessionData = await this.getSessionData(req);
    return sessionData?.chatHistory || [];
  }

  static async getAgentResults(req: any): Promise<any> {
    const sessionData = await this.getSessionData(req);
    return sessionData?.agentResults || {};
  }

  static async saveAgentResults(req: any, agentResults: any): Promise<void> {
    const sessionData = await this.getSessionData(req);
    sessionData.agentResults = agentResults;
    await this.saveSession(req, sessionData);
  }

  static async clearAgentResults(req: any): Promise<void> {
    const sessionData = await this.getSessionData(req);
    sessionData.agentResults = {};
    await this.saveSession(req, sessionData);
  }

  static async saveAnalysisState(req: any, analysis: AnalysisResult, records: any[]): Promise<void> {
    const sessionData = await this.getSessionData(req);
    const analysisState: AnalysisState = {
      profile: analysis.profile,
      insights: analysis.insights,
      narrative: analysis.narrative,
      originalData: records,
    };
    sessionData.analysisState = analysisState;
    await this.saveSession(req, sessionData);
  }

  static async addMessageToHistory(req: any, message: ConversationMessage): Promise<void> {
    const sessionData = await this.getSessionData(req);
    const history = sessionData.chatHistory || [];
    history.push(message);
    sessionData.chatHistory = history;
    await this.saveSession(req, sessionData);
  }

  static async clearSession(req: any): Promise<void> {
    const sessionData = await this.getSessionData(req);
    sessionData.analysisState = null;
    sessionData.chatHistory = [];
    sessionData.agentResults = {};
    await this.saveSession(req, sessionData);
  }

  private static async getSessionData(req: any): Promise<any> {
    const sessionId = req.session.id;
    const sessionData = await this.redisClient.get(sessionId);
    return sessionData ? JSON.parse(sessionData) : { id: sessionId };
  }

  private static async saveSession(req: any, sessionData: any): Promise<void> {
    const sessionId = req.session.id;
    await this.redisClient.set(sessionId, JSON.stringify(sessionData));
  }
}
