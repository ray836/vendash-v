import MachineDetails from "./machine-details"

interface PageProps {
  params: Promise<{ id: string }> & { id: string }
}

export default async function MachinePage({ params }: PageProps) {
  // For Next.js dynamic routes, we need to await the params
  const { id } = await params

  return (
    <>
      <div className="border-b">
        <div className="container mx-auto py-4">
          <MachineDetails id={id} />
        </div>
      </div>
      <div className="container mx-auto py-6">{/* Content below header */}</div>
    </>
  )
}
