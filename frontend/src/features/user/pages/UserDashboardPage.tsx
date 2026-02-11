import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, MoreHorizontal, Edit, Trash2, Search, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGetUsers } from "../_hooks/useGetUsers"
import { usePostUser } from "../_hooks/usePostUser"
import { usePutUser } from "../_hooks/usePutUser"
import { useDeleteUser } from "../_hooks/useDeleteUser"
import { User } from "../types/user.types"

// Simple form state interface
interface UserFormState {
  username: string;
  password?: string;
}

export function UserDashboardPage() {
  const { data: usersResponse, isLoading, error } = useGetUsers();
  const { mutate: createUser, isPending: isCreating } = usePostUser();
  const { mutate: updateUser, isPending: isUpdating } = usePutUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<UserFormState>({ username: "", password: "" })

  const users = usersResponse || [];

  const filteredUsers = users.filter((user: User) => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedUser(null)
    setFormData({ username: "", password: "" })
    setIsEditOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setFormData({ username: user.username, password: "" }) // Don't fill password
    setIsEditOpen(true)
  }

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUser) {
      updateUser({ 
        id: selectedUser.id, 
        data: { 
            username: formData.username, 
            password: formData.password || undefined 
        } 
      }, {
        onSuccess: () => setIsEditOpen(false)
      })
    } else {
      createUser({ 
        username: formData.username, 
        password: formData.password! 
      }, {
        onSuccess: () => setIsEditOpen(false)
      })
    }
  }

  const handleConfirmDelete = () => {
    if (selectedUser) {
        deleteUser(selectedUser.id, {
            onSuccess: () => setIsDeleteOpen(false)
        })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">User Management</h2>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Manage system users and access.</p>
        </div>
        <div className="flex gap-3">
            <Button 
              onClick={handleOpenCreate}
              className="h-10 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
        </div>
      </div>

      <Card className="border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-zinc-200"
              />
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
            ) : error ? (
                <div className="text-center p-8 text-red-500">
                    Failed to load users.
                </div>
            ) : (
          <div className="rounded-md border border-zinc-100 dark:border-zinc-800">
            <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                <TableRow className="border-b-zinc-100 dark:border-b-zinc-800 hover:bg-zinc-50/50">
                    <TableHead className="font-semibold">Username</TableHead>
                    <TableHead className="font-semibold">Created At</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredUsers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24 text-zinc-500">
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                filteredUsers.map((user: User) => (
                    <TableRow 
                      key={user.id} 
                      className="border-b-zinc-50 dark:border-b-zinc-900 hover:bg-zinc-50/50"
                    >
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{user.username}</TableCell>
                    <TableCell className="text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => handleOpenEdit(user)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenDelete(user)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    </TableRow>
                )))}
                </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

            {/* Edit/Create Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] p-6 overflow-hidden border-0 shadow-2xl rounded-xl">
                 <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold text-zinc-900">
                    {selectedUser ? "Edit User" : "Add New User"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-semibold text-zinc-900">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="h-11 bg-white border-zinc-200 transition-all"
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="password" className="text-sm font-semibold text-zinc-900">
                        Password {selectedUser && "(Leave blank to keep current)"}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="h-11 bg-white border-zinc-200 transition-all"
                        placeholder="Enter password"
                        required={!selectedUser}
                      />
                  </div>

                  <DialogFooter className="flex flex-row justify-end gap-3 pt-2">
                     <Button 
                       type="button" 
                       variant="outline" 
                       onClick={() => setIsEditOpen(false)}
                       className="h-11 px-6 border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                     >
                        Cancel
                     </Button>
                    <Button 
                        type="submit" 
                        disabled={isCreating || isUpdating}
                        className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                    >
                        {isCreating || isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {selectedUser ? "Save Changes" : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] p-6 overflow-hidden border-0 shadow-2xl rounded-xl">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold text-zinc-900">Delete User</DialogTitle>
                </DialogHeader>
                
                <p className="text-sm text-zinc-600">
                  Are you sure you want to delete <span className="font-semibold text-zinc-900">{selectedUser?.username}</span>? This action cannot be undone.
                </p>

                <DialogFooter className="flex flex-row justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDeleteOpen(false)}
                    className="h-11 px-6 border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
                  >
                     {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
    </div>
  )
}
