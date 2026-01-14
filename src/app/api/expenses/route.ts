import { NextRequest, NextResponse } from "next/server";
import {
    getAllExpenses,
    getExpensesByDateRange,
    searchExpenses,
    getExpenseStats
} from "@/lib/expenses/expense-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "100");

        switch (action) {
            case "stats":
                const stats = getExpenseStats();
                return NextResponse.json({ success: true, stats });

            case "dateRange":
                if (!startDate || !endDate) {
                    return NextResponse.json(
                        { error: "startDate and endDate are required" },
                        { status: 400 }
                    );
                }
                const expensesByDate = getExpensesByDateRange(startDate, endDate);
                return NextResponse.json({ success: true, expenses: expensesByDate });

            case "search":
                if (!search) {
                    return NextResponse.json(
                        { error: "search parameter is required" },
                        { status: 400 }
                    );
                }
                const searchResults = searchExpenses(search, limit);
                return NextResponse.json({ success: true, expenses: searchResults });

            default:
                // Get all expenses
                const allExpenses = getAllExpenses(limit);
                return NextResponse.json({ success: true, expenses: allExpenses });
        }
    } catch (error: any) {
        console.error("Expenses API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch expenses" },
            { status: 500 }
        );
    }
}
