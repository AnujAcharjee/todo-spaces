"use client";

import { useEffect, type FormEventHandler, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  submitLabel: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}

export function Modal({
  open,
  title,
  description,
  submitLabel,
  loading = false,
  onClose,
  onSubmit,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-slate-950/18 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-slate-950/18 backdrop-blur-lg">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? (
              <p className="text-sm text-white/55">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5 p-5">
          {children}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border border-white/20 bg-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
