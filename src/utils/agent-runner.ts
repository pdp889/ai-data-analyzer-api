// @/utils/agent-runner.ts
import { Agent, Runner } from 'openai-agents-js';
import { RunResult } from 'openai-agents-js/dist/result';
import { logger } from './logger';

interface ExtendedRunResult {
  finalOutput: any;
  finalAgent: string;
  metadata: {
    sessionId?: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    agentName: string;
    inputLength: number;
    outputLength: number;
  };
}

export async function runWithTracking(
  agent: Agent<any>, 
  message: string, 
  sessionId?: string
): Promise<ExtendedRunResult> {
  const startTime = new Date();
  const inputLength = message.length;
  
  logger.info(`🚀 [${agent.name}] Starting execution`, {
    message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    sessionId,
    timestamp: startTime.toISOString(),
    inputLength
  });
  
  try {
    const result : RunResult = await Runner.run(agent, message);
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const outputLength = JSON.stringify(result.finalOutput).length;
    
    logger.info(`✅ [${agent.name}] Completed successfully`, {
      duration: `${duration}ms`,
      outputLength,
      finalAgent: result.lastAgent?.name,
      sessionId,
      timestamp: endTime.toISOString()
    });
    
    return {
      finalOutput: result.finalOutput,
      finalAgent:  result.lastAgent?.name,
      metadata: {
        sessionId,
        startTime,
        endTime,
        duration,
        agentName: agent.name,
        inputLength,
        outputLength
      }
    };
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    logger.error(`❌ [${agent.name}] Failed after ${duration}ms`, {
      error: (error as Error).message,
      sessionId,
      timestamp: endTime.toISOString()
    });
    
    throw error;
  }
}