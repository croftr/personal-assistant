import { NextRequest, NextResponse } from "next/server";
import { convertUploadedFiles } from "@/lib/common/file-handler";
import { processPayslips } from "@/lib/payslips/payslip-processor";
import { upsertFinancialYearSummary, calculateFinancialYear } from "@/lib/payslips/financial-year-db-service";

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const rawFiles = formData.getAll("files") as File[];

            if (!rawFiles || rawFiles.length === 0) {
                return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
            }

            // Convert uploaded files to FileData type
            const filesToProcess = await convertUploadedFiles(rawFiles);

            // Process payslips using AI
            const results = await processPayslips(filesToProcess);

            // Process each payslip and update financial year summaries
            const updatedYears: string[] = [];
            const skippedPayslips: string[] = [];
            const errors: string[] = [];

            for (const result of results) {
                try {
                    // Check if year to date data is available
                    if (!result.yearToDate) {
                        errors.push(`${result.fileName}: Missing year-to-date data`);
                        continue;
                    }

                    // Calculate financial year from pay date
                    const financialYear = calculateFinancialYear(result.payDate);

                    // Upsert financial year summary
                    const upsertResult = upsertFinancialYearSummary({
                        financial_year: financialYear,
                        last_payslip_date: result.payDate,
                        total_taxable_pay: result.yearToDate.totalTaxablePay,
                        total_taxable_ni_pay: result.yearToDate.totalTaxableNIPay,
                        total_paye_tax: result.yearToDate.totalPAYETax,
                        total_ni: result.yearToDate.totalNI
                    });

                    if (upsertResult.success && upsertResult.isNewer) {
                        updatedYears.push(financialYear);
                    } else if (!upsertResult.isNewer) {
                        skippedPayslips.push(`${result.fileName} (${upsertResult.message})`);
                    }
                } catch (error: any) {
                    errors.push(`${result.fileName}: ${error.message}`);
                }
            }

            return NextResponse.json({
                success: true,
                results,
                updatedYears: [...new Set(updatedYears)],
                skippedPayslips,
                errors,
                count: results.length,
                updated: updatedYears.length,
                skipped: skippedPayslips.length
            });
        }

        return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
