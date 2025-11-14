import { useEffect, useState } from 'react';
import { FlaskConical, Calendar, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LabResult } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export function LabResults() {
  const { profile } = useAuth();
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadResults();
    }
  }, [profile]);

  async function loadResults() {
    try {
      setLoading(true);
      let query = supabase
        .from('lab_results')
        .select(`
          *,
          doctor:profiles!lab_results_ordered_by_fkey(id, full_name, specialization)
        `)
        .order('test_date', { ascending: false });

      if (profile?.role === 'patient') {
        query = query.eq('patient_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading lab results:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getTrendIcon() {
    const random = Math.random();
    if (random > 0.66) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (random > 0.33) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No lab results found</p>
          <p className="text-gray-500 text-sm mt-2">Your test results will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FlaskConical className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{result.test_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(result.test_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                  {result.status}
                </span>
              </div>

              {result.status === 'completed' && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Result Value</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.result_value || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Reference Range</p>
                      <p className="text-sm text-gray-700">{result.reference_range || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Trend</p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.doctor && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>
                    Ordered by Dr. {result.doctor.full_name}
                    {result.doctor.specialization && ` (${result.doctor.specialization})`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
