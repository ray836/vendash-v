import type { Metadata } from "next"
import "./globals.css"
import type React from "react"
import { Inter } from "next/font/google"
import { Header } from "@/app/web/components/header"
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
    <html lang="en">
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  )
}
