/*
  # Healthcare Application Database Schema

  ## Overview
  This migration creates the complete database schema for a rural healthcare application
  supporting appointment booking, virtual consultations, and medical history management.

  ## New Tables
  
  ### 1. `profiles`
  Patient and doctor profiles extending Supabase auth.users
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `email` (text)
  - `phone` (text)
  - `date_of_birth` (date)
  - `address` (text)
  - `role` (text: 'patient' or 'doctor')
  - `specialization` (text, for doctors)
  - `license_number` (text, for doctors)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `appointments`
  Manages all appointment bookings
  - `id` (uuid, primary key)
  - `patient_id` (uuid, references profiles)
  - `doctor_id` (uuid, references profiles)
  - `appointment_date` (timestamptz)
  - `duration_minutes` (integer)
  - `status` (text: 'scheduled', 'completed', 'cancelled', 'rescheduled')
  - `consultation_type` (text: 'in-person', 'video', 'chat')
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `availability_slots`
  Doctor availability for appointment booking
  - `id` (uuid, primary key)
  - `doctor_id` (uuid, references profiles)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `is_available` (boolean)
  - `created_at` (timestamptz)

  ### 4. `medical_history`
  Patient medical records
  - `id` (uuid, primary key)
  - `patient_id` (uuid, references profiles)
  - `record_type` (text: 'diagnosis', 'procedure', 'allergy', 'condition')
  - `title` (text)
  - `description` (text)
  - `date_recorded` (timestamptz)
  - `doctor_id` (uuid, references profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `medications`
  Current and past medications
  - `id` (uuid, primary key)
  - `patient_id` (uuid, references profiles)
  - `medication_name` (text)
  - `dosage` (text)
  - `frequency` (text)
  - `start_date` (date)
  - `end_date` (date, nullable)
  - `prescribed_by` (uuid, references profiles)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 6. `lab_results`
  Laboratory test results
  - `id` (uuid, primary key)
  - `patient_id` (uuid, references profiles)
  - `test_name` (text)
  - `test_date` (date)
  - `result_value` (text)
  - `reference_range` (text)
  - `status` (text)
  - `ordered_by` (uuid, references profiles)
  - `created_at` (timestamptz)

  ### 7. `prescriptions`
  Prescription records
  - `id` (uuid, primary key)
  - `patient_id` (uuid, references profiles)
  - `doctor_id` (uuid, references profiles)
  - `appointment_id` (uuid, references appointments)
  - `medication_name` (text)
  - `dosage` (text)
  - `instructions` (text)
  - `delivery_status` (text: 'pending', 'delivered', 'cancelled')
  - `created_at` (timestamptz)

  ### 8. `notifications`
  System notifications and reminders
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text: 'appointment_reminder', 'appointment_confirmed', 'prescription_ready')
  - `title` (text)
  - `message` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 9. `consultation_sessions`
  Virtual consultation tracking
  - `id` (uuid, primary key)
  - `appointment_id` (uuid, references appointments)
  - `session_token` (text)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `connection_quality` (text)
  - `created_at` (timestamptz)

  ### 10. `chat_messages`
  Text-based consultation messages
  - `id` (uuid, primary key)
  - `consultation_id` (uuid, references consultation_sessions)
  - `sender_id` (uuid, references profiles)
  - `message` (text)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Patients can only access their own records
  - Doctors can access their patients' records during appointments
  - Users can only see their own notifications
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  address text,
  role text NOT NULL CHECK (role IN ('patient', 'doctor')),
  specialization text,
  license_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  consultation_type text DEFAULT 'video' CHECK (consultation_type IN ('in-person', 'video', 'chat')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Availability slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available slots"
  ON availability_slots FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "Doctors can manage own availability"
  ON availability_slots FOR ALL
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Medical history table
CREATE TABLE IF NOT EXISTS medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('diagnosis', 'procedure', 'allergy', 'condition')),
  title text NOT NULL,
  description text,
  date_recorded timestamptz DEFAULT now(),
  doctor_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own medical history"
  ON medical_history FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient medical history during appointments"
  ON medical_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.doctor_id = auth.uid()
      AND appointments.patient_id = medical_history.patient_id
      AND appointments.status = 'scheduled'
    )
  );

CREATE POLICY "Doctors can create medical history records"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update medical history records they created"
  ON medical_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  prescribed_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient medications during appointments"
  ON medications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.doctor_id = auth.uid()
      AND appointments.patient_id = medications.patient_id
      AND appointments.status = 'scheduled'
    )
  );

CREATE POLICY "Doctors can create medication records"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = prescribed_by);

-- Lab results table
CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_date date DEFAULT CURRENT_DATE,
  result_value text,
  reference_range text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  ordered_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own lab results"
  ON lab_results FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient lab results during appointments"
  ON lab_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.doctor_id = auth.uid()
      AND appointments.patient_id = lab_results.patient_id
      AND appointments.status = 'scheduled'
    )
  );

CREATE POLICY "Doctors can create lab results"
  ON lab_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ordered_by);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id),
  appointment_id uuid REFERENCES appointments(id),
  medication_name text NOT NULL,
  dosage text NOT NULL,
  instructions text,
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view prescriptions they created"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('appointment_reminder', 'appointment_confirmed', 'prescription_ready', 'lab_results_ready')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Consultation sessions table
CREATE TABLE IF NOT EXISTS consultation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  session_token text,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  connection_quality text CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consultation sessions for their appointments"
  ON consultation_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = consultation_sessions.appointment_id
      AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can create consultation sessions"
  ON consultation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.doctor_id = auth.uid()
    )
  );

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their consultations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultation_sessions cs
      JOIN appointments a ON a.id = cs.appointment_id
      WHERE cs.id = chat_messages.consultation_id
      AND (a.patient_id = auth.uid() OR a.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their consultations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM consultation_sessions cs
      JOIN appointments a ON a.id = cs.appointment_id
      WHERE cs.id = consultation_id
      AND (a.patient_id = auth.uid() OR a.doctor_id = auth.uid())
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_availability_doctor ON availability_slots(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_consultation ON chat_messages(consultation_id);
