import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', id));
        if (roomDoc.exists()) {
          setRoom({ id: roomDoc.id, ...roomDoc.data() });
        }
        
        // Fetch reviews
        const q = query(collection(db, 'reviews'), where('roomId', '==', id));
        const revSnapshot = await getDocs(q);
        const revData = revSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        revData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setReviews(revData);

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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return navigate('/login');
    if (room.ownerId === auth.currentUser.uid) {
      alert("No puedes valorar tu propia habitación.");
      return;
    }

    try {
      setActionLoading(true);
      const docRef = await addDoc(collection(db, 'reviews'), {
        roomId: room.id,
        studentId: auth.currentUser.uid,
        rating: Number(newReview.rating),
        comment: newReview.comment,
        createdAt: serverTimestamp()
      });
      
      // Update local state to show immediately
      setReviews([{ 
        id: docRef.id, 
        studentId: auth.currentUser.uid, 
        rating: Number(newReview.rating), 
        comment: newReview.comment 
      }, ...reviews]);
      
      setNewReview({ rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
      alert("Error al enviar la reseña");
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

      {/* --- SECCIÓN DE RESEÑAS --- */}
      <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Valoraciones y Comentarios</h2>
        
        {auth.currentUser && auth.currentUser.uid !== room.ownerId && (
          <form onSubmit={handleReviewSubmit} style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '1rem' }}>Deja tu reseña</h4>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <label>Calificación:</label>
              <select className="input" value={newReview.rating} onChange={e => setNewReview({...newReview, rating: e.target.value})} style={{ width: '100px' }}>
                <option value="5">⭐⭐⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="2">⭐⭐</option>
                <option value="1">⭐</option>
              </select>
            </div>
            <textarea 
              className="input" 
              rows="3" 
              placeholder="¿Qué te pareció este lugar?" 
              required
              value={newReview.comment}
              onChange={e => setNewReview({...newReview, comment: e.target.value})}
              style={{ marginBottom: '1rem' }}
            ></textarea>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              Publicar Reseña
            </button>
          </form>
        )}

        <div>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Aún no hay reseñas para esta habitación. ¡Sé el primero!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(rev => (
                <div key={rev.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Usuario: {rev.studentId.substring(0,5)}...</span>
                    <span>{"⭐".repeat(rev.rating)}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
