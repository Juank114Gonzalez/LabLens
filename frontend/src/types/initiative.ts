export type InitiativeData = {
  title: string | null;
  problem: string | null;
  objective: string | null;
  businessArea: string | null;
  sponsor: string | null;
  stakeholders: string | null;
  affectedUsers: string | null;
  expectedBenefit: string | null;
  availableData: string | null;
  dependencies: string | null;
  risks: string | null;
  technologies: string | null;
  estimatedTimeline: string | null;
  additionalComments: string | null;
};

export type InitiativeDataField = keyof InitiativeData;

export type InitiativePipelineStatus =
  | 'collecting'
  | 'analyzing'
  | 'classifying'
  | 'scoring'
  | 'business_case'
  | 'completed';

export type InitiativeSummary = {
  id: string;
  conversationId: string;
  name: string;
  status: InitiativePipelineStatus;
  completion: number;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
};
