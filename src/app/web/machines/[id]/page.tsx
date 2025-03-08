import MachineDetails from "./machine-details"

interface PageProps {
  params: {
    id: string
  }
}

export default async function MachinePage({ params }: PageProps) {
  const { id } = await params

  return (
    <main className="container mx-auto py-6">
      <MachineDetails id={id} />
    </main>
  )
}
