import { VendingMachineSetup } from "./vending-machine-setup"
import { getOrgProducts, getMachineWithSlots } from "./actions"
import { Suspense } from "react"

export default async function MachineSetupPage({
  params,
}: {
  params: { id: string }
}) {
  const orgProducts = await getOrgProducts()
  const machineData = await getMachineWithSlots(params.id)

  return (
    <main className="container mx-auto py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <VendingMachineSetup
          machineId={params.id}
          products={orgProducts}
          initialSlots={machineData.slots}
          machineType={machineData.type}
        />
      </Suspense>
    </main>
  )
}
