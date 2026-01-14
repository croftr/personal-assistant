import JSZip from "jszip";
import fs from "fs/promises";
import path from "path";

/**
 * Create ZIP from files in a directory
 */
export async function createZipFromDirectory(
    folderPath: string,
    csvContent?: string,
    validExtensions: string[] = [".jpg", ".jpeg", ".png", ".webp", ".pdf"]
): Promise<{ zipBuffer: Buffer; fileName: string }> {
    const zip = new JSZip();

    // Add CSV if provided
    if (csvContent) {
        const today = new Date().toISOString().split("T")[0];
        const csvFileName = `expenses_${today}.csv`;
        zip.file(csvFileName, csvContent);
    }

    // Read and add receipt files
    const allFiles = await fs.readdir(folderPath);
    const receiptFiles = allFiles.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return validExtensions.includes(ext) && !file.startsWith(".");
    });

    const receiptsFolder = zip.folder("receipts");
    if (receiptsFolder) {
        for (const fileName of receiptFiles) {
            const filePath = path.join(folderPath, fileName);
            const buffer = await fs.readFile(filePath);
            receiptsFolder.file(fileName, buffer);
        }
    }

    // Generate zip
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const today = new Date().toISOString().split("T")[0];
    const zipFileName = `expenses_${today}.zip`;

    return { zipBuffer, fileName: zipFileName };
}

/**
 * Create ZIP from uploaded files
 */
export async function createZipFromFiles(
    receiptFiles: File[],
    csvFile?: File
): Promise<{ zipBuffer: Buffer; fileName: string }> {
    const zip = new JSZip();

    // Add CSV
    if (csvFile) {
        const csvBuffer = Buffer.from(await csvFile.arrayBuffer());
        zip.file(csvFile.name, csvBuffer);
    }

    // Add receipts
    const receiptsFolder = zip.folder("receipts");
    if (receiptsFolder) {
        for (const file of receiptFiles) {
            const buffer = Buffer.from(await file.arrayBuffer());
            receiptsFolder.file(file.name, buffer);
        }
    }

    // Generate zip
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const today = new Date().toISOString().split("T")[0];
    const zipFileName = `expenses_${today}.zip`;

    return { zipBuffer, fileName: zipFileName };
}
