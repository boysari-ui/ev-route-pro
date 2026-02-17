// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC89PJlcTAGJtwVGE9s9t9JAWs6QaOxl5E",
  authDomain: "ev-route-saas.firebaseapp.com",
  projectId: "ev-route-saas",
  storageBucket: "ev-route-saas.firebasestorage.app",
  messagingSenderId: "1057621696336",
  appId: "1:1057621696336:web:3cb1d29c4a3445a1089655",
  measurementId: "G-F2WF4LM5XJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);