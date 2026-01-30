import { NextRequest, NextResponse } from "next/server";
import { getPayslipsByFinancialYear } from "@/lib/payslips/payslip-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const financialYear = searchParams.get("financialYear");

        if (!financialYear) {
            return NextResponse.json({ error: "financialYear parameter is required" }, { status: 400 });
        }

        const payslips = getPayslipsByFinancialYear(financialYear);

        return NextResponse.json({ success: true, payslips });
    } catch (error: any) {
        console.error("Payslips API GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch payslips history" },
            { status: 500 }
        );
    }
}
