import { ProductDetail } from "./product-details"

interface PageProps {
  params: Promise<{
    id: string
  }> & {
    id: string
  }
}

export default async function ProductPage({ params }: PageProps) {
  const id = params.id

  return (
    <main className="container mx-auto py-6">
      <ProductDetail productId={id} />
    </main>
  )
}
