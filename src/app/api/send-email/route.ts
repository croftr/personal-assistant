import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

        // Email configuration from environment variables
        const emailConfig = {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || "587"),
            secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        };

        if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
            return NextResponse.json(
                { error: "Email configuration not set. Please configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env.local" },
                { status: 500 }
            );
        }

        // Create transporter
        const transporter = nodemailer.createTransport(emailConfig);

        // Convert base64 zip data to buffer
        const zipBuffer = Buffer.from(zipData, "base64");

        // Send email
        const info = await transporter.sendMail({
            from: emailConfig.auth.user,
            to: recipient,
            subject: subject || `Expense Report - ${new Date().toLocaleDateString("en-GB")}`,
            text: message || "Please find attached the expense report with receipts.",
            html: `<p>${message || "Please find attached the expense report with receipts."}</p>`,
            attachments: [
                {
                    filename: fileName,
                    content: zipBuffer,
                },
            ],
        });

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
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
