import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import './App.css';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { SpeedInsights } from "@vercel/speed-insights/react";

const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Profile = lazy(() => import('./components/Profile'));
const PublishRoom = lazy(() => import('./components/PublishRoom'));
const MyRooms = lazy(() => import('./components/MyRooms'));
const SearchRooms = lazy(() => import('./components/SearchRooms'));
const RoomDetails = lazy(() => import('./components/RoomDetails'));
const Chat = lazy(() => import('./components/Chat'));
const Reservations = lazy(() => import('./components/Reservations'));
const ChatsList = lazy(() => import('./components/ChatsList'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AuthModal = lazy(() => import('./components/AuthModal'));
import { Menu, X } from 'lucide-react';

function App() {
  const { currentUser, userData, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialView, setAuthModalInitialView] = useState('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openAuth = (view) => {
    setAuthModalInitialView(view);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-right" />
      <Suspense fallback={null}>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authModalInitialView} />
      </Suspense>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logo.png" 
              alt="UniRoom Logo" 
              style={{ 
                height: '65px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                transition: 'transform 0.3s ease'
              }} 
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          </Link>
          <nav className="desktop-nav">
            {(!currentUser || userData?.role === 'propietario' || isAdmin) && (
              currentUser ? (
                <Link to="/publish" style={{ fontWeight: '600', marginRight: '0.5rem' }}>Pon tu espacio en UniRoom</Link>
              ) : (
                <button onClick={() => openAuth('login')} style={{ fontWeight: '600', marginRight: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit' }}>Pon tu espacio en UniRoom</button>
              )
            )}
            
            {currentUser ? (
              <>
                {(userData?.role === 'propietario' || isAdmin) && (
                  <Link to="/my-rooms" style={{ fontWeight: '600' }}>Mis Anuncios</Link>
                )}
                <Link to="/reservations" style={{ fontWeight: '600' }}>Reservas</Link>
                <Link to="/chats" style={{ fontWeight: '600' }}>Mensajes</Link>
                <Link to="/profile" style={{ fontWeight: '600' }}>Perfil</Link>
                {isAdmin && (
                  <Link to="/admin" style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.85rem', padding: '0.4rem 0.8rem', border: '1px solid var(--primary)', borderRadius: 'var(--radius-full)' }}>Admin</Link>
                )}
              </>
            ) : (
              <>
                <button onClick={() => openAuth('login')} style={{ fontWeight: '600', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit' }}>Iniciar Sesión</button>
                <button onClick={() => openAuth('register')} style={{ fontWeight: '600', background: 'var(--primary)', color: 'white', padding: '0.5rem 1.2rem', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit' }}>Regístrate</button>
              </>
            )}
          </nav>
          
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div className={`mobile-drawer-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex' }}>
            <X size={28} />
          </button>
        </div>
        <nav className="mobile-nav-links" onClick={() => setIsMobileMenuOpen(false)}>
          {(!currentUser || userData?.role === 'propietario' || isAdmin) && (
            currentUser ? (
              <Link to="/publish" style={{ fontWeight: '600', color: 'var(--primary)' }}>Pon tu espacio en UniRoom</Link>
            ) : (
              <button onClick={() => openAuth('login')} style={{ fontWeight: '600', textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem', fontFamily: 'inherit', padding: 0 }}>Pon tu espacio en UniRoom</button>
            )
          )}
          
          {currentUser ? (
            <>
              {(userData?.role === 'propietario' || isAdmin) && (
                <Link to="/my-rooms" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Mis Anuncios</Link>
              )}
              <Link to="/reservations" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Reservas</Link>
              <Link to="/chats" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Mensajes</Link>
              <Link to="/profile" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Perfil</Link>
              {isAdmin && (
                <Link to="/admin" style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '1.1rem' }}>Panel Admin</Link>
              )}
            </>
          ) : (
            <>
              <button onClick={() => openAuth('login')} style={{ fontWeight: '600', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.1rem', fontFamily: 'inherit', padding: 0 }}>Iniciar Sesión</button>
              <button onClick={() => openAuth('register')} style={{ fontWeight: '600', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.1rem', fontFamily: 'inherit', padding: 0 }}>Regístrate</button>
            </>
          )}
        </nav>
      </div>

      <main style={{ flex: 1 }}>
        <div className="container">
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando página...</div>}>
            <Routes>
              <Route path="/" element={<SearchRooms />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/publish" element={<PublishRoom />} />
              <Route path="/edit-room/:id" element={<PublishRoom />} />
              <Route path="/my-rooms" element={<MyRooms />} />
              <Route path="/room/:id" element={<RoomDetails />} />
              <Route path="/chat/:chatId" element={<Chat />} />
              <Route path="/chats" element={<ChatsList />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </Suspense>
          <SpeedInsights />
        </div>
      </main>

      <footer style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        {/*<p>&copy; {new Date().getFullYear()} UniRoom Pamplona. Proyecto Scrum.</p>*/}
      </footer>
    </div>
  )
}

export default App
