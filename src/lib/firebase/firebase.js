// Import the functions you need from the SDKs you need
import { deleteApp, getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyA8BMXbnNa3uL5gMtXI-GlkG0wod16Vshs",
  authDomain: "ww-loja-de-ti.firebaseapp.com",
  projectId: "ww-loja-de-ti",
  storageBucket: "ww-loja-de-ti.appspot.com",
  messagingSenderId: "1065759284234",
  appId: "1:1065759284234:web:3546542c5a21948f04d3f3"

};

// Initialize Firebase
let firebaseApp
if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApp()
    deleteApp(firebaseApp)
    firebaseApp = initializeApp(firebaseConfig)
}

export const db = getFirestore(firebaseApp)
export const auth = getAuth(firebaseApp)
export const storage = getStorage(firebaseApp);