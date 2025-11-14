import { useEffect, useState } from 'react';
import { Calendar, Clock, Video, MessageSquare, User, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export function AppointmentList() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (profile) {
      loadAppointments();
    }
  }, [profile, filter]);

  async function loadAppointments() {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialization),
          patient:profiles!appointments_patient_id_fkey(id, full_name)
        `)
        .order('appointment_date', { ascending: true });

      if (profile?.role === 'patient') {
        query = query.eq('patient_id', profile.id);
      } else {
        query = query.eq('doctor_id', profile!.id);
      }

      if (filter === 'upcoming') {
        query = query.gte('appointment_date', new Date().toISOString()).in('status', ['scheduled']);
      } else if (filter === 'past') {
        query = query.lt('appointment_date', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(id: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getConsultationIcon(type: string) {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
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
    <div className="space-y-4">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'past'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No appointments found</p>
          <p className="text-gray-500 text-sm mt-2">Book your first appointment to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profile?.role === 'patient'
                        ? `Dr. ${appointment.doctor?.full_name}`
                        : appointment.patient?.full_name}
                    </h3>
                    {appointment.doctor?.specialization && (
                      <span className="text-sm text-gray-500">
                        ({appointment.doctor.specialization})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getConsultationIcon(appointment.consultation_type)}
                      <span className="capitalize">{appointment.consultation_type}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  {appointment.status}
                </span>
              </div>

              {appointment.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                {appointment.status === 'scheduled' && (
                  <>
                    {profile?.role === 'patient' && (
                      <button
                        onClick={() => cancelAppointment(appointment.id)}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                    {appointment.consultation_type !== 'in-person' && (
                      <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Join Consultation
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
