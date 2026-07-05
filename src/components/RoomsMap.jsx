import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Coordenadas centrales de Pamplona (Norte de Santander)
const PAMPLONA_CENTER = [7.3768, -72.6481];

export default function RoomsMap({ rooms }) {
  return (
    <div style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={PAMPLONA_CENTER} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {rooms.map((room, index) => {
          // Generar una posición ligeramente aleatoria alrededor de Pamplona para los marcadores de prueba
          const lat = PAMPLONA_CENTER[0] + (Math.random() - 0.5) * 0.01;
          const lng = PAMPLONA_CENTER[1] + (Math.random() - 0.5) * 0.01;
          
          return (
            <Marker key={room.id} position={[lat, lng]}>
              <Popup>
                <strong>{room.title}</strong><br/>
                Precio: ${room.price.toLocaleString('es-CO')}<br/>
                {room.images && room.images.length > 0 && (
                  <img src={room.images[0]} alt="preview" style={{width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px'}}/>
                )}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
