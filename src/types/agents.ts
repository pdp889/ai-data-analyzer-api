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
  analyze(data: any): Promise<any>;
}

export interface DetectiveAgent extends Agent {
  investigate(data: any, profile: DatasetProfile): Promise<Insight[]>;
}

export interface StorytellerAgent extends Agent {
  synthesize(profile: DatasetProfile, insights: Insight[]): Promise<string>;
} 