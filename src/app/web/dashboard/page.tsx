import { Dashboard } from "./dashboard"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const { welcome } = await searchParams
  return (
    <main className="container mx-auto py-6">
      <Dashboard isFirstLogin={welcome === "1"} />
    </main>
  )
}
