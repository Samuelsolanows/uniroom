import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import L from 'leaflet';

// Coordenadas centrales de Pamplona (Norte de Santander)
const PAMPLONA_CENTER = [7.3768, -72.6481];

export default function RoomsMap({ rooms }) {
  const navigate = useNavigate();

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={PAMPLONA_CENTER} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {rooms.map((room, index) => {
          // Usar la ubicación real, si no existe, usar el centro de Pamplona por defecto
          const lat = room.location?.lat ?? PAMPLONA_CENTER[0];
          const lng = room.location?.lng ?? PAMPLONA_CENTER[1];
          
          return (
            <Marker key={room.id} position={[lat, lng]}>
              <Popup className="custom-popup">
                <div 
                  className="room-card" 
                  onClick={() => navigate(`/room/${room.id}`)}
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <div className="room-card-img-wrapper" style={{ margin: 0, borderRadius: '0', height: '140px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                    {room.images && room.images.length > 0 ? (
                      <img src={room.images[0]} alt={room.title} className="room-card-img" />
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
                  <div style={{ padding: '0.75rem' }}>
                    <h4 className="text-truncate" style={{ fontSize: '1rem', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{room.title}</h4>
                    <p className="text-truncate" style={{ color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>Anfitrión: {room.ownerName || room.ownerId.substring(0,6)}</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>${room.price.toLocaleString('es-CO')}</span> <span style={{ color: 'var(--text-secondary)' }}>mes</span>
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
