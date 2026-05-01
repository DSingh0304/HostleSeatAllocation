"use client";
import { useState } from "react";
import { Search, UserCheck, Loader2, CheckCircle2 } from "lucide-react";
import api from "../../../lib/api";
import toast from "react-hot-toast";

export default function AllocateTab() {
  const [step, setStep] = useState<"search" | "pick_room" | "done">("search");
  const [search, setSearch] = useState("");
  const [personType, setPersonType] = useState<"student" | "teacher">(
    "student",
  );
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [hostels, setHostels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const [windows, setWindows] = useState<any[]>([]);
  const [selectedWindow, setSelectedWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const searchPeople = async () => {
    if (!search.trim()) return;
    try {
      setLoading(true);
      if (personType === "student") {
        const { data } = await api.get("/admin/students", {
          params: { search, limit: 10 },
        });
        setResults(data.students);
      } else {
        const { data } = await api.get("/admin/teachers");
        setResults(
          data.filter(
            (t: any) =>
              t.name.toLowerCase().includes(search.toLowerCase()) ||
              t.employeeId.toLowerCase().includes(search.toLowerCase()),
          ),
        );
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const selectPerson = async (person: any) => {
    setSelected(person);
    setStep("pick_room");
    try {
      const [hostelRes, windowRes] = await Promise.all([
        api.get("/admin/hostels"),
        api.get("/admin/windows"),
      ]);
      setHostels(hostelRes.data);
      setWindows(windowRes.data.filter((w: any) => w.isActive));
      if (windowRes.data.length > 0) setSelectedWindow(windowRes.data[0].id);
    } catch {
      toast.error("Failed to load hostels");
    }
  };

  const loadRooms = async (hostelId: string) => {
    try {
      const { data } = await api.get(`/admin/hostels/${hostelId}/rooms`);
      setRooms(data);
      setSelectedHostel(hostels.find((h: any) => h.id === hostelId));
    } catch {
      toast.error("Failed to load rooms");
    }
  };

  const assign = async (room: any) => {
    if (!selectedWindow)
      return toast.error("Please select an allocation window");
    try {
      setLoading(true);
      const payload = {
        roomId: room.id,
        windowId: selectedWindow,
        notes,
        ...(personType === "student"
          ? { studentId: selected.id }
          : { teacherId: selected.id }),
      };
      await api.post("/admin/allocations/override", payload);
      toast.success(`Room ${room.roomNumber} assigned to ${selected.name}!`);
      setStep("done");
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.canForce) {
        if (confirm(`Room is at capacity. Force assign anyway?`)) {
          try {
            await api.post("/admin/allocations/override", {
              ...{
                roomId: room.id,
                windowId: selectedWindow,
                notes,
                ...(personType === "student"
                  ? { studentId: selected.id }
                  : { teacherId: selected.id }),
              },
              force: true,
            });
            toast.success(
              `Force-assigned Room ${room.roomNumber} to ${selected.name}`,
            );
            setStep("done");
          } catch (e2: any) {
            toast.error(
              e2.response?.data?.message || "Force assignment failed",
            );
          }
        }
      } else toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("search");
    setSelected(null);
    setSearch("");
    setResults([]);
    setRooms([]);
    setSelectedHostel(null);
    setNotes("");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card p-8 rounded-[2.5rem]">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-primary" /> Manual Seat Allocation
        </h2>
        <p className="text-foreground/50 text-sm mb-8">
          Assign a room directly to any student or teacher bypasses all
          restrictions.
        </p>

        {step === "search" && (
          <div className="space-y-6">
            <div className="flex p-1 bg-foreground/5 rounded-xl w-fit">
              {(["student", "teacher"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPersonType(t)}
                  className={`px-5 py-2 rounded-lg font-bold capitalize transition-all ${personType === t ? "bg-primary text-white" : "text-foreground/40"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPeople()}
                placeholder={
                  personType === "student"
                    ? "Search by name, roll number, or email…"
                    : "Search by name or employee ID…"
                }
                className="flex-1 px-5 py-4 rounded-2xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium"
              />
              <button
                onClick={searchPeople}
                disabled={loading}
                className="px-6 py-4 btn-primary text-white rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}{" "}
                Search
              </button>
            </div>
            {results.length > 0 && (
              <div className="divide-y divide-foreground/5 card rounded-2xl overflow-hidden">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectPerson(r)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-foreground/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center font-black">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="font-bold">{r.name}</p>
                        <p className="text-xs text-foreground/40">
                          {r.rollNumber || r.employeeId} •{" "}
                          {r.branch || r.department}
                        </p>
                      </div>
                    </div>
                    <span className="text-primary text-sm font-bold">
                      Select →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "pick_room" && selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/20">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">
                {selected.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-black">{selected.name}</p>
                <p className="text-sm text-foreground/40">
                  {selected.rollNumber || selected.employeeId} • {personType}
                </p>
              </div>
              <button
                onClick={reset}
                className="text-sm text-foreground/40 hover:text-foreground transition-colors"
              >
                Change →
              </button>
            </div>

            {windows.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  Allocation Window *
                </label>
                <select
                  value={selectedWindow}
                  onChange={(e) => setSelectedWindow(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium"
                >
                  {windows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Notes (optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for manual override…"
                className="px-4 py-3 rounded-xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium"
              />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-3">
                Select Hostel
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {hostels.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => loadRooms(h.id)}
                    className={`p-4 rounded-2xl text-left transition-all font-bold text-sm border-2 ${selectedHostel?.id === h.id ? "border-primary bg-primary/10 text-primary" : "card border-transparent hover:border-primary/20"}`}
                  >
                    {h.name}
                    <br />
                    <span className="text-foreground/40 text-xs font-medium">
                      {h.gender} • {h._count?.rooms} rooms
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {rooms.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-3">
                  Select Room in {selectedHostel?.name}
                </p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {rooms.map((room) => {
                    const occupied = room._count?.assignments ?? 0;
                    const isFull = occupied >= room.capacity;
                    return (
                      <button
                        key={room.id}
                        onClick={() => assign(room)}
                        disabled={loading}
                        className={`p-3 rounded-xl card text-xs text-left transition-all ${room.status === "maintenance" ? "opacity-30 cursor-not-allowed" : isFull ? "border border-red-500/20 opacity-60" : "hover:border-primary hover:border"}`}
                      >
                        <p className="font-black text-sm">{room.roomNumber}</p>
                        <p
                          className={`font-bold mt-1 ${isFull ? "text-red-500" : "text-green-500"}`}
                        >
                          {occupied}/{room.capacity} seats
                        </p>
                        {room.status === "maintenance" && (
                          <p className="text-orange-500 text-[10px]">
                            Maintenance
                          </p>
                        )}
                        {isFull && (
                          <p className="text-red-500 text-[10px]">
                            Full (can force)
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-12 gap-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black mb-2">Room Assigned!</h3>
              <p className="text-foreground/50">
                The allocation has been saved and the student has been notified.
              </p>
            </div>
            <button
              onClick={reset}
              className="px-8 py-4 btn-primary text-white rounded-2xl font-bold"
            >
              Allocate Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
