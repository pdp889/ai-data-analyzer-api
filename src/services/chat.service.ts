import { createChatAgent } from '@/agent/chat.agent';
import { ConversationMessage } from '@/tools/conversation.tool';
import { AnalysisState } from '@/schemas/analysis.schema';
import { SessionService } from './session.service';
import { run } from '@openai/agents';
import { cleanText } from '@/utils/removeBadCharacters';

export class ChatService {
  static getResponse = async (question: string, existingAnalysis: AnalysisState, req: any) => {
    const userMessage: ConversationMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
      messageId: `msg_${Date.now()}_user`,
    };

    SessionService.addMessageToHistory(req, userMessage);



    const chatAgent = await createChatAgent(
      existingAnalysis,
      await SessionService.getConversationHistory(req)
    );

    const result = await run(chatAgent, question);

    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: cleanText(result.finalOutput as string),
      timestamp: new Date(),
      messageId: `msg_${Date.now()}_assistant`,
    };

    SessionService.addMessageToHistory(req, assistantMessage);

    return result.finalOutput;
  };
}
