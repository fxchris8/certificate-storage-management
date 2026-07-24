import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetExternalSubmissionsGrouped, GroupedSeafarer } from '../_hooks/useGetExternalSubmissionsGrouped';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Eye, Search, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LIMIT = 10;

export function ExternalSubmissionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useGetExternalSubmissionsGrouped(
    page,
    LIMIT,
    search || undefined
  );

  const groupedSeafarers = data?.submissions ?? [];
  const pagination = data?.pagination;

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.totalCount ?? 0;
  const startIndex = (page - 1) * LIMIT;

  const handleRowClick = (seafarerCode: string) => {
    navigate(`/dashboard/external-submissions/seafarer/${seafarerCode}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">External Submissions</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Review certificate submissions grouped by seafarer</p>
        </div>
      </div>

      <Card className="border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by code or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10 bg-white border-zinc-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load data.</div>
        ) : groupedSeafarers.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-2 text-sm font-medium text-zinc-900">No submissions found</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {search
                ? 'No seafarers match your search.'
                : 'No external submissions are available.'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                <TableRow>
                  <TableHead className="w-[80px] font-semibold">No</TableHead>
                  <TableHead className="font-semibold">Seafarer Code</TableHead>
                  <TableHead className="font-semibold">Seafarer Name</TableHead>
                  <TableHead className="font-semibold text-center">Pending</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedSeafarers.map((seafarer: GroupedSeafarer, index: number) => (
                  <TableRow 
                    key={seafarer.seafarerCode}
                    onClick={() => handleRowClick(seafarer.seafarerCode)}
                    className="cursor-pointer hover:bg-zinc-50/50"
                  >
                    <TableCell className="font-medium text-zinc-500">{startIndex + index + 1}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-900 dark:text-zinc-400">
                        {seafarer.seafarerCode}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{seafarer.seafarerName}</TableCell>
                    <TableCell className="text-center">
                      {seafarer.pendingSubmissions > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          {seafarer.pendingSubmissions} Pending
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-sm">0</span>
                      )}
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
                            onClick={() => handleRowClick(seafarer.seafarerCode)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
                <p className="text-sm text-zinc-500">
                  Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400 text-sm">…</span>
                      ) : (
                        <Button
                          key={item}
                          variant={page === item ? 'default' : 'outline'}
                          size="sm"
                          className="min-w-[32px]"
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
