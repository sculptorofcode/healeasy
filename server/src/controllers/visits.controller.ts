import { Request, Response, NextFunction } from 'express';
import { visitService, CreateVisitDto, UpdateVisitDto } from '../services/visit.service';
import { generateVisitSummary } from '../services/ai.service';
import { sendSuccess, sendError, AppError } from '../utils/response';
import { visitRepository } from '../repositories/visit.repository';

export async function createVisit(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerName, contactPerson, location, visitDateTime, rawNotes, outcomeStatus, nextFollowUpDate } = req.body;

    if (!customerName || !contactPerson || !location || !visitDateTime || !rawNotes || !outcomeStatus) {
      return sendError(res, 'Missing required fields', 400);
    }

    const data: CreateVisitDto = {
      customerName,
      contactPerson,
      location,
      visitDateTime,
      rawNotes,
      outcomeStatus,
      nextFollowUpDate: nextFollowUpDate || null,
    };

    const visit = await visitService.createVisit(data, req.user!.sub);
    
    // Auto-generate AI summary on creation
    try {
      console.log('[CreateVisit] Generating AI summary...');
      const aiSummary = await generateVisitSummary(visit as any);
      const updatedVisit = await visitRepository.updateAiSummary(visit._id.toString(), aiSummary);
      console.log('[CreateVisit] ✓ AI summary generated and saved');
      sendSuccess(res, updatedVisit, 'Visit created successfully with AI summary', 201);
    } catch (aiError) {
      console.warn('[CreateVisit] AI summary generation failed, but visit was created:', aiError);
      sendSuccess(res, visit, 'Visit created (AI summary generation failed)', 201);
    }
  } catch (err) {
    next(err);
  }
}

export async function getVisits(req: Request, res: Response, next: NextFunction) {
  try {
    const visits = await visitService.getVisitsByUser(req.user!.sub);
    
    // Log aiSummary status
    visits.forEach((visit: any) => {
      const hasSummary = visit.aiSummary ? '✓' : '✗';
      console.log(`[GetVisits] Visit: ${visit.customerName} - AI Summary: ${hasSummary}`);
    });
    
    console.log(`[GetVisits] Returning ${visits.length} visits with aiSummary data`);
    sendSuccess(res, visits, 'Visits fetched successfully');
  } catch (err) {
    next(err);
  }
}

export async function getVisit(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const visit = await visitService.getVisit(id as string, req.user!.sub);
    sendSuccess(res, visit, 'Visit fetched successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateVisit(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data: UpdateVisitDto = req.body;

    // Get original visit to check if rawNotes changed
    const originalVisit = await visitRepository.findById(id as string);
    if (!originalVisit) {
      return sendError(res, 'Visit not found', 404);
    }
    if (originalVisit.userId.toString() !== req.user!.sub) {
      return sendError(res, 'Unauthorized', 403);
    }

    const visit = await visitService.updateVisit(id as string, data, req.user!.sub);

    // Auto-regenerate AI summary if rawNotes changed
    const notesChanged = data.rawNotes && data.rawNotes !== originalVisit.rawNotes;
    if (notesChanged) {
      try {
        console.log('[UpdateVisit] Raw notes changed, regenerating AI summary...');
        const aiSummary = await generateVisitSummary(visit as any);
        const updatedVisit = await visitRepository.updateAiSummary(id as string, aiSummary);
        console.log('[UpdateVisit] ✓ AI summary regenerated');
        sendSuccess(res, updatedVisit, 'Visit updated successfully with regenerated AI summary');
      } catch (aiError) {
        console.warn('[UpdateVisit] AI summary generation failed, but visit was updated:', aiError);
        sendSuccess(res, visit, 'Visit updated (AI summary regeneration failed)');
      }
    } else {
      sendSuccess(res, visit, 'Visit updated successfully');
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteVisit(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await visitService.deleteVisit(id as string, req.user!.sub);
    sendSuccess(res, { id }, 'Visit deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function generateSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    // Verify visit exists and belongs to user
    const visit = await visitRepository.findById(id as string);
    if (!visit) {
      throw new AppError('Visit not found', 404);
    }
    if (visit.userId.toString() !== userId) {
      throw new AppError('Forbidden', 403);
    }

    // Generate AI summary
    const aiSummary = await generateVisitSummary(visit as any);

    // Save to database
    const updated = await visitRepository.updateAiSummary(id as string, aiSummary);

    sendSuccess(res, updated, 'AI summary generated successfully', 200);
  } catch (err) {
    next(err);
  }
}
