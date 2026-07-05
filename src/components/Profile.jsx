import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch extra data from Firestore
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
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
    setMessage('');
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { name: profileData.name });
      setMessage('Perfil actualizado exitosamente.');
    } catch (err) {
      console.error(err);
      setMessage('Error al actualizar el perfil.');
    } finally {
      setSaving(false);
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
    <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--primary)' }}>Mi Perfil</h2>
          <span style={{ background: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize' }}>
            {profileData.role || 'Usuario'}
          </span>
        </div>

        {message && (
          <div style={{ background: message.includes('Error') ? 'var(--accent)' : 'var(--secondary)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

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
          
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        <button onClick={handleLogout} className="btn" style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
