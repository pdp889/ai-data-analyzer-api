import express from 'express';
import multer from 'multer';
import { AppError } from '../middleware/errorHandler';
import { AnalysisService } from '@/services/analysis.service';

const router = express.Router();

// Enhanced security configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // Default to 5MB if not set
    files: 1, // Only allow 1 file at a time
    fieldSize: 1024, // Limit field size
  },
  fileFilter: (req, file, cb) => {
    // Validate file type more strictly
    if (file.mimetype !== 'text/csv' && !file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new AppError(400, 'Only CSV files are supported'));
    }
    
    // Validate filename for path traversal attempts
    const filename = file.originalname.toLowerCase();
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return cb(new AppError(400, 'Invalid filename detected'));
    }
    
    // Validate file size
    if (file.size > (Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024)) {
      return cb(new AppError(400, 'File size exceeds maximum allowed size'));
    }
    
    cb(null, true);
  },
});

// Input validation middleware
const validateAnalysisRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.file) {
    return next(new AppError(400, 'No file uploaded'));
  }
  
  // Additional validation for file content
  if (!req.file.buffer || req.file.buffer.length === 0) {
    return next(new AppError(400, 'Empty file uploaded'));
  }
  
  // Check for suspicious content patterns
  const content = req.file.buffer.toString('utf8');
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /data:text\/html/i, // Data URLs
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return next(new AppError(400, 'File contains suspicious content'));
    }
  }
  
  next();
};

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     tags: [Data Analysis]
 *     summary: Analyze a CSV file using multiple AI agents
 *     description: Upload a CSV file for comprehensive analysis using Profiler, Detective, and Storyteller agents. Only CSV files are supported.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to analyze (only CSV files are supported)
 *     responses:
 *       200:
 *         description: Analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       description: Dataset profile and statistics
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [correlation, trend, anomaly, pattern]
 *                           description:
 *                             type: string
 *                           confidence:
 *                             type: number
 *                           supportingData:
 *                             type: object
 *                     narrative:
 *                       type: string
 *                       description: Human-readable synthesis of the analysis
 *       400:
 *         description: Invalid input, missing file, or non-CSV file
 *       401:
 *         description: Invalid OpenAI API key
 *       429:
 *         description: OpenAI API quota or rate limit exceeded
 */
router.post('/analyze', upload.single('file'), validateAnalysisRequest, async (req, res, next) => {
  try {
    const analysis = await AnalysisService.analyzeDatasetWithAgents(req);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/analyze-default', async (req, res, next) => {
  try {
    const analysis = await AnalysisService.analyzeDefaultDataset(req);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    next(error);
  }
});

export const analysisRouter = router;
