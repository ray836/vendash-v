import MachineDetails from "./machine-details"

export default async function MachinePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
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
