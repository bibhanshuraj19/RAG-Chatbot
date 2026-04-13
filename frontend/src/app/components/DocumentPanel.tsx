"use client";

interface DocumentItem {
  filename: string;
  page_count: number | null;
  chunk_count: number;
  size_bytes: number;
}

interface DocumentPanelProps {
  documents: DocumentItem[];
  isOpen: boolean;
  onToggle: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentPanel({
  documents,
  isOpen,
  onToggle,
}: DocumentPanelProps) {
  return (
    <>
      {/* toggle button (always visible) */}
      <button
        onClick={onToggle}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-surface-secondary border border-border
                   hover:bg-surface-hover transition-colors"
        title={isOpen ? "Hide documents" : "Show documents"}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M3 4h12M3 9h12M3 14h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* panel */}
      <div
        className={`
          h-full bg-surface-secondary border-l border-border flex flex-col
          transition-all duration-200 ease-in-out
          ${isOpen ? "w-72 opacity-100" : "w-0 opacity-0 overflow-hidden"}
        `}
      >
        <div className="p-4 border-b border-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">
            Documents
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {documents.length} file{documents.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {documents.length === 0 && (
            <div className="text-center mt-8 px-4">
              <svg
                className="mx-auto text-text-muted mb-2"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
              >
                <path
                  d="M18 4H8a2 2 0 00-2 2v20a2 2 0 002 2h16a2 2 0 002-2V12l-8-8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 4v8h8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-xs text-text-muted">
                No documents yet. Upload files to get started.
              </p>
            </div>
          )}

          {documents.map((doc, i) => (
            <div
              key={i}
              className="rounded-lg bg-surface-tertiary border border-border p-3"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">
                  {doc.filename.toLowerCase().endsWith(".pdf") ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-red-400"
                    >
                      <path
                        d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-blue-400"
                    >
                      <path
                        d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">
                    {doc.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                    <span>{formatFileSize(doc.size_bytes)}</span>
                    <span>&middot;</span>
                    <span>{doc.chunk_count} chunks</span>
                    {doc.page_count && (
                      <>
                        <span>&middot;</span>
                        <span>{doc.page_count} pg</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
