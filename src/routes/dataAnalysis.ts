import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { ProfilerAgent } from '../agents/ProfilerAgent';
import { DetectiveAgent } from '../agents/DetectiveAgent';
import { StorytellerAgent } from '../agents/StorytellerAgent';
import { ChatAgent } from '../agents/ChatAgent';
import { runAnalysisPipeline } from '../utils/analysisPipeline';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Store agent instances to maintain state between requests
let chatAgent: ChatAgent | null = null;

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     tags: [Data Analysis]
 *     summary: Analyze a CSV file using multiple AI agents
 *     description: Upload a CSV file for comprehensive analysis using Profiler, Detective, and Storyteller agents
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
 *                 description: CSV file to analyze
 *     responses:
 *       200:
 *         description: Analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   description: Dataset profile and statistics
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [correlation, trend, anomaly, pattern]
 *                       description:
 *                         type: string
 *                       confidence:
 *                         type: number
 *                       supportingData:
 *                         type: object
 *                 narrative:
 *                   type: string
 *                   description: Human-readable synthesis of the analysis
 *       400:
 *         description: Invalid input or missing file
 *       401:
 *         description: Invalid OpenAI API key
 *       429:
 *         description: OpenAI API quota or rate limit exceeded
 */
router.post('/analyze', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError(500, 'OpenAI API key not configured');
    }

    // Parse CSV data
    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true
    });

    if (!records.length) {
      throw new AppError(400, 'No data found in CSV file');
    }

    // Run the analysis pipeline
    const analysis = await runAnalysisPipeline(records, process.env.OPENAI_API_KEY);

    // Initialize chat agent with the analysis results
    chatAgent = new ChatAgent(process.env.OPENAI_API_KEY);
    await chatAgent.saveState(analysis.profile, analysis.insights, records);

    res.json({
      success: true,
      data: {
        profile: analysis.profile,
        insights: analysis.insights,
        narrative: analysis.narrative
      }
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ask:
 *   post:
 *     tags: [Data Analysis]
 *     summary: Ask questions about the last analysis
 *     description: Get answers to questions about the most recently analyzed dataset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: Question about the analyzed dataset
 *     responses:
 *       200:
 *         description: Answer to the question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: Professional answer based on the analysis
 *       400:
 *         description: No analysis available or invalid question
 *       401:
 *         description: Invalid OpenAI API key
 *       429:
 *         description: OpenAI API quota or rate limit exceeded
 */
router.post('/ask', async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question) {
      throw new AppError(400, 'Question is required');
    }

    if (!chatAgent) {
      throw new AppError(400, 'No analysis available. Please run an analysis first.');
    }

    const answer = await chatAgent.answerQuestion(question);

    res.json({
      success: true,
      data: { answer }
    });
  } catch (error: any) {
    next(error);
  }
});

export const dataAnalysisRouter = router; 