import { tool } from '@openai/agents';
import { AnalysisResult } from '@/schemas/analysis.schema';
import { z } from 'zod';

const sectionSchema = z.enum(['profile', 'insights', 'narrative', 'all']);

export function createAnalysisContextTool(analysisResult: AnalysisResult) {
  return tool({
    name: 'get_analysis_context',
    description: 'Get the current analysis context including profile, insights, and narrative',
    parameters: z.object({
      section: sectionSchema,
    }),
    execute: async ({ section }) => {
      const { profile, insights, narrative, additionalContexts } = analysisResult;

      switch (section) {
        case 'profile':
          return {
            section: 'profile' as const,
            data: profile,
          };
        case 'insights':
          return {
            section: 'insights' as const,
            data: insights,
            count: insights?.length || 0,
          };
        case 'narrative':
          return {
            section: 'narrative' as const,
            data: narrative,
          };
        case 'all':
          return {
            section: 'complete_analysis' as const,
            data: { profile, insights, narrative, additionalContexts },
          };
        default:
          throw new Error(`Invalid section: ${section}`);
      }
    },
  });
}
