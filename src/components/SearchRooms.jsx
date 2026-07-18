import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFavorites } from '../hooks/useFavorites';
import RoomsMap from './RoomsMap';
import SkeletonLoader from './SkeletonLoader';
import { Star, CheckCircle2, Heart } from 'lucide-react';

export default function SearchRooms() {
  const { favorites, toggleFavorite } = useFavorites();
  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        const q = query(collection(db, 'rooms'), where('status', '==', 'disponible'));
        const querySnapshot = await getDocs(q);
        const roomsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersMap = {};
        usersSnapshot.forEach(userDoc => {
          usersMap[userDoc.id] = userDoc.data().name || userDoc.id.substring(0, 6);
        });

        const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
        const ratingsMap = {};
        reviewsSnapshot.forEach(rev => {
          const d = rev.data();
          if(!ratingsMap[d.roomId]) ratingsMap[d.roomId] = { sum: 0, count: 0 };
          ratingsMap[d.roomId].sum += d.rating;
          ratingsMap[d.roomId].count += 1;
        });

        const enrichedRooms = roomsData.map(room => ({
          ...room,
          ownerName: usersMap[room.ownerId] || room.ownerId.substring(0, 6),
          averageRating: ratingsMap[room.id] ? (ratingsMap[room.id].sum / ratingsMap[room.id].count).toFixed(1) : null
        }));

        enrichedRooms.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setAllRooms(enrichedRooms);
        setFilteredRooms(enrichedRooms);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableRooms();
  }, []);

  useEffect(() => {
    let result = allRooms;

    if (searchTerm) {
      result = result.filter(room => 
        room.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        room.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (maxPrice && Number(maxPrice) > 0) {
      result = result.filter(room => room.price <= Number(maxPrice));
    }

    if (selectedService) {
      result = result.filter(room => room.services && room.services.includes(selectedService));
    }

    setFilteredRooms(result);
  }, [allRooms, maxPrice, searchTerm, selectedService]);

  if (loading) return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ padding: '3rem 0' }}></div>
      <SkeletonLoader count={8} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem 0' }}>
      
      {/* Buscador Estilo Airbnb (barra de busqueda) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div className="search-pill">
          <div className="search-pill-section search-pill-divider">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', paddingLeft: '0.5rem' }}>Dónde</label>
            <input 
              type="text" 
              placeholder="Buscar título o descripción" 
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0.25rem 0.5rem', fontSize: '0.95rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="search-pill-section search-pill-divider">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', paddingLeft: '0.5rem' }}>Presupuesto</label>
            <input 
              type="number" 
              placeholder="Precio máximo ($)" 
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0.25rem 0.5rem', fontSize: '0.95rem' }}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div className="search-pill-section search-pill-action">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', paddingLeft: '0.5rem' }}>Filtros</label>
              <select 
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0.25rem 0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">Cualquier servicio</option>
                <option value="wifi">WiFi</option>
                <option value="cocina">Cocina Compartida</option>
                <option value="bano_privado">Baño Privado</option>
                <option value="amoblado">Amoblado</option>
              </select>
            </div>
            <button className="btn btn-primary search-pill-btn" style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ position: 'relative' }}>
        
        {/* Floating Map Toggle Button */}
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          <button 
            className="btn" 
            style={{ background: 'var(--text-primary)', color: 'white', borderRadius: 'var(--radius-full)', padding: '0.75rem 1.5rem', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? (
              <><span>≡</span> Mostrar lista</>
            ) : (
              <><span>🗺️</span> Mostrar mapa</>
            )}
          </button>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No se encontraron habitaciones con esos filtros.
          </div>
        ) : showMap ? (
          <div style={{ height: '70vh', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <RoomsMap rooms={filteredRooms} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', paddingBottom: '5rem' }}>
            {filteredRooms.map((room, index) => (
              <div key={room.id} style={{ position: 'relative' }}>
                <Link to={`/room/${room.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="room-card">
                    <div className="room-card-img-wrapper">
                      {room.images && room.images.length > 0 ? (
                        <img 
                          src={room.images[0]} 
                          alt={room.title} 
                          className="room-card-img" 
                          loading={index < 4 ? "eager" : "lazy"} 
                          fetchPriority={index < 4 ? "high" : "auto"} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Sin foto
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={14} fill="currentColor" /> {room.averageRating ? room.averageRating : '----'}
                        </span>
                      </div>
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
                  style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 2 }}
                >
                  <Heart size={20} fill={favorites.includes(room.id) ? "var(--error-text)" : "none"} color={favorites.includes(room.id) ? "var(--error-text)" : "var(--text-secondary)"} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
