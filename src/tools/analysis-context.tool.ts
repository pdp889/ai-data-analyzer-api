import { FunctionTool } from 'openai-agents-js';
import { AnalysisResult, AnalysisState } from '@/schemas/analysis.schema';
import { logger } from '@/utils/logger';

export function createAnalysisContextTool(analysisState: AnalysisState) {
  const { profile, insights, narrative } = analysisState;
  const analysisResult: AnalysisResult = { profile, insights, narrative };

  return new FunctionTool({
    name: 'get_analysis_context',
    description: 'Get previous analysis results for context and reference',
    params_json_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['profile', 'insights', 'narrative', 'all'],
          description:
            'profile: dataset structure, insights: findings and patterns, narrative: story summary, all: complete analysis',
        },
      },
      required: ['section'],
    },
    on_invoke_tool: async ({ input }) => {
      logger.info('get_analysis_context tool called');
      try {
        const params = typeof input === 'string' ? JSON.parse(input) : input;

        switch (params.section) {
          case 'profile':
            return JSON.stringify({
              section: 'profile',
              data: analysisResult.profile,
            });
          case 'insights':
            return JSON.stringify({
              section: 'insights',
              data: analysisResult.insights,
              count: analysisResult.insights?.length || 0,
            });
          case 'narrative':
            return JSON.stringify({
              section: 'narrative',
              data: analysisResult.narrative,
            });
          case 'all':
            return JSON.stringify({
              section: 'complete_analysis',
              data: analysisResult,
            });
          default:
            return JSON.stringify({
              section: 'all',
              data: analysisResult,
            });
        }
      } catch (error) {
        return JSON.stringify({
          error: `Failed to get analysis context: ${error instanceof Error ? error.message : 'Unknown error'}`,
          section: 'error',
        });
      }
    },
  });
}
