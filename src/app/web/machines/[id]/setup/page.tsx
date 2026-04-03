import { VendingMachineSetup } from "./vending-machine-setup"
import {
  getOrgProducts,
  getMachineWithSlots,
  getLocationsServer,
} from "./actions"
import { Suspense } from "react"

interface MachineSetupPageProps {
  params: Promise<{ id: string }>
}

export default async function MachineSetupPage({
  params,
}: MachineSetupPageProps) {
  const { id } = await params
  const orgProducts = await getOrgProducts()
  const machineData = await getMachineWithSlots(id)
  const locations = await getLocationsServer()

  return (
    <main className="container mx-auto py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <VendingMachineSetup
          machineId={id}
          products={orgProducts}
          initialSlots={machineData.slots}
          machineType={machineData.type}
          locations={locations}
        />
      </Suspense>
    </main>
  )
}
