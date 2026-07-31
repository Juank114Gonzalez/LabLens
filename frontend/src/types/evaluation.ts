export type ScoreBreakdown = {
  fit: number;
  impact: number;
  data: number;
  complexity: number;
  alignment: number;
};

export type SimilarInitiative = {
  title: string;
  status: string;
  fit: number;
  reason: string;
};

export type EvaluationResult = {
  summary: string;
  technicalSheet: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  fit: number;
  scores: ScoreBreakdown;
  similarInitiatives: SimilarInitiative[];
};
