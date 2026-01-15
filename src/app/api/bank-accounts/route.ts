import { NextRequest, NextResponse } from "next/server";
import {
    getAllBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getBankAccountById,
    getBankAccountStats,
    getAccountsByBank
} from "@/lib/bank-accounts/bank-account-db-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const id = searchParams.get("id");
        const bank = searchParams.get("bank");

        switch (action) {
            case "stats":
                const stats = getBankAccountStats();
                return NextResponse.json({ success: true, stats });

            case "byId":
                if (!id) {
                    return NextResponse.json(
                        { error: "id parameter is required" },
                        { status: 400 }
                    );
                }
                const account = getBankAccountById(parseInt(id));
                if (!account) {
                    return NextResponse.json(
                        { error: "Bank account not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json({ success: true, account });

            case "byBank":
                if (!bank) {
                    return NextResponse.json(
                        { error: "bank parameter is required" },
                        { status: 400 }
                    );
                }
                const accountsByBank = getAccountsByBank(bank);
                return NextResponse.json({ success: true, accounts: accountsByBank });

            default:
                // Get all bank accounts
                const allAccounts = getAllBankAccounts();
                return NextResponse.json({ success: true, accounts: allAccounts });
        }
    } catch (error: any) {
        console.error("Bank Accounts API GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch bank accounts" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, bank, interest_rate, amount, notes } = body;

        if (!name || !bank || amount === undefined || amount === null) {
            return NextResponse.json(
                { error: "name, bank, and amount are required" },
                { status: 400 }
            );
        }

        const accountId = createBankAccount({
            name,
            bank,
            interest_rate: interest_rate ? parseFloat(interest_rate) : undefined,
            amount: parseFloat(amount),
            notes
        });

        return NextResponse.json({
            success: true,
            accountId,
            message: "Bank account created successfully"
        });
    } catch (error: any) {
        console.error("Bank Accounts API POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create bank account" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, bank, interest_rate, amount, notes } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (bank !== undefined) updates.bank = bank;
        if (interest_rate !== undefined) updates.interest_rate = parseFloat(interest_rate);
        if (amount !== undefined) updates.amount = parseFloat(amount);
        if (notes !== undefined) updates.notes = notes;

        updateBankAccount(parseInt(id), updates);

        return NextResponse.json({
            success: true,
            message: "Bank account updated successfully"
        });
    } catch (error: any) {
        console.error("Bank Accounts API PUT Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update bank account" },
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

        deleteBankAccount(parseInt(id));

        return NextResponse.json({
            success: true,
            message: "Bank account deleted successfully"
        });
    } catch (error: any) {
        console.error("Bank Accounts API DELETE Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete bank account" },
            { status: 500 }
        );
    }
}
