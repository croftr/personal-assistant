// Types specific to expense processing

export type ProcessedExpense = {
    fileName: string;
    description: string;
    date: string;
    amount: number;
};

export type ExpenseRow = {
    fileName: string;
    description: string;
    date: string;
    amount: number;
};
