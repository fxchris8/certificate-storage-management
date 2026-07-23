import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Trash2,
  Upload,
  Loader2,
  ScanLine,
  Check,
  Pencil,
  FileUp,
  Download,
  ZoomIn,
  Maximize2,
  ArrowLeft,
  Eye,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FileDropzone } from "@/components/ui/file-dropzone";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";
import { toast } from "sonner";

import { useCrewSubmissions } from "../_hooks/useCrewSubmissions";
import {
  useCrewScanCertificates,
  useCreateCrewSubmission,
} from "../_hooks/useCrewUpload";
import { useDeleteCrewSubmission } from "../_hooks/useDeleteCrewSubmission";
import type { CrewSubmission } from "../types/crew.types";
import { api } from "@/lib/api";

// ─── Constants & Schemas ───────────────────────────────────────────────────
const SCAN_BATCH_SIZE = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ACCEPTED_DOC_TYPES = [...ACCEPTED_IMAGE_TYPES, "application/pdf"];
const MANDATORY_DOCUMENT_NAMES = [
  "Ijazah",
  "Endorse",
  "Medical Checkup",
] as const;

type MandatoryDocumentName = (typeof MANDATORY_DOCUMENT_NAMES)[number];

const docUploadSchema = z
  .object({
    file: z
      .instanceof(File)
      .optional()
      .nullable()
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        `Max file size is 5MB.`,
      )
      .refine(
        (file) => !file || ACCEPTED_DOC_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png and .pdf formats are supported.",
      ),
    nomorSertifikat: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasFile = !!value.file;
    const hasNomorSertifikat = !!value.nomorSertifikat?.trim();

    if (!hasFile && !hasNomorSertifikat) return;

    if (!hasFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File harus diisi",
        path: ["file"],
      });
    }

    if (!hasNomorSertifikat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor Sertifikat harus diisi",
        path: ["nomorSertifikat"],
      });
    }
  });

const uploadFormSchema = z.record(z.string(), docUploadSchema).refine(
  (data) => {
    const hasFile = Object.values(data).some((val) => val && val.file);
    return hasFile;
  },
  {
    message: "Minimal satu dokumen harus diupload",
    path: ["root"],
  },
);

type UploadFormValues = z.infer<typeof uploadFormSchema>;

const createUploadFormDefaults = (): UploadFormValues =>
  Object.fromEntries(
    MANDATORY_DOCUMENT_NAMES.map((name) => [
      name,
      { file: undefined, nomorSertifikat: "" },
    ]),
  );

interface ScanPreviewItem {
  originalName: string;
  filePath: string;
  trainingName: string;
  confidence: number;
  status: string;
  nomorSertifikat: string;
  isEditing: boolean;
  editedName: string;
  certificate_id?: string;
  confidence_id?: number;
  raw_text?: string;
  isEditingNomor?: boolean;
}

interface ScanProgressState {
  completedFiles: number;
  totalFiles: number;
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CrewSubmission["status"] }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
        APPROVED
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
        REJECTED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
      PENDING
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function CrewSubmissionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Dialog: Upload (Ijazah, Endorse, Medical)
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);

  // Dialog: Upload (OCR scan)
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Delete confirm dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: createUploadFormDefaults(),
    mode: "onChange",
    shouldUnregister: true,
  });

  // OCR / scan state
  const [scanFiles, setScanFiles] = useState<File[]>([]);
  const [scanResults, setScanResults] = useState<ScanPreviewItem[]>([]);
  const [scanStep, setScanStep] = useState<"upload" | "preview">("upload");
  const [scanProgress, setScanProgress] = useState<ScanProgressState | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Preview
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useCrewSubmissions({
    page: currentPage,
    limit: 10,
    search: search || undefined,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const scanMutation = useCrewScanCertificates();
  const createMutation = useCreateCrewSubmission();
  const deleteMutation = useDeleteCrewSubmission();

  const submissions = data?.submissions ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  // Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ── Scan flow ──────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (scanFiles.length === 0) return;
    try {
      const allResults: ScanPreviewItem[] = [];
      setScanProgress({ completedFiles: 0, totalFiles: scanFiles.length });

      for (let i = 0; i < scanFiles.length; i += SCAN_BATCH_SIZE) {
        const batch = scanFiles.slice(i, i + SCAN_BATCH_SIZE);
        const formData = new FormData();
        batch.forEach((file) => formData.append("files", file));

        const results = await scanMutation.mutateAsync(formData);
        allResults.push(
          ...results.map((r) => ({
            ...r,
            nomorSertifikat: r.certificate_id || "",
            isEditing: false,
            isEditingNomor: false,
            editedName: r.trainingName,
          })),
        );
        setScanProgress((prev) =>
          prev
            ? {
                ...prev,
                completedFiles: Math.min(
                  prev.completedFiles + batch.length,
                  prev.totalFiles,
                ),
              }
            : prev,
        );
      }

      setScanResults(allResults);
      setScanStep("preview");
    } catch {
      toast.error(
        "Scan gagal. Coba kurangi jumlah file per proses atau ulangi lagi.",
      );
    } finally {
      setScanProgress(null);
    }
  };

  const handleScanResultEdit = useCallback(
    (index: number, field: Partial<ScanPreviewItem>) => {
      setScanResults((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...field } : item)),
      );
    },
    [],
  );

  const handleBulkSubmit = async () => {
    // Validate
    for (const result of scanResults) {
      const certName = result.editedName || result.trainingName;
      if (!certName || !result.nomorSertifikat) {
        toast.error(
          `Lengkapi nama sertifikat dan nomor sertifikat sebelum submit.`,
        );
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let completed = 0;
      for (let i = 0; i < scanResults.length; i++) {
        const result = scanResults[i];
        const file = scanFiles[i];
        if (!result || !file) continue;

        const formData = new FormData();
        formData.append(
          "certificateName",
          result.editedName || result.trainingName,
        );
        formData.append("nomorSertifikat", result.nomorSertifikat);
        formData.append("file", file);

        await createMutation.mutateAsync(formData);
        completed++;
        setUploadProgress(completed);
      }
      toast.success(`${completed} sertifikat berhasil diajukan.`);
      closeUploadDialog();
    } catch {
      toast.error("Upload sertifikat gagal. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const closeUploadDialog = () => {
    setIsUploadOpen(false);
    setScanFiles([]);
    setScanResults([]);
    setScanStep("upload");
    setScanProgress(null);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDocUploadDialogChange = (open: boolean) => {
    setIsDocUploadOpen(open);
    uploadForm.reset(createUploadFormDefaults());
  };

  const onUploadSubmit = async (formDataValues: UploadFormValues) => {
    const entries = Object.entries(formDataValues).filter(
      ([, v]) => v && v.file && v.nomorSertifikat,
    ) as [string, { file: File; nomorSertifikat: string }][];

    if (entries.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let completed = 0;
      for (const [certificateName, { file, nomorSertifikat }] of entries) {
        const formData = new FormData();
        formData.append("certificateName", certificateName);
        formData.append("nomorSertifikat", nomorSertifikat);
        formData.append("file", file);
        await createMutation.mutateAsync(formData);
        completed++;
        setUploadProgress(completed);
      }
      toast.success(`${completed} dokumen berhasil diajukan.`);
      setIsDocUploadOpen(false);
      uploadForm.reset(createUploadFormDefaults());
    } catch {
      toast.error("Upload dokumen gagal. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = useCallback(
    async (id: string, certificateName: string) => {
      try {
        const response = await api.get(
          `/external-submissions/${id}/view?raw=1`,
          { responseType: "blob" },
        );
        const contentType =
          response.headers["content-type"] || "application/octet-stream";
        const blob = new Blob([response.data], { type: contentType });

        let ext = ".pdf";
        if (contentType.includes("jpeg") || contentType.includes("jpg"))
          ext = ".jpg";
        if (contentType.includes("png")) ext = ".png";

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${certificateName}${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to download certificate:", error);
        toast.error("Gagal mendownload sertifikat");
      }
    },
    [],
  );

  const handleView = useCallback(async (id: string) => {
    try {
      const response = await api.get(`/external-submissions/${id}/view?raw=1`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to view certificate:", error);
      toast.error("Gagal membuka sertifikat");
    }
  }, []);

  // ── Delete flow ────────────────────────────────────────────────────────────
  const handleDeleteOpen = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setDeleteId(null);
      },
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Certificate Submissions
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            List of certificates that you have submitted for verification.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setIsDocUploadOpen(true)}
            className="h-11 border-zinc-200 bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 shadow-lg text-white border-0 transition-all hover:scale-105 active:scale-95"
          >
            <FileUp className="mr-2 h-5 w-5" />
            Upload Ijazah, Endorse & Medical
          </Button>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="h-11 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 text-white border-0 transition-all hover:scale-105 active:scale-95"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Sertifikat
          </Button>
        </div>
      </div>

      {/* Submissions Table */}
      <Card className="border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Riwayat Pengajuan
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari nama sertifikat atau nomor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              <span className="ml-3 text-zinc-500">Memuat data...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-red-500">
              Gagal memuat data pengajuan.
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3">
              <ScanLine className="h-12 w-12 opacity-30" />
              <p className="font-medium">
                {search ? "Sertifikat tidak ditemukan" : "Belum ada pengajuan sertifikat"}
              </p>
              <p className="text-sm">
                {search
                  ? "Coba kata kunci pencarian yang lain."
                  : 'Klik "Upload Sertifikat" untuk mulai mengajukan.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                    <TableRow className="hover:bg-zinc-50/50 border-b-zinc-100 dark:border-b-zinc-800">
                      <TableHead className="w-[50px] font-semibold">
                        No
                      </TableHead>
                      <TableHead className="font-semibold">
                        Nama Sertifikat
                      </TableHead>
                      <TableHead className="font-semibold">
                        Nomor Sertifikat
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">
                        Submitted At
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub: CrewSubmission, index: number) => (
                      <TableRow
                        key={sub.id}
                        className="border-b-zinc-50 dark:border-b-zinc-900 hover:bg-zinc-50/50"
                      >
                        <TableCell className="font-medium text-zinc-500">
                          {(currentPage - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {sub.certificateName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-900 dark:text-zinc-400">
                            {sub.nomorSertifikat}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={sub.status} />
                        </TableCell>
                        <TableCell className="text-sm text-zinc-500">
                          {new Date(sub.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {sub.externalFileUrl && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleView(sub.id)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      handleDownload(
                                        sub.id,
                                        sub.certificateName,
                                      )
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                </>
                              )}
                              {sub.status === "PENDING" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteOpen(sub.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              )}
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
                        className={cn(
                          currentPage === 1 &&
                            "pointer-events-none opacity-50 cursor-not-allowed",
                        )}
                      />
                    </PaginationItem>
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
                    {currentPage > 3 && totalPages > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page !== 1 &&
                          page !== totalPages &&
                          Math.abs(currentPage - page) <= 1,
                      )
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
                    {currentPage < totalPages - 2 && totalPages > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
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
                        className={cn(
                          currentPage === totalPages &&
                            "pointer-events-none opacity-50 cursor-not-allowed",
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Dialog: Upload Sertifikat (OCR Scan) ═══════════════════════════ */}
      <Dialog open={isUploadOpen} onOpenChange={closeUploadDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Upload Sertifikat
            </DialogTitle>
          </DialogHeader>

          {scanStep === "upload" ? (
            /* Step 1: Pilih file + Scan */
            <div className="space-y-6 py-4">
              <FileDropzone
                accept=".jpeg,.jpg,.png"
                onFilesAdded={(files) => {
                  setScanFiles((prev) => [...prev, ...files]);
                }}
              />

              {scanFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Files ({scanFiles.length})
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setScanFiles([])}
                    >
                      Clear All
                    </Button>
                  </div>

                  {scanProgress && (
                    <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-200">
                      <div className="font-medium">
                        Scanning {scanProgress.completedFiles}/
                        {scanProgress.totalFiles} file
                        {scanProgress.totalFiles > 1 ? "s" : ""}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2">
                    {scanFiles.map((f, i) => (
                      <div
                        key={i}
                        className="group relative flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          <ScanLine className="h-5 w-5 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {f.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {(f.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            onClick={() => {
                              setPreviewFile(f);
                              setIsPreviewOpen(true);
                            }}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() =>
                              setScanFiles((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
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
                <Button variant="outline" onClick={closeUploadDialog}>
                  Batal
                </Button>
                <Button
                  onClick={handleScan}
                  disabled={scanFiles.length === 0 || scanMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {scanMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {scanProgress
                        ? `Scanning ${scanProgress.completedFiles}/${scanProgress.totalFiles}...`
                        : "Scanning..."}
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2 h-4 w-4" />
                      Scan {scanFiles.length > 0 && `(${scanFiles.length})`}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Step 2: Preview hasil OCR — edit nama & nomor sertifikat */
            <div className="space-y-4 py-4">
              <p className="text-sm text-zinc-500">
                Hasil scan OCR. Edit nama sertifikat dan masukkan nomor
                sertifikat sebelum submit.
              </p>

              <div className="space-y-6">
                {scanResults.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-zinc-200 p-4 space-y-3 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    {/* Image Preview */}
                    <div
                      className="relative h-48 w-full bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 cursor-zoom-in group"
                      onClick={() => {
                        if (scanFiles[index]) {
                          setPreviewFile(scanFiles[index]);
                          setIsPreviewOpen(true);
                        }
                      }}
                    >
                      {scanFiles[index] && (
                        <img
                          src={URL.createObjectURL(scanFiles[index])}
                          alt={`Preview ${item.originalName}`}
                          className="h-full w-full object-contain"
                        />
                      )}
                      <Button
                        variant="secondary"
                        size="icon"
                        type="button"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (scanFiles[index]) {
                            setPreviewFile(scanFiles[index]);
                            setIsPreviewOpen(true);
                          }
                        }}
                      >
                        <Maximize2 className="h-4 w-4 text-zinc-700" />
                      </Button>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                        <div className="bg-white/90 dark:bg-black/90 p-2 rounded-full shadow-lg">
                          <ZoomIn className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                      </div>
                    </div>

                    {/* Status & filename */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                        {item.originalName}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          item.status === "auto_approved"
                            ? "bg-green-100 text-green-700"
                            : item.status === "failed" ||
                                item.status === "error"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700",
                        )}
                      >
                        {item.status === "auto_approved" ? "Auto" : item.status}
                        {item.confidence > 0 &&
                          ` (${(item.confidence * 100).toFixed(0)}%)`}
                      </span>
                    </div>

                    {/* Nama Sertifikat */}
                    <div className="space-y-2">
                      <Label className="text-xs">Nama Sertifikat</Label>
                      {item.isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={item.editedName}
                            onChange={(e) =>
                              handleScanResultEdit(index, {
                                editedName: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleScanResultEdit(index, { isEditing: false })
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex-1">
                            {item.editedName ||
                              item.trainingName ||
                              "(Tidak terdeteksi)"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleScanResultEdit(index, {
                                isEditing: true,
                                editedName:
                                  item.editedName || item.trainingName,
                              })
                            }
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Nomor Sertifikat */}
                    <div className="space-y-2">
                      <Label className="text-xs">
                        Nomor Sertifikat <span className="text-red-500">*</span>
                      </Label>
                      {item.isEditingNomor ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Masukkan nomor sertifikat"
                            value={item.nomorSertifikat}
                            onChange={(e) =>
                              handleScanResultEdit(index, {
                                nomorSertifikat: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleScanResultEdit(index, {
                                isEditingNomor: false,
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex-1 font-medium",
                              !item.nomorSertifikat
                                ? "text-zinc-400 italic"
                                : "text-zinc-900 dark:text-zinc-100",
                            )}
                          >
                            {item.nomorSertifikat ||
                              "(Klik pensil untuk input)"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleScanResultEdit(index, {
                                isEditingNomor: true,
                                nomorSertifikat: item.nomorSertifikat,
                              })
                            }
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setScanStep("upload")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Button>
                <Button
                  onClick={handleBulkSubmit}
                  disabled={
                    scanResults.some(
                      (r) =>
                        !r.nomorSertifikat || !(r.editedName || r.trainingName),
                    ) ||
                    createMutation.isPending ||
                    isUploading
                  }
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {createMutation.isPending || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan ({uploadProgress}/{scanResults.length})...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Ajukan {scanResults.length} Sertifikat
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog: Konfirmasi Hapus ════════════════════════════════════════ */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] p-6 border-0 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Hapus Pengajuan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Apakah Anda yakin ingin menghapus sertifikat ini? Tindakan ini tidak
            dapat dibatalkan.
          </p>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="h-11 px-6 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog: Upload Ijazah, Endorse, Medical ══════════════════════════ */}
      <Dialog open={isDocUploadOpen} onOpenChange={handleDocUploadDialogChange}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Upload Ijazah, Endorse & Medical Checkup
            </DialogTitle>
          </DialogHeader>

          <Form {...uploadForm}>
            <form
              onSubmit={uploadForm.handleSubmit(onUploadSubmit)}
              className="space-y-6 py-4"
            >
              {MANDATORY_DOCUMENT_NAMES.map((name) => (
                <div
                  key={name}
                  className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {name}
                  </h4>

                  {/* File Dropzone Field */}
                  <FormField
                    control={uploadForm.control}
                    // @ts-ignore - Dynamic string key
                    name={`${name}.file`}
                    render={({ field: { value, onChange } }) => {
                      const fileValue = value as File | null | undefined;
                      return (
                        <FormItem>
                          <FormLabel>File</FormLabel>
                          <FormControl>
                            {fileValue ? (
                              <div className="group relative flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                  <ScanLine className="h-5 w-5 text-zinc-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    {fileValue.name}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {(fileValue.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => {
                                    onChange(null);
                                  }}
                                  title="Remove"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <FileDropzone
                                accept=".jpeg,.jpg,.png,.pdf"
                                maxFiles={1}
                                onFilesAdded={(files) =>
                                  onChange(files[0] ?? null)
                                }
                                className="h-32"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Nomor Sertifikat Field */}
                  <FormField
                    control={uploadForm.control}
                    // @ts-ignore
                    name={`${name}.nomorSertifikat`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nomor Sertifikat
                          {/* Show asterisk if file is selected */}
                          {
                            // @ts-ignore
                            uploadForm.watch(`${name}.file`) && (
                              <span className="text-red-500 ml-1">*</span>
                            )
                          }
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Nomor ${name}`}
                            {...field}
                            value={(field.value as string) || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDocUploadDialogChange(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    isUploading ||
                    !uploadForm.formState.isValid
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createMutation.isPending || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengupload ({uploadProgress})...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <FilePreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewFile}
      />
    </div>
  );
}

export default CrewSubmissionsPage;
