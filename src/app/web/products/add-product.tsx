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
  DialogDescription,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Link2, Loader2 } from "lucide-react"
import { createProduct } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/lib/use-session"

const CATEGORIES = ["cookies", "chips", "drink", "candy", "snack"] as const
type Category = (typeof CATEGORIES)[number]

interface ProductFormData {
  name: string
  recommendedPrice: number
  category: Category
  image: string
  vendorLink: string
  vendorSku: string
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
  vendorSku: "",
  caseCost: 0,
  caseSize: 0,
  shippingAvailable: true,
}

interface AddProductDialogProps {
  onSuccess?: () => void
}

export function AddProductDialog({ onSuccess }: AddProductDialogProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState("")
  const { toast } = useToast()

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate URL format
    if (!scrapeUrl.includes('samsclub.com') && !scrapeUrl.includes('costco.com')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Sam's Club or Costco product URL",
        variant: "destructive",
      })
      return
    }

    setIsScraping(true)

    try {
      // Create an AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: scrapeUrl,
          organizationId: session?.user?.organizationId ?? '',
          category: 'snack',
          recommendedPriceMultiplier: 1.5,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape product')
      }

      setIsOpen(false)
      setScrapeUrl("")

      toast({
        title: "Product added!",
        description: `${data.product.name} has been added successfully.`,
      })

      // Call the onSuccess callback if provided
      onSuccess?.()
    } catch (error) {
      console.error("Failed to scrape product:", error)

      // Check if it was a timeout/abort
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The scraping request took too long. This can happen with Costco due to bot protection. Please try again or add the product manually.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to scrape product. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsScraping(false)
    }
  }

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Scrape from Sam's Club or Costco, or add manually
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="scrape" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scrape">
              <Link2 className="h-4 w-4 mr-2" />
              Scrape URL
            </TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="scrape" className="space-y-4 mt-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-1">
                ℹ️ Browser-Based Scraping
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Scraping now uses a real browser to bypass bot detection. This may take 5-10 seconds.
                Success rate: ~90%. If it fails, use Manual Entry.
              </p>
            </div>
            <form onSubmit={handleScrape} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scrapeUrl">Sam's Club or Costco Product URL</Label>
                <Input
                  id="scrapeUrl"
                  type="url"
                  placeholder="https://www.samsclub.com/ip/... or https://www.costco.com/..."
                  required
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  disabled={isScraping}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a product URL to automatically extract details
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isScraping}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isScraping}>
                  {isScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    'Add Product'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="vendorSku">Item Number (Optional)</Label>
            <Input
              id="vendorSku"
              placeholder="e.g., 990323993"
              value={formData.vendorSku}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vendorSku: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Sam's Club/Costco item number for receipt matching
            </p>
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
