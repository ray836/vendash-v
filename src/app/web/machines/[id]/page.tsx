import MachineDetails from "./machine-details"

interface PageProps {
  params: {
    id: string
  }
}

export default async function MachinePage({ params }: PageProps) {
  const { id } = params

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
