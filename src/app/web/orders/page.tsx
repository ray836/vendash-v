"use client"

import { OrdersClient } from "./orders-client"
import { AccessGuard } from "@/components/access-guard"
import { UserRole } from "@/domains/User/entities/User"

export default function OrdersPage() {
  const nextOrderDate = new Date()
  nextOrderDate.setDate(nextOrderDate.getDate() + 3)

  return (
    <AccessGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
      <OrdersClient nextOrderDate={nextOrderDate} />
    </AccessGuard>
  )
}
