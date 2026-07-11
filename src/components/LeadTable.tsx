import { useState } from "react";
import { ExtractedResult, CRMRecord } from "../types";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Eye,
  X,
  Building,
  Mail,
  Phone,
  Calendar,
  User,
  MapPin,
  Tag,
  Clock,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";

interface LeadTableProps {
  results: ExtractedResult[];
  onReset: () => void;
}

export default function LeadTable({ results, onReset }: LeadTableProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">("imported");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<{ result: ExtractedResult; index: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const importedList = results.filter((r) => r.status === "imported");
  const skippedList = results.filter((r) => r.status === "skipped");

  const totalImported = importedList.length;
  const totalSkipped = skippedList.length;

  // Filter imported leads based on search and status
  const filteredImported = importedList.filter((r) => {
    const data = r.data || {};
    const matchesSearch =
      (data.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (data.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (data.mobile_without_country_code || "").includes(searchTerm) ||
      (data.company || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || data.crm_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter skipped leads based on search
  const filteredSkipped = skippedList.filter((r) => {
    const rowStr = JSON.stringify(r.originalRow).toLowerCase();
    const reasonStr = (r.skipReason || "").toLowerCase();
    return rowStr.includes(searchTerm.toLowerCase()) || reasonStr.includes(searchTerm.toLowerCase());
  });

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "GOOD_LEAD_FOLLOW_UP":
        return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40 text-xs font-bold px-2.5 py-1 rounded-full border";
      case "SALE_DONE":
        return "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40 text-xs font-bold px-2.5 py-1 rounded-full border";
      case "BAD_LEAD":
        return "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40 text-xs font-bold px-2.5 py-1 rounded-full border";
      case "DID_NOT_CONNECT":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40 text-xs font-bold px-2.5 py-1 rounded-full border";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "GOOD_LEAD_FOLLOW_UP":
        return "Good Lead";
      case "SALE_DONE":
        return "Sale Done";
      case "BAD_LEAD":
        return "Bad Lead";
      case "DID_NOT_CONNECT":
        return "Did Not Connect";
      default:
        return "Not Dialed";
    }
  };

  return (
    <div id="lead-table-section" className="space-y-6 animate-fade-in">
      {/* Import Statistics Summary row exactly as requested */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">Successfully Imported</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalImported}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Leads ready in CRM</p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/40 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">Skipped Records</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalSkipped}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Lacked emails/mobiles</p>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-150 dark:border-slate-700 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">Total Rows Processed</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{results.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Aggregate row count</p>
            </div>
          </div>
        </div>

        {/* Action banner placed directly below the metrics */}
        <div className="bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500 text-white rounded-lg hidden sm:block shrink-0">
              <Sparkles className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-400 uppercase tracking-wider">Upload and Sync Completed Successfully</h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300 mt-1">Want to parse another raw CSV file with our AI engine?</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="sm:w-auto px-6 py-2.5 text-center text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Import Another CSV
          </button>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Header Tab Toggles */}
        <div className="px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-3">
          {/* Tabs */}
          <div className="flex space-x-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl max-w-max self-start">
            <button
              onClick={() => {
                setActiveTab("imported");
                setSearchTerm("");
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "imported"
                  ? "bg-white dark:bg-slate-900 text-emerald-500 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Successfully Imported ({totalImported})
            </button>
            <button
              onClick={() => {
                setActiveTab("skipped");
                setSearchTerm("");
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "skipped"
                  ? "bg-white dark:bg-slate-900 text-emerald-500 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Skipped Records ({totalSkipped})
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === "imported" && (
              <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">All Statuses</option>
                  <option value="GOOD_LEAD_FOLLOW_UP" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Good Lead</option>
                  <option value="SALE_DONE" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Sale Done</option>
                  <option value="DID_NOT_CONNECT" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Did Not Connect</option>
                  <option value="BAD_LEAD" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Bad Lead</option>
                </select>
              </div>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === "imported" ? "Search leads, emails, companies..." : "Search skipped raw text..."
                }
                className="pl-9 pr-4 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-300 dark:focus:border-emerald-500 w-full sm:w-60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Table Body Content */}
        {activeTab === "imported" ? (
          /* TABLE 1: IMPORTED LEADS */
          <div className="overflow-x-auto">
            {filteredImported.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-505">No leads matched your search query.</p>
                <p className="text-xs text-slate-400 dark:text-slate-505">Try adjusting your filters or keyword query.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3">LEAD NAME</th>
                    <th className="px-5 py-3">EMAIL</th>
                    <th className="px-5 py-3">CONTACT</th>
                    <th className="px-5 py-3">DATE CREATED</th>
                    <th className="px-5 py-3">COMPANY</th>
                    <th className="px-5 py-3">STATUS</th>
                    <th className="px-5 py-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredImported.map((item, idx) => {
                    const data = item.data || {};
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 font-medium text-slate-600 dark:text-slate-300">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{data.name || "Unnamed Lead"}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                            Source: <span className="font-semibold text-emerald-500">{data.data_source || "Confidential"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 select-all">
                          {data.email ? (
                            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              <span>{data.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 italic font-normal">none</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 select-all">
                          {data.mobile_without_country_code ? (
                            <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 font-mono">
                              <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{data.country_code}</span>
                              <span>{data.mobile_without_country_code}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 italic font-normal">none</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                          {data.created_at || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          {data.company ? (
                            <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                              <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{data.company}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-normal italic">none</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={getStatusBadgeClass(data.crm_status)}>
                            {getStatusLabel(data.crm_status)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedLead({ result: item, index: idx })}
                            className="px-3 py-1.5 text-[11px] font-bold text-emerald-500 hover:text-white border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-500 hover:border-emerald-500 rounded-lg flex items-center space-x-1.5 transition-all mx-auto shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>More &gt;</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* TABLE 2: SKIPPED RECORDS */
          <div className="overflow-x-auto">
            {filteredSkipped.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No skipped records matched your query.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Everything processed is clean!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3 w-20 text-center">ROW</th>
                    <th className="px-5 py-3">SKIP REASON</th>
                    <th className="px-5 py-3">RAW CSV DATA CONTEXT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredSkipped.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="px-5 py-4 text-center font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-50/20 dark:bg-slate-950/20 select-none">
                        #{idx + 1}
                      </td>
                      <td className="px-5 py-4 font-bold text-amber-600 dark:text-amber-400">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{item.skipReason || "Incomplete CRM fields"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="bg-slate-950/5 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-mono text-[10px] p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 max-w-xl whitespace-pre-wrap overflow-x-auto animate-fade-in">
                          {JSON.stringify(item.originalRow, null, 2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / MODAL: Shows all 15 CRM Fields mapped in full detail */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 border border-transparent dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lead CRM Profile</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Full list of 15 extracted CRM fields mapped by AI.
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Field Grid */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1.5 scrollbar-thin">
              {/* Top Banner Profile card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-lg flex items-center justify-center border border-emerald-400">
                  {selectedLead.result.data?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {selectedLead.result.data?.name || "Unnamed Lead"}
                  </h4>
                  <p className="text-xs text-slate-505 dark:text-slate-400 mt-0.5 font-medium">
                    {selectedLead.result.data?.company || "Independent Trader"}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={getStatusBadgeClass(selectedLead.result.data?.crm_status)}>
                    {getStatusLabel(selectedLead.result.data?.crm_status)}
                  </span>
                </div>
              </div>

              {/* CRM 15-Fields Details */}
              <div className="space-y-2.5">
                {[
                  { field: "created_at", label: "created_at (Lead Creation Date)", val: selectedLead.result.data?.created_at, icon: Calendar },
                  { field: "name", label: "name (Lead Name)", val: selectedLead.result.data?.name, icon: User },
                  { field: "email", label: "email (Primary Email)", val: selectedLead.result.data?.email, icon: Mail },
                  { field: "country_code", label: "country_code (Country Code)", val: selectedLead.result.data?.country_code, icon: MapPin },
                  { field: "mobile_without_country_code", label: "mobile_without_country_code (Mobile)", val: selectedLead.result.data?.mobile_without_country_code, icon: Phone },
                  { field: "company", label: "company (Company Name)", val: selectedLead.result.data?.company, icon: Building },
                  { field: "city", label: "city (City)", val: selectedLead.result.data?.city, icon: MapPin },
                  { field: "state", label: "state (State)", val: selectedLead.result.data?.state, icon: MapPin },
                  { field: "country", label: "country (Country)", val: selectedLead.result.data?.country, icon: MapPin },
                  { field: "lead_owner", label: "lead_owner (Lead Owner)", val: selectedLead.result.data?.lead_owner, icon: User },
                  { field: "crm_status", label: "crm_status (Lead Status)", val: selectedLead.result.data?.crm_status, icon: Tag },
                  { field: "data_source", label: "data_source (Source)", val: selectedLead.result.data?.data_source, icon: Tag },
                  { field: "possession_time", label: "possession_time (Possession Time)", val: selectedLead.result.data?.possession_time, icon: Clock },
                  { field: "crm_note", label: "crm_note (Notes/Remarks)", val: selectedLead.result.data?.crm_note, icon: FileSpreadsheet, fullWidth: true },
                  { field: "description", label: "description (Additional Description)", val: selectedLead.result.data?.description, icon: FileSpreadsheet, fullWidth: true },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.field}
                      className={`p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start space-x-3 transition-colors hover:bg-slate-50/20 dark:hover:bg-slate-950/20 ${
                        item.fullWidth ? "col-span-2" : ""
                      }`}
                    >
                      <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg text-slate-400 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold mt-1 break-words leading-relaxed select-all">
                          {item.val || <span className="text-slate-300 dark:text-slate-600 italic font-normal">none</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Raw CSV row reference */}
              <div className="pt-2">
                <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Original Raw CSV Row Reference</h5>
                <div className="bg-slate-950/5 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 p-3 rounded-xl font-mono text-[9px] text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto">
                  {JSON.stringify(selectedLead.result.originalRow, null, 2)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-5 py-2.5 bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
