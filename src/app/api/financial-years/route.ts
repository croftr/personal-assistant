import { NextRequest, NextResponse } from "next/server";
import {
    getAllFinancialYearSummaries,
    getFinancialYearSummary,
    deleteFinancialYearSummary
} from "@/lib/payslips/financial-year-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year");

        if (year) {
            // Get specific financial year
            const summary = getFinancialYearSummary(year);
            if (!summary) {
                return NextResponse.json(
                    { error: "Financial year not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, summary });
        } else {
            // Get all financial years
            const summaries = getAllFinancialYearSummaries();
            return NextResponse.json({ success: true, summaries });
        }
    } catch (error: any) {
        console.error("Financial Years API GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch financial years" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year");

        if (!year) {
            return NextResponse.json(
                { error: "year parameter is required" },
                { status: 400 }
            );
        }

        deleteFinancialYearSummary(year);

        return NextResponse.json({
            success: true,
            message: "Financial year summary deleted successfully"
        });
    } catch (error: any) {
        console.error("Financial Years API DELETE Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete financial year summary" },
            { status: 500 }
        );
    }
}
