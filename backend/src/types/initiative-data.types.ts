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

export type InitiativeDataUpdates = Partial<
  Record<InitiativeDataField, string | null>
>;

export function createEmptyInitiativeData(): InitiativeData {
  return {
    title: null,
    problem: null,
    objective: null,
    businessArea: null,
    sponsor: null,
    stakeholders: null,
    affectedUsers: null,
    expectedBenefit: null,
    availableData: null,
    dependencies: null,
    risks: null,
    technologies: null,
    estimatedTimeline: null,
    additionalComments: null,
  };
}

export const INITIATIVE_DATA_FIELDS = Object.keys(
  createEmptyInitiativeData(),
) as InitiativeDataField[];
