/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  Layers,
} from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import HostelsTab from "./components/HostelsTab";
import StudentsTab from "./components/StudentsTab";
import AllocateTab from "./components/AllocateTab";
import WindowsTab from "./components/WindowsTab";
import ReportsTab from "./components/ReportsTab";

const TABS = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "hostels", label: "Hostels", icon: Building2 },
  { id: "students", label: "Students", icon: Users },
  { id: "allocate", label: "Manual Allocation", icon: CheckCircle2 },
  { id: "windows", label: "Allocation Windows", icon: Calendar },
  { id: "reports", label: "Reports", icon: FileText },
];

function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/allocations?limit=10"),
    ]).then(([statsRes, allocRes]) => {
      setStats(statsRes.data);
      setAllocations(allocRes.data.allocations || []);
    });
  }, []);

  const cards = stats
    ? [
        {
          label: "Total Students",
          value: stats.totalStudents,
          sub: "ENROLLED",
        },
        {
          label: "Confirmed Allocations",
          value: stats.confirmedAllocations,
          sub: "ALLOCATED",
        },
        {
          label: "Total Capacity",
          value: stats.totalCapacity,
          sub: "CAPACITY",
        },
        {
          label: "Occupancy Rate",
          value: `${stats.occupancyRate ?? 0}%`,
          sub: "OCCUPANCY",
        },
        {
          label: "Hostel Blocks",
          value: stats.totalHostels,
          sub: "BLOCKS",
        },
        {
          label: "Available Beds",
          value: (stats.totalCapacity || 0) - (stats.occupiedSeats || 0),
          sub: "AVAILABLE",
        },
      ]
    : [];

  return (
    <div className="space-y-8 text-left font-sans">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {cards.map(({ label, value, sub }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#1A1A1A]/15 p-6 rounded-lg shadow-sm hover:border-[#1A1A1A] transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
                  {sub}
                </span>
                <span className="w-1.5 h-1.5 bg-[#D82C2C] rounded-full"></span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-[#1A1A1A]">
                {value ?? ""}
              </p>
            </div>
            <p className="text-xs font-semibold text-[#1A1A1A]/70 mt-4 border-t border-[#1A1A1A]/10 pt-2">
              {label}
            </p>
          </motion.div>
        ))}
        {!stats &&
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-lg bg-[#F2F2F2] border border-[#1A1A1A]/10 animate-pulse"
              />
            ))}
      </div>

      {/* Recent Allocations Table */}
      <div className="bg-white border border-[#1A1A1A]/15 rounded-lg shadow-sm overflow-hidden text-left">
        <div className="p-6 border-b border-[#1A1A1A]/10 flex justify-between items-center bg-[#FFFFFF]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
              ACTIVITY
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">
              Recent Allocations
            </h2>
          </div>
          <span className="text-xs font-mono text-[#D82C2C] font-bold">
            ● LIVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#F2F2F2] border-b border-[#1A1A1A]/10 font-mono text-[11px] uppercase tracking-wider text-[#71717A]">
                {[
                  "Name",
                  "Roll / ID",
                  "Program",
                  "Hostel",
                  "Room",
                  "Type",
                  "Date & Time",
                ].map((h) => (
                  <th key={h} className="px-6 py-3.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/10">
              {allocations.map((a: any) => (
                <tr
                  key={a.id}
                  className="hover:bg-[#F2F2F2]/60 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-[#1A1A1A]">
                    {a.student?.name || a.teacher?.name || ""}
                  </td>
                  <td className="px-6 py-4 font-mono text-[#71717A]">
                    {a.student?.rollNumber || a.teacher?.employeeId || ""}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <span className="px-2 py-0.5 bg-[#F2F2F2] border border-[#1A1A1A]/15 text-[#1A1A1A] text-[10px] rounded uppercase font-bold">
                      {a.student?.program || "faculty"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#71717A]">
                    {a.room?.hostel?.name}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-[#1A1A1A]">
                    {a.room?.roomNumber}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {a.adminOverride ? (
                      <span className="text-[#D82C2C] font-bold">
                        MANUAL
                      </span>
                    ) : (
                      <span className="text-[#1A1A1A] font-bold">
                        ONLINE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-[#71717A]">
                    {new Date(a.bookedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {allocations.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center font-mono text-xs text-[#71717A]"
                  >
                    No allocations recorded in the current active window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const role = user?.role;
    if (role && role !== "superadmin" && role !== "warden") {
      router.replace("/login");
    }
  }, [user]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {}
    }
    logout();
    router.push("/login");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "hostels":
        return <HostelsTab />;
      case "students":
        return <StudentsTab />;
      case "allocate":
        return <AllocateTab />;
      case "windows":
        return <WindowsTab />;
      case "reports":
        return <ReportsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FFFFFF] text-[#1A1A1A] font-sans text-left">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#1A1A1A]/15 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="p-6 border-b border-[#1A1A1A]/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1A1A1A] rounded flex items-center justify-center text-white font-mono font-bold text-sm">
              RQ
            </div>
            <div>
              <p className="font-bold text-base leading-none text-[#1A1A1A]">
                ResidentIQ
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] mt-0.5">
                Admin Console
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-[#1A1A1A] text-white shadow-sm"
                    : "text-[#71717A] hover:bg-[#F2F2F2] hover:text-[#1A1A1A]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1A1A1A]/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-[#F2F2F2] rounded border border-[#1A1A1A]/10">
            <div className="w-7 h-7 rounded bg-[#1A1A1A] flex items-center justify-center text-white font-mono font-bold text-xs">
              {user?.name?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate text-[#1A1A1A]">
                {user?.name || "Warden Admin"}
              </p>
              <p className="text-[10px] font-mono text-[#D82C2C] uppercase font-bold">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-[#D82C2C] hover:bg-[#D82C2C]/10 font-mono text-xs font-bold uppercase tracking-wider transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#1A1A1A]/50 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative">
        <header className="sticky top-0 z-20 bg-white border-b border-[#1A1A1A]/15 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 border border-[#1A1A1A]/15 rounded"
            >
              {sidebarOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D82C2C]"></span>
              <h1 className="text-lg font-bold uppercase tracking-tight text-[#1A1A1A] font-mono">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#71717A] hidden sm:block">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
