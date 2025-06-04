import { Router } from 'express';
import { SessionService } from '@/services/session.service';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * /api/existing-analysis:
 *   get:
 *     tags: [Data Analysis]
 *     summary: Get existing analysis data from session
 *     description: Retrieves the analysis data (profile, insights, narrative) stored in the current user's session. Returns null if no analysis is found.
 *     responses:
 *       200:
 *         description: Existing analysis data or null if not found.
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
 *                   nullable: true
 *                   properties:
 *                     profile:
 *                       type: object # Or $ref to your Profile schema
 *                       description: Dataset profile and statistics.
 *                     insights:
 *                       type: array   # Or $ref to your Insights schema
 *                       items:
 *                         type: object
 *                       description: Key insights derived from the data.
 *                     narrative:
 *                       type: string
 *                       description: Human-readable synthesis of the analysis.
 *                   example:
 *                     profile: { col1: "string", col2: "number" }
 *                     insights: [ { type: "trend", description: "Sales increasing" } ]
 *                     narrative: "Overall, the data shows an upward trend in sales."
 *       500:
 *         description: Internal server error.
 */
router.get('/existing-analysis', (req, res) => {
  logger.info('Getting existing analysis');
  const analysisState = SessionService.getAnalysisState(req);
  if (!analysisState) {
    return res.status(404).json({ message: 'No analysis found in session' });
  } else {
    res.json({
      success: true,
      data: analysisState,
      conversationHistory: SessionService.getConversationHistory(req)
    });

  }
});

/**
 * @swagger
 * /api/clear-session:
 *   delete:
 *     tags: [Data Analysis]
 *     summary: Clear the current analysis session
 *     description: Removes all analysis data stored in the current user's session, including profile, insights, narrative, and original data
 *     responses:
 *       200:
 *         description: Session cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Analysis session cleared successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to clear session"
 */
router.delete('/clear-session', (req, res) => {
  SessionService.clearSession(req);
  res.json({ message: 'Session cleared successfully' });
});

export const sessionRouter = router;
