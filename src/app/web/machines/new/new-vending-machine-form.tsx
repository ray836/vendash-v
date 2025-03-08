"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Sample initial locations - in a real app, this would come from your backend
const initialLocations: Location[] = [
  {
    id: "1",
    name: "Main Building - Floor 1",
    address: "Main Building, Floor 1",
  },
  {
    id: "2",
    name: "Science Block - Floor 2",
    address: "Science Block, Floor 2",
  },
  {
    id: "3",
    name: "Library - Floor 1",
    address: "Library, Floor 1",
  },
]

const formSchema = z.object({
  machineId: z.string().min(2, {
    message: "Machine ID must be at least 2 characters.",
  }),
  locationId: z.string({
    required_error: "Please select a location.",
  }),
  specificLocation: z.string().min(2, {
    message: "Specific location description is required.",
  }),
  model: z.string({
    required_error: "Please select a machine model.",
  }),
  status: z.string({
    required_error: "Please select an initial status.",
  }),
  notes: z.string().optional(),
})

const locationFormSchema = z.object({
  building: z.string().min(2, "Building name is required"),
  floor: z.string().min(1, "Floor number is required"),
})

// Update the Location interface to match the actual data structure
interface Location {
  id: string
  name: string
  address: string
}

function AddLocationDialog({
  onLocationAdded,
}: {
  onLocationAdded: (location: Location) => void
}) {
  const [open, setOpen] = useState(false)
  const locationForm = useForm<z.infer<typeof locationFormSchema>>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      building: "",
      floor: "",
    },
  })

  const onSubmit = (values: z.infer<typeof locationFormSchema>) => {
    const newLocation: Location = {
      id: Date.now().toString(),
      name: `${values.building} - Floor ${values.floor}`,
      address: `${values.building}, Floor ${values.floor}`,
    }
    onLocationAdded(newLocation)
    locationForm.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
        </DialogHeader>
        <Form {...locationForm}>
          <form
            onSubmit={locationForm.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={locationForm.control}
              name="building"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter building name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={locationForm.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter floor number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Add Location</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function NewVendingMachineForm() {
  const [locations, setLocations] = useState(initialLocations)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineId: "",
      locationId: "",
      specificLocation: "",
      notes: "",
    },
  })

  const handleLocationAdded = (newLocation: Location) => {
    setLocations([...locations, newLocation])
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, you would send this data to your backend
    console.log(values)
    alert("Vending machine created successfully!")
    form.reset()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/web/dashboard"
        className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Machine Details</CardTitle>
          <CardDescription>
            Enter the details for the new vending machine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine ID</FormLabel>
                      <FormControl>
                        <Input placeholder="VM-" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the machine
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Model</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">
                            Standard Vending
                          </SelectItem>
                          <SelectItem value="snack">Snack Machine</SelectItem>
                          <SelectItem value="drink">Drink Machine</SelectItem>
                          <SelectItem value="combo">Combo Machine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <AddLocationDialog
                          onLocationAdded={handleLocationAdded}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specificLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Near elevator, Main hallway"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed location description to help locate the machine
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="maintenance">
                          Maintenance Required
                        </SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information about the machine..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit">Create Machine</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
