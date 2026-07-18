import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { CheckCircle2, Heart } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

export default function Favorites() {
  const { currentUser, loading: authLoading } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchFavoriteRooms = async () => {
      if (favorites.length === 0) {
        setFavoriteRooms([]);
        setLoading(false);
        return;
      }

      try {
        const chunks = [];
        for (let i = 0; i < favorites.length; i += 30) {
          chunks.push(favorites.slice(i, i + 30));
        }

        let allRooms = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'rooms'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          allRooms = [...allRooms, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
        }

        const usersSnap = await getDocs(collection(db, 'users'));
        const usersMap = {};
        usersSnap.forEach(u => usersMap[u.id] = u.data().name || u.id.substring(0,6));

        const enriched = allRooms.map(r => ({
          ...r,
          ownerName: usersMap[r.ownerId] || r.ownerId.substring(0,6)
        }));

        setFavoriteRooms(enriched);
      } catch (err) {
        console.error("Error fetching favorites", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteRooms();
  }, [currentUser, authLoading, favorites]);

  if (loading || authLoading) return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Tus Favoritos</h1>
      <SkeletonLoader count={4} />
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Tus Favoritos</h1>
      
      {favoriteRooms.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Aún no tienes habitaciones guardadas en favoritos.
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/" className="btn btn-primary">Buscar habitaciones</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', paddingBottom: '5rem' }}>
          {favoriteRooms.map((room) => (
            <div key={room.id} style={{ position: 'relative' }}>
              <Link to={`/room/${room.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="room-card">
                  <div className="room-card-img-wrapper">
                    {room.images && room.images.length > 0 ? (
                      <img src={room.images[0]} alt={room.title} className="room-card-img" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.75rem 1rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 className="text-truncate" style={{ fontSize: '1.05rem', margin: '0 0 0.15rem 0', color: 'var(--text-primary)' }}>{room.title}</h4>
                      {room.verified && <CheckCircle2 size={16} color="#0284c7" />}
                    </div>
                    <p className="text-truncate" style={{ color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>Anfitrión: {room.ownerName}</p>
                    <p style={{ margin: 0, fontSize: '1.05rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>${room.price.toLocaleString('es-CO')}</span> <span style={{ color: 'var(--text-secondary)' }}>mes</span>
                    </p>
                  </div>
                </div>
              </Link>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(room.id); }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 2 }}
              >
                <Heart size={20} fill="var(--error-text)" color="var(--error-text)" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
