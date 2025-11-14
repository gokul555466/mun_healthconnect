import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile, AvailabilitySlot } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export function BookAppointment() {
  const { profile } = useAuth();
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Profile | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [consultationType, setConsultationType] = useState<'video' | 'chat' | 'in-person'>('video');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadAvailableSlots(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  async function loadDoctors() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('full_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  }

  async function loadAvailableSlots(doctorId: string) {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_available', true)
        .gte('start_time', now)
        .order('start_time')
        .limit(20);

      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  }

  async function bookAppointment() {
    if (!selectedDoctor || !selectedSlot || !profile) return;

    try {
      setLoading(true);
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          doctor_id: selectedDoctor.id,
          appointment_date: selectedSlot.start_time,
          duration_minutes: 30,
          consultation_type: consultationType,
          notes,
        });

      if (appointmentError) throw appointmentError;

      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ is_available: false })
        .eq('id', selectedSlot.id);

      if (slotError) throw slotError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setNotes('');
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Appointment Booked!</h3>
        <p className="text-gray-600">You will receive a confirmation notification shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedDoctor ? (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Doctors
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or specialization..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">Dr. {doctor.full_name}</h3>
                    {doctor.specialization && (
                      <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : !selectedSlot ? (
        <div>
          <button
            onClick={() => setSelectedDoctor(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Back to doctors
          </button>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dr. {selectedDoctor.full_name}</h3>
                {selectedDoctor.specialization && (
                  <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time Slot</h3>

          {availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No available slots</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-900 font-medium mb-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(slot.start_time).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {new Date(slot.start_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedSlot(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Back to time slots
          </button>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">Dr. {selectedDoctor.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(selectedSlot.start_time).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {new Date(selectedSlot.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['video', 'chat', 'in-person'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setConsultationType(type)}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      consultationType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'in-person' ? 'In-Person' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any specific concerns or symptoms..."
              />
            </div>

            <button
              onClick={bookAppointment}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
