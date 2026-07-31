export type InitiativeStatus = 'Aprobada' | 'En evaluación' | 'Rechazada' | 'Piloto';

export type Initiative = {
  title: string;
  status: InitiativeStatus;
  fit: number;
  reason: string;
  tags?: string[];
};

export type SimilarInitiative = Pick<Initiative, 'title' | 'status' | 'fit' | 'reason'>;
