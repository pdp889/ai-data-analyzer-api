import express from 'express';
import { AppError } from '../middleware/errorHandler';
import { AnalysisState } from '@/schemas/analysis.schema';
import { SessionService } from '@/services/session.service';
import { ChatService } from '@/services/chat.service';
const router = express.Router();

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

    const existingAnalysis: AnalysisState | null = await SessionService.getAnalysisState(req);

    if (!existingAnalysis) {
      throw new AppError(
        400,
        'No analysis has been performed yet for this session. Please analyze a file first.'
      );
    }

    const result = await ChatService.getResponse(question, existingAnalysis, req);

    res.json({
      success: true,
      data: { answer: result },
    });
  } catch (error: any) {
    next(error);
  }
});

export const chatRouter = router;
