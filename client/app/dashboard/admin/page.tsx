/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building,
  Users,
  Calendar,
  BarChart3,
  UserCheck,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

import HostelsTab from "./components/HostelsTab";
import StudentsTab from "./components/StudentsTab";
import WindowsTab from "./components/WindowsTab";
import AllocateTab from "./components/AllocateTab";
import ReportsTab from "./components/ReportsTab";

//  Tabs config 
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "hostels", label: "Hostels", icon: Building },
  { id: "students", label: "Students", icon: Users },
  { id: "allocate", label: "Allocate", icon: UserCheck },
  { id: "windows", label: "Windows", icon: Calendar },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

//  Overview Component 
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/admin/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
    api
      .get("/admin/allocations", { params: { limit: 10 } })
      .then((r) => setAllocations(r.data.allocations || r.data))
      .catch(() => {});
  }, []);

  const cards = stats
    ? [
        {
          label: "Total Students",
          value: stats.totalStudents,
          color: "from-violet-500 to-purple-600",
        },
        {
          label: "Total Capacity",
          value: stats.totalCapacity,
          color: "from-blue-500 to-cyan-600",
        },
        {
          label: "Seats Filled",
          value: stats.occupiedSeats,
          color: "from-green-500 to-emerald-600",
        },
        {
          label: "Total Hostels",
          value: stats.totalHostels,
          color: "from-orange-500 to-red-600",
        },
        {
          label: "Teachers",
          value: stats.totalTeachers,
          color: "from-pink-500 to-rose-600",
        },
        {
          label: "Available",
          value: (stats.totalCapacity || 0) - (stats.occupiedSeats || 0),
          color: "from-teal-500 to-green-600",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {cards.map(({ label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${color} p-6 rounded-3xl text-white shadow-xl`}
          >
            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2">
              {label}
            </p>
            <p className="text-4xl font-black">{value ?? ""}</p>
          </motion.div>
        ))}
        {!stats &&
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-3xl bg-foreground/5 animate-pulse"
              />
            ))}
      </div>

      <div className="card rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-foreground/5">
          <h2 className="text-xl font-black">Recent Allocations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-foreground/30 font-black text-xs uppercase tracking-widest">
                {[
                  "Name",
                  "ID",
                  "Program",
                  "Hostel",
                  "Room",
                  "Type",
                  "Date",
                ].map((h) => (
                  <th key={h} className="px-6 py-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {allocations.map((a: any) => (
                <tr
                  key={a.id}
                  className="hover:bg-foreground/5 transition-colors"
                >
                  <td className="px-6 py-4 font-bold">
                    {a.student?.name || a.teacher?.name || ""}
                  </td>
                  <td className="px-6 py-4 text-foreground/60">
                    {a.student?.rollNumber || a.teacher?.employeeId || ""}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {a.student?.program || "faculty"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground/60">
                    {a.room?.hostel?.name}
                  </td>
                  <td className="px-6 py-4 font-bold">{a.room?.roomNumber}</td>
                  <td className="px-6 py-4">
                    {a.adminOverride ? (
                      <span className="text-orange-500 text-xs font-bold">
                        Manual
                      </span>
                    ) : (
                      <span className="text-green-500 text-xs font-bold">
                        Self
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-foreground/40 text-xs">
                    {new Date(a.bookedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {allocations.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-foreground/40"
                  >
                    No allocations yet.
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

//  Main Page 
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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none text-foreground">
                ResidentIQ
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-foreground">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium text-sm transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 card rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <h1 className="text-xl font-bold capitalize text-foreground">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
