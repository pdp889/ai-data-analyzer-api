import { Agent, AgentOutputSchema } from 'openai-agents-js';
import { insightSchema } from '@/schemas/insight.schema';
import { z } from 'zod';
import { createDatasetTool } from '@/tools/data-set.tool';
import { DatasetProfile } from '@/schemas/dataset-profile.schema';
import { createAnalysisContextTool } from '@/tools/analysis-context.tool';

const INSTRUCTIONS = `You are a data detective that finds insights in datasets.

Use get_analysis_context with section='profile' to access:
- Dataset structure and column information
- Basic statistics and data types
- Missing value analysis
- Technical summary

Use get_dataset to access the actual data for detailed analysis.

Analyze the data to find:
- Correlations between variables
- Trends and patterns
- Anomalies and outliers
- Statistical relationships

Return an array of insights with confidence scores.`;

export function createDetectiveAgent(records: any[], profileResults: DatasetProfile) {
  const datasetTool = createDatasetTool(records);
  const analysisContextTool = createAnalysisContextTool({
    profile: profileResults,
    insights: [],
    narrative: '',
    originalData: records
  });
  
  return new Agent({
    name: 'The Detective Agent',
    model: 'gpt-4.1-nano',
    instructions: INSTRUCTIONS,
    tools: [datasetTool, analysisContextTool],
    output_type: new AgentOutputSchema(z.array(insightSchema), true),
  });
}