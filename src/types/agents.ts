import { DatasetProfile, Insight, DetectiveAnalysis, StoryAnalysis } from './data';
// Agent interfaces
export interface Agent {
  name: string;
  role: string;
}

export interface AnaylyzerAgent extends Agent {
  analyze(...args: any[]): Promise<any>;
}

// Specialized agent interfaces
export interface ProfilerAgent extends AnaylyzerAgent {
  analyze(data: any[], customPrompt?: string): Promise<DatasetProfile>;
}

export interface DetectiveAgent extends AnaylyzerAgent {
  analyze(data: any[], profile: DatasetProfile, customPrompt?: string): Promise<DetectiveAnalysis>;
}

export interface StorytellerAgent extends AnaylyzerAgent {
  analyze(profile: DatasetProfile, insights: Insight[], customPrompt?: string): Promise<StoryAnalysis>;
}

export interface ChatAgent extends Agent {
  saveState(profile: DatasetProfile, insights: Insight[], originalData: any[]): Promise<void>;
  answerQuestion(question: string): Promise<string>;
}