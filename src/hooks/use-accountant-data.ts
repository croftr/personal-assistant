import { useState, useEffect, useMemo } from "react";
import type { Pension, Payslip, BankAccount } from "@/types/accountant";
import { groupByFinancialYear } from "@/lib/utils/financial-year";

export function useAccountantData() {
    const [pensions, setPensions] = useState<Pension[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, psRes, bRes] = await Promise.all([
                    fetch("/api/pensions"),
                    fetch("/api/payslips"),
                    fetch("/api/bank-accounts")
                ]);

                const [pData, psData, bData] = await Promise.all([
                    pRes.json(),
                    psRes.json(),
                    bRes.json()
                ]);

                if (pData.success) setPensions(pData.pensions);
                if (psData.success) setPayslips(psData.payslips);
                if (bData.success) setBankAccounts(bData.accounts);
            } catch (error) {
                console.error("Failed to fetch accountant data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totals = useMemo(() => {
        const pensionTotal = pensions.reduce((sum, p) => sum + p.amount, 0);
        const bankTotal = bankAccounts.reduce((sum, a) => sum + a.amount, 0);
        const netPayTotal = payslips.reduce((sum, p) => sum + p.net_pay, 0);

        return {
            pensions: pensionTotal,
            banks: bankTotal,
            payslips: netPayTotal,
            grandTotal: pensionTotal + bankTotal + netPayTotal
        };
    }, [pensions, bankAccounts, payslips]);

    return {
        pensions,
        payslips,
        bankAccounts,
        loading,
        totals,
        refreshPensions: async () => {
            const res = await fetch("/api/pensions");
            const data = await res.json();
            if (data.success) setPensions(data.pensions);
        },
        refreshPayslips: async () => {
            const res = await fetch("/api/payslips");
            const data = await res.json();
            if (data.success) setPayslips(data.payslips);
        },
        refreshBankAccounts: async () => {
            const res = await fetch("/api/bank-accounts");
            const data = await res.json();
            if (data.success) setBankAccounts(data.accounts);
        }
    };
}
