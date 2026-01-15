"use client";

import { useState, useEffect, useMemo } from "react";
import { Calculator, FileText, Mail, Upload, Download, Plus, ExternalLink, Trash2, Edit2, ChevronDown, ChevronUp, Landmark } from "lucide-react";
import type { Pension, Payslip, ProcessedPayslip, BankAccount } from "@/types/accountant";
import toast, { Toaster } from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { groupByFinancialYear, formatFinancialYear } from "@/lib/utils/financial-year";

export default function AccountantPage() {
  const [pensions, setPensions] = useState<Pension[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [payslipsLoading, setPayslipsLoading] = useState(true);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(true);
  const [uploadingPayslips, setUploadingPayslips] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingPension, setEditingPension] = useState<Pension | null>(null);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    amount: "",
    notes: ""
  });
  const [bankFormData, setBankFormData] = useState({
    name: "",
    bank: "",
    interest_rate: "",
    amount: "",
    notes: ""
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning"
  });

  // Financial year grouping state
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Group payslips by financial year
  const payslipsByYear = useMemo(() => groupByFinancialYear(payslips), [payslips]);
  const financialYears = useMemo(() => Object.keys(payslipsByYear).sort().reverse(), [payslipsByYear]);

  // Calculate totals per financial year
  const yearTotals = useMemo(() => {
    const totals: Record<string, {
      count: number;
      netPay: number;
      taxPaid: number;
      niPaid: number;
      pensionContribution: number;
    }> = {};

    Object.entries(payslipsByYear).forEach(([year, yearPayslips]) => {
      totals[year] = {
        count: yearPayslips.length,
        netPay: yearPayslips.reduce((sum, p) => sum + p.net_pay, 0),
        taxPaid: yearPayslips.reduce((sum, p) => sum + (p.tax_paid || 0), 0),
        niPaid: yearPayslips.reduce((sum, p) => sum + (p.ni_paid || 0), 0),
        pensionContribution: yearPayslips.reduce((sum, p) => sum + (p.pension_contribution || 0), 0),
      };
    });

    return totals;
  }, [payslipsByYear]);

  // Calculate grand totals
  const grandTotals = useMemo(() => ({
    count: payslips.length,
    netPay: payslips.reduce((sum, p) => sum + p.net_pay, 0),
    taxPaid: payslips.reduce((sum, p) => sum + (p.tax_paid || 0), 0),
    niPaid: payslips.reduce((sum, p) => sum + (p.ni_paid || 0), 0),
    pensionContribution: payslips.reduce((sum, p) => sum + (p.pension_contribution || 0), 0),
  }), [payslips]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  // Fetch data on mount
  useEffect(() => {
    fetchPensions();
    fetchPayslips();
    fetchBankAccounts();
  }, []);

  const fetchPensions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pensions");
      const data = await response.json();
      if (data.success) {
        setPensions(data.pensions);
      }
    } catch (error) {
      console.error("Failed to fetch pensions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPension ? "/api/pensions" : "/api/pensions";
      const method = editingPension ? "PUT" : "POST";

      const body = editingPension
        ? { id: editingPension.id, ...formData, amount: parseFloat(formData.amount) }
        : { ...formData, amount: parseFloat(formData.amount) };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        await fetchPensions();
        setShowForm(false);
        setEditingPension(null);
        setFormData({ name: "", url: "", amount: "", notes: "" });
        toast.success(editingPension ? "Pension updated successfully" : "Pension added successfully");
      } else {
        toast.error(data.error || "Failed to save pension");
      }
    } catch (error) {
      console.error("Failed to save pension:", error);
      toast.error("Failed to save pension");
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Pension",
      message: "Are you sure you want to delete this pension? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          const response = await fetch(`/api/pensions?id=${id}`, {
            method: "DELETE"
          });

          const data = await response.json();

          if (data.success) {
            await fetchPensions();
            toast.success("Pension deleted successfully");
          } else {
            toast.error(data.error || "Failed to delete pension");
          }
        } catch (error) {
          console.error("Failed to delete pension:", error);
          toast.error("Failed to delete pension");
        }
      }
    });
  };

  const handleEdit = (pension: Pension) => {
    setEditingPension(pension);
    setFormData({
      name: pension.name,
      url: pension.url || "",
      amount: pension.amount.toString(),
      notes: pension.notes || ""
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPension(null);
    setFormData({ name: "", url: "", amount: "", notes: "" });
  };

  const fetchPayslips = async () => {
    try {
      setPayslipsLoading(true);
      const response = await fetch("/api/payslips");
      const data = await response.json();
      if (data.success) {
        setPayslips(data.payslips);
      }
    } catch (error) {
      console.error("Failed to fetch payslips:", error);
    } finally {
      setPayslipsLoading(false);
    }
  };

  const handlePayslipUpload = async (e: React.ChangeEvent<HTMLInputElement>, replaceFiles?: string[]) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingPayslips(true);

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      // Add confirmation and files to replace if provided
      if (replaceFiles && replaceFiles.length > 0) {
        formData.append("confirmReplace", "true");
        formData.append("filesToReplace", JSON.stringify(replaceFiles));
      }

      const response = await fetch("/api/process-payslips", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Handle duplicate confirmation
      if (data.requiresConfirmation && data.duplicates && data.duplicates.length > 0) {
        const duplicateList = data.duplicates.join('\n• ');
        setConfirmDialog({
          isOpen: true,
          title: "Replace Existing Payslips?",
          message: `The following payslip(s) already exist:\n\n• ${duplicateList}\n\nDo you want to replace them with the new data?`,
          type: "warning",
          onConfirm: async () => {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            await handlePayslipUploadWithReplace(files, data.duplicates);
          }
        });
      } else if (data.success) {
        await fetchPayslips();
        let message = `Successfully processed ${data.count} payslip(s)`;
        if (data.replaced > 0) {
          message += ` (${data.replaced} replaced)`;
        }
        if (data.skipped > 0) {
          message += ` (${data.skipped} skipped)`;
        }
        toast.success(message);
      } else {
        toast.error(data.error || "Failed to process payslips");
      }
    } catch (error) {
      console.error("Failed to upload payslips:", error);
      toast.error("Failed to upload payslips");
    } finally {
      setUploadingPayslips(false);
      e.target.value = "";
    }
  };

  const handlePayslipUploadWithReplace = async (files: FileList, filesToReplace: string[]) => {
    try {
      setUploadingPayslips(true);

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      formData.append("confirmReplace", "true");
      formData.append("filesToReplace", JSON.stringify(filesToReplace));

      const response = await fetch("/api/process-payslips", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await fetchPayslips();
        let message = `Successfully processed ${data.count} payslip(s)`;
        if (data.replaced > 0) {
          message += ` (${data.replaced} replaced)`;
        }
        toast.success(message);
      } else {
        toast.error(data.error || "Failed to process payslips");
      }
    } catch (error) {
      console.error("Failed to upload payslips:", error);
      toast.error("Failed to upload payslips");
    } finally {
      setUploadingPayslips(false);
    }
  };

  const handleDeletePayslip = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Payslip",
      message: "Are you sure you want to delete this payslip? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          const response = await fetch(`/api/payslips?id=${id}`, {
            method: "DELETE"
          });

          const data = await response.json();

          if (data.success) {
            await fetchPayslips();
            toast.success("Payslip deleted successfully");
          } else {
            toast.error(data.error || "Failed to delete payslip");
          }
        } catch (error) {
          console.error("Failed to delete payslip:", error);
          toast.error("Failed to delete payslip");
        }
      }
    });
  };

  const fetchBankAccounts = async () => {
    try {
      setBankAccountsLoading(true);
      const response = await fetch("/api/bank-accounts");
      const data = await response.json();
      if (data.success) {
        setBankAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Failed to fetch bank accounts:", error);
    } finally {
      setBankAccountsLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingBankAccount ? "PUT" : "POST";

      const body = editingBankAccount
        ? { id: editingBankAccount.id, ...bankFormData, amount: parseFloat(bankFormData.amount), interest_rate: bankFormData.interest_rate ? parseFloat(bankFormData.interest_rate) : undefined }
        : { ...bankFormData, amount: parseFloat(bankFormData.amount), interest_rate: bankFormData.interest_rate ? parseFloat(bankFormData.interest_rate) : undefined };

      const response = await fetch("/api/bank-accounts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        await fetchBankAccounts();
        setShowBankForm(false);
        setEditingBankAccount(null);
        setBankFormData({ name: "", bank: "", interest_rate: "", amount: "", notes: "" });
        toast.success(editingBankAccount ? "Bank account updated successfully" : "Bank account added successfully");
      } else {
        toast.error(data.error || "Failed to save bank account");
      }
    } catch (error) {
      console.error("Failed to save bank account:", error);
      toast.error("Failed to save bank account");
    }
  };

  const handleDeleteBankAccount = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Bank Account",
      message: "Are you sure you want to delete this bank account? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          const response = await fetch(`/api/bank-accounts?id=${id}`, {
            method: "DELETE"
          });

          const data = await response.json();

          if (data.success) {
            await fetchBankAccounts();
            toast.success("Bank account deleted successfully");
          } else {
            toast.error(data.error || "Failed to delete bank account");
          }
        } catch (error) {
          console.error("Failed to delete bank account:", error);
          toast.error("Failed to delete bank account");
        }
      }
    });
  };

  const handleEditBankAccount = (account: BankAccount) => {
    setEditingBankAccount(account);
    setBankFormData({
      name: account.name,
      bank: account.bank,
      interest_rate: account.interest_rate?.toString() || "",
      amount: account.amount.toString(),
      notes: account.notes || ""
    });
    setShowBankForm(true);
  };

  const handleCancelBank = () => {
    setShowBankForm(false);
    setEditingBankAccount(null);
    setBankFormData({ name: "", bank: "", interest_rate: "", amount: "", notes: "" });
  };

  const totalAmount = pensions.reduce((sum, p) => sum + p.amount, 0);
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + a.amount, 0);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />

      <main className="min-h-screen gradient-bg flex flex-col items-center p-8 text-white">
        <div className="max-w-4xl w-full glass rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Accountant Assistant
          </h1>
          <p className="text-gray-400">Financial analysis and reporting tools</p>
        </div>

        {/* Grand Totals Overview */}
        <div className="glass rounded-lg p-6 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-green-600/20 border-2 border-purple-500/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calculator className="text-purple-400" size={28} />
            Financial Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pensions Summary */}
            <div className="glass rounded-lg p-4 bg-purple-600/10">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">Pensions</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-green-400">
                    £{totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-sm text-gray-400">
                  {pensions.length} pension{pensions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Payslips Summary */}
            <div className="glass rounded-lg p-4 bg-blue-600/10">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Payslips (All Years)</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Total Net Pay</p>
                  <p className="text-2xl font-bold text-green-400">
                    £{grandTotals.netPay.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Tax Paid</p>
                    <p className="font-semibold text-red-400">
                      £{grandTotals.taxPaid.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pension</p>
                    <p className="font-semibold text-purple-400">
                      £{grandTotals.pensionContribution.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {grandTotals.count} payslip{grandTotals.count !== 1 ? 's' : ''} • {financialYears.length} year{financialYears.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Bank Accounts Summary */}
            <div className="glass rounded-lg p-4 bg-green-600/10">
              <h3 className="text-lg font-semibold mb-3 text-green-400">Bank Accounts</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Total Savings</p>
                  <p className="text-2xl font-bold text-green-400">
                    £{totalBankBalance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-sm text-gray-400">
                  {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Combined Total */}
          <div className="mt-6 pt-6 border-t border-gray-600/50">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-300">Combined Total Assets</span>
              <span className="text-4xl font-bold text-green-400">
                £{(totalAmount + grandTotals.netPay + totalBankBalance).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Pensions Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Pensions</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Add Pension
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="glass rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold">
                {editingPension ? "Edit Pension" : "Add New Pension"}
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Company Pension Scheme"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount (£) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://pension-provider.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional information..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingPension ? "Update Pension" : "Add Pension"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Pensions List */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading pensions...</div>
          ) : pensions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No pensions added yet. Click "Add Pension" to get started.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pensions.map((pension) => (
                  <div
                    key={pension.id}
                    className="glass rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{pension.name}</h3>
                          {pension.url && (
                            <a
                              href={pension.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-green-400 mt-1">
                          £{pension.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {pension.notes && (
                          <p className="text-sm text-gray-400 mt-2">{pension.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(pension)}
                          className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(pension.id)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="glass rounded-lg p-4 bg-blue-600/10">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Pension Value</span>
                  <span className="text-3xl font-bold text-green-400">
                    £{totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {pensions.length} pension{pensions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Payslips Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Payslips</h2>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer">
              <Upload size={20} />
              {uploadingPayslips ? "Processing..." : "Upload Payslip PDF"}
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handlePayslipUpload}
                disabled={uploadingPayslips}
                className="hidden"
              />
            </label>
          </div>

          {/* Payslips by Financial Year */}
          {payslipsLoading ? (
            <div className="text-center py-8 text-gray-400">Loading payslips...</div>
          ) : payslips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No payslips uploaded yet. Upload a PDF payslip to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {financialYears.map((year) => {
                const yearPayslips = payslipsByYear[year];
                const totals = yearTotals[year];
                const isExpanded = expandedYears.has(year);

                return (
                  <div key={year} className="glass rounded-lg overflow-hidden">
                    {/* Year Header with Summary */}
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          <h3 className="text-xl font-bold">{formatFinancialYear(year)}</h3>
                          <span className="text-sm text-gray-400">({totals.count} payslip{totals.count !== 1 ? 's' : ''})</span>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-gray-400">Net: </span>
                            <span className="font-bold text-green-400">
                              £{totals.netPay.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Tax: </span>
                            <span className="font-bold text-red-400">
                              £{totals.taxPaid.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Pension: </span>
                            <span className="font-bold text-purple-400">
                              £{totals.pensionContribution.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Payslip Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-700/50 p-4 bg-black/20">
                        <div className="space-y-3">
                          {yearPayslips.map((payslip) => (
                            <div
                              key={payslip.id}
                              className="glass rounded-lg p-4 hover:bg-white/10 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-blue-400" />
                                    <div>
                                      <h4 className="font-semibold">{payslip.file_name}</h4>
                                      <p className="text-xs text-gray-400">Pay Date: {payslip.pay_date}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                    <div>
                                      <p className="text-xs text-gray-400">Net Pay</p>
                                      <p className="text-base font-bold text-green-400">
                                        £{payslip.net_pay.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    {payslip.gross_pay && (
                                      <div>
                                        <p className="text-xs text-gray-400">Gross Pay</p>
                                        <p className="text-base font-semibold">
                                          £{payslip.gross_pay.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {payslip.tax_paid && (
                                      <div>
                                        <p className="text-xs text-gray-400">Tax Paid</p>
                                        <p className="text-base font-semibold text-red-400">
                                          £{payslip.tax_paid.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {payslip.ni_paid && (
                                      <div>
                                        <p className="text-xs text-gray-400">NI Paid</p>
                                        <p className="text-base font-semibold text-red-400">
                                          £{payslip.ni_paid.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {payslip.pension_contribution && (
                                      <div>
                                        <p className="text-xs text-gray-400">Pension</p>
                                        <p className="text-base font-semibold text-purple-400">
                                          £{payslip.pension_contribution.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {payslip.notes && (
                                    <p className="text-sm text-gray-400 mt-2">{payslip.notes}</p>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeletePayslip(payslip.id)}
                                  className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Grand Total Summary */}
          {!payslipsLoading && payslips.length > 0 && (
            <div className="glass rounded-lg p-6 bg-gradient-to-br from-green-600/20 to-blue-600/20 border-2 border-green-500/30">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Calculator className="text-green-400" size={24} />
                Grand Total (All Years)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-300">Total Net Pay</p>
                  <p className="text-2xl font-bold text-green-400">
                    £{grandTotals.netPay.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Tax Paid</p>
                  <p className="text-2xl font-bold text-red-400">
                    £{grandTotals.taxPaid.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total NI Paid</p>
                  <p className="text-2xl font-bold text-red-400">
                    £{grandTotals.niPaid.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Pension</p>
                  <p className="text-2xl font-bold text-purple-400">
                    £{grandTotals.pensionContribution.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-600/50">
                <p className="text-sm text-gray-300">
                  {grandTotals.count} payslip{grandTotals.count !== 1 ? 's' : ''} across {financialYears.length} financial year{financialYears.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bank Accounts Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Bank Accounts</h2>
            <button
              onClick={() => setShowBankForm(!showBankForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Add Bank Account
            </button>
          </div>

          {/* Add/Edit Form */}
          {showBankForm && (
            <form onSubmit={handleBankSubmit} className="glass rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold">
                {editingBankAccount ? "Edit Bank Account" : "Add New Bank Account"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Name *</label>
                  <input
                    type="text"
                    required
                    value={bankFormData.name}
                    onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main Savings"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bank *</label>
                  <input
                    type="text"
                    required
                    value={bankFormData.bank}
                    onChange={(e) => setBankFormData({ ...bankFormData, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Barclays"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Balance (£) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={bankFormData.amount}
                    onChange={(e) => setBankFormData({ ...bankFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bankFormData.interest_rate}
                    onChange={(e) => setBankFormData({ ...bankFormData, interest_rate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={bankFormData.notes}
                  onChange={(e) => setBankFormData({ ...bankFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional information..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingBankAccount ? "Update Account" : "Add Account"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelBank}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Bank Accounts List */}
          {bankAccountsLoading ? (
            <div className="text-center py-8 text-gray-400">Loading bank accounts...</div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No bank accounts added yet. Click "Add Bank Account" to get started.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="glass rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Landmark size={20} className="text-blue-400" />
                          <div>
                            <h3 className="text-lg font-semibold">{account.name}</h3>
                            <p className="text-sm text-gray-400">{account.bank}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Balance</p>
                            <p className="text-2xl font-bold text-green-400">
                              £{account.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          {account.interest_rate && (
                            <div>
                              <p className="text-xs text-gray-400">Interest Rate</p>
                              <p className="text-xl font-semibold text-blue-400">
                                {account.interest_rate}%
                              </p>
                            </div>
                          )}
                        </div>
                        {account.notes && (
                          <p className="text-sm text-gray-400 mt-3">{account.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditBankAccount(account)}
                          className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteBankAccount(account.id)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Balance */}
              <div className="glass rounded-lg p-4 bg-blue-600/10">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Balance</span>
                  <span className="text-3xl font-bold text-green-400">
                    £{totalBankBalance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
      </main>
    </>
  );
}
