import { FunctionTool } from 'openai-agents-js';
import { AnalysisResult } from '@/schemas/analysis.schema';

export function createAnalysisContextTool(analysisResult: AnalysisResult) {
  return new FunctionTool({
    name: 'get_analysis_context',
    description: 'Get the current analysis context including profile, insights, and narrative',
    params_json_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['profile', 'insights', 'narrative', 'all'],
          description: 'Which section of the analysis to return',
        },
      },
      required: ['section'],
    },
    on_invoke_tool: async ({ input }) => {
      const params = typeof input === 'string' ? JSON.parse(input) : input;
      const { profile, insights, narrative, additionalContexts } = analysisResult;

      switch (params.section) {
        case 'profile':
          return JSON.stringify({
            section: 'profile',
            data: profile,
          });
        case 'insights':
          return JSON.stringify({
            section: 'insights',
            data: insights,
            count: insights?.length || 0,
          });
        case 'narrative':
          return JSON.stringify({
            section: 'narrative',
            data: narrative,
          });
        case 'all':
          return JSON.stringify({
            section: 'complete_analysis',
            data: { profile, insights, narrative, additionalContexts },
          });
        default:
          throw new Error(`Invalid section: ${params.section}`);
      }
    },
  });
}
