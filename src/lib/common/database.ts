import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database file location
const DB_PATH = path.join(process.cwd(), "data", "personal-assistant.db");

let db: Database.Database | null = null;

/**
 * Get or create database instance (singleton)
 */
export function getDatabase(): Database.Database {
    if (db) {
        return db;
    }

    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create database connection
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL"); // Better performance for concurrent reads

    // Initialize schema
    initializeSchema(db);

    return db;
}

/**
 * Initialize database schema
 */
function initializeSchema(db: Database.Database) {
    // Documents table - stores metadata about uploaded/processed documents
    db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            file_path TEXT,
            file_type TEXT NOT NULL,
            file_size INTEGER,
            upload_date TEXT NOT NULL DEFAULT (datetime('now')),
            processed_date TEXT,
            assistant_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            metadata TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    // Document content table - stores extracted text/data from documents
    db.exec(`
        CREATE TABLE IF NOT EXISTS document_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            content TEXT NOT NULL,
            extracted_data TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );
    `);

    // Expenses table - stores processed expense data
    db.exec(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER,
            file_name TEXT NOT NULL,
            description TEXT NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'GBP',
            category TEXT,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
        );
    `);

    // Expense reports table - stores generated expense reports
    db.exec(`
        CREATE TABLE IF NOT EXISTS expense_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_name TEXT NOT NULL,
            report_date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'GBP',
            expense_count INTEGER NOT NULL,
            csv_path TEXT,
            zip_path TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    // Link table between reports and expenses
    db.exec(`
        CREATE TABLE IF NOT EXISTS report_expenses (
            report_id INTEGER NOT NULL,
            expense_id INTEGER NOT NULL,
            PRIMARY KEY (report_id, expense_id),
            FOREIGN KEY (report_id) REFERENCES expense_reports(id) ON DELETE CASCADE,
            FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
        );
    `);

    // Pensions table - stores pension details
    db.exec(`
        CREATE TABLE IF NOT EXISTS pensions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT,
            amount REAL NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    // Payslips table - stores payslip data
    db.exec(`
        CREATE TABLE IF NOT EXISTS payslips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL UNIQUE,
            pay_date TEXT NOT NULL,
            net_pay REAL NOT NULL,
            gross_pay REAL,
            tax_paid REAL,
            ni_paid REAL,
            pension_contribution REAL,
            other_deductions REAL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    // Bank accounts table - stores bank account details
    db.exec(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            bank TEXT NOT NULL,
            interest_rate REAL,
            amount REAL NOT NULL,
            url TEXT,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    // Financial year summaries table - stores year-to-date totals from payslips
    db.exec(`
        CREATE TABLE IF NOT EXISTS financial_year_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            financial_year TEXT NOT NULL UNIQUE,
            last_payslip_date TEXT NOT NULL,
            total_taxable_pay REAL NOT NULL,
            total_taxable_ni_pay REAL NOT NULL,
            total_paye_tax REAL NOT NULL,
            total_ni REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    // Add url column to existing bank_accounts table if it doesn't exist
    try {
        const columns = db.prepare("PRAGMA table_info(bank_accounts)").all() as any[];
        const hasUrlColumn = columns.some(col => col.name === 'url');
        if (!hasUrlColumn) {
            db.exec(`ALTER TABLE bank_accounts ADD COLUMN url TEXT;`);
            console.log("Added url column to bank_accounts table");
        }
    } catch (error) {
        console.log("bank_accounts url column migration check:", error);
    }

    // Create indexes for better query performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_documents_assistant_type ON documents(assistant_type);
        CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
        CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
        CREATE INDEX IF NOT EXISTS idx_document_content_document_id ON document_content(document_id);
        CREATE INDEX IF NOT EXISTS idx_pensions_name ON pensions(name);
        CREATE INDEX IF NOT EXISTS idx_payslips_pay_date ON payslips(pay_date);
        CREATE INDEX IF NOT EXISTS idx_payslips_created_at ON payslips(created_at);
        CREATE INDEX IF NOT EXISTS idx_bank_accounts_name ON bank_accounts(name);
        CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank ON bank_accounts(bank);
        CREATE INDEX IF NOT EXISTS idx_financial_year_summaries_year ON financial_year_summaries(financial_year);
    `);

    console.log("Database schema initialized at:", DB_PATH);
}

/**
 * Close database connection
 */
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Execute a query with error handling
 */
export function executeQuery<T>(
    query: string,
    params?: any[]
): T[] {
    try {
        const db = getDatabase();
        const stmt = db.prepare(query);
        return stmt.all(params || []) as T[];
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}

/**
 * Execute an insert/update/delete with error handling
 */
export function executeModification(
    query: string,
    params?: any[]
): Database.RunResult {
    try {
        const db = getDatabase();
        const stmt = db.prepare(query);
        return stmt.run(params || []);
    } catch (error) {
        console.error("Database modification error:", error);
        throw error;
    }
}

/**
 * Execute multiple statements in a transaction
 */
export function executeTransaction(
    callback: (db: Database.Database) => void
): void {
    const db = getDatabase();
    const transaction = db.transaction(callback);
    transaction(db);
}
