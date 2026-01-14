import type { ProcessedExpense } from "@/types/expenses";

/**
 * Generate CSV content from processed expenses
 */
export function generateCsv(data: ProcessedExpense[]): string {
    const today = new Date().toLocaleDateString("en-GB").split("/").join("-");
    let csvContent = `Expenses Report - Generated on ${today}\n\n`;
    csvContent += "Receipt Name,Description,Date,Amount (GBP)\n";

    let total = 0;
    data.forEach((res) => {
        const cleanName = (res.fileName || "").replace(/"/g, '""');
        const cleanDesc = (res.description || "").replace(/"/g, '""');
        const row = `"${cleanName}","${cleanDesc}","${res.date}",${res.amount.toFixed(2)}\n`;
        csvContent += row;
        total += res.amount;
    });

    csvContent += `\nTOTAL,,,${total.toFixed(2)}\n`;
    return csvContent;
}

/**
 * Parse CSV content into rows
 */
export function parseCsvToRows(csvContent: string): { rows: ProcessedExpense[], total: number } {
    const rows: ProcessedExpense[] = [];
    const lines = csvContent.split("\n");
    let currentTotal = 0;

    lines.forEach((line) => {
        const match = line.match(/"(.*?)","(.*?)","(.*?)",([0-9.]+)/);
        if (match) {
            const amount = parseFloat(match[4]);
            rows.push({
                fileName: match[1],
                description: match[2],
                date: match[3],
                amount: amount
            });
            currentTotal += amount;
        }
    });

    return { rows, total: currentTotal };
}
