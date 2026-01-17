import { getDatabase } from "@/lib/common/database";

export interface TaxReturn {
    id: number;
    financial_year: string;
    total_tax_charge: number;
    payment_deadline: string;
    paye_tax: number;
    savings_tax: number;
    child_benefit_payback: number;
    payment_reference: string | null;
    personal_allowance_reduction: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface TaxReturnInput {
    financial_year: string;
    total_tax_charge: number;
    payment_deadline: string;
    paye_tax?: number;
    savings_tax?: number;
    child_benefit_payback?: number;
    payment_reference?: string;
    personal_allowance_reduction?: string;
    notes?: string;
}

/**
 * Get all tax returns
 */
export function getAllTaxReturns(): TaxReturn[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM tax_returns
        ORDER BY financial_year DESC
    `);
    return stmt.all() as TaxReturn[];
}

/**
 * Get tax return by financial year
 */
export function getTaxReturn(financialYear: string): TaxReturn | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM tax_returns
        WHERE financial_year = ?
    `);
    return stmt.get(financialYear) as TaxReturn | null;
}

/**
 * Create a new tax return
 */
export function createTaxReturn(taxReturn: TaxReturnInput): TaxReturn {
    const db = getDatabase();

    const stmt = db.prepare(`
        INSERT INTO tax_returns (
            financial_year,
            total_tax_charge,
            payment_deadline,
            paye_tax,
            savings_tax,
            child_benefit_payback,
            payment_reference,
            personal_allowance_reduction,
            notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        taxReturn.financial_year,
        taxReturn.total_tax_charge,
        taxReturn.payment_deadline,
        taxReturn.paye_tax ?? 0,
        taxReturn.savings_tax ?? 0,
        taxReturn.child_benefit_payback ?? 0,
        taxReturn.payment_reference ?? null,
        taxReturn.personal_allowance_reduction ?? null,
        taxReturn.notes ?? null
    );

    const created = getTaxReturn(taxReturn.financial_year);
    if (!created) {
        throw new Error("Failed to create tax return");
    }
    return created;
}

/**
 * Update an existing tax return
 */
export function updateTaxReturn(
    financialYear: string,
    taxReturn: Partial<TaxReturnInput>
): TaxReturn {
    const db = getDatabase();

    const stmt = db.prepare(`
        UPDATE tax_returns
        SET total_tax_charge = COALESCE(?, total_tax_charge),
            payment_deadline = COALESCE(?, payment_deadline),
            paye_tax = COALESCE(?, paye_tax),
            savings_tax = COALESCE(?, savings_tax),
            child_benefit_payback = COALESCE(?, child_benefit_payback),
            payment_reference = COALESCE(?, payment_reference),
            personal_allowance_reduction = COALESCE(?, personal_allowance_reduction),
            notes = COALESCE(?, notes),
            updated_at = datetime('now')
        WHERE financial_year = ?
    `);

    stmt.run(
        taxReturn.total_tax_charge,
        taxReturn.payment_deadline,
        taxReturn.paye_tax,
        taxReturn.savings_tax,
        taxReturn.child_benefit_payback,
        taxReturn.payment_reference,
        taxReturn.personal_allowance_reduction,
        taxReturn.notes,
        financialYear
    );

    const updated = getTaxReturn(financialYear);
    if (!updated) {
        throw new Error("Failed to update tax return");
    }
    return updated;
}

/**
 * Delete a tax return
 */
export function deleteTaxReturn(financialYear: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
        DELETE FROM tax_returns WHERE financial_year = ?
    `);
    stmt.run(financialYear);
}
