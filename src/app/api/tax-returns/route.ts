import { NextRequest, NextResponse } from "next/server";
import {
    getAllTaxReturns,
    getTaxReturn,
    createTaxReturn,
    updateTaxReturn,
    deleteTaxReturn
} from "@/lib/tax-returns/tax-return-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year");

        if (year) {
            // Get specific tax return
            const taxReturn = getTaxReturn(year);
            if (!taxReturn) {
                return NextResponse.json(
                    { error: "Tax return not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, taxReturn });
        } else {
            // Get all tax returns
            const taxReturns = getAllTaxReturns();
            return NextResponse.json({ success: true, taxReturns });
        }
    } catch (error: any) {
        console.error("Tax Returns API GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch tax returns" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate required fields
        if (!body.financial_year || !body.total_tax_charge || !body.payment_deadline) {
            return NextResponse.json(
                { error: "financial_year, total_tax_charge, and payment_deadline are required" },
                { status: 400 }
            );
        }

        const taxReturn = createTaxReturn(body);

        return NextResponse.json({
            success: true,
            message: "Tax return created successfully",
            taxReturn
        });
    } catch (error: any) {
        console.error("Tax Returns API POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create tax return" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year");

        if (!year) {
            return NextResponse.json(
                { error: "year parameter is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const taxReturn = updateTaxReturn(year, body);

        return NextResponse.json({
            success: true,
            message: "Tax return updated successfully",
            taxReturn
        });
    } catch (error: any) {
        console.error("Tax Returns API PUT Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update tax return" },
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

        deleteTaxReturn(year);

        return NextResponse.json({
            success: true,
            message: "Tax return deleted successfully"
        });
    } catch (error: any) {
        console.error("Tax Returns API DELETE Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete tax return" },
            { status: 500 }
        );
    }
}
