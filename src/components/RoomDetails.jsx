import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import CryptoJS from 'crypto-js';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Star, Check, MapPin, Trash2, Heart, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer', marginBottom: '1rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            color: star <= (hover || rating) ? '#fbbf24' : '#e5e7eb',
            transition: 'color 0.2s',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Star size={32} fill={star <= (hover || rating) ? '#fbbf24' : 'none'} color={star <= (hover || rating) ? '#fbbf24' : '#e5e7eb'} />
        </span>
      ))}
    </div>
  );
};

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [room, setRoom] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState({ visible: false, action: null, message: '' });

  const openGallery = (index) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const closeGallery = () => setGalleryOpen(false);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', id));
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoom({ id: roomDoc.id, ...data });
          
          if (data.ownerId) {
            const ownerDoc = await getDoc(doc(db, 'users', data.ownerId));
            if (ownerDoc.exists()) {
              setOwnerName(ownerDoc.data().name || 'Anfitrión Desconocido');
            }
          }
        }
        
        // Fetch reviews
        const q = query(collection(db, 'reviews'), where('roomId', '==', id));
        const revSnapshot = await getDocs(q);
        const revData = revSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        revData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

        // Fetch users map for reviews
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersMap = {};
        usersSnap.forEach(u => usersMap[u.id] = u.data().name || u.id.substring(0,5));

        const enrichedReviews = revData.map(r => ({
          ...r,
          studentName: usersMap[r.studentId] || r.studentId.substring(0,5)
        }));

        setReviews(enrichedReviews);

      } catch (error) {
        console.error("Error fetching room details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const handleReserve = async () => {
    if (!auth.currentUser) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { view: 'register' } }));
      return;
    }
      if (room.ownerId === auth.currentUser.uid) {
        toast.error("No puedes reservar tu propia habitación.");
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
      toast.success("Solicitud de reserva enviada con éxito.");
    } catch (err) {
      console.error(err);
      toast.error("Hubo un error al procesar la reserva.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleContact = async () => {
    if (!auth.currentUser) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { view: 'register' } }));
      return;
    }
    if (auth.currentUser && auth.currentUser.uid === room.ownerId) {
      toast.error("Esta es tu publicación.");
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

  const deleteCloudinaryImage = async (url) => {
    try {
      const uploadSplit = url.split('/upload/');
      if (uploadSplit.length < 2) return;
      
      let path = uploadSplit[1]; 
      const pathParts = path.split('/');
      let actualPublicIdPath = pathParts.filter(p => !p.startsWith('v') && !p.includes(',')).join('/');
      const finalPublicId = actualPublicIdPath.split('.')[0];
  
      const timestamp = Math.round((new Date).getTime()/1000);
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
      const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
      
      const stringToSign = `public_id=${finalPublicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = CryptoJS.SHA1(stringToSign).toString();
  
      const formData = new FormData();
      formData.append('public_id', finalPublicId);
      formData.append('signature', signature);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
  
      await fetch('https://api.cloudinary.com/v1_1/fkkxlihv/image/destroy', {
        method: 'POST',
        body: formData
      });
    } catch (e) {
      console.error("Cloudinary delete error:", e);
    }
  };

  const confirmDeleteRoom = () => {
    setShowConfirm({
      visible: true,
      message: "¿Estás seguro de que quieres eliminar esta habitación? Esta acción no se puede deshacer.",
      action: handleDelete
    });
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      // Borrar imágenes de Cloudinary
      if (room.images && room.images.length > 0) {
        for (const url of room.images) {
          await deleteCloudinaryImage(url);
        }
      }
      
      // Borrar documento de Firestore
      await deleteDoc(doc(db, 'rooms', id));
      toast.success("Habitación eliminada");
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar la habitación");
      setActionLoading(false);
    }
  };

  const handleDeleteReview = (reviewId) => {
    setShowConfirm({
      visible: true,
      message: "¿Estás seguro de que quieres eliminar esta reseña?",
      action: async () => {
        try {
          await deleteDoc(doc(db, 'reviews', reviewId));
          setReviews(reviews.filter(r => r.id !== reviewId));
          toast.success("Reseña eliminada");
        } catch (err) {
          console.error(err);
          toast.error("Error al eliminar la reseña");
        }
      }
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return navigate('/login');
    if (room.ownerId === auth.currentUser.uid) {
      toast.error("No puedes valorar tu propia habitación.");
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
        studentName: userData?.name || 'Tú',
        rating: Number(newReview.rating), 
        comment: newReview.comment 
      }, ...reviews]);
      
      setNewReview({ rating: 5, comment: '' });
      toast.success("Reseña publicada");
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar la reseña");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Cargando detalles...</div>;
  if (!room) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Habitación no encontrada.</div>;
  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: 0 }}>{room.title}</h1>
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(room.id); }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
        >
          <Heart size={24} fill={favorites.includes(room.id) ? "var(--error-text)" : "none"} color={favorites.includes(room.id) ? "var(--error-text)" : "var(--text-secondary)"} />
        </button>
      </div>
      
      {/* Galería de Fotos Airbnb Style */}
      {room.images && room.images.length > 0 ? (
        <div className="grid-mobile-1 mobile-carousel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', height: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{ minWidth: '100%', height: '100%' }}>
            <img onClick={() => openGallery(0)} src={room.images[0]} alt="Foto principal" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }} className="gallery-img" />
          </div>
          <div className="hide-on-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0.5rem' }}>
            {/* Si no hay 5 fotos, rellenamos repitiendo para mantener la cuadricula estética */}
            <img onClick={() => openGallery(1 % room.images.length)} src={room.images[1] || room.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }} className="gallery-img" />
            <img onClick={() => openGallery(2 % room.images.length)} src={room.images[2] || room.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }} className="gallery-img" />
            <img onClick={() => openGallery(3 % room.images.length)} src={room.images[3] || room.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }} className="gallery-img" />
            <img onClick={() => openGallery(4 % room.images.length)} src={room.images[4] || room.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }} className="gallery-img" />
          </div>
          {/* Extra slides for mobile carousel */}
          {room.images.slice(1).map((img, idx) => (
            <div key={idx} className="show-on-mobile" style={{ minWidth: '100%', height: '100%' }}>
              <img onClick={() => openGallery(idx + 1)} src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
          <button 
            onClick={() => openGallery(0)}
            className="btn"
            style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'white', color: 'black', border: '1px solid black', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}
          >
            <span>▦</span> Mostrar todas las fotos
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', height: '400px', background: 'var(--border-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem' }}>
          Sin imágenes
        </div>
      )}

      {/* Contenido Dividido */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'flex-start' }}>
        
        {/* Columna Izquierda (Detalles) */}
        <div style={{ flex: '1 1 600px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Anfitrión: {ownerName || room.ownerId.substring(0,6)}</h2>
          <p style={{ color: 'var(--text-secondary)', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            Ubicación Premium · Habitación para estudiantes
          </p>
          
          <div style={{ padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Acerca de este espacio</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
              {room.description}
            </p>
          </div>
          
          <div style={{ padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Lo que este lugar ofrece</h3>
            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {room.services && room.services.map((s, i) => (
                <li key={i} style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  <Check size={20} color="var(--success-text)" /> <span style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
                </li>
              ))}
            </div>
          </div>

          <div style={{ padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Ubicación</h3>
            {room.address && <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              <MapPin size={20} color="var(--primary)" /> {room.address}
            </p>}
            <div style={{ height: '350px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MapContainer center={room.location ? [room.location.lat, room.location.lng] : [7.3768, -72.6481]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={room.location ? [room.location.lat, room.location.lng] : [7.3768, -72.6481]} />
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Columna Derecha (Caja de Reserva Sticky) */}
        <div className="hide-on-mobile" style={{ flex: '1 1 300px', position: 'sticky', top: '100px' }}>
          <div className="reservation-box">
            <h2 style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${room.price.toLocaleString('es-CO')}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> / mes</span>
            </h2>
            
            <button 
              className="btn btn-primary" 
              onClick={handleReserve}
              disabled={actionLoading}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}
            >
              {actionLoading ? 'Procesando...' : 'Reservar'}
            </button>
            <button 
              className="btn" 
              onClick={handleContact}
              disabled={actionLoading}
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)' }}
            >
              Contactar al Anfitrión
            </button>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>No se te cobrará nada aún.</p>
            
            {/* Opciones de Administración / Dueño */}
            {currentUser && (currentUser.uid === room.ownerId || isAdmin) && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => navigate(`/edit-room/${id}`)}>
                    Editar
                  </button>
                  <button className="btn" style={{ background: 'var(--error-text)', color: 'white' }} onClick={confirmDeleteRoom} disabled={actionLoading}>
                    {actionLoading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE RESEÑAS --- */}
      <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Valoraciones y Comentarios</h2>
        
        {auth.currentUser && auth.currentUser.uid !== room.ownerId && (
          <form onSubmit={handleReviewSubmit} style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '1rem' }}>Deja tu reseña</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <label style={{ fontWeight: '500' }}>Calificación:</label>
              <StarRating rating={newReview.rating} setRating={(rating) => setNewReview({...newReview, rating})} />
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Usuario: {rev.studentName}</span>
                      {auth.currentUser && auth.currentUser.uid === rev.studentId && (
                        <button onClick={() => handleDeleteReview(rev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem' }} title="Eliminar mi reseña">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(rev.rating)].map((_, i) => <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />)}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Full-Screen Gallery Modal */}
      {galleryOpen && room.images && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            onClick={closeGallery} 
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: 'white', border: 'none', fontSize: '2rem', cursor: 'pointer', padding: '1rem' }}
          >
            ✕
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1000px', padding: '0 2rem' }}>
            <button onClick={prevImage} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              &larr;
            </button>
            
            <img 
              src={room.images[currentImageIndex]} 
              alt={`Foto ${currentImageIndex + 1}`} 
              style={{ maxHeight: '80vh', maxWidth: '80%', objectFit: 'contain' }} 
            />
            
            <button onClick={nextImage} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              &rarr;
            </button>
          </div>
          
          <div style={{ color: 'white', marginTop: '1rem', fontSize: '1.1rem' }}>
            {currentImageIndex + 1} / {room.images.length}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ backgroundColor: 'var(--background, #f7f7f9)', padding: '2rem', maxWidth: '400px', textAlign: 'center', margin: '1rem', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Confirmar acción</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>{showConfirm.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" style={{ backgroundColor: '#f1f5f9', color: 'var(--text-primary)' }} onClick={() => setShowConfirm({ visible: false, action: null, message: '' })}>Cancelar</button>
              <button className="btn" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => {
                showConfirm.action();
                setShowConfirm({ visible: false, action: null, message: '' });
              }}>Sí, continuar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mobile-bottom-bar show-on-mobile">
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${room.price.toLocaleString('es-CO')}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ mes</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn"
            onClick={handleContact}
            disabled={actionLoading}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleReserve}
            disabled={actionLoading}
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontSize: '1rem' }}
          >
            {actionLoading ? '...' : 'Reservar'}
          </button>
        </div>
      </div>

    </div>
  );
}
