import { useState } from "react";
import {
  LayoutDashboard,
  Target,
  ListTodo,
  MessageSquare,
  Users,
  FileSpreadsheet,
  BarChart,
  MessageCircle,
  PhoneCall,
  Settings2,
  Code,
  Building,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { category: "MAIN", items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "generate", label: "Generate Leads", icon: Target },
      { id: "manage", label: "Manage Leads", icon: ListTodo },
      { id: "engage", label: "Engage Leads", icon: MessageSquare },
    ]},
    { category: "CONTROL CENTER", items: [
      { id: "team", label: "Team Members", icon: Users },
      { id: "leads_sources", label: "Lead Sources", icon: FileSpreadsheet },
      { id: "ads", label: "Ad Accounts", icon: BarChart },
      { id: "whatsapp", label: "WhatsApp Account", icon: MessageCircle },
      { id: "tele_calling", label: "Tele Calling", icon: PhoneCall },
      { id: "crm_fields", label: "CRM Fields", icon: Settings2 },
      { id: "api_center", label: "API Center", icon: Code },
    ]}
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        id="sidebar-toggle-btn"
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white md:hidden hover:bg-slate-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="p-2 bg-rose-500 rounded-lg text-white font-bold flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">GrowEasy</h1>
              <p className="text-xs text-slate-500 font-medium">Lead Sync Engine</p>
            </div>
          </div>

          {/* User Account Mock Card */}
          <div className="p-4 mx-4 my-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 font-semibold text-sm">
              VK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">VK Test</p>
              <p className="text-xs text-rose-400/80 font-medium truncate">OWNER</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-3 space-y-6 overflow-y-auto scrollbar-thin">
            {menuItems.map((group) => (
              <div key={group.category} className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 px-3 block mb-2">
                  {group.category}
                </span>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-rose-400" : "text-slate-500"}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Workspace Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center">
          <p className="text-[10px] text-slate-500">SYSTEM STATUS: <span className="text-emerald-400 font-semibold">ONLINE</span></p>
        </div>
      </aside>

      {/* Overlay for mobile screen when sidebar is open */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          className="fixed inset-0 bg-slate-950/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
