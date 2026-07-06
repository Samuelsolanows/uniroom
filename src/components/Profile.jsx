import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Camera, Image as ImageIcon, User, LogOut, Loader2 } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', role: '', photoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData({ photoUrl: '', ...docSnap.data() });
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { name: profileData.name }, { merge: true });
      toast.success('Perfil actualizado exitosamente.');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'uniroom_preset');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/fkkxlihv/image/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      const newUrl = data.secure_url;
      
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { photoUrl: newUrl }, { merge: true });
      
      setProfileData({ ...profileData, photoUrl: newUrl });
      toast.success('Foto de perfil actualizada');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '900px' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Configuración de Perfil</h1>
      
      <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Photo & Actions */}
        <div className="card" style={{ padding: '2rem', textAlign: 'center', height: 'fit-content' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 1.5rem', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {uploadingImage ? (
              <Loader2 className="animate-spin" size={40} color="var(--primary)" />
            ) : profileData.photoUrl ? (
              <img src={profileData.photoUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={80} color="var(--text-muted)" />
            )}
          </div>
          
          <h3 style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>{profileData.role || 'Usuario'}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{user?.email}</p>

          <input type="file" accept="image/*" capture="user" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => cameraInputRef.current.click()} disabled={uploadingImage}>
              <Camera size={18} /> Tomar Foto
            </button>
            <button className="btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => fileInputRef.current.click()} disabled={uploadingImage}>
              <ImageIcon size={18} /> Subir Foto
            </button>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Información Personal</h2>
          
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre Completo</label>
              <input 
                type="text" 
                className="input" 
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Correo Electrónico (No editable)</label>
              <input 
                type="email" 
                className="input" 
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--error-text)' }}>Zona de Peligro</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Cerrar tu sesión actual.</p>
            </div>
            <button onClick={handleLogout} className="btn" style={{ background: 'transparent', border: '1px solid var(--error-text)', color: 'var(--error-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
