// Types specific to accountant assistant

// Placeholder for future accountant types
export type AccountantTask = {
    id: string;
    title: string;
    status: "pending" | "in-progress" | "completed";
};

// Pension types
export interface Pension {
    id: number;
    name: string;
    url: string | null;
    amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PensionInput {
    name: string;
    url?: string;
    amount: number;
    notes?: string;
}

// Payslip types
export interface Payslip {
    id: number;
    file_name: string;
    pay_date: string;
    net_pay: number;
    gross_pay: number | null;
    tax_paid: number | null;
    ni_paid: number | null;
    pension_contribution: number | null;
    other_deductions: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PayslipInput {
    file_name: string;
    pay_date: string;
    net_pay: number;
    gross_pay?: number;
    tax_paid?: number;
    ni_paid?: number;
    pension_contribution?: number;
    other_deductions?: number;
    notes?: string;
}

export interface ProcessedPayslip {
    fileName: string;
    payDate: string;
    netPay: number;
    grossPay?: number;
    taxPaid?: number;
    niPaid?: number;
    pensionContribution?: number;
    otherDeductions?: number;
}

// Bank Account types
export interface BankAccount {
    id: number;
    name: string;
    bank: string;
    interest_rate: number | null;
    amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface BankAccountInput {
    name: string;
    bank: string;
    interest_rate?: number;
    amount: number;
    notes?: string;
}
