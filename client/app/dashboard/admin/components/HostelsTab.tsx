"use client";
import { useState, useEffect } from "react";
import {
  Building,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Settings,
  Loader2,
  Check,
  X,
  Save,
} from "lucide-react";
import api from "../../../lib/api";
import toast from "react-hot-toast";

const PROGRAMS = ["btech", "mtech", "phd"];
const YEARS = [1, 2, 3, 4];

const defaultConfig = () => ({
  // Room batch
  prefix: "",
  from: "",
  to: "",
  capacity: "2",
  // Restriction
  allowedPrograms: [] as string[],
  allowedYears: [] as number[],
  allowedGender: "",
});

export default function HostelsTab() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Record<string, any[]>>({});
  const [expandedHostel, setExpandedHostel] = useState<string | null>(null);
  const [configuringHostel, setConfiguringHostel] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [hostelForm, setHostelForm] = useState({
    name: "",
    gender: "male",
    totalRooms: "",
    address: "",
  });
  // Per-hostel config: keyed by hostelId
  const [configs, setConfigs] = useState<
    Record<string, ReturnType<typeof defaultConfig>>
  >({});

  const getConfig = (hostelId: string) => configs[hostelId] ?? defaultConfig();
  const setConfig = (
    hostelId: string,
    patch: Partial<ReturnType<typeof defaultConfig>>,
  ) =>
    setConfigs((c) => ({
      ...c,
      [hostelId]: { ...getConfig(hostelId), ...patch },
    }));

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/hostels");
      setHostels(data);
      setLoaded(true);
    } catch {
      toast.error("Failed to load hostels");
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async (hostelId: string) => {
    if (rooms[hostelId] !== undefined) {
      setExpandedHostel(expandedHostel === hostelId ? null : hostelId);
      return;
    }
    try {
      const { data } = await api.get(`/admin/hostels/${hostelId}/rooms`);
      setRooms((r) => ({ ...r, [hostelId]: data }));
      setExpandedHostel(hostelId);
    } catch {
      toast.error("Failed to load rooms");
    }
  };

  const createHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/admin/hostels", {
        ...hostelForm,
        totalRooms: parseInt(hostelForm.totalRooms),
      });
      toast.success("Hostel created!");
      setHostelForm({ name: "", gender: "male", totalRooms: "", address: "" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteHostel = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its rooms? This cannot be undone.`))
      return;
    try {
      await api.delete(`/admin/hostels/${id}`);
      toast.success("Hostel deleted");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const saveHostelConfig = async (hostel: any) => {
    const cfg = getConfig(hostel.id);
    if (!cfg.from || !cfg.to || !cfg.capacity) {
      toast.error("Please fill in room range (from, to, capacity)");
      return;
    }
    try {
      setConfigSaving(true);
      // 1. Batch-create rooms (skipDuplicates=true on backend, won't overwrite existing)
      const roomRes = await api.post("/admin/rooms/batch", {
        hostelId: hostel.id,
        prefix: cfg.prefix || undefined,
        from: parseInt(cfg.from),
        to: parseInt(cfg.to),
        capacity: parseInt(cfg.capacity),
        allowedGender: cfg.allowedGender || null,
      });
      // 2. Create restriction
      await api.post("/admin/restrictions", {
        hostelId: hostel.id,
        allowedYears: cfg.allowedYears,
        allowedPrograms: cfg.allowedPrograms,
        allowedGender: cfg.allowedGender || null,
      });
      toast.success(roomRes.data.message + " • Restrictions saved");
      // Refresh rooms for this hostel
      setRooms((r) => {
        const copy = { ...r };
        delete copy[hostel.id];
        return copy;
      });
      setConfiguringHostel(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save config");
    } finally {
      setConfigSaving(false);
    }
  };

  const toggleRoomStatus = async (roomId: string, currentStatus: string) => {
    const newStatus =
      currentStatus === "maintenance" ? "available" : "maintenance";
    try {
      await api.patch(`/admin/rooms/${roomId}`, { status: newStatus });
      setRooms((r) => {
        const updated = { ...r };
        for (const hid in updated)
          updated[hid] = updated[hid].map((room) =>
            room.id === roomId ? { ...room, status: newStatus } : room,
          );
        return updated;
      });
      toast.success(`Room marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update room status");
    }
  };

  const setRoomGender = async (
    roomId: string,
    allowedGender: string | null,
  ) => {
    try {
      await api.patch(`/admin/rooms/${roomId}`, { allowedGender });
      setRooms((r) => {
        const updated = { ...r };
        for (const hid in updated)
          updated[hid] = updated[hid].map((room) =>
            room.id === roomId ? { ...room, allowedGender } : room,
          );
        return updated;
      });
      toast.success("Room gender updated");
    } catch {
      toast.error("Failed to update room gender");
    }
  };

  const deleteRoom = async (
    hostelId: string,
    roomId: string,
    roomNumber: string,
  ) => {
    if (
      !confirm(`Delete room ${roomNumber}? This will also cancel any bookings.`)
    )
      return;
    try {
      await api.delete(`/admin/rooms/${roomId}`);
      setRooms((r) => ({
        ...r,
        [hostelId]: r[hostelId].filter((room) => room.id !== roomId),
      }));
      toast.success(`Room ${roomNumber} deleted`);
    } catch {
      toast.error("Failed to delete room");
    }
  };

  const deleteAllHostelRooms = async (hostelId: string, name: string) => {
    if (
      !confirm(
        `Delete ALL rooms in "${name}"? This will cancel all bookings and cannot be undone.`,
      )
    )
      return;
    try {
      await api.delete(`/admin/hostels/${hostelId}/rooms`);
      setRooms((r) => ({ ...r, [hostelId]: [] }));
      toast.success(`All rooms in ${name} deleted`);
      load();
    } catch {
      toast.error("Failed to delete rooms");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!loaded)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-foreground/40 font-bold">Loading hostels...</p>
      </div>
    );

  return (
    <div className="space-y-8">
      {/*  Create Hostel  */}
      <div className="glass p-8 rounded-[2.5rem]">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <Plus className="w-6 h-6 text-primary" /> Add New Hostel
        </h2>
        <form
          onSubmit={createHostel}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            ["Hostel Name", "name", "text", "e.g. Kaveri Boys Hostel"],
            ["Total Rooms (approx)", "totalRooms", "number", "e.g. 120"],
            ["Address", "address", "text", "Campus block / location"],
          ].map(([label, key, type, ph]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {label}
              </label>
              <input
                type={type}
                value={(hostelForm as any)[key]}
                onChange={(e) =>
                  setHostelForm((f) => ({ ...f, [key]: e.target.value }))
                }
                placeholder={ph}
                className="px-4 py-3 rounded-xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
              Gender
            </label>
            <select
              value={hostelForm.gender}
              onChange={(e) =>
                setHostelForm((f) => ({ ...f, gender: e.target.value }))
              }
              className="px-4 py-3 rounded-xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium"
            >
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
              <option value="mixed">Mixed (set per-room gender)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}{" "}
              Create Hostel
            </button>
          </div>
        </form>
      </div>

      {/*  Hostel List  */}
      <div className="glass rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-foreground/5">
          <h2 className="text-xl font-black">All Hostels</h2>
          <p className="text-xs text-foreground/40 mt-1">
            Click <strong>Configure</strong> to set up rooms and eligibility
            restrictions for a hostel.
          </p>
        </div>
        <div className="divide-y divide-foreground/5">
          {hostels.length === 0 ? (
            <p className="p-8 text-center text-foreground/40 font-medium">
              No hostels yet. Create one above.
            </p>
          ) : (
            hostels.map((h) => (
              <div key={h.id}>
                {/*  Hostel row  */}
                <div className="flex items-center justify-between px-8 py-5 hover:bg-foreground/5 transition-colors">
                  <div
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => loadRooms(h.id)}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{h.name}</p>
                      <p className="text-xs text-foreground/40 font-bold uppercase">
                        {h.gender} hostel • {h._count?.rooms ?? 0} rooms
                      </p>
                      {h.address && (
                        <p className="text-xs text-foreground/30">
                          {h.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Configure toggle */}
                    <button
                      onClick={() =>
                        setConfiguringHostel(
                          configuringHostel === h.id ? null : h.id,
                        )
                      }
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${configuringHostel === h.id ? "bg-primary text-white" : "bg-muted text-foreground hover:bg-muted/80"}`}
                    >
                      <Settings className="w-4 h-4" /> Configure
                    </button>
                    {/* Expand rooms */}
                    <button
                      onClick={() => loadRooms(h.id)}
                      className="p-2 card rounded-lg text-muted-foreground hover:text-primary transition-all"
                    >
                      {expandedHostel === h.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {/* Delete hostel */}
                    <button
                      onClick={() => deleteHostel(h.id, h.name)}
                      className="p-2 card rounded-lg text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/*  Configuration Panel  */}
                {configuringHostel === h.id &&
                  (() => {
                    const cfg = getConfig(h.id);
                    const isMixed = h.gender === "mixed";
                    return (
                      <div className="border-t border-primary/10 bg-primary/3 p-8">
                        <h3 className="font-black text-base mb-6 flex items-center gap-2 text-primary">
                          <Settings className="w-4 h-4" /> Configure {h.name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Left: Room Setup */}
                          <div className="space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-3">
                              Room Setup
                            </p>
                            <p className="text-xs text-foreground/40">
                              Rooms that already exist won't be overwritten only
                              new numbers will be added.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                  Prefix (optional)
                                </label>
                                <input
                                  value={cfg.prefix}
                                  onChange={(e) =>
                                    setConfig(h.id, { prefix: e.target.value })
                                  }
                                  placeholder="e.g. A-"
                                  className="px-4 py-3 rounded-xl bg-foreground/5 outline-none font-medium text-sm"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                  From *
                                </label>
                                <input
                                  type="number"
                                  value={cfg.from}
                                  onChange={(e) =>
                                    setConfig(h.id, { from: e.target.value })
                                  }
                                  placeholder="101"
                                  className="px-4 py-3 rounded-xl bg-foreground/5 outline-none font-medium text-sm"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                  To *
                                </label>
                                <input
                                  type="number"
                                  value={cfg.to}
                                  onChange={(e) =>
                                    setConfig(h.id, { to: e.target.value })
                                  }
                                  placeholder="150"
                                  className="px-4 py-3 rounded-xl bg-foreground/5 outline-none font-medium text-sm"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                  Capacity *
                                </label>
                                <input
                                  type="number"
                                  value={cfg.capacity}
                                  onChange={(e) =>
                                    setConfig(h.id, {
                                      capacity: e.target.value,
                                    })
                                  }
                                  placeholder="2"
                                  className="px-4 py-3 rounded-xl bg-foreground/5 outline-none font-medium text-sm"
                                />
                              </div>
                              {isMixed && (
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                    Room Gender
                                  </label>
                                  <select
                                    value={cfg.allowedGender}
                                    onChange={(e) =>
                                      setConfig(h.id, {
                                        allowedGender: e.target.value,
                                      })
                                    }
                                    className="px-4 py-3 rounded-xl bg-foreground/5 outline-none font-medium text-sm"
                                  >
                                    <option value="">Any</option>
                                    <option value="male">Male only</option>
                                    <option value="female">Female only</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Eligibility */}
                          <div className="space-y-5">
                            <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-3">
                              Eligibility Restrictions
                            </p>
                            <p className="text-xs text-foreground/40">
                              Leave all unselected to allow anyone. Only
                              selected programs/years will see this hostel.
                            </p>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                Streams{" "}
                                <span className="normal-case text-foreground/25 font-medium">
                                  (empty = all)
                                </span>
                              </label>
                              <div className="flex gap-2 flex-wrap">
                                {PROGRAMS.map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() =>
                                      setConfig(h.id, {
                                        allowedPrograms:
                                          cfg.allowedPrograms.includes(p)
                                            ? cfg.allowedPrograms.filter(
                                                (x) => x !== p,
                                              )
                                            : [...cfg.allowedPrograms, p],
                                      })
                                    }
                                    className={`px-4 py-2 rounded-lg font-medium text-sm uppercase transition-all ${cfg.allowedPrograms.includes(p) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                Years{" "}
                                <span className="normal-case text-foreground/25 font-medium">
                                  (empty = all)
                                </span>
                              </label>
                              <div className="flex gap-2 flex-wrap">
                                {YEARS.map((y) => (
                                  <button
                                    key={y}
                                    type="button"
                                    onClick={() =>
                                      setConfig(h.id, {
                                        allowedYears: cfg.allowedYears.includes(
                                          y,
                                        )
                                          ? cfg.allowedYears.filter(
                                              (x) => x !== y,
                                            )
                                          : [...cfg.allowedYears, y],
                                      })
                                    }
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${cfg.allowedYears.includes(y) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                  >
                                    Year {y}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save */}
                        <div className="mt-8 flex gap-3">
                          <button
                            onClick={() => saveHostelConfig(h)}
                            disabled={configSaving}
                            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {configSaving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                            Save Configuration
                          </button>
                          <button
                            onClick={() => setConfiguringHostel(null)}
                            className="px-6 btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                {/*  Rooms Panel  */}
                {expandedHostel === h.id && rooms[h.id] && (
                  <div className="bg-foreground/2 border-t border-foreground/5 p-6">
                    <div className="flex justify-between items-center mb-6 px-2">
                      <h3 className="font-bold text-xs text-foreground/40 uppercase tracking-widest">
                        Room Inventory ({rooms[h.id].length} rooms)
                      </h3>
                      {rooms[h.id].length > 0 && (
                        <button
                          onClick={() => deleteAllHostelRooms(h.id, h.name)}
                          className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-all flex items-center gap-2"
                        >
                          <X className="w-3 h-3" /> Clear All Rooms
                        </button>
                      )}
                    </div>
                    {rooms[h.id].length === 0 ? (
                      <p className="text-center text-foreground/30 py-8 font-medium">
                        No rooms yet. Use Configure to add rooms.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {rooms[h.id].map((room) => (
                          <div
                            key={room.id}
                            className={`p-3 rounded-xl glass text-xs ${room.status === "maintenance" ? "opacity-50" : ""}`}
                          >
                            <span className="font-black text-sm block mb-1">
                              {room.roomNumber}
                            </span>
                            <p className="text-foreground/40">
                              {room.capacity} seats •{" "}
                              {room._count?.assignments ?? 0}/{room.capacity}{" "}
                              occupied
                            </p>
                            {h.gender === "mixed" && (
                              <select
                                value={room.allowedGender || ""}
                                onChange={(e) =>
                                  setRoomGender(room.id, e.target.value || null)
                                }
                                className="mt-1 w-full text-[10px] bg-foreground/5 rounded-lg px-1 py-0.5 font-bold outline-none"
                              >
                                <option value="">Any gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            )}
                            <div className="flex gap-1 mt-2">
                              <button
                                onClick={() =>
                                  toggleRoomStatus(room.id, room.status)
                                }
                                className={`flex-1 text-[10px] font-bold py-1 rounded-lg transition-all ${room.status === "maintenance" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"}`}
                              >
                                {room.status === "maintenance"
                                  ? "✓ Available"
                                  : "⚠ Maintenance"}
                              </button>
                              <button
                                onClick={() =>
                                  deleteRoom(h.id, room.id, room.roomNumber)
                                }
                                className="p-1 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
