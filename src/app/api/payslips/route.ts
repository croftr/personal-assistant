import { NextRequest, NextResponse } from "next/server";
import {
    getAllPayslips,
    createPayslip,
    updatePayslip,
    deletePayslip,
    getPayslipById,
    getPayslipStats,
    getPayslipsByDateRange,
    getYearToDateStats
} from "@/lib/payslips/payslip-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const id = searchParams.get("id");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const year = searchParams.get("year");
        const limit = parseInt(searchParams.get("limit") || "100");

        switch (action) {
            case "stats":
                const stats = getPayslipStats();
                return NextResponse.json({ success: true, stats });

            case "ytd":
                if (!year) {
                    return NextResponse.json(
                        { error: "year parameter is required" },
                        { status: 400 }
                    );
                }
                const ytdStats = getYearToDateStats(parseInt(year));
                return NextResponse.json({ success: true, stats: ytdStats });

            case "byId":
                if (!id) {
                    return NextResponse.json(
                        { error: "id parameter is required" },
                        { status: 400 }
                    );
                }
                const payslip = getPayslipById(parseInt(id));
                if (!payslip) {
                    return NextResponse.json(
                        { error: "Payslip not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json({ success: true, payslip });

            case "dateRange":
                if (!startDate || !endDate) {
                    return NextResponse.json(
                        { error: "startDate and endDate are required" },
                        { status: 400 }
                    );
                }
                const payslipsByDate = getPayslipsByDateRange(startDate, endDate);
                return NextResponse.json({ success: true, payslips: payslipsByDate });

            default:
                // Get all payslips
                const allPayslips = getAllPayslips(limit);
                return NextResponse.json({ success: true, payslips: allPayslips });
        }
    } catch (error: any) {
        console.error("Payslips API GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch payslips" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            file_name,
            pay_date,
            net_pay,
            gross_pay,
            tax_paid,
            ni_paid,
            pension_contribution,
            other_deductions,
            notes
        } = body;

        if (!file_name || !pay_date || net_pay === undefined || net_pay === null) {
            return NextResponse.json(
                { error: "file_name, pay_date, and net_pay are required" },
                { status: 400 }
            );
        }

        const payslipId = createPayslip({
            file_name,
            pay_date,
            net_pay: parseFloat(net_pay),
            gross_pay: gross_pay ? parseFloat(gross_pay) : undefined,
            tax_paid: tax_paid ? parseFloat(tax_paid) : undefined,
            ni_paid: ni_paid ? parseFloat(ni_paid) : undefined,
            pension_contribution: pension_contribution ? parseFloat(pension_contribution) : undefined,
            other_deductions: other_deductions ? parseFloat(other_deductions) : undefined,
            notes
        });

        return NextResponse.json({
            success: true,
            payslipId,
            message: "Payslip created successfully"
        });
    } catch (error: any) {
        console.error("Payslips API POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create payslip" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            id,
            file_name,
            pay_date,
            net_pay,
            gross_pay,
            tax_paid,
            ni_paid,
            pension_contribution,
            other_deductions,
            notes
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        const updates: any = {};
        if (file_name !== undefined) updates.file_name = file_name;
        if (pay_date !== undefined) updates.pay_date = pay_date;
        if (net_pay !== undefined) updates.net_pay = parseFloat(net_pay);
        if (gross_pay !== undefined) updates.gross_pay = parseFloat(gross_pay);
        if (tax_paid !== undefined) updates.tax_paid = parseFloat(tax_paid);
        if (ni_paid !== undefined) updates.ni_paid = parseFloat(ni_paid);
        if (pension_contribution !== undefined) updates.pension_contribution = parseFloat(pension_contribution);
        if (other_deductions !== undefined) updates.other_deductions = parseFloat(other_deductions);
        if (notes !== undefined) updates.notes = notes;

        updatePayslip(parseInt(id), updates);

        return NextResponse.json({
            success: true,
            message: "Payslip updated successfully"
        });
    } catch (error: any) {
        console.error("Payslips API PUT Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update payslip" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "id parameter is required" },
                { status: 400 }
            );
        }

        deletePayslip(parseInt(id));

        return NextResponse.json({
            success: true,
            message: "Payslip deleted successfully"
        });
    } catch (error: any) {
        console.error("Payslips API DELETE Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete payslip" },
            { status: 500 }
        );
    }
}
