import { useRef, useState, useCallback, useMemo } from "react";
import { SuperDocEditor } from "@superdoc-dev/react";
import type { SuperDocRef } from "@superdoc-dev/react";
import "@superdoc-dev/react/style.css";
import "@/assets/fonts.css";

type Mode = "choose" | "blank" | "upload";

const FONT_ITEM = "btn-fontFamily-option";

const TOOLBAR_FONTS = [
  {
    label: "Equity Text B",
    key: '"Equity Text B", Georgia, serif',
    fontWeight: 400,
    props: { style: { fontFamily: '"Equity Text B", Georgia, serif' }, "data-item": FONT_ITEM },
  },
  {
    label: "Equity Caps B",
    key: '"Equity Caps B", Georgia, serif',
    fontWeight: 400,
    props: { style: { fontFamily: '"Equity Caps B", Georgia, serif' }, "data-item": FONT_ITEM },
  },
  {
    label: "Concourse T3",
    key: '"Concourse T3", Arial, sans-serif',
    fontWeight: 400,
    props: { style: { fontFamily: '"Concourse T3", Arial, sans-serif' }, "data-item": FONT_ITEM },
  },
  {
    label: "Georgia",
    key: "Georgia, serif",
    fontWeight: 400,
    props: { style: { fontFamily: "Georgia, serif" }, "data-item": FONT_ITEM },
  },
  {
    label: "Arial",
    key: "Arial, sans-serif",
    fontWeight: 400,
    props: { style: { fontFamily: "Arial, sans-serif" }, "data-item": FONT_ITEM },
  },
  {
    label: "Times New Roman",
    key: '"Times New Roman", serif',
    fontWeight: 400,
    props: { style: { fontFamily: '"Times New Roman", serif' }, "data-item": FONT_ITEM },
  },
  {
    label: "Courier New",
    key: '"Courier New", monospace',
    fontWeight: 400,
    props: { style: { fontFamily: '"Courier New", monospace' }, "data-item": FONT_ITEM },
  },
];

const LOADING_NODE = (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#6b7280",
    }}
  >
    Loading...
  </div>
);

const renderLoading = () => LOADING_NODE;

export default function SuperDocPoc() {
  const [mode, setMode] = useState<Mode>("choose");
  const [file, setFile] = useState<File | null>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const ref = useRef<SuperDocRef>(null);
  const user = useMemo(() => ({ name: "Tester", email: "test@example.com" }), []);
  const modules = useMemo(() => ({ toolbar: { fonts: TOOLBAR_FONTS } }), []);

  const setStatus = useCallback((text: string) => {
    if (statusRef.current) statusRef.current.textContent = text;
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] ?? null;
      if (selected) {
        setFile(selected);
        setMode("upload");
        setStatus(`Loading: ${selected.name}`);
      }
    },
    [setStatus],
  );

  const handleExport = useCallback(() => {
    const instance = ref.current?.getInstance();
    if (!instance) return;
    instance.export({ triggerDownload: true });
  }, []);

  const handleReset = useCallback(() => {
    setMode("choose");
    setFile(null);
    setStatus("");
  }, [setStatus]);

  const fileRef = useRef<File | null>(null);
  fileRef.current = file;

  const onReadyBlank = useCallback(() => setStatus("New blank document — ready"), [setStatus]);
  const onReadyUpload = useCallback(() => setStatus(`Loaded: ${fileRef.current?.name ?? "file"}`), [setStatus]);
  const onContentError = useCallback((e: any) => setStatus(`Error: ${e?.detail ?? "unknown"}`), [setStatus]);
  const onException = useCallback((e: any) => setStatus(`Exception: ${e?.detail ?? "unknown"}`), [setStatus]);

  const editorActive = mode === "blank" || mode === "upload";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Toolbar */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#f9fafb",
          flexShrink: 0,
        }}
      >
        <strong>SuperDoc PoC</strong>

        {editorActive ? (
          <>
            <button
              onClick={handleReset}
              style={{
                padding: "6px 16px",
                background: "#e5e7eb",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              &larr; Back
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: "6px 16px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Export DOCX
            </button>
            <span ref={statusRef} style={{ color: "#6b7280", fontSize: 14 }} />
          </>
        ) : (
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            Choose how to start
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {mode === "choose" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 24,
            }}
          >
            <button
              onClick={() => {
                setMode("blank");
                setStatus("New blank document");
              }}
              style={{
                padding: "24px 32px",
                fontSize: 16,
                background: "#fff",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              New blank document
            </button>
            <label
              style={{
                padding: "24px 32px",
                fontSize: 16,
                background: "#fff",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Upload .docx
              <input
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          </div>
        )}

        {mode === "blank" && (
          <SuperDocEditor
            ref={ref}
            documentMode="editing"
            role="editor"
            user={user}
            modules={modules}
            onReady={onReadyBlank}
            onContentError={onContentError}
            onException={onException}
            renderLoading={renderLoading}
            style={{ height: "100%" }}
          />
        )}

        {mode === "upload" && file && (
          <SuperDocEditor
            ref={ref}
            document={file}
            documentMode="editing"
            role="editor"
            user={user}
            modules={modules}
            onReady={onReadyUpload}
            onContentError={onContentError}
            onException={onException}
            renderLoading={renderLoading}
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
