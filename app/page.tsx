'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Plus,
  Clock,
  Phone,
  User,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { PatientGender } from '@/types';

const MOCK_DOCTOR = {
  id: 'demo-doctor-1',
  full_name: 'Dr. Ravi Kumar',
  clinic_name: 'HealthFirst Clinic',
  email: 'ravi@healthfirst.in',
};

const MOCK_HISTORY = [
  { id: '1', name: 'Priya Sharma', diagnosis: 'Diabetes, HTN', time: '11:45 AM', status: 'complete' },
  { id: '2', name: 'Kiran Reddy', diagnosis: 'Viral fever', time: '11:30 AM', status: 'complete' },
  { id: '3', name: 'Suresh Kumar', diagnosis: 'Follow-up', time: '11:10 AM', status: 'complete' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<PatientGender | ''>('');
  const [isStarting, setIsStarting] = useState(false);

  const handleBeginConsultation = () => {
    if (!patientName.trim() || !patientPhone.trim()) return;

    setIsStarting(true);
    const consultationId = uuidv4();

    sessionStorage.setItem(
      `consultation-${consultationId}`,
      JSON.stringify({
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_age: patientAge ? parseInt(patientAge) : null,
        patient_gender: patientGender || null,
        doctor: MOCK_DOCTOR,
      }),
    );

    router.push(`/consultation/${consultationId}/record`);
  };

  const canStart = patientName.trim().length > 0 && patientPhone.trim().length >= 10;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-surface-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-surface-900">DocScribe</h1>
              <p className="text-xs text-surface-500 hidden sm:block">AI Medical Scribe</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-surface-700">{MOCK_DOCTOR.full_name}</p>
              <p className="text-xs text-surface-500">{MOCK_DOCTOR.clinic_name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {MOCK_DOCTOR.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Activity size={20} className="text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-800">12</p>
                <p className="text-xs text-surface-500">consultations today</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                <User size={20} className="text-success-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-800">67</p>
                <p className="text-xs text-surface-500">patients this week</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                <Clock size={20} className="text-warning-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-800">2:14</p>
                <p className="text-xs text-surface-500">avg. per consultation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* New Consultation Form */}
          <div className="lg:col-span-3">
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Plus size={18} className="text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-surface-800">New Consultation</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Patient Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Ramesh Kumar"
                      className="input pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Phone Number *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="input pl-9"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Age</label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="35"
                      className="input"
                      min={0}
                      max={120}
                    />
                  </div>
                  <div>
                    <label className="input-label">Gender</label>
                    <div className="flex gap-2 mt-1">
                      {(['M', 'F', 'Other'] as PatientGender[]).map((g) => (
                        <button
                          key={g}
                          onClick={() => setPatientGender(g)}
                          className={`chip flex-1 ${patientGender === g ? 'chip-active' : ''}`}
                        >
                          {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBeginConsultation}
                  disabled={!canStart || isStarting}
                  className="btn-primary w-full py-3 mt-2"
                >
                  <Stethoscope size={18} />
                  {isStarting ? 'Starting...' : 'Begin Consultation'}
                </button>
              </div>
            </div>
          </div>

          {/* Today's History */}
          <div className="lg:col-span-2">
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-surface-800">Today</h2>
                <span className="text-xs text-surface-500 bg-surface-100 px-2 py-1 rounded-full">
                  {MOCK_HISTORY.length} consultations
                </span>
              </div>

              <div className="space-y-2">
                {MOCK_HISTORY.map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center text-success-600 shrink-0">
                      <User size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-surface-500 truncate">
                        {item.diagnosis}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-surface-400">{item.time}</span>
                      <ChevronRight
                        size={14}
                        className="text-surface-300 group-hover:text-primary-500 transition-colors"
                      />
                    </div>
                  </button>
                ))}
              </div>

              <button className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                View all consultations
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
