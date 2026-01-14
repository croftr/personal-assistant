import { GoogleGenAI } from "@google/genai";
import path from "path";
import type { FileData } from "@/types/common";
import type { ProcessedExpense } from "@/types/expenses";

/**
 * Process receipt files using Gemini AI
 */
export async function processReceipts(files: FileData[]): Promise<ProcessedExpense[]> {
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
                results.push({
                    fileName: path.basename(file.name),
                    description: path.basename(file.name),
                    date: "Error",
                    amount: 0
                });
            }
        } catch (err) {
            console.error(`Error processing file ${file.name}:`, err);
            results.push({
                fileName: path.basename(file.name),
                description: `Error reading ${path.basename(file.name)}`,
                date: "Error",
                amount: 0
            });
        }
    }
    return results;
}
