import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { ProfilerAgent } from '../agents/ProfilerAgent';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { createReadStream } from 'fs';
import { validateFile, cleanupFile } from '../middleware/fileValidation';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', 
  upload.single('file'),
  validateFile,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new AppError(500, 'OpenAI API key not configured');
      }

      // Parse CSV file
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true
      });

      // Process the file
      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('error', function(err) {
        logger.error('Error parsing CSV:', err);
        throw new AppError(400, 'Error parsing CSV file');
      });

      // Create a promise to handle the parsing completion
      const parsePromise = new Promise((resolve, reject) => {
        parser.on('end', () => resolve(records));
        parser.on('error', reject);
      });

      // Pipe the file through the parser
      createReadStream(req.file!.path).pipe(parser);

      // Wait for parsing to complete
      const parsedData = await parsePromise;

      // Initialize agents
      const profiler = new ProfilerAgent(process.env.OPENAI_API_KEY);

      // Process the data
      const profile = await profiler.analyze(parsedData);

      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },
  cleanupFile
);

export const dataAnalysisRouter = router; 