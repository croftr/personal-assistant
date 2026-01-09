import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {


        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        console.log("Number of files to process ", files.length);

        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        console.log("key prefix is ", apiKey.slice(0, 5));

        const client = new GoogleGenAI({ apiKey });

        const results = [];

        for (const file of files) {
            console.log("lets loop");

            const bytes = await file.arrayBuffer();
            const base64Data = Buffer.from(bytes).toString("base64");

            console.log("file is ", file.name);


            const prompt = "Extract the following information from this receipt: 1) A brief description of what was bought or the vendor name, 2) The date of the transaction (in YYYY-MM-DD format if possible), 3) The total amount. Return the data in JSON format: { \"description\": \"...\", \"date\": \"...\", \"amount\": 0.00 }";

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
                                    mimeType: file.type,
                                },
                            },
                        ],
                    },
                ],
            });

            // Based on @google/genai response structure (it's usually response.text() or similar)
            // Actually in the new SDK it might be response.candidates[0].content.parts[0].text
            // But they usually provide helper methods.

            let text = response.text || "";

            // Basic JSON cleaning if Gemini adds markdown blocks
            text = text.replace(/```json|```/g, "").trim();

            try {
                const data = JSON.parse(text);
                results.push({
                    fileName: file.name,
                    description: data.description || file.name,
                    date: data.date || "N/A",
                    amount: parseFloat(data.amount) || 0,
                });
            } catch (e) {
                console.error("Failed to parse Gemini response:", text);
                results.push({
                    fileName: file.name,
                    description: file.name,
                    date: "Error",
                    amount: 0,
                });
            }
        }

        // Generate CSV
        const today = new Date().toLocaleDateString("en-GB").split("/").join("-");
        let csvContent = `Expenses Report - Generated on ${today}\n\n`;
        csvContent += "Description,Date,Amount\n";

        let total = 0;
        results.forEach((res) => {
            // Clean description for CSV (remove quotes/commas)
            const cleanDesc = res.description.replace(/"/g, '""');
            const row = `"${cleanDesc}","${res.date}",${res.amount.toFixed(2)}\n`;
            csvContent += row;
            total += res.amount;
        });

        csvContent += `\nTOTAL,,${total.toFixed(2)}\n`;

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="expenses_${today}.csv"`,
            },
        });
    } catch (error) {
        console.error("Error processing expenses:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
