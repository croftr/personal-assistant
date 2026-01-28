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
    yearToDate?: {
        totalTaxablePay: number;
        totalTaxableNIPay: number;
        totalPAYETax: number;
        totalNI: number;
    };
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

1) Pay Date (in YYYY-MM-DD format) - required
2) Net Payment / Total Payment (the final take-home amount after all deductions) - required

YEAR TO DATE SECTION (usually found in bottom right box of the payslip):
3) Total Taxable Pay (Year to Date) - required
4) Total Taxable NI Pay (Year to Date) - required
5) Total PAYE Income Tax (Year to Date) - required
6) Total National Insurance (Year to Date) - required

IMPORTANT:
- All amounts should be numbers only without currency symbols
- Assume GBP £ currency
- The Year to Date values should come from the "Year to Date" section on the payslip (typically in the bottom right)
- If Year to Date values are not found, omit the yearToDate object entirely

Return ONLY raw JSON in this exact format:
{
  "payDate": "YYYY-MM-DD",
  "netPay": 0.00,
  "yearToDate": {
    "totalTaxablePay": 0.00,
    "totalTaxableNIPay": 0.00,
    "totalPAYETax": 0.00,
    "totalNI": 0.00
  }
}
`;

            const response = await client.models.generateContent({
                model: "gemini-2.0-flash",
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

                const processedPayslip: ProcessedPayslip = {
                    fileName: path.basename(file.name),
                    payDate: data.payDate || "N/A",
                    netPay: netPay,
                };

                // Add year to date data if available
                if (data.yearToDate) {
                    const totalTaxablePay = cleanAmount(data.yearToDate.totalTaxablePay);
                    const totalTaxableNIPay = cleanAmount(data.yearToDate.totalTaxableNIPay);
                    const totalPAYETax = cleanAmount(data.yearToDate.totalPAYETax);
                    const totalNI = cleanAmount(data.yearToDate.totalNI);

                    if (totalTaxablePay && totalTaxableNIPay && totalPAYETax !== undefined && totalNI !== undefined) {
                        processedPayslip.yearToDate = {
                            totalTaxablePay,
                            totalTaxableNIPay,
                            totalPAYETax,
                            totalNI
                        };
                    }
                }

                results.push(processedPayslip);
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
