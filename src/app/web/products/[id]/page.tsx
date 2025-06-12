import { ProductDetail } from "./product-details"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const id = params.id

  return (
    <main className="container mx-auto py-6">
      <ProductDetail productId={id} />
    </main>
  )
}
