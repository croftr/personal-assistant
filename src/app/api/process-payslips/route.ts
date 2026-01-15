import { NextRequest, NextResponse } from "next/server";
import { convertUploadedFiles } from "@/lib/common/file-handler";
import { processPayslips } from "@/lib/payslips/payslip-processor";
import { createPayslip, getPayslipByFileName, replacePayslip } from "@/lib/payslips/payslip-db-service";

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const rawFiles = formData.getAll("files") as File[];
            const confirmReplace = formData.get("confirmReplace") === "true";
            const filesToReplace = formData.get("filesToReplace");
            const replaceFileNames = filesToReplace ? JSON.parse(filesToReplace as string) : [];

            if (!rawFiles || rawFiles.length === 0) {
                return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
            }

            // Convert uploaded files to FileData type
            const filesToProcess = await convertUploadedFiles(rawFiles);

            // Process payslips using AI
            const results = await processPayslips(filesToProcess);

            // Check for duplicates
            const duplicates: string[] = [];
            const newPayslips: typeof results = [];

            for (const result of results) {
                const existing = getPayslipByFileName(result.fileName);
                if (existing) {
                    duplicates.push(result.fileName);
                } else {
                    newPayslips.push(result);
                }
            }

            // If duplicates found and not confirmed, return them for user confirmation
            if (duplicates.length > 0 && !confirmReplace) {
                return NextResponse.json({
                    success: false,
                    duplicates,
                    requiresConfirmation: true,
                    message: `${duplicates.length} payslip(s) already exist. Do you want to replace them?`
                });
            }

            // Save payslips to database
            const payslipIds: number[] = [];
            for (const result of results) {
                const shouldReplace = replaceFileNames.includes(result.fileName);
                const existing = getPayslipByFileName(result.fileName);

                if (existing && shouldReplace) {
                    // Replace existing payslip
                    const payslipId = replacePayslip(result.fileName, {
                        file_name: result.fileName,
                        pay_date: result.payDate,
                        net_pay: result.netPay,
                        gross_pay: result.grossPay,
                        tax_paid: result.taxPaid,
                        ni_paid: result.niPaid,
                        pension_contribution: result.pensionContribution,
                        other_deductions: result.otherDeductions
                    });
                    payslipIds.push(payslipId);
                } else if (!existing) {
                    // Create new payslip
                    const payslipId = createPayslip({
                        file_name: result.fileName,
                        pay_date: result.payDate,
                        net_pay: result.netPay,
                        gross_pay: result.grossPay,
                        tax_paid: result.taxPaid,
                        ni_paid: result.niPaid,
                        pension_contribution: result.pensionContribution,
                        other_deductions: result.otherDeductions
                    });
                    payslipIds.push(payslipId);
                }
            }

            return NextResponse.json({
                success: true,
                results,
                payslipIds,
                count: payslipIds.length,
                replaced: replaceFileNames.length,
                skipped: results.length - payslipIds.length
            });
        }

        return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
