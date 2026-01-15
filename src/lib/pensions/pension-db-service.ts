import { getDatabase } from "@/lib/common/database";

export interface Pension {
    id: number;
    name: string;
    url: string | null;
    amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PensionInput {
    name: string;
    url?: string;
    amount: number;
    notes?: string;
}

/**
 * Create a new pension
 */
export function createPension(pension: PensionInput): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO pensions (name, url, amount, notes)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
        pension.name,
        pension.url || null,
        pension.amount,
        pension.notes || null
    );

    return result.lastInsertRowid as number;
}

/**
 * Get all pensions
 */
export function getAllPensions(): Pension[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM pensions
        ORDER BY name ASC
    `);
    return stmt.all() as Pension[];
}

/**
 * Get pension by ID
 */
export function getPensionById(id: number): Pension | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM pensions
        WHERE id = ?
    `);
    return stmt.get(id) as Pension | null;
}

/**
 * Update pension
 */
export function updatePension(
    id: number,
    updates: Partial<PensionInput>
): void {
    const db = getDatabase();

    const fields = Object.keys(updates).filter(k => updates[k as keyof typeof updates] !== undefined);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(", ");
    const values = fields.map(f => updates[f as keyof typeof updates]);

    const stmt = db.prepare(`
        UPDATE pensions
        SET ${setClause}, updated_at = datetime('now')
        WHERE id = ?
    `);

    stmt.run(...values, id);
}

/**
 * Delete pension
 */
export function deletePension(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare(`
        DELETE FROM pensions WHERE id = ?
    `);
    stmt.run(id);
}

/**
 * Get total amount of all pensions
 */
export function getTotalPensionAmount(): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM pensions
    `);
    const result = stmt.get() as { total: number };
    return result.total;
}

/**
 * Get pension statistics
 */
export function getPensionStats(): {
    total_pensions: number;
    total_amount: number;
    average_amount: number;
} {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT
            COUNT(*) as total_pensions,
            COALESCE(SUM(amount), 0) as total_amount,
            COALESCE(AVG(amount), 0) as average_amount
        FROM pensions
    `);
    return stmt.get() as any;
}
