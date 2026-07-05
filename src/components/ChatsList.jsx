import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';

export default function ChatsList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Traer los chats donde el usuario sea el estudiante (solicitante) o el dueño de la habitación
    const q = query(
      collection(db, 'chats'),
      or(
        where('studentId', '==', auth.currentUser.uid),
        where('ownerId', '==', auth.currentUser.uid)
      )
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar por fecha de actualización (el más reciente primero)
      chatsData.sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (!auth.currentUser) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Debes iniciar sesión.</div>;

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '800px' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Mis Mensajes</h2>

      {loading ? (
        <div style={{ textAlign: 'center' }}>Cargando chats...</div>
      ) : chats.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No tienes ninguna conversación activa todavía.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {chats.map(chat => {
            const isOwner = chat.ownerId === auth.currentUser.uid;
            return (
              <Link key={chat.id} to={`/chat/${chat.id}`} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>{chat.roomTitle}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                    {isOwner ? 'Estudiante interesado' : 'Contactando al Propietario'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  {chat.lastMessage ? chat.lastMessage : 'Sin mensajes aún. ¡Escribe algo!'}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
