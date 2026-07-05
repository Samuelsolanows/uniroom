import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Reemplaza este objeto con la configuración de tu proyecto en Firebase Console.
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo (ej. "UniRoom Pamplona")
// 3. Añade una aplicación Web (</>)
const firebaseConfig = {
  apiKey: "AIzaSyAronq_w6DZFgSI3_RaA0ey9sUAXh1fKyU",
  authDomain: "uniroom-pamplona.firebaseapp.com",
  projectId: "uniroom-pamplona",
  storageBucket: "uniroom-pamplona.firebasestorage.app",
  messagingSenderId: "651193681752",
  appId: "1:651193681752:web:d2eb0ad3d2b995e697872d",
  measurementId: "G-7VP8D9PYNZ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
