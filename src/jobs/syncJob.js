import cron from 'node-cron';
import Region from '../models/Region.js';
import { fetchFireAlerts } from '../services/externalDataService.js';

/**
 * Initializes and starts the background synchronization job.
 * Runs every 6 hours to check for fire alerts and update region risks.
 */
export const initSyncJob = () => {
    // Schedule: every 6 hours (0, 6, 12, 18 hours)
    cron.schedule('0 */6 * * *', async () => {
        const timestamp = new Date().toISOString();
        console.log(`[SYNC JOB] Starting background fire alert check at ${timestamp}`);

        try {
            const regions = await Region.find();
            let updatesCount = 0;

            // Run checks in parallel with Promise.allSettled
            await Promise.allSettled(regions.map(async (region) => {
                const { lat, lng } = region.coordinates;
                const fireData = await fetchFireAlerts(lat, lng);

                if (fireData.alertCount > 0) {
                    console.log(`[SYNC JOB] Fire alerts detected in ${region.name} (${fireData.alertCount} alerts). Escalating status.`);
                    
                    region.riskLevel = 'high';
                    region.status = 'deforested';
                    
                    await region.save();
                    updatesCount++;
                }
            }));

            console.log(`[SYNC JOB] Sync completed at ${new Date().toISOString()}. Updated ${updatesCount} regions based on active fire alerts.`);
        } catch (error) {
            console.error(`[SYNC JOB] Error during background synchronization: ${error.message}`);
        }
    });

    console.log('[SYNC JOB] Fire Alert Sync Job scheduled to run every 6 hours.');
};
