"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Search, Loader2 } from "lucide-react"
import { getAllProducts, addProductToNextOrder } from "./actions"
import { toast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  image: string
  caseCost: number
  caseSize: number
  category: string
  recommendedPrice: number
}

interface AddProductDialogProps {
  onSuccess?: () => void
}

export function AddProductDialog({ onSuccess }: AddProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadProducts()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(
        products.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredProducts(products)
    }
  }, [searchQuery, products])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const result = await getAllProducts()
      if (result.success) {
        setProducts(result.products)
        setFilteredProducts(result.products)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load products",
        })
      }
    } catch (error) {
      console.error("Failed to load products:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async (productId: string, productName: string) => {
    setIsAdding(productId)
    try {
      const result = await addProductToNextOrder(productId)
      if (result.success) {
        toast({
          title: "Product added",
          description: `${productName} has been added to your order`,
        })
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to add product",
        })
      }
    } catch (error) {
      console.error("Failed to add product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product",
      })
    } finally {
      setIsAdding(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[85vh] p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Add Product to Order</DialogTitle>
            <DialogDescription>
              Select a product from your catalog to add to the next order
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-4">
            <div className="relative pr-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] w-full pr-2">
                <div className="space-y-2 pr-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? "No products found matching your search"
                      : "No products available"}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {product.category}
                        </p>
                        <div className="flex gap-2 mt-0.5 text-xs">
                          <span className="font-medium">
                            ${product.caseCost.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(product.caseSize)} units
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleAddProduct(product.id, product.name)}
                        disabled={isAdding === product.id}
                        className="flex-shrink-0 h-14 w-14 p-0 ml-2 rounded-full"
                      >
                        {isAdding === product.id ? (
                          <Loader2 className="h-11 w-11 animate-spin" />
                        ) : (
                          <PlusCircle className="h-11 w-11" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
