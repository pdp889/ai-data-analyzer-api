// Core data structures
export interface DatasetProfile {
  columns: ColumnInfo[];
  rowCount: number;
  summary: string;
  anomalies?: string[];
}

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  uniqueValues?: number;
  missingValues?: number;
  distribution?: any;
}

export interface Insight {
  type: 'correlation' | 'trend' | 'anomaly' | 'pattern';
  description: string;
  confidence: number;
  supportingData?: any;
}

// Analysis results and state
export interface AnalysisResult {
  profile: DatasetProfile;
  insights: Insight[];
  narrative: string;
}

export interface AnalysisState extends AnalysisResult {
  originalData: any[];
}

// Agent interfaces
export interface Agent {
  name: string;
  role: string;
  analyze(data: any, ...args: any[]): Promise<any>;
}

// Specialized agent interfaces
export interface ProfilerAgent extends Agent {
  analyze(data: any[], customPrompt?: string): Promise<DatasetProfile>;
}

export interface DetectiveAgent extends Agent {
  analyze(data: any[], profile: DatasetProfile, customPrompt?: string): Promise<Insight[]>;
}

export interface StorytellerAgent extends Agent {
  analyze(profile: DatasetProfile, insights: Insight[], customPrompt?: string): Promise<string>;
}

// Evaluation types
export interface AnswerEvaluation {
  needsReanalysis: boolean;
  reason?: string;
  focusAreas?: string[];
}

export interface Column {
  name: string;
  type: string;
  uniqueValues: number;
  missingValues: number;
} 