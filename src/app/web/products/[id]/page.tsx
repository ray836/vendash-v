import { ProductDetail } from "./product-details"

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main className="container mx-auto py-6">
      <ProductDetail productId={params.id} />
    </main>
  )
}
