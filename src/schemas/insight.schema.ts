import { z } from 'zod';

export const insightSchema = z.object({
  type: z
    .enum(['correlation', 'trend', 'anomaly', 'pattern'])
    .describe(
      'Category of insight: correlation (relationships between variables), trend (directional changes over time), anomaly (unusual outliers), or pattern (recurring structures)'
    ),
  description: z.string().describe('Clear, human-readable explanation of the insight discovered'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0 to 1 indicating how certain we are about this insight'),
  supportingData: z
    .object({
      evidence: z.string().describe('Specific data points or examples that support this insight'),
      statistics: z
        .string()
        .describe(
          'Relevant statistical measures, calculations, or metrics that validate the insight'
        ),
    })
    .describe('Supporting information that backs up the insight claim'),
});

export const insightSchemaAgentResult = z.object({
  insights: z.array(insightSchema).describe('Collection of insights discovered through detective analysis of the dataset'),
});

export type Insight = z.infer<typeof insightSchema>;
export type InsightAgentResult = z.infer<typeof insightSchemaAgentResult>;
