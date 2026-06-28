"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { BookOpen, Check, Loader2, Search } from "lucide-react"
import { getStandardCatalog, pickStandardProducts } from "./actions"
import type { StandardCatalogEntryDTO } from "@/domains/Product/DTOs/standardProductDTOs"
import { toast } from "@/hooks/use-toast"

interface CatalogPickerProps {
  onSuccess?: () => void
  triggerLabel?: string
}

const ALL_CATEGORIES = "all"

export function CatalogPicker({ onSuccess, triggerLabel = "Browse catalog" }: CatalogPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [catalog, setCatalog] = useState<StandardCatalogEntryDTO[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>(ALL_CATEGORIES)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    getStandardCatalog()
      .then(setCatalog)
      .catch((error) => {
        console.error("getStandardCatalog:", error)
        toast({ variant: "destructive", title: "Error", description: "Couldn't load the catalog." })
      })
      .finally(() => setIsLoading(false))
  }, [isOpen])

  const categories = useMemo(() => {
    const set = new Set(catalog.map((c) => c.category))
    return [ALL_CATEGORIES, ...Array.from(set).sort()]
  }, [catalog])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return catalog.filter((c) => {
      if (category !== ALL_CATEGORIES && c.category !== category) return false
      if (q && !c.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [catalog, search, category])

  const toggle = (entry: StandardCatalogEntryDTO) => {
    if (entry.alreadyAdded) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(entry.id)) next.delete(entry.id)
      else next.add(entry.id)
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0) return
    setIsSaving(true)
    try {
      const { added } = await pickStandardProducts(Array.from(selected))
      toast({
        title: "Products added",
        description: `${added} product${added === 1 ? "" : "s"} added to your catalog.`,
      })
      setSelected(new Set())
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("pickStandardProducts:", error)
      toast({ variant: "destructive", title: "Error", description: "Couldn't add the selected products." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BookOpen className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Add products from the catalog</DialogTitle>
          <DialogDescription>
            Pick the snacks and drinks this machine sells. Can&apos;t find one? Add your own instead.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={category === cat ? "default" : "outline"}
                onClick={() => setCategory(cat)}
                className="capitalize"
              >
                {cat === ALL_CATEGORIES ? "All" : cat}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[360px] -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-20">
              No products match your search.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visible.map((entry) => {
                const isSelected = selected.has(entry.id)
                return (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={entry.alreadyAdded}
                    onClick={() => toggle(entry)}
                    aria-pressed={isSelected}
                    className={`relative text-left rounded-lg border p-2.5 transition-colors ${
                      entry.alreadyAdded
                        ? "opacity-60 cursor-not-allowed bg-muted/40"
                        : isSelected
                          ? "border-primary ring-1 ring-primary bg-primary/5"
                          : "hover:border-foreground/30"
                    }`}
                  >
                    {(entry.alreadyAdded || isSelected) && (
                      <span
                        className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full ${
                          entry.alreadyAdded ? "bg-muted-foreground/70" : "bg-primary"
                        } text-primary-foreground`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <div className="aspect-square w-full mb-2 rounded-md overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.image || "/placeholder.svg"}
                        alt={entry.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium leading-tight line-clamp-2">{entry.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">${entry.recommendedPrice.toFixed(2)}</span>
                      {entry.alreadyAdded && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Added
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="items-center sm:justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : "Select products to add"}
          </span>
          <Button onClick={handleAdd} disabled={selected.size === 0 || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Add selected{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
