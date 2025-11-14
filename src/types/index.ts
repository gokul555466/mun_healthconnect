export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  role: 'patient' | 'doctor';
  specialization?: string;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  consultation_type: 'in-person' | 'video' | 'chat';
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor?: Profile;
  patient?: Profile;
}

export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  doctor?: Profile;
}

export interface MedicalHistory {
  id: string;
  patient_id: string;
  record_type: 'diagnosis' | 'procedure' | 'allergy' | 'condition';
  title: string;
  description?: string;
  date_recorded: string;
  doctor_id?: string;
  created_at: string;
  updated_at: string;
  doctor?: Profile;
}

export interface Medication {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescribed_by?: string;
  is_active: boolean;
  created_at: string;
  doctor?: Profile;
}

export interface LabResult {
  id: string;
  patient_id: string;
  test_name: string;
  test_date: string;
  result_value?: string;
  reference_range?: string;
  status: 'pending' | 'completed' | 'cancelled';
  ordered_by?: string;
  created_at: string;
  doctor?: Profile;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medication_name: string;
  dosage: string;
  instructions?: string;
  delivery_status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
  doctor?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'appointment_reminder' | 'appointment_confirmed' | 'prescription_ready' | 'lab_results_ready';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ConsultationSession {
  id: string;
  appointment_id: string;
  session_token?: string;
  start_time: string;
  end_time?: string;
  connection_quality?: 'excellent' | 'good' | 'fair' | 'poor';
  created_at: string;
  appointment?: Appointment;
}

export interface ChatMessage {
  id: string;
  consultation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: Profile;
}
