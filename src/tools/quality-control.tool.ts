import { FunctionTool } from 'openai-agents-js';
import qualityControlAgent from '@/agent/quality-control.agent';
import { runWithTracking } from '@/utils/agent-runner';
import { logger } from '@/utils/logger';

export function createQualityControlTool() {
  return new FunctionTool({
    name: 'quality_control',
    description: 'Evaluate the quality and accuracy of content using the quality control agent',
    params_json_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to evaluate',
        },
        question: {
          type: 'string',
          description: 'The original user question being answered',
        }
      },
      required: ['content', 'question'],
    },
    on_invoke_tool: async ({ input }) => {
      logger.info('quality_control tool called');
      try {
        const params = typeof input === 'string' ? JSON.parse(input) : input;
        
        // Call the quality control agent with the content and question
        const result = await runWithTracking(
          qualityControlAgent,
          JSON.stringify(params),
          'quality-control'
        );

        return JSON.stringify(result.finalOutput);
      } catch (error) {
        return JSON.stringify({
          error: `Failed to evaluate content: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });
} 