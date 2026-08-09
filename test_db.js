import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./.firebaserc', 'utf8')).projects.default;
// Wait, we need the actual config from src/firebase/firebase.ts
