import { z } from 'zod';

export const additionalContextSchema = z.object({
  type: z
    .enum(['FDA', 'USDA'])
    .describe('The Agency from which the additional context is coming from'),
  date: z.string().describe('The date of the event or recall.'),
  event: z
    .string()
    .describe('A brief description of one event or recall that is relevant to the data.'),
  relevanceToData: z.string().describe('Why this event or recall is relevant to the data.'),
});

export const additionalContextSchemaAgentResult = z.object({
  contexts: z.array(additionalContextSchema),
});

export type AdditionalContext = z.infer<typeof additionalContextSchema>;

export type AdditionalContextAgentResult = z.infer<typeof additionalContextSchemaAgentResult>;