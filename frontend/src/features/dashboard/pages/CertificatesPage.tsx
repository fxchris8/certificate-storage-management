import { useState, useRef, useCallback } from "react"
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
import {
  ArrowLeft, MoreHorizontal, Eye, Download, Trash2,
  Upload, Loader2, ScanLine, Check, Pencil, FileUp, ZoomIn, RotateCcw, Maximize2
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useGetCertificates } from "../_hooks/useGetCertificates"
import { usePostCertificate } from "../_hooks/usePostCertificate"
import { usePutCertificate } from "../_hooks/usePutCertificate"
import { useDeleteCertificate } from "../_hooks/useDeleteCertificate"
import { useScanCertificates } from "../_hooks/useScanCertificates"
import { useBulkCreateCertificates } from "../_hooks/useBulkCreateCertificates"
import { useGetPersons } from "@/features/person/_hooks/useGetPersons"
import api from "@/lib/api"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog"

import { z } from "zod"

const ITEMS_PER_PAGE = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"]
const ACCEPTED_DOC_TYPES = [...ACCEPTED_IMAGE_TYPES, "application/pdf"]

// Zod Schemas
const docUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((file) => ACCEPTED_DOC_TYPES.includes(file.type), "Only .jpg, .jpeg, .png and .pdf formats are supported."),
  nomorSertifikat: z.string().min(1, "Nomor Sertifikat harus diisi"),
})

const certificateScanSchema = z.object({
  editedName: z.string().min(1, "Nama Sertifikat harus diisi"),
  nomorSertifikat: z.string().min(1, "Nomor Sertifikat harus diisi"),
  // file validation happens at upload stage, but good to check existence if needed
})

const editCertificateSchema = z.object({
  certificateName: z.string().min(1, "Nama Sertifikat harus diisi"),
  nomorSertifikat: z.string().min(1, "Nomor Sertifikat harus diisi"),
  file: z.instanceof(File).optional().nullable()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((file) => !file || ACCEPTED_DOC_TYPES.includes(file.type), "Only .jpg, .jpeg, .png and .pdf formats are supported."),
})

// Types for upload flows
interface DocField {
  file: File | null
  nomorSertifikat: string
}

interface ScanPreviewItem {
  originalName: string
  filePath: string
  trainingName: string
  confidence: number
  status: string
  nomorSertifikat: string
  isEditing: boolean
  editedName: string
}

export function CertificatesPage() {
  const { seamancode } = useParams()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)

  // Dialog states
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false)
  const [isSertifikatUploadOpen, setIsSertifikatUploadOpen] = useState(false)

  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<{ id: string; certificateName: string; nomorSertifikat: string; file: File | null } | null>(null)

  // Button 1: Ijazah/Endorse/Medical fields
  const [docFields, setDocFields] = useState<Record<string, DocField>>({
    Ijazah: { file: null, nomorSertifikat: "" },
    Endorse: { file: null, nomorSertifikat: "" },
    "Medical Checkup": { file: null, nomorSertifikat: "" },
  })

  // Button 2: Sertifikat bulk upload + scan
  const [sertifikatFiles, setSertifikatFiles] = useState<File[]>([])
  const [scanResults, setScanResults] = useState<ScanPreviewItem[]>([])
  const [scanStep, setScanStep] = useState<"upload" | "preview">("upload")
  const sertifikatFileRef = useRef<HTMLInputElement>(null)

  // Data fetching
  const { data: persons } = useGetPersons()
  const seafarer = persons?.find(p => p.seamancode === seamancode)
  const { data: certificates, isLoading, isError } = useGetCertificates(seamancode)

  // Mutations
  const createMutation = usePostCertificate()
  const updateMutation = usePutCertificate()
  const deleteMutation = useDeleteCertificate()
  const scanMutation = useScanCertificates()
  const bulkCreateMutation = useBulkCreateCertificates()

  const allDocuments = certificates ?? []
  const totalPages = Math.ceil(allDocuments.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentDocuments = allDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  // === Button 1: Upload Ijazah/Endorse/Medical ===
  const handleDocFieldChange = (name: string, field: Partial<DocField>) => {
    setDocFields(prev => ({ ...prev, [name]: { ...prev[name], ...field } }))
  }

  const handleDocUploadSubmit = async () => {
    if (!seafarer) return

    const entries = Object.entries(docFields).filter(([, v]) => v.file && v.nomorSertifikat)
    if (entries.length === 0) return

    for (const [certificateName, { file, nomorSertifikat }] of entries) {
      if (!file) continue

      // Validation
      const validation = docUploadSchema.safeParse({ file, nomorSertifikat })
      if (!validation.success) {
        alert(`Error pada ${certificateName}: ${validation.error.issues[0].message}`)
        return
      }

      const formData = new FormData()
      formData.append("personId", seafarer.id)
      formData.append("certificateName", certificateName)
      formData.append("nomorSertifikat", nomorSertifikat)
      formData.append("file", file)
      await createMutation.mutateAsync(formData)
    }

    setIsDocUploadOpen(false)
    setDocFields({
      Ijazah: { file: null, nomorSertifikat: "" },
      Endorse: { file: null, nomorSertifikat: "" },
      "Medical Checkup": { file: null, nomorSertifikat: "" },
    })
  }

  // === Button 2: Upload Sertifikat with OCR Scan ===
  const handleSertifikatFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSertifikatFiles(Array.from(e.target.files))
    }
  }

  const handleScan = () => {
    if (sertifikatFiles.length === 0) return

    const formData = new FormData()
    sertifikatFiles.forEach(file => formData.append("files", file))

    scanMutation.mutate(formData, {
      onSuccess: (results) => {
        setScanResults(results.map(r => ({
          ...r,
          nomorSertifikat: "",
          isEditing: false,
          editedName: r.trainingName,
        })))
        setScanStep("preview")
      },
    })
  }

  const handleScanResultEdit = (index: number, field: Partial<ScanPreviewItem>) => {
    setScanResults(prev => prev.map((item, i) => i === index ? { ...item, ...field } : item))
  }

  // State for upload progress
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Preview State
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleBulkSubmit = async () => {
    if (!seafarer) return
    
    setIsUploading(true)
    setUploadProgress(0)

    // Validate all items first
    for (const result of scanResults) {
      const certificateName = result.editedName || result.trainingName
      const validation = certificateScanSchema.safeParse({ 
        editedName: certificateName, 
        nomorSertifikat: result.nomorSertifikat 
      })

      if (!validation.success) {
        alert(`Error pada ${result.originalName}: ${validation.error.issues[0].message}`)
        setIsUploading(false)
        setUploadProgress(0)
        return
      }
    }

    try {
      let completed = 0
      for (let i = 0; i < scanResults.length; i++) {
        const result = scanResults[i]
        const file = sertifikatFiles[i] // Assuming index matches

        if (!result || !file) continue

        const formData = new FormData()
        formData.append("personId", seafarer.id)
        formData.append("certificateName", result.editedName || result.trainingName)
        formData.append("nomorSertifikat", result.nomorSertifikat)
        formData.append("file", file)

        await createMutation.mutateAsync(formData)
        completed++
        setUploadProgress(completed)
      }

      // Cleanup and close
      setIsSertifikatUploadOpen(false)
      setSertifikatFiles([])
      setScanResults([])
      setScanStep("upload")
      if (sertifikatFileRef.current) sertifikatFileRef.current.value = ""
    } catch (error) {
      console.error("Bulk upload failed:", error)
      // Optional: Show error toast here
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const closeSertifikatDialog = () => {
    setIsSertifikatUploadOpen(false)
    setSertifikatFiles([])
    setScanResults([])
    setScanStep("upload")
  }

  // === Common handlers ===
  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus sertifikat ini?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleEditOpen = (doc: { id: string; certificateName: string; nomorSertifikat: string }) => {
    setEditingCert({ ...doc, file: null })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingCert) return

    // Validation
    const validation = editCertificateSchema.safeParse(editingCert)
    if (!validation.success) {
      alert(`Error: ${validation.error.issues[0].message}`)
      return
    }

    const formData = new FormData()
    formData.append("certificateName", editingCert.certificateName)
    formData.append("nomorSertifikat", editingCert.nomorSertifikat)
    if (editingCert.file) formData.append("file", editingCert.file)

    updateMutation.mutate(
      { id: editingCert.id, data: formData },
      {
        onSuccess: () => {
          setIsEditOpen(false)
          setEditingCert(null)
        },
      }
    )
  }

  const handleView = useCallback(async (nomorSertifikat: string) => {
    try {
      const response = await api.get(
        `/certificates/view/${seamancode}/${encodeURIComponent(nomorSertifikat)}`,
        { responseType: "blob" }
      )
      const blob = new Blob([response.data], { type: response.headers["content-type"] })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (error) {
      console.error("Failed to view certificate:", error)
    }
  }, [seamancode])

  const handleDownload = useCallback(async (nomorSertifikat: string, certificateName?: string) => {
    try {
      const response = await api.get(
        `/certificates/download/${seamancode}/${encodeURIComponent(nomorSertifikat)}`,
        { responseType: "blob" }
      )
      const contentType = response.headers["content-type"] || "application/octet-stream"
      const blob = new Blob([response.data], { type: contentType })

      // Extract filename from Content-Disposition header
      let downloadName = certificateName || nomorSertifikat
      const disposition = response.headers["content-disposition"]
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/)
        if (match?.[1]) downloadName = match[1]
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download certificate:", error)
    }
  }, [seamancode])

  if (!seafarer && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Seafarer not found</h2>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  // Check if all required docs exist
  const requiredDocs = ["Ijazah", "Endorse", "Medical Checkup"]
  const uploadedDocNames = allDocuments.map(d => d.certificateName)
  const isAllDocsUploaded = requiredDocs.every(d => uploadedDocNames.includes(d))

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <button onClick={() => navigate('/dashboard')} className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
          Dashboard
        </button>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-50 font-medium">Certificates</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="h-10 gap-2 border-zinc-200 hover:bg-zinc-50">
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

      {/* Upload Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setIsDocUploadOpen(true)}
          disabled={isAllDocsUploaded}
          title={isAllDocsUploaded ? "Semua dokumen wajib (Ijazah, Endorse, Medical) sudah diupload" : ""}
          className={cn(
            "h-11 shadow-lg text-white border-0 transition-all hover:scale-105 active:scale-95",
            isAllDocsUploaded 
              ? "bg-zinc-300 text-zinc-500 shadow-none cursor-not-allowed transform-none hover:scale-100" 
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
          )}
        >
          <FileUp className="mr-2 h-5 w-5" />
          Upload Ijazah, Endorse & Medical
        </Button>
        <Button
          onClick={() => setIsSertifikatUploadOpen(true)}
          className="h-11 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95"
        >
          <Upload className="mr-2 h-5 w-5" />
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
                        <TableHead className="w-[60px] font-semibold">No</TableHead>
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
                                  <Eye className="mr-2 h-4 w-4" />View
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload(doc.nomorSertifikat)}>
                                  <Download className="mr-2 h-4 w-4" />Download
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditOpen(doc)}>
                                  <Pencil className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => handleDelete(doc.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
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
                      {totalPages > 0 && (
                        <PaginationItem>
                          <PaginationLink isActive={currentPage === 1} onClick={() => handlePageChange(1)}>1</PaginationLink>
                        </PaginationItem>
                      )}
                      {currentPage > 3 && totalPages > 4 && (
                        <PaginationItem><PaginationEllipsis /></PaginationItem>
                      )}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page !== 1 && page !== totalPages && Math.abs(currentPage - page) <= 1)
                        .map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink isActive={currentPage === page} onClick={() => handlePageChange(page)}>{page}</PaginationLink>
                          </PaginationItem>
                        ))}
                      {currentPage < totalPages - 2 && totalPages > 4 && (
                        <PaginationItem><PaginationEllipsis /></PaginationItem>
                      )}
                      {totalPages > 1 && (
                        <PaginationItem>
                          <PaginationLink isActive={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
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

      {/* === Dialog 1: Upload Ijazah, Endorse & Medical Checkup === */}
      <Dialog open={isDocUploadOpen} onOpenChange={setIsDocUploadOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Ijazah, Endorse & Medical Checkup</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {Object.entries(docFields).map(([name, field]) => (
              <div key={name} className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{name}</h4>
                <div className="space-y-2">
                  <Label>File</Label>
                  {field.file ? (
                    <div className="group relative flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <ScanLine className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{field.file.name}</p>
                        <p className="text-xs text-zinc-500">{(field.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDocFieldChange(name, { file: null })}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <FileDropzone
                      accept=".jpeg,.jpg,.png,.pdf"
                      maxFiles={1}
                      onFilesAdded={(files) => handleDocFieldChange(name, { file: files[0] ?? null })}
                      className="h-32" 
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nomor Sertifikat</Label>
                  <Input
                    placeholder={`Nomor ${name}`}
                    value={field.nomorSertifikat}
                    onChange={(e) => handleDocFieldChange(name, { nomorSertifikat: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocUploadOpen(false)}>Batal</Button>
            <Button
              onClick={handleDocUploadSubmit}
              disabled={!Object.values(docFields).some(f => f.file && f.nomorSertifikat) || createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />Upload</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Dialog 2: Upload Sertifikat (Bulk + OCR Scan) === */}
      <Dialog open={isSertifikatUploadOpen} onOpenChange={closeSertifikatDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Sertifikat</DialogTitle>
          </DialogHeader>

          {scanStep === "upload" ? (
            /* Step 1: File selection + Scan */
            <div className="space-y-6 py-4">
              <FileDropzone
                accept=".jpeg,.jpg,.png"
                onFilesAdded={(files) => {
                  setSertifikatFiles(prev => [...prev, ...files])
                }}
              />

              {sertifikatFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Files ({sertifikatFiles.length})</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setSertifikatFiles([])}
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {sertifikatFiles.map((f, i) => (
                      <div key={i} className="group relative flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          <ScanLine className="h-5 w-5 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{f.name}</p>
                          <p className="text-xs text-zinc-500">{(f.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            onClick={() => {
                              setPreviewFile(f)
                              setIsPreviewOpen(true)
                            }}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => setSertifikatFiles(prev => prev.filter((_, idx) => idx !== i))}
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={closeSertifikatDialog}>Batal</Button>
                <Button
                  onClick={handleScan}
                  disabled={sertifikatFiles.length === 0 || scanMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {scanMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scanning...</>
                  ) : (
                    <><ScanLine className="mr-2 h-4 w-4" />Scan {sertifikatFiles.length > 0 && `(${sertifikatFiles.length})`}</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Step 2: Preview scan results */
            <div className="space-y-4 py-4">
              <p className="text-sm text-zinc-500">
                Hasil scan OCR. Edit nama sertifikat dan masukkan nomor sertifikat sebelum submit.
              </p>

              <div className="space-y-6">
                {scanResults.map((item, index) => (
                  <div key={index} className="rounded-lg border border-zinc-200 p-4 space-y-3 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    {/* Image Preview */}
                    <div 
                      className="relative h-48 w-full bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 cursor-zoom-in group-hover:opacity-95 transition-opacity group"
                      onClick={() => {
                        if (sertifikatFiles[index]) {
                          setPreviewFile(sertifikatFiles[index])
                          setIsPreviewOpen(true)
                        }
                      }}
                    >
                      {sertifikatFiles[index] && (
                        <img
                          src={URL.createObjectURL(sertifikatFiles[index])}
                          alt={`Preview ${item.originalName}`}
                          className="h-full w-full object-contain"
                        />
                      )}
                      
                      {/* Explicit Expand Button */}
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (sertifikatFiles[index]) {
                            setPreviewFile(sertifikatFiles[index])
                            setIsPreviewOpen(true)
                          }
                        }}
                        title="Perbesar Preview"
                        type="button"
                      >
                        <Maximize2 className="h-4 w-4 text-zinc-700" />
                      </Button>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                         <div className="bg-white/90 dark:bg-black/90 p-2 rounded-full shadow-lg">
                           <ZoomIn className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 truncate max-w-[200px]">{item.originalName}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        item.status === "auto_approved" ? "bg-green-100 text-green-700" :
                        item.status === "failed" || item.status === "error" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {item.status === "auto_approved" ? "Auto" : item.status}
                        {item.confidence > 0 && ` (${(item.confidence * 100).toFixed(0)}%)`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Nama Sertifikat</Label>
                      {item.isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={item.editedName}
                            onChange={(e) => handleScanResultEdit(index, { editedName: e.target.value })}
                            className="flex-1"
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleScanResultEdit(index, { isEditing: false })}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex-1">
                            {item.editedName || item.trainingName || "(Tidak terdeteksi)"}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => handleScanResultEdit(index, { isEditing: true, editedName: item.editedName || item.trainingName })}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Nomor Sertifikat</Label>
                      <Input
                        placeholder="Masukkan nomor sertifikat"
                        value={item.nomorSertifikat}
                        onChange={(e) => handleScanResultEdit(index, { nomorSertifikat: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setScanStep("upload")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Kembali
                </Button>
                <Button
                  onClick={handleBulkSubmit}
                  disabled={
                    scanResults.some(r => !r.nomorSertifikat || !(r.editedName || r.trainingName)) ||
                    createMutation.isPending || isUploading
                  }
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {(createMutation.isPending || isUploading) ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan ({uploadProgress}/{scanResults.length})...</>
                  ) : (
                    <><Check className="mr-2 h-4 w-4" />Simpan {scanResults.length} Sertifikat</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === Dialog: Edit Certificate === */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { setIsEditOpen(false); setEditingCert(null); } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Sertifikat</DialogTitle>
          </DialogHeader>
          {editingCert && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Dokumen</Label>
                <Input
                  value={editingCert.certificateName}
                  onChange={(e) => setEditingCert({ ...editingCert, certificateName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor Sertifikat</Label>
                <Input
                  value={editingCert.nomorSertifikat}
                  onChange={(e) => setEditingCert({ ...editingCert, nomorSertifikat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Ulang File (opsional)</Label>
                {editingCert.file ? (
                  <div className="group relative flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <ScanLine className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{editingCert.file.name}</p>
                      <p className="text-xs text-zinc-500">{(editingCert.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setEditingCert({ ...editingCert, file: null })}
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <FileDropzone
                    accept=".jpeg,.jpg,.png,.pdf"
                    maxFiles={1}
                    onFilesAdded={(files) => setEditingCert({ ...editingCert, file: files[0] ?? null })}
                    className="h-32"
                  />
                )}
                <p className="text-xs text-zinc-500">Kosongkan jika tidak ingin mengganti file.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingCert(null); }}>Batal</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!editingCert?.certificateName || !editingCert?.nomorSertifikat || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Check className="mr-2 h-4 w-4" />Simpan</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
