import { GoogleGenAI } from "@google/genai";
import path from "path";
import type { FileData } from "@/types/common";

export interface ProcessedPayslip {
    fileName: string;
    payDate: string;
    netPay: number;
    grossPay?: number;
    taxPaid?: number;
    niPaid?: number;
    pensionContribution?: number;
    otherDeductions?: number;
}

/**
 * Process payslip PDF files using Gemini AI
 */
export async function processPayslips(files: FileData[]): Promise<ProcessedPayslip[]> {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("API key not configured");

    const client = new GoogleGenAI({ apiKey });
    const results: ProcessedPayslip[] = [];

    for (const file of files) {
        try {
            const base64Data = file.buffer.toString("base64");

            const prompt = `
Extract the following financial information from this payslip:

1) Pay Date (in YYYY-MM-DD format)
2) Net Payment / Total Payment (the final take-home amount after all deductions) - required
3) Gross Pay / Total Payments (before deductions) - optional
4) PAYE Income Tax / Tax Paid (total tax deducted) - optional
5) National Insurance / NI (total NI contributions) - optional
6) Employer's Pension Deductions / Pension Contribution (employee pension deductions) - optional
7) Other Deductions (any other deductions not covered above, sum them up) - optional

IMPORTANT:
- All amounts should be numbers only without currency symbols
- Assume GBP £ currency
- For the pension, use the EMPLOYEE'S contribution (deduction), NOT the employer's contribution
- If a value is not found or not applicable, omit it from the JSON

Return ONLY raw JSON in this exact format:
{
  "payDate": "YYYY-MM-DD",
  "netPay": 0.00,
  "grossPay": 0.00,
  "taxPaid": 0.00,
  "niPaid": 0.00,
  "pensionContribution": 0.00,
  "otherDeductions": 0.00
}
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

                // Clean and parse amounts
                const cleanAmount = (value: any): number | undefined => {
                    if (value === undefined || value === null || value === "") return undefined;
                    if (typeof value === "string") {
                        const cleaned = parseFloat(value.replace(/[^0-9.-]+/g, ""));
                        return isNaN(cleaned) ? undefined : cleaned;
                    }
                    return typeof value === "number" ? value : undefined;
                };

                const netPay = cleanAmount(data.netPay);
                if (!netPay) {
                    throw new Error("Net pay is required but not found");
                }

                results.push({
                    fileName: path.basename(file.name),
                    payDate: data.payDate || "N/A",
                    netPay: netPay,
                    grossPay: cleanAmount(data.grossPay),
                    taxPaid: cleanAmount(data.taxPaid),
                    niPaid: cleanAmount(data.niPaid),
                    pensionContribution: cleanAmount(data.pensionContribution),
                    otherDeductions: cleanAmount(data.otherDeductions),
                });
            } catch (e) {
                console.error(`Failed to parse JSON for ${file.name}:`, text, e);
                results.push({
                    fileName: path.basename(file.name),
                    payDate: "Error",
                    netPay: 0,
                });
            }
        } catch (err) {
            console.error(`Error processing file ${file.name}:`, err);
            results.push({
                fileName: path.basename(file.name),
                payDate: "Error",
                netPay: 0,
            });
        }
    }
    return results;
}
