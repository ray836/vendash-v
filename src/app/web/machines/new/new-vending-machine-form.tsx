"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createMachine } from "../actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
import { MachineType } from "@/domains/VendingMachine/entities/VendingMachine"

const formSchema = z.object({
  machineId: z.string().min(2, {
    message: "Machine ID must be at least 2 characters.",
  }),
  model: z.string().min(2, {
    message: "Machine model is required.",
  }),
  locationName: z.string().min(2, {
    message: "Please describe where this machine is located.",
  }),
  type: z.string({
    required_error: "Please select a machine type.",
  }),
  status: z.string({
    required_error: "Please select an initial status.",
  }),
  cardReaderId: z.string().optional(),
  notes: z.string().optional(),
})

export function NewVendingMachineForm() {
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineId: "",
      model: "",
      locationName: "",
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await createMachine({
        type: values.type as MachineType,
        locationName: values.locationName,
        model: values.model,
        notes: values.notes || "",
        cardReaderId: values.cardReaderId || undefined,
      })
      const machine = JSON.parse(result)

      toast({
        title: "Success",
        description: "Vending machine created successfully",
      })

      router.push(`/web/machines/${machine.id}/setup`)
    } catch (error) {
      console.error("Failed to create machine:", error)
      toast({
        title: "Error",
        description: "Failed to create vending machine",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/web/machines"
        className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to My Machines
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
                      <FormControl>
                        <Input placeholder="e.g. VX2000" {...field} />
                      </FormControl>
                      <FormDescription>
                        The model number or name of the machine
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardReaderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ePort Card Reader ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. VK1001863385" {...field} />
                      </FormControl>
                      <FormDescription>
                        The serial number from your Cantaloupe ePort device. You can add this later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SNACK">Snack Machine</SelectItem>
                          <SelectItem value="DRINK">Drink Machine</SelectItem>
                          <SelectItem value="COMBO">Combo Machine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="locationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Where is this machine?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Break Room, Lobby, Main Entrance"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A simple description of where the machine is located
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push('/web/machines')}>Cancel</Button>
                <Button type="submit">Create Machine</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
