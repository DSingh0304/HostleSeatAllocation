import Link from "next/link";
import { Metadata, Viewport } from "next";
import { 
  ArrowRight,
  Compass,
} from "lucide-react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#D82C2C",
};

export const metadata: Metadata = {
  title: "ResidentIQ | Hostel Seat Allocation - IIIT Una",
  description: "Real-time seat allotment portal for IIIT Una hostel accommodation.",
  keywords: ["Hostel Allocation", "Room Allotment", "IIIT Una", "Student Housing", "ResidentIQ"],
  openGraph: {
    title: "ResidentIQ | Hostel Seat Allocation - IIIT Una",
    description: "Real-time seat allotment portal for IIIT Una hostel accommodation.",
    url: "https://residentiq.iiituna.ac.in",
    siteName: "ResidentIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResidentIQ | Hostel Seat Allocation",
    description: "Real-time hostel seat allotment portal.",
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] font-sans antialiased selection:bg-[#D82C2C] selection:text-white flex flex-col justify-between">
      <div>
        {/* Top Status Bar */}
        <div className="w-full bg-[#1A1A1A] text-[#A9B2B1] text-xs font-mono px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#D82C2C] inline-block"></span>
            <span className="text-white font-medium">IIIT Una</span>
            <span className="text-[#71717A] hidden sm:inline">• Hostel Seat Allocation Portal</span>
          </div>
          <div className="flex items-center gap-2 text-white font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span>Allocation Window Open</span>
          </div>
        </div>

        {/* Clean Navigation */}
        <header className="w-full border-b border-[#1A1A1A]/10 bg-white/95 backdrop-blur-md sticky top-0 z-50">
          <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-9 h-9 bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-lg relative transition-transform duration-200 group-hover:bg-[#D82C2C]">
                <span className="font-mono text-sm tracking-tighter">RQ</span>
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#D82C2C] group-hover:bg-[#1A1A1A] transition-colors"></span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-bold tracking-tight text-[#1A1A1A] leading-none">ResidentIQ</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] mt-0.5">Hostel Portal</span>
              </div>
            </Link>

            {/* Direct Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link 
                href="#credentials" 
                className="px-3 py-1.5 text-xs font-mono font-semibold text-[#71717A] hover:text-[#1A1A1A] transition-colors cursor-pointer hidden md:inline-flex items-center"
              >
                Demo Logins
              </Link>
              <Link 
                href="/login" 
                className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-[#1A1A1A] border border-[#1A1A1A] rounded hover:bg-[#F2F2F2] transition-all cursor-pointer inline-flex items-center"
              >
                Warden Portal
              </Link>
              <Link 
                href="/login" 
                className="px-4 sm:px-5 py-2 text-xs font-semibold text-white bg-[#D82C2C] hover:bg-[#C02222] border border-[#D82C2C] rounded shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                Student Login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Direct Info, Zero Jargon */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F2F2F2] border border-[#1A1A1A]/10 rounded text-xs font-mono font-semibold text-[#1A1A1A]">
                <span>Hostel Allotment 2026</span>
              </div>

              {/* Clean Clear Headline */}
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-[#1A1A1A] leading-[1.1]">
                Book your hostel room online.
              </h1>

              {/* Straightforward Description */}
              <p className="text-base sm:text-lg text-[#1A1A1A]/80 leading-relaxed max-w-2xl font-normal">
                Real-time seat allotment for IIIT Una students. View available rooms, select your berth, and lock your seat instantly on a first-come, first-served basis.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link 
                  href="/login" 
                  className="px-6 py-3 bg-[#D82C2C] text-white font-semibold text-sm rounded hover:bg-[#C02222] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  Student Login <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="#credentials" 
                  className="px-6 py-3 bg-white text-[#1A1A1A] border border-[#1A1A1A] font-semibold text-sm rounded hover:bg-[#F2F2F2] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Demo Accounts <Compass className="w-4 h-4 text-[#D82C2C]" />
                </Link>
              </div>

              {/* Meaningful Real Info Cards */}
              <div className="grid grid-cols-3 gap-4 border-t border-[#1A1A1A]/10 pt-6 max-w-xl">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-mono">Block-C</p>
                  <p className="text-xs text-[#71717A] mt-1 font-mono">Boys Hostel</p>
                </div>
                <div className="border-l border-[#1A1A1A]/10 pl-4">
                  <p className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-mono">Floor 3</p>
                  <p className="text-xs text-[#71717A] mt-1 font-mono">Wing-B Rooms</p>
                </div>
                <div className="border-l border-[#1A1A1A]/10 pl-4">
                  <p className="text-2xl sm:text-3xl font-bold text-[#D82C2C] font-mono">84 / 120</p>
                  <p className="text-xs text-[#71717A] mt-1 font-mono">Seats Booked (70%)</p>
                </div>
              </div>

            </div>

            {/* Right Column: Room Berth Grid Preview */}
            <div className="lg:col-span-5">
              <div className="border border-[#1A1A1A]/15 bg-white p-5 rounded-lg shadow-sm">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1A1A1A]/10 text-xs font-mono">
                  <span className="font-bold text-[#1A1A1A]">Block-C • Floor 3 (Wing-B)</span>
                  <span className="text-[#22C55E] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                    Live Room Map
                  </span>
                </div>

                {/* Flat Room Berth Matrix */}
                <div className="bg-[#FAFAFA] border border-[#1A1A1A]/10 rounded p-4 mb-4">
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { num: "301", state: "occupied", label: "BOOKED", style: "bg-[#D82C2C] text-white" },
                      { num: "302", state: "occupied", label: "BOOKED", style: "bg-[#D82C2C] text-white" },
                      { num: "303", state: "available", label: "AVAILABLE", style: "bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 hover:border-[#D82C2C]" },
                      { num: "304", state: "occupied", label: "BOOKED", style: "bg-[#D82C2C] text-white" },
                      { num: "305", state: "locked", label: "IN CART", style: "bg-[#0033A0] text-white" },
                      { num: "306", state: "available", label: "AVAILABLE", style: "bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 hover:border-[#D82C2C]" },
                      { num: "307", state: "occupied", label: "BOOKED", style: "bg-[#D82C2C] text-white" },
                      { num: "308", state: "available", label: "AVAILABLE", style: "bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 hover:border-[#D82C2C]" },
                      { num: "309", state: "available", label: "AVAILABLE", style: "bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 hover:border-[#D82C2C]" },
                      { num: "310", state: "locked", label: "IN CART", style: "bg-[#0033A0] text-white" },
                      { num: "311", state: "occupied", label: "BOOKED", style: "bg-[#D82C2C] text-white" },
                      { num: "312", state: "available", label: "AVAILABLE", style: "bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 hover:border-[#D82C2C]" },
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`py-3 px-1 rounded flex flex-col items-center justify-center font-mono transition-all ${item.style}`}
                        title={`Room ${item.num} • ${item.label}`}
                      >
                        <span className="text-sm font-bold">{item.num}</span>
                        <span className="text-[8px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">
                          {item.state === 'available' ? 'OPEN' : item.state === 'locked' ? 'IN CART' : 'BOOKED'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Clean Legend */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] pt-3 mt-3 border-t border-[#1A1A1A]/10">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#D82C2C] rounded-sm"></span> Booked
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#0033A0] rounded-sm"></span> Locked in Cart
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-white border border-[#1A1A1A]/30 rounded-sm"></span> Available
                    </span>
                  </div>
                </div>

                {/* Simple Batch Status */}
                <div className="border border-[#1A1A1A]/10 p-3.5 bg-[#FAFAFA] rounded">
                  <div className="flex justify-between items-center mb-1 text-xs font-mono">
                    <span className="font-bold text-[#1A1A1A]">B.Tech Phase 1 Allotment</span>
                    <span className="text-[#22C55E] font-semibold">Active Window</span>
                  </div>
                  <p className="text-xs text-[#71717A] font-mono">
                    84 of 120 seats booked (70%)
                  </p>
                  <div className="mt-2.5 w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D82C2C] h-full w-[70%]"></div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Sandbox Credentials */}
          <section id="credentials" className="mt-12 pt-8 border-t border-[#1A1A1A]/10">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A1A]">
                Demo Accounts
              </h2>
              <p className="text-xs text-[#71717A] mt-1 font-mono">
                Use these test accounts to try the student booking or warden administration portals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Sandbox Card */}
              <div className="border border-[#1A1A1A]/15 bg-[#FAFAFA] p-5 rounded-lg text-left flex flex-col justify-between hover:border-[#1A1A1A]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#1A1A1A] font-bold">Student Account</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1A1A1A]/10 text-[#1A1A1A] rounded font-semibold">Student</span>
                  </div>
                  <div className="font-mono text-xs space-y-1.5 text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 p-3 rounded">
                    <p><span className="text-[#71717A]">Roll Number:</span> <span className="font-bold">TEST1001</span></p>
                    <p><span className="text-[#71717A]">Password:</span> <span className="font-bold">Test@123</span></p>
                  </div>
                </div>
                <Link 
                  href="/login" 
                  className="mt-4 text-xs text-white bg-[#1A1A1A] hover:bg-[#D82C2C] px-4 py-2.5 rounded font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign In as Student <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Warden / Admin Sandbox Card */}
              <div className="border border-[#1A1A1A]/15 bg-[#FAFAFA] p-5 rounded-lg text-left flex flex-col justify-between hover:border-[#1A1A1A]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#D82C2C] font-bold">Warden Account</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#D82C2C]/10 text-[#D82C2C] rounded font-semibold">Admin</span>
                  </div>
                  <div className="font-mono text-xs space-y-1.5 text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 p-3 rounded">
                    <p><span className="text-[#71717A]">Email ID:</span> <span className="font-bold">admin@iiituna.ac.in</span></p>
                    <p><span className="text-[#71717A]">Password:</span> <span className="font-bold">password123</span></p>
                  </div>
                </div>
                <Link 
                  href="/login" 
                  className="mt-4 text-xs text-white bg-[#D82C2C] hover:bg-[#C02222] px-4 py-2.5 rounded font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign In as Warden <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#1A1A1A]/10 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs font-mono text-[#71717A]">
        <div className="w-full max-w-[1480px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 IIIT Una • ResidentIQ Hostel Management Portal</p>
          <p className="text-[#71717A]">Indian Institute of Information Technology Una</p>
        </div>
      </footer>
    </div>
  );
}
