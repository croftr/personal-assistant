import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error("API key not configured");

        const client = new GoogleGenAI({ apiKey });
        const body = await req.json();
        const { payslips } = body;

        const prompt = `
            You are a helpful personal finance AI assistant. 
            The user's name is Rob.
            Analyze the following recent payslip data and provide a warm, professional welcome message.
            The message should start with "Welcome Rob, do you want to know anything about your finances?" or something very similar.
            Follow this with a very brief (1-2 sentences) high-level summary of their recent revenue/earnings based on the provided payslips.
            
            Recent Payslips data:
            ${JSON.stringify(payslips.slice(0, 3), null, 2)}
            
            Return the response in raw JSON format:
            {
              "message": "..."
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
        console.error("Welcome Summary Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
