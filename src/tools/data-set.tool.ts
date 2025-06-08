import { logger } from '@/utils/logger';
import { tool } from '@openai/agents';
import { z } from 'zod';

const formatSchema = z.enum(['full', 'sample', 'summary']);

const responseSchema = z.discriminatedUnion('format', [
  z.object({
    format: z.literal('full'),
    data: z.array(z.any()),
    count: z.number(),
  }),
  z.object({
    format: z.literal('sample'),
    data: z.array(z.any()),
    totalCount: z.number(),
  }),
  z.object({
    format: z.literal('summary'),
    columns: z.array(z.string()),
    rowCount: z.number(),
    sampleData: z.array(z.any()),
  }),
]);

export function createDatasetTool(dataset: any[]) {
  return tool({
    name: 'get_dataset',
    description: 'Access the uploaded dataset in different formats',
    parameters: z.object({
      format: formatSchema.describe(
        'full: entire dataset, sample: first 10 rows, summary: metadata only'
      ),
    }),
    execute: async ({ format }) => {
      logger.info('get_dataset tool called');

      switch (format) {
        case 'full':
          return {
            format: 'full' as const,
            data: dataset,
            count: dataset.length,
          };
        case 'sample':
          return {
            format: 'sample' as const,
            data: dataset.slice(0, 10),
            totalCount: dataset.length,
          };
        case 'summary':
          return {
            format: 'summary' as const,
            columns: Object.keys(dataset[0] || {}),
            rowCount: dataset.length,
            sampleData: dataset.slice(0, 3),
          };
        default:
          return {
            format: 'full' as const,
            data: dataset,
            count: dataset.length,
          };
      }
    },
  });
}
