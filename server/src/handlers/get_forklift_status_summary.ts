
import { db } from '../db';
import { forkliftsTable, dailyInspectionsTable, inspectionResultsTable } from '../db/schema';
import { type Forklift } from '../schema';
import { sql, eq, desc, and, gte } from 'drizzle-orm';

export interface ForkliftStatusSummary {
    forklift: Forklift;
    last_inspection_date: Date | null;
    last_inspection_status: 'pass' | 'fail' | 'needs_attention' | null;
    days_since_inspection: number | null;
    pending_defects: number;
}

export const getForkliftStatusSummary = async (): Promise<ForkliftStatusSummary[]> => {
    try {
        // Get all forklifts first
        const forklifts = await db.select()
            .from(forkliftsTable)
            .orderBy(forkliftsTable.unit_number)
            .execute();

        // Get the cutoff date for pending defects (30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const summaries: ForkliftStatusSummary[] = [];

        for (const forklift of forklifts) {
            // Get latest inspection for this forklift
            const latestInspections = await db.select()
                .from(dailyInspectionsTable)
                .where(eq(dailyInspectionsTable.forklift_id, forklift.id))
                .orderBy(desc(dailyInspectionsTable.inspection_date), desc(dailyInspectionsTable.created_at))
                .limit(1)
                .execute();

            const latestInspection = latestInspections[0] || null;

            // Calculate days since inspection
            let daysSinceInspection: number | null = null;
            if (latestInspection?.inspection_date) {
                const inspectionDate = new Date(latestInspection.inspection_date);
                const today = new Date();
                const timeDiff = today.getTime() - inspectionDate.getTime();
                daysSinceInspection = Math.floor(timeDiff / (1000 * 3600 * 24));
            }

            // Count pending defects from last 30 days
            const defectCountQuery = await db.select({
                count: sql<number>`count(*)::int`
            })
                .from(inspectionResultsTable)
                .innerJoin(dailyInspectionsTable, eq(inspectionResultsTable.inspection_id, dailyInspectionsTable.id))
                .where(
                    and(
                        eq(dailyInspectionsTable.forklift_id, forklift.id),
                        eq(inspectionResultsTable.status, 'defect'),
                        gte(dailyInspectionsTable.inspection_date, thirtyDaysAgo)
                    )
                )
                .execute();

            const pendingDefects = defectCountQuery[0]?.count || 0;

            summaries.push({
                forklift: {
                    id: forklift.id,
                    unit_number: forklift.unit_number,
                    brand: forklift.brand,
                    model: forklift.model,
                    year: forklift.year,
                    serial_number: forklift.serial_number,
                    status: forklift.status,
                    created_at: forklift.created_at
                },
                last_inspection_date: latestInspection?.inspection_date ? new Date(latestInspection.inspection_date) : null,
                last_inspection_status: latestInspection?.overall_status || null,
                days_since_inspection: daysSinceInspection,
                pending_defects: pendingDefects
            });
        }

        return summaries;
    } catch (error) {
        console.error('Failed to get forklift status summary:', error);
        throw error;
    }
};
