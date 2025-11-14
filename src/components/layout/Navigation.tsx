import { Calendar, Video, FileText, Pill, FlaskConical, Bell, User, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { profile, signOut } = useAuth();

  const patientNavItems = [
    { id: 'appointments', icon: Calendar, label: 'Appointments' },
    { id: 'book', icon: Video, label: 'Book Appointment' },
    { id: 'history', icon: FileText, label: 'Medical History' },
    { id: 'medications', icon: Pill, label: 'Medications' },
    { id: 'labs', icon: FlaskConical, label: 'Lab Results' },
  ];

  const doctorNavItems = [
    { id: 'appointments', icon: Calendar, label: 'My Schedule' },
    { id: 'patients', icon: User, label: 'Patients' },
  ];

  const navItems = profile?.role === 'doctor' ? doctorNavItems : patientNavItems;

  return (
    <>
      <nav className="hidden md:block w-64 bg-white border-r border-gray-200 fixed left-0 top-0 h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Rural Health</h1>
              <p className="text-xs text-gray-600">Connect</p>
            </div>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center px-4 py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            onClick={signOut}
            className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors text-gray-600"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Exit</span>
          </button>
        </div>
      </div>
    </>
  );
}
