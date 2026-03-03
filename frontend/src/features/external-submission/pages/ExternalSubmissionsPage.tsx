import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetExternalSubmissions } from '../_hooks/useGetExternalSubmissions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Eye } from 'lucide-react';

export function ExternalSubmissionsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: submissions, isLoading } = useGetExternalSubmissions(statusFilter || undefined);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">External Submissions</h1>
          <p className="text-sm text-zinc-500 mt-1">Review certificate submissions from SPIL</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('APPROVED')}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('REJECTED')}
          >
            Rejected
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-2 text-sm font-medium text-zinc-900">No submissions</h3>
            <p className="mt-1 text-sm text-zinc-500">No submissions found with the selected filter.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seaman Code</TableHead>
                <TableHead>Seaman Name</TableHead>
                <TableHead>Certificate Name</TableHead>
                <TableHead>Nomor Sertifikat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.seamanCode}</TableCell>
                  <TableCell>{submission.seamanName}</TableCell>
                  <TableCell>{submission.certificateName}</TableCell>
                  <TableCell>{submission.nomorSertifikat}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(submission.status)}`}>
                      {submission.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/external-submissions/${submission.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
