import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SosAlarm } from './components/shared/SosAlarm';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { ScrollToTop } from './components/shared/ScrollToTop';

// Public pages (lazy loaded)
const Home = lazy(() => import('./pages/public/Home').then(m => ({ default: m.Home })));
const PublicLanding = lazy(() => import('./pages/public/PublicLanding').then(m => ({ default: m.PublicLanding })));
const EventDetail = lazy(() => import('./pages/public/EventDetail').then(m => ({ default: m.EventDetail })));
const SharedBandCalendar = lazy(() => import('./pages/public/SharedBandCalendar').then(m => ({ default: m.SharedBandCalendar })));
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const ClaimProfile = lazy(() => import('./pages/auth/ClaimProfile').then(m => ({ default: m.ClaimProfile })));
const SeedDatabase = lazy(() => import('./pages/SeedDatabase').then(m => ({ default: m.SeedDatabase })));

// Musician panel pages (lazy loaded)
const MusicianLayout = lazy(() => import('./layouts/MusicianLayout').then(m => ({ default: m.MusicianLayout })));
const MusicianHome = lazy(() => import('./pages/musician/MusicianHome').then(m => ({ default: m.MusicianHome })));
const DashboardHome = lazy(() => import('./pages/musician/DashboardHome').then(m => ({ default: m.DashboardHome })));
const EPKManager = lazy(() => import('./pages/musician/EPKManager').then(m => ({ default: m.EPKManager })));
const AvailabilityCalendar = lazy(() => import('./pages/musician/AvailabilityCalendar').then(m => ({ default: m.AvailabilityCalendar })));
const SOSBoard = lazy(() => import('./pages/musician/SOSBoard').then(m => ({ default: m.SOSBoard })));
const MusicianOpportunities = lazy(() => import('./pages/musician/MusicianOpportunities').then(m => ({ default: m.MusicianOpportunities })));
const DirectOffers = lazy(() => import('./pages/musician/DirectOffers').then(m => ({ default: m.DirectOffers })));
const LandingBuilderPage = lazy(() => import('./pages/musician/LandingBuilderPage').then(m => ({ default: m.LandingBuilderPage })));

// Venue panel pages (lazy loaded)
const VenueLayout = lazy(() => import('./layouts/VenueLayout').then(m => ({ default: m.VenueLayout })));
const VenueHome = lazy(() => import('./pages/venue/VenueHome').then(m => ({ default: m.VenueHome })));
const ArtistSearch = lazy(() => import('./pages/venue/ArtistSearch').then(m => ({ default: m.ArtistSearch })));
const EventManager = lazy(() => import('./pages/venue/EventManager').then(m => ({ default: m.EventManager })));
const VenueProfile = lazy(() => import('./pages/venue/VenueProfile').then(m => ({ default: m.VenueProfile })));
const VenueSOSManager = lazy(() => import('./pages/venue/VenueSOSManager').then(m => ({ default: m.VenueSOSManager })));
const VenueCalendar = lazy(() => import('./pages/venue/VenueCalendar').then(m => ({ default: m.VenueCalendar })));

const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Messages = lazy(() => import('./pages/shared/Messages').then(m => ({ default: m.Messages })));
import { ErrorBoundary } from './components/shared/ErrorBoundary';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-black font-sans text-white">
        <SosAlarm />
        <ErrorBoundary fallbackTitle="Ha ocurrido un problema al cargar la aplicación">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
            {/* Área Pública */}
            <Route path="/" element={<Home />} />
            <Route path="/:subdomain" element={<PublicLanding />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/band/:bandId/calendar" element={<SharedBandCalendar />} />
            <Route path="/login" element={<Login />} />
            <Route path="/claim-profile" element={<ClaimProfile />} />
            <Route path="/seed" element={<SeedDatabase />} />
            
            {/* Área de Músicos */}
            <Route path="/musician" element={
              <ProtectedRoute allowedRole="musician">
                <MusicianLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MusicianHome />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="opportunities" element={<MusicianOpportunities />} />
              <Route path="offers" element={<DirectOffers />} />
              <Route path="epk" element={<EPKManager />} />
              <Route path="landing" element={<LandingBuilderPage />} />
              <Route path="calendar" element={<AvailabilityCalendar />} />
              <Route path="sos" element={<SOSBoard />} />
              <Route path="messages" element={<Messages />} />
            </Route>
            
            {/* Área de Locales */}
            <Route path="/venue" element={
              <ProtectedRoute allowedRole="venue">
                <VenueLayout />
              </ProtectedRoute>
            }>
              <Route index element={<VenueHome />} />
              <Route path="dashboard" element={<EventManager />} />
              <Route path="search" element={<ArtistSearch />} />
              <Route path="events" element={<EventManager />} />
              <Route path="calendar" element={<VenueCalendar />} />
              <Route path="sos" element={<VenueSOSManager />} />
              <Route path="profile" element={<VenueProfile />} />
              <Route path="messages" element={<Messages />} />
            </Route>

            {/* Área de Administración */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
