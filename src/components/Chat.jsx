import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch chat info
  useEffect(() => {
    const fetchChatInfo = async () => {
      const docSnap = await getDoc(doc(db, 'chats', chatId));
      if (docSnap.exists()) {
        setChatInfo({ id: docSnap.id, ...docSnap.data() });
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

  if (!auth.currentUser) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Debes iniciar sesión.</div>;

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '800px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>&larr; Volver</Link>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
          {chatInfo ? `Chat sobre: ${chatInfo.roomTitle}` : 'Cargando chat...'}
        </h2>
      </div>

      <div style={{ flex: 1, background: 'var(--background)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map(msg => {
          const isMine = msg.senderId === auth.currentUser.uid;
          return (
            <div key={msg.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              <div style={{ 
                background: isMine ? 'var(--primary)' : 'var(--surface)', 
                color: isMine ? 'white' : 'var(--text-primary)',
                padding: '0.75rem 1rem', 
                borderRadius: isMine ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                border: isMine ? 'none' : '1px solid var(--border)'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Escribe un mensaje..." 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary">Enviar</button>
      </form>
    </div>
  );
}
