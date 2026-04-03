"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Receipt, Upload, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createWorker } from "tesseract.js"
import { createPurchaseOrder } from "./purchase-order-actions"
import { findProductsBySkus } from "./purchase-order-actions"
import { useSession } from "@/lib/use-session"

interface ParsedItem {
  vendorSku: string
  quantity: number
  productName?: string
  totalPrice?: number
  matched: boolean
  matchedProduct?: {
    id: string
    name: string
    image: string
  }
}

interface UploadReceiptDialogProps {
  onSuccess?: () => void
}

export function UploadReceiptDialog({ onSuccess }: UploadReceiptDialogProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [receiptImage, setReceiptImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [ocrProgress, setOcrProgress] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setParsedItems([]) // Reset parsed items when new file selected
    }
  }

  const parseReceiptText = async (text: string): Promise<ParsedItem[]> => {
    console.log("Raw OCR text:", text)

    const items: ParsedItem[] = []
    const lines = text.split('\n')

    // Sam's Club receipt format:
    // Item number is typically 10 digits (sometimes with leading 0)
    // Format: ITEM_NUMBER    PRODUCT_NAME    PRICE Y
    // Example: 0990323993    BLT MXD PUF    19.94 Y

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Look for lines that start with a 10-digit item number
      const itemMatch = line.match(/^0?(\d{9,10})\s+(.+?)\s+(\d+\.?\d*)\s*[YN]?$/i)

      if (itemMatch) {
        const vendorSku = itemMatch[1] // Remove leading 0 if present
        const productName = itemMatch[2].trim()
        const price = parseFloat(itemMatch[3])

        // For now, assume quantity is 1 (would need to be enhanced to detect multi-quantity)
        items.push({
          vendorSku,
          quantity: 1,
          productName,
          totalPrice: price,
          matched: false,
        })
      }
    }

    console.log("Parsed items:", items)
    return items
  }

  const handleProcessReceipt = async () => {
    if (!receiptImage) {
      toast({
        title: "No image selected",
        description: "Please select a receipt image first",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setOcrProgress("Initializing OCR...")

    try {
      // Run OCR on the image
      const worker = await createWorker('eng')

      setOcrProgress("Processing receipt image...")
      const { data } = await worker.recognize(receiptImage)
      await worker.terminate()

      setOcrProgress("Parsing receipt items...")

      // Parse the OCR text to extract items
      const items = await parseReceiptText(data.text)

      if (items.length === 0) {
        toast({
          title: "No items found",
          description: "Could not detect any items on the receipt. Please try a clearer image.",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      setOcrProgress("Matching products in catalog...")

      // Match items to products in catalog
      const skus = items.map(item => item.vendorSku)
      const result = await findProductsBySkus(skus)

      if (result.success && result.data) {
        const matchedItems = items.map(item => {
          const matched = result.data.find(p => p.vendorSku === item.vendorSku)
          return {
            ...item,
            matched: !!matched,
            matchedProduct: matched ? {
              id: matched.id,
              name: matched.name,
              image: matched.image,
            } : undefined,
          }
        })

        setParsedItems(matchedItems)
        setOcrProgress("")

        const matchedCount = matchedItems.filter(i => i.matched).length
        toast({
          title: "Receipt processed!",
          description: `Found ${items.length} items, matched ${matchedCount} to catalog.`,
        })
      }
    } catch (error) {
      console.error("Error processing receipt:", error)
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process receipt",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreatePurchaseOrder = async () => {
    if (parsedItems.length === 0) {
      return
    }

    setIsProcessing(true)

    try {
      const result = await createPurchaseOrder({
        organizationId: session?.user?.organizationId ?? '',
        parsedItems: parsedItems.map(item => ({
          vendorSku: item.vendorSku,
          quantity: item.quantity,
          productName: item.productName,
          totalPrice: item.totalPrice,
        })),
        totalAmount: parsedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
        userId: session?.user?.id ?? '',
      })

      if (result.success) {
        toast({
          title: "Purchase order created!",
          description: `Created order with ${result.data?.itemsCreated} items (${result.data?.itemsMatched} matched to catalog)`,
        })

        // Reset form
        setIsOpen(false)
        setReceiptImage(null)
        setPreviewUrl(null)
        setParsedItems([])
        setOcrProgress("")

        onSuccess?.()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error creating purchase order:", error)
      toast({
        title: "Failed to create purchase order",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Receipt className="h-4 w-4 mr-2" />
          Record Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Receipt</DialogTitle>
          <DialogDescription>
            Upload a Sam's Club receipt to automatically create a purchase order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt Image</Label>
            <div className="flex gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
              {receiptImage && !parsedItems.length && (
                <Button
                  onClick={handleProcessReceipt}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Process
                    </>
                  )}
                </Button>
              )}
            </div>
            {ocrProgress && (
              <p className="text-sm text-muted-foreground">{ocrProgress}</p>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="border rounded-md p-4">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="max-h-64 mx-auto"
              />
            </div>
          )}

          {/* Parsed Items Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <Label>Detected Items ({parsedItems.length})</Label>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Item #</th>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-mono text-xs">{item.vendorSku}</td>
                        <td className="p-2">
                          {item.matched && item.matchedProduct ? (
                            <div className="flex items-center gap-2">
                              {item.matchedProduct.image && (
                                <img
                                  src={item.matchedProduct.image}
                                  alt={item.matchedProduct.name}
                                  className="h-8 w-8 object-cover rounded"
                                />
                              )}
                              <span className="text-xs">{item.matchedProduct.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {item.productName || "Unknown"}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">
                          ${item.totalPrice?.toFixed(2) || "0.00"}
                        </td>
                        <td className="p-2 text-center">
                          {item.matched ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-amber-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {parsedItems.filter(i => !i.matched).length > 0 && (
                  <span className="text-amber-600">
                    ⚠ {parsedItems.filter(i => !i.matched).length} item(s) not found in catalog.
                    They will be recorded but not linked to products.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {parsedItems.length > 0 && (
              <Button
                onClick={handleCreatePurchaseOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Purchase Order"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
