"use client";

import { useState, useEffect } from "react";
import {
  Calculator,
  FileText,
  Landmark,
  Plus,
  ShieldCheck,
  ArrowUpRight,
  Upload,
  ExternalLink,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  Send,
  Bot,
  Sparkles,
  Maximize2,
  Minimize2,
  History,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useAccountantData } from "@/hooks/use-accountant-data";
import toast, { Toaster } from "react-hot-toast";

interface Payslip {
  id: number;
  file_name: string;
  pay_date: string;
  net_pay: number;
  ytd_taxable_pay: number;
  ytd_taxable_ni_pay: number;
  ytd_paye_tax: number;
  ytd_ni: number;
}

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

  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
    { role: "bot", content: "I've analyzed your financial data. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<"pensions" | "banks" | "financial-years" | "tax-returns" | null>(null);

  useEffect(() => {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);
  const [welcomeFetched, setWelcomeFetched] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPensionForm, setShowPensionForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showTaxReturnForm, setShowTaxReturnForm] = useState(false);
  const [editingPensionId, setEditingPensionId] = useState<number | null>(null);
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [editingTaxReturnId, setEditingTaxReturnId] = useState<number | null>(null);
  const [expandedFYHistory, setExpandedFYHistory] = useState<Record<string, boolean>>({});
  const [fyHistoryData, setFYHistoryData] = useState<Record<string, Payslip[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});
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

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isThinking) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/financial-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          financialData: { pensions, bankAccounts, financialYears, taxReturns }
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: "bot", content: data.text }]);
        // Optional: speak the response if desired
        // speak(data.text);
      } else {
        toast.error(data.error || "Failed to get response");
      }
    } catch (error) {
      toast.error("Failed to connect to AI");
    } finally {
      setIsThinking(false);
    }
  };

  const toggleFYHistory = async (financialYear: string) => {
    if (expandedFYHistory[financialYear]) {
      setExpandedFYHistory(prev => ({ ...prev, [financialYear]: false }));
      return;
    }

    setExpandedFYHistory(prev => ({ ...prev, [financialYear]: true }));

    if (!fyHistoryData[financialYear]) {
      setLoadingHistory(prev => ({ ...prev, [financialYear]: true }));
      try {
        const res = await fetch(`/api/payslips?financialYear=${encodeURIComponent(financialYear)}`);
        const data = await res.json();
        if (data.success) {
          setFYHistoryData(prev => ({ ...prev, [financialYear]: data.payslips }));
        }
      } catch (error) {
        toast.error("Failed to load history");
      } finally {
        setLoadingHistory(prev => ({ ...prev, [financialYear]: false }));
      }
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
  const formatCurrency = (amount: number | null | undefined) => {
    const value = amount ?? 0;
    return value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <main className="min-h-screen gradient-bg text-white overflow-y-auto overflow-x-hidden relative font-sans scroll-smooth">
      <Toaster position="top-right" />

      {/* Background SVG for Data Flow */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none opacity-20">
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

      {/* Central Content Column */}
      <div className="wide:absolute wide:top-1/2 wide:left-1/2 wide:-translate-x-1/2 wide:-translate-y-1/2 flex flex-col items-center w-full wide:w-[800px] z-10 relative px-4 gap-8 wide:max-h-[90vh] wide:overflow-y-auto custom-scrollbar py-12 wide:py-0">

        {/* Title Section */}
        <div className="text-center z-20 w-full">
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
                    style={{ width: isMounted ? `${getFinancialYearProgress().progress}%` : '0%' }}
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
                <div className="mt-6 pt-6 border-t border-white/5 text-left">
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
                      style={{ width: isMounted ? `${getEarningsProgress().isOverTarget ? 100 : getEarningsProgress().progress}%` : '0%' }}
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

        {/* Engine and Chat Interface */}
        <div className="relative w-full flex flex-col items-center justify-center">
          {/* Decorative spinning rings */}
          <div className="absolute w-[400px] h-[400px] border border-blue-500/5 rounded-full animate-spin-slow pointer-events-none"></div>
          <div className="absolute w-[340px] h-[340px] border border-purple-500/5 rounded-full animate-spin-slow pointer-events-none" style={{ animationDirection: 'reverse' }}></div>

          {/* Chat Box Interface */}
          <div className={`w-full transition-all duration-500 ease-in-out z-50 ${isChatExpanded
            ? "fixed inset-0 m-0 rounded-none max-w-none h-full bg-slate-950/95 backdrop-blur-xl"
            : "max-w-xl glass-heavy rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col h-[500px]"
            } flex flex-col animate-in zoom-in duration-700`}>
            {/* Chat Header */}
            <div className={`p-4 border-b border-white/5 bg-white/5 flex items-center justify-between ${isChatExpanded ? "px-8 py-6" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Bot size={18} className="text-blue-400" />
                </div>
                <div>
                  <h2 className={`font-bold tracking-tight ${isChatExpanded ? "text-lg" : "text-sm"}`}>FINANCIAL ORACLE</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live Analysis Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Sparkles size={16} className="text-purple-400 animate-pulse" />
                <button
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                  title={isChatExpanded ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isChatExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth ${isChatExpanded ? "px-12 py-8 space-y-6" : "space-y-4"}`} id="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`${isChatExpanded ? 'max-w-[70%]' : 'max-w-[85%]'} p-4 rounded-2xl ${msg.role === 'user'
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 shadow-lg'
                    : 'bg-white/5 border border-white/10 text-slate-200'
                    }`}>
                    <p className={`${isChatExpanded ? 'text-base' : 'text-sm'} leading-relaxed whitespace-pre-wrap`}>{msg.content}</p>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className={`p-4 bg-white/5 border-t border-white/5 ${isChatExpanded ? "px-12 py-8" : ""}`}>
              <div className="relative max-w-4xl mx-auto">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your pensions, liquidity, or tax..."
                  className={`w-full bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-colors ${isChatExpanded ? "py-5 pl-6 pr-16 text-lg" : "py-3 pl-4 pr-12 text-sm"
                    }`}
                  disabled={isThinking}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isThinking}
                  className={`absolute top-1/2 -translate-y-1/2 rounded-xl bg-blue-500 text-white disabled:opacity-50 disabled:bg-slate-700 transition-all hover:scale-105 active:scale-95 ${isChatExpanded ? "right-4 p-3" : "right-2 p-2"
                    }`}
                >
                  <Send size={isChatExpanded ? 20 : 16} />
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center bg-white/5 px-8 py-4 rounded-3xl backdrop-blur-md border border-white/5 w-full max-w-[280px]">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[.4em] mb-1">Consolidated Net Worth</p>
            <h2 className="text-4xl font-light tracking-tight pb-1">£{totals.grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      {/* Corner Sections */}

      {/* Top Left: Pensions */}
      <section
        className="wide:absolute wide:top-24 wide:left-12 w-full max-w-sm mx-auto wide:w-80 group cursor-pointer relative mb-6 wide:mb-0 px-4 wide:px-0"
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
        className="wide:absolute wide:top-24 wide:right-12 w-full max-w-sm mx-auto wide:w-80 wide:text-right group cursor-pointer relative mb-6 wide:mb-0 px-4 wide:px-0"
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
          <div className="flex items-baseline gap-2 wide:justify-end">
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
        className="wide:absolute wide:bottom-24 wide:left-12 w-full max-w-sm mx-auto wide:w-80 group cursor-pointer relative mb-6 wide:mb-0 px-4 wide:px-0"
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
        className="wide:absolute wide:bottom-24 wide:right-12 w-full max-w-sm mx-auto wide:w-80 wide:text-right group cursor-pointer relative mb-6 wide:mb-0 px-4 wide:px-0"
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
          <div className="flex items-baseline gap-2 wide:justify-end">
            <span className="text-3xl font-bold">{taxReturns.length}</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Filed</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <ArrowUpRight size={14} className="scale-x-[-1] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform" />
            <span>{taxReturns.length} Years</span>
          </div>
        </div>
      </section>

      {/* Management Overlays */}

      {/* Section Management Overlay */}
      {activeTab && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[90] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className={`${activeTab === 'financial-years' ? 'max-w-7xl' : 'max-w-4xl'} w-full glass rounded-[32px] sm:rounded-[40px] p-4 sm:p-8 border border-white/10 shadow-2xl animate-in zoom-in duration-500 overflow-hidden flex flex-col max-h-[90vh]`}>
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
                  <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-500/30">
                    <h3 className="text-lg font-bold text-purple-400 mb-3 text-center sm:text-left">Portfolio Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center sm:text-left">
                        <p className="text-[9px] text-purple-300 uppercase font-black tracking-wider mb-1">Total Portfolios</p>
                        <p className="text-2xl font-bold text-purple-400">{pensions.length}</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center sm:text-left">
                        <p className="text-[9px] text-purple-300 uppercase font-black tracking-wider mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-purple-400">£{formatCurrency(totals.pensions)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pension List */}
                  <div className="grid gap-4">
                    {pensions.map(p => (
                      <div key={p.id} className="p-4 sm:p-5 glass rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group/item hover:border-purple-500/20 transition-all">
                        <div className="flex-1 w-full">
                          {p.url ? (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
                            >
                              {p.name}
                              <ExternalLink size={14} className="opacity-0 sm:group-hover/item:opacity-100 transition-opacity" />
                            </a>
                          ) : (
                            <h4 className="font-bold">{p.name}</h4>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{p.notes || 'No description'}</p>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:border-none">
                          <span className="text-xl font-bold text-purple-400">£{formatCurrency(p.amount)}</span>
                          <div className="flex gap-4">
                            <button onClick={() => startEditPension(p)} className="text-slate-600 hover:text-purple-400 transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => deletePension(p.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                          </div>
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
                  <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/30">
                    <h3 className="text-lg font-bold text-blue-400 mb-3 text-center sm:text-left">Liquidity Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center sm:text-left">
                        <p className="text-[9px] text-blue-300 uppercase font-black tracking-wider mb-1">Total Accounts</p>
                        <p className="text-2xl font-bold text-blue-400">{bankAccounts.length}</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center sm:text-left">
                        <p className="text-[9px] text-blue-300 uppercase font-black tracking-wider mb-1">Total Balance</p>
                        <p className="text-2xl font-bold text-blue-400">£{formatCurrency(totals.banks)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Account List */}
                  <div className="grid gap-4">
                    {bankAccounts.map(b => (
                      <div key={b.id} className="p-4 sm:p-5 glass rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group/item hover:border-blue-500/20 transition-all">
                        <div className="flex-1 w-full">
                          <h4 className="font-bold">{b.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{b.bank}{b.interest_rate ? ` • ${b.interest_rate}% APR` : ''}</p>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:border-none">
                          <span className="text-xl font-bold text-blue-400">£{formatCurrency(b.amount)}</span>
                          <div className="flex gap-4">
                            <button onClick={() => startEditBank(b)} className="text-slate-600 hover:text-blue-400 transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => deleteBank(b.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                          </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <p className="text-[9px] text-blue-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">Taxable Pay</p>
                                <p className="text-base font-bold text-blue-400">£{formatCurrency(fy.total_taxable_pay)}</p>
                              </div>

                              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                <p className="text-[9px] text-green-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">Taxable NI Pay</p>
                                <p className="text-base font-bold text-green-400">£{formatCurrency(fy.total_taxable_ni_pay)}</p>
                              </div>

                              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <p className="text-[9px] text-red-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">PAYE Tax</p>
                                <p className="text-base font-bold text-red-400">£{formatCurrency(fy.total_paye_tax)}</p>
                              </div>

                              <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                <p className="text-[9px] text-orange-300 uppercase font-black tracking-wider mb-1 whitespace-nowrap">NI Contributions</p>
                                <p className="text-base font-bold text-orange-400">£{formatCurrency(fy.total_ni)}</p>
                              </div>
                            </div>

                            {/* History Toggle */}
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => toggleFYHistory(fy.financial_year)}
                                className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-green-400 transition-colors"
                              >
                                {expandedFYHistory[fy.financial_year] ? (
                                  <>Hide History <X size={14} /></>
                                ) : (
                                  <>View History <History size={14} /></>
                                )}
                              </button>
                            </div>

                            {/* History Table */}
                            {expandedFYHistory[fy.financial_year] && (
                              <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                                {loadingHistory[fy.financial_year] ? (
                                  <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="text-slate-500 uppercase tracking-widest font-black border-b border-white/5">
                                          <th className="pb-3 pr-4">Date</th>
                                          <th className="pb-3 px-4">Taxable Pay</th>
                                          <th className="pb-3 px-4">NI Pay</th>
                                          <th className="pb-3 px-4">PAYE Tax</th>
                                          <th className="pb-3 px-4">NI Contrib</th>
                                          <th className="pb-3 pl-4">Added</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                        {(fyHistoryData[fy.financial_year] || []).map((payslip, idx, all) => {
                                          const prev = all[idx + 1]; // Older payslip
                                          const delta = prev ? {
                                            pay: (payslip.ytd_taxable_pay ?? 0) - (prev.ytd_taxable_pay ?? 0),
                                            ni_pay: (payslip.ytd_taxable_ni_pay ?? 0) - (prev.ytd_taxable_ni_pay ?? 0),
                                            tax: (payslip.ytd_paye_tax ?? 0) - (prev.ytd_paye_tax ?? 0),
                                            ni: (payslip.ytd_ni ?? 0) - (prev.ytd_ni ?? 0)
                                          } : {
                                            pay: payslip.ytd_taxable_pay ?? 0,
                                            ni_pay: payslip.ytd_taxable_ni_pay ?? 0,
                                            tax: payslip.ytd_paye_tax ?? 0,
                                            ni: payslip.ytd_ni ?? 0
                                          };

                                          return (
                                            <tr key={payslip.id} className="group hover:bg-white/5 transition-colors">
                                              <td className="py-3 pr-4 font-medium text-slate-300">
                                                {new Date(payslip.pay_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                              </td>
                                              <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                  <span>£{formatCurrency(payslip.ytd_taxable_pay)}</span>
                                                  <span className="text-[9px] text-green-400 font-bold">+{formatCurrency(delta.pay)}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                  <span>£{formatCurrency(payslip.ytd_taxable_ni_pay)}</span>
                                                  <span className="text-[9px] text-green-400 font-bold">+{formatCurrency(delta.ni_pay)}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                  <span>£{formatCurrency(payslip.ytd_paye_tax)}</span>
                                                  <span className="text-[9px] text-red-400 font-bold">+{formatCurrency(delta.tax)}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                  <span>£{formatCurrency(payslip.ytd_ni)}</span>
                                                  <span className="text-[9px] text-orange-400 font-bold">+{formatCurrency(delta.ni)}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 pl-4">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                                                  <TrendingUp size={10} className="text-green-400" />
                                                  £{formatCurrency(delta.pay)}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      <div className="hidden wide:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-6 text-[9px] font-black tracking-[0.4em] text-slate-500 uppercase">
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
