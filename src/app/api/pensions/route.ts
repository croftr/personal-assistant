import { NextRequest, NextResponse } from "next/server";
import {
    getAllPensions,
    createPension,
    updatePension,
    deletePension,
    getPensionById,
    getPensionStats
} from "@/lib/pensions/pension-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const id = searchParams.get("id");

        switch (action) {
            case "stats":
                const stats = getPensionStats();
                return NextResponse.json({ success: true, stats });

            case "byId":
                if (!id) {
                    return NextResponse.json(
                        { error: "id parameter is required" },
                        { status: 400 }
                    );
                }
                const pension = getPensionById(parseInt(id));
                if (!pension) {
                    return NextResponse.json(
                        { error: "Pension not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json({ success: true, pension });

            default:
                // Get all pensions
                const allPensions = getAllPensions();
                return NextResponse.json({ success: true, pensions: allPensions });
        }
    } catch (error: any) {
        console.error("Pensions API GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch pensions" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, url, amount, notes } = body;

        if (!name || amount === undefined || amount === null) {
            return NextResponse.json(
                { error: "name and amount are required" },
                { status: 400 }
            );
        }

        const pensionId = createPension({
            name,
            url,
            amount: parseFloat(amount),
            notes
        });

        return NextResponse.json({
            success: true,
            pensionId,
            message: "Pension created successfully"
        });
    } catch (error: any) {
        console.error("Pensions API POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create pension" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, url, amount, notes } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (url !== undefined) updates.url = url;
        if (amount !== undefined) updates.amount = parseFloat(amount);
        if (notes !== undefined) updates.notes = notes;

        updatePension(parseInt(id), updates);

        return NextResponse.json({
            success: true,
            message: "Pension updated successfully"
        });
    } catch (error: any) {
        console.error("Pensions API PUT Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update pension" },
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

        deletePension(parseInt(id));

        return NextResponse.json({
            success: true,
            message: "Pension deleted successfully"
        });
    } catch (error: any) {
        console.error("Pensions API DELETE Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete pension" },
            { status: 500 }
        );
    }
}
