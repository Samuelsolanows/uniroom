import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function PublishRoom() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [services, setServices] = useState({
    wifi: false,
    bano_privado: false,
    cocina: false,
    amoblado: false
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      uploadedUrls.push(data.secure_url);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    setError('');

    try {
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImagesToCloudinary();
      }

      // Filtrar los servicios que están en true
      const activeServices = Object.keys(services).filter(key => services[key]);

      await addDoc(collection(db, 'rooms'), {
        ownerId: auth.currentUser.uid,
        title,
        description,
        price: Number(price),
        services: activeServices,
        images: imageUrls,
        status: 'disponible',
        createdAt: new Date().toISOString()
      });

      navigate('/my-rooms');
    } catch (err) {
      console.error(err);
      setError(`Error al publicar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '600px' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>Publicar Habitación</h2>
        
        {error && (
          <div style={{ background: 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Servicios Incluidos</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label><input type="checkbox" name="wifi" checked={services.wifi} onChange={handleServiceChange} /> WiFi</label>
              <label><input type="checkbox" name="bano_privado" checked={services.bano_privado} onChange={handleServiceChange} /> Baño Privado</label>
              <label><input type="checkbox" name="cocina" checked={services.cocina} onChange={handleServiceChange} /> Acceso a Cocina</label>
              <label><input type="checkbox" name="amoblado" checked={services.amoblado} onChange={handleServiceChange} /> Amoblado</label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Fotografías</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="input" style={{ padding: '0.5rem' }} />
            <small style={{ color: 'var(--text-muted)' }}>Puedes seleccionar varias imágenes.</small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Subiendo e guardando...' : 'Publicar Habitación'}
          </button>
        </form>
      </div>
    </div>
  );
}
