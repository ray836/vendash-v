import { VendingMachineSetup } from "./vending-machine-setup"

interface PageProps {
  params: Promise<{
    id: string
  }> & {
    id: string
  }
}

export default async function SetupPage({ params }: PageProps) {
  const id = params.id

  return (
    <main className="container mx-auto py-6">
      <VendingMachineSetup id={id} />
    </main>
  )
}
