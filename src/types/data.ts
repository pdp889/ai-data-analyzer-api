// Data structures
export interface DatasetProfile {
    columns: ColumnInfo[];
    rowCount: number;
    summary: string;
}
  
export interface ColumnInfo {
    name: string;
    type: string;
    missingValues?: number;
}
  
  // Analysis results
export interface AnalysisResult {
    profile: DatasetProfile;
    insights: Insight[];
    narrative: string;
}
  
export interface AnalysisState extends AnalysisResult {
    originalData: any[];
}
  
export interface Insight {
    type: 'correlation' | 'trend' | 'anomaly' | 'pattern';
    description: string;
    confidence: number;
    supportingData: {
        evidence: string;
        statistics: string;
    };
}
  
export interface DetectiveAnalysis {
    insights: Insight[];
}
  
export interface StoryAnalysis {
    narrative: string;
    keyPoints: string[];
    conclusion: string;
}