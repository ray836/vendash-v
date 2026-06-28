import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  BarChart3,
  ShoppingCart,
  Zap,
  Bell,
  TrendingUp,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EarningsCalculator } from "./earnings-calculator"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const session = await auth()
  if (session) redirect("/web/dashboard")

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-semibold text-lg">
          <Image src="/vendashLogo.png" alt="VendorPro Logo" width={28} height={28} />
          VendorPro
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">Get started free</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 py-28 text-center border-b border-border/30">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground">
              Extra revenue for your business — on autopilot
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
              Your vending machine
              <br />
              should run itself
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              VendorPro manages your vending machine for you — tracking sales, alerting you when to restock, and building your reorder list in one click so you never have to think about it.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Earnings calculator */}
        <section className="px-6 py-20 border-b border-border/30">
          <EarningsCalculator />
        </section>

        {/* Who it's for */}
        <section className="px-6 py-20 border-b border-border/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Perfect for any business with a vending machine</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                You don't need to be a vending expert. If you have a machine on your property, VendorPro handles the rest.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { emoji: "🏨", label: "Hotels & Motels" },
                { emoji: "👗", label: "Laundromats" },
                { emoji: "💈", label: "Barbershops" },
                { emoji: "🏋️", label: "Gyms & Fitness" },
                { emoji: "🏥", label: "Clinics & Hospitals" },
                { emoji: "🏢", label: "Office Buildings" },
              ].map(({ emoji, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-4 py-5 text-center"
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-xs font-medium text-muted-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Anywhere customers wait, shop, or spend time — a well-stocked vending machine is pure profit.
            </p>
          </div>
        </section>

        {/* Value props */}
        <section className="px-6 py-20 border-b border-border/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Maximize revenue with almost zero effort</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Most business owners lose money on their vending machine because they don't have time to manage it. VendorPro fixes that.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: Zap,
                  title: "Automatic reorder suggestions",
                  desc: "VendorPro watches your inventory levels and tells you exactly what to order before you run out — no guessing, no emergency runs.",
                },
                {
                  icon: BarChart3,
                  title: "Know what's actually selling",
                  desc: "See which products make you the most money and which ones just take up space. Swap slow sellers for top performers.",
                },
                {
                  icon: Bell,
                  title: "Low-stock alerts",
                  desc: "Get notified the moment a product is running low so your machine is always stocked and customers never walk away empty-handed.",
                },
                {
                  icon: ShoppingCart,
                  title: "One-click ordering",
                  desc: "Build your Sam's Club or Costco order in one click based on real sales data. Stop over-buying products that don't move.",
                },
                {
                  icon: TrendingUp,
                  title: "Track your profit",
                  desc: "See exactly how much your machine earns after product costs — daily, weekly, and monthly. Know if it's worth it.",
                },
                {
                  icon: CheckCircle2,
                  title: "Simple restock workflow",
                  desc: "VendorPro generates a step-by-step restock list so whoever refills the machine always knows exactly what goes where.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-border/50 bg-muted/20 p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-20 border-b border-border/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Set it up once. Let it run.</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                You didn't get into the hotel business to manage a snack machine. VendorPro takes it off your plate.
              </p>
            </div>
            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Add your machine and products",
                  desc: "Enter what's in your machine, set the slot layout, and connect your sales data. Takes about 10 minutes.",
                },
                {
                  step: "02",
                  title: "VendorPro tracks everything automatically",
                  desc: "Sales, inventory levels, and profit are tracked in real time. You always know exactly what's happening — without checking the machine.",
                },
                {
                  step: "03",
                  title: "Get told what to order and when",
                  desc: "When stock gets low, VendorPro surfaces exactly what to reorder and builds your shopping list for Sam's Club or Costco.",
                },
                {
                  step: "04",
                  title: "Restock fast with a step-by-step list",
                  desc: "A simple pick list tells whoever restocks the machine exactly what goes in each slot — no training needed, no wasted trips.",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {step}
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="px-6 py-20 border-b border-border/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-3">Everything included, free to start</h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">No hidden fees. No complicated setup. Just a smarter way to run your machine.</p>
            <div className="grid sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
              {[
                "Real-time sales & profit tracking",
                "Automatic reorder suggestions",
                "Low-stock alerts",
                "One-click order building (Sam's Club & Costco)",
                "Step-by-step restock lists",
                "Best-seller product insights",
                "Multi-machine support",
                "Team access for staff",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 text-center">
          <div className="max-w-xl mx-auto space-y-5">
            <h2 className="text-4xl font-bold">Start earning more from your vending machine today</h2>
            <p className="text-muted-foreground text-lg">
              Free to start. No credit card required.
            </p>
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VendorPro. All rights reserved.
      </footer>
    </div>
  )
}
