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

    // Create indexes for better query performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_documents_assistant_type ON documents(assistant_type);
        CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
        CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
        CREATE INDEX IF NOT EXISTS idx_document_content_document_id ON document_content(document_id);
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
