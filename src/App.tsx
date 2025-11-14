import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/auth/AuthForm';
import { Navigation } from './components/layout/Navigation';
import { Header } from './components/layout/Header';
import { AppointmentList } from './components/appointments/AppointmentList';
import { BookAppointment } from './components/appointments/BookAppointment';
import { MedicalHistory } from './components/medical/MedicalHistory';
import { Medications } from './components/medical/Medications';
import { LabResults } from './components/medical/LabResults';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('appointments');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const viewTitles: Record<string, string> = {
    appointments: 'My Appointments',
    book: 'Book Appointment',
    history: 'Medical History',
    medications: 'My Medications',
    labs: 'Lab Results',
    patients: 'My Patients',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      <div className="md:ml-64 pb-20 md:pb-0">
        <Header title={viewTitles[currentView] || 'Dashboard'} />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {currentView === 'appointments' && <AppointmentList />}
            {currentView === 'book' && <BookAppointment />}
            {currentView === 'history' && <MedicalHistory />}
            {currentView === 'medications' && <Medications />}
            {currentView === 'labs' && <LabResults />}
            {currentView === 'patients' && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">Patients view coming soon</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
