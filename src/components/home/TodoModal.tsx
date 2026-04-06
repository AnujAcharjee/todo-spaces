"use client";

import { useEffect } from "react";

interface TodoModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  submitLabel: string;
  children: React.ReactNode;
}

export function TodoModal({
  title,
  onClose,
  onSubmit,
  loading,
  submitLabel,
  children,
}: TodoModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop — very light so bg image stays visible */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/20
        bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/30
        animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
          {children}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white
                bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg
                transition-all duration-150 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white
                bg-white/20 hover:bg-white/30 border border-white/25 rounded-lg
                transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
