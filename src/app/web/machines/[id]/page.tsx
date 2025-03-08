import MachineDetails from "./machine-details"

interface PageProps {
  params: Promise<{
    id: string
  }> & {
    id: string
  }
}

export default async function MachinePage({ params }: PageProps) {
  // For Next.js dynamic routes, we need both the Promise and direct access
  const id = params.id

  return (
    <main className="container mx-auto py-6">
      <MachineDetails id={id} />
    </main>
  )
}
