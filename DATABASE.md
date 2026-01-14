# Database Implementation

## Overview

The Personal Assistant now includes a SQLite database using `better-sqlite3` for storing and retrieving data. This allows you to:
- Store processed expense data for future reference
- Keep a history of all documents processed
- Query and analyze historical data
- Provide summaries and advice based on stored information

## Database Location

The database file is located at: `data/personal-assistant.db`

This directory is ignored by git to keep your personal data private.

## Schema

### Tables

#### `documents`
Stores metadata about all uploaded/processed documents.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| file_name | TEXT | Original filename |
| file_path | TEXT | Path to file on disk (optional) |
| file_type | TEXT | File extension (pdf, xlsx, docx, jpg, etc.) |
| file_size | INTEGER | File size in bytes |
| upload_date | TEXT | When file was uploaded |
| processed_date | TEXT | When file was processed |
| assistant_type | TEXT | Which assistant processed it (expenses, accountant, etc.) |
| status | TEXT | pending, processing, completed, error |
| metadata | TEXT | JSON string with additional metadata |
| created_at | TEXT | Record creation timestamp |
| updated_at | TEXT | Last update timestamp |

#### `document_content`
Stores extracted text/data from documents.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| document_id | INTEGER | Foreign key to documents table |
| content_type | TEXT | Type of content (text, json, etc.) |
| content | TEXT | Extracted content |
| extracted_data | TEXT | JSON with structured extracted data |
| created_at | TEXT | Record creation timestamp |

#### `expenses`
Stores individual expense records.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| document_id | INTEGER | Optional link to source document |
| file_name | TEXT | Receipt filename |
| description | TEXT | Expense description (vendor/item) |
| date | TEXT | Expense date (YYYY-MM-DD) |
| amount | REAL | Expense amount |
| currency | TEXT | Currency code (default: GBP) |
| category | TEXT | Optional category |
| notes | TEXT | Optional notes |
| created_at | TEXT | Record creation timestamp |
| updated_at | TEXT | Last update timestamp |

#### `expense_reports`
Stores generated expense reports.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| report_name | TEXT | Report name |
| report_date | TEXT | Report date |
| total_amount | REAL | Total of all expenses in report |
| currency | TEXT | Currency code |
| expense_count | INTEGER | Number of expenses |
| csv_path | TEXT | Path to generated CSV file |
| zip_path | TEXT | Path to generated ZIP file |
| created_at | TEXT | Record creation timestamp |

#### `report_expenses`
Links expenses to reports (many-to-many relationship).

| Column | Type | Description |
|--------|------|-------------|
| report_id | INTEGER | Foreign key to expense_reports |
| expense_id | INTEGER | Foreign key to expenses |

## Services

### Database Service (`src/lib/common/database.ts`)

Core database functionality:
- `getDatabase()` - Get or create database connection
- `closeDatabase()` - Close database connection
- `executeQuery()` - Execute SELECT queries
- `executeModification()` - Execute INSERT/UPDATE/DELETE
- `executeTransaction()` - Run multiple statements in transaction

### Document Service (`src/lib/common/document-service.ts`)

Manage documents:
- `createDocument()` - Create new document record
- `updateDocumentStatus()` - Update processing status
- `storeDocumentContent()` - Store extracted content
- `getDocumentById()` - Retrieve document by ID
- `getDocumentsByAssistant()` - Get documents for specific assistant
- `searchDocuments()` - Search by filename
- `getRecentDocuments()` - Get recently added documents
- `deleteDocument()` - Remove document and its content

### Expense Database Service (`src/lib/expenses/expense-db-service.ts`)

Manage expenses:
- `saveExpense()` - Save single expense
- `saveExpenses()` - Save multiple expenses in transaction
- `createExpenseReport()` - Create expense report
- `linkExpensesToReport()` - Link expenses to report
- `getAllExpenses()` - Get all expenses
- `getExpensesByDateRange()` - Filter by date range
- `searchExpenses()` - Search by description
- `getExpenseStats()` - Get summary statistics
- `updateExpense()` - Update expense record
- `deleteExpense()` - Remove expense

## API Endpoints

### GET /api/expenses

Query expenses:

```javascript
// Get all expenses
fetch('/api/expenses')

// Get expenses by date range
fetch('/api/expenses?action=dateRange&startDate=2024-01-01&endDate=2024-12-31')

// Search expenses
fetch('/api/expenses?action=search&search=amazon')

// Get expense statistics
fetch('/api/expenses?action=stats')
```

### GET /api/expense-reports

Query expense reports:

```javascript
// Get all reports
fetch('/api/expense-reports')

// Get specific report
fetch('/api/expense-reports?id=1')

// Get report with expenses
fetch('/api/expense-reports?id=1&includeExpenses=true')
```

### GET /api/documents

Query documents:

```javascript
// Get recent documents
fetch('/api/documents')

// Get document by ID
fetch('/api/documents?id=1')

// Get document with content
fetch('/api/documents?id=1&action=withContent')

// Get documents by assistant
fetch('/api/documents?assistant=expenses')

// Search documents
fetch('/api/documents?action=search&search=receipt')
```

## Integration

### Expense Processor

The expense processor now automatically:
1. Saves all processed expenses to the database
2. Creates an expense report record
3. Links expenses to the report
4. Returns database IDs in the response

Example response:
```json
{
  "success": true,
  "csvContent": "...",
  "count": 5,
  "reportId": 123,
  "expenseIds": [1, 2, 3, 4, 5]
}
```

## Future Enhancements

### Document Processing
The database is designed to support future document types:
- PDF invoices and statements
- Excel/Word financial documents
- Bank statements
- Tax documents

### Accountant Assistant
Will use the database to:
- Store analyzed financial documents
- Track financial trends
- Generate insights and advice
- Create custom reports

### Data Analysis
Potential future features:
- Expense categorization
- Spending trends over time
- Budget tracking
- Tax preparation assistance
- Financial advice based on historical data

## Querying Data

You can query the database directly or use the provided services:

```typescript
import { getDatabase } from "@/lib/common/database";
import { getAllExpenses, getExpenseStats } from "@/lib/expenses/expense-db-service";

// Using service (recommended)
const expenses = getAllExpenses(50);
const stats = getExpenseStats();

// Direct query (advanced)
const db = getDatabase();
const stmt = db.prepare("SELECT * FROM expenses WHERE amount > ?");
const bigExpenses = stmt.all(100);
```

## Backup

The database file is located at `data/personal-assistant.db`. To backup:

1. Copy the entire `data` folder
2. Or use SQLite backup command:
   ```bash
   sqlite3 data/personal-assistant.db ".backup data/backup.db"
   ```

## Performance

- Database uses WAL (Write-Ahead Logging) for better concurrent read performance
- Indexes created on frequently queried columns
- Transactions used for bulk operations
- Single-user optimized (no complex locking needed)

## Privacy

- Database stored locally on your machine
- No cloud synchronization
- Excluded from git via `.gitignore`
- Contains only data you explicitly process through the app
