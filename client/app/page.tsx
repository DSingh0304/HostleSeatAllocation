import Link from "next/link";
import { Metadata, Viewport } from "next";
import { 
  Pencil, 
  BookOpen, 
  Coffee, 
  MessageSquare, 
  CheckCircle2, 
  Star, 
  ArrowRight,
  Shield,
  Zap,
  Users,
  Mail
} from "lucide-react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ResidentIQ | Hostel Room Allocation Made Simple",
  description: "A transparent, first-come first-served seat allocation system for IIIT Una. Efficient, fair, and built for students.",
  keywords: ["Hostel", "Room Allocation", "IIIT Una", "Student Housing", "ResidentIQ"],
  openGraph: {
    title: "ResidentIQ | Smart Hostel Allocation",
    description: "A transparent, first-come first-served seat allocation system for students.",
    url: "https://residentiq.example.com",
    siteName: "ResidentIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResidentIQ | Smart Hostel Allocation",
    description: "A transparent, first-come first-served seat allocation system for students.",
  }
};

export default function LandingPage() {
  return (
    <>
      <div className="landing-container relative">
        <div className="spiral-binding hidden md:block"></div>
        
        <nav className="w-full px-6 md:px-8 py-6 relative z-20">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="sketch-border p-2 group-hover:rotate-12 transition-all">
                <Pencil className="w-6 h-6 text-[#D12828]" />
              </div>
              <span className="text-3xl font-bold tracking-wider text-[#0E2A5C]">
                ResidentIQ
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-xl font-semibold">
              <Link href="#features" className="hover:text-[#D12828] hover:underline decoration-wavy transition-all">Features</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="sketch-button hidden sm:flex">
                Log In
              </Link>
              <Link href="/login" className="sketch-button sketch-button-primary">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        <main className="relative z-10 w-full px-6 md:px-8 pt-12 pb-24 overflow-hidden">
          <div className="coffee-ring top-10 right-20 rotate-45 hidden md:block"></div>
          
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left pt-10 animate-fade-up">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Hostel Room Allocation <br/>
                <span className="highlight-text mt-2">Made Simple!</span>
              </h1>
              <p className="text-2xl text-[#333333] mb-10 max-w-2xl mx-auto md:mx-0">
                A transparent, first-come first-served seat allocation system. 
                Efficient, fair, and built for students (no more paper forms!).
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start items-center">
                <Link href="/login" className="sketch-button sketch-button-primary text-2xl py-3 px-8">
                  Launch Portal <ArrowRight className="ml-2 w-6 h-6" />
                </Link>
                <Link href="#features" className="text-xl hover:underline decoration-wavy underline-offset-4 flex items-center gap-2">
                  <Coffee className="w-5 h-5" /> See how it works
                </Link>
              </div>

              <div className="mt-12 sketch-border p-6 bg-[var(--highlighter)] inline-block text-left relative transform -rotate-1 max-w-full overflow-hidden">
                <div className="tape-effect" style={{ top: '-10px', left: '40%' }}></div>
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-2 text-[var(--ink-blue)]">
                  <Star className="w-6 h-6 text-[var(--alert-red)]" /> Live Demo Accounts
                </h3>
                <div className="text-xl text-[var(--pencil-grey)] space-y-2">
                  <p><strong className="text-[var(--alert-red)]">Warden:</strong> admin@iiituna.ac.in <span className="mx-2 text-black/20">|</span> password123</p>
                  <p><strong className="text-[var(--alert-red)]">Student:</strong> TEST1001 <span className="mx-2 text-black/20">|</span> Test@123</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative w-full max-w-md mx-auto mt-12 md:mt-0 animate-fade-up delay-200">
              <div className="sketch-border p-6 bg-white rotate-2 relative z-10 hover:rotate-0 transition-transform duration-300">
                <div className="tape-effect"></div>
                <div className="flex items-center gap-4 mb-6 border-b-2 border-dashed border-[#333333] pb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#0E2A5C] flex items-center justify-center bg-[#FFFFA5]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold leading-none m-0">Room 404</h3>
                    <p className="text-lg text-[#333333] m-0 leading-none">Available</p>
                  </div>
                </div>
                <div className="space-y-4 text-xl">
                  <div className="flex items-center justify-between">
                    <span>Capacity:</span>
                    <span className="font-bold">2 Students</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Floor:</span>
                    <span className="font-bold">4th Floor, South Wing</span>
                  </div>
                  <Link href="/login" className="sketch-button sketch-button-primary w-full mt-4 text-xl py-2 flex justify-center">
                    Claim Seat
                  </Link>
                </div>
              </div>
              <div className="absolute inset-0 sketch-border-alt translate-x-4 translate-y-4 -z-10 bg-[#FFFFA5]"></div>
              
              <svg className="doodle-arrow -left-12 top-20 text-[#D12828] hidden md:block" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10,90 Q40,10 90,50 M70,30 L90,50 L70,70" />
              </svg>
            </div>
          </div>
        </main>

        <section id="features" className="w-full px-6 md:px-8 py-20 border-t-2 border-dashed border-[#333333] relative bg-white/30 backdrop-blur-sm">
          <div className="coffee-ring -left-10 bottom-20 hidden md:block"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-up delay-100">
              <h2 className="text-4xl md:text-5xl font-bold inline-block relative">
                Why use ResidentIQ?
                <svg className="absolute -bottom-4 left-0 w-full h-4 text-[#D12828]" viewBox="0 0 200 20" preserveAspectRatio="none">
                  <path d="M0,10 Q100,20 200,0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-10 h-10 text-[#D12828]" />,
                  title: "Instant Booking",
                  desc: "Real-time seat counts and millisecond accuracy ensure a fair FCFS process."
                },
                {
                  icon: <Shield className="w-10 h-10 text-[#0E2A5C]" />,
                  title: "Safe & Secure",
                  desc: "ACID-compliant transactions and Redis locking prevent double bookings."
                },
                {
                  icon: <Users className="w-10 h-10 text-[#333333]" />,
                  title: "Admin Control",
                  desc: "Wardens get full visibility with live dashboards and manual overrides."
                }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className={`sketch-border p-8 bg-white relative group animate-fade-up`}
                  style={{ animationDelay: `${(i+1)*100}ms` }}
                >
                  <div className="tape-effect" style={{ transform: `translateX(-50%) rotate(${i % 2 === 0 ? -3 : 3}deg)` }}></div>
                  <div className="mb-6 inline-block p-3 border-2 border-[#333333] rounded-xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform bg-[#F4F1EA]">
                    {feature.icon}
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-xl text-[#333333] leading-snug">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


        <section className="w-full px-6 md:px-8 py-24 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">Ready to ditch the paper?</h2>
            <p className="text-2xl text-[#333333] mb-10">
              Join 50+ institutes already using ResidentIQ for stress-free allocations.
            </p>
            <Link href="/login" className="sketch-button sketch-button-primary text-3xl py-4 px-12 inline-flex gap-3">
              Get Started Now <Zap className="w-8 h-8" />
            </Link>
          </div>
          <svg className="absolute top-10 left-10 text-[#0000FF] opacity-30 w-32 h-32 rotate-12 hidden md:block" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10,50 Q50,10 90,50 T10,50" />
            <path d="M20,60 Q50,20 80,60 T20,60" />
          </svg>
        </section>

        <footer className="w-full px-6 md:px-8 py-12 border-t-4 border-[#333333] bg-[#0E2A5C] text-white relative z-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Pencil className="w-8 h-8 text-[#D12828]" />
                <span className="text-3xl font-bold font-sans tracking-wide">ResidentIQ</span>
              </div>
              <p className="text-xl text-gray-300 max-w-sm">
                Making hostel allocations fair, fast, and entirely digital. 
              </p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-4 text-[#FFFFA5]">Links</h4>
              <ul className="space-y-2 text-xl text-gray-300">
                <li><a href="#features" className="hover:text-white hover:underline decoration-wavy">Features</a></li>
                <li><a href="#" className="hover:text-white hover:underline decoration-wavy">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-4 text-[#FFFFA5]">Legal</h4>
              <ul className="space-y-2 text-xl text-gray-300">
                <li><a href="#" className="hover:text-white hover:underline decoration-wavy">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white hover:underline decoration-wavy">Terms of Use</a></li>
                <li><a href="#" className="hover:text-white hover:underline decoration-wavy">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto pt-8 border-t-2 border-dashed border-gray-600 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-lg text-gray-400">© 2026 IIIT Una. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-[#D12828] transition-colors"><Mail className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-[#D12828] transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
