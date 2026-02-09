import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
import { Plus, Download, MoreHorizontal, Filter, Edit, Trash2, Search } from "lucide-react"
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

// Mock data generator for pagination
const allSeamen = Array.from({ length: 25 }, (_, i) => ({
  no: i + 1,
  nama: `Seafarer ${i + 1}`,
  seamancode: `SEA${(i + 1).toString().padStart(3, '0')}`,
}))

const ITEMS_PER_PAGE = 5

type Seafarer = {
  no: number
  nama: string
  seamancode: string
}

export function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [newSeafarerName, setNewSeafarerName] = useState("")
  const [newSeafarerCode, setNewSeafarerCode] = useState("")
  const [selectedSeafarer, setSelectedSeafarer] = useState<Seafarer | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  
  const totalPages = Math.ceil(allSeamen.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentSeamen = allSeamen.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleOpenCreate = () => {
    setSelectedSeafarer(null)
    setNewSeafarerName("")
    setNewSeafarerCode("")
    setIsEditOpen(true)
  }

  const handleOpenEdit = (seaman: Seafarer) => {
    setSelectedSeafarer(seaman)
    setNewSeafarerName(seaman.nama)
    setNewSeafarerCode(seaman.seamancode)
    setIsEditOpen(true)
  }

  const handleOpenDelete = (seaman: Seafarer) => {
    setSelectedSeafarer(seaman)
    setIsDeleteOpen(true)
  }

  const handleSaveSeafarer = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSeafarer) {
      console.log("Updating seafarer:", { 
        ...selectedSeafarer, 
        nama: newSeafarerName, 
        seamancode: newSeafarerCode 
      })
    } else {
      console.log("Creating seafarer:", { newSeafarerName, newSeafarerCode })
    }
    setIsEditOpen(false)
    setNewSeafarerName("")
    setNewSeafarerCode("")
    setSelectedSeafarer(null)
  }

  const handleConfirmDelete = () => {
    if (selectedSeafarer) {
      console.log("Deleting seafarer:", selectedSeafarer)
    }
    setIsDeleteOpen(false)
    setSelectedSeafarer(null)
  }

  const handleRowClick = (seaman: Seafarer) => {
    navigate(`/dashboard/certificates/${seaman.seamancode}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Seafarers Overview</h2>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Manage crew members.</p>
        </div>
        <div className="flex gap-3">
             <Button variant="outline" className="h-10 border-zinc-300 dark:border-zinc-700">
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            
            <Button 
              onClick={handleOpenCreate}
              className="h-10 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Seafarer
            </Button>
            
            {/* Edit/Create Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] p-6 overflow-hidden border-0 shadow-2xl rounded-xl">
                 <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold text-zinc-900">
                    {selectedSeafarer ? "Edit Seafarer" : "Add New Seafarer"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSaveSeafarer} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-zinc-900">
                        Seafarer Name
                      </Label>
                      <Input
                        id="name"
                        value={newSeafarerName}
                        onChange={(e) => setNewSeafarerName(e.target.value)}
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
                        value={newSeafarerCode}
                        onChange={(e) => setNewSeafarerCode(e.target.value)}
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
                    <Button type="submit" className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20">
                        {selectedSeafarer ? "Save Changes" : "Save Seafarer"}
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
                  Are you sure you want to delete <span className="font-semibold text-zinc-900">{selectedSeafarer?.nama}</span>? This action cannot be undone.
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
                    className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-md shadow-zinc-200/50 dark:shadow-zinc-950/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Seafarers</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-red-100"></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">1,248</div>
                    <p className="text-xs text-muted-foreground">+4.1% from last month</p>
                </CardContent>
            </Card>
            <Card className="border-none shadow-md shadow-zinc-200/50 dark:shadow-zinc-950/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Crew</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-green-100"></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">894</div>
                    <p className="text-xs text-muted-foreground">Currently on board</p>
                </CardContent>
            </Card>
             <Card className="border-none shadow-md shadow-zinc-200/50 dark:shadow-zinc-950/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expiring Certificates</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-yellow-100"></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-xs text-muted-foreground text-red-600 font-medium">Action required</p>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-zinc-200"
              />
            </div>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Filter className="h-4 w-4" />
            </Button>
        </CardHeader>
        <CardContent>
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
                  {currentSeamen.map((seaman) => (
                      <TableRow 
                        key={seaman.seamancode} 
                        onClick={() => handleRowClick(seaman)}
                        className="border-b-zinc-50 dark:border-b-zinc-900 hover:bg-zinc-50/50 cursor-pointer"
                      >
                      <TableCell className="font-medium text-zinc-500">{seaman.no}</TableCell>
                      <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{seaman.nama}</TableCell>
                      <TableCell>
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-900 dark:text-zinc-400">
                              {seaman.seamancode}
                          </span>
                      </TableCell>
                      {/* Removed Position and Status columns */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              onClick={() => handleOpenEdit(seaman)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenDelete(seaman)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
              </Table>
            </div>
            
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
                     // Always show first and last, they are handled separately if we strictly follow that pattern,
                     // but here's a hybrid approach:
                     // Show if page is within distance of current page, but exclude first and last to avoid dupes
                     // logic: page is not 1 and not last, and (page is near current)
                     if (page === 1 || page === totalPages) return false

                     // Logic for showing neighbors
                     // Show p if: current-1 <= p <= current+1
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
