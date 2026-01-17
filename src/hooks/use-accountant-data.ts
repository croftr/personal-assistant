import { useState, useEffect, useMemo } from "react";
import type { Pension, BankAccount, TaxReturn } from "@/types/accountant";

export interface FinancialYearSummary {
    id: number;
    financial_year: string;
    last_payslip_date: string;
    total_taxable_pay: number;
    total_taxable_ni_pay: number;
    total_paye_tax: number;
    total_ni: number;
    created_at: string;
    updated_at: string;
}

export function useAccountantData() {
    const [pensions, setPensions] = useState<Pension[]>([]);
    const [financialYears, setFinancialYears] = useState<FinancialYearSummary[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, fyRes, bRes, trRes] = await Promise.all([
                    fetch("/api/pensions"),
                    fetch("/api/financial-years"),
                    fetch("/api/bank-accounts"),
                    fetch("/api/tax-returns")
                ]);

                const [pData, fyData, bData, trData] = await Promise.all([
                    pRes.json(),
                    fyRes.json(),
                    bRes.json(),
                    trRes.json()
                ]);

                if (pData.success) setPensions(pData.pensions);
                if (fyData.success) setFinancialYears(fyData.summaries);
                if (bData.success) setBankAccounts(bData.accounts);
                if (trData.success) setTaxReturns(trData.taxReturns);
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

        // Sum up total taxable pay across all financial years
        const totalTaxablePay = financialYears.reduce((sum, fy) => sum + fy.total_taxable_pay, 0);

        return {
            pensions: pensionTotal,
            banks: bankTotal,
            payslips: totalTaxablePay,
            grandTotal: pensionTotal + bankTotal
        };
    }, [pensions, bankAccounts, financialYears]);

    return {
        pensions,
        financialYears,
        bankAccounts,
        taxReturns,
        loading,
        totals,
        refreshPensions: async () => {
            const res = await fetch("/api/pensions");
            const data = await res.json();
            if (data.success) setPensions(data.pensions);
        },
        refreshFinancialYears: async () => {
            const res = await fetch("/api/financial-years");
            const data = await res.json();
            if (data.success) setFinancialYears(data.summaries);
        },
        refreshBankAccounts: async () => {
            const res = await fetch("/api/bank-accounts");
            const data = await res.json();
            if (data.success) setBankAccounts(data.accounts);
        },
        refreshTaxReturns: async () => {
            const res = await fetch("/api/tax-returns");
            const data = await res.json();
            if (data.success) setTaxReturns(data.taxReturns);
        }
    };
}
