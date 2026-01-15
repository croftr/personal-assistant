import { getDatabase } from "@/lib/common/database";

export interface BankAccount {
    id: number;
    name: string;
    bank: string;
    interest_rate: number | null;
    amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface BankAccountInput {
    name: string;
    bank: string;
    interest_rate?: number;
    amount: number;
    notes?: string;
}

/**
 * Create a new bank account
 */
export function createBankAccount(account: BankAccountInput): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO bank_accounts (name, bank, interest_rate, amount, notes)
        VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        account.name,
        account.bank,
        account.interest_rate || null,
        account.amount,
        account.notes || null
    );

    return result.lastInsertRowid as number;
}

/**
 * Get all bank accounts
 */
export function getAllBankAccounts(): BankAccount[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM bank_accounts
        ORDER BY name ASC
    `);
    return stmt.all() as BankAccount[];
}

/**
 * Get bank account by ID
 */
export function getBankAccountById(id: number): BankAccount | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM bank_accounts
        WHERE id = ?
    `);
    return stmt.get(id) as BankAccount | null;
}

/**
 * Update bank account
 */
export function updateBankAccount(
    id: number,
    updates: Partial<BankAccountInput>
): void {
    const db = getDatabase();

    const fields = Object.keys(updates).filter(k => updates[k as keyof typeof updates] !== undefined);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(", ");
    const values = fields.map(f => updates[f as keyof typeof updates]);

    const stmt = db.prepare(`
        UPDATE bank_accounts
        SET ${setClause}, updated_at = datetime('now')
        WHERE id = ?
    `);

    stmt.run(...values, id);
}

/**
 * Delete bank account
 */
export function deleteBankAccount(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare(`
        DELETE FROM bank_accounts WHERE id = ?
    `);
    stmt.run(id);
}

/**
 * Get total amount across all bank accounts
 */
export function getTotalBankBalance(): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM bank_accounts
    `);
    const result = stmt.get() as { total: number };
    return result.total;
}

/**
 * Get bank account statistics
 */
export function getBankAccountStats(): {
    total_accounts: number;
    total_balance: number;
    average_balance: number;
    total_interest: number;
} {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT
            COUNT(*) as total_accounts,
            COALESCE(SUM(amount), 0) as total_balance,
            COALESCE(AVG(amount), 0) as average_balance,
            COALESCE(SUM(amount * interest_rate / 100), 0) as total_interest
        FROM bank_accounts
    `);
    return stmt.get() as any;
}

/**
 * Get accounts by bank
 */
export function getAccountsByBank(bank: string): BankAccount[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM bank_accounts
        WHERE bank = ?
        ORDER BY name ASC
    `);
    return stmt.all(bank) as BankAccount[];
}
