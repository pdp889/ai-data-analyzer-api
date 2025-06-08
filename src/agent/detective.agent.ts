import {  insightSchemaAgentResult } from '@/schemas/insight.schema';
import { createDatasetTool } from '@/tools/data-set.tool';
import { DatasetProfile } from '@/schemas/dataset-profile.schema';
import { createAnalysisContextTool } from '@/tools/analysis-context.tool';
import { Agent } from '@openai/agents';

const INSTRUCTIONS = `You are a data detective that finds insights in datasets. While you specialize in food safety data analysis, you can analyze any type of data effectively.

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

For food-related data, pay special attention to:
- Food safety metrics and thresholds
- Temperature and time patterns
- Microbial and chemical measurements
- Storage and processing parameters

Return an array of insights with confidence scores.`;

export function createDetectiveAgent(records: any[], profileResults: DatasetProfile) {
  const datasetTool = createDatasetTool(records);
  const analysisContextTool = createAnalysisContextTool({
    profile: profileResults,
    insights: [],
    narrative: '',
    additionalContexts: [],
  });

  return new Agent({
    name: 'The Detective Agent',
    model: 'gpt-4.1-nano',
    instructions: INSTRUCTIONS,
    tools: [datasetTool, analysisContextTool],
    outputType: insightSchemaAgentResult,
  });
}
