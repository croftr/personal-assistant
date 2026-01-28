import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error("API key not configured");

        const client = new GoogleGenAI({ apiKey });
        let body;
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const fd = await req.formData();
            const dataStr = fd.get("data");
            body = dataStr ? JSON.parse(dataStr as string) : { pensions: [], financialYears: [], bankAccounts: [] };
        } else {
            body = await req.json();
        }

        const { pensions, financialYears, bankAccounts } = body;

        const prompt = `
            As a professional financial advisor, analyze the following financial data and provide a concise summary and strategic recommendations.

            Pensions:
            ${JSON.stringify(pensions, null, 2)}

            Financial Year Summaries (Year-to-Date Tax and Earnings):
            ${JSON.stringify(financialYears, null, 2)}

            Bank Accounts:
            ${JSON.stringify(bankAccounts, null, 2)}

            Please provide:
            1. A brief "Financial Health Score" (out of 10).
            2. A one-sentence summary of the current financial status.
            3. Three key recommendations for improvement (e.g., tax efficiency, savings rate, pension consolidation).

            Return the response in raw JSON format:
            {
              "score": number,
              "summary": "...",
              "recommendations": ["...", "...", "..."]
            }
        `;

        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });

        let text = response.text || "";
        text = text.replace(/```json|```/g, "").trim();

        const result = JSON.parse(text);

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error("Summary Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
