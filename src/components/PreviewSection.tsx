import { CSVData } from "../types";
import { ArrowLeft, Play, Database, FileSpreadsheet } from "lucide-react";

interface PreviewSectionProps {
  csvData: CSVData;
  onBack: () => void;
  onConfirm: () => void;
}

export default function PreviewSection({ csvData, onBack, onConfirm }: PreviewSectionProps) {
  return (
    <div id="preview-section-container" className="space-y-6 animate-fade-in">
      {/* Header card info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Step 2: CSV Data Preview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              File: <span className="font-semibold text-slate-700 dark:text-slate-300">{csvData.fileName}</span> ({csvData.fileSize}) •{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{csvData.rows.length}</span> rows detected.
            </p>
          </div>
        </div>
      </div>

      {/* Main Beautiful Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table metadata statistics line */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            RAW ROW DATA PREVIEW (NO AI RUN YET)
          </span>
          <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
            {csvData.headers.length} COLUMNS
          </span>
        </div>

        {/* Scrollable table window */}
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xs">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center w-16">
                  #
                </th>
                {csvData.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/30 text-xs transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-center font-mono select-none bg-slate-50/20 dark:bg-slate-950/20">
                    {rowIdx + 1}
                  </td>
                  {csvData.headers.map((header) => {
                    const value = row[header];
                    return (
                      <td key={header} className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium max-w-[250px] truncate">
                        {value === "" ? (
                          <span className="text-slate-300 dark:text-slate-600 italic font-normal">empty</span>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Floating instruction notice */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <p>
            Review the columns above to ensure alignment. Once satisfied, click the{" "}
            <span className="font-bold text-emerald-500 dark:text-emerald-400">"Confirm & Start AI Mapping"</span> button below to trigger the Batch AI Syncer.
          </p>
        </div>
      </div>

      {/* Actions container below the data */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Different File</span>
        </button>
        <button
          onClick={onConfirm}
          className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Confirm & Start AI Mapping</span>
        </button>
      </div>
    </div>
  );
}
