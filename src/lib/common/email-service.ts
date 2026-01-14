import nodemailer from "nodemailer";
import type { EmailConfig, EmailParams } from "@/types/common";

/**
 * Get email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig {
    const config = {
        host: process.env.EMAIL_HOST || "",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER || "",
            pass: process.env.EMAIL_PASSWORD || "",
        },
    };

    if (!config.host || !config.auth.user || !config.auth.pass) {
        throw new Error("Email configuration not set. Please configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env.local");
    }

    return config;
}

/**
 * Send email with optional ZIP attachment
 */
export async function sendEmail(params: EmailParams): Promise<{ messageId: string }> {
    const { recipient, subject, message, zipData, fileName } = params;

    if (!recipient) {
        throw new Error("Recipient is required");
    }

    const emailConfig = getEmailConfig();
    const transporter = nodemailer.createTransport(emailConfig);

    const mailOptions: any = {
        from: emailConfig.auth.user,
        to: recipient,
        subject: subject || `Report - ${new Date().toLocaleDateString("en-GB")}`,
        text: message || "Please find attached the report.",
        html: `<p>${message || "Please find attached the report."}</p>`,
    };

    // Add attachment if provided
    if (zipData && fileName) {
        const zipBuffer = Buffer.from(zipData, "base64");
        mailOptions.attachments = [
            {
                filename: fileName,
                content: zipBuffer,
            },
        ];
    }

    const info = await transporter.sendMail(mailOptions);
    return { messageId: info.messageId };
}
