import { ArrowRight, Package } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface PastOrderCardProps {
  order: {
    id: string
    date: string
    status: string
    items: number
    total: number
  }
}

export function PastOrderCard({ order }: PastOrderCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <p className="text-sm font-medium">{order.id}</p>
          <p className="text-sm text-muted-foreground">{order.date}</p>
        </div>
        <Badge variant={order.status === "Delivered" ? "default" : "outline"}>
          {order.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {order.items} items
          </span>
        </div>
        <p className="mt-2 text-xl font-bold">${order.total.toFixed(2)}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/web/orders/${order.id}`}>
            View Order Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
