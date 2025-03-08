"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LocationSite } from "@/core/domain/entities/LocationSite"
import { useState, useEffect } from "react"
import { createLocation, deleteLocation, getLocations } from "./actions"
import { Plus, Save, Trash2 } from "lucide-react"

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationSite[]>([])
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
  })

  useEffect(() => {
    const fetchLocations = async () => {
      const locations = await getLocations()
      setLocations(JSON.parse(locations))
    }
    fetchLocations()
  }, [])

  const handleSave = async () => {
    setIsAddingLocation(false)
    const location = await createLocation(newLocation)
    console.log("gottent location", location)
    setLocations([...locations, JSON.parse(location)])
    setNewLocation({ name: "", address: "" })
  }

  const handleDelete = async (locationId: string) => {
    await deleteLocation(locationId)
    setLocations(locations.filter((location) => location.id !== locationId))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Locations</h1>
      <div className="relative pb-16">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.address}</TableCell>
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
            {isAddingLocation && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newLocation.name}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, name: e.target.value })
                    }
                    placeholder="Location Name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newLocation.address}
                    onChange={(e) =>
                      setNewLocation({
                        ...newLocation,
                        address: e.target.value,
                      })
                    }
                    placeholder="Address"
                  />
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          {isAddingLocation ? (
            <Button className="px-6" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          ) : (
            <Button className="px-6" onClick={() => setIsAddingLocation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
