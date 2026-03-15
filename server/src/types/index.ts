export interface AuthUser {
  id: string;
  email: string;
  token: string;
}

export interface CreateVisitDto {
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: string;
  rawNotes: string;
  outcomeStatus: OutcomeStatus;
  nextFollowUpDate: string | null;
}

export type OutcomeStatus =
  | 'deal_closed'
  | 'follow_up_needed'
  | 'no_interest'
  | 'pending';

export type SyncStatus = 'draft' | 'syncing' | 'synced' | 'failed';

export interface AISummary {
  meetingSummary: string;
  painPoints: string[];
  actionItems: string[];
  recommendedNextStep: string;
  generatedAt: string;
}

export interface Visit {
  id: string;
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: string;
  rawNotes: string;
  outcomeStatus: OutcomeStatus;
  nextFollowUpDate: string | null;
  aiSummary: AISummary | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}
