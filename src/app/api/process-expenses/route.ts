import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import {
    validateDirectory,
    getValidFilesInDirectory,
    readFilesFromDirectory,
    convertUploadedFiles
} from "@/lib/common/file-handler";
import { generateCsv } from "@/lib/common/csv-formatter";
import { processReceipts } from "@/lib/expenses/receipt-processor";
import { saveExpenses, createExpenseReport, linkExpensesToReport } from "@/lib/expenses/expense-db-service";


export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        // ---------------------------------------------------------
        // MODE 1: FILE UPLOAD (Browser Picker)
        // ---------------------------------------------------------
        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const rawFiles = formData.getAll("files") as File[];
            const outputMode = formData.get("outputMode") as string || "save";

            if (!rawFiles || rawFiles.length === 0) {
                return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
            }

            // Convert uploaded files to FileData type
            const filesToProcess = await convertUploadedFiles(rawFiles);
            const results = await processReceipts(filesToProcess);
            const csvContent = generateCsv(results);

            // Save expenses to database
            const expenseIds = saveExpenses(results);

            // Create expense report
            const totalAmount = results.reduce((sum, exp) => sum + exp.amount, 0);
            const today = new Date().toISOString().split("T")[0];
            const reportId = createExpenseReport({
                report_name: `Expense Report - ${today}`,
                report_date: today,
                total_amount: totalAmount,
                expense_count: results.length,
                currency: "GBP"
            });

            // Link expenses to report
            linkExpensesToReport(reportId, expenseIds);

            return NextResponse.json({
                success: true,
                csvContent,
                count: results.length,
                outputMode,
                reportId,
                expenseIds
            });
        }

        // ---------------------------------------------------------
        // MODE 2: SERVER PATH (Local Filesystem)
        // ---------------------------------------------------------
        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { path: dirPath, action, outputMode } = body;

            if (!dirPath) {
                return NextResponse.json({ error: "Directory path is required" }, { status: 400 });
            }

            // Validate Directory
            try {
                await validateDirectory(dirPath);
            } catch (e: any) {
                return NextResponse.json({ error: e.message }, { status: 404 });
            }

            // Get list of valid files
            const receiptFiles = await getValidFilesInDirectory(dirPath);

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
                const filesToProcess = await readFilesFromDirectory(dirPath);
                const results = await processReceipts(filesToProcess);
                const csvContent = generateCsv(results);

                // Save expenses to database
                const expenseIds = saveExpenses(results);

                // Only write to disk if outputMode is "save" (default behavior for backwards compatibility)
                let csvPath = null;
                if (outputMode !== "download") {
                    const today = new Date().toLocaleDateString("en-GB").split("/").join("-");
                    const outputPath = `${dirPath}\\expenses_${today}.csv`;
                    await fs.writeFile(outputPath, csvContent, "utf-8");
                    csvPath = outputPath;
                }

                // Create expense report
                const totalAmount = results.reduce((sum, exp) => sum + exp.amount, 0);
                const today = new Date().toISOString().split("T")[0];
                const reportId = createExpenseReport({
                    report_name: `Expense Report - ${today}`,
                    report_date: today,
                    total_amount: totalAmount,
                    expense_count: results.length,
                    csv_path: csvPath || undefined,
                    currency: "GBP"
                });

                // Link expenses to report
                linkExpensesToReport(reportId, expenseIds);

                return NextResponse.json({
                    success: true,
                    csvPath,
                    csvContent: csvContent,
                    outputMode: outputMode || "save",
                    reportId,
                    expenseIds
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
