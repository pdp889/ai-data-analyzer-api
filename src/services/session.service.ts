import { ConversationMessage } from '@/tools/conversation.tool';
import { AnalysisState } from '@/schemas/analysis.schema';
import { AnalysisResult } from '@/schemas/analysis.schema';

export class SessionService {
  static getAnalysisState(req: any): AnalysisState | null {
    return req.session.analysisState || null;
  }

  static getConversationHistory(req: any): ConversationMessage[] {
    return req.session.chatHistory || [];
  }

  static getAgentResults(req: any): any {
    return req.session.agentResults || {};
  }

  static saveAgentResults(req: any, agentResults: any): void {
    req.session.agentResults = agentResults;
  }

  static clearAgentResults(req: any): void {
    req.session.agentResults = {};
  }

  static saveAnalysisState(req: any, analysis: AnalysisResult, records: any[]): void {
    const analysisState: AnalysisState = {
      profile: analysis.profile,
      insights: analysis.insights,
      narrative: analysis.narrative,
      originalData: records,
    };
    req.session.analysisState = analysisState;
  }

  private static saveConversationHistory(req: any, conversationHistory: ConversationMessage[]): void {
    req.session.chatHistory = conversationHistory;
  }

  static addMessageToHistory(req: any, message: ConversationMessage): void {
    const history = this.getConversationHistory(req);
    history.push(message);
    this.saveConversationHistory(req, history);
  }

  private static clearAnalysisState(req: any): void {
    req.session.analysisState = null;
  }

  private static clearConversationHistory(req: any): void {
    req.session.chatHistory = [];
  }

  static clearSession(req: any): void {
    this.clearAnalysisState(req);
    this.clearConversationHistory(req);
    this.clearAgentResults(req);
  }
}
