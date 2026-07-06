import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, or, getDocs } from 'firebase/firestore';
import { User, MessageCircle } from 'lucide-react';

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
    
    let usersMap = {};
    const fetchUsers = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(doc => {
        usersMap[doc.id] = doc.data();
      });
    };

    fetchUsers().then(() => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        chatsData.sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
        setChats(chatsData.map(c => ({
          ...c,
          otherUser: usersMap[c.ownerId === auth.currentUser.uid ? c.studentId : c.ownerId]
        })));
        setLoading(false);
      });
      return unsubscribe;
    });

    return () => {
      // Return a cleanup if needed
    };
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
            const otherUser = chat.otherUser;
            return (
              <Link key={chat.id} to={`/chat/${chat.id}`} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                  {otherUser?.photoUrl ? (
                    <img src={otherUser.photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={24} color="var(--text-muted)" />
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                    <h3 className="text-truncate" style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                      {otherUser?.name || 'Usuario'}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                      {chat.updatedAt ? new Date(chat.updatedAt.toMillis()).toLocaleDateString() : ''}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="text-truncate" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                      {chat.lastMessage ? chat.lastMessage : 'Sin mensajes aún. ¡Escribe algo!'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>
                    Habitación: {chat.roomTitle}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
