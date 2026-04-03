import { ProductDetail } from "./product-details"

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  return (
    <main className="container mx-auto py-6">
      <ProductDetail productId={id} />
    </main>
  )
}
