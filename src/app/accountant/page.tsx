"use client";

import { useState, useEffect } from "react";
import {
  Calculator,
  FileText,
  Landmark,
  Plus,
  ChevronRight,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Upload,
  ExternalLink,
  Trash2,
  Edit2,
  X,
  Volume2,
  ChevronDown
} from "lucide-react";
import { useAccountantData } from "@/hooks/use-accountant-data";
import toast, { Toaster } from "react-hot-toast";

export default function AccountantPage() {
  const {
    pensions,
    financialYears,
    bankAccounts,
    taxReturns,
    loading,
    totals,
    refreshPensions,
    refreshFinancialYears,
    refreshBankAccounts,
    refreshTaxReturns
  } = useAccountantData();

  const [summary, setSummary] = useState<{
    score: number;
    summary: string;
    recommendations: string[];
  } | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pensions" | "banks" | "financial-years" | "tax-returns" | null>(null);
  const [welcomeFetched, setWelcomeFetched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPensionForm, setShowPensionForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showTaxReturnForm, setShowTaxReturnForm] = useState(false);
  const [editingPensionId, setEditingPensionId] = useState<number | null>(null);
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [editingTaxReturnId, setEditingTaxReturnId] = useState<number | null>(null);
  const [pensionForm, setPensionForm] = useState({ name: '', amount: '', url: '', notes: '' });
  const [bankForm, setBankForm] = useState({ name: '', bank: '', amount: '', interest_rate: '', url: '', notes: '' });
  const [taxReturnForm, setTaxReturnForm] = useState({
    financial_year: '',
    total_tax_charge: '',
    payment_deadline: '',
    paye_tax: '',
    savings_tax: '',
    child_benefit_payback: '',
    payment_reference: '',
    personal_allowance_reduction: '',
    notes: '',
    document_url: ''
  });

  const generateSummary = async () => {
    try {
      setAnalyzing(true);
      const res = await fetch("/api/financial-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pensions, financialYears, bankAccounts })
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.result);
        toast.success("Financial analysis complete");
      }
    } catch (error) {
      toast.error("Failed to analyze data");
    } finally {
      setAnalyzing(false);
    }
  };

  const getCurrentFinancialYear = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();
    const year = now.getFullYear();

    // Financial year starts on April 6
    let financialYear: number;
    if (month < 3) {
      financialYear = year - 1;
    } else if (month === 3 && day < 6) {
      financialYear = year - 1;
    } else {
      financialYear = year;
    }

    return `${financialYear}/${(financialYear + 1).toString().slice(2)}`;
  };

  const getFinancialYearProgress = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    // Determine which FY we're in and calculate start date
    let fyStartYear: number;
    if (month < 3 || (month === 3 && day < 6)) {
      fyStartYear = currentYear - 1;
    } else {
      fyStartYear = currentYear;
    }

    const fyStart = new Date(fyStartYear, 3, 6); // April 6
    const fyEnd = new Date(fyStartYear + 1, 3, 5, 23, 59, 59); // April 5 next year

    const totalDays = (fyEnd.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed = (now.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24);
    const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);

    const daysRemaining = Math.ceil(totalDays - daysPassed);

    return { progress, daysRemaining, fyEnd };
  };

  const getCurrentFYEarnings = () => {
    const currentFY = getCurrentFinancialYear();
    const fyData = financialYears.find(fy => fy.financial_year === currentFY);
    return fyData ? fyData.total_taxable_pay : 0;
  };

  const getEarningsProgress = () => {
    const TARGET = 100000;
    const earnings = getCurrentFYEarnings();
    const progress = Math.min((earnings / TARGET) * 100, 100);
    const isOverTarget = earnings > TARGET;
    const isNearTarget = earnings > TARGET * 0.85 && earnings <= TARGET; // 85% threshold

    return {
      earnings,
      progress,
      isOverTarget,
      isNearTarget,
      remaining: Math.max(TARGET - earnings, 0),
      over: Math.max(earnings - TARGET, 0)
    };
  };

  const generateWelcome = () => {
    if (welcomeFetched) return;
    setWelcomeFetched(true);

    const currentFY = getCurrentFinancialYear();
    const { daysRemaining } = getFinancialYearProgress();

    const msg = `Financial Year ${currentFY} • ${daysRemaining} days remaining`;
    setWelcomeMessage(msg);
  };

  useEffect(() => {
    if (!loading && !welcomeFetched) {
      generateWelcome();
    }
  }, [loading, welcomeFetched]);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for a more premium feel
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const deletePension = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/pensions?id=${id}`, { method: "DELETE" });
    if ((await res.json()).success) {
      toast.success("Pension deleted");
      refreshPensions();
    }
  };

  const deleteBank = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/bank-accounts?id=${id}`, { method: "DELETE" });
    if ((await res.json()).success) {
      toast.success("Account deleted");
      refreshBankAccounts();
    }
  };

  const deleteFinancialYear = async (year: string) => {
    if (!confirm(`Are you sure you want to delete financial year ${year}?`)) return;
    const res = await fetch(`/api/financial-years?year=${encodeURIComponent(year)}`, { method: "DELETE" });
    if ((await res.json()).success) {
      toast.success("Financial year deleted");
      refreshFinancialYears();
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const pdfFiles = fileArray.filter(f => f.type === "application/pdf");

    if (pdfFiles.length === 0) {
      toast.error("Please select PDF files only");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    pdfFiles.forEach(file => formData.append("files", file));

    try {
      const res = await fetch("/api/process-payslips", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        const messages: string[] = [];

        if (data.updatedYears && data.updatedYears.length > 0) {
          messages.push(`Updated ${data.updatedYears.length} financial year(s): ${data.updatedYears.join(', ')}`);
        }

        if (data.skippedPayslips && data.skippedPayslips.length > 0) {
          messages.push(`Skipped ${data.skippedPayslips.length} older payslip(s)`);
          toast(data.skippedPayslips.join('\n'), { icon: "ℹ️", duration: 5000 });
        }

        if (data.errors && data.errors.length > 0) {
          messages.push(`${data.errors.length} error(s) occurred`);
          toast.error(data.errors.join('\n'), { duration: 5000 });
        }

        if (messages.length > 0) {
          toast.success(messages.join(' | '));
        }

        refreshFinancialYears();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Failed to upload payslips");
    } finally {
      setUploading(false);
    }
  };


  const handleCreatePension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pensionForm.name || !pensionForm.amount) {
      toast.error("Name and amount are required");
      return;
    }

    try {
      const isEditing = editingPensionId !== null;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch("/api/pensions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingPensionId }),
          name: pensionForm.name,
          amount: parseFloat(pensionForm.amount),
          url: pensionForm.url || undefined,
          notes: pensionForm.notes || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? "Pension updated successfully" : "Pension added successfully");
        setPensionForm({ name: '', amount: '', url: '', notes: '' });
        setShowPensionForm(false);
        setEditingPensionId(null);
        refreshPensions();
      } else {
        toast.error(data.error || `Failed to ${isEditing ? 'update' : 'add'} pension`);
      }
    } catch (error) {
      toast.error(`Failed to ${editingPensionId ? 'update' : 'add'} pension`);
    }
  };

  const handleCreateBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.name || !bankForm.bank || !bankForm.amount) {
      toast.error("Name, bank, and amount are required");
      return;
    }

    try {
      const isEditing = editingBankId !== null;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch("/api/bank-accounts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingBankId }),
          name: bankForm.name,
          bank: bankForm.bank,
          amount: parseFloat(bankForm.amount),
          interest_rate: bankForm.interest_rate ? parseFloat(bankForm.interest_rate) : undefined,
          url: bankForm.url || undefined,
          notes: bankForm.notes || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? "Bank account updated successfully" : "Bank account added successfully");
        setBankForm({ name: '', bank: '', amount: '', interest_rate: '', url: '', notes: '' });
        setShowBankForm(false);
        setEditingBankId(null);
        refreshBankAccounts();
      } else {
        toast.error(data.error || `Failed to ${isEditing ? 'update' : 'add'} account`);
      }
    } catch (error) {
      toast.error(`Failed to ${editingBankId ? 'update' : 'add'} account`);
    }
  };

  const startEditPension = (pension: any) => {
    setPensionForm({
      name: pension.name,
      amount: pension.amount.toString(),
      url: pension.url || '',
      notes: pension.notes || ''
    });
    setEditingPensionId(pension.id);
    setShowPensionForm(true);
  };

  const startEditBank = (bank: any) => {
    setBankForm({
      name: bank.name,
      bank: bank.bank,
      amount: bank.amount.toString(),
      interest_rate: bank.interest_rate ? bank.interest_rate.toString() : '',
      url: bank.url || '',
      notes: bank.notes || ''
    });
    setEditingBankId(bank.id);
    setShowBankForm(true);
  };

  const deleteTaxReturn = async (year: string) => {
    if (!confirm(`Are you sure you want to delete tax return for ${year}?`)) return;
    const res = await fetch(`/api/tax-returns?year=${encodeURIComponent(year)}`, { method: "DELETE" });
    if ((await res.json()).success) {
      toast.success("Tax return deleted");
      refreshTaxReturns();
    }
  };

  const handleCreateTaxReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxReturnForm.financial_year || !taxReturnForm.total_tax_charge || !taxReturnForm.payment_deadline) {
      toast.error("Financial year, total tax charge, and payment deadline are required");
      return;
    }

    try {
      const isEditing = editingTaxReturnId !== null;

      if (isEditing) {
        // Find the original tax return to get the original financial year
        const originalTaxReturn = taxReturns.find(tr => tr.id === editingTaxReturnId);
        if (!originalTaxReturn) {
          toast.error("Original tax return not found");
          return;
        }

        // If financial year changed, delete old and create new
        if (originalTaxReturn.financial_year !== taxReturnForm.financial_year) {
          // Delete old record
          const deleteRes = await fetch(`/api/tax-returns?year=${encodeURIComponent(originalTaxReturn.financial_year)}`, {
            method: "DELETE"
          });

          if (!deleteRes.ok) {
            toast.error("Failed to delete old tax return");
            return;
          }

          // Create new record with new financial year
          const createRes = await fetch("/api/tax-returns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              financial_year: taxReturnForm.financial_year,
              total_tax_charge: parseFloat(taxReturnForm.total_tax_charge),
              payment_deadline: taxReturnForm.payment_deadline,
              paye_tax: taxReturnForm.paye_tax ? parseFloat(taxReturnForm.paye_tax) : 0,
              savings_tax: taxReturnForm.savings_tax ? parseFloat(taxReturnForm.savings_tax) : 0,
              child_benefit_payback: taxReturnForm.child_benefit_payback ? parseFloat(taxReturnForm.child_benefit_payback) : 0,
              payment_reference: taxReturnForm.payment_reference || undefined,
              personal_allowance_reduction: taxReturnForm.personal_allowance_reduction || undefined,
              notes: taxReturnForm.notes || undefined,
              document_url: taxReturnForm.document_url || undefined
            })
          });

          const createData = await createRes.json();
          if (!createData.success) {
            toast.error(createData.error || "Failed to create new tax return");
            return;
          }
        } else {
          // Same financial year, just update
          const updateRes = await fetch(`/api/tax-returns?year=${encodeURIComponent(taxReturnForm.financial_year)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              total_tax_charge: parseFloat(taxReturnForm.total_tax_charge),
              payment_deadline: taxReturnForm.payment_deadline,
              paye_tax: taxReturnForm.paye_tax ? parseFloat(taxReturnForm.paye_tax) : 0,
              savings_tax: taxReturnForm.savings_tax ? parseFloat(taxReturnForm.savings_tax) : 0,
              child_benefit_payback: taxReturnForm.child_benefit_payback ? parseFloat(taxReturnForm.child_benefit_payback) : 0,
              payment_reference: taxReturnForm.payment_reference || undefined,
              personal_allowance_reduction: taxReturnForm.personal_allowance_reduction || undefined,
              notes: taxReturnForm.notes || undefined,
              document_url: taxReturnForm.document_url || undefined
            })
          });

          const updateData = await updateRes.json();
          if (!updateData.success) {
            toast.error(updateData.error || "Failed to update tax return");
            return;
          }
        }

        toast.success("Tax return updated successfully");
      } else {
        // Creating new tax return
        const res = await fetch("/api/tax-returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            financial_year: taxReturnForm.financial_year,
            total_tax_charge: parseFloat(taxReturnForm.total_tax_charge),
            payment_deadline: taxReturnForm.payment_deadline,
            paye_tax: taxReturnForm.paye_tax ? parseFloat(taxReturnForm.paye_tax) : 0,
            savings_tax: taxReturnForm.savings_tax ? parseFloat(taxReturnForm.savings_tax) : 0,
            child_benefit_payback: taxReturnForm.child_benefit_payback ? parseFloat(taxReturnForm.child_benefit_payback) : 0,
            payment_reference: taxReturnForm.payment_reference || undefined,
            personal_allowance_reduction: taxReturnForm.personal_allowance_reduction || undefined,
            notes: taxReturnForm.notes || undefined,
            document_url: taxReturnForm.document_url || undefined
          })
        });

        const data = await res.json();
        if (!data.success) {
          toast.error(data.error || "Failed to add tax return");
          return;
        }

        toast.success("Tax return added successfully");
      }

      // Reset form and refresh
      setTaxReturnForm({
        financial_year: '',
        total_tax_charge: '',
        payment_deadline: '',
        paye_tax: '',
        savings_tax: '',
        child_benefit_payback: '',
        payment_reference: '',
        personal_allowance_reduction: '',
        notes: '',
        document_url: ''
      });
      setShowTaxReturnForm(false);
      setEditingTaxReturnId(null);
      refreshTaxReturns();
    } catch (error) {
      toast.error(`Failed to ${editingTaxReturnId ? 'update' : 'add'} tax return`);
    }
  };

  const startEditTaxReturn = (taxReturn: any) => {
    setTaxReturnForm({
      financial_year: taxReturn.financial_year,
      total_tax_charge: taxReturn.total_tax_charge.toString(),
      payment_deadline: taxReturn.payment_deadline,
      paye_tax: taxReturn.paye_tax.toString(),
      savings_tax: taxReturn.savings_tax.toString(),
      child_benefit_payback: taxReturn.child_benefit_payback.toString(),
      payment_reference: taxReturn.payment_reference || '',
      personal_allowance_reduction: taxReturn.personal_allowance_reduction || '',
      notes: taxReturn.notes || '',
      document_url: taxReturn.document_url || ''
    });
    setEditingTaxReturnId(taxReturn.id);
    setShowTaxReturnForm(true);
  };


  // Format currency with 2 decimal places
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <main className="min-h-screen gradient-bg text-white overflow-hidden relative font-sans">
      <Toaster position="top-right" />

      {/* Background SVG for Data Flow */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-blue)" />
            <stop offset="100%" stopColor="var(--accent-purple)" />
          </linearGradient>
        </defs>
        <path d="M 0 0 L 50% 50%" className="data-stream" stroke="url(#flow-grad)" strokeWidth="1" fill="none" />
        <path d="M 100% 0 L 50% 50%" className="data-stream" stroke="url(#flow-grad)" strokeWidth="1" fill="none" />
        <path d="M 0 100% L 50% 50%" className="data-stream" stroke="url(#flow-grad)" strokeWidth="1" fill="none" />
        <path d="M 100% 100% L 50% 50%" className="data-stream" stroke="url(#flow-grad)" strokeWidth="1" fill="none" />
      </svg>

      {/* Title */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center z-20">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo.svg" alt="Logo" className="w-16 h-16 mb-2 animate-float" />
          <h1 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400">
            FINANCIAL ENGINE
          </h1>
        </div>
        <p className="text-slate-400 mt-2 font-light tracking-widest uppercase text-[10px]">Autonomous Intelligence • Real-time Analysis</p>

        {welcomeMessage && (
          <div className="mt-8 max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative glass p-6 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-blue-100 tracking-widest uppercase">
                  {welcomeMessage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${getFinancialYearProgress().progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                <span>6 Apr {getCurrentFinancialYear().split('/')[0]}</span>
                <span className="text-blue-400">{Math.round(getFinancialYearProgress().progress)}% Complete</span>
                <span>5 Apr {parseInt(getCurrentFinancialYear().split('/')[0]) + 1}</span>
              </div>

              {/* Earnings Tracker */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    Taxable Income Target
                  </p>
                  <p className={`text-xs font-bold tracking-wider ${getEarningsProgress().isOverTarget ? 'text-red-400' :
                    getEarningsProgress().isNearTarget ? 'text-orange-400' :
                      'text-green-400'
                    }`}>
                    £{getEarningsProgress().earnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Earnings Progress Bar */}
                <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${getEarningsProgress().isOverTarget
                      ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-600'
                      : getEarningsProgress().isNearTarget
                        ? 'bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600'
                        : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600'
                      }`}
                    style={{ width: `${getEarningsProgress().isOverTarget ? 100 : getEarningsProgress().progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>

                  {/* Target marker at 100% */}
                  <div className="absolute inset-y-0 right-0 w-0.5 bg-white/30"></div>
                </div>

                <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <span>£0</span>
                  {getEarningsProgress().isOverTarget ? (
                    <span className="text-red-400 animate-pulse">
                      Over by £{getEarningsProgress().over.toLocaleString('en-GB')}
                    </span>
                  ) : getEarningsProgress().isNearTarget ? (
                    <span className="text-orange-400">
                      £{getEarningsProgress().remaining.toLocaleString('en-GB')} remaining
                    </span>
                  ) : (
                    <span className="text-green-400">
                      {Math.round(getEarningsProgress().progress)}% of target
                    </span>
                  )}
                  <span>£100,000</span>
                </div>

                {getEarningsProgress().isOverTarget && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-xs text-red-400 font-medium text-center">
                      ⚠️ Higher Rate Tax Bracket Alert
                    </p>
                  </div>
                )}

                {getEarningsProgress().isNearTarget && !getEarningsProgress().isOverTarget && (
                  <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <p className="text-xs text-orange-400 font-medium text-center">
                      ⚡ Approaching Target Threshold
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Central Engine Visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[500px] h-[500px] z-10">
        <div className="absolute w-full h-full border border-blue-500/10 rounded-full animate-spin-slow"></div>
        <div className="absolute w-[80%] h-[80%] border border-purple-500/10 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
        <div className="absolute w-[60%] h-[60%] border border-indigo-500/10 rounded-full border-dashed animate-spin-slow"></div>

        <div className="relative group cursor-pointer" onClick={generateSummary}>
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
          <div className="w-56 h-56 rounded-full glass flex flex-col items-center justify-center border border-white/10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
            <div className="absolute inset-0 animate-pulse-ring rounded-full border border-blue-400/20"></div>

            {analyzing ? (
              <BrainCircuit className="w-14 h-14 text-blue-400 animate-pulse" />
            ) : summary ? (
              <div className="text-center animate-in zoom-in duration-500">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-400">{summary.score}</span>
                <span className="text-[10px] block text-blue-300 font-bold tracking-widest mt-1">HEALTH INDEX</span>
              </div>
            ) : (
              <BrainCircuit className="w-14 h-14 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
            )}
            <p className="text-[9px] mt-4 font-bold tracking-[0.3em] text-blue-300/60 uppercase">Initiate Deep Scan</p>
          </div>
        </div>

        <div className="absolute -bottom-32 text-center bg-white/5 px-8 py-4 rounded-3xl backdrop-blur-md border border-white/5">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[.4em] mb-1">Consolidated Net Worth</p>
          <h2 className="text-4xl font-light tracking-tight pb-1">£{totals.grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>

      {/* Corner Sections */}

      {/* Top Left: Pensions */}
      <section
        className="absolute top-24 left-12 w-80 group cursor-pointer"
        onClick={() => setActiveTab("pensions")}
      >
        <div className="glass p-6 rounded-3xl border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-500 group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors">
              <Plus size={16} />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-1 tracking-tight">Retirement</h3>
          <p className="text-slate-500 text-xs mb-4 font-light">Pension Portfolios</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">£{totals.pensions.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">+2.4%</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <span>{pensions.length} Portfolios</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Top Right: Bank Accounts */}
      <section
        className="absolute top-24 right-12 w-80 text-right group cursor-pointer"
        onClick={() => setActiveTab("banks")}
      >
        <div className="glass p-6 rounded-3xl border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-500 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
              <Plus size={16} />
            </div>
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
              <Landmark size={28} />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-1 tracking-tight">Liquidity</h3>
          <p className="text-slate-500 text-xs mb-4 font-light">Bank & Savings</p>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">+0.5%</span>
            <span className="text-3xl font-bold">£{totals.banks.toLocaleString()}</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <ArrowUpRight size={14} className="scale-x-[-1] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform" />
            <span>{bankAccounts.length} Connected</span>
          </div>
        </div>
      </section>

      {/* Bottom Left: Financial Years */}
      <section
        className="absolute bottom-24 left-12 w-80 group cursor-pointer"
        onClick={() => setActiveTab("financial-years")}
      >
        <div className="glass p-6 rounded-3xl border border-white/5 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-500 group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-400 group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-green-400 group-hover:bg-green-500/10 transition-colors">
              <Upload size={16} />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-1 tracking-tight">Revenue</h3>
          <p className="text-slate-500 text-xs mb-4 font-light">Year-to-Date Tracking</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">£{totals.payslips.toLocaleString()}</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Total Taxable</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <span>{financialYears.length} Years</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Bottom Right: Tax Returns */}
      <section
        className="absolute bottom-24 right-12 w-80 text-right group cursor-pointer"
        onClick={() => setActiveTab("tax-returns")}
      >
        <div className="glass p-6 rounded-3xl border border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-500 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-orange-400 group-hover:bg-orange-500/10 transition-colors">
              <Plus size={16} />
            </div>
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-400 group-hover:scale-110 transition-transform">
              <Calculator size={28} />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-1 tracking-tight">Tax Returns</h3>
          <p className="text-slate-500 text-xs mb-4 font-light">Annual Assessments</p>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-3xl font-bold">{taxReturns.length}</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Filed</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <ArrowUpRight size={14} className="scale-x-[-1] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform" />
            <span>{taxReturns.length} Years</span>
          </div>
        </div>
      </section>

      {/* Management Overlays & AI Summary Overlay (consolidated here for clarity) */}

      {/* AI Summary Overlay */}
      {summary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
          <div className="max-w-3xl w-full glass rounded-[40px] p-8 sm:p-12 border border-blue-500/20 shadow-[0_0_100px_rgba(59,130,246,0.15)] animate-in zoom-in slide-in-from-bottom-10 duration-700 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BrainCircuit className="text-blue-400" size={32} />
                  <h2 className="text-3xl font-bold tracking-tight">Neural Intelligence Report</h2>
                </div>
                <p className="text-slate-400 font-light">Deep analysis of connected financial nodes</p>
              </div>
              <button onClick={() => setSummary(null)} className="p-3 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-8 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] block mb-4">Financial Health Factor</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-400">{summary.score}</span>
                  <span className="text-2xl text-slate-600 font-light">/ 10</span>
                </div>
              </div>
              <div className="p-8 bg-purple-500/5 rounded-3xl border border-purple-500/10 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em] block mb-3">Core Deduction</span>
                <p className="text-lg leading-relaxed text-slate-200 font-light italic">"{summary.summary}"</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                Strategic Protocols
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </h3>
              <div className="grid gap-4">
                {summary.recommendations.map((rec, i) => (
                  <div key={i} className="group p-6 bg-white/[0.02] hover:bg-white/[0.05] rounded-[24px] border border-white/5 transition-all duration-300">
                    <div className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform" />
                      <p className="text-slate-300 font-light leading-relaxed">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Management Overlay */}
      {activeTab && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[90] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`${activeTab === 'financial-years' ? 'max-w-7xl' : 'max-w-4xl'} w-full glass rounded-[40px] p-8 border border-white/10 shadow-2xl animate-in zoom-in duration-500 overflow-hidden flex flex-col max-h-[85vh]`}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${activeTab === 'pensions' ? 'bg-purple-500/10 text-purple-400' :
                  activeTab === 'banks' ? 'bg-blue-500/10 text-blue-400' :
                    activeTab === 'tax-returns' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-green-500/10 text-green-400'
                  }`}>
                  {activeTab === 'pensions' ? <ShieldCheck /> :
                    activeTab === 'banks' ? <Landmark /> :
                      activeTab === 'tax-returns' ? <Calculator /> :
                        <FileText />}
                </div>
                <h2 className="text-2xl font-bold capitalize">
                  {activeTab === 'financial-years' ? 'Pay Slips' :
                    activeTab === 'tax-returns' ? 'Tax Returns' :
                      activeTab} Management
                </h2>
              </div>
              <button onClick={() => setActiveTab(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {activeTab === 'pensions' && (
                <>
                  {/* Summary Card */}
                  <div className="mb-6 p-5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-500/30">
                    <h3 className="text-lg font-bold text-purple-400 mb-3">Portfolio Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <p className="text-[9px] text-purple-300 uppercase font-black tracking-wider mb-1">Total Portfolios</p>
                        <p className="text-2xl font-bold text-purple-400">{pensions.length}</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <p className="text-[9px] text-purple-300 uppercase font-black tracking-wider mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-purple-400">£{formatCurrency(totals.pensions)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pension List */}
                  <div className="grid gap-4">
                    {pensions.map(p => (
                      <div key={p.id} className="p-5 glass rounded-2xl border border-white/5 flex justify-between items-center group/item hover:border-purple-500/20 transition-all">
                        <div className="flex-1">
                          {p.url ? (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
                            >
                              {p.name}
                              <ExternalLink size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </a>
                          ) : (
                            <h4 className="font-bold">{p.name}</h4>
                          )}
                          <p className="text-xs text-slate-500">{p.notes || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold text-purple-400">£{formatCurrency(p.amount)}</span>
                          <button onClick={() => startEditPension(p)} className="text-slate-600 hover:text-purple-400 transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => deletePension(p.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                    {pensions.length === 0 && <p className="text-center py-12 text-slate-500 italic">No pensions added yet.</p>}
                  </div>

                  {/* Add Pension Form */}
                  {!showPensionForm ? (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <button
                        onClick={() => setShowPensionForm(true)}
                        className="w-full p-4 glass rounded-2xl border border-dashed border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5 transition-all text-center"
                      >
                        <Plus className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-purple-400">Add New Pension</p>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreatePension} className="mt-6 pt-6 border-t border-white/5">
                      <div className="p-6 glass rounded-2xl border border-purple-500/30 space-y-4">
                        <h3 className="text-lg font-bold text-purple-400 mb-4">
                          {editingPensionId ? 'Edit Pension' : 'Add New Pension'}
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                          <input
                            type="text"
                            value={pensionForm.name}
                            onChange={(e) => setPensionForm({ ...pensionForm, name: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
                            placeholder="e.g., Scottish Widows"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={pensionForm.amount}
                            onChange={(e) => setPensionForm({ ...pensionForm, amount: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Provider URL (optional)</label>
                          <input
                            type="url"
                            value={pensionForm.url}
                            onChange={(e) => setPensionForm({ ...pensionForm, url: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
                          <textarea
                            value={pensionForm.notes}
                            onChange={(e) => setPensionForm({ ...pensionForm, notes: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
                            placeholder="Additional notes..."
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors"
                          >
                            {editingPensionId ? 'Update Pension' : 'Add Pension'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPensionForm(false);
                              setPensionForm({ name: '', amount: '', url: '', notes: '' });
                              setEditingPensionId(null);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              )}

              {activeTab === 'banks' && (
                <>
                  {/* Summary Card */}
                  <div className="mb-6 p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/30">
                    <h3 className="text-lg font-bold text-blue-400 mb-3">Liquidity Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <p className="text-[9px] text-blue-300 uppercase font-black tracking-wider mb-1">Total Accounts</p>
                        <p className="text-2xl font-bold text-blue-400">{bankAccounts.length}</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <p className="text-[9px] text-blue-300 uppercase font-black tracking-wider mb-1">Total Balance</p>
                        <p className="text-2xl font-bold text-blue-400">£{formatCurrency(totals.banks)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Account List */}
                  <div className="grid gap-4">
                    {bankAccounts.map(b => (
                      <div key={b.id} className="p-5 glass rounded-2xl border border-white/5 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold">{b.name}</h4>
                          <p className="text-xs text-slate-500">{b.bank}{b.interest_rate ? ` • ${b.interest_rate}% APR` : ''}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold text-blue-400">£{formatCurrency(b.amount)}</span>
                          <button onClick={() => startEditBank(b)} className="text-slate-600 hover:text-blue-400 transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => deleteBank(b.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                    {bankAccounts.length === 0 && <p className="text-center py-12 text-slate-500 italic">No bank accounts added yet.</p>}
                  </div>

                  {/* Add Bank Account Form */}
                  {!showBankForm ? (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <button
                        onClick={() => setShowBankForm(true)}
                        className="w-full p-4 glass rounded-2xl border border-dashed border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5 transition-all text-center"
                      >
                        <Plus className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-blue-400">Add New Bank Account</p>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateBankAccount} className="mt-6 pt-6 border-t border-white/5">
                      <div className="p-6 glass rounded-2xl border border-blue-500/30 space-y-4">
                        <h3 className="text-lg font-bold text-blue-400 mb-4">
                          {editingBankId ? 'Edit Bank Account' : 'Add New Bank Account'}
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Account Name *</label>
                          <input
                            type="text"
                            value={bankForm.name}
                            onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                            placeholder="e.g., Main Savings"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Bank *</label>
                          <input
                            type="text"
                            value={bankForm.bank}
                            onChange={(e) => setBankForm({ ...bankForm, bank: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                            placeholder="e.g., Barclays"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Balance *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={bankForm.amount}
                            onChange={(e) => setBankForm({ ...bankForm, amount: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Interest Rate % (optional)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={bankForm.interest_rate}
                            onChange={(e) => setBankForm({ ...bankForm, interest_rate: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                            placeholder="e.g., 4.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Bank URL (optional)</label>
                          <input
                            type="url"
                            value={bankForm.url}
                            onChange={(e) => setBankForm({ ...bankForm, url: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
                          <textarea
                            value={bankForm.notes}
                            onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                            placeholder="Additional notes..."
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                          >
                            {editingBankId ? 'Update Account' : 'Add Account'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowBankForm(false);
                              setBankForm({ name: '', bank: '', amount: '', interest_rate: '', url: '', notes: '' });
                              setEditingBankId(null);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              )}

              {activeTab === 'financial-years' && (
                <>
                  {financialYears.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 italic">No financial year data uploaded yet.</p>
                  ) : (
                    <>
                      {/* Financial Years List */}
                      <div className="space-y-4">
                        {financialYears.map((fy) => (
                          <div key={fy.id} className="p-5 glass rounded-2xl border border-white/5 hover:border-green-500/20 transition-colors">
                            {/* Header with FY and delete button */}
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h3 className="text-2xl font-bold text-green-400">FY {fy.financial_year}</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                  Last updated: {new Date(fy.last_payslip_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteFinancialYear(fy.financial_year)}
                                className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            {/* Year to Date Totals */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <p className="text-[9px] text-blue-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">Taxable Pay</p>
                                <p className="text-base font-bold text-blue-400 whitespace-nowrap">£{formatCurrency(fy.total_taxable_pay)}</p>
                              </div>

                              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                <p className="text-[9px] text-green-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">Taxable NI Pay</p>
                                <p className="text-base font-bold text-green-400 whitespace-nowrap">£{formatCurrency(fy.total_taxable_ni_pay)}</p>
                              </div>

                              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <p className="text-[9px] text-red-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">PAYE Tax</p>
                                <p className="text-base font-bold text-red-400 whitespace-nowrap">£{formatCurrency(fy.total_paye_tax)}</p>
                              </div>

                              <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                <p className="text-[9px] text-orange-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">NI Contributions</p>
                                <p className="text-base font-bold text-orange-400 whitespace-nowrap">£{formatCurrency(fy.total_ni)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Upload Section */}
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <label className="block">
                      <input
                        type="file"
                        multiple
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        disabled={uploading}
                        className="hidden"
                        id="payslip-upload"
                      />
                      <div className="p-6 glass rounded-2xl border border-dashed border-green-500/30 hover:border-green-500/60 hover:bg-green-500/5 transition-all cursor-pointer text-center">
                        <Upload className="w-8 h-8 text-green-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-green-400 mb-1">
                          {uploading ? "Processing payslips..." : "Upload Payslips"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Click to select PDF files or drag and drop
                        </p>
                      </div>
                    </label>
                  </div>

                </>
              )}

              {activeTab === 'tax-returns' && (
                <>
                  {/* Summary Card */}
                  <div className="mb-6 p-5 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/30">
                    <h3 className="text-lg font-bold text-orange-400 mb-3">Tax Returns Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <p className="text-[9px] text-orange-300 uppercase font-black tracking-wider mb-1">Total Returns</p>
                        <p className="text-2xl font-bold text-orange-400">{taxReturns.length}</p>
                      </div>
                      <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <p className="text-[9px] text-orange-300 uppercase font-black tracking-wider mb-1">Total Tax Charge</p>
                        <p className="text-2xl font-bold text-orange-400">£{formatCurrency(taxReturns.reduce((sum, tr) => sum + tr.total_tax_charge, 0))}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tax Returns List */}
                  <div className="grid gap-4">
                    {taxReturns.map(tr => (
                      <div key={tr.id} className="p-5 glass rounded-2xl border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-xl text-orange-400">FY {tr.financial_year}</h4>
                            <p className="text-xs text-slate-500 mt-1">Payment deadline: {new Date(tr.payment_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {(tr as any).document_url && (
                              <a
                                href={(tr as any).document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-orange-500/10 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-all flex items-center gap-2 text-xs font-bold"
                              >
                                <ExternalLink size={14} />
                                DOCS
                              </a>
                            )}
                            <button onClick={() => startEditTaxReturn(tr)} className="text-slate-600 hover:text-orange-400 transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => deleteTaxReturn(tr.financial_year)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                            <p className="text-[9px] text-red-300 uppercase font-black tracking-wider mb-1">Total Tax Charge</p>
                            <p className="text-base font-bold text-red-400">£{formatCurrency(tr.total_tax_charge)}</p>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <p className="text-[9px] text-blue-300 uppercase font-black tracking-wider mb-1">PAYE Tax</p>
                            <p className="text-base font-bold text-blue-400">£{formatCurrency(tr.paye_tax)}</p>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                            <p className="text-[9px] text-green-300 uppercase font-black tracking-wider mb-1">Savings Tax</p>
                            <p className="text-base font-bold text-green-400">£{formatCurrency(tr.savings_tax)}</p>
                          </div>
                          <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <p className="text-[9px] text-orange-300 uppercase font-black tracking-wider mb-1">Child Benefit</p>
                            <p className="text-base font-bold text-orange-400">£{formatCurrency(tr.child_benefit_payback)}</p>
                          </div>
                        </div>

                        {tr.payment_reference && (
                          <p className="text-xs text-slate-400 mb-2">Reference: {tr.payment_reference}</p>
                        )}
                        {tr.personal_allowance_reduction && (
                          <p className="text-xs text-slate-400 mb-2">PA Reduction: {tr.personal_allowance_reduction}</p>
                        )}
                        {tr.notes && (
                          <p className="text-xs text-slate-500 italic mt-3 p-2 bg-white/5 rounded-lg">{tr.notes}</p>
                        )}
                      </div>
                    ))}
                    {taxReturns.length === 0 && <p className="text-center py-12 text-slate-500 italic">No tax returns added yet.</p>}
                  </div>

                  {/* Add/Edit Form */}
                  {!showTaxReturnForm ? (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <button
                        onClick={() => {
                          setShowTaxReturnForm(true);
                          setEditingTaxReturnId(null);
                          setTaxReturnForm({
                            financial_year: '',
                            total_tax_charge: '',
                            payment_deadline: '',
                            paye_tax: '',
                            savings_tax: '',
                            child_benefit_payback: '',
                            payment_reference: '',
                            personal_allowance_reduction: '',
                            notes: '',
                            document_url: ''
                          });
                        }}
                        className="w-full p-4 glass rounded-2xl border border-dashed border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/5 transition-all text-orange-400 font-medium"
                      >
                        <Plus className="inline mr-2" size={18} />
                        Add Tax Return
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateTaxReturn} className="mt-6 pt-6 border-t border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-2">Financial Year *</label>
                          <input
                            type="text"
                            placeholder="e.g., 2024/25"
                            value={taxReturnForm.financial_year}
                            onChange={(e) => setTaxReturnForm({ ...taxReturnForm, financial_year: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-2">Total Tax Charge *</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={taxReturnForm.total_tax_charge}
                            onChange={(e) => setTaxReturnForm({ ...taxReturnForm, total_tax_charge: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-2">Payment Deadline *</label>
                        <input
                          type="date"
                          value={taxReturnForm.payment_deadline}
                          onChange={(e) => setTaxReturnForm({ ...taxReturnForm, payment_deadline: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-2">PAYE Tax</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={taxReturnForm.paye_tax}
                            onChange={(e) => setTaxReturnForm({ ...taxReturnForm, paye_tax: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-2">Savings Tax</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={taxReturnForm.savings_tax}
                            onChange={(e) => setTaxReturnForm({ ...taxReturnForm, savings_tax: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-2">Child Benefit</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={taxReturnForm.child_benefit_payback}
                            onChange={(e) => setTaxReturnForm({ ...taxReturnForm, child_benefit_payback: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-2">Payment Reference</label>
                        <input
                          type="text"
                          placeholder="e.g., 7930446778K"
                          value={taxReturnForm.payment_reference}
                          onChange={(e) => setTaxReturnForm({ ...taxReturnForm, payment_reference: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-2">Personal Allowance Reduction</label>
                        <input
                          type="text"
                          placeholder="e.g., Reduced to £10,000"
                          value={taxReturnForm.personal_allowance_reduction}
                          onChange={(e) => setTaxReturnForm({ ...taxReturnForm, personal_allowance_reduction: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-2">Notes</label>
                        <textarea
                          placeholder="Additional notes..."
                          value={taxReturnForm.notes}
                          onChange={(e) => setTaxReturnForm({ ...taxReturnForm, notes: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-2">Document Shared Link (optional)</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={taxReturnForm.document_url || ''}
                          onChange={(e) => setTaxReturnForm({ ...taxReturnForm, document_url: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-medium transition-colors"
                        >
                          {editingTaxReturnId ? 'Update' : 'Add'} Tax Return
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTaxReturnForm(false);
                            setEditingTaxReturnId(null);
                          }}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>


          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[9px] font-black tracking-[0.4em] text-slate-500 uppercase">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          Core Engaged
        </div>
        <div className="opacity-20">|</div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          Data Nodes Synchronized
        </div>
        <div className="opacity-20">|</div>
        <div className="flex items-center gap-2">
          AES-256 Encrypted
        </div>
      </div>

    </main>
  );
}
