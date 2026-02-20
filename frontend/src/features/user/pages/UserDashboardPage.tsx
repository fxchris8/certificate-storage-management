import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis
} from "@/components/ui/pagination"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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

// Zod Schemas
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().optional().refine(val => !val || val.length >= 6, "Password must be at least 6 characters if provided"),
})

// Combined type for the form
type UserFormValues = z.infer<typeof createUserSchema> | z.infer<typeof updateUserSchema>

export function UserDashboardPage() {
  const { mutate: createUser, isPending: isCreating } = usePostUser();
  const { mutate: updateUser, isPending: isUpdating } = usePutUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const { data: usersData, isLoading, error } = useGetUsers({
    page: currentPage,
    limit: 10,
    search: debouncedSearch,
  });

  const users = usersData?.data ?? [];
  const totalPages = usersData?.meta?.totalPages ?? 1;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(selectedUser ? updateUserSchema : createUserSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  // Reset form validation when selectedUser changes (Create vs Edit mode)
  useEffect(() => {
    form.reset(
        selectedUser 
        ? { username: selectedUser.username, password: "" }
        : { username: "", password: "" }
    )
  }, [selectedUser, form])


  const handleOpenCreate = () => {
    setSelectedUser(null)
    setIsEditOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditOpen(true)
  }

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const onSubmit = (data: z.infer<typeof updateUserSchema>) => {
    if (selectedUser) {
      updateUser({ 
        id: selectedUser.id, 
        data: { 
            username: data.username, 
            password: data.password || undefined 
        } 
      }, {
        onSuccess: () => setIsEditOpen(false)
      })
    } else {
      // For create, password is required by schema, so it should be present
      if (!data.password) return

      createUser({ 
        username: data.username, 
        password: data.password 
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
                    <TableHead className="w-[80px] font-semibold">No</TableHead>
                    <TableHead className="font-semibold">Username</TableHead>
                    <TableHead className="font-semibold">Created At</TableHead>
                    <TableHead className="font-semibold">Updated At</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-zinc-500">
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                users.map((user: User, index: number) => (
                    <TableRow 
                      key={user.id} 
                      className="border-b-zinc-50 dark:border-b-zinc-900 hover:bg-zinc-50/50"
                    >
                    <TableCell className="font-medium text-zinc-500">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{user.username}</TableCell>
                    <TableCell className="text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-zinc-500">{new Date(user.updatedAt).toLocaleDateString()}</TableCell>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={currentPage === p}
                      onClick={() => setCurrentPage(p as number)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

            {/* Edit/Create Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] p-6 overflow-hidden border-0 shadow-2xl rounded-xl">
                 <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold text-zinc-900">
                    {selectedUser ? "Edit User" : "Add New User"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Password {selectedUser && "(Leave blank to keep current)"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter password" 
                                {...field} 
                                value={field.value || ""} // Handle potentially undefined value
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                          disabled={isCreating || isUpdating || !form.formState.isValid}
                          className="h-11 px-6 text-white shadow-md shadow-indigo-600/20"
                      >
                          {isCreating || isUpdating ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {selectedUser ? "Save Changes" : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
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
