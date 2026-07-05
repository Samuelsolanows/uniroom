import { Routes, Route, Link } from 'react-router-dom'
import './App.css' 
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import PublishRoom from './components/PublishRoom'
import MyRooms from './components/MyRooms'
import SearchRooms from './components/SearchRooms'

function App() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>UniRoom</Link>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/publish" style={{ fontWeight: '500' }}>Publicar</Link>
            <Link to="/my-rooms" style={{ fontWeight: '500' }}>Mis Anuncios</Link>
            <Link to="/profile" style={{ fontWeight: '500' }}>Perfil</Link>
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
