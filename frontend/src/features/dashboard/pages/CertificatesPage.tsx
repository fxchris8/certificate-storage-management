import { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeft, FileText, MoreHorizontal, Eye, Download, Trash2, Plus, Loader2 } from "lucide-react"
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

import { useGetCertificates } from "../_hooks/useGetCertificates"
import { usePostCertificate } from "../_hooks/usePostCertificate"
import { useDeleteCertificate } from "../_hooks/useDeleteCertificate"
import { useGetPersons } from "@/features/person/_hooks/useGetPersons"
import { BASE_URL } from "@/lib/api"

const ITEMS_PER_PAGE = 5

type UploadMutationError = {
  response?: { data?: { message?: string } }
  message?: string
}

export function CertificatesPage() {
  const { seamancode } = useParams()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ certificateName: "", nomorSertifikat: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch persons to find the current seafarer and get personId
  const { data: persons } = useGetPersons()
  const seafarer = persons?.find(p => p.seamancode === seamancode)

  // Fetch certificates by seamanCode
  const { data: certificates, isLoading, isError } = useGetCertificates(seamancode)

  // Mutations
  const createMutation = usePostCertificate()
  const deleteMutation = useDeleteCertificate()
  const uploadError = createMutation.error as UploadMutationError | null
  const uploadErrorMessage = uploadError?.response?.data?.message ?? uploadError?.message

  const allDocuments = certificates ?? []
  const totalPages = Math.ceil(allDocuments.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentDocuments = allDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleCreateSubmit = async () => {
    if (!seafarer || !selectedFile) return

    const formData = new FormData()
    formData.append("personId", seafarer.id)
    formData.append("certificateName", createForm.certificateName)
    formData.append("nomorSertifikat", createForm.nomorSertifikat)
    formData.append("file", selectedFile)

    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateOpen(false)
        setCreateForm({ certificateName: "", nomorSertifikat: "" })
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      },
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus sertifikat ini?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleView = (nomorSertifikat: string) => {
    window.open(`${BASE_URL}/certificates/view/${seamancode}/${encodeURIComponent(nomorSertifikat)}`, "_blank")
  }

  const handleDownload = (nomorSertifikat: string) => {
    window.open(`${BASE_URL}/certificates/download/${seamancode}/${encodeURIComponent(nomorSertifikat)}`, "_blank")
  }

  if (!seafarer && !isLoading) {
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
            {seafarer?.name ?? "Loading..."}
          </h2>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Seaman Code: <span className="font-semibold">{seamancode}</span>
          </p>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-11 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="mr-2 h-5 w-5" />
          Upload Sertifikat
        </Button>
      </div>

      {/* Documents Table */}
      <Card className="border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Documents</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <span className="ml-2 text-zinc-500">Loading certificates...</span>
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-red-500">Failed to load certificates</div>
            ) : allDocuments.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">No certificates found</div>
            ) : (
              <>
                <div className="rounded-md border border-zinc-100 dark:border-zinc-800">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                      <TableRow className="border-b-zinc-100 dark:border-b-zinc-800 hover:bg-zinc-50/50">
                        <TableHead className="w-[80px] font-semibold">No</TableHead>
                        <TableHead className="font-semibold">Nama Dokumen</TableHead>
                        <TableHead className="font-semibold">Nomor Sertifikat</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentDocuments.map((doc, index) => (
                        <TableRow key={doc.id} className="border-b-zinc-50 dark:border-b-zinc-900 hover:bg-zinc-50/50">
                          <TableCell className="font-medium text-zinc-500">{startIndex + index + 1}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{doc.certificateName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-900 dark:text-zinc-400">
                              {doc.nomorSertifikat}
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
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleView(doc.nomorSertifikat)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload(doc.nomorSertifikat)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                  onClick={() => handleDelete(doc.id)}
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

                {/* Pagination */}
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Certificate Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (open) createMutation.reset()
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Sertifikat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="certificateName">Nama Sertifikat</Label>
              <Input
                id="certificateName"
                placeholder="e.g. Basic Safety Training"
                value={createForm.certificateName}
                onChange={(e) => setCreateForm({ ...createForm, certificateName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomorSertifikat">Nomor Sertifikat</Label>
              <Input
                id="nomorSertifikat"
                placeholder="e.g. BST-2023-001"
                value={createForm.nomorSertifikat}
                onChange={(e) => setCreateForm({ ...createForm, nomorSertifikat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File Sertifikat</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                accept=".jpeg,.jpg,.png,.pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-zinc-500">Format: JPEG, JPG, PNG, PDF. Maks 10MB</p>
            </div>
            {uploadErrorMessage && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {uploadErrorMessage}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={!createForm.certificateName || !createForm.nomorSertifikat || !selectedFile || createMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
