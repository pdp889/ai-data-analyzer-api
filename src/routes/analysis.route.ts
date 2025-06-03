import express from 'express';
import multer from 'multer';
import { AppError } from '../middleware/errorHandler';
import { AnalysisService } from '@/services/analysis.service';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // Default to 5MB if not set
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only CSV files are supported'));
    }
  },
});

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
router.post('/analyze', upload.single('file'), async (req, res, next) => {
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

export const analysisRouter = router;
