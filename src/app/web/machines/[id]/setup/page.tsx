import { VendingMachineSetup } from "./vending-machine-setup"
import {
  getOrgProducts,
  getMachineWithSlots,
  getLocationsServer,
} from "./actions"
import { Suspense } from "react"

interface MachineSetupPageProps {
  params: {
    id: string
  }
}

export default async function MachineSetupPage({
  params,
}: MachineSetupPageProps) {
  const orgProducts = await getOrgProducts()
  const machineData = await getMachineWithSlots(params.id)
  const locations = await getLocationsServer()

  return (
    <main className="container mx-auto py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <VendingMachineSetup
          machineId={params.id}
          products={orgProducts}
          initialSlots={machineData.slots}
          machineType={machineData.type}
          locations={locations}
        />
      </Suspense>
    </main>
  )
}
