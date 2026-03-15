export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type SyncStatus = 'draft' | 'syncing' | 'synced' | 'failed';

export type OutcomeStatus =
  | 'deal_closed'
  | 'follow_up_needed'
  | 'no_interest'
  | 'pending';

export interface Visit {
  id: string;                  // uuid
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: string;       // ISO 8601
  rawNotes: string;
  outcomeStatus: OutcomeStatus;
  nextFollowUpDate: string | null;  // ISO 8601, required when outcome = follow_up_needed
  aiSummary: AISummary | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AISummary {
  meetingSummary: string;
  painPoints: string[];
  actionItems: string[];
  recommendedNextStep: string;
  generatedAt: string;         // ISO 8601
}