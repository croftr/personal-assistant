# Personal Assistant Refactoring

## Version 2.0.0

This document describes the architectural changes made to transform the single-purpose expense processor into a multi-assistant personal assistant application.

## New Structure

```
personal-assistant/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Home page with assistant selection
│   │   ├── expenses/
│   │   │   └── page.tsx                  # Expense processor UI
│   │   ├── accountant/
│   │   │   └── page.tsx                  # Accountant assistant UI (template)
│   │   └── api/
│   │       ├── process-expenses/route.ts # Receipt processing endpoint
│   │       ├── create-zip/route.ts       # ZIP creation endpoint
│   │       └── send-email/route.ts       # Email sending endpoint
│   ├── lib/
│   │   ├── common/                       # Shared utilities
│   │   │   ├── file-handler.ts          # File reading, validation, conversion
│   │   │   ├── csv-formatter.ts         # CSV generation and parsing
│   │   │   ├── email-service.ts         # Email sending utilities
│   │   │   └── zip-service.ts           # ZIP creation utilities
│   │   ├── expenses/                     # Expense-specific logic
│   │   │   └── receipt-processor.ts     # AI receipt processing
│   │   └── accountant/                   # Accountant-specific logic (future)
│   ├── types/
│   │   ├── common.ts                     # Shared types (FileData, EmailConfig, etc.)
│   │   ├── expenses.ts                   # Expense-specific types
│   │   └── accountant.ts                 # Accountant-specific types
│   └── components/
│       └── common/
│           └── AssistantCard.tsx         # Reusable assistant card component
```

## Key Changes

### 1. Home Page
- New welcome screen: "Welcome, Rob - How can I help you today?"
- Displays two assistant cards: Expense Processor and Accountant
- Clean navigation to sub-assistants

### 2. Sub-Assistants
- **Expense Processor** (`/expenses`): Moved from root page, maintains all functionality
- **Accountant** (`/accountant`): New template page with placeholders for future features

### 3. Code Organization

#### Common Utilities (`src/lib/common/`)
Shared functionality used across multiple assistants:

- **file-handler.ts**
  - `isReceiptFile()` - File validation
  - `getMimeType()` - MIME type detection
  - `readFilesFromDirectory()` - Read files from disk
  - `convertUploadedFiles()` - Convert uploaded files to FileData
  - `validateDirectory()` - Directory validation
  - `getValidFilesInDirectory()` - Get list of valid files

- **csv-formatter.ts**
  - `generateCsv()` - Generate CSV from expense data
  - `parseCsvToRows()` - Parse CSV content into rows

- **email-service.ts**
  - `getEmailConfig()` - Get email configuration from env
  - `sendEmail()` - Send email with attachments

- **zip-service.ts**
  - `createZipFromDirectory()` - Create ZIP from folder path
  - `createZipFromFiles()` - Create ZIP from uploaded files

#### Specific Logic
- **expenses/receipt-processor.ts**: AI receipt processing using Gemini
- **accountant/**: Reserved for future accountant-specific logic

#### Type Definitions (`src/types/`)
- **common.ts**: FileData, EmailConfig, EmailParams
- **expenses.ts**: ProcessedExpense, ExpenseRow
- **accountant.ts**: AccountantTask (placeholder)

### 4. API Routes
Updated to use common utilities:
- `/api/process-expenses` - Uses `file-handler`, `csv-formatter`, `receipt-processor`
- `/api/create-zip` - Uses `zip-service`
- `/api/send-email` - Uses `email-service`

### 5. Components
- **AssistantCard**: Reusable card component for assistant selection

## Benefits

1. **Modularity**: Common functionality is reusable across assistants
2. **Scalability**: Easy to add new assistants (e.g., Budget Planner, Tax Assistant)
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: Centralized type definitions
5. **DRY Principle**: No code duplication

## Future Enhancements

### Accountant Assistant
The accountant assistant template includes placeholders for:
- Document analysis (PDFs, Excel files)
- Financial report generation (P&L, Cash Flow, Tax Summary)
- Email distribution using common email utilities
- File reading using common file handlers

### Additional Assistants
The structure supports easy addition of new assistants:
1. Create new route folder in `src/app/`
2. Add specific logic in `src/lib/[assistant-name]/`
3. Add types in `src/types/[assistant-name].ts`
4. Update home page to include new assistant card

## Testing

Build successful with no TypeScript errors:
```bash
npm run build
```

All routes compiled successfully:
- `/` - Home page
- `/expenses` - Expense processor
- `/accountant` - Accountant assistant
- `/api/process-expenses` - Receipt processing
- `/api/create-zip` - ZIP creation
- `/api/send-email` - Email sending

## Version History

- **v1.6.0**: Single-purpose expense processor
- **v2.0.0**: Multi-assistant architecture with Expense Processor and Accountant template
