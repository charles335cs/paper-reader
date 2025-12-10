export interface PaperAnalysis {
  problemSolved: string;
  innovations: string[];
  comparisonMethods: string[];
  limitations: string[];
  summary: string;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  data: PaperAnalysis | null;
}
