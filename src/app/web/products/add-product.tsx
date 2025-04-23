"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { PlusCircle } from "lucide-react"
import { createProduct } from "./actions"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = ["cookies", "chips", "drink", "candy", "snack"] as const
type Category = (typeof CATEGORIES)[number]

interface ProductFormData {
  name: string
  recommendedPrice: number
  category: Category
  image: string
  vendorLink: string
  caseCost: number
  caseSize: number
  shippingAvailable: boolean
}

const initialFormData: ProductFormData = {
  name: "",
  recommendedPrice: 0,
  category: "snack",
  image: "",
  vendorLink: "",
  caseCost: 0,
  caseSize: 0,
  shippingAvailable: true,
}

interface AddProductDialogProps {
  onSuccess?: () => void
}

export function AddProductDialog({ onSuccess }: AddProductDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createProduct(formData)

      setIsOpen(false)
      setFormData(initialFormData)

      toast({
        title: "Product created",
        description: "The product has been successfully created.",
      })

      // Call the onSuccess callback if provided
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create product:", error)
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendedPrice">Recommended Price ($)</Label>
            <Input
              id="recommendedPrice"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.recommendedPrice}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  recommendedPrice: parseFloat(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: Category) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, image: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorLink">Vendor Link</Label>
            <Input
              id="vendorLink"
              type="url"
              value={formData.vendorLink}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vendorLink: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseCost">Case Cost ($)</Label>
            <Input
              id="caseCost"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.caseCost}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  caseCost: parseFloat(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseSize">Case Size</Label>
            <Input
              id="caseSize"
              type="number"
              min="1"
              required
              value={formData.caseSize}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  caseSize: parseInt(e.target.value),
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="shippingAvailable">Shipping Available</Label>
            <Switch
              id="shippingAvailable"
              checked={formData.shippingAvailable}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  shippingAvailable: checked,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
