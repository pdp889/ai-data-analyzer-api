import { z } from 'zod';

export const columnInfoSchema = z.object({
  name: z.string().describe('The name/header of the column in the dataset'),
  type: z.string().describe('Data type of the column (e.g., string, number, boolean, date)'),
  missingValues: z
    .union([z.number(), z.null()])
    .describe('Count of missing/null values in this column'),
});

export const datasetProfileSchema = z.object({
  columns: z
    .array(columnInfoSchema)
    .describe('Array of column information describing the dataset structure'),
  rowCount: z.number().describe('Total number of rows/records in the dataset'),
  summary: z
    .string()
    .describe(
      'High-level summary description of the dataset contents and structure. Please include anything that might be relevant for additional context searching later.'
    ),
});

export type ColumnInfo = z.infer<typeof columnInfoSchema>;
export type DatasetProfile = z.infer<typeof datasetProfileSchema>;
