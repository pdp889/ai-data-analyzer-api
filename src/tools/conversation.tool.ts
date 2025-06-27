import { logger } from '@/utils/logger';
import { tool } from '@openai/agents';
import { z } from 'zod';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: string;
}

const messageTypeSchema = z.enum(['all', 'user', 'assistant']);

export function createConversationTool(conversationHistory: ConversationMessage[]) {
  return tool({
    name: 'get_conversation_history',
    description: 'Access previous conversation messages for context',
    parameters: z.object({
      count: z
        .number()
        .min(1)
        .max(20)
        .describe('Number of recent messages to retrieve (default: 5)'),
      messageType: messageTypeSchema.describe('Filter by message type'),
    }),
    execute: async ({ count, messageType }) => {
      logger.info('get_conversation_history tool called');
      try {
        let filteredHistory = conversationHistory;

        // Filter by message type if specified
        if (messageType !== 'all') {
          filteredHistory = conversationHistory.filter((msg) => msg.role === messageType);
        }

        // Get recent messages
        const recentMessages = filteredHistory.slice(-count).map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          messageId: msg.messageId,
        }));

        return {
          messages: recentMessages,
          totalCount: conversationHistory.length,
          retrievedCount: recentMessages.length,
          filter: messageType,
        };
      } catch (error) {
        return {
          messages: [],
          totalCount: 0,
          retrievedCount: 0,
          filter: messageType,
        };
      }
    },
  });
}
