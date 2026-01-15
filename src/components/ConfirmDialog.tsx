import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "warning"
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colorClasses = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    info: "bg-blue-600 hover:bg-blue-700"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${type === "danger" ? "bg-red-600/20" : type === "warning" ? "bg-yellow-600/20" : "bg-blue-600/20"}`}>
            <AlertTriangle className={`${type === "danger" ? "text-red-400" : type === "warning" ? "text-yellow-400" : "text-blue-400"}`} size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 whitespace-pre-line">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white font-medium ${colorClasses[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
