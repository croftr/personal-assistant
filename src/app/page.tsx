"use client";

import { useState } from "react";
import { Loader2, FolderOpen, Play, FileText, CheckCircle2, AlertCircle, Search, Save } from "lucide-react";

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

type ExpenseRow = {
  fileName: string;
  description: string;
  date: string;
  amount: number;
};

export default function Home() {
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

  // Derived Mode
  const isPickerMode = directoryHandle !== null;

  // --- Helpers ---
  const parseCsvToRows = (csvContent: string) => {
    const rows: ExpenseRow[] = [];
    const lines = csvContent.split("\n");
    let currentTotal = 0;

    lines.forEach((line) => {
      const match = line.match(/"(.*?)","(.*?)","(.*?)",([0-9.]+)/);
      if (match) {
        const amount = parseFloat(match[4]);
        rows.push({
          fileName: match[1],
          description: match[2],
          date: match[3],
          amount: amount
        });
        currentTotal += amount;
      }
    });

    setCsvData(rows);
    setTotalAmount(currentTotal);
  };

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

    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
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
      // STEP 1: PRE-AUTHORIZE WRITE (Must be done immediately during user click)
      // -------------------------------------------------------------------------
      if (isPickerMode && directoryHandle) {
        try {
          const today = new Date().toISOString().split("T")[0];
          const fileName = `expenses_${today}.csv`;
          const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
          // This triggers the browser permission prompt if needed. 
          // Must happen before the async fetch awaits.
          writable = await fileHandle.createWritable();
        } catch (err: any) {
          // If they deny permission or it fails, stop here.
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
          body: JSON.stringify({ path: folderPath, action: "process" }),
        });

        if (!response.ok) throw new Error((await response.json()).error);
        const data = await response.json();
        csvContent = data.csvContent;
      }

      // -------------------------------------------------------------------------
      // STEP 3: WRITE TO DISK (Using the pre-opened stream)
      // -------------------------------------------------------------------------
      if (writable) {
        setMessage("Saving report...");
        await writable.write(csvContent);
        await writable.close();
        writable = null; // Mark closed
      }

      parseCsvToRows(csvContent);
      setStatus("success");
      setMessage("Success! Report saved to folder.");

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Failed to process.");

      // Cleanup if open
      if (writable) {
        try { await writable.close(); } catch (e) { }
      }

    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center p-8 text-white">
      <div className="max-w-4xl w-full glass rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Rob's Personal Assistant
          </h1>
          <p className="text-gray-400">Expense Processor (GBP)</p>
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

        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
          <span>v1.6.0</span>
          <span>Powered by Gemini 2.0 Flash</span>
        </div>
      </div>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
    </main>
  );
}
