import { tool, run } from '@openai/agents';
import qualityControlAgent from '@/agent/quality-control.agent';
import { logger } from '@/utils/logger';
import { z } from 'zod';

export function createQualityControlTool() {
  return tool({
    name: 'quality_control',
    description: 'Evaluate the quality and accuracy of content using the quality control agent',
    parameters: z.object({
      content: z.string().describe('The content to evaluate'),
      question: z.string().describe('The original user question being answered'),
    }),
    execute: async ({ content, question }) => {
      logger.info('quality_control tool called');
      try {
        // Call the quality control agent with the content and question
        const result = await run(qualityControlAgent, JSON.stringify({ content, question }));

        return result.finalOutput;
      } catch (error) {
        return {
          approved: false,
          confidence: 0,
          issues: [
            `Failed to evaluate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ],
          suggestions: ['Please try again with different content'],
          category: 'conversation' as const,
          score: 0,
          reasoning: 'Evaluation failed due to an error',
        };
      }
    },
  });
}
