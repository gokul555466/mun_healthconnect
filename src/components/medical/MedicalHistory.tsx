import { useEffect, useState } from 'react';
import { FileText, AlertCircle, Activity, Stethoscope, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MedicalHistory as MedicalHistoryType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export function MedicalHistory() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<MedicalHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'diagnosis' | 'procedure' | 'allergy' | 'condition'>('all');

  useEffect(() => {
    if (profile) {
      loadRecords();
    }
  }, [profile, filter]);

  async function loadRecords() {
    try {
      setLoading(true);
      let query = supabase
        .from('medical_history')
        .select(`
          *,
          doctor:profiles!medical_history_doctor_id_fkey(id, full_name, specialization)
        `)
        .order('date_recorded', { ascending: false });

      if (profile?.role === 'patient') {
        query = query.eq('patient_id', profile.id);
      }

      if (filter !== 'all') {
        query = query.eq('record_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setLoading(false);
    }
  }

  function getRecordIcon(type: string) {
    switch (type) {
      case 'diagnosis':
        return <Stethoscope className="w-5 h-5" />;
      case 'procedure':
        return <Activity className="w-5 h-5" />;
      case 'allergy':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  }

  function getRecordColor(type: string) {
    switch (type) {
      case 'diagnosis':
        return 'bg-blue-100 text-blue-600';
      case 'procedure':
        return 'bg-green-100 text-green-600';
      case 'allergy':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  function exportRecords() {
    const csvContent = [
      ['Date', 'Type', 'Title', 'Description', 'Doctor'].join(','),
      ...records.map((record) =>
        [
          new Date(record.date_recorded).toLocaleDateString(),
          record.record_type,
          `"${record.title}"`,
          `"${record.description || ''}"`,
          record.doctor?.full_name || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'diagnosis', 'procedure', 'allergy', 'condition'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        {records.length > 0 && (
          <button
            onClick={exportRecords}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No medical records found</p>
          <p className="text-gray-500 text-sm mt-2">Your medical history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getRecordColor(record.record_type)}`}>
                  {getRecordIcon(record.record_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{record.record_type}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(record.date_recorded).toLocaleDateString()}
                    </span>
                  </div>
                  {record.description && (
                    <p className="text-gray-700 mb-3">{record.description}</p>
                  )}
                  {record.doctor && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Recorded by:</span>
                      <span>Dr. {record.doctor.full_name}</span>
                      {record.doctor.specialization && (
                        <span className="text-gray-500">({record.doctor.specialization})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
