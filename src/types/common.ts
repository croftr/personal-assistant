// Common types shared across all assistants

export type FileData = {
    name: string;
    buffer: Buffer;
    mimeType: string;
};

export type EmailConfig = {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
};

export type EmailParams = {
    recipient: string;
    subject: string;
    message: string;
    zipData?: string;
    fileName?: string;
};

// Database types

export type Document = {
    id: number;
    file_name: string;
    file_path: string | null;
    file_type: string;
    file_size: number | null;
    upload_date: string;
    processed_date: string | null;
    assistant_type: string;
    status: "pending" | "processing" | "completed" | "error";
    metadata: string | null;
    created_at: string;
    updated_at: string;
};

export type DocumentContent = {
    id: number;
    document_id: number;
    content_type: string;
    content: string;
    extracted_data: string | null;
    created_at: string;
};

export type StoredExpense = {
    id: number;
    document_id: number | null;
    file_name: string;
    description: string;
    date: string;
    amount: number;
    currency: string;
    category: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type ExpenseReport = {
    id: number;
    report_name: string;
    report_date: string;
    total_amount: number;
    currency: string;
    expense_count: number;
    csv_path: string | null;
    zip_path: string | null;
    created_at: string;
};
