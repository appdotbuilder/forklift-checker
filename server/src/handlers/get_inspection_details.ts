
import { db } from '../db';
import { dailyInspectionsTable, inspectionResultsTable, forkliftsTable, usersTable, checklistItemsTable } from '../db/schema';
import { type DailyInspection, type InspectionResult } from '../schema';
import { eq } from 'drizzle-orm';

export interface InspectionDetails extends DailyInspection {
    results: (InspectionResult & {
        checklist_item: {
            category: string;
            item_name: string;
            description: string | null;
        };
    })[];
    forklift: {
        unit_number: string;
        brand: string;
        model: string;
    };
    operator: {
        full_name: string;
        username: string;
    };
}

export const getInspectionDetails = async (inspectionId: number): Promise<InspectionDetails | null> => {
    try {
        // First, get the main inspection record with forklift and operator details
        const inspectionResults = await db.select()
            .from(dailyInspectionsTable)
            .innerJoin(forkliftsTable, eq(dailyInspectionsTable.forklift_id, forkliftsTable.id))
            .innerJoin(usersTable, eq(dailyInspectionsTable.operator_id, usersTable.id))
            .where(eq(dailyInspectionsTable.id, inspectionId))
            .execute();

        if (inspectionResults.length === 0) {
            return null;
        }

        const inspectionData = inspectionResults[0];

        // Get all inspection results with checklist item details
        const resultsData = await db.select()
            .from(inspectionResultsTable)
            .innerJoin(checklistItemsTable, eq(inspectionResultsTable.checklist_item_id, checklistItemsTable.id))
            .where(eq(inspectionResultsTable.inspection_id, inspectionId))
            .execute();

        // Convert numeric fields and build results array
        const results = resultsData.map(result => ({
            id: result.inspection_results.id,
            inspection_id: result.inspection_results.inspection_id,
            checklist_item_id: result.inspection_results.checklist_item_id,
            status: result.inspection_results.status,
            notes: result.inspection_results.notes,
            created_at: result.inspection_results.created_at,
            checklist_item: {
                category: result.checklist_items.category,
                item_name: result.checklist_items.item_name,
                description: result.checklist_items.description
            }
        }));

        // Build the complete inspection details object
        const inspectionDetails: InspectionDetails = {
            id: inspectionData.daily_inspections.id,
            forklift_id: inspectionData.daily_inspections.forklift_id,
            operator_id: inspectionData.daily_inspections.operator_id,
            inspection_date: inspectionData.daily_inspections.inspection_date,
            shift: inspectionData.daily_inspections.shift,
            hours_meter: inspectionData.daily_inspections.hours_meter ? parseFloat(inspectionData.daily_inspections.hours_meter) : null,
            fuel_level: inspectionData.daily_inspections.fuel_level,
            overall_status: inspectionData.daily_inspections.overall_status,
            notes: inspectionData.daily_inspections.notes,
            created_at: inspectionData.daily_inspections.created_at,
            results,
            forklift: {
                unit_number: inspectionData.forklifts.unit_number,
                brand: inspectionData.forklifts.brand,
                model: inspectionData.forklifts.model
            },
            operator: {
                full_name: inspectionData.users.full_name,
                username: inspectionData.users.username
            }
        };

        return inspectionDetails;
    } catch (error) {
        console.error('Get inspection details failed:', error);
        throw error;
    }
};
