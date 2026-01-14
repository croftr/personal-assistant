import { getDatabase } from "./database";
import type { Document, DocumentContent } from "@/types/common";

/**
 * Create a new document record
 */
export function createDocument(data: {
    file_name: string;
    file_path?: string;
    file_type: string;
    file_size?: number;
    assistant_type: string;
    metadata?: any;
}): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO documents (file_name, file_path, file_type, file_size, assistant_type, metadata, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
        data.file_name,
        data.file_path || null,
        data.file_type,
        data.file_size || null,
        data.assistant_type,
        data.metadata ? JSON.stringify(data.metadata) : null
    );

    return result.lastInsertRowid as number;
}

/**
 * Update document status
 */
export function updateDocumentStatus(
    documentId: number,
    status: "pending" | "processing" | "completed" | "error"
): void {
    const db = getDatabase();
    const stmt = db.prepare(`
        UPDATE documents
        SET status = ?,
            processed_date = CASE WHEN ? = 'completed' THEN datetime('now') ELSE processed_date END,
            updated_at = datetime('now')
        WHERE id = ?
    `);
    stmt.run(status, status, documentId);
}

/**
 * Store document content
 */
export function storeDocumentContent(data: {
    document_id: number;
    content_type: string;
    content: string;
    extracted_data?: any;
}): number {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO document_content (document_id, content_type, content, extracted_data)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
        data.document_id,
        data.content_type,
        data.content,
        data.extracted_data ? JSON.stringify(data.extracted_data) : null
    );

    return result.lastInsertRowid as number;
}

/**
 * Get document by ID
 */
export function getDocumentById(documentId: number): Document | null {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM documents WHERE id = ?
    `);
    return stmt.get(documentId) as Document | null;
}

/**
 * Get documents by assistant type
 */
export function getDocumentsByAssistant(
    assistantType: string,
    limit: number = 50
): Document[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM documents
        WHERE assistant_type = ?
        ORDER BY upload_date DESC
        LIMIT ?
    `);
    return stmt.all(assistantType, limit) as Document[];
}

/**
 * Get document content
 */
export function getDocumentContent(documentId: number): DocumentContent[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM document_content
        WHERE document_id = ?
        ORDER BY created_at DESC
    `);
    return stmt.all(documentId) as DocumentContent[];
}

/**
 * Search documents by filename
 */
export function searchDocuments(searchTerm: string, limit: number = 50): Document[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM documents
        WHERE file_name LIKE ?
        ORDER BY upload_date DESC
        LIMIT ?
    `);
    return stmt.all(`%${searchTerm}%`, limit) as Document[];
}

/**
 * Get recent documents
 */
export function getRecentDocuments(limit: number = 20): Document[] {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM documents
        ORDER BY upload_date DESC
        LIMIT ?
    `);
    return stmt.all(limit) as Document[];
}

/**
 * Delete document and its content
 */
export function deleteDocument(documentId: number): void {
    const db = getDatabase();

    // Foreign key cascade will handle document_content deletion
    const stmt = db.prepare(`
        DELETE FROM documents WHERE id = ?
    `);
    stmt.run(documentId);
}
