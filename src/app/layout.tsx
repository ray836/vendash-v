import type { Metadata } from "next"
import "./globals.css"
import type React from "react"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Header } from "@/app/web/components/header"
import { ThemeProvider } from "./web/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { RoleProvider } from "@/lib/role-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VendorPro - Vending Machine Management",
  description: "Manage your vending machines and inventory efficiently",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
    <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <RoleProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="w-full border-b">
                <div className="container mx-auto">
                  <Header />
                </div>
              </div>
              <div className="flex-1">{children}</div>
            </div>
          </RoleProvider>
          </ThemeProvider>
          <Toaster />
        </body>
    </html>
    </ClerkProvider>
  )
}
