import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword as signIn, createUserWithEmailAndPassword as signUp, updateProfile as updateP, GoogleAuthProvider as GoogleP, signInWithPopup as signPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { X, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('estudiante');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor ingresa tu correo y contraseña');
      return;
    }
    
    if (view === 'register' && !name) {
      toast.error('Por favor ingresa tu nombre completo');
      return;
    }

    setLoading(true);

    try {
      if (view === 'login') {
        await signIn(auth, email, password);
        toast.success('Sesión iniciada correctamente');
        onClose();
      } else {
        const userCredential = await signUp(auth, email, password);
        await updateP(userCredential.user, { displayName: name });
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          email,
          role,
          createdAt: new Date().toISOString()
        });
        
        toast.success('Cuenta creada exitosamente');
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const provider = new GoogleP();
      const result = await signPopup(auth, provider);
      
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName,
        email: result.user.email,
        role: 'estudiante',
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      toast.success('Sesión iniciada con Google');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error con Google login');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px',
        maxHeight: '95vh', overflowY: 'auto',
        position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }} className="animation-zoomIn">
        
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: '2rem 2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>
            {view === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {view === 'login' ? 'Ingresa para gestionar tus habitaciones' : 'Únete a Quick Salk y encuentra tu espacio ideal'}
          </p>
        </div>

        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {view === 'register' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Nombre completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Tu nombre" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ paddingLeft: '2.5rem', margin: 0 }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="input" 
                  placeholder="correo@ejemplo.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={{ paddingLeft: '2.5rem', margin: 0 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="input" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ paddingLeft: '2.5rem', margin: 0 }}
                />
              </div>
            </div>

            {view === 'register' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>¿Qué buscas hacer?</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ margin: 0 }}>
                  <option value="estudiante">Buscar Habitación (Estudiante)</option>
                  <option value="propietario">Publicar Habitación (Propietario)</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Procesando...' : (view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ padding: '0 1rem', fontSize: '0.8rem' }}>o continuar con</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogle} 
            className="btn" 
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {view === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button 
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
            >
              {view === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
