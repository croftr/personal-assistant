import { getDatabase } from "@/lib/common/database";

export interface Payslip {
    id: number;
    file_name: string;
    pay_date: string;
    net_pay: number;
    gross_pay: number | null;
    tax_paid: number | null;
    ni_paid: number | null;
    pension_contribution: number | null;
    other_deductions: number | null;
    ytd_taxable_pay: number | null;
    ytd_taxable_ni_pay: number | null;
    ytd_paye_tax: number | null;
    ytd_ni: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PayslipInput {
    file_name: string;
    pay_date: string;
    net_pay: number;
    gross_pay?: number;
    tax_paid?: number;
    ni_paid?: number;
    pension_contribution?: number;
    other_deductions?: number;
    ytd_taxable_pay?: number;
    ytd_taxable_ni_pay?: number;
    ytd_paye_tax?: number;
    ytd_ni?: number;
    notes?: string;
}

/**
 * Create a new payslip
 */
export function createPayslip(payslip: PayslipInput): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO payslips (file_name, pay_date, net_pay, gross_pay, tax_paid, ni_paid, pension_contribution, other_deductions, ytd_taxable_pay, ytd_taxable_ni_pay, ytd_paye_tax, ytd_ni, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        payslip.file_name,
        payslip.pay_date,
        payslip.net_pay,
        payslip.gross_pay || null,
        payslip.tax_paid || null,
        payslip.ni_paid || null,
        payslip.pension_contribution || null,
        payslip.other_deductions || null,
        payslip.ytd_taxable_pay || null,
        payslip.ytd_taxable_ni_pay || null,
        payslip.ytd_paye_tax || null,
        payslip.ytd_ni || null,
        payslip.notes || null
    );

    return result.lastInsertRowid as number;
}

/**
 * Get all payslips
 */
export function getAllPayslips(limit: number = 100): Payslip[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM payslips
        ORDER BY pay_date DESC, created_at DESC
        LIMIT ?
            `);
    return stmt.all(limit) as Payslip[];
}

/**
 * Get payslip by ID
 */
export function getPayslipById(id: number): Payslip | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM payslips
        WHERE id = ?
        `);
    return stmt.get(id) as Payslip | null;
}

/**
 * Get payslip by file name
 */
export function getPayslipByFileName(fileName: string): Payslip | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM payslips
        WHERE file_name = ?
        `);
    return stmt.get(fileName) as Payslip | null;
}

/**
 * Replace existing payslip (delete old and insert new)
 */
export function replacePayslip(fileName: string, payslip: PayslipInput): number {
    const db = getDatabase();

    const transaction = db.transaction(() => {
        // Delete existing record
        db.prepare(`DELETE FROM payslips WHERE file_name = ? `).run(fileName);

        // Insert new record
        const stmt = db.prepare(`
            INSERT INTO payslips(file_name, pay_date, net_pay, gross_pay, tax_paid, ni_paid, pension_contribution, other_deductions, ytd_taxable_pay, ytd_taxable_ni_pay, ytd_paye_tax, ytd_ni, notes)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

        const result = stmt.run(
            payslip.file_name,
            payslip.pay_date,
            payslip.net_pay,
            payslip.gross_pay || null,
            payslip.tax_paid || null,
            payslip.ni_paid || null,
            payslip.pension_contribution || null,
            payslip.other_deductions || null,
            payslip.ytd_taxable_pay || null,
            payslip.ytd_taxable_ni_pay || null,
            payslip.ytd_paye_tax || null,
            payslip.ytd_ni || null,
            payslip.notes || null
        );

        return result.lastInsertRowid as number;
    });

    return transaction();
}

/**
 * Get payslips by date range
 */
export function getPayslipsByDateRange(startDate: string, endDate: string): Payslip[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM payslips
        WHERE pay_date BETWEEN ? AND ?
        ORDER BY pay_date DESC
        `);
    return stmt.all(startDate, endDate) as Payslip[];
}

/**
 * Update payslip
 */
export function updatePayslip(
    id: number,
    updates: Partial<PayslipInput>
): void {
    const db = getDatabase();

    const fields = Object.keys(updates).filter(k => updates[k as keyof typeof updates] !== undefined);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ? `).join(", ");
    const values = fields.map(f => updates[f as keyof typeof updates]);

    const stmt = db.prepare(`
        UPDATE payslips
        SET ${setClause}, updated_at = datetime('now')
        WHERE id = ?
        `);

    stmt.run(...values, id);
}

/**
 * Delete payslip
 */
export function deletePayslip(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare(`
        DELETE FROM payslips WHERE id = ?
        `);
    stmt.run(id);
}

/**
 * Get payslip statistics
 */
export function getPayslipStats(): {
    total_payslips: number;
    total_net_pay: number;
    total_tax_paid: number;
    total_ni_paid: number;
    total_pension_contribution: number;
    average_net_pay: number;
} {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT
            COUNT(*) as total_payslips,
        COALESCE(SUM(net_pay), 0) as total_net_pay,
        COALESCE(SUM(tax_paid), 0) as total_tax_paid,
        COALESCE(SUM(ni_paid), 0) as total_ni_paid,
        COALESCE(SUM(pension_contribution), 0) as total_pension_contribution,
        COALESCE(AVG(net_pay), 0) as average_net_pay
        FROM payslips
        `);
    return stmt.get() as any;
}

/**
 * Get year-to-date statistics
 */
export function getYearToDateStats(year: number): {
    total_net_pay: number;
    total_tax_paid: number;
    total_ni_paid: number;
    total_pension_contribution: number;
} {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT
            COALESCE(SUM(net_pay), 0) as total_net_pay,
        COALESCE(SUM(tax_paid), 0) as total_tax_paid,
        COALESCE(SUM(ni_paid), 0) as total_ni_paid,
        COALESCE(SUM(pension_contribution), 0) as total_pension_contribution
        FROM payslips
        WHERE pay_date >= ? AND pay_date < ?
        `);

    const startDate = `${year}-01-01`;
    const endDate = `${year + 1}-01-01`;

    return stmt.get(startDate, endDate) as any;
}

/**
 * Get payslips for a specific financial year
 */
export function getPayslipsByFinancialYear(financialYear: string): Payslip[] {
    const db = getDatabase();

    // Parse financial year (format: "2024/25")
    const startYear = parseInt(financialYear.split('/')[0]);
    const startDate = `${startYear}-04-06`;
    const endDate = `${startYear + 1}-04-05`;

    const stmt = db.prepare(`
        SELECT * FROM payslips
        WHERE pay_date >= ? AND pay_date <= ?
        ORDER BY pay_date DESC
    `);

    return stmt.all(startDate, endDate) as Payslip[];
}
