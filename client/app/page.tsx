"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, Zap, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-foreground">
              ResidentIQ
            </span>
          </div>
          <Link href="/login" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Hostel Room Allocation
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              A transparent, first-come first-served seat allocation system for
              IIIT Una. Efficient, fair, and built for students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="btn-primary text-base px-8 py-3">
                Launch Portal
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-primary" />}
              title="Instant Booking"
              description="Real-time seat counts and millisecond accuracy ensure a fair FCFS process."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-primary" />}
              title="Safe & Secure"
              description="ACID-compliant transactions and Redis locking prevent double bookings."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-primary" />}
              title="Admin Control"
              description="Wardens get full visibility with live dashboards and manual overrides."
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-muted-foreground text-sm">
            © 2026 IIIT Una. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} className="card card-hover p-6">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
