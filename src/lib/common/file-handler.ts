import fs from "fs/promises";
import path from "path";
import type { FileData } from "@/types/common";

/**
 * Check if a file is a valid receipt file
 */
export const isReceiptFile = (filename: string): boolean => {
    const ext = path.extname(filename).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(ext);
};

/**
 * Get MIME type from filename
 */
export const getMimeType = (filename: string): string => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".pdf") return "application/pdf";
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    return "image/jpeg";
};

/**
 * Read files from a directory and return FileData objects
 */
export const readFilesFromDirectory = async (
    dirPath: string,
    filterFn: (filename: string) => boolean = isReceiptFile
): Promise<FileData[]> => {
    const allFiles = await fs.readdir(dirPath);
    const visibleFiles = allFiles.filter(item => !item.startsWith("."));
    const validFiles = visibleFiles.filter(filterFn);

    const fileReadPromises = validFiles.map(async (fileName) => {
        const fullPath = path.join(dirPath, fileName);
        const buffer = await fs.readFile(fullPath);
        return {
            name: fileName,
            mimeType: getMimeType(fileName),
            buffer: buffer
        };
    });

    return await Promise.all(fileReadPromises);
};

/**
 * Convert uploaded files to FileData objects
 */
export const convertUploadedFiles = async (files: File[]): Promise<FileData[]> => {
    const fileBufferPromises = files.map(async (f) => ({
        name: f.name,
        mimeType: f.type,
        buffer: Buffer.from(await f.arrayBuffer()),
    }));

    return await Promise.all(fileBufferPromises);
};

/**
 * Validate directory exists and is accessible
 */
export const validateDirectory = async (dirPath: string): Promise<void> => {
    try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
            throw new Error("Path is not a directory");
        }
    } catch (e) {
        throw new Error("Directory not found");
    }
};

/**
 * Get list of valid files in a directory
 */
export const getValidFilesInDirectory = async (
    dirPath: string,
    filterFn: (filename: string) => boolean = isReceiptFile
): Promise<string[]> => {
    const allFiles = await fs.readdir(dirPath);
    const visibleFiles = allFiles.filter(item => !item.startsWith("."));
    return visibleFiles.filter(filterFn);
};
