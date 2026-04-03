"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Location } from "@/domains/Location/entities/Location"
import { useState, useEffect } from "react"
import { createLocation, deleteLocation, getLocations } from "./actions"
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react"

interface LocationForm {
  name: string
  address: string
  showOnMap: boolean
  latitude: number | null
  longitude: number | null
  geocodeStatus: "idle" | "loading" | "success" | "error"
  geocodeError: string | null
}

const emptyForm = (): LocationForm => ({
  name: "",
  address: "",
  showOnMap: false,
  latitude: null,
  longitude: null,
  geocodeStatus: "idle",
  geocodeError: null,
})

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<LocationForm>(emptyForm())

  useEffect(() => {
    getLocations().then((data) => setLocations(JSON.parse(data)))
  }, [])

  const handleGeocode = async () => {
    if (!form.address.trim()) return
    setForm((f) => ({ ...f, geocodeStatus: "loading", geocodeError: null }))
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      if (data.length === 0) {
        setForm((f) => ({ ...f, geocodeStatus: "error", geocodeError: "Address not found. Try a more specific address." }))
      } else {
        setForm((f) => ({
          ...f,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          geocodeStatus: "success",
          geocodeError: null,
        }))
      }
    } catch {
      setForm((f) => ({ ...f, geocodeStatus: "error", geocodeError: "Geocoding failed. Check your connection." }))
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) return
    setIsSaving(true)
    try {
      const result = await createLocation({
        name: form.name,
        address: form.address,
        latitude: form.showOnMap && form.latitude !== null ? form.latitude : undefined,
        longitude: form.showOnMap && form.longitude !== null ? form.longitude : undefined,
      })
      setLocations((prev) => [...prev, JSON.parse(result)])
      setDialogOpen(false)
      setForm(emptyForm())
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    await deleteLocation(locationId)
    setLocations((prev) => prev.filter((l) => l.id !== locationId))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Button onClick={() => { setForm(emptyForm()); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="w-[80px] text-center">Map</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell>{location.name}</TableCell>
              <TableCell>{location.address}</TableCell>
              <TableCell className="text-center">
                {location.latitude && location.longitude ? (
                  <MapPin className="h-4 w-4 text-primary mx-auto" />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(location.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Break Room - Floor 3"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="e.g., 123 Main St, San Francisco, CA"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value, geocodeStatus: "idle", latitude: null, longitude: null }))}
              />
            </div>

            {/* Optional map location */}
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show on map</p>
                  <p className="text-xs text-muted-foreground">Optional — skip if this is a private address</p>
                </div>
                <Switch
                  checked={form.showOnMap}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, showOnMap: v, geocodeStatus: "idle", latitude: null, longitude: null, geocodeError: null }))}
                />
              </div>

              {form.showOnMap && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!form.address.trim() || form.geocodeStatus === "loading"}
                    onClick={handleGeocode}
                  >
                    {form.geocodeStatus === "loading" ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Locating...</>
                    ) : (
                      <><MapPin className="h-3.5 w-3.5 mr-2" />Geocode Address</>
                    )}
                  </Button>

                  {form.geocodeStatus === "success" && form.latitude !== null && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Located: {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
                    </p>
                  )}
                  {form.geocodeStatus === "error" && (
                    <p className="text-xs text-destructive">{form.geocodeError}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Latitude (optional)</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="37.7749"
                        className="h-7 text-xs"
                        value={form.latitude ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value ? parseFloat(e.target.value) : null, geocodeStatus: "success" }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Longitude (optional)</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="-122.4194"
                        className="h-7 text-xs"
                        value={form.longitude ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value ? parseFloat(e.target.value) : null, geocodeStatus: "success" }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.name.trim() || !form.address.trim() || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
