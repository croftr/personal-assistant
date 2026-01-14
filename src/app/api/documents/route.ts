import { NextRequest, NextResponse } from "next/server";
import {
    getRecentDocuments,
    getDocumentsByAssistant,
    searchDocuments,
    getDocumentById,
    getDocumentContent
} from "@/lib/common/document-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const documentId = searchParams.get("id");
        const assistant = searchParams.get("assistant");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "50");

        if (documentId) {
            // Get specific document
            const document = getDocumentById(parseInt(documentId));

            if (!document) {
                return NextResponse.json(
                    { error: "Document not found" },
                    { status: 404 }
                );
            }

            // Get document content if requested
            if (action === "withContent") {
                const content = getDocumentContent(parseInt(documentId));
                return NextResponse.json({
                    success: true,
                    document,
                    content
                });
            }

            return NextResponse.json({ success: true, document });
        }

        // Get documents based on filters
        if (action === "search" && search) {
            const results = searchDocuments(search, limit);
            return NextResponse.json({ success: true, documents: results });
        }

        if (assistant) {
            const documents = getDocumentsByAssistant(assistant, limit);
            return NextResponse.json({ success: true, documents });
        }

        // Default: get recent documents
        const documents = getRecentDocuments(limit);
        return NextResponse.json({ success: true, documents });

    } catch (error: any) {
        console.error("Documents API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch documents" },
            { status: 500 }
        );
    }
}
