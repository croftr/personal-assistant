import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs/promises";
import path from "path";

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

            const zip = new JSZip();

            // Add CSV
            const csvBuffer = Buffer.from(await csvFile.arrayBuffer());
            zip.file(csvFile.name, csvBuffer);

            // Add receipts
            const receiptsFolder = zip.folder("receipts");
            if (receiptsFolder) {
                for (const file of receiptFiles) {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    receiptsFolder.file(file.name, buffer);
                }
            }

            // Generate zip
            const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
            const base64Zip = zipBuffer.toString("base64");

            const today = new Date().toISOString().split("T")[0];
            const zipFileName = `expenses_${today}.zip`;

            return NextResponse.json({
                success: true,
                zipData: base64Zip,
                fileName: zipFileName,
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

            const zip = new JSZip();

            // Add CSV if provided
            if (csvContent) {
                const today = new Date().toISOString().split("T")[0];
                const csvFileName = `expenses_${today}.csv`;
                zip.file(csvFileName, csvContent);
            }

            // Read and add receipt files
            const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
            const allFiles = await fs.readdir(folderPath);
            const receiptFiles = allFiles.filter((file) => {
                const ext = path.extname(file).toLowerCase();
                return validExtensions.includes(ext) && !file.startsWith(".");
            });

            const receiptsFolder = zip.folder("receipts");
            if (receiptsFolder) {
                for (const fileName of receiptFiles) {
                    const filePath = path.join(folderPath, fileName);
                    const buffer = await fs.readFile(filePath);
                    receiptsFolder.file(fileName, buffer);
                }
            }

            // Generate zip
            const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
            const base64Zip = zipBuffer.toString("base64");
            const today = new Date().toISOString().split("T")[0];
            const zipFileName = `expenses_${today}.zip`;

            return NextResponse.json({
                success: true,
                zipData: base64Zip,
                fileName: zipFileName,
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
