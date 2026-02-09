import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, GraduationCap, MoreHorizontal, Eye, Download, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data - find seafarer by code
const allSeamen = Array.from({ length: 25 }, (_, i) => ({
  no: i + 1,
  nama: `Seafarer ${i + 1}`,
  seamancode: `SEA${(i + 1).toString().padStart(3, '0')}`,
}))

// Combined mock documents (certificates and diplomas)
const allDocuments = [
  { id: 1, type: "Certificate", name: "Basic Safety Training", documentNumber: "BST-2023-001", issueDate: "2023-01-15", expiryDate: "2028-01-15" },
  { id: 2, type: "Certificate", name: "Advanced Fire Fighting", documentNumber: "AFF-2023-045", issueDate: "2023-03-20", expiryDate: "2028-03-20" },
  { id: 3, type: "Certificate", name: "Medical First Aid", documentNumber: "MFA-2022-089", issueDate: "2022-11-10", expiryDate: "2027-11-10" },
  { id: 4, type: "Diploma", name: "Nautical Science Degree", documentNumber: "NSD-2020-156", issueDate: "2020-06-15", institution: "Maritime Academy" },
  { id: 5, type: "Certificate", name: "GMDSS Radio Operator", documentNumber: "GRO-2023-067", issueDate: "2023-05-12", expiryDate: "2028-05-12" },
  { id: 6, type: "Certificate", name: "Ship Security Officer", documentNumber: "SSO-2023-034", issueDate: "2023-02-28", expiryDate: "2028-02-28" },
  { id: 7, type: "Diploma", name: "Marine Engineering Diploma", documentNumber: "MED-2019-203", issueDate: "2019-08-20", institution: "Technical Institute" },
  { id: 8, type: "Certificate", name: "Crowd Management", documentNumber: "CM-2023-012", issueDate: "2023-04-05", expiryDate: "2028-04-05" },
]

const ITEMS_PER_PAGE = 5

export function CertificatesPage() {
  const { seamancode } = useParams()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  
  const seafarer = allSeamen.find(s => s.seamancode === seamancode)
  
  const totalPages = Math.ceil(allDocuments.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentDocuments = allDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  
  if (!seafarer) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Seafarer not found</h2>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <button
          onClick={() => navigate('/dashboard')}
          className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          Dashboard
        </button>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-50 font-medium">Certificates</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="h-10 gap-2 border-zinc-200 hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {seafarer.nama}
          </h2>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Seaman Code: <span className="font-semibold">{seafarer.seamancode}</span>
          </p>
        </div>
      </div>

      {/* Upload Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="h-11 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95">
          <FileText className="mr-2 h-5 w-5" />
          Upload Sertifikat
        </Button>
        <Button className="h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95">
          <GraduationCap className="mr-2 h-5 w-5" />
          Upload Ijazah
        </Button>
      </div>

      {/* Combined Documents Table */}
      <Card className="border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Documents</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border border-zinc-100 dark:border-zinc-800">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                  <TableRow className="border-b-zinc-100 dark:border-b-zinc-800 hover:bg-zinc-50/50">
                    <TableHead className="w-[80px] font-semibold">No</TableHead>
                    <TableHead className="font-semibold">Nama Dokumen</TableHead>
                    <TableHead className="font-semibold">Nomor Dokumen</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentDocuments.map((doc, index) => (
                    <TableRow key={doc.id} className="border-b-zinc-50 dark:border-b-zinc-900 hover:bg-zinc-50/50">
                      <TableCell className="font-medium text-zinc-500">{startIndex + index + 1}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{doc.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-900 dark:text-zinc-400">
                          {doc.documentNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
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

            {/* Pagination */}
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

