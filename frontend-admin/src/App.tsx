import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Tickets } from './pages/Tickets';
import { Settings } from './pages/Settings';
import { Support } from './pages/Support';
import { MapEditor } from './pages/MapEditor';
import { Login } from './pages/Login';
import { Lineup } from './pages/Lineup';
import { Staff } from './pages/Staff';
import { Persons } from './pages/Persons';
import { CrowdReports } from './pages/CrowdReports';

function App() {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('untold_token');
  });

  const handleLoginSuccess = (_user: any, authToken: string) => {
    setToken(authToken);
  };

  // If there's no active admin token, enforce the Login page
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lineup" element={<Lineup />} />
          <Route path="/events" element={<Events />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/crowd-reports" element={<CrowdReports />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/venue-map" element={<MapEditor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
