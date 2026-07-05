import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', id));
        if (roomDoc.exists()) {
          setRoom({ id: roomDoc.id, ...roomDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching room details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const handleReserve = async () => {
    if (!auth.currentUser) return navigate('/login');
    if (room.ownerId === auth.currentUser.uid) {
      alert("No puedes reservar tu propia habitación.");
      return;
    }

    setActionLoading(true);
    try {
      await addDoc(collection(db, 'reservations'), {
        roomId: room.id,
        studentId: auth.currentUser.uid,
        ownerId: room.ownerId,
        status: 'pendiente',
        roomTitle: room.title,
        createdAt: serverTimestamp()
      });
      alert("Solicitud de reserva enviada con éxito.");
      navigate('/reservations');
    } catch (error) {
      console.error("Error al reservar:", error);
      alert("Hubo un error al procesar la reserva.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleContact = async () => {
    if (!auth.currentUser) return navigate('/login');
    if (room.ownerId === auth.currentUser.uid) {
      alert("Esta es tu publicación.");
      return;
    }
    
    // Create or navigate to chat
    setActionLoading(true);
    try {
      const newChat = await addDoc(collection(db, 'chats'), {
        roomId: room.id,
        roomTitle: room.title,
        studentId: auth.currentUser.uid,
        ownerId: room.ownerId,
        updatedAt: serverTimestamp()
      });
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error("Error al iniciar chat:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Cargando detalles...</div>;
  if (!room) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Habitación no encontrada.</div>;

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '800px' }}>
      <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Volver al buscador
      </Link>
      
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>{room.title}</h1>
        
        {room.images && room.images.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {room.images.map((img, idx) => (
              <img key={idx} src={img} alt={`Habitación ${idx}`} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : (
          <div style={{ width: '100%', height: '250px', background: 'var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            Sin imágenes
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ flex: '1 1 400px' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>
              ${room.price.toLocaleString('es-CO')} / mes
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {room.description}
            </p>
            
            <h3 style={{ marginBottom: '0.5rem' }}>Servicios:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {room.services && room.services.map(s => (
                <span key={s} style={{ background: 'var(--background)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', border: '1px solid var(--border)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 250px', background: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleReserve}
              disabled={actionLoading}
              style={{ width: '100%' }}
            >
              {actionLoading ? 'Procesando...' : 'Solicitar Reserva'}
            </button>
            <button 
              className="btn" 
              onClick={handleContact}
              disabled={actionLoading}
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              Contactar al Propietario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
