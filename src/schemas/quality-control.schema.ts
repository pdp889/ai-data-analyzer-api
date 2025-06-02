import { z } from 'zod';

export const qualityAssessmentSchema = z.object({
  approved: z.boolean().describe('Whether the content meets quality standards'),
  confidence: z.number().min(0).max(1).describe('Confidence in the assessment (0-1)'),
  issues: z.array(z.string()).describe('List of identified issues or problems'),
  suggestions: z.array(z.string()).describe('Specific suggestions for improvement'),
  category: z
    .enum(['analysis', 'narrative', 'insights', 'conversation'])
    .describe('Type of content being evaluated'),
  score: z.number().min(0).max(10).describe('Quality score from 0-10'),
  reasoning: z.string().describe('Explanation of the quality assessment'),
});
