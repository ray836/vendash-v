import Link from "next/link"
import { Bell } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { MainNav } from "./main-nav"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link
          href="/"
          className="flex items-center space-x-2 font-bold text-xl mr-6"
        >
          <img
            src="/vendashLogo.png"
            alt="VendorPro Logo"
            className="h-7 w-7 object-contain mr-1"
          />
          <span>VendorPro</span>
        </Link>
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
            <span className="sr-only">Notifications</span>
          </Button>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  )
}
