"use client";

import { useDismissTransition } from "@/hooks/useDismissTransition";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  submitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  submitting = false,
  error = null,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  // dismiss() plays the exit transition, THEN calls onCancel — the
  // parent's conditional render ({x && <ConfirmDialog/>}) needs no
  // changes, it just unmounts slightly later than the click.
  const { phase, dismiss } = useDismissTransition(onCancel);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        onClick={dismiss}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />
      <div
        className={`modal-panel modal-panel-${phase} relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 pb-safe`}
      >
        <h3 className=" font-bold text-base text-font-main-sub mb-2">
          {title}
        </h3>
        <p className="text-sm text-font-dim mb-4">{message}</p>

        {error && (
          <p className="text-sm text-red-500 font-medium mb-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={dismiss}
            disabled={submitting}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className={
              destructive
                ? "flex-1 rounded-xl py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                : "flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg disabled:opacity-50"
            }
          >
            {submitting ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
