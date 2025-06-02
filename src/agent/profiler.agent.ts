import { datasetProfileSchema } from '@/schemas/dataset-profile.schema';
import { createDatasetTool } from '@/tools/data-set.tool';
import { Agent, AgentOutputSchema } from 'openai-agents-js';

const INSTRUCTIONS = `Analyze dataset structure and return DatasetProfile.
  Focus on: column types, missing values, row counts, technical summary.`;

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
