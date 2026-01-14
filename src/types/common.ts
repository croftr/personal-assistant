// Common types shared across all assistants

export type FileData = {
    name: string;
    buffer: Buffer;
    mimeType: string;
};

export type EmailConfig = {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
};

export type EmailParams = {
    recipient: string;
    subject: string;
    message: string;
    zipData?: string;
    fileName?: string;
};
