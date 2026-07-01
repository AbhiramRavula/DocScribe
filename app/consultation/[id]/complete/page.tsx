'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Printer,
  MessageCircle,
  FileText,
  ArrowLeft,
  Clock,
} from 'lucide-react';

interface CompleteData {
  patientName: string;
  whatsappSent: boolean;
  printed: boolean;
}

export default function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: consultationId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CompleteData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`complete-${consultationId}`);
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, [consultationId]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-6 sm:p-8 text-center max-w-sm w-full">
          <p className="text-surface-500">No consultation data found.</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="glass-card p-6 sm:p-8 max-w-md w-full text-center animate-scale-in">
        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-5 sm:mb-6">
          <CheckCircle2 size={36} className="text-success-500" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-surface-900 mb-2">
          Done - {data.patientName}
        </h1>
        <p className="text-surface-500 text-sm mb-6 sm:mb-8">
          Consultation completed successfully
        </p>

        {/* Status items */}
        <div className="space-y-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              data.printed ? 'bg-success-50 text-success-600' : 'bg-surface-200 text-surface-400'
            }`}>
              <Printer size={16} />
            </div>
            <span className="text-sm text-surface-700 flex-1 text-left">
              Printed to clinic printer
            </span>
            <span className={`text-sm font-medium ${
              data.printed ? 'text-success-600' : 'text-surface-400'
            }`}>
              {data.printed ? 'Done' : '--'}
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              data.whatsappSent ? 'bg-success-50 text-success-600' : 'bg-surface-200 text-surface-400'
            }`}>
              <MessageCircle size={16} />
            </div>
            <span className="text-sm text-surface-700 flex-1 text-left">
              WhatsApp sent
            </span>
            <span className={`text-sm font-medium ${
              data.whatsappSent ? 'text-success-600' : 'text-surface-400'
            }`}>
              {data.whatsappSent ? 'Done' : '--'}
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <div className="w-8 h-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <span className="text-sm text-surface-700 flex-1 text-left">
              PDF saved to history
            </span>
            <span className="text-sm font-medium text-success-600">Done</span>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center justify-center gap-2 text-sm text-surface-500 mb-6 sm:mb-8">
          <Clock size={14} />
          <span>Consultation recorded</span>
        </div>

        {/* Action */}
        <button
          onClick={() => router.push('/')}
          className="btn-primary w-full py-3"
        >
          <ArrowLeft size={16} />
          Next Patient
        </button>
      </div>
    </div>
  );
}
