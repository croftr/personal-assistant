"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, FolderOpen } from "lucide-react";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessExpenses = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatus("idle");
    setMessage("Analyzing your receipts...");

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        // Filter for images and PDFs
        if (files[i].type.startsWith("image/") || files[i].type === "application/pdf") {
          formData.append("files", files[i]);
        }
      }

      if (formData.getAll("files").length === 0) {
        setStatus("error");
        setMessage("No valid receipt files (images/PDFs) found in directory.");
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/process-expenses", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process expenses");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().split("T")[0];
      a.download = `expenses_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus("success");
      setMessage("Expenses processed successfully! CSV downloaded.");
    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
      setMessage("Something went wrong while processing receipts.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-2xl w-full glass rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Rob's Personal Assistant
          </h1>
          <p className="text-gray-400">Streamlining your admin tasks with AI.</p>
        </div>

        <div className="grid gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Process Expenses
                </h2>
                <p className="text-sm text-gray-400">
                  Select a folder containing your receipt photos or PDFs.
                  We'll extract the details and generate a CSV report.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProcessExpenses}
                className="hidden"
                // @ts-ignore - webkitdirectory is not in standard React types but works in most browsers
                webkitdirectory=""
                directory=""
                multiple
              />

              <button
                onClick={triggerFilePicker}
                disabled={isProcessing}
                className={`w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 transition-all ${isProcessing
                    ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                  }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FolderOpen className="w-5 h-5" />
                )}
                {isProcessing ? "Processing Receipts..." : "Select Expense Folder"}
              </button>
            </div>

            {status !== "idle" && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${status === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                {status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
          <span>v1.0.0</span>
          <span>Powered by Gemini 1.5 Flash</span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
    </main>
  );
}
