import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Upload,
  Sun,
  Moon
} from "lucide-react";
import UploadModal from "./components/UploadModal";
import PreviewSection from "./components/PreviewSection";
import BatchProgress from "./components/BatchProgress";
import LeadTable from "./components/LeadTable";
import { CSVData, ImportBatch, ExtractedResult } from "./types";

export default function App() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvData, setCsvData] = useState<CSVData | null>(null);

  // Dark mode state with persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") !== "light"; // Default to dark for premium SaaS feel
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Workflow steps for our Lead Importer: "upload" | "preview" | "processing" | "results"
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "results">("upload");

  // Batching & Results State
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [extractedResults, setExtractedResults] = useState<ExtractedResult[]>([]);

  // Triggered when a CSV file is parsed & selected in the modal
  const handleFileLoaded = (data: CSVData) => {
    setCsvData(data);
    setStep("preview");
  };

  // Triggered when the user confirms the CSV import preview
  const handleConfirmImport = () => {
    if (!csvData) return;

    // Split rows into batches of size 12 to reduce individual request token-generation latency
    const chunkSize = 12;
    const tempBatches: ImportBatch[] = [];
    for (let i = 0; i < csvData.rows.length; i += chunkSize) {
      tempBatches.push({
        id: tempBatches.length,
        rows: csvData.rows.slice(i, i + chunkSize),
        status: "pending",
      });
    }

    setBatches(tempBatches);
    setExtractedResults([]);
    setStep("processing");

    // Start running all batches immediately with a controlled local queue
    runAllBatches(tempBatches);
  };

  // Run all batches concurrently (limit: 3) using a safe worker model that is immune to state race conditions
  const runAllBatches = async (initialBatches: ImportBatch[]) => {
    const queue = [...initialBatches];
    const maxConcurrency = 3;

    const runWorker = async () => {
      while (queue.length > 0) {
        const batch = queue.shift();
        if (!batch) break;

        // Set status to processing in state
        setBatches((prev) =>
          prev.map((b) => (b.id === batch.id ? { ...b, status: "processing", error: undefined } : b))
        );

        try {
          const response = await fetch("/api/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: batch.rows }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server returned status code ${response.status}`);
          }

          const data = await response.json();
          if (!data.results || !Array.isArray(data.results)) {
            throw new Error("Invalid response format received from server.");
          }

          setBatches((prev) =>
            prev.map((b) => (b.id === batch.id ? { ...b, status: "success", results: data.results } : b))
          );
        } catch (error: any) {
          console.error(`Error in batch #${batch.id + 1}:`, error);
          setBatches((prev) =>
            prev.map((b) =>
              b.id === batch.id
                ? { ...b, status: "failed", error: error.message || "Network transfer failure" }
                : b
            )
          );
        }
      }
    };

    const workers = [];
    const poolSize = Math.min(maxConcurrency, queue.length);
    for (let i = 0; i < poolSize; i++) {
      workers.push(runWorker());
    }

    await Promise.all(workers);
  };

  // Handle manually retrying a failed batch
  const handleRetryBatch = async (batchId: number) => {
    const targetBatch = batches.find((b) => b.id === batchId);
    if (!targetBatch) return;

    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: "processing", error: undefined } : b))
    );

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: targetBatch.rows }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status code ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format received from server.");
      }

      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, status: "success", results: data.results } : b))
      );
    } catch (error: any) {
      console.error(`Error in retrying batch #${batchId + 1}:`, error);
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? { ...b, status: "failed", error: error.message || "Network transfer failure" }
            : b
        )
      );
    }
  };

  // Compile final results when batches finish processing
  useEffect(() => {
    if (step !== "processing" || batches.length === 0) return;

    const allDone = batches.every((b) => b.status === "success" || b.status === "failed");
    const hasFailed = batches.some((b) => b.status === "failed");

    if (allDone && !hasFailed && extractedResults.length === 0) {
      const allResults: ExtractedResult[] = [];
      batches.forEach((b) => {
        if (b.results) {
          allResults.push(...b.results);
        }
      });
      setExtractedResults(allResults);
    }
  }, [batches, step, extractedResults]);

  // Move from Progress log view to final Results page
  const handleViewResults = () => {
    const allResults: ExtractedResult[] = [];
    batches.forEach((b) => {
      if (b.results) {
        allResults.push(...b.results);
      }
    });
    setExtractedResults(allResults);
    setStep("results");
  };

  const handleReset = () => {
    setCsvData(null);
    setBatches([]);
    setExtractedResults([]);
    setStep("upload");
  };

  return (
    <div
      id="full-app-container"
      className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200 selection:bg-emerald-500 selection:text-white flex flex-col justify-between"
    >


      {/* Brand Header/Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#030712]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 select-none cursor-pointer" onClick={handleReset}>
          {/* Replica Logo: Green speech Bubble + Growth Up-Arrow */}
          <div className="p-2 bg-emerald-500 rounded-xl text-white font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.003 21c-1.895 0-3.72-.5-5.322-1.455L2 21l1.485-4.524C2.5 14.85 2 13.02 2 11.118 2 5.53 6.483 1 12.003 1c5.52 0 10.003 4.53 10.003 10.018C22.006 16.607 17.522 21 12.003 21zm-3.322-4.22c1.474.877 3.03 1.34 4.8 1.34 4.316 0 7.828-3.535 7.828-7.876C21.309 5.903 17.8 2.37 13.481 2.37c-4.318 0-7.828 3.533-7.828 7.874 0 1.933.513 3.42 1.393 4.896L6.2 17.8l3.481-.92zM15 13.2l-3-3m0 0l-1.5 1.5m1.5-1.5V16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center">
            <span className="text-slate-900 dark:text-white font-black text-xl tracking-tight">Grow</span>
            <span className="text-emerald-500 font-black text-xl tracking-tight">Easy</span>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-md ml-1.5 uppercase tracking-wide">
              .ai
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3.5">


          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-bold text-rose-500 hover:text-white border border-rose-500/20 hover:bg-rose-500 rounded-xl transition-all cursor-pointer"
            >
              Reset Importer
            </button>
          )}

          {/* Theme Toggler */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
            aria-label="Toggle Theme"
            id="dark-mode-toggle"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 py-10 px-6 max-w-7xl w-full mx-auto flex flex-col justify-center">
        <div className="w-full max-w-5xl mx-auto space-y-8 flex flex-col justify-center">
          
          {/* Wizard step indicator bar */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] md:text-xs font-bold select-none border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
            <div className={`flex flex-col items-center space-y-1.5 transition-all ${step === "upload" ? "text-emerald-500 scale-102 font-black" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${step === "upload" ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>1</span>
              <span>Upload CSV File</span>
            </div>
            <div className={`flex flex-col items-center space-y-1.5 transition-all ${step === "preview" ? "text-emerald-500 scale-102 font-black" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${step === "preview" ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>2</span>
              <span>CSV Data Preview</span>
            </div>
            <div className={`flex flex-col items-center space-y-1.5 transition-all ${step === "processing" ? "text-emerald-500 scale-102 font-black" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${step === "processing" ? "bg-emerald-500 text-white animate-pulse" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>3</span>
              <span>AI Column Mapping</span>
            </div>
            <div className={`flex flex-col items-center space-y-1.5 transition-all ${step === "results" ? "text-emerald-500 scale-102 font-black" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${step === "results" ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>4</span>
              <span>CRM Output Results</span>
            </div>
          </div>

          {/* Core Step Router Box */}
          <div className="flex-1 flex flex-col justify-center min-h-[450px]">
            {step === "upload" && (
              <div className="flex-1 flex flex-col justify-center items-center py-10 text-center space-y-8 animate-fade-in">
                {/* Visual Header */}
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 dark:text-emerald-400 rounded-full border border-emerald-500/20 max-w-max mx-auto shadow-md">
                    <FileSpreadsheet className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    AI-Powered CSV CRM Importer
                  </h2>
                  <p className="text-xs md:text-sm text-slate-550 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
                    Instantly map raw spreadsheets with arbitrary column headers (e.g. <span className="font-mono text-emerald-500">"Firm Name"</span>, <span className="font-mono text-emerald-500">"Customer Number"</span>, <span className="font-mono text-emerald-500">"Remarks"</span>) directly to standard CRM field layouts using AI.
                  </p>
                </div>

                {/* Launch CSV Importer button placed exactly in the middle as requested */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow-xl hover:shadow-emerald-500/20 scale-100 hover:scale-[1.02] transition-all flex items-center space-x-3 cursor-pointer glow-green-sm"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Launch CSV Importer Tool</span>
                  </button>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Supports files up to 5MB with automatic data validation
                  </p>
                </div>

                {/* Mapped standard fields display */}
                <div className="pt-6 max-w-3xl w-full">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                    Automatic Extraction Engine Schema (15 CRM Fields Mapped)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-left">
                    {[
                      "created_at",
                      "name",
                      "email",
                      "country_code",
                      "mobile",
                      "company",
                      "city",
                      "state",
                      "country",
                      "lead_owner",
                      "crm_status",
                      "crm_note",
                      "data_source",
                      "possession_time",
                      "description"
                    ].map((field) => (
                      <div
                        key={field}
                        className="p-2.5 bg-white dark:bg-[#080d1a] border border-slate-200/50 dark:border-slate-800/80 rounded-xl text-[11px] font-semibold text-slate-750 dark:text-slate-350 flex items-center space-x-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate">{field}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === "preview" && csvData && (
              <PreviewSection
                csvData={csvData}
                onBack={handleReset}
                onConfirm={handleConfirmImport}
              />
            )}

            {step === "processing" && (
              <BatchProgress
                batches={batches}
                onRetryBatch={handleRetryBatch}
                onViewResults={handleViewResults}
              />
            )}

            {step === "results" && (
              <LeadTable results={extractedResults} onReset={handleReset} />
            )}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-900 py-6 text-center text-[11px] text-slate-400 dark:text-slate-505 bg-white dark:bg-[#01050e] flex items-center justify-center px-6">
        <div className="flex items-center space-x-1.5 font-semibold">
          <span>© 2026 GrowEasy.ai. All rights reserved.</span>
        </div>
      </footer>

      {/* CSV File Upload Modal Overlay popup */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onFileLoaded={handleFileLoaded}
        />
      )}
    </div>
  );
}
