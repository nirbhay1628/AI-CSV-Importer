import { ImportBatch } from "../types";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

interface BatchProgressProps {
  batches: ImportBatch[];
  onRetryBatch: (batchId: number) => void;
  onViewResults: () => void;
}

export default function BatchProgress({ batches, onRetryBatch, onViewResults }: BatchProgressProps) {
  const totalBatches = batches.length;
  const processedBatches = batches.filter((b) => b.status === "success" || b.status === "failed").length;
  const successfulBatches = batches.filter((b) => b.status === "success").length;
  const failedBatches = batches.filter((b) => b.status === "failed").length;

  // Calculate row counts
  let totalRows = 0;
  let processedRows = 0;
  let importedRows = 0;
  let skippedRows = 0;

  batches.forEach((b) => {
    totalRows += b.rows.length;
    if (b.status === "success" && b.results) {
      processedRows += b.rows.length;
      b.results.forEach((r) => {
        if (r.status === "imported") {
          importedRows++;
        } else {
          skippedRows++;
        }
      });
    } else if (b.status === "failed") {
      processedRows += b.rows.length;
    }
  });

  const percentage = totalBatches > 0 ? Math.round((processedBatches / totalBatches) * 100) : 0;
  const isCompleted = processedBatches === totalBatches;

  return (
    <div id="batch-progress-wrapper" className="space-y-6 animate-fade-in">
      {/* Real-time Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress percent card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overall Progress</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{percentage}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {processedBatches} of {totalBatches} batches processed
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full border-4 ${isCompleted ? "border-emerald-500" : "border-slate-100 dark:border-slate-850 border-t-emerald-500 animate-spin"} flex items-center justify-center`}>
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse shrink-0" />
            )}
          </div>
        </div>

        {/* Total records parsed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Records</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalRows}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Found in uploaded CSV file</p>
        </div>

        {/* Successfully Mapped */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider font-extrabold">AI Extracted Leads</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{importedRows}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Successfully mapped & formatted</p>
        </div>

        {/* Skipped */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">Skipped Leads</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{skippedRows}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rows missing key contact info</p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {!isCompleted && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {isCompleted ? "AI Processing Completed" : "AI Mapping in Progress..."}
            </span>
          </div>
          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
            {processedBatches} / {totalBatches} Batches
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-950 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out glow-green-sm"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {isCompleted && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={onViewResults}
              className="px-6 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer glow-green-sm"
            >
              Go to Extracted CRM Results
            </button>
          </div>
        )}
      </div>

      {/* Individual Batch Grid Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
          Detailed Batch Processing Log
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch) => {
            const batchSuccessCount = batch.results?.filter((r) => r.status === "imported").length || 0;
            const batchSkipCount = batch.results?.filter((r) => r.status === "skipped").length || 0;

            return (
              <div
                key={batch.id}
                className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all ${
                  batch.status === "processing"
                    ? "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-400/10 bg-emerald-50/5 dark:bg-emerald-950/10"
                    : batch.status === "success"
                    ? "border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/5 dark:bg-emerald-950/10"
                    : batch.status === "failed"
                    ? "border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/20"
                    : "border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    {batch.status === "pending" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
                    )}
                    {batch.status === "processing" && (
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                    )}
                    {batch.status === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    {batch.status === "failed" && (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Batch #{batch.id + 1}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {batch.rows.length} rows inside this batch
                      </p>
                    </div>
                  </div>

                  {batch.status === "success" && (
                    <div className="text-right">
                      <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                        {batchSuccessCount} Mapped
                      </span>
                      {batchSkipCount > 0 && (
                        <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md ml-1.5">
                          {batchSkipCount} Skipped
                        </span>
                      )}
                    </div>
                  )}

                  {batch.status === "failed" && (
                    <button
                      onClick={() => onRetryBatch(batch.id)}
                      className="px-2 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 shrink-0" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>

                {batch.status === "failed" && batch.error && (
                  <div className="mt-2 text-[10px] text-rose-700 dark:text-rose-300 font-medium bg-rose-50 dark:bg-rose-950/30 border border-rose-100/50 dark:border-rose-900/40 p-2 rounded-lg">
                    {batch.error}
                  </div>
                )}

                {batch.status === "processing" && (
                  <p className="mt-2 text-[10px] text-emerald-500 dark:text-emerald-400 font-medium italic animate-pulse">
                    AI is reading & mapping columns...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
