"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Package,
  Settings,
  Truck,
  Menu,
  ShoppingCart,
  DollarSign,
  ClipboardList,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  {
    title: "Dashboard",
    href: "/web/dashboard",
    icon: BarChart3,
  },
  {
    title: "Machines",
    href: "/web/machines",
    icon: Truck,
  },
  {
    title: "Products",
    href: "/web/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/web/orders",
    icon: ShoppingCart,
  },
  {
    title: "Sales",
    href: "/web/sales",
    icon: DollarSign,
  },
  {
    title: "Pre-kits",
    href: "/web/prekits",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    href: "/web/settings",
    icon: Settings,
  },
]

export function MainNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <div className="mr-4 md:flex">
      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <div className="px-7">
            <Link
              href="/"
              className="flex items-center space-x-2 font-bold text-xl"
              onClick={() => setOpen(false)}
            >
              <span>VendorPro</span>
            </Link>
          </div>
          <nav className="flex flex-col gap-4 mt-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-7 py-2 text-base font-medium transition-colors hover:bg-accent",
                  pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`)
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href || pathname?.startsWith(`${item.href}/`)
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
