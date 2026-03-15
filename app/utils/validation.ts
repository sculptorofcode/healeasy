import { z } from 'zod';

export const visitFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  location: z.string().min(1, 'Location is required'),
  visitDateTime: z.string().min(1, 'Visit date/time is required'),
  rawNotes: z.string().min(10, 'Notes must be at least 10 characters'),
  outcomeStatus: z.enum(['deal_closed', 'follow_up_needed', 'no_interest', 'pending']),
  nextFollowUpDate: z.string().nullable(),
}).superRefine((data, ctx) => {
  if (data.outcomeStatus === 'follow_up_needed' && !data.nextFollowUpDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nextFollowUpDate'],
      message: 'Follow-up date is required when outcome is "Follow-up needed"',
    });
  }
});

export type VisitFormData = z.infer<typeof visitFormSchema>;