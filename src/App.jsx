import { Routes, Route, Link } from 'react-router-dom'
import './App.css' 
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import PublishRoom from './components/PublishRoom'
import MyRooms from './components/MyRooms'
import SearchRooms from './components/SearchRooms'
import RoomDetails from './components/RoomDetails'
import Chat from './components/Chat'
import Reservations from './components/Reservations'
import ChatsList from './components/ChatsList'
import AdminPanel from './components/AdminPanel'

function App() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>UniRoom</Link>
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/publish" style={{ fontWeight: '500' }}>Publicar</Link>
            <Link to="/my-rooms" style={{ fontWeight: '500' }}>Mis Anuncios</Link>
            <Link to="/reservations" style={{ fontWeight: '500' }}>Reservas</Link>
            <Link to="/chats" style={{ fontWeight: '500' }}>Mensajes</Link>
            <Link to="/profile" style={{ fontWeight: '500' }}>Perfil</Link>
            <Link to="/admin" style={{ fontWeight: '500', color: '#0284c7', fontSize: '0.85rem', padding: '0.25rem 0.5rem', border: '1px solid #0284c7', borderRadius: 'var(--radius-sm)' }}>Admin</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <div className="container">
          <Routes>
            <Route path="/" element={<SearchRooms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/publish" element={<PublishRoom />} />
            <Route path="/my-rooms" element={<MyRooms />} />
            <Route path="/room/:id" element={<RoomDetails />} />
            <Route path="/chat/:chatId" element={<Chat />} />
            <Route path="/chats" element={<ChatsList />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </main>

      <footer style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        <p>&copy; {new Date().getFullYear()} UniRoom Pamplona. Proyecto Scrum.</p>
      </footer>
    </div>
  )
}

export default App
