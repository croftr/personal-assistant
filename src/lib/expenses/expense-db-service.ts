import { getDatabase } from "@/lib/common/database";
import type { StoredExpense, ExpenseReport } from "@/types/common";
import type { ProcessedExpense } from "@/types/expenses";

/**
 * Save a single expense to database
 */
export function saveExpense(expense: {
    document_id?: number;
    file_name: string;
    description: string;
    date: string;
    amount: number;
    currency?: string;
    category?: string;
    notes?: string;
}): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO expenses (document_id, file_name, description, date, amount, currency, category, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        expense.document_id || null,
        expense.file_name,
        expense.description,
        expense.date,
        expense.amount,
        expense.currency || "GBP",
        expense.category || null,
        expense.notes || null
    );

    return result.lastInsertRowid as number;
}

/**
 * Save multiple expenses in a transaction
 */
export function saveExpenses(expenses: ProcessedExpense[], documentId?: number): number[] {
    const db = getDatabase();
    const ids: number[] = [];

    const transaction = db.transaction(() => {
        const stmt = db.prepare(`
            INSERT INTO expenses (document_id, file_name, description, date, amount, currency)
            VALUES (?, ?, ?, ?, ?, 'GBP')
        `);

        for (const expense of expenses) {
            const result = stmt.run(
                documentId || null,
                expense.fileName,
                expense.description,
                expense.date,
                expense.amount
            );
            ids.push(result.lastInsertRowid as number);
        }
    });

    transaction();
    return ids;
}

/**
 * Create an expense report (or update if report with same name and date exists)
 */
export function createExpenseReport(data: {
    report_name: string;
    report_date: string;
    total_amount: number;
    expense_count: number;
    csv_path?: string;
    zip_path?: string;
    currency?: string;
}): number {
    const db = getDatabase();

    // Check if report with same name and date already exists
    const existingReport = db.prepare(`
        SELECT id FROM expense_reports
        WHERE report_name = ? AND report_date = ?
    `).get(data.report_name, data.report_date) as { id: number } | undefined;

    if (existingReport) {
        // Delete old report (cascade will handle report_expenses)
        deleteExpenseReport(existingReport.id);
    }

    // Insert new report
    const stmt = db.prepare(`
        INSERT INTO expense_reports (report_name, report_date, total_amount, currency, expense_count, csv_path, zip_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        data.report_name,
        data.report_date,
        data.total_amount,
        data.currency || "GBP",
        data.expense_count,
        data.csv_path || null,
        data.zip_path || null
    );

    return result.lastInsertRowid as number;
}

/**
 * Link expenses to a report
 */
export function linkExpensesToReport(reportId: number, expenseIds: number[]): void {
    const db = getDatabase();

    const transaction = db.transaction(() => {
        const stmt = db.prepare(`
            INSERT INTO report_expenses (report_id, expense_id)
            VALUES (?, ?)
        `);

        for (const expenseId of expenseIds) {
            stmt.run(reportId, expenseId);
        }
    });

    transaction();
}

/**
 * Get all expenses
 */
export function getAllExpenses(limit: number = 100): StoredExpense[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM expenses
        ORDER BY date DESC, created_at DESC
        LIMIT ?
    `);
    return stmt.all(limit) as StoredExpense[];
}

/**
 * Get expenses by date range
 */
export function getExpensesByDateRange(startDate: string, endDate: string): StoredExpense[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM expenses
        WHERE date BETWEEN ? AND ?
        ORDER BY date DESC
    `);
    return stmt.all(startDate, endDate) as StoredExpense[];
}

/**
 * Get expenses by category
 */
export function getExpensesByCategory(category: string): StoredExpense[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM expenses
        WHERE category = ?
        ORDER BY date DESC
    `);
    return stmt.all(category) as StoredExpense[];
}

/**
 * Get expense report by ID
 */
export function getExpenseReportById(reportId: number): ExpenseReport | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM expense_reports
        WHERE id = ?
    `);
    return stmt.get(reportId) as ExpenseReport | null;
}

/**
 * Get all expense reports
 */
export function getAllExpenseReports(limit: number = 50): ExpenseReport[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM expense_reports
        ORDER BY report_date DESC, created_at DESC
        LIMIT ?
    `);
    return stmt.all(limit) as ExpenseReport[];
}

/**
 * Get expenses for a specific report
 */
export function getExpensesForReport(reportId: number): StoredExpense[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT e.*
        FROM expenses e
        INNER JOIN report_expenses re ON e.id = re.expense_id
        WHERE re.report_id = ?
        ORDER BY e.date DESC
    `);
    return stmt.all(reportId) as StoredExpense[];
}

/**
 * Get expense statistics
 */
export function getExpenseStats(): {
    total_expenses: number;
    total_amount: number;
    avg_amount: number;
    expense_count: number;
} {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT
            COALESCE(SUM(amount), 0) as total_amount,
            COALESCE(AVG(amount), 0) as avg_amount,
            COUNT(*) as expense_count
        FROM expenses
    `);
    return stmt.get() as any;
}

/**
 * Search expenses by description
 */
export function searchExpenses(searchTerm: string, limit: number = 50): StoredExpense[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM expenses
        WHERE description LIKE ? OR file_name LIKE ? OR notes LIKE ?
        ORDER BY date DESC
        LIMIT ?
    `);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term, term, limit) as StoredExpense[];
}

/**
 * Update expense
 */
export function updateExpense(
    expenseId: number,
    updates: Partial<Omit<StoredExpense, "id" | "created_at" | "updated_at">>
): void {
    const db = getDatabase();

    const fields = Object.keys(updates).filter(k => updates[k as keyof typeof updates] !== undefined);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(", ");
    const values = fields.map(f => updates[f as keyof typeof updates]);

    const stmt = db.prepare(`
        UPDATE expenses
        SET ${setClause}, updated_at = datetime('now')
        WHERE id = ?
    `);

    stmt.run(...values, expenseId);
}

/**
 * Delete expense
 */
export function deleteExpense(expenseId: number): void {
    const db = getDatabase();
    const stmt = db.prepare(`
        DELETE FROM expenses WHERE id = ?
    `);
    stmt.run(expenseId);
}

/**
 * Delete expense report and all its linked expenses
 */
export function deleteExpenseReport(reportId: number): void {
    const db = getDatabase();

    const transaction = db.transaction(() => {
        // Get all expense IDs linked to this report
        const expenseIds = db.prepare(`
            SELECT expense_id FROM report_expenses WHERE report_id = ?
        `).all(reportId) as { expense_id: number }[];

        // Delete the report (cascade will delete report_expenses entries)
        db.prepare(`
            DELETE FROM expense_reports WHERE id = ?
        `).run(reportId);

        // Delete the expenses that were only in this report
        for (const { expense_id } of expenseIds) {
            // Check if this expense is linked to other reports
            const otherLinks = db.prepare(`
                SELECT COUNT(*) as count FROM report_expenses WHERE expense_id = ?
            `).get(expense_id) as { count: number };

            // If not linked to any other reports, delete the expense
            if (otherLinks.count === 0) {
                db.prepare(`
                    DELETE FROM expenses WHERE id = ?
                `).run(expense_id);
            }
        }
    });

    transaction();
}

/**
 * Delete expense report only (keep expenses)
 */
export function deleteExpenseReportOnly(reportId: number): void {
    const db = getDatabase();
    // Foreign key cascade will handle report_expenses deletion
    const stmt = db.prepare(`
        DELETE FROM expense_reports WHERE id = ?
    `);
    stmt.run(reportId);
}

/**
 * Get comprehensive expense statistics including category breakdown
 */
export function getExpenseStatistics(): {
    total_reports: number;
    total_expenses: number;
    total_amount: number;
    categories: {
        meals: { count: number; amount: number };
        travel: { count: number; amount: number };
        accommodation: { count: number; amount: number };
        other: { count: number; amount: number };
    };
} {
    const db = getDatabase();

    // Get total reports count
    const reportStats = db.prepare(`
        SELECT COUNT(*) as total_reports
        FROM expense_reports
    `).get() as { total_reports: number };

    // Get total expenses linked to reports
    const expenseStats = db.prepare(`
        SELECT
            COUNT(DISTINCT e.id) as total_expenses,
            COALESCE(SUM(e.amount), 0) as total_amount
        FROM expenses e
        INNER JOIN report_expenses re ON e.id = re.expense_id
    `).get() as { total_expenses: number; total_amount: number };

    // Get category breakdown - categorize by keywords in description
    const categoryStats = db.prepare(`
        SELECT
            e.description,
            e.amount
        FROM expenses e
        INNER JOIN report_expenses re ON e.id = re.expense_id
    `).all() as { description: string; amount: number }[];

    // Categorize expenses based on keywords
    const categories = {
        meals: { count: 0, amount: 0 },
        travel: { count: 0, amount: 0 },
        accommodation: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 }
    };

    const mealsKeywords = ['meal', 'meals', 'food', 'restaurant', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'dining', 'eat', 'nando', "nando's", 'mcdonald', 'kfc', 'subway', 'greggs', 'pret', 'starbucks', 'costa'];
    const travelKeywords = ['travel', 'train', 'bus', 'taxi', 'uber', 'flight', 'transport', 'fare', 'parking', 'fuel', 'petrol', 'gas', 'underground', 'trainline', 'lyft', 'bolt', 'lime', 'rail'];
    const accommodationKeywords = ['hotel', 'hotels', 'accommodation', 'lodging', 'stay', 'hostel', 'airbnb', 'room', 'premier inn', 'travelodge', 'holiday inn', 'marriott', 'hilton'];

    for (const expense of categoryStats) {
        const desc = expense.description.toLowerCase();
        let categorized = false;

        if (mealsKeywords.some(keyword => desc.includes(keyword))) {
            categories.meals.count++;
            categories.meals.amount += expense.amount;
            categorized = true;
        } else if (travelKeywords.some(keyword => desc.includes(keyword))) {
            categories.travel.count++;
            categories.travel.amount += expense.amount;
            categorized = true;
        } else if (accommodationKeywords.some(keyword => desc.includes(keyword))) {
            categories.accommodation.count++;
            categories.accommodation.amount += expense.amount;
            categorized = true;
        }

        if (!categorized) {
            categories.other.count++;
            categories.other.amount += expense.amount;
        }
    }

    return {
        total_reports: reportStats.total_reports,
        total_expenses: expenseStats.total_expenses,
        total_amount: expenseStats.total_amount,
        categories
    };
}
