import { NextRequest, NextResponse } from "next/server";
import { createZipFromDirectory, createZipFromFiles } from "@/lib/common/zip-service";

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        // Browser Mode: Files uploaded
        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const receiptFiles = formData.getAll("receipts") as File[];
            const csvFile = formData.get("csv") as File;

            if (!csvFile) {
                return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
            }

            const { zipBuffer, fileName } = await createZipFromFiles(receiptFiles, csvFile);
            const base64Zip = zipBuffer.toString("base64");

            return NextResponse.json({
                success: true,
                zipData: base64Zip,
                fileName: fileName,
            });
        }

        // Server Path Mode: Read from disk
        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { folderPath, csvContent } = body;

            if (!folderPath) {
                return NextResponse.json(
                    { error: "Folder path is required" },
                    { status: 400 }
                );
            }

            const { zipBuffer, fileName } = await createZipFromDirectory(folderPath, csvContent);
            const base64Zip = zipBuffer.toString("base64");

            return NextResponse.json({
                success: true,
                zipData: base64Zip,
                fileName: fileName,
            });
        }

        return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
    } catch (error: any) {
        console.error("ZIP Creation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create ZIP" },
            { status: 500 }
        );
    }
}
