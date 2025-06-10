"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PublicUserDTO } from "@/domains/User/schemas/UserSchemas"
import { useState, useEffect } from "react"
import { createUser, deleteUser, getUsers } from "./actions"
import { Plus, Save, Trash2 } from "lucide-react"
import { UserRole } from "@/domains/User/entities/User"

export default function UsersPage() {
  const [users, setUsers] = useState<PublicUserDTO[]>([])
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState<
    Omit<PublicUserDTO, "id" | "organizationId">
  >({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.USER,
  })

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsers()
      const usersWithOrg = users.map((user) => ({
        ...user,
        organizationId: user.organizationId || "default",
      }))
      setUsers(usersWithOrg)
    }
    fetchUsers()
  }, [])

  const handleSave = async () => {
    // TODO: Implement save functionality
    setIsAddingUser(false)
    console.log("handleSave", newUser)
    const user = (await createUser(newUser)) as unknown as PublicUserDTO
    console.log("user", user)
    setUsers([...users, user])
    setNewUser({ firstName: "", lastName: "", email: "", role: UserRole.USER })
  }

  const handleDelete = async (userId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete user:", userId)
    await deleteUser(userId)
    setUsers(users.filter((user) => user.id !== userId))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="relative pb-16">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(user.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {isAddingUser && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    placeholder="First Name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    placeholder="Last Name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="Email"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, role: value as UserRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.USER}>User</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          {isAddingUser ? (
            <Button className="px-6" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          ) : (
            <Button className="px-6" onClick={() => setIsAddingUser(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
