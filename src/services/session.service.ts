import { ConversationMessage } from '@/tools/conversation.tool';
import { AnalysisState, AgentStatus } from '@/schemas/analysis.schema';
import { AnalysisResult } from '@/schemas/analysis.schema';
import { createClient } from 'redis';
import { logger } from '@/utils/logger';

export class SessionService {
  private static redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  // Validate session token format (UUID v4)
  private static validateSessionToken(sessionId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sessionId);
  }

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

  static async saveAnalysisState(
    req: any,
    analysis: AnalysisResult,
    records: any[]
  ): Promise<void> {
    const sessionData = await this.getSessionData(req);
    const analysisState: AnalysisState = {
      profile: analysis.profile,
      insights: analysis.insights,
      narrative: analysis.narrative,
      originalData: records,
      additionalContexts: analysis.additionalContexts,
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
    sessionData.agentStatus = null;
    await this.saveSession(req, sessionData);
  }

  static async updateAgentStatus(
    req: any,
    agent: AgentStatus['agent'],
    status: AgentStatus['status'],
    message: string
  ): Promise<void> {
    const sessionData = await this.getSessionData(req);
    const agentStatus: AgentStatus = {
      agent,
      status,
      message,
      timestamp: Date.now(),
    };
    sessionData.agentStatus = agentStatus;
    await this.saveSession(req, sessionData);
  }

  static async getAgentStatus(req: any): Promise<AgentStatus | null> {
    const sessionData = await this.getSessionData(req);
    return sessionData?.agentStatus || null;
  }

  static async clearAgentStatus(req: any): Promise<void> {
    const sessionData = await this.getSessionData(req);
    sessionData.agentStatus = null;
    await this.saveSession(req, sessionData);
  }

  private static async getSessionData(req: any): Promise<any> {
    const sessionId = req.session.id;

    // Validate session token before using it
    if (!this.validateSessionToken(sessionId)) {
      throw new Error('Invalid session token format');
    }

    const sessionData = await this.redisClient.get(sessionId);
    return sessionData ? JSON.parse(sessionData) : { id: sessionId };
  }

  private static async saveSession(req: any, sessionData: any): Promise<void> {
    const sessionId = req.session.id;

    // Validate session token before using it
    if (!this.validateSessionToken(sessionId)) {
      throw new Error('Invalid session token format');
    }

    await this.redisClient.set(sessionId, JSON.stringify(sessionData));
  }
}
