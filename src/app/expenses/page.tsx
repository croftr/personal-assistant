"use client";

import { useState, useEffect } from "react";
import { Loader2, FolderOpen, Play, FileText, CheckCircle2, AlertCircle, Search, Save, FolderArchive, Mail, ChevronRight, History, Eye, Calendar, Trash2 } from "lucide-react";
import { parseCsvToRows } from "@/lib/common/csv-formatter";
import type { ExpenseRow } from "@/types/expenses";
import type { ExpenseReport, StoredExpense } from "@/types/common";
import toast, { Toaster } from 'react-hot-toast';
import { ExpenseStatistics } from "@/components/expenses/ExpenseStatistics";

// --- File System Access API Types (Polyfill for TS) ---
interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

// --- Main Component ---

export default function ExpensesPage() {
  // Input State
  const [folderPath, setFolderPath] = useState("");
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pathModeFiles, setPathModeFiles] = useState<string[]>([]);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Data State
  const [csvData, setCsvData] = useState<ExpenseRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [csvContent, setCsvContent] = useState<string>("");

  // Report Name
  const today = new Date().toISOString().split("T")[0];
  const [reportName, setReportName] = useState<string>(`Expense Report - ${today}`);

  // Output Mode
  const [outputMode, setOutputMode] = useState<"save" | "download">("save");

  // Workflow State
  const [workflowStep, setWorkflowStep] = useState<"idle" | "zip" | "email" | "complete">("idle");
  const [zipData, setZipData] = useState<string>("");
  const [zipFileName, setZipFileName] = useState<string>("");
  const [emailRecipient, setEmailRecipient] = useState<string>("rob80659@gchq.gov.uk");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");

  // Standalone workflow inputs
  const [standaloneZipPath, setStandaloneZipPath] = useState<string>("");
  const [uploadedZipFile, setUploadedZipFile] = useState<File | null>(null);

  // Report History State
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ExpenseReport | null>(null);
  const [reportExpenses, setReportExpenses] = useState<StoredExpense[]>([]);
  const [showReportHistory, setShowReportHistory] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [viewingReport, setViewingReport] = useState(false);

  // Statistics State
  const [statistics, setStatistics] = useState<{
    total_reports: number;
    total_expenses: number;
    total_amount: number;
    categories: {
      meals: { count: number; amount: number };
      travel: { count: number; amount: number };
      accommodation: { count: number; amount: number };
      other: { count: number; amount: number };
    };
  } | null>(null);

  // Derived Mode
  const isPickerMode = directoryHandle !== null;

  // --- Helpers ---
  const parseCsvHelper = (csvContent: string) => {
    const { rows, total } = parseCsvToRows(csvContent);
    setCsvData(rows);
    setTotalAmount(total);
  };

  const downloadCsvFile = (csvContent: string) => {
    const today = new Date().toISOString().split("T")[0];
    const fileName = `expenses_${today}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetch('/api/expense-reports');
      if (!response.ok) throw new Error('Failed to load reports');
      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load report history');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/expense-reports?includeStatistics=true');
      if (!response.ok) throw new Error('Failed to load statistics');
      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Failed to load statistics');
    }
  };

  const loadReportDetails = async (reportId: number) => {
    setViewingReport(true);
    try {
      const response = await fetch(`/api/expense-reports?id=${reportId}&includeExpenses=true`);
      if (!response.ok) throw new Error('Failed to load report details');
      const data = await response.json();
      setSelectedReport(data.report);
      setReportExpenses(data.expenses);
    } catch (error) {
      console.error('Error loading report details:', error);
      toast.error('Failed to load report details');
      setViewingReport(false);
    }
  };

  const closeReportView = () => {
    setViewingReport(false);
    setSelectedReport(null);
    setReportExpenses([]);
  };

  const handleDeleteReport = async (reportId: number) => {
    // Use toast.promise for confirmation-style interaction
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Delete this report?</p>
        <p className="text-sm text-gray-600">This will also delete all associated expenses.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await fetch(`/api/expense-reports?id=${reportId}`, {
                  method: 'DELETE',
                });

                if (!response.ok) throw new Error('Failed to delete report');

                // Refresh the reports list and statistics
                await loadReports();
                await loadStatistics();

                // Close modal if viewing the deleted report
                if (selectedReport?.id === reportId) {
                  closeReportView();
                }

                toast.success('Report deleted successfully');
              } catch (error) {
                console.error('Error deleting report:', error);
                toast.error('Failed to delete report');
              }
            }}
            className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  };

  // Load reports and statistics when showing history
  useEffect(() => {
    if (showReportHistory) {
      if (reports.length === 0) {
        loadReports();
      }
      if (!statistics) {
        loadStatistics();
      }
    }
  }, [showReportHistory]);

  // --- Handlers ---

  const handleFolderPicker = async () => {
    try {
      if (!window.showDirectoryPicker) {
        throw new Error("Your browser does not support folder access. Please use Chrome/Edge or manually enter the path.");
      }

      const handle = await window.showDirectoryPicker();

      // Read files immediately
      const files: File[] = [];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

      // Attempt to sniff absolute path
      let detectedPath = "";

      for await (const entry of handle.values()) {
        if (entry.kind === "file") {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();

          // Check for non-standard absolute path property (User suggestion)
          // @ts-ignore
          const rawPath = file.path;
          if (!detectedPath && rawPath && typeof rawPath === 'string') {
            // Simple check for Windows absolute path
            if (rawPath.match(/^[a-zA-Z]:\\/)) {
              detectedPath = rawPath.substring(0, rawPath.lastIndexOf('\\'));
            }
          }

          const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
          if (validExtensions.includes(ext)) {
            files.push(file);
          }
        }
      }

      if (detectedPath) {
        // Switch to Server Path Mode (Best experience)
        setFolderPath(detectedPath);
        setDirectoryHandle(null);
        setPathModeFiles(files.map(f => f.name));
        setSelectedFiles([]);
        setMessage(`Path detected: ${detectedPath}`);
      } else {
        // Fallback to Handle Mode (Client write)
        setFolderPath(`Selected: ${handle.name}`);
        setDirectoryHandle(handle);
        setSelectedFiles(files);
        setMessage("Ready. (Browser Mode)");
      }

      setCsvData([]);
      setStatus("idle");

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatus("error");
        setMessage(err.message);
      }
    }
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirectoryHandle(null);
    setSelectedFiles([]);
    setFolderPath(e.target.value);
    setCsvData([]);
    setStatus("idle");
    setMessage("");
  };

  const handleScanPath = async () => {
    if (!folderPath || isPickerMode) return;

    try {
      setIsProcessing(true);
      setStatus("scanning");
      setSelectedFiles([]);
      setCsvData([]);

      const res = await fetch("/api/process-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderPath, action: "scan" }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      const data = await res.json();
      setPathModeFiles(data.files);
      setStatus("idle");
      setMessage("");
      toast.success(`Found ${data.files.length} receipt files`);

    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Unified list for display
  const fileList = isPickerMode ? selectedFiles.map(f => f.name) : pathModeFiles;


  const executeProcess = async () => {
    setIsProcessing(true);
    setStatus("processing");
    setMessage("Processing receipts...");
    setCsvData([]);

    let writable: FileSystemWritableFileStream | null = null;

    try {
      // -------------------------------------------------------------------------
      // STEP 1: PRE-AUTHORIZE WRITE (Only if save mode and picker mode)
      // -------------------------------------------------------------------------
      if (outputMode === "save" && isPickerMode && directoryHandle) {
        try {
          const today = new Date().toISOString().split("T")[0];
          const fileName = `expenses_${today}.csv`;
          const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
          writable = await fileHandle.createWritable();
        } catch (err: any) {
          throw new Error(`Permission denied for saving file: ${err.message}`);
        }
      }

      // -------------------------------------------------------------------------
      // STEP 2: PROCESS (Long running async operation)
      // -------------------------------------------------------------------------
      let csvContent = "";

      if (isPickerMode) {
        // --- PICKER MODE ---
        const formData = new FormData();
        selectedFiles.forEach(f => formData.append("files", f));
        formData.append("outputMode", outputMode);
        formData.append("reportName", reportName);

        if (formData.getAll("files").length === 0) throw new Error("No valid files.");

        const response = await fetch("/api/process-expenses", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error((await response.json()).error);
        const data = await response.json();
        csvContent = data.csvContent;

      } else {
        // --- PATH MODE ---
        const response = await fetch("/api/process-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: folderPath, action: "process", outputMode, reportName }),
        });

        if (!response.ok) throw new Error((await response.json()).error);
        const data = await response.json();
        csvContent = data.csvContent;
      }

      // -------------------------------------------------------------------------
      // STEP 3: HANDLE OUTPUT (Save or Download)
      // -------------------------------------------------------------------------
      if (outputMode === "download") {
        setMessage("Downloading report...");
        downloadCsvFile(csvContent);
      } else if (writable) {
        setMessage("Saving report...");
        await writable.write(csvContent);
        await writable.close();
        writable = null;
      }

      parseCsvHelper(csvContent);
      setCsvContent(csvContent); // Store for workflow
      setStatus("success");
      const successMsg = outputMode === "download" ? "Success! Report downloaded." : "Success! Report saved to folder.";
      setMessage(successMsg);
      toast.success(successMsg);
      setWorkflowStep("idle"); // Reset workflow

      // Reload statistics if report history is shown
      if (showReportHistory) {
        await loadStatistics();
        await loadReports();
      }

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      const errorMsg = err.message || "Failed to process.";
      setMessage(errorMsg);
      toast.error(errorMsg);

      // Cleanup if open
      if (writable) {
        try { await writable.close(); } catch (e) { }
      }

    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateZip = async (useStandalonePath: boolean = false) => {
    setIsProcessing(true);
    setWorkflowStep("zip");
    setMessage("Creating ZIP file...");

    try {
      let response;
      const pathToUse = useStandalonePath ? standaloneZipPath : folderPath;

      if (isPickerMode && !useStandalonePath) {
        // Browser mode: send files from picker
        const formData = new FormData();
        selectedFiles.forEach(f => formData.append("receipts", f));

        // Create CSV file from content if available
        if (csvContent) {
          const csvBlob = new Blob([csvContent], { type: 'text/csv' });
          const today = new Date().toISOString().split("T")[0];
          const csvFile = new File([csvBlob], `expenses_${today}.csv`, { type: 'text/csv' });
          formData.append("csv", csvFile);
        }

        response = await fetch("/api/create-zip", {
          method: "POST",
          body: formData,
        });
      } else {
        // Path mode: server reads files
        if (!pathToUse) {
          throw new Error("Please enter a folder path");
        }

        response = await fetch("/api/create-zip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderPath: pathToUse,
            csvContent: csvContent || undefined
          }),
        });
      }

      if (!response.ok) throw new Error((await response.json()).error);

      const data = await response.json();
      setZipData(data.zipData);
      setZipFileName(data.fileName);
      setMessage("ZIP file created successfully!");
      toast.success("ZIP file created and downloaded!");

      // Auto-download the zip
      const zipBlob = new Blob([Buffer.from(data.zipData, 'base64')], { type: 'application/zip' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      const errorMsg = err.message || "Failed to create ZIP";
      setMessage(errorMsg);
      toast.error(errorMsg);
      setWorkflowStep("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipient) {
      const msg = "Please enter recipient email";
      setMessage(msg);
      toast.error(msg);
      return;
    }

    setIsProcessing(true);
    setWorkflowStep("email");
    setMessage("Sending email...");

    try {
      let zipDataToSend = zipData;
      let fileNameToSend = zipFileName;

      // If user uploaded a ZIP file, convert it to base64
      if (uploadedZipFile) {
        const arrayBuffer = await uploadedZipFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        zipDataToSend = buffer.toString('base64');
        fileNameToSend = uploadedZipFile.name;
      }

      if (!zipDataToSend) {
        const msg = "No ZIP file available. Please create or upload a ZIP file first.";
        setMessage(msg);
        toast.error(msg);
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: emailRecipient,
          subject: emailSubject || reportName,
          message: emailMessage || "Please find your expenses attached Sir",
          zipData: zipDataToSend,
          fileName: fileNameToSend,
        }),
      });

      if (!response.ok) throw new Error((await response.json()).error);

      const successMsg = `Email sent successfully to ${emailRecipient}!`;
      setMessage(successMsg);
      toast.success(successMsg);
      setWorkflowStep("complete");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      const errorMsg = err.message || "Failed to send email";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center p-8 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="max-w-7xl w-full glass rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 z-10">

        <div className="text-center space-y-6">
          <div className="flex justify-center mb-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img src="/logo.svg" alt="Logo" className="relative w-24 h-24 animate-float" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
            Expense Processor
          </h1>
          <p className="text-xl text-gray-300">Automated Receipt Management & Analysis</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-300 ml-1">Receipts Location</label>

            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <button
                  onClick={handleFolderPicker}
                  className="absolute left-1 top-1 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
                  title="Select folder"
                >
                  {isPickerMode ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <FolderOpen className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={folderPath}
                  onChange={handlePathChange}
                  readOnly={isPickerMode}
                  placeholder="Enter path manually OR click icon to select folder"
                  className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-all font-mono text-sm ${isPickerMode ? 'cursor-default text-green-400' : ''}`}
                />

                {isPickerMode && (
                  <button
                    onClick={() => { setDirectoryHandle(null); setSelectedFiles([]); setFolderPath(""); setPathModeFiles([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {!isPickerMode && (
                <button
                  onClick={handleScanPath}
                  disabled={isProcessing || !folderPath}
                  className="px-6 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center gap-2"
                >
                  <Search className="w-5 h-5" /> Scan
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 ml-1">Output Method</label>
            <div className="flex gap-3">
              <button
                onClick={() => setOutputMode("save")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${outputMode === "save"
                  ? "bg-blue-600 text-white border-2 border-blue-500"
                  : "bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10"
                  }`}
              >
                <Save className="w-4 h-4" />
                Save to Folder
              </button>
              <button
                onClick={() => setOutputMode("download")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${outputMode === "download"
                  ? "bg-blue-600 text-white border-2 border-blue-500"
                  : "bg-white/5 text-gray-400 border-2 border-white/10 hover:bg-white/10"
                  }`}
              >
                <FileText className="w-4 h-4" />
                Download via Browser
              </button>
            </div>
            {outputMode === "download" && (
              <p className="text-xs text-gray-400 ml-1">CSV will be downloaded to your browser's default download folder</p>
            )}
            {outputMode === "save" && !isPickerMode && (
              <p className="text-xs text-gray-400 ml-1">CSV will be saved to the receipt folder</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 ml-1">Report Name</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
            <p className="text-xs text-gray-400 ml-1">This name will be used for the database report entry</p>
          </div>

          {(fileList.length > 0 || status !== 'idle') && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5 animate-in fade-in">
              <div className="flex items-center gap-3 text-sm min-h-[24px]">
                {status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                {status === "success" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                {(status === "scanning" || status === "processing") && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                <span className={status === "error" ? "text-red-400" : "text-gray-300"}>{message}</span>
              </div>

              {fileList.length > 0 && (
                <button
                  onClick={executeProcess}
                  disabled={isProcessing}
                  className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg active:scale-95 ${isProcessing
                    ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isProcessing ? "Processing..." : "Create Report"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {fileList.length > 0 && (
            <div className="md:col-span-1 p-6 rounded-2xl bg-white/5 border border-white/10 h-fit max-h-[500px] overflow-y-auto">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-300">
                <FileText className="w-4 h-4" />
                Receipts ({fileList.length})
              </h3>
              <ul className="space-y-2">
                {fileList.map((fileName, idx) => (
                  <li key={idx} className="text-xs text-gray-400 truncate font-mono py-1 border-b border-white/5 last:border-0">
                    {fileName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="md:col-span-2">
            {csvData.length > 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-300">Statement Preview</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-white/5">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Receipt</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {csvData.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-mono text-gray-400 truncate max-w-[150px]" title={row.fileName}>{row.fileName}</td>
                          <td className="px-4 py-3 font-mono text-gray-400 whitespace-nowrap">{row.date}</td>
                          <td className="px-4 py-3">{row.description}</td>
                          <td className="px-4 py-3 text-right font-mono text-green-400 whitespace-nowrap">£{row.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-white/5 font-bold">
                        <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                        <td className="px-4 py-3 text-right text-green-400">£{totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              status === 'idle' && fileList.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 min-h-[200px] border-2 border-dashed border-white/10 rounded-2xl p-8">
                  <p className="text-sm">Enter a path or click the folder icon to start.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Main Content and Report History Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left/Main Column - Workflow and Additional Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Section - Always Visible */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
              <h3 className="font-semibold text-gray-300 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Additional Actions (Optional)
              </h3>

              {/* Step 1: Create ZIP */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${workflowStep === "zip" || workflowStep === "email" || workflowStep === "complete"
                      ? "bg-green-600"
                      : "bg-white/10"
                      }`}>
                      {workflowStep === "zip" || workflowStep === "email" || workflowStep === "complete" ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-sm text-gray-400">1</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">Create ZIP Archive</p>
                      <p className="text-xs text-gray-400">Bundle receipts and CSV into a single file</p>
                    </div>
                  </div>
                </div>

                {workflowStep !== "zip" && workflowStep !== "email" && workflowStep !== "complete" && (
                  <div className="ml-11 space-y-3 bg-black/20 p-4 rounded-lg border border-white/5">
                    {!csvContent && (
                      <>
                        <label className="text-xs text-gray-400">Folder path containing receipts:</label>
                        <input
                          type="text"
                          placeholder="C:\path\to\receipts"
                          value={standaloneZipPath}
                          onChange={(e) => setStandaloneZipPath(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 text-sm font-mono"
                        />
                      </>
                    )}
                    <button
                      onClick={() => handleCreateZip(!csvContent)}
                      disabled={isProcessing || (!csvContent && !standaloneZipPath)}
                      className="w-full px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-all disabled:bg-gray-800 disabled:text-gray-400"
                    >
                      <FolderArchive className="w-4 h-4" />
                      {isProcessing ? "Creating..." : "Create ZIP"}
                    </button>
                  </div>
                )}

                {(workflowStep === "zip" || workflowStep === "email" || workflowStep === "complete") && (
                  <div className="ml-11">
                    <span className="text-sm text-green-400">✓ Created: {zipFileName}</span>
                    <button
                      onClick={() => setWorkflowStep("idle")}
                      className="ml-4 text-xs text-gray-400 hover:text-white"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Send Email */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${workflowStep === "complete"
                      ? "bg-green-600"
                      : "bg-white/10"
                      }`}>
                      {workflowStep === "complete" ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-sm text-gray-400">2</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">Send Email</p>
                      <p className="text-xs text-gray-400">Email a ZIP file to recipient</p>
                    </div>
                  </div>
                </div>

                {workflowStep !== "complete" && (
                  <div className="ml-11 space-y-3 bg-black/20 p-4 rounded-lg border border-white/5">
                    {/* ZIP File Status */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 ml-1 flex items-center gap-1">
                        ZIP Archive <span className="text-red-500">*</span>
                      </label>
                      {!zipData && !uploadedZipFile ? (
                        <>
                          <input
                            type="file"
                            accept=".zip"
                            onChange={(e) => setUploadedZipFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                          />
                        </>
                      ) : (
                        <div className="p-3 rounded-lg bg-green-600/10 border border-green-500/20">
                          <p className="text-sm text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            ZIP file attached: <span className="font-mono">{uploadedZipFile?.name || zipFileName}</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-300 ml-1 flex items-center gap-1">
                        Recipient Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. finance@company.com"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        className={`w-full bg-black/20 border ${!emailRecipient ? 'border-yellow-500/30' : 'border-white/10'} rounded-lg py-2 px-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 text-sm`}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder={`Subject (optional, defaults to: ${reportName})`}
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
                    />
                    <textarea
                      placeholder="Message (optional, defaults to: Please find your expenses attached Sir)"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
                    />
                    <button
                      onClick={handleSendEmail}
                      disabled={isProcessing || !emailRecipient || (!zipData && !uploadedZipFile)}
                      className="w-full px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-all disabled:bg-gray-800 disabled:text-gray-400"
                    >
                      <Mail className="w-4 h-4" />
                      {isProcessing ? "Sending..." : "Send Email"}
                    </button>
                    {(!zipData && !uploadedZipFile) && (
                      <p className="text-[10px] text-yellow-500/70 text-center">
                        Please create or upload a ZIP file first
                      </p>
                    )}
                    {!emailRecipient && (
                      <p className="text-[10px] text-yellow-500/70 text-center">
                        Recipient email is required
                      </p>
                    )}
                  </div>
                )}

                {workflowStep === "complete" && (
                  <div className="ml-11">
                    <span className="text-sm text-green-400">✓ Email sent successfully to {emailRecipient}</span>
                    <button
                      onClick={() => {
                        setWorkflowStep("idle");
                        setEmailRecipient("rob80659@gchq.gov.uk");
                        setEmailSubject("");
                        setEmailMessage("");
                        setUploadedZipFile(null);
                      }}
                      className="ml-4 text-xs text-gray-400 hover:text-white"
                    >
                      Send Another
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Report History */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 lg:sticky lg:top-8">
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-gray-300 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Report History
                </h3>
                <button
                  onClick={() => {
                    setShowReportHistory(!showReportHistory);
                    if (!showReportHistory && reports.length === 0) {
                      loadReports();
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {showReportHistory ? 'Hide History' : 'View History'}
                </button>
              </div>

              {showReportHistory && (
                <div className="space-y-3 animate-in fade-in">
                  {/* Statistics Summary */}
                  {statistics && (
                    <div className="mb-4">
                      <ExpenseStatistics statistics={statistics} />
                    </div>
                  )}

                  {loadingReports ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No reports found. Process some receipts to create your first report!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <h4 className="font-medium text-gray-200 text-sm">{report.report_name}</h4>
                              </div>
                              <div className="mt-2 flex flex-col gap-1 text-sm text-gray-400">
                                <span>{report.expense_count} expenses</span>
                                <span className="text-green-400 font-mono">
                                  £{report.total_amount.toFixed(2)}
                                </span>
                                <span className="text-xs">
                                  {new Date(report.created_at).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => loadReportDetails(report.id)}
                                className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-all text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReport(report.id);
                                }}
                                className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 flex items-center gap-2 transition-all text-sm"
                                title="Delete report"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Detail Modal */}
        {viewingReport && selectedReport && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 border border-white/20 rounded-3xl p-8 space-y-6 animate-in slide-in-from-bottom-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">{selectedReport.report_name}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Created: {new Date(selectedReport.created_at).toLocaleString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteReport(selectedReport.id)}
                    className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 flex items-center gap-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Report
                  </button>
                  <button
                    onClick={closeReportView}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-600/20 border border-blue-500/20">
                  <p className="text-sm text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedReport.expense_count}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-600/20 border border-green-500/20">
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-green-400">£{selectedReport.total_amount.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-600/20 border border-purple-500/20">
                  <p className="text-sm text-gray-400">Report Date</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {new Date(selectedReport.report_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-300">Expense Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-white/5">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Receipt</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-mono text-gray-400 truncate max-w-[150px]" title={expense.file_name}>
                            {expense.file_name}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-400 whitespace-nowrap">{expense.date}</td>
                          <td className="px-4 py-3">{expense.description}</td>
                          <td className="px-4 py-3 text-right font-mono text-green-400 whitespace-nowrap">
                            £{expense.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
          <span>v2.0.0</span>
          <span>Powered by Gemini 2.0 Flash</span>
        </div>
      </div>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
    </main>
  );
}
