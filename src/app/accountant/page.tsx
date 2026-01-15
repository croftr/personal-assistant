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
  X
} from "lucide-react";
import { useAccountantData } from "@/hooks/use-accountant-data";
import toast, { Toaster } from "react-hot-toast";

export default function AccountantPage() {
  const {
    pensions,
    payslips,
    bankAccounts,
    loading,
    totals,
    refreshPensions,
    refreshPayslips,
    refreshBankAccounts
  } = useAccountantData();

  const [summary, setSummary] = useState<{
    score: number;
    summary: string;
    recommendations: string[];
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pensions" | "banks" | "payslips" | null>(null);

  const generateSummary = async () => {
    try {
      setAnalyzing(true);
      const res = await fetch("/api/financial-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pensions, payslips, bankAccounts })
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
        <h1 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400">
          FINANCIAL ENGINE
        </h1>
        <p className="text-slate-400 mt-2 font-light tracking-widest uppercase text-[10px]">Autonomous Intelligence • Real-time Analysis</p>
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

      {/* Bottom Left: Payslips */}
      <section
        className="absolute bottom-24 left-12 w-80 group cursor-pointer"
        onClick={() => setActiveTab("payslips")}
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
          <p className="text-slate-500 text-xs mb-4 font-light">Automated Payslip Engine</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">£{totals.payslips.toLocaleString()}</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Cumulative Net</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            <span>{payslips.length} Ingested</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Bottom Right: Future Section */}
      <section className="absolute bottom-24 right-12 w-80 text-right group opacity-40 hover:opacity-100 transition-opacity">
        <div className="glass p-6 rounded-3xl border border-dashed border-white/20 hover:border-slate-500/50 transition-all duration-500">
          <div className="flex justify-end mb-6">
            <div className="p-3 bg-white/5 rounded-2xl text-slate-500">
              <TrendingUp size={28} />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-1 tracking-tight text-slate-500">Expenses</h3>
          <p className="text-slate-600 text-xs mb-4 font-light">Neural Mapping Incoming</p>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-2xl italic text-slate-700 font-light lowercase">Module Locked</span>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-end items-center text-[10px] font-bold tracking-widest text-slate-700 uppercase">
            <span>v2.0 Beta</span>
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
          <div className="max-w-4xl w-full glass rounded-[40px] p-8 border border-white/10 shadow-2xl animate-in zoom-in duration-500 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${activeTab === 'pensions' ? 'bg-purple-500/10 text-purple-400' :
                    activeTab === 'banks' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                  }`}>
                  {activeTab === 'pensions' ? <ShieldCheck /> : activeTab === 'banks' ? <Landmark /> : <FileText />}
                </div>
                <h2 className="text-2xl font-bold capitalize">{activeTab} Management</h2>
              </div>
              <button onClick={() => setActiveTab(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {activeTab === 'pensions' && (
                <div className="grid gap-4">
                  {pensions.map(p => (
                    <div key={p.id} className="p-5 glass rounded-2xl border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{p.name}</h4>
                        <p className="text-xs text-slate-500">{p.notes || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xl font-bold text-purple-400">£{p.amount.toLocaleString()}</span>
                        <button onClick={() => deletePension(p.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                  {pensions.length === 0 && <p className="text-center py-12 text-slate-500 italic">No node data detected.</p>}
                </div>
              )}

              {activeTab === 'banks' && (
                <div className="grid gap-4">
                  {bankAccounts.map(b => (
                    <div key={b.id} className="p-5 glass rounded-2xl border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{b.name}</h4>
                        <p className="text-xs text-slate-500">{b.bank} • {b.interest_rate}% APR</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xl font-bold text-blue-400">£{b.amount.toLocaleString()}</span>
                        <button onClick={() => deleteBank(b.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'payslips' && (
                <div className="grid gap-4">
                  {payslips.map(p => (
                    <div key={p.id} className="p-5 glass rounded-2xl border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{new Date(p.pay_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h4>
                        <p className="text-xs text-slate-500">{p.file_name}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xl font-bold text-green-400">£{p.net_pay.toLocaleString()}</span>
                          <p className="text-[9px] text-slate-500 uppercase font-black">Net Pay</p>
                        </div>
                        <button className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
              <button className="px-12 py-4 bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] rounded-2xl font-bold tracking-widest text-[10px] uppercase transition-all">
                Synchronize New Data Source
              </button>
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
