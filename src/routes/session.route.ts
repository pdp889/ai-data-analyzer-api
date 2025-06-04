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
 *       404:
 *         description: No analysis found in session
 *       500:
 *         description: Internal server error.
 */
router.get('/existing-analysis', async (req, res) => {
  try {
    logger.info('Getting existing analysis');
    const analysisState = await SessionService.getAnalysisState(req);
    const conversationHistory = await SessionService.getConversationHistory(req);

    if (!analysisState) {
      return res.json({
        success: false,
        message: 'No analysis found in session',
      });
    }

    res.json({
      success: true,
      data: analysisState,
      conversationHistory,
    });
  } catch (error) {
    logger.error('Error getting existing analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis data',
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
router.delete('/clear-session', async (req, res) => {
  try {
    await SessionService.clearSession(req);
    res.json({
      success: true,
      message: 'Session cleared successfully',
    });
  } catch (error) {
    logger.error('Error clearing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear session',
    });
  }
});

export const sessionRouter = router;
