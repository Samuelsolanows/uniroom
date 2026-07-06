import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Send, ArrowLeft, User } from 'lucide-react';

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch chat info
  useEffect(() => {
    const fetchChatInfo = async () => {
      const docSnap = await getDoc(doc(db, 'chats', chatId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChatInfo({ id: docSnap.id, ...data });
        
        if (auth.currentUser) {
          const otherId = data.ownerId === auth.currentUser.uid ? data.studentId : data.ownerId;
          const otherUserSnap = await getDoc(doc(db, 'users', otherId));
          if (otherUserSnap.exists()) {
            setOtherUser(otherUserSnap.data());
          }
        }
      }
    };
    fetchChatInfo();
  }, [chatId]);

  // Listen for messages in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      const msgText = newMessage.trim();
      setNewMessage('');
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: msgText,
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: msgText,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!chatInfo || !auth.currentUser) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Cargando chat...</div>;

  const isOwner = chatInfo.ownerId === auth.currentUser.uid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#efeae2' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
        <Link to="/chats" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {otherUser?.photoUrl ? (
            <img src={otherUser.photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} color="var(--text-muted)" />
          )}
        </div>
        
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
            {otherUser?.name || 'Usuario'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isOwner ? 'Interesado en:' : 'Propietario de:'} <Link to={`/room/${chatInfo.roomId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{chatInfo.roomTitle}</Link>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No hay mensajes todavía.</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Envía un mensaje para comenzar la conversación.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === auth.currentUser.uid;
            return (
              <div key={msg.id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: isMe ? '#d9fdd3' : 'var(--surface)',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                borderTopRightRadius: isMe ? '0px' : '12px',
                borderTopLeftRadius: !isMe ? '0px' : '12px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <p style={{ margin: 0, color: 'var(--text-primary)', wordBreak: 'break-word', fontSize: '0.95rem' }}>{msg.text}</p>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '0.2rem' }}>
                  {msg.createdAt ? new Date(msg.createdAt.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input
          type="text"
          className="input"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '0.75rem 1.25rem', margin: 0, border: 'none', background: '#f0f2f5' }}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          style={{ 
            background: newMessage.trim() ? 'var(--primary)' : 'var(--border)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '50%', 
            width: '45px', 
            height: '45px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: newMessage.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s'
          }}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
