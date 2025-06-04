import { datasetProfileSchema } from '@/schemas/dataset-profile.schema';
import { createDatasetTool } from '@/tools/data-set.tool';
import { Agent, AgentOutputSchema } from 'openai-agents-js';

const INSTRUCTIONS = `Analyze dataset structure and return DatasetProfile. While specializing in food safety data analysis, you can profile any type of data effectively.

Focus on:
- Column types and data formats
- Missing values and data quality
- Row counts and dataset size
- Technical summary and statistics

For food-related data, pay special attention to:
- Food safety specific metrics
- Temperature and time measurements
- Microbial and chemical parameters
- Storage and processing variables`;

export function createProfilerAgent(records: any[]) {
  const datasetTool = createDatasetTool(records);
  
  return new Agent({
    name: 'The Profiler Agent',
    model: 'gpt-4.1-nano',
    instructions: INSTRUCTIONS,
    tools: [datasetTool],
    output_type: new AgentOutputSchema(datasetProfileSchema, true),
  });
}
