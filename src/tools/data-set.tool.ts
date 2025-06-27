import { logger } from '@/utils/logger';
import { tool } from '@openai/agents';
import { z } from 'zod';

const formatSchema = z.enum(['full', 'sample', 'summary']);

// Smart sampling function
function sampleDataset(
  dataset: any[],
  sampleSize: number = 50,
  method: 'stratified' | 'random' | 'systematic' = 'stratified'
) {
  if (dataset.length <= sampleSize) {
    return dataset;
  }

  switch (method) {
    case 'random':
      return dataset.sort(() => Math.random() - 0.5).slice(0, sampleSize);

    case 'systematic':
      const step = Math.floor(dataset.length / sampleSize);
      return dataset.filter((_, index) => index % step === 0).slice(0, sampleSize);

    case 'stratified':
    default:
      // Simple stratified sampling - take evenly distributed samples
      const stepSize = dataset.length / sampleSize;
      return Array.from({ length: sampleSize }, (_, i) => dataset[Math.floor(i * stepSize)]).filter(
        Boolean
      );
  }
}

export function createDatasetTool(dataset: any[]) {
  return tool({
    name: 'get_dataset',
    description:
      'Access the uploaded dataset in different formats. Use summary or sample for efficiency, full only when absolutely necessary.',
    parameters: z.object({
      format: formatSchema.describe(
        'summary: metadata only (most efficient), sample: first 10 rows, full: entire dataset (use sparingly)'
      ),
    }),
    execute: async ({ format }) => {
      logger.info(`get_dataset tool called with format: ${format}`);

      switch (format) {
        case 'full':
          logger.warn('Full dataset requested - this uses significant tokens');
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
        default:
          return {
            format: 'summary' as const,
            columns: Object.keys(dataset[0] || {}),
            rowCount: dataset.length,
            sampleData: dataset.slice(0, 3),
          };
      }
    },
  });
}

export function createSampledDatasetTool(dataset: any[], defaultSampleSize: number = 50) {
  return tool({
    name: 'get_sampled_dataset',
    description:
      'Access a representative sample of the dataset with full transparency about sampling method and coverage',
    parameters: z.object({
      sampleSize: z.number().min(10).max(200).describe('Number of rows to sample (default: 50)'),
      method: z
        .enum(['stratified', 'random', 'systematic'])
        .describe('Sampling method (default: stratified)'),
    }),
    execute: async ({ sampleSize = defaultSampleSize, method = 'stratified' }) => {
      logger.info(
        `get_sampled_dataset tool called with sampleSize: ${sampleSize}, method: ${method}`
      );

      const sampled = sampleDataset(dataset, sampleSize, method);
      const samplingPercentage = ((sampled.length / dataset.length) * 100).toFixed(1);

      return {
        data: sampled,
        totalCount: dataset.length,
        sampleSize: sampled.length,
        samplingMethod: method,
        samplingPercentage: `${samplingPercentage}%`,
        note: `This is a ${samplingPercentage}% ${method} sample of the full dataset. Use for pattern analysis but verify precise counts with full dataset if needed.`,
        columns: Object.keys(dataset[0] || {}),
        confidence: sampled.length >= 50 ? 'high' : sampled.length >= 20 ? 'medium' : 'low',
      };
    },
  });
}
