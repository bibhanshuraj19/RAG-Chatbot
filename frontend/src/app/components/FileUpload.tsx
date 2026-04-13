"use client";

import { useState, useRef, useCallback } from "react";

interface FileUploadProps {
  sessionId: string | null;
  onUploadComplete: () => void;
}

export default function FileUpload({
  sessionId,
  onUploadComplete,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!sessionId) {
        setStatus("Start a chat session first");
        return;
      }

      setUploading(true);
      setStatus(null);

      const fileArray = Array.from(files);
      let successCount = 0;

      for (const file of fileArray) {
        try {
          const formData = new FormData();
          formData.append("session_id", sessionId);
          formData.append("file", file);

          const res = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Upload failed");
          }

          successCount++;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Upload failed";
          setStatus(`Failed to upload ${file.name}: ${message}`);
        }
      }

      if (successCount > 0) {
        setStatus(
          `Uploaded ${successCount} file${successCount > 1 ? "s" : ""} successfully`
        );
        onUploadComplete();
      }

      setUploading(false);
      setTimeout(() => setStatus(null), 4000);
    },
    [sessionId, onUploadComplete]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload]
  );

  return (
    <div className="p-3 border-b border-border">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative rounded-lg border-2 border-dashed p-4 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-accent-primary bg-accent-primary/10"
              : "border-border hover:border-border-hover hover:bg-surface-hover"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />

        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Processing...</span>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto mb-1.5 text-text-muted"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 16V8m0 0l-3 3m3-3l3 3M6.5 19A4.5 4.5 0 014 10.05 7 7 0 0117.5 8.5a5.5 5.5 0 012 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-xs text-text-secondary">
              Drop files here or <span className="text-accent-primary">browse</span>
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              PDF, TXT, MD &mdash; up to 50MB each
            </p>
          </>
        )}
      </div>

      {status && (
        <p
          className={`text-xs mt-2 text-center ${
            status.includes("Failed") ? "text-red-400" : "text-green-400"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}
