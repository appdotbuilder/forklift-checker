
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, forkliftsTable, checklistItemsTable, dailyInspectionsTable, inspectionResultsTable } from '../db/schema';
import { getInspectionDetails } from '../handlers/get_inspection_details';

describe('getInspectionDetails', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return detailed inspection information', async () => {
        // Create test user
        const users = await db.insert(usersTable)
            .values({
                username: 'testoperator',
                full_name: 'Test Operator',
                role: 'operator'
            })
            .returning()
            .execute();
        const userId = users[0].id;

        // Create test forklift
        const forklifts = await db.insert(forkliftsTable)
            .values({
                unit_number: 'FL001',
                brand: 'Toyota',
                model: '8FGU25',
                year: 2020,
                serial_number: 'T123456',
                status: 'active'
            })
            .returning()
            .execute();
        const forkliftId = forklifts[0].id;

        // Create test checklist items
        const checklistItems = await db.insert(checklistItemsTable)
            .values([
                {
                    category: 'Engine',
                    item_name: 'Oil Level',
                    description: 'Check engine oil level',
                    is_active: true
                },
                {
                    category: 'Safety',
                    item_name: 'Horn',
                    description: 'Test horn functionality',
                    is_active: true
                }
            ])
            .returning()
            .execute();

        // Create test inspection
        const inspections = await db.insert(dailyInspectionsTable)
            .values({
                forklift_id: forkliftId,
                operator_id: userId,
                inspection_date: new Date('2024-01-15'),
                shift: 'morning',
                hours_meter: '1234.50',
                fuel_level: 75,
                overall_status: 'pass',
                notes: 'All systems normal'
            })
            .returning()
            .execute();
        const inspectionId = inspections[0].id;

        // Create test inspection results
        await db.insert(inspectionResultsTable)
            .values([
                {
                    inspection_id: inspectionId,
                    checklist_item_id: checklistItems[0].id,
                    status: 'ok',
                    notes: 'Oil level good'
                },
                {
                    inspection_id: inspectionId,
                    checklist_item_id: checklistItems[1].id,
                    status: 'defect',
                    notes: 'Horn not working'
                }
            ])
            .execute();

        // Test the handler
        const result = await getInspectionDetails(inspectionId);

        expect(result).toBeDefined();
        expect(result!.id).toEqual(inspectionId);
        expect(result!.forklift_id).toEqual(forkliftId);
        expect(result!.operator_id).toEqual(userId);
        expect(result!.inspection_date).toBeInstanceOf(Date);
        expect(result!.shift).toEqual('morning');
        expect(result!.hours_meter).toEqual(1234.50);
        expect(typeof result!.hours_meter).toEqual('number');
        expect(result!.fuel_level).toEqual(75);
        expect(result!.overall_status).toEqual('pass');
        expect(result!.notes).toEqual('All systems normal');
        expect(result!.created_at).toBeInstanceOf(Date);

        // Check forklift details
        expect(result!.forklift).toBeDefined();
        expect(result!.forklift.unit_number).toEqual('FL001');
        expect(result!.forklift.brand).toEqual('Toyota');
        expect(result!.forklift.model).toEqual('8FGU25');

        // Check operator details
        expect(result!.operator).toBeDefined();
        expect(result!.operator.full_name).toEqual('Test Operator');
        expect(result!.operator.username).toEqual('testoperator');

        // Check inspection results
        expect(result!.results).toHaveLength(2);
        
        const oilResult = result!.results.find(r => r.checklist_item.item_name === 'Oil Level');
        expect(oilResult).toBeDefined();
        expect(oilResult!.status).toEqual('ok');
        expect(oilResult!.notes).toEqual('Oil level good');
        expect(oilResult!.checklist_item.category).toEqual('Engine');
        expect(oilResult!.checklist_item.description).toEqual('Check engine oil level');

        const hornResult = result!.results.find(r => r.checklist_item.item_name === 'Horn');
        expect(hornResult).toBeDefined();
        expect(hornResult!.status).toEqual('defect');
        expect(hornResult!.notes).toEqual('Horn not working');
        expect(hornResult!.checklist_item.category).toEqual('Safety');
    });

    it('should return null for non-existent inspection', async () => {
        const result = await getInspectionDetails(999);
        expect(result).toBeNull();
    });

    it('should handle inspection with null hours_meter', async () => {
        // Create test user
        const users = await db.insert(usersTable)
            .values({
                username: 'testoperator',
                full_name: 'Test Operator',
                role: 'operator'
            })
            .returning()
            .execute();
        const userId = users[0].id;

        // Create test forklift
        const forklifts = await db.insert(forkliftsTable)
            .values({
                unit_number: 'FL002',
                brand: 'Caterpillar',
                model: 'EP25K',
                year: 2021,
                serial_number: 'C789012',
                status: 'active'
            })
            .returning()
            .execute();
        const forkliftId = forklifts[0].id;

        // Create inspection with null hours_meter
        const inspections = await db.insert(dailyInspectionsTable)
            .values({
                forklift_id: forkliftId,
                operator_id: userId,
                inspection_date: new Date('2024-01-16'),
                shift: 'afternoon',
                hours_meter: null,
                fuel_level: null,
                overall_status: 'needs_attention',
                notes: null
            })
            .returning()
            .execute();
        const inspectionId = inspections[0].id;

        const result = await getInspectionDetails(inspectionId);

        expect(result).toBeDefined();
        expect(result!.hours_meter).toBeNull();
        expect(result!.fuel_level).toBeNull();
        expect(result!.notes).toBeNull();
        expect(result!.overall_status).toEqual('needs_attention');
        expect(result!.results).toHaveLength(0); // No results added
    });

    it('should handle inspection with multiple results from same category', async () => {
        // Create test user and forklift
        const users = await db.insert(usersTable)
            .values({
                username: 'mechanic1',
                full_name: 'Test Mechanic',
                role: 'mechanic'
            })
            .returning()
            .execute();

        const forklifts = await db.insert(forkliftsTable)
            .values({
                unit_number: 'FL003',
                brand: 'Hyster',
                model: 'H50FT',
                year: 2019,
                serial_number: 'H345678',
                status: 'maintenance'
            })
            .returning()
            .execute();

        // Create multiple safety checklist items
        const checklistItems = await db.insert(checklistItemsTable)
            .values([
                {
                    category: 'Safety',
                    item_name: 'Seat Belt',
                    description: 'Check seat belt condition',
                    is_active: true
                },
                {
                    category: 'Safety',
                    item_name: 'Emergency Stop',
                    description: 'Test emergency stop button',
                    is_active: true
                },
                {
                    category: 'Safety',
                    item_name: 'Warning Lights',
                    description: null,
                    is_active: true
                }
            ])
            .returning()
            .execute();

        const inspections = await db.insert(dailyInspectionsTable)
            .values({
                forklift_id: forklifts[0].id,
                operator_id: users[0].id,
                inspection_date: new Date('2024-01-17'),
                shift: 'night',
                hours_meter: '2500.25',
                fuel_level: 50,
                overall_status: 'fail',
                notes: 'Multiple safety issues found'
            })
            .returning()
            .execute();

        await db.insert(inspectionResultsTable)
            .values([
                {
                    inspection_id: inspections[0].id,
                    checklist_item_id: checklistItems[0].id,
                    status: 'defect',
                    notes: 'Seat belt frayed'
                },
                {
                    inspection_id: inspections[0].id,
                    checklist_item_id: checklistItems[1].id,
                    status: 'ok',
                    notes: null
                },
                {
                    inspection_id: inspections[0].id,
                    checklist_item_id: checklistItems[2].id,
                    status: 'not_applicable',
                    notes: 'Lights not installed on this model'
                }
            ])
            .execute();

        const result = await getInspectionDetails(inspections[0].id);

        expect(result).toBeDefined();
        expect(result!.results).toHaveLength(3);
        expect(result!.overall_status).toEqual('fail');
        
        // All results should be from Safety category
        result!.results.forEach(res => {
            expect(res.checklist_item.category).toEqual('Safety');
        });

        // Check specific results
        const seatBeltResult = result!.results.find(r => r.checklist_item.item_name === 'Seat Belt');
        expect(seatBeltResult!.status).toEqual('defect');
        expect(seatBeltResult!.checklist_item.description).toEqual('Check seat belt condition');

        const warningLightsResult = result!.results.find(r => r.checklist_item.item_name === 'Warning Lights');
        expect(warningLightsResult!.checklist_item.description).toBeNull();
    });
});
