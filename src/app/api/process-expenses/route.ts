import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";

// --- Types & Helpers ---

type FileData = {
    name: string;
    buffer: Buffer;
    mimeType: string;
};

type ProcessedExpense = {
    fileName: string;
    description: string;
    date: string;
    amount: number;
};

const isReceiptFile = (filename: string) => {
    const ext = path.extname(filename).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(ext);
};

const getMimeType = (filename: string) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".pdf") return "application/pdf";
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    return "image/jpeg";
};

// Core processing logic refactored for reuse
async function processReceipts(files: FileData[]): Promise<ProcessedExpense[]> {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("API key not configured");

    const client = new GoogleGenAI({ apiKey });
    const results: ProcessedExpense[] = [];

    for (const file of files) {
        try {
            const base64Data = file.buffer.toString("base64");

            const prompt = `
        Extract the following from this receipt:
        1) Description (vendor/item)
        2) Date (YYYY-MM-DD or N/A)
        3) Total Amount (Number only. Assume GBP £. Do not include currency symbol in the output number)
        
        Return ONLY raw JSON: { "description": "...", "date": "...", "amount": 0.00 }
      `;

            const response = await client.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: file.mimeType,
                                },
                            },
                        ],
                    },
                ],
            });

            let text = response.text || "";
            text = text.replace(/```json|```/g, "").trim();

            try {
                const data = JSON.parse(text);
                // Clean amount
                let amount = 0;
                if (typeof data.amount === "string") {
                    amount = parseFloat(data.amount.replace(/[^0-9.-]+/g, "")) || 0;
                } else {
                    amount = data.amount || 0;
                }

                results.push({
                    fileName: path.basename(file.name),
                    description: data.description || path.basename(file.name),
                    date: data.date || "N/A",
                    amount: amount,
                });
            } catch (e) {
                console.error(`Failed to parse JSON for ${file.name}:`, text);
                results.push({ fileName: path.basename(file.name), description: path.basename(file.name), date: "Error", amount: 0 });
            }
        } catch (err) {
            console.error(`Error processing file ${file.name}:`, err);
            results.push({ fileName: path.basename(file.name), description: `Error reading ${path.basename(file.name)}`, date: "Error", amount: 0 });
        }
    }
    return results;
}

// CSV Generation Helper
function generateCsv(data: ProcessedExpense[]): string {
    const today = new Date().toLocaleDateString("en-GB").split("/").join("-");
    let csvContent = `Expenses Report - Generated on ${today}\n\n`;
    csvContent += "Receipt Name,Description,Date,Amount (GBP)\n";

    let total = 0;
    data.forEach((res) => {
        const cleanName = (res.fileName || "").replace(/"/g, '""');
        const cleanDesc = (res.description || "").replace(/"/g, '""');
        const row = `"${cleanName}","${cleanDesc}","${res.date}",${res.amount.toFixed(2)}\n`;
        csvContent += row;
        total += res.amount;
    });

    csvContent += `\nTOTAL,,,${total.toFixed(2)}\n`;
    return csvContent;
}


// --- Main Handler ---

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        // ---------------------------------------------------------
        // MODE 1: FILE UPLOAD (Browser Picker)
        // ---------------------------------------------------------
        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const rawFiles = formData.getAll("files") as File[];

            if (!rawFiles || rawFiles.length === 0) {
                return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
            }

            // Convert standard Files to our FileData type
            const fileBufferPromises = rawFiles.map(async (f) => ({
                name: f.name,
                mimeType: f.type,
                buffer: Buffer.from(await f.arrayBuffer()),
            }));

            const filesToProcess = await Promise.all(fileBufferPromises);
            const results = await processReceipts(filesToProcess);
            const csvContent = generateCsv(results);

            return NextResponse.json({ success: true, csvContent, count: results.length });
        }

        // ---------------------------------------------------------
        // MODE 2: SERVER PATH (Local Filesystem)
        // ---------------------------------------------------------
        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { path: dirPath, action } = body;

            if (!dirPath) {
                return NextResponse.json({ error: "Directory path is required" }, { status: 400 });
            }

            // Validate Directory
            try {
                const stats = await fs.stat(dirPath);
                if (!stats.isDirectory()) {
                    return NextResponse.json({ error: "Path is not a directory" }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: "Directory not found" }, { status: 404 });
            }

            // Read Directory
            const allFiles = await fs.readdir(dirPath);
            const visibleFiles = allFiles.filter(item => !item.startsWith("."));
            const receiptFiles = visibleFiles.filter(item => isReceiptFile(item));

            // Action: SCAN
            if (action === "scan") {
                return NextResponse.json({
                    count: receiptFiles.length,
                    files: receiptFiles
                });
            }

            // Action: PROCESS
            if (action === "process") {
                // Read files from disk
                const fileReadPromises = receiptFiles.map(async (fileName) => {
                    const fullPath = path.join(dirPath, fileName);
                    const buffer = await fs.readFile(fullPath);
                    return {
                        name: fileName,
                        mimeType: getMimeType(fileName),
                        buffer: buffer
                    };
                });

                const filesToProcess = await Promise.all(fileReadPromises);
                const results = await processReceipts(filesToProcess);
                const csvContent = generateCsv(results);

                // Write to disk
                const today = new Date().toLocaleDateString("en-GB").split("/").join("-");
                const outputPath = path.join(dirPath, `expenses_${today}.csv`);
                await fs.writeFile(outputPath, csvContent, "utf-8");

                return NextResponse.json({
                    success: true,
                    csvPath: outputPath,
                    csvContent: csvContent
                });
            }

            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
