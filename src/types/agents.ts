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

export interface AnalysisResult {
  profile: DatasetProfile;
  insights: Insight[];
  narrative: string;
}

export interface Insight {
  type: 'correlation' | 'trend' | 'anomaly' | 'pattern';
  description: string;
  confidence: number;
  supportingData?: any;
}

export interface Agent {
  name: string;
  role: string;
  analyze(...args: any[]): Promise<any>;
}

export interface ProfilerAgent extends Agent {
  analyze(data: any[], customPrompt?: string): Promise<DatasetProfile>;
}

export interface DetectiveAgent extends Agent {
  analyze(data: any[], profile: DatasetProfile, customPrompt?: string): Promise<Insight[]>;
}

export interface StorytellerAgent extends Agent {
  analyze(profile: DatasetProfile, insights: Insight[], customPrompt?: string): Promise<string>;
} 