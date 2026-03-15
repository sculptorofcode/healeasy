import mongoose, { Schema } from 'mongoose';

export interface IVisit {
  _id: string;
  userId: mongoose.Types.ObjectId;
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: Date;
  rawNotes: string;
  outcomeStatus: 'deal_closed' | 'follow_up_needed' | 'no_interest' | 'pending';
  nextFollowUpDate: Date | null;
  aiSummary: {
    meetingSummary: string;
    painPoints: string[];
    actionItems: string[];
    recommendedNextStep: string;
    generatedAt: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    visitDateTime: {
      type: Date,
      required: true,
    },
    rawNotes: {
      type: String,
      required: true,
    },
    outcomeStatus: {
      type: String,
      enum: ['deal_closed', 'follow_up_needed', 'no_interest', 'pending'],
      required: true,
      default: 'pending',
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
    },
    aiSummary: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true },
);

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
