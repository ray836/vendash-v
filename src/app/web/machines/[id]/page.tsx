import MachineDetails from "./machine-details"

export default async function MachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams

  return (
    <>
      <div className="border-b">
        <div className="container mx-auto py-4">
          <MachineDetails id={id} defaultTab={tab ?? "overview"} />
        </div>
      </div>
      <div className="container mx-auto py-6">{/* Content below header */}</div>
    </>
  )
}
