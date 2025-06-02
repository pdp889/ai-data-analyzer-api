import { logger } from '@/utils/logger';
import { FunctionTool } from 'openai-agents-js';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: string;
}

export function createConversationTool(conversationHistory: ConversationMessage[]) {
  return new FunctionTool({
    name: 'get_conversation_history',
    description: 'Access previous conversation messages for context',
    params_json_schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of recent messages to retrieve (default: 5)',
          minimum: 1,
          maximum: 20,
        },
        messageType: {
          type: 'string',
          enum: ['all', 'user', 'assistant'],
          description: 'Filter by message type',
        },
      },
      required: ['count', 'messageType'],
    },
    on_invoke_tool: async ({ input }) => {
      logger.info('get_conversation_history tool called');
      try {
        const params = typeof input === 'string' ? JSON.parse(input) : input;
        const count = params.count || 5;
        const messageType = params.messageType || 'all';

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

        return JSON.stringify({
          messages: recentMessages,
          totalCount: conversationHistory.length,
          retrievedCount: recentMessages.length,
          filter: messageType,
        });
      } catch (error) {
        return JSON.stringify({
          error: `Failed to get conversation history: ${error instanceof Error ? error.message : 'Unknown error'}`,
          messages: [],
        });
      }
    },
  });
}
