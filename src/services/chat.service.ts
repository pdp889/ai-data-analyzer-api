import {  createChatAgent} from '@/agent/chat.agent';
import { ConversationMessage } from '@/tools/conversation.tool';
import { AnalysisState } from '@/schemas/analysis.schema';
import { SessionService } from './session.service';
import { runWithTracking } from '@/utils/agent-runner';

export class ChatService {
  static getResponse = async (question: string, existingAnalysis: AnalysisState, req: any) => {
  
    const userMessage: ConversationMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
      messageId: `msg_${Date.now()}_user`,
    };
  
    SessionService.addMessageToHistory(req, userMessage);
  
    const chatAgent = createChatAgent(existingAnalysis, await SessionService.getConversationHistory(req));
  
    const result = await runWithTracking(chatAgent, question, req.session.id);
  
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: result.finalOutput,
      timestamp: new Date(),
      messageId: `msg_${Date.now()}_assistant`,
    };
  
    SessionService.addMessageToHistory(req, assistantMessage);
  
    return result.finalOutput;
  };
}

