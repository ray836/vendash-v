import { VendingMachineSetup } from "./vending-machine-setup"
import { getOrgProducts, getMachineWithSlots } from "./actions"
import { Suspense } from "react"

export default async function MachineSetupPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const orgProducts = await getOrgProducts()
  const machineData = await getMachineWithSlots(id)

  return (
    <main className="container mx-auto py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <VendingMachineSetup
          machineId={id}
          products={orgProducts}
          initialSlots={machineData.slots}
          machineType={machineData.machine.type}
        />
      </Suspense>
    </main>
  )
}
