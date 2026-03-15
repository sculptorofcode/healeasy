import { visitRepository } from '../repositories/visit.repository';
import { IVisit } from '../models/Visit';
import { AppError } from '../utils/response';

export interface CreateVisitDto {
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: string;
  rawNotes: string;
  outcomeStatus: 'deal_closed' | 'follow_up_needed' | 'no_interest' | 'pending';
  nextFollowUpDate: string | null;
}

export interface UpdateVisitDto extends Partial<CreateVisitDto> {}

export const visitService = {
  async getVisitsByUser(userId: string): Promise<IVisit[]> {
    return visitRepository.findByUserId(userId);
  },

  async getVisit(visitId: string, userId: string): Promise<IVisit> {
    const visit = await visitRepository.findById(visitId);
    if (!visit) {
      throw new AppError('Visit not found', 404);
    }
    if (visit.userId.toString() !== userId) {
      throw new AppError('Unauthorized', 403);
    }
    return visit as any;
  },

  async createVisit(data: CreateVisitDto, userId: string): Promise<IVisit> {
    // Validate follow-up date requirement
    if (data.outcomeStatus === 'follow_up_needed' && !data.nextFollowUpDate) {
      throw new AppError(
        'Follow-up date is required when outcome is "follow-up needed"',
        400,
      );
    }

    const visitData: Partial<IVisit> = {
      userId: userId as any,
      customerName: data.customerName,
      contactPerson: data.contactPerson,
      location: data.location,
      visitDateTime: new Date(data.visitDateTime),
      rawNotes: data.rawNotes,
      outcomeStatus: data.outcomeStatus,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
    };

    return visitRepository.create(visitData);
  },

  async updateVisit(visitId: string, data: UpdateVisitDto, userId: string): Promise<IVisit> {
    // Verify ownership
    const visit = await this.getVisit(visitId, userId);

    // Validate follow-up date requirement
    const outcomeStatus = data.outcomeStatus || visit.outcomeStatus;
    if (outcomeStatus === 'follow_up_needed' && !data.nextFollowUpDate) {
      throw new AppError(
        'Follow-up date is required when outcome is "follow-up needed"',
        400,
      );
    }

    const updateData: Partial<IVisit> = {
      customerName: data.customerName,
      contactPerson: data.contactPerson,
      location: data.location,
      visitDateTime: data.visitDateTime ? new Date(data.visitDateTime) : undefined,
      rawNotes: data.rawNotes,
      outcomeStatus: data.outcomeStatus,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key as keyof IVisit] === undefined && delete updateData[key as keyof IVisit],
    );

    const updated = await visitRepository.update(visitId, updateData);
    if (!updated) {
      throw new AppError('Failed to update visit', 500);
    }

    return updated as any;
  },

  async deleteVisit(visitId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.getVisit(visitId, userId);

    const deleted = await visitRepository.delete(visitId);
    if (!deleted) {
      throw new AppError('Failed to delete visit', 500);
    }
  },
};
