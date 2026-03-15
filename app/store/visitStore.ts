import { create } from 'zustand';
import { db } from '../db/client';
import { Visit, SyncStatus } from '../types';
import { apiPost, apiPut, apiGet } from '../services/apiClient';
import { ApiResponse } from '../types';

// Simple ID generator
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface VisitStore {
  visits: Visit[];
  isSyncing: boolean;
  loadVisits: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  createVisit: (data: Omit<Visit, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVisit: (id: string, data: Partial<Visit>) => Promise<void>;
  syncAll: () => Promise<void>;
  retrySyncForVisit: (id: string) => Promise<void>;
}

export const useVisitStore = create<VisitStore>((set, get) => ({
  visits: [],
  isSyncing: false,

  loadVisits: () => {
    return new Promise((resolve, reject) => {
      try {
        const results = db.getAllSync('SELECT * FROM visits ORDER BY visit_date_time DESC');
        const visitsData = results
          .map((row: any) => ({
            id: row.id,
            customerName: row.customer_name,
            contactPerson: row.contact_person,
            location: row.location,
            visitDateTime: row.visit_date_time,
            rawNotes: row.raw_notes,
            outcomeStatus: row.outcome_status as Visit['outcomeStatus'],
            nextFollowUpDate: row.next_follow_up_date,
            aiSummary: row.ai_summary ? JSON.parse(row.ai_summary) : null,
            syncStatus: row.sync_status as SyncStatus,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))
          .filter(v => v.id); // Filter out visits with null/undefined IDs
        console.log(`[LoadVisits] Loaded ${visitsData.length} valid visits from SQLite`);
        set({ visits: visitsData });
        resolve();
      } catch (error) {
        console.error('Load visits error:', error);
        reject(error);
      }
    });
  },

  syncFromServer: async () => {
    try {
      console.log('[SyncFromServer] Fetching visits from server...');
      const response = await apiGet<any[]>('/visits');
      
      if (!response.success || !response.data) {
        console.warn('[SyncFromServer] No data from server');
        return;
      }

      // Map MongoDB documents: _id → id
      const serverVisits: Visit[] = response.data.map((doc: any) => ({
        id: doc._id || doc.id,  // MongoDB returns _id, fallback to id if present
        customerName: doc.customerName,
        contactPerson: doc.contactPerson,
        location: doc.location,
        visitDateTime: doc.visitDateTime,
        rawNotes: doc.rawNotes,
        outcomeStatus: doc.outcomeStatus,
        nextFollowUpDate: doc.nextFollowUpDate || null,
        aiSummary: doc.aiSummary || null,
        syncStatus: 'synced' as SyncStatus,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
      
      // Log aiSummary status for each visit
      serverVisits.forEach(v => {
        const hasSummary = v.aiSummary ? '✓' : '✗';
        console.log(`[SyncFromServer] Visit: ${v.customerName} - AI Summary: ${hasSummary}`);
      });
      
      console.log(`[SyncFromServer] Received ${serverVisits.length} visits from server with IDs:`, serverVisits.map(v => v.id));

      // Get current local visits
      const currentVisits = get().visits;

      // Merge strategy:
      // 1. For each server visit: if local version is 'draft' or 'failed', keep local; otherwise use server
      // 2. Remove local visits that don't exist on server (unless they're draft/failed)
      const mergedVisits = serverVisits.map(serverVisit => {
        const localVisit = currentVisits.find(v => v.id === serverVisit.id);
        
        // If we have a local version that hasn't been synced yet, keep it
        if (localVisit && (localVisit.syncStatus === 'draft' || localVisit.syncStatus === 'failed')) {
          console.log(`[SyncFromServer] Keeping local unsync'd version of ${serverVisit.id}`);
          return localVisit;
        }

        // Otherwise use the server version (mark as synced)
        return { ...serverVisit, syncStatus: 'synced' as SyncStatus };
      });

      // Add any local visits that are draft/failed and not on server yet
      const draftVisits = currentVisits.filter(
        v => (v.syncStatus === 'draft' || v.syncStatus === 'failed') &&
        !serverVisits.find(sv => sv.id === v.id)
      );

      const finalVisits = [...mergedVisits, ...draftVisits];
      
      // Update SQLite with merged data
      for (const visit of finalVisits) {
        const existsLocally = db.getAllSync(
          'SELECT id FROM visits WHERE id = ?',
          [visit.id]
        ).length > 0;

        if (existsLocally) {
          // Update existing
          db.runSync(
            `UPDATE visits SET customer_name = ?, contact_person = ?, location = ?, visit_date_time = ?, 
             raw_notes = ?, outcome_status = ?, next_follow_up_date = ?, ai_summary = ?, sync_status = ?, updated_at = ?
             WHERE id = ?`,
            [
              visit.customerName,
              visit.contactPerson,
              visit.location,
              visit.visitDateTime,
              visit.rawNotes,
              visit.outcomeStatus,
              visit.nextFollowUpDate || null,
              visit.aiSummary ? JSON.stringify(visit.aiSummary) : null,
              visit.syncStatus,
              visit.updatedAt,
              visit.id,
            ]
          );
        } else {
          // Insert new
          db.runSync(
            `INSERT OR REPLACE INTO visits (id, customer_name, contact_person, location, visit_date_time, raw_notes, outcome_status, next_follow_up_date, ai_summary, sync_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              visit.id,
              visit.customerName,
              visit.contactPerson,
              visit.location,
              visit.visitDateTime,
              visit.rawNotes,
              visit.outcomeStatus,
              visit.nextFollowUpDate || null,
              visit.aiSummary ? JSON.stringify(visit.aiSummary) : null,
              visit.syncStatus,
              visit.createdAt,
              visit.updatedAt,
            ]
          );
        }
      }

      // Delete visits that were synced but no longer exist on server
      const currentLocalVisits = get().visits;
      for (const localVisit of currentLocalVisits) {
        // Only delete if it's synced and not in the final merged list
        if (localVisit.syncStatus === 'synced' && !finalVisits.find(v => v.id === localVisit.id)) {
          console.log(`[SyncFromServer] Deleting visit no longer on server: ${localVisit.id}`);
          db.runSync('DELETE FROM visits WHERE id = ?', [localVisit.id]);
        }
      }

      // Update Zustand store
      set({ visits: finalVisits });
      console.log(`[SyncFromServer] ✓ Synced ${finalVisits.length} visits from server`);
      console.log('[SyncFromServer] Store state updated, current visits:', finalVisits.map(v => v.customerName));
    } catch (error) {
      console.error('[SyncFromServer] Error syncing from server:', error);
      // Don't reject - allow app to work offline
    }
  },

  createVisit: (data) => {
    return new Promise((resolve, reject) => {
      try {
        const now = new Date().toISOString();
        const newVisit = {
          id: generateId(),
          ...data,
          syncStatus: 'draft' as SyncStatus,
          createdAt: now,
          updatedAt: now,
        };

        db.runSync(
          `INSERT INTO visits (id, customer_name, contact_person, location, visit_date_time, raw_notes, outcome_status, next_follow_up_date, ai_summary, sync_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newVisit.id,
            newVisit.customerName,
            newVisit.contactPerson,
            newVisit.location,
            newVisit.visitDateTime,
            newVisit.rawNotes,
            newVisit.outcomeStatus,
            newVisit.nextFollowUpDate,
            newVisit.aiSummary ? JSON.stringify(newVisit.aiSummary) : null,
            newVisit.syncStatus,
            newVisit.createdAt,
            newVisit.updatedAt,
          ]
        );

        set(state => ({ visits: [newVisit, ...state.visits] }));
        resolve();
      } catch (error) {
        console.error('Create visit error:', error);
        reject(error);
      }
    });
  },

  updateVisit: (id, data) => {
    return new Promise((resolve, reject) => {
      try {
        // Get current visit to check sync status
        const currentVisit = get().visits.find(v => v.id === id);
        
        const updateFields: string[] = [];
        const values: any[] = [];

        // Check if user is making content changes (not including syncStatus)
        const isContentChange = !!(
          data.customerName ||
          data.contactPerson ||
          data.location ||
          data.visitDateTime ||
          data.rawNotes ||
          data.outcomeStatus ||
          data.nextFollowUpDate !== undefined ||
          data.aiSummary
        );

        // If making content changes and currently synced, mark as draft for re-sync
        let dataToApply = { ...data };
        if (isContentChange && currentVisit?.syncStatus === 'synced' && !data.syncStatus) {
          dataToApply.syncStatus = 'draft';
          console.log('[UpdateVisit] Content changed on synced visit, marking as draft for re-sync');
        }

        if (dataToApply.customerName) {
          updateFields.push('customer_name = ?');
          values.push(dataToApply.customerName);
        }
        if (dataToApply.contactPerson) {
          updateFields.push('contact_person = ?');
          values.push(dataToApply.contactPerson);
        }
        if (dataToApply.location) {
          updateFields.push('location = ?');
          values.push(dataToApply.location);
        }
        if (dataToApply.visitDateTime) {
          updateFields.push('visit_date_time = ?');
          values.push(dataToApply.visitDateTime);
        }
        if (dataToApply.rawNotes) {
          updateFields.push('raw_notes = ?');
          values.push(dataToApply.rawNotes);
        }
        if (dataToApply.outcomeStatus) {
          updateFields.push('outcome_status = ?');
          values.push(dataToApply.outcomeStatus);
        }
        if (dataToApply.nextFollowUpDate !== undefined) {
          updateFields.push('next_follow_up_date = ?');
          values.push(dataToApply.nextFollowUpDate);
        }
        if (dataToApply.aiSummary) {
          updateFields.push('ai_summary = ?');
          values.push(JSON.stringify(dataToApply.aiSummary));
        }
        if (dataToApply.syncStatus) {
          updateFields.push('sync_status = ?');
          values.push(dataToApply.syncStatus);
        }

        const updatedAt = new Date().toISOString();
        updateFields.push('updated_at = ?');
        values.push(updatedAt);
        values.push(id);

        // Always execute DB update if there are fields to update
        if (updateFields.length > 0) {
          const sql = `UPDATE visits SET ${updateFields.join(', ')} WHERE id = ?`;
          console.log('[UpdateVisit] Updating visit', id, 'with', updateFields.length, 'fields');
          db.runSync(sql, values);
          console.log('[UpdateVisit] ✓ DB update complete');

          set(state => ({
            visits: state.visits.map(visit =>
              visit.id === id ? { ...visit, ...dataToApply, updatedAt } : visit
            ),
          }));
        }
        resolve();
      } catch (error) {
        console.error('Update visit error:', error);
        reject(error);
      }
    });
  },

  syncAll: async () => {
    console.log('[SyncAll] Starting sync cycle...');
    set({ isSyncing: true });
    const pendingVisits = get().visits.filter(v => v.syncStatus === 'draft' || v.syncStatus === 'failed');
    
    console.log(`[SyncAll] Found ${pendingVisits.length} pending visits to sync`);

    if (pendingVisits.length === 0) {
      console.log('[SyncAll] No pending visits, skipping sync');
      set({ isSyncing: false });
      return;
    }

    console.log(`[SyncAll] Starting sync for ${pendingVisits.length} visits...`);

    for (const visit of pendingVisits) {
      try {
        // Step 1: Mark as syncing
        await get().updateVisit(visit.id, { syncStatus: 'syncing' });

        // Step 2: Prepare payload (all required fields)
        const payload = {
          customerName: visit.customerName,
          contactPerson: visit.contactPerson,
          location: visit.location,
          visitDateTime: visit.visitDateTime,
          rawNotes: visit.rawNotes,
          outcomeStatus: visit.outcomeStatus,
          nextFollowUpDate: visit.nextFollowUpDate || null,
        };

        // Step 3: Determine if this visit has been synced to server before
        // MongoDB ObjectIds are 24-character hex strings
        const isMongoDbId = /^[0-9a-f]{24}$/i.test(visit.id);
        let response: ApiResponse<Visit>;
        let finalVisitId = visit.id;

        if (!isMongoDbId) {
          // Local ID - this is a new visit, POST to create it
          console.log(`[Sync] Creating new visit: ${visit.customerName}`);
          response = await apiPost('/visits', payload);
          // Get the server-generated MongoDB ID and aiSummary from the response
          const serverData = response.data as any;
          const serverId = serverData?._id || serverData?.id;
          const serverAiSummary = serverData?.aiSummary || null;
          if (serverId) {
            finalVisitId = serverId;
            console.log(`[Sync] Server assigned MongoDB ID: ${finalVisitId}`);
          }
          // Update visit with aiSummary from server if available
          if (serverAiSummary) {
            console.log(`[Sync] Received AI summary from server`);
            await get().updateVisit(visit.id, { aiSummary: serverAiSummary });
          }
        } else {
          // MongoDB ID - this visit exists on server, use PUT
          console.log(`[Sync] Updating existing visit: ${visit.customerName}`);
          response = await apiPut(`/visits/${visit.id}`, payload);
          // Extract aiSummary from response if available
          const serverData = response.data as any;
          const serverAiSummary = serverData?.aiSummary || null;
          if (serverAiSummary) {
            console.log(`[Sync] Received updated AI summary from server`);
            await get().updateVisit(visit.id, { aiSummary: serverAiSummary });
          }
        }

        // Step 4: Update local record with server ID and mark as synced
        // If the visit ID changed (was local, now has server ID), update it
        if (finalVisitId !== visit.id) {
          console.log(`[Sync] Updating local ID from ${visit.id} to ${finalVisitId}`);
          
          // Fetch the current visit data
          const currentData = db.getAllSync(
            'SELECT * FROM visits WHERE id = ?',
            [visit.id]
          )[0] as any;

          if (currentData) {
            // Delete the old record
            db.runSync('DELETE FROM visits WHERE id = ?', [visit.id]);
            
            // Insert new record with the MongoDB ID
            db.runSync(
              `INSERT INTO visits (id, customer_name, contact_person, location, visit_date_time, raw_notes, outcome_status, next_follow_up_date, ai_summary, sync_status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                finalVisitId,
                currentData.customer_name,
                currentData.contact_person,
                currentData.location,
                currentData.visit_date_time,
                currentData.raw_notes,
                currentData.outcome_status,
                currentData.next_follow_up_date,
                currentData.ai_summary,
                'synced',
                currentData.created_at,
                new Date().toISOString(),
              ]
            );
          }
          
          // Update Zustand state
          set(state => ({
            visits: state.visits.map(v =>
              v.id === visit.id ? { ...v, id: finalVisitId, syncStatus: 'synced' } : v
            ),
          }));
        } else {
          // ID didn't change, just mark as synced
          await get().updateVisit(visit.id, { syncStatus: 'synced' });
        }
        
        console.log(`[Sync] ✓ Successfully synced visit: ${visit.customerName}`);
      } catch (error: any) {
        console.error(`[Sync] ✗ Failed to sync visit ${visit.id}:`, error?.message);

        // Handle token expiration
        if (error?.statusCode === 401) {
          console.error('[Sync] Authentication failed - token may be expired');
        }

        // Mark as failed
        await get().updateVisit(visit.id, { syncStatus: 'failed' });
      }
    }

    set({ isSyncing: false });
    console.log('[SyncAll] ✓ Sync cycle complete');
  },

  retrySyncForVisit: async (id: string) => {
    try {
      const visit = get().visits.find(v => v.id === id);
      if (!visit) {
        throw new Error('Visit not found');
      }

      // Mark as syncing
      await get().updateVisit(id, { syncStatus: 'syncing' });

      // Prepare payload
      const payload = {
        customerName: visit.customerName,
        contactPerson: visit.contactPerson,
        location: visit.location,
        visitDateTime: visit.visitDateTime,
        rawNotes: visit.rawNotes,
        outcomeStatus: visit.outcomeStatus,
        nextFollowUpDate: visit.nextFollowUpDate || null,
      };

      // Determine if this visit has been synced to server before
      const isMongoDbId = /^[0-9a-f]{24}$/i.test(visit.id);
      let response: ApiResponse<Visit>;
      let finalVisitId = visit.id;

      if (!isMongoDbId) {
        // Local ID - POST to create it
        response = await apiPost('/visits', payload);
        const serverData = response.data as any;
        const serverId = serverData?._id || serverData?.id;
        const serverAiSummary = serverData?.aiSummary || null;
        if (serverId) {
          finalVisitId = serverId;
          console.log(`[Retry] Server assigned MongoDB ID: ${finalVisitId}`);
        }
        // Update with aiSummary if available
        if (serverAiSummary) {
          console.log(`[Retry] Received AI summary from server`);
          await get().updateVisit(visit.id, { aiSummary: serverAiSummary });
        }
      } else {
        // MongoDB ID - use PUT
        response = await apiPut(`/visits/${id}`, payload);
        // Extract aiSummary from response if available
        const serverData = response.data as any;
        const serverAiSummary = serverData?.aiSummary || null;
        if (serverAiSummary) {
          console.log(`[Retry] Received updated AI summary from server`);
          await get().updateVisit(visit.id, { aiSummary: serverAiSummary });
        }
      }

      // Mark as synced and update ID if changed
      if (finalVisitId !== visit.id) {
        // Fetch current data
        const currentData = db.getAllSync(
          'SELECT * FROM visits WHERE id = ?',
          [visit.id]
        )[0] as any;

        if (currentData) {
          // Delete old record
          db.runSync('DELETE FROM visits WHERE id = ?', [visit.id]);
          
          // Insert with new ID
          db.runSync(
            `INSERT INTO visits (id, customer_name, contact_person, location, visit_date_time, raw_notes, outcome_status, next_follow_up_date, ai_summary, sync_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              finalVisitId,
              currentData.customer_name,
              currentData.contact_person,
              currentData.location,
              currentData.visit_date_time,
              currentData.raw_notes,
              currentData.outcome_status,
              currentData.next_follow_up_date,
              currentData.ai_summary,
              'synced',
              currentData.created_at,
              new Date().toISOString(),
            ]
          );
        }

        set(state => ({
          visits: state.visits.map(v =>
            v.id === visit.id ? { ...v, id: finalVisitId, syncStatus: 'synced' } : v
          ),
        }));
      } else {
        await get().updateVisit(id, { syncStatus: 'synced' });
      }
      console.log(`[Retry] Successfully synced visit: ${visit.customerName}`);
    } catch (error: any) {
      console.error(`[Retry] Failed to sync visit ${id}:`, error?.message);

      // Mark as failed
      await get().updateVisit(id, { syncStatus: 'failed' });

      // Re-throw so caller can show Alert
      throw error;
    }
  },
}));