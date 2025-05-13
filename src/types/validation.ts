import { z } from 'zod';

export const fileUploadSchema = z.object({
  file: z.object({
    fieldname: z.literal('file'),
    originalname: z.string().refine(name => name.endsWith('.csv'), {
      message: 'Only CSV files are allowed'
    }),
    encoding: z.string(),
    mimetype: z.string().refine(mime => 
      ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'].includes(mime), 
      { message: 'Invalid file type. Only CSV files are allowed' }
    ),
    size: z.number().max(10 * 1024 * 1024, {  // 10MB
      message: 'File size must be less than 10MB'
    }),
    destination: z.string(),
    filename: z.string(),
    path: z.string(),
    buffer: z.any().optional()
  })
});

export type FileUpload = z.infer<typeof fileUploadSchema>; 