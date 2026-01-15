import { NextRequest, NextResponse } from "next/server";
import {
    getAllExpenseReports,
    getExpenseReportById,
    getExpensesForReport,
    deleteExpenseReport,
    getExpenseStatistics
} from "@/lib/expenses/expense-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const reportId = searchParams.get("id");
        const includeExpenses = searchParams.get("includeExpenses") === "true";
        const includeStatistics = searchParams.get("includeStatistics") === "true";
        const limit = parseInt(searchParams.get("limit") || "50");

        // Get statistics
        if (includeStatistics) {
            const statistics = getExpenseStatistics();
            return NextResponse.json({ success: true, statistics });
        }

        if (reportId) {
            // Get specific report
            const report = getExpenseReportById(parseInt(reportId));

            if (!report) {
                return NextResponse.json(
                    { error: "Report not found" },
                    { status: 404 }
                );
            }

            if (includeExpenses) {
                const expenses = getExpensesForReport(parseInt(reportId));
                return NextResponse.json({
                    success: true,
                    report,
                    expenses
                });
            }

            return NextResponse.json({ success: true, report });
        }

        // Get all reports
        const reports = getAllExpenseReports(limit);
        return NextResponse.json({ success: true, reports });

    } catch (error: any) {
        console.error("Expense Reports API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch expense reports" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const reportId = searchParams.get("id");

        if (!reportId) {
            return NextResponse.json(
                { error: "Report ID is required" },
                { status: 400 }
            );
        }

        // Check if report exists
        const report = getExpenseReportById(parseInt(reportId));
        if (!report) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        // Delete the report and its associated expenses
        deleteExpenseReport(parseInt(reportId));

        return NextResponse.json({
            success: true,
            message: "Report deleted successfully"
        });

    } catch (error: any) {
        console.error("Delete Expense Report API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete expense report" },
            { status: 500 }
        );
    }
}
