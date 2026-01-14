"use client";

import { useState } from "react";
import { Calculator, FileText, Mail, Upload, Download } from "lucide-react";

export default function AccountantPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center p-8 text-white">
      <div className="max-w-4xl w-full glass rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Accountant Assistant
          </h1>
          <p className="text-gray-400">Financial analysis and reporting tools</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* File Processing Card */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-200">Document Analysis</h3>
                <p className="text-xs text-gray-400">Upload and analyze financial documents</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-300">Upload File</label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  accept=".pdf,.csv,.xlsx,.xls"
                />
              </div>
              {selectedFile && (
                <p className="text-xs text-green-400">✓ {selectedFile.name}</p>
              )}
              <button className="w-full px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-all disabled:bg-gray-800 disabled:text-gray-400"
                disabled>
                <Upload className="w-4 h-4" />
                Analyze Document (Coming Soon)
              </button>
            </div>
          </div>

          {/* Email Reports Card */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-200">Report Distribution</h3>
                <p className="text-xs text-gray-400">Send financial reports via email</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Recipient email"
                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
              />
              <textarea
                placeholder="Message"
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
              />
              <button className="w-full px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 transition-all disabled:bg-gray-800 disabled:text-gray-400"
                disabled>
                <Mail className="w-4 h-4" />
                Send Report (Coming Soon)
              </button>
            </div>
          </div>

        </div>

        {/* Quick Actions Section */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h3 className="font-semibold text-gray-300 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Quick Actions
          </h3>

          <div className="grid md:grid-cols-3 gap-3">
            <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left disabled:opacity-50"
              disabled>
              <Download className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-sm font-medium text-gray-200">Generate P&L</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </button>

            <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left disabled:opacity-50"
              disabled>
              <Download className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-sm font-medium text-gray-200">Tax Summary</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </button>

            <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left disabled:opacity-50"
              disabled>
              <Download className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm font-medium text-gray-200">Cash Flow</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </button>
          </div>
        </div>

        {/* Information Panel */}
        <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/20">
          <h4 className="font-medium text-blue-300 mb-2">About This Assistant</h4>
          <p className="text-sm text-gray-300">
            The Accountant Assistant will help you with financial analysis, document processing,
            and report generation. Features include reading financial files, generating summaries,
            and sending reports via email using the common utilities.
          </p>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
          <span>v2.0.0</span>
          <span>Template Version</span>
        </div>
      </div>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
    </main>
  );
}
