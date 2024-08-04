import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Loginn from './components/loginn';
import Admin from './components/Admin';
import HomePage from './components/HomePage';
import Messaging from './components/Messaging';
import CreateGirlForm from './components/CreateGirlForm';
import GirlDetails from './components/GirlDetails';
import AdminDetails from './components/AdminDetails';
import ChangePassword from './components/ChangePassword';
import VolunteerForm from './components/VolunteerForm';
import JoinForm from './components/JoinForm';
import RecentForms from './components/RecentForms';
import CreateFramework from './components/CreateFramework';
import EditDetails from './components/EditDetails';
import JoinVolunteer from './components/JoinVolunteer';
import Documentation from './components/Documentation';
import ReportsList from './components/Reports/ReportsList';
import GirlsReport from './components/Reports/GirlsReport';
import VolunteersReport from './components/Reports/VolunteersReport';
import VolunteerDetails from './components/volunteerDetails';
import AuthGuard from './components/AuthGuard';
import { auth } from './firebaseConfig';
import FrameWorkReport from './components/Reports/frameWorkReport';
import './App.css';
import StatisticsList from './components/Statistics/StatisticsList';
import StatisticsGirls from './components/Statistics/StatisticsGirls';
import StatisticsSupports from './components/Statistics/StatisticsSupports';
import StatisticsVolunteers from './components/Statistics/StatisticsVolunteers';
import FrameworkDetails from './components/FrameworkDetails'; 
import SupportsReport from './components/Reports/SupportsReport';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('sessionActive', 'true');
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Loginn onLogin={handleLogin} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/home" element={<AuthGuard isAuthenticated={isAuthenticated}><HomePage /></AuthGuard>} />
          <Route path="/adminDetails" element={<AuthGuard isAuthenticated={isAuthenticated}><AdminDetails /></AuthGuard>} />
          <Route path="/messaging" element={<AuthGuard isAuthenticated={isAuthenticated}><Messaging /></AuthGuard>} />
          <Route path="/createGirlForm" element={<AuthGuard isAuthenticated={isAuthenticated}><CreateGirlForm /></AuthGuard>} />
          <Route path="/changePassword" element={<AuthGuard isAuthenticated={isAuthenticated}><ChangePassword /></AuthGuard>} />
          <Route path="/girldetails/:id" element={<AuthGuard isAuthenticated={isAuthenticated}><GirlDetails /></AuthGuard>} />
          <Route path="/volunteerForm" element={<AuthGuard isAuthenticated={isAuthenticated}><VolunteerForm /></AuthGuard>} />
          <Route path="/volunteerDetails/:id" element={<AuthGuard isAuthenticated={isAuthenticated}><VolunteerDetails /></AuthGuard>} />
          <Route path="/join" element={<JoinForm />} />
          <Route path="/recentForms" element={<AuthGuard isAuthenticated={isAuthenticated}><RecentForms /></AuthGuard>} />
          <Route path="/createframework" element={<AuthGuard isAuthenticated={isAuthenticated}><CreateFramework /></AuthGuard>} />
          <Route path="/documentation" element={<AuthGuard isAuthenticated={isAuthenticated}><Documentation /></AuthGuard>} />
          <Route path="/editDetails" element={<AuthGuard isAuthenticated={isAuthenticated}><EditDetails /></AuthGuard>} />
          <Route path="/JoinVolunteer" element={<JoinVolunteer />} />
          <Route path="/reports" element={<AuthGuard isAuthenticated={isAuthenticated}><ReportsList /></AuthGuard>} />
          <Route path="/girlsReport" element={<AuthGuard isAuthenticated={isAuthenticated}><GirlsReport /></AuthGuard>} />
          <Route path="/supportsReport" element={<AuthGuard isAuthenticated={isAuthenticated}><SupportsReport /></AuthGuard>} />
          <Route path="/volunteersReport" element={<AuthGuard isAuthenticated={isAuthenticated}><VolunteersReport /></AuthGuard>} />
          <Route path="/frameWorkReport" element={<AuthGuard isAuthenticated={isAuthenticated}><FrameWorkReport /></AuthGuard>} />
          <Route path="/statistics" element={<AuthGuard isAuthenticated={isAuthenticated}><StatisticsList /></AuthGuard>} />
          <Route path="/statistics-girls" element={<AuthGuard isAuthenticated={isAuthenticated}><StatisticsGirls /></AuthGuard>} />
          <Route path="/statistics-supports" element={<AuthGuard isAuthenticated={isAuthenticated}><StatisticsSupports /></AuthGuard>} />
          <Route path="/statistics-volunteers" element={<AuthGuard isAuthenticated={isAuthenticated}><StatisticsVolunteers /></AuthGuard>} />
          <Route path="/frameworkdetails/:id" element={<AuthGuard isAuthenticated={isAuthenticated}><FrameworkDetails /></AuthGuard>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
