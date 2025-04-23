"use client"

import { useState } from "react"
import { Search, Filter, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PreKitsList } from "./prekits-list"
import { PreKitDetailsDialog } from "./prekit-details-dialog"

interface PreKitItem {
  id: string
  preKitId: string
  productId: string
  quantity: number
  slotId: string
  productImage: string
  productName: string
  currentQuantity: number
  capacity: number
  slotCode: string
}

interface PreKit {
  id: string
  machineId: string
  status: "OPEN" | "PICKED" | "STOCKED"
  createdAt: Date
  items: PreKitItem[]
}

export default function PreKitsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPreKit, setSelectedPreKit] = useState<PreKit | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Dummy data for pre-kits
  const preKits: PreKit[] = [
    {
      id: "001",
      machineId: "VM001",
      status: "OPEN",
      createdAt: new Date("2023-06-15T10:30:00"),
      items: [
        {
          id: "1",
          preKitId: "001",
          productId: "p1",
          quantity: 5,
          slotId: "s1",
          productImage:
            "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Coca-Cola",
          currentQuantity: 3,
          capacity: 10,
          slotCode: "A1",
        },
        {
          id: "2",
          preKitId: "001",
          productId: "p2",
          quantity: 5,
          slotId: "s2",
          productImage:
            "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Pepsi",
          currentQuantity: 5,
          capacity: 10,
          slotCode: "A2",
        },
        {
          id: "3",
          preKitId: "001",
          productId: "p3",
          quantity: 5,
          slotId: "s3",
          productImage:
            "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Sprite",
          currentQuantity: 2,
          capacity: 10,
          slotCode: "A3",
        },
        {
          id: "4",
          preKitId: "001",
          productId: "p4",
          quantity: 5,
          slotId: "s4",
          productImage:
            "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Fanta",
          currentQuantity: 7,
          capacity: 10,
          slotCode: "A4",
        },
        {
          id: "5",
          preKitId: "001",
          productId: "p5",
          quantity: 5,
          slotId: "s5",
          productImage:
            "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Dr Pepper",
          currentQuantity: 4,
          capacity: 10,
          slotCode: "A5",
        },
        {
          id: "6",
          preKitId: "001",
          productId: "p6",
          quantity: 5,
          slotId: "s6",
          productImage:
            "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Mountain Dew",
          currentQuantity: 6,
          capacity: 10,
          slotCode: "A6",
        },
        {
          id: "7",
          preKitId: "001",
          productId: "p7",
          quantity: 5,
          slotId: "s7",
          productImage:
            "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Diet Coke",
          currentQuantity: 8,
          capacity: 10,
          slotCode: "A7",
        },
        {
          id: "8",
          preKitId: "001",
          productId: "p8",
          quantity: 5,
          slotId: "s8",
          productImage:
            "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Diet Pepsi",
          currentQuantity: 5,
          capacity: 10,
          slotCode: "A8",
        },
        {
          id: "9",
          preKitId: "001",
          productId: "p9",
          quantity: 5,
          slotId: "s9",
          productImage:
            "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Water",
          currentQuantity: 9,
          capacity: 10,
          slotCode: "B1",
        },
        {
          id: "10",
          preKitId: "001",
          productId: "p10",
          quantity: 5,
          slotId: "s10",
          productImage:
            "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Sparkling Water",
          currentQuantity: 7,
          capacity: 10,
          slotCode: "B2",
        },
      ],
    },
    {
      id: "002",
      machineId: "VM002",
      status: "PICKED",
      createdAt: new Date("2023-06-14T15:45:00"),
      items: [
        {
          id: "11",
          preKitId: "002",
          productId: "p11",
          quantity: 3,
          slotId: "s11",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Snickers",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A1",
        },
        {
          id: "12",
          preKitId: "002",
          productId: "p12",
          quantity: 3,
          slotId: "s12",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Twix",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A2",
        },
        {
          id: "13",
          preKitId: "002",
          productId: "p13",
          quantity: 3,
          slotId: "s13",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "KitKat",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A3",
        },
        {
          id: "14",
          preKitId: "002",
          productId: "p14",
          quantity: 3,
          slotId: "s14",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "M&M's",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A4",
        },
        {
          id: "15",
          preKitId: "002",
          productId: "p15",
          quantity: 3,
          slotId: "s15",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Reese's",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A5",
        },
        {
          id: "16",
          preKitId: "002",
          productId: "p16",
          quantity: 3,
          slotId: "s16",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Milky Way",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A6",
        },
        {
          id: "17",
          preKitId: "002",
          productId: "p17",
          quantity: 3,
          slotId: "s17",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "3 Musketeers",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A7",
        },
        {
          id: "18",
          preKitId: "002",
          productId: "p18",
          quantity: 3,
          slotId: "s18",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Butterfinger",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "A8",
        },
        {
          id: "19",
          preKitId: "002",
          productId: "p19",
          quantity: 3,
          slotId: "s19",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Hershey's",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B1",
        },
        {
          id: "20",
          preKitId: "002",
          productId: "p20",
          quantity: 3,
          slotId: "s20",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Twizzlers",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B2",
        },
        {
          id: "21",
          preKitId: "002",
          productId: "p21",
          quantity: 3,
          slotId: "s21",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Skittles",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B3",
        },
        {
          id: "22",
          preKitId: "002",
          productId: "p22",
          quantity: 3,
          slotId: "s22",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Starburst",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B4",
        },
        {
          id: "23",
          preKitId: "002",
          productId: "p23",
          quantity: 3,
          slotId: "s23",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Milk Duds",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B5",
        },
        {
          id: "24",
          preKitId: "002",
          productId: "p24",
          quantity: 3,
          slotId: "s24",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Rolos",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B6",
        },
        {
          id: "25",
          preKitId: "002",
          productId: "p25",
          quantity: 3,
          slotId: "s25",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Whoppers",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B7",
        },
        {
          id: "26",
          preKitId: "002",
          productId: "p26",
          quantity: 3,
          slotId: "s26",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Junior Mints",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "B8",
        },
        {
          id: "27",
          preKitId: "002",
          productId: "p27",
          quantity: 3,
          slotId: "s27",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "PayDay",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "C1",
        },
        {
          id: "28",
          preKitId: "002",
          productId: "p28",
          quantity: 3,
          slotId: "s28",
          productImage:
            "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "100 Grand",
          currentQuantity: 0,
          capacity: 8,
          slotCode: "C2",
        },
      ],
    },
    {
      id: "003",
      machineId: "VM003",
      status: "STOCKED",
      createdAt: new Date("2023-06-13T09:15:00"),
      items: [
        {
          id: "29",
          preKitId: "003",
          productId: "p29",
          quantity: 4,
          slotId: "s29",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Lay's Classic",
          currentQuantity: 8,
          capacity: 12,
          slotCode: "A1",
        },
        {
          id: "30",
          preKitId: "003",
          productId: "p30",
          quantity: 4,
          slotId: "s30",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Doritos Nacho Cheese",
          currentQuantity: 10,
          capacity: 12,
          slotCode: "A2",
        },
        {
          id: "31",
          preKitId: "003",
          productId: "p31",
          quantity: 4,
          slotId: "s31",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Cheetos",
          currentQuantity: 7,
          capacity: 12,
          slotCode: "A3",
        },
        {
          id: "32",
          preKitId: "003",
          productId: "p32",
          quantity: 4,
          slotId: "s32",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Ruffles",
          currentQuantity: 9,
          capacity: 12,
          slotCode: "A4",
        },
        {
          id: "33",
          preKitId: "003",
          productId: "p33",
          quantity: 4,
          slotId: "s33",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Pringles Original",
          currentQuantity: 6,
          capacity: 12,
          slotCode: "A5",
        },
        {
          id: "34",
          preKitId: "003",
          productId: "p34",
          quantity: 4,
          slotId: "s34",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Fritos",
          currentQuantity: 11,
          capacity: 12,
          slotCode: "A6",
        },
        {
          id: "35",
          preKitId: "003",
          productId: "p35",
          quantity: 4,
          slotId: "s35",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "SunChips",
          currentQuantity: 5,
          capacity: 12,
          slotCode: "A7",
        },
        {
          id: "36",
          preKitId: "003",
          productId: "p36",
          quantity: 4,
          slotId: "s36",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Tostitos",
          currentQuantity: 8,
          capacity: 12,
          slotCode: "A8",
        },
        {
          id: "37",
          preKitId: "003",
          productId: "p37",
          quantity: 4,
          slotId: "s37",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Popcorners",
          currentQuantity: 7,
          capacity: 12,
          slotCode: "B1",
        },
        {
          id: "38",
          preKitId: "003",
          productId: "p38",
          quantity: 4,
          slotId: "s38",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Pirate's Booty",
          currentQuantity: 9,
          capacity: 12,
          slotCode: "B2",
        },
        {
          id: "39",
          preKitId: "003",
          productId: "p39",
          quantity: 4,
          slotId: "s39",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Popcorn",
          currentQuantity: 6,
          capacity: 12,
          slotCode: "B3",
        },
        {
          id: "40",
          preKitId: "003",
          productId: "p40",
          quantity: 4,
          slotId: "s40",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Pretzels",
          currentQuantity: 10,
          capacity: 12,
          slotCode: "B4",
        },
        {
          id: "41",
          preKitId: "003",
          productId: "p41",
          quantity: 4,
          slotId: "s41",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Goldfish",
          currentQuantity: 8,
          capacity: 12,
          slotCode: "B5",
        },
        {
          id: "42",
          preKitId: "003",
          productId: "p42",
          quantity: 4,
          slotId: "s42",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Cheez-Its",
          currentQuantity: 7,
          capacity: 12,
          slotCode: "B6",
        },
        {
          id: "43",
          preKitId: "003",
          productId: "p43",
          quantity: 4,
          slotId: "s43",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Wheat Thins",
          currentQuantity: 9,
          capacity: 12,
          slotCode: "B7",
        },
        {
          id: "44",
          preKitId: "003",
          productId: "p44",
          quantity: 4,
          slotId: "s44",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Triscuits",
          currentQuantity: 6,
          capacity: 12,
          slotCode: "B8",
        },
        {
          id: "45",
          preKitId: "003",
          productId: "p45",
          quantity: 4,
          slotId: "s45",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Ritz",
          currentQuantity: 10,
          capacity: 12,
          slotCode: "C1",
        },
        {
          id: "46",
          preKitId: "003",
          productId: "p46",
          quantity: 4,
          slotId: "s46",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Saltines",
          currentQuantity: 8,
          capacity: 12,
          slotCode: "C2",
        },
        {
          id: "47",
          preKitId: "003",
          productId: "p47",
          quantity: 4,
          slotId: "s47",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Graham Crackers",
          currentQuantity: 7,
          capacity: 12,
          slotCode: "C3",
        },
        {
          id: "48",
          preKitId: "003",
          productId: "p48",
          quantity: 4,
          slotId: "s48",
          productImage:
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          productName: "Animal Crackers",
          currentQuantity: 9,
          capacity: 12,
          slotCode: "C4",
        },
      ],
    },
  ]

  const filteredPreKits = preKits.filter(
    (preKit) =>
      preKit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preKit.machineId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePreKitClick = (preKit: PreKit) => {
    setSelectedPreKit(preKit)
    setIsDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pre-kits</h1>
            <p className="text-muted-foreground">
              Manage and view all pre-kits for your vending machines
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Pre-kit
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Pre-kits</CardTitle>
            <CardDescription>
              View and manage pre-kits for all your vending machines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search pre-kits..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <PreKitsList
              preKits={filteredPreKits}
              onPreKitClick={handlePreKitClick}
            />
          </CardContent>
        </Card>

        <PreKitDetailsDialog
          preKit={selectedPreKit}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>
    </div>
  )
}
