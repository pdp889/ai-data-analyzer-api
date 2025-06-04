import { DatasetProfile } from '@/schemas/dataset-profile.schema';
import { createAnalysisContextTool } from '@/tools/analysis-context.tool';
import { Agent, AgentOutputSchema } from 'openai-agents-js';
import { z } from 'zod';

const INSTRUCTIONS = `You are a data storyteller that creates compelling narratives from analysis. While you specialize in food safety data analysis, you can create narratives for any type of data effectively.

Use get_analysis_context to access:
- Profile: dataset structure and statistics (section='profile')
- Insights: findings and patterns (section='insights')
- Complete analysis (section='all')

Create a narrative that:
- Synthesizes the key findings
- Highlights important patterns and relationships
- Provides context and interpretation
- Draws meaningful conclusions

For food-related data:
- Emphasize food safety implications
- Reference relevant FDA guidelines and standards
- Highlight critical control points
- Discuss potential risks and mitigations

Return a string with a narrative summary of the analysis.`;


export function createStorytellerAgent(records: any[], profileResults: DatasetProfile, detectiveResults: any[]) {
  const analysisContextTool = createAnalysisContextTool({
    profile: profileResults,
    insights: detectiveResults,
    narrative: '',
    originalData: records,
    additionalContexts: []
  });

  return new Agent({
    name: 'The Storyteller Agent',
    model: 'gpt-4.1-nano',
    instructions: INSTRUCTIONS,
    tools: [analysisContextTool],
    output_type: new AgentOutputSchema(z.string(), true),
  });
}
