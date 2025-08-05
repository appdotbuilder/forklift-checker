
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, forkliftsTable, checklistItemsTable, dailyInspectionsTable, inspectionResultsTable } from '../db/schema';
import { getForkliftStatusSummary } from '../handlers/get_forklift_status_summary';

describe('getForkliftStatusSummary', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return empty array when no forklifts exist', async () => {
        const result = await getForkliftStatusSummary();
        expect(result).toHaveLength(0);
    });

    it('should return forklift with no inspection data', async () => {
        // Create a forklift
        const forkliftResult = await db.insert(forkliftsTable)
            .values({
                unit_number: 'FL001',
                brand: 'Toyota',
                model: 'ABC123',
                year: 2022,
                serial_number: 'SN001',
                status: 'active'
            })
            .returning()
            .execute();

        const result = await getForkliftStatusSummary();

        expect(result).toHaveLength(1);
        expect(result[0].forklift.unit_number).toEqual('FL001');
        expect(result[0].forklift.brand).toEqual('Toyota');
        expect(result[0].last_inspection_date).toBeNull();
        expect(result[0].last_inspection_status).toBeNull();
        expect(result[0].days_since_inspection).toBeNull();
        expect(result[0].pending_defects).toEqual(0);
    });

    it('should return forklift with latest inspection and defect count', async () => {
        // Create user
        const userResult = await db.insert(usersTable)
            .values({
                username: 'operator1',
                full_name: 'Test Operator',
                role: 'operator'
            })
            .returning()
            .execute();

        // Create forklift
        const forkliftResult = await db.insert(forkliftsTable)
            .values({
                unit_number: 'FL001',
                brand: 'Toyota',
                model: 'ABC123',
                year: 2022,
                serial_number: 'SN001',
                status: 'active'
            })
            .returning()
            .execute();

        // Create checklist item
        const checklistResult = await db.insert(checklistItemsTable)
            .values({
                category: 'Safety',
                item_name: 'Brakes',
                description: 'Check brake operation',
                is_active: true
            })
            .returning()
            .execute();

        // Create older inspection
        const olderInspectionResult = await db.insert(dailyInspectionsTable)
            .values({
                forklift_id: forkliftResult[0].id,
                operator_id: userResult[0].id,
                inspection_date: new Date('2024-01-01'),
                shift: 'morning',
                hours_meter: '100.5',
                fuel_level: 75,
                overall_status: 'pass',
                notes: 'Old inspection'
            })
            .returning()
            .execute();

        // Create recent inspection
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 2); // 2 days ago

        const recentInspectionResult = await db.insert(dailyInspectionsTable)
            .values({
                forklift_id: forkliftResult[0].id,
                operator_id: userResult[0].id,
                inspection_date: recentDate,
                shift: 'afternoon',
                hours_meter: '150.0',
                fuel_level: 60,
                overall_status: 'needs_attention',
                notes: 'Recent inspection'
            })
            .returning()
            .execute();

        // Create inspection result with defect
        await db.insert(inspectionResultsTable)
            .values({
                inspection_id: recentInspectionResult[0].id,
                checklist_item_id: checklistResult[0].id,
                status: 'defect',
                notes: 'Brake issue found'
            })
            .execute();

        const result = await getForkliftStatusSummary();

        expect(result).toHaveLength(1);
        expect(result[0].forklift.unit_number).toEqual('FL001');
        expect(result[0].last_inspection_date).toBeInstanceOf(Date);
        expect(result[0].last_inspection_status).toEqual('needs_attention');
        expect(result[0].days_since_inspection).toEqual(2);
        expect(result[0].pending_defects).toEqual(1);
    });

    it('should handle multiple forklifts and sort by unit number', async () => {
        // Create user
        const userResult = await db.insert(usersTable)
            .values({
                username: 'operator1',
                full_name: 'Test Operator',
                role: 'operator'
            })
            .returning()
            .execute();

        // Create multiple forklifts
        await db.insert(forkliftsTable)
            .values([
                {
                    unit_number: 'FL003',
                    brand: 'Toyota',
                    model: 'ABC123',
                    year: 2022,
                    serial_number: 'SN003',
                    status: 'active'
                },
                {
                    unit_number: 'FL001',
                    brand: 'Hyster',
                    model: 'DEF456',
                    year: 2021,
                    serial_number: 'SN001',
                    status: 'maintenance'
                }
            ])
            .execute();

        const result = await getForkliftStatusSummary();

        expect(result).toHaveLength(2);
        expect(result[0].forklift.unit_number).toEqual('FL001'); // Sorted by unit_number
        expect(result[1].forklift.unit_number).toEqual('FL003');
        expect(result[0].forklift.status).toEqual('maintenance');
        expect(result[1].forklift.status).toEqual('active');
    });

    it('should only count defects from last 30 days', async () => {
        // Create user
        const userResult = await db.insert(usersTable)
            .values({
                username: 'operator1',
                full_name: 'Test Operator',
                role: 'operator'
            })
            .returning()
            .execute();

        // Create forklift
        const forkliftResult = await db.insert(forkliftsTable)
            .values({
                unit_number: 'FL001',
                brand: 'Toyota',
                model: 'ABC123',
                year: 2022,
                serial_number: 'SN001',
                status: 'active'
            })
            .returning()
            .execute();

        // Create checklist item
        const checklistResult = await db.insert(checklistItemsTable)
            .values({
                category: 'Safety',
                item_name: 'Brakes',
                description: 'Check brake operation',
                is_active: true
            })
            .returning()
            .execute();

        // Create old inspection (older than 30 days)
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 35);

        const oldInspectionResult = await db.insert(dailyInspectionsTable)
            .values({
                forklift_id: forkliftResult[0].id,
                operator_id: userResult[0].id,
                inspection_date: oldDate,
                shift: 'morning',
                hours_meter: '100.0',
                fuel_level: 75,
                overall_status: 'fail',
                notes: 'Old inspection'
            })
            .returning()
            .execute();

        // Create defect for old inspection (should not be counted)
        await db.insert(inspectionResultsTable)
            .values({
                inspection_id: oldInspectionResult[0].id,
                checklist_item_id: checklistResult[0].id,
                status: 'defect',
                notes: 'Old defect'
            })
            .execute();

        // Create recent inspection
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 5);

        const recentInspectionResult = await db.insert(dailyInspectionsTable)
            .values({
                forklift_id: forkliftResult[0].id,
                operator_id: userResult[0].id,
                inspection_date: recentDate,
                shift: 'afternoon',
                hours_meter: '120.0',
                fuel_level: 60,
                overall_status: 'needs_attention',
                notes: 'Recent inspection'
            })
            .returning()
            .execute();

        // Create defect for recent inspection (should be counted)
        await db.insert(inspectionResultsTable)
            .values({
                inspection_id: recentInspectionResult[0].id,
                checklist_item_id: checklistResult[0].id,
                status: 'defect',
                notes: 'Recent defect'
            })
            .execute();

        const result = await getForkliftStatusSummary();

        expect(result).toHaveLength(1);
        expect(result[0].last_inspection_status).toEqual('needs_attention'); // Latest inspection
        expect(result[0].pending_defects).toEqual(1); // Only recent defect counted
    });
});
