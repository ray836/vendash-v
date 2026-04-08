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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PublicUserDTO } from "@/domains/User/schemas/UserSchemas"
import { useState, useEffect } from "react"
import { createUser, deleteUser, getUsers, updateUserRole, inviteUser } from "./actions"
import { Check, Mail, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { UserRole } from "@/domains/User/entities/User"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/lib/role-context"
import { AccessGuard } from "@/components/access-guard"

const ROLE_LABELS: Record<string, string> = {
  [UserRole.OPERATOR]: "Operator",
  [UserRole.ADMIN]: "Admin",
  [UserRole.DRIVER]: "Driver",
}

export default function UsersPage() {
  const { toast } = useToast()
  const { role } = useRole()
  const isAdmin = role === UserRole.ADMIN
  const [users, setUsers] = useState<PublicUserDTO[]>([])
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<UserRole>(UserRole.OPERATOR)
  const [pendingDeleteUser, setPendingDeleteUser] = useState<PublicUserDTO | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.DRIVER)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteSent, setInviteSent] = useState(false)
  const [newUser, setNewUser] = useState<Omit<PublicUserDTO, "id" | "organizationId">>({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.OPERATOR,
  })

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsers()
      setUsers(users.map((u) => ({ ...u, organizationId: u.organizationId || "default" })))
    }
    fetchUsers()
  }, [])

  const handleSave = async () => {
    setIsAddingUser(false)
    const user = (await createUser(newUser)) as unknown as PublicUserDTO
    setUsers([...users, user])
    setNewUser({ firstName: "", lastName: "", email: "", role: UserRole.OPERATOR })
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteUser) return
    await deleteUser(pendingDeleteUser.id)
    setUsers(users.filter((u) => u.id !== pendingDeleteUser.id))
    toast({
      title: "User deleted",
      description: `${pendingDeleteUser.firstName} ${pendingDeleteUser.lastName} has been removed from the team.`,
    })
    setPendingDeleteUser(null)
  }

  const handleEditRole = (user: PublicUserDTO) => {
    setEditingUserId(user.id)
    setEditingRole(user.role as UserRole)
  }

  const handleSaveRole = async (userId: string) => {
    await updateUserRole(userId, editingRole)
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: editingRole } : u)))
    setEditingUserId(null)
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    setIsInviting(true)
    try {
      const result = await inviteUser(inviteEmail, inviteRole)
      setInviteUrl(result.inviteUrl ?? null)
      setInviteSent(true)
    } catch (err) {
      toast({
        title: "Failed to send invite",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleCloseInvite = () => {
    setIsInviteOpen(false)
    setInviteEmail("")
    setInviteRole(UserRole.DRIVER)
    setInviteUrl(null)
    setInviteSent(false)
  }

  return (
    <AccessGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATOR]}>
    <div className="container mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold">Team</h1>
      <div className="relative pb-16">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {isAdmin && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {editingUserId === user.id ? (
                    <Select
                      value={editingRole}
                      onValueChange={(value) => setEditingRole(value as UserRole)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.OPERATOR}>Operator</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="capitalize">{ROLE_LABELS[user.role] ?? user.role}</span>
                  )}
                </TableCell>
                {isAdmin && <TableCell>
                  <div className="flex items-center gap-1">
                    {editingUserId === user.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveRole(user.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRole(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDeleteUser(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>}
              </TableRow>
            ))}
            {isAddingUser && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="First Name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Last Name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Email"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.OPERATOR}>Operator</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isAdmin && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
          {isAddingUser ? (
            <Button className="px-6" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          ) : (
            <>
              <Button variant="outline" className="px-6" onClick={() => setIsInviteOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Invite User
              </Button>
              <Button className="px-6" onClick={() => setIsAddingUser(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </>
          )}
        </div>}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={(open) => { if (!open) handleCloseInvite() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {inviteSent ? "Invite sent" : "Invite team member"}
            </DialogTitle>
            <DialogDescription>
              {inviteSent && inviteUrl
                ? "An email was sent. If it doesn't arrive, share this link directly:"
                : inviteSent
                ? "They'll be added to your organization automatically when they next sign in."
                : "They'll receive an email with a link to create their account and will automatically join your organization."}
            </DialogDescription>
          </DialogHeader>

          {inviteSent ? (
            inviteUrl ? (
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2">
                  <Input value={inviteUrl} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl)
                      toast({ title: "Link copied" })
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This link is single-use and expires after sign-up.
                </p>
              </div>
            ) : null
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Email address</label>
                <Input
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
                    <SelectItem value={UserRole.OPERATOR}>Operator</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            {inviteSent ? (
              <Button onClick={handleCloseInvite}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseInvite}>Cancel</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail || isInviting}>
                  <Mail className="h-4 w-4 mr-2" />
                  {isInviting ? "Sending…" : "Send Invite"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDeleteUser} onOpenChange={(open) => !open && setPendingDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete team member?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {pendingDeleteUser?.firstName} {pendingDeleteUser?.lastName}
              </span>{" "}
              from the team. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AccessGuard>
  )
}
