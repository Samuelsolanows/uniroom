import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// Coordenadas centrales de Pamplona
const PAMPLONA_CENTER = [7.3768, -72.6481];

// Componente para manejar el clic en el mapa y mover el marcador
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function PublishRoom() {
  const { id } = useParams();
  const isEditMode = !!id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [services, setServices] = useState({
    wifi: false,
    bano_privado: false,
    cocina: false,
    amoblado: false
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [location, setLocation] = useState(PAMPLONA_CENTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { userData, loading: authLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!authLoading && userData && userData.role !== 'propietario' && !isAdmin) {
      toast.error('Solo los anfitriones pueden publicar habitaciones');
      navigate('/');
    }
  }, [userData, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isEditMode) {
      const fetchRoom = async () => {
        try {
          const roomDoc = await getDoc(doc(db, 'rooms', id));
          if (roomDoc.exists()) {
            const data = roomDoc.data();
            // Verify ownership or admin (Ideally checked here, but we let rules handle or simple check)
            setTitle(data.title || '');
            setDescription(data.description || '');
            setAddress(data.address || '');
            setPrice(data.price || '');
            const activeServices = data.services || [];
            setServices({
              wifi: activeServices.includes('wifi'),
              bano_privado: activeServices.includes('bano_privado'),
              cocina: activeServices.includes('cocina'),
              amoblado: activeServices.includes('amoblado')
            });
            setExistingImages(data.images || []);
            if (data.location && data.location.lat && data.location.lng) {
              setLocation([data.location.lat, data.location.lng]);
            }
          }
        } catch (err) {
          console.error("Error cargando habitación:", err);
          toast.error("Error al cargar datos");
        }
      };
      fetchRoom();
    }
  }, [id, isEditMode]);

  const handleServiceChange = (e) => {
    setServices({
      ...services,
      [e.target.name]: e.target.checked
    });
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const uploadImagesToCloudinary = async () => {
    const uploadedUrls = [];
    for (const file of images) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'uniroom_preset');

      const res = await fetch('https://api.cloudinary.com/v1_1/fkkxlihv/image/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Error al subir una imagen a Cloudinary');
      const data = await res.json();
      const rawUrl = data.secure_url;
      const optimizedUrl = rawUrl.replace('/upload/', '/upload/f_auto,q_auto/');
      uploadedUrls.push(optimizedUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      return;
    }
    if (!auth.currentUser) return;
    
    setLoading(true);
    setError('');

    try {
      let imageUrls = existingImages;
      if (images.length > 0) {
        // If new images are selected, we upload them and replace the old ones
        imageUrls = await uploadImagesToCloudinary();
      }

      // Filtrar los servicios que están en true
      const activeServices = Object.keys(services).filter(key => services[key]);

      const roomData = {
        title,
        description,
        address,
        price: Number(price),
        services: activeServices,
        images: imageUrls,
        location: { lat: location[0], lng: location[1] },
        updatedAt: serverTimestamp()
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'rooms', id), roomData);
        toast.success('Habitación actualizada con éxito');
        navigate(`/room/${id}`);
      } else {
        roomData.ownerId = auth.currentUser.uid;
        roomData.status = 'disponible';
        roomData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'rooms'), roomData);
        toast.success('Habitación publicada con éxito');
        navigate('/my-rooms');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al publicar la habitación');
      setError(`Error al publicar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '600px' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>{isEditMode ? 'Editar Habitación' : 'Publicar Habitación'}</h2>
        
        {error && (
          <div style={{ background: 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: currentStep >= 1 ? 'bold' : 'normal', color: currentStep >= 1 ? 'var(--primary)' : 'var(--text-muted)' }}>1. Básicos</div>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: currentStep >= 2 ? 'bold' : 'normal', color: currentStep >= 2 ? 'var(--primary)' : 'var(--text-muted)' }}>2. Detalles</div>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: currentStep >= 3 ? 'bold' : 'normal', color: currentStep >= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>3. Fotos</div>
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '1rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.3s', width: `${((currentStep - 1) / 2) * 100}%` }}></div>
          </div>

          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Título del anuncio</label>
                <input type="text" className="input" placeholder="Ej: Habitación luminosa cerca a la universidad" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Descripción</label>
                <textarea className="input" rows="4" placeholder="Detalles de la habitación, reglas, etc." value={description} onChange={e => setDescription(e.target.value)} required></textarea>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Precio Mensual (COP)</label>
                <input type="number" className="input" placeholder="Ej: 450000" value={price} onChange={e => setPrice(e.target.value)} required min="0" />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Dirección o Edificio</label>
                <input type="text" className="input" placeholder="Ej: Edificio Los Pinos, Calle 4 #12-34" value={address} onChange={e => setAddress(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Servicios Incluidos</label>
                <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <label><input type="checkbox" name="wifi" checked={services.wifi} onChange={handleServiceChange} /> WiFi</label>
                  <label><input type="checkbox" name="bano_privado" checked={services.bano_privado} onChange={handleServiceChange} /> Baño Privado</label>
                  <label><input type="checkbox" name="cocina" checked={services.cocina} onChange={handleServiceChange} /> Acceso a Cocina</label>
                  <label><input type="checkbox" name="amoblado" checked={services.amoblado} onChange={handleServiceChange} /> Amoblado</label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Ubicación en el Mapa</label>
                <small style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Haz clic en el mapa para ubicar tu habitación con exactitud.</small>
                <div style={{ height: '250px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <MapContainer center={location} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={location} setPosition={setLocation} />
                  </MapContainer>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Fotografías</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="input" style={{ padding: '0.5rem' }} />
                <small style={{ color: 'var(--text-muted)' }}>
                  {isEditMode ? 'Si subes nuevas imágenes, reemplazarán a las anteriores.' : 'Puedes seleccionar varias imágenes.'}
                </small>
                {isEditMode && existingImages.length > 0 && images.length === 0 && (
                  <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                    Se mantendrán {existingImages.length} imágenes actuales.
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            {currentStep > 1 ? (
              <button type="button" className="btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={() => setCurrentStep(prev => prev - 1)}>
                Atrás
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <button type="submit" className="btn btn-primary">
                Siguiente
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Procesando...' : (isEditMode ? 'Guardar Cambios' : 'Publicar Habitación')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
