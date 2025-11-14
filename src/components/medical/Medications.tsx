import { useEffect, useState } from 'react';
import { Pill, Calendar, User, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Medication } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export function Medications() {
  const { profile } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'past' | 'all'>('active');

  useEffect(() => {
    if (profile) {
      loadMedications();
    }
  }, [profile, filter]);

  async function loadMedications() {
    try {
      setLoading(true);
      let query = supabase
        .from('medications')
        .select(`
          *,
          doctor:profiles!medications_prescribed_by_fkey(id, full_name, specialization)
        `)
        .order('start_date', { ascending: false });

      if (profile?.role === 'patient') {
        query = query.eq('patient_id', profile.id);
      }

      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'past') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex gap-2">
        {(['active', 'past', 'all'] as const).map((type) => (
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

      {medications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No medications found</p>
          <p className="text-gray-500 text-sm mt-2">Your prescriptions will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((medication) => (
            <div
              key={medication.id}
              className={`bg-white rounded-lg border-2 p-6 transition-all ${
                medication.is_active
                  ? 'border-blue-200 hover:border-blue-400'
                  : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${
                    medication.is_active ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <Pill
                    className={`w-5 h-5 ${
                      medication.is_active ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {medication.medication_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{medication.dosage}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{medication.frequency}</span>
                  </div>
                </div>
                {medication.is_active && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Started: {new Date(medication.start_date).toLocaleDateString()}
                  </span>
                </div>
                {medication.end_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Ended: {new Date(medication.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {medication.doctor && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Prescribed by Dr. {medication.doctor.full_name}</span>
                  </div>
                )}
              </div>

              {medication.is_active && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Remember to take this medication as prescribed
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
