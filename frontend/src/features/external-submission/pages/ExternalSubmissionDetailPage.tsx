import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetExternalSubmissionById } from '../_hooks/useGetExternalSubmissionById';
import { useApproveSubmission } from '../_hooks/useApproveSubmission';
import { useRejectSubmission } from '../_hooks/useRejectSubmission';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export function ExternalSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: submission, isLoading } = useGetExternalSubmissionById(id!);
  const { mutate: approve, isPending: isApproving } = useApproveSubmission();
  const { mutate: reject, isPending: isRejecting } = useRejectSubmission();

  const [reviewNotes, setReviewNotes] = useState('');

  const handleApprove = () => {
    if (!window.confirm('Approve this certificate submission?')) return;
    approve(
      { id: id!, data: { reviewNotes: reviewNotes.trim() || '' } },
      {
        onSuccess: () => navigate('/dashboard/external-submissions'),
      }
    );
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) {
      alert('Review notes wajib diisi saat menolak submission');
      return;
    }
    if (!window.confirm('Reject this certificate submission?')) return;
    reject(
      { id: id!, data: { reviewNotes } },
      {
        onSuccess: () => navigate('/dashboard/external-submissions'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center text-zinc-500">Submission not found</div>
      </div>
    );
  }

  const isPending = submission.status === 'PENDING';

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/external-submissions')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Review Submission</h1>
          <p className="text-sm text-zinc-500 mt-1">Review and approve or reject this submission</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Submission Details</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-500">Seaman Code</Label>
              <p className="text-zinc-900 font-medium">{submission.seamanCode}</p>
            </div>
            <div>
              <Label className="text-zinc-500">Seaman Name</Label>
              <p className="text-zinc-900 font-medium">{submission.seamanName}</p>
            </div>
            <div>
              <Label className="text-zinc-500">Certificate Name</Label>
              <p className="text-zinc-900 font-medium">{submission.certificateName}</p>
            </div>
            <div>
              <Label className="text-zinc-500">Nomor Sertifikat</Label>
              <p className="text-zinc-900 font-medium">{submission.nomorSertifikat}</p>
            </div>
            <div>
              <Label className="text-zinc-500">Status</Label>
              <p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  submission.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {submission.status}
                </span>
              </p>
            </div>
            <div>
              <Label className="text-zinc-500">Submitted At</Label>
              <p className="text-zinc-900">
                {new Date(submission.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
            {submission.reviewedAt && (
              <>
                <div>
                  <Label className="text-zinc-500">Reviewed At</Label>
                  <p className="text-zinc-900">
                    {new Date(submission.reviewedAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500">Review Notes</Label>
                  <p className="text-zinc-900">{submission.reviewNotes}</p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Certificate Preview</h2>
          <div className="aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden">
            <iframe
              src={`http://localhost:5000/api/external-submissions/${id}/view`}
              className="w-full h-full"
              title="Certificate Preview"
            />
          </div>
        </Card>
      </div>

      {isPending && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Review Action</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes <span className="text-zinc-400 text-xs font-normal">(wajib diisi saat reject)</span></Label>
              <textarea
                id="reviewNotes"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Provide your review notes here..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={isApproving || isRejecting}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
