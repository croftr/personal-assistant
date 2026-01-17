import { getDatabase } from "@/lib/common/database";

export interface FinancialYearSummary {
    id: number;
    financial_year: string;
    last_payslip_date: string;
    total_taxable_pay: number;
    total_taxable_ni_pay: number;
    total_paye_tax: number;
    total_ni: number;
    created_at: string;
    updated_at: string;
}

export interface FinancialYearSummaryInput {
    financial_year: string;
    last_payslip_date: string;
    total_taxable_pay: number;
    total_taxable_ni_pay: number;
    total_paye_tax: number;
    total_ni: number;
}

/**
 * Get all financial year summaries
 */
export function getAllFinancialYearSummaries(): FinancialYearSummary[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM financial_year_summaries
        ORDER BY financial_year DESC
    `);
    return stmt.all() as FinancialYearSummary[];
}

/**
 * Get financial year summary by year
 */
export function getFinancialYearSummary(financialYear: string): FinancialYearSummary | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM financial_year_summaries
        WHERE financial_year = ?
    `);
    return stmt.get(financialYear) as FinancialYearSummary | null;
}

/**
 * Create or update financial year summary
 * If payslip date is newer than existing, update the summary
 * If payslip date is older, return false (don't update)
 */
export function upsertFinancialYearSummary(
    summary: FinancialYearSummaryInput
): { success: boolean; message: string; isNewer: boolean } {
    const db = getDatabase();

    // Check if summary already exists
    const existing = getFinancialYearSummary(summary.financial_year);

    if (existing) {
        // Compare dates - if new payslip is older, don't update
        const existingDate = new Date(existing.last_payslip_date);
        const newDate = new Date(summary.last_payslip_date);

        if (newDate < existingDate) {
            return {
                success: false,
                message: `Payslip date ${summary.last_payslip_date} is older than existing data (${existing.last_payslip_date}). No update performed.`,
                isNewer: false
            };
        }

        // Update existing record
        const stmt = db.prepare(`
            UPDATE financial_year_summaries
            SET last_payslip_date = ?,
                total_taxable_pay = ?,
                total_taxable_ni_pay = ?,
                total_paye_tax = ?,
                total_ni = ?,
                updated_at = datetime('now')
            WHERE financial_year = ?
        `);

        stmt.run(
            summary.last_payslip_date,
            summary.total_taxable_pay,
            summary.total_taxable_ni_pay,
            summary.total_paye_tax,
            summary.total_ni,
            summary.financial_year
        );

        return {
            success: true,
            message: `Updated financial year ${summary.financial_year} with data from ${summary.last_payslip_date}`,
            isNewer: true
        };
    } else {
        // Insert new record
        const stmt = db.prepare(`
            INSERT INTO financial_year_summaries (
                financial_year,
                last_payslip_date,
                total_taxable_pay,
                total_taxable_ni_pay,
                total_paye_tax,
                total_ni
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            summary.financial_year,
            summary.last_payslip_date,
            summary.total_taxable_pay,
            summary.total_taxable_ni_pay,
            summary.total_paye_tax,
            summary.total_ni
        );

        return {
            success: true,
            message: `Created financial year ${summary.financial_year} with data from ${summary.last_payslip_date}`,
            isNewer: true
        };
    }
}

/**
 * Delete financial year summary
 */
export function deleteFinancialYearSummary(financialYear: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
        DELETE FROM financial_year_summaries WHERE financial_year = ?
    `);
    stmt.run(financialYear);
}

/**
 * Calculate financial year from a date
 * UK financial year runs from April 6 to April 5
 */
export function calculateFinancialYear(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const month = d.getMonth(); // 0-11
    const day = d.getDate();
    const year = d.getFullYear();

    // Financial year starts on April 6 (month 3, day 6)
    // If before April 6, we're in the previous financial year
    let financialYear: number;
    if (month < 3) {
        // January, February, March - previous FY
        financialYear = year - 1;
    } else if (month === 3 && day < 6) {
        // April 1-5 - previous FY
        financialYear = year - 1;
    } else {
        // April 6 onwards - current FY
        financialYear = year;
    }

    return `${financialYear}/${(financialYear + 1).toString().slice(2)}`;
}
