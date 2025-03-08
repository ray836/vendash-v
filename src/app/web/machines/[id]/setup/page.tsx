"use client"

import { VendingMachineSetup } from "./vending-machine-setup"

interface PageProps {
  params: {
    id: string
  }
}

export default function SetupPage({ params }: PageProps) {
  return (
    <main className="container mx-auto py-6">
      <VendingMachineSetup id={params.id} />
    </main>
  )
}
