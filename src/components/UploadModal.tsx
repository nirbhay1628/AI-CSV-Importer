import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, FileSpreadsheet, Download, AlertCircle } from "lucide-react";
import { parseCSVText, formatBytes, generateSampleCSVString } from "../utils/csvParser";
import { CSVData } from "../types";

interface UploadModalProps {
  onClose: () => void;
  onFileLoaded: (data: CSVData) => void;
}

export default function UploadModal({ onClose, onFileLoaded }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [parsedData, setParsedData] = useState<CSVData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file (.csv extension).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum supported size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setError("Failed to read the file contents.");
          return;
        }

        const parsed = parseCSVText(text);
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError("The CSV file is empty or lacks valid headers.");
          return;
        }

        setSelectedFile({ name: file.name, size: file.size });
        setParsedData({
          fileName: file.name,
          fileSize: formatBytes(file.size),
          headers: parsed.headers,
          rows: parsed.rows,
        });
      } catch (err) {
        console.error("CSV parsing error:", err);
        setError("Error parsing CSV. Please check that the file is in proper format.");
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateSampleCSVString();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "GrowEasy_Sample_CRM_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmSubmit = () => {
    if (parsedData) {
      onFileLoaded(parsedData);
      onClose();
    }
  };

  return (
    <div
      id="upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="upload-modal-container"
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Import Leads via CSV</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload a CSV file to bulk import leads into your system. Column mapping will be done automatically using AI.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto py-6 space-y-5">
          {error && (
            <div
              id="upload-error-alert"
              className="flex items-start space-x-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Upload Error</p>
                <p className="text-xs mt-0.5 text-rose-700/90 dark:text-rose-400">{error}</p>
              </div>
            </div>
          )}

          {!selectedFile ? (
            /* Drag and Drop Zone */
            <div
              id="drag-and-drop-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleSelectClick}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50/20 scale-[0.99] dark:bg-emerald-950/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-950/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-400 mb-4 border border-slate-100 dark:border-slate-850">
                <Upload className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Drop your CSV file here</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">or click to browse files</p>

              <div className="mt-4 p-2 bg-slate-100/60 dark:bg-slate-950/60 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 max-w-lg">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Expected headers:</span> created_at, name, email,
                country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status,
                crm_note... Template includes default + custom fields to reduce errors.
              </div>
            </div>
          ) : (
            /* Selected File Display card */
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {parsedData?.fileSize} • {parsedData?.rows.length} rows found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedData(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mini Table Preview of Loaded File */}
              {parsedData && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Raw File Preview (First 3 rows)
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                            {parsedData.headers.slice(0, 5).map((header) => (
                              <th
                                key={header}
                                className="px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ))}
                            {parsedData.headers.length > 5 && (
                              <th className="px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                +{parsedData.headers.length - 5} more
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.rows.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100/60 dark:border-slate-800 last:border-0 text-xs">
                              {parsedData.headers.slice(0, 5).map((header) => (
                                <td
                                  key={header}
                                  className="px-3 py-2 text-slate-600 dark:text-slate-300 font-medium max-w-[150px] truncate"
                                >
                                  {row[header]}
                                </td>
                              ))}
                              {parsedData.headers.length > 5 && (
                                <td className="px-3 py-2 text-slate-400 dark:text-slate-500">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download Sample Action */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Need a starting point?</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Download our pre-structured CRM CSV template.</p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSubmit}
            disabled={!parsedData}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all ${
              parsedData
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 hover:shadow-emerald-500/20"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            Confirm & Preview
          </button>
        </div>
      </div>
    </div>
  );
}
