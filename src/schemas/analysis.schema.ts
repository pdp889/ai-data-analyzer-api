import { z } from 'zod';
import { datasetProfileSchema } from './dataset-profile.schema';
import { insightSchema } from './insight.schema';
import { additionalContextSchema } from './additional-context.schema';
export const analysisResultSchema = z.object({
  profile: datasetProfileSchema.describe(
    'Technical profile of the dataset including structure and basic statistics'
  ),
  insights: z
    .array(insightSchema)
    .describe(
      'Array of analytical insights discovered in the data, including correlations, trends, anomalies, and patterns'
    ),
  narrative: z
    .string()
    .describe(
      'Human-readable story that synthesizes the profile and insights into a coherent analysis narrative'
    ),
  additionalContexts: z
    .array(additionalContextSchema)
    .describe('Additional context that is relevant to the analysis'),
});

export const analysisStateSchema = analysisResultSchema.extend({
  originalData: z
    .array(z.any())
    .describe('The raw dataset that was analyzed, preserved for reference and further processing'),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalysisState = z.infer<typeof analysisStateSchema>;
