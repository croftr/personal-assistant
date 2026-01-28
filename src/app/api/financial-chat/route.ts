import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error("API key not configured");

        const ai = new GoogleGenAI({ apiKey });
        const { messages, financialData } = await req.json();

        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }]
        }));

        const lastMessage = messages[messages.length - 1].content;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                ...history,
                { role: "user", parts: [{ text: lastMessage }] }
            ],
            config: {
                systemInstruction: `You are a professional financial advisor assistant. 
            You have access to the user's financial data.
            
            Current Financial Context:
            Pensions: ${JSON.stringify(financialData.pensions, null, 2)}
            Bank Accounts: ${JSON.stringify(financialData.bankAccounts, null, 2)}
            Financial Year Summaries: ${JSON.stringify(financialData.financialYears, null, 2)}
            Tax Returns: ${JSON.stringify(financialData.taxReturns, null, 2)}
            
            Use this data to answer the user's questions accurately and provide strategic advice. 
            Be concise, professional, and helpful.
            If the user asks questions not related to their finances, politely guide them back to financial topics.`
            }
        });

        const text = response.text;

        return NextResponse.json({ success: true, text });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
