import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
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
import { cn } from "@/lib/utils"
import { Plus, Download, MoreHorizontal, Filter, Edit, Trash2, Search, Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
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
import { useGetPersons } from "@/features/person/_hooks/useGetPersons"
import { usePostPerson } from "@/features/person/_hooks/usePostPerson"
import { usePutPerson } from "@/features/person/_hooks/usePutPerson"
import { useDeletePerson } from "@/features/person/_hooks/useDeletePerson"
import { useGetStats } from "@/features/person/_hooks/useGetStats"
import { Person } from "@/features/person/types/person.types"

const ITEMS_PER_PAGE = 5

// Zod Schema
const seafarerSchema = z.object({
  name: z.string().min(1, "Full Name is required"),
  seamancode: z.string().min(1, "Seaman Code is required"),
})

interface PersonFormState {
  name: string;
  seamancode: string;
}

export function DashboardPage() {
  const { data: persons = [], isLoading, error } = useGetPersons()
  const { data: stats } = useGetStats()
  const { mutate: createPerson, isPending: isCreating } = usePostPerson()
  const { mutate: updatePerson, isPending: isUpdating } = usePutPerson()
  const { mutate: deletePerson, isPending: isDeleting } = useDeletePerson()

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState<PersonFormState>({ name: "", seamancode: "" })
  const navigate = useNavigate()

  // Filter by search
  const filteredPersons = persons.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.seamancode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredPersons.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentPersons = filteredPersons.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleOpenCreate = () => {
    setSelectedPerson(null)
    setFormData({ name: "", seamancode: "" })
    setIsEditOpen(true)
  }

  const handleOpenEdit = (person: Person) => {
    setSelectedPerson(person)
    setFormData({ name: person.name, seamancode: person.seamancode })
    setIsEditOpen(true)
  }

  const handleOpenDelete = (person: Person) => {
    setSelectedPerson(person)
    setIsDeleteOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const validation = seafarerSchema.safeParse(formData)
    if (!validation.success) {
      alert(`Error: ${validation.error.issues[0].message}`)
      return
    }

    if (selectedPerson) {
      updatePerson({
        id: selectedPerson.id,
        data: {
          name: formData.name,
          seamancode: formData.seamancode,
        }
      }, {
        onSuccess: () => setIsEditOpen(false)
      })
    } else {
      createPerson({
        name: formData.name,
        seamancode: formData.seamancode,
      }, {
        onSuccess: () => setIsEditOpen(false)
      })
    }
  }

  const handleConfirmDelete = () => {
    if (selectedPerson) {
      deletePerson(selectedPerson.id, {
        onSuccess: () => setIsDeleteOpen(false)
      })
    }
  }

  const handleRowClick = (person: Person) => {
    navigate(`/dashboard/certificates/${person.seamancode}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Seafarers Overview</h2>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Manage crew members.</p>
        </div>
        <div className="flex gap-3">
            <Button 
              onClick={handleOpenCreate}
              className="h-10 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Seafarer
            </Button>
        </div>
      </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-none shadow-md shadow-zinc-200/50 dark:shadow-zinc-950/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Seafarers</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-red-100"></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSeafarers ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Registered in system</p>
                </CardContent>
            </Card>
            <Card className="border-none shadow-md shadow-zinc-200/50 dark:shadow-zinc-950/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-green-100"></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalCertificates ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Uploaded documents</p>
                </CardContent>
            </Card>
        </div>

      <Card className="border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search seafarers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 h-10 bg-white border-zinc-200"
              />
            </div>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Filter className="h-4 w-4" />
            </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : error ? (
            <div className="text-center p-8 text-red-500">
              Failed to load seafarers.
            </div>
          ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-zinc-100 dark:border-zinc-800">
              <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                  <TableRow className="border-b-zinc-100 dark:border-b-zinc-800 hover:bg-zinc-50/50">
                      <TableHead className="w-[80px] font-semibold">No</TableHead>
                      <TableHead className="font-semibold">Full Name</TableHead>
                      <TableHead className="font-semibold">Seaman Code</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {currentPersons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-zinc-500">
                        No seafarers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                  currentPersons.map((person, index) => (
                      <TableRow 
                        key={person.id} 
                        onClick={() => handleRowClick(person)}
                        className="border-b-zinc-50 dark:border-b-zinc-900 hover:bg-zinc-50/50 cursor-pointer"
                      >
                      <TableCell className="font-medium text-zinc-500">{startIndex + index + 1}</TableCell>
                      <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{person.name}</TableCell>
                      <TableCell>
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-900 dark:text-zinc-400">
                              {person.seamancode}
                          </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              onClick={() => handleOpenEdit(person)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenDelete(person)}
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
            
            {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50 cursor-not-allowed")}
                  />
                </PaginationItem>
                
                {/* First Page */}
                {totalPages > 0 && (
                  <PaginationItem>
                    <PaginationLink 
                      isActive={currentPage === 1}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}

                {/* Left Ellipsis */}
                {currentPage > 3 && totalPages > 4 && (
                   <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Middle Pages */}
                 {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                     if (page === 1 || page === totalPages) return false
                     return Math.abs(currentPage - page) <= 1
                  })
                  .map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        isActive={currentPage === page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                ))}

                {/* Right Ellipsis */}
                {currentPage < totalPages - 2 && totalPages > 4 && (
                   <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Last Page */}
                {totalPages > 1 && (
                  <PaginationItem>
                    <PaginationLink 
                      isActive={currentPage === totalPages}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    className={cn(currentPage === totalPages && "pointer-events-none opacity-50 cursor-not-allowed")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] p-6 overflow-hidden border-0 shadow-2xl rounded-xl">
           <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-zinc-900">
              {selectedPerson ? "Edit Seafarer" : "Add New Seafarer"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-zinc-900">
                  Seafarer Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-11 bg-white border-zinc-200 transition-all"
                  placeholder="Enter seafarer full name"
                  required
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="code" className="text-sm font-semibold text-zinc-900">
                  Seaman Code
                </Label>
                <Input
                  id="code"
                  value={formData.seamancode}
                  onChange={(e) => setFormData({...formData, seamancode: e.target.value})}
                  className="h-11 bg-white border-zinc-200 transition-all"
                  placeholder="Enter seaman code"
                  required
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
                className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
              >
                  {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedPerson ? "Save Changes" : "Save Seafarer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] p-6 overflow-hidden border-0 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-zinc-900">Delete Seafarer</DialogTitle>
          </DialogHeader>
          
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete <span className="font-semibold text-zinc-900">{selectedPerson?.name}</span>? This action cannot be undone.
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
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
