import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import RoomsMap from './RoomsMap';

export default function SearchRooms() {
  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [maxPrice, setMaxPrice] = useState('');
  const [services, setServices] = useState({
    wifi: false,
    bano_privado: false,
    cocina: false,
    amoblado: false
  });

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        const q = query(collection(db, 'rooms'), where('status', '==', 'disponible'));
        const querySnapshot = await getDocs(q);
        const roomsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllRooms(roomsData);
        setFilteredRooms(roomsData);
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

    if (maxPrice && Number(maxPrice) > 0) {
      result = result.filter(room => room.price <= Number(maxPrice));
    }

    const activeServices = Object.keys(services).filter(key => services[key]);
    if (activeServices.length > 0) {
      result = result.filter(room => {
        if (!room.services) return false;
        return activeServices.every(service => room.services.includes(service));
      });
    }

    setFilteredRooms(result);
  }, [allRooms, maxPrice, services]);

  const handleServiceChange = (e) => {
    setServices({
      ...services,
      [e.target.name]: e.target.checked
    });
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Buscando alojamientos...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        
        {/* Sidebar: Filters */}
        <div className="card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Filtros</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Precio Máximo (COP)</label>
            <input 
              type="number" 
              className="input" 
              placeholder="Ej: 500000" 
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Servicios Necesarios</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label><input type="checkbox" name="wifi" checked={services.wifi} onChange={handleServiceChange} /> WiFi</label>
              <label><input type="checkbox" name="bano_privado" checked={services.bano_privado} onChange={handleServiceChange} /> Baño Privado</label>
              <label><input type="checkbox" name="cocina" checked={services.cocina} onChange={handleServiceChange} /> Cocina</label>
              <label><input type="checkbox" name="amoblado" checked={services.amoblado} onChange={handleServiceChange} /> Amoblado</label>
            </div>
          </div>
        </div>

        {/* Main Content: Map & List */}
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <RoomsMap rooms={filteredRooms} />
          </div>

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Resultados ({filteredRooms.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredRooms.map(room => (
              <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {room.images && room.images.length > 0 ? (
                  <img src={room.images[0]} alt={room.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '180px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Sin imagen
                  </div>
                )}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', paddingRight: '0.5rem' }}>{room.title}</h4>
                    {room.verified && (
                      <span title="Habitación Verificada" style={{ color: '#0284c7', fontSize: '1.2rem' }}>✓</span>
                    )}
                  </div>
                  <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    ${room.price.toLocaleString('es-CO')}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1 }}>
                    {room.description.length > 80 ? room.description.substring(0, 80) + '...' : room.description}
                  </p>
                  <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
                    {room.services && room.services.map(s => (
                      <span key={s} style={{ background: 'var(--background)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link to={`/room/${room.id}`} className="btn btn-primary" style={{ textAlign: 'center', width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}>
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
