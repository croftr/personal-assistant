import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/common/email-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipient, subject, message, zipData, fileName } = body;

        if (!recipient || !zipData || !fileName) {
            return NextResponse.json(
                { error: "Recipient, zip data, and file name are required" },
                { status: 400 }
            );
        }

        const result = await sendEmail({
            recipient,
            subject,
            message,
            zipData,
            fileName,
        });

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            message: "Email sent successfully",
        });
    } catch (error: any) {
        console.error("Email Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send email" },
            { status: 500 }
        );
    }
}
