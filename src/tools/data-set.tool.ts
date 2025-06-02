import { logger } from '@/utils/logger';
import { FunctionTool } from 'openai-agents-js';

export function createDatasetTool(dataset: any[]) {
  return new FunctionTool({
    name: 'get_dataset',
    description: 'Access the uploaded dataset in different formats',
    params_json_schema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['full', 'sample', 'summary'],
          description: 'full: entire dataset, sample: first 10 rows, summary: metadata only',
        },
      },
      required: ['format'],
    },
    on_invoke_tool: async ({ input }) => {
      logger.info('get_dataset tool called');
      const params = typeof input === 'string' ? JSON.parse(input) : input;

      switch (params.format) {
        case 'full':
          return { data: dataset, count: dataset.length };
        case 'sample':
          return { data: dataset.slice(0, 10), totalCount: dataset.length };
        case 'summary':
          return {
            columns: Object.keys(dataset[0] || {}),
            rowCount: dataset.length,
            sampleData: dataset.slice(0, 3),
          };
        default:
          return { data: dataset, count: dataset.length };
      }
    },
  });
}
