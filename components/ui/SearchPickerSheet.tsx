"use client";

import { useEffect, useState } from "react";
import { useDismissTransition } from "@/hooks/useDismissTransition";

interface SearchPickerSheetProps<T> {
  title: string;
  placeholder: string;
  items: T[];
  loading: boolean;
  error?: string | null;
  getKey: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  onQueryChange: (query: string) => void;
  onSelect: (item: T) => void;
  onClose: () => void;
  emptyLabel?: string;
  // Set true when the list doesn't need typing to show results (e.g.
  // a short static list like Brands) — search input still renders for
  // filtering, but items show immediately rather than waiting on a query.
  showAllByDefault?: boolean;
}

export function SearchPickerSheet<T>({
  title,
  placeholder,
  items,
  loading,
  error,
  getKey,
  renderItem,
  onQueryChange,
  onSelect,
  onClose,
  emptyLabel = "No results found.",
  showAllByDefault = false,
}: SearchPickerSheetProps<T>) {
  const { phase, dismiss } = useDismissTransition(onClose);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onQueryChange(query), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const showEmpty =
    !loading &&
    !error &&
    items.length === 0 &&
    (query.trim() || showAllByDefault);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        onClick={dismiss}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />
      <div
        className={`modal-panel modal-panel-${phase} relative mt-auto bg-white rounded-t-2xl w-full flex flex-col`}
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <h2 className=" font-bold text-base text-font-main-sub">{title}</h2>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="text-gray-400 hover:text-font-main-sub"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-brand-yellow"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-6">
          {loading && (
            <p className="text-sm text-font-dim text-center py-6">
              Searching...
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500 text-center py-6">{error}</p>
          )}
          {showEmpty && (
            <p className="text-sm text-font-dim text-center py-6">
              {emptyLabel}
            </p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {items.map((item) => (
                <button
                  key={getKey(item)}
                  onClick={() => onSelect(item)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                >
                  {renderItem(item)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
