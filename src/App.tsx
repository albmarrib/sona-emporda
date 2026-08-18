import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Home } from './pages/public/Home';
import { EventDetail } from './pages/public/EventDetail';
import { Login } from './pages/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SosAlarm } from './components/shared/SosAlarm';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { ScrollToTop } from './components/shared/ScrollToTop';
import { MusicianLayout } from './layouts/MusicianLayout';
import { DashboardHome } from './pages/musician/DashboardHome';
import { EPKManager } from './pages/musician/EPKManager';
import { AvailabilityCalendar } from './pages/musician/AvailabilityCalendar';
import { SOSBoard } from './pages/musician/SOSBoard';
import { MusicianOpportunities } from './pages/musician/MusicianOpportunities';
import { DirectOffers } from './pages/musician/DirectOffers';
import { VenueLayout } from './layouts/VenueLayout';
import { VenueDashboardHome } from './pages/venue/VenueDashboardHome';
import { ArtistSearch } from './pages/venue/ArtistSearch';
import { EventManager } from './pages/venue/EventManager';
import { VenueProfile } from './pages/venue/VenueProfile';
import { VenueSOSManager } from './pages/venue/VenueSOSManager';
import { VenueCalendar } from './pages/venue/VenueCalendar';
import { SeedDatabase } from './pages/SeedDatabase';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-black font-sans text-white">
        <SosAlarm />
        <Routes>
          {/* Área Pública */}
          <Route path="/" element={<Home />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/seed" element={<SeedDatabase />} />
          
          {/* Área de Músicos */}
          <Route path="/musician" element={
            <ProtectedRoute allowedRole="musician">
              <MusicianLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="opportunities" element={<MusicianOpportunities />} />
            <Route path="offers" element={<DirectOffers />} />
            <Route path="epk" element={<EPKManager />} />
            <Route path="calendar" element={<AvailabilityCalendar />} />
            <Route path="sos" element={<SOSBoard />} />
          </Route>
          
          {/* Área de Locales */}
          <Route path="/venue" element={
            <ProtectedRoute allowedRole="venue">
              <VenueLayout />
            </ProtectedRoute>
          }>
            <Route index element={<VenueDashboardHome />} />
            <Route path="search" element={<ArtistSearch />} />
            <Route path="events" element={<EventManager />} />
            <Route path="calendar" element={<VenueCalendar />} />
            <Route path="sos" element={<VenueSOSManager />} />
            <Route path="profile" element={<VenueProfile />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
