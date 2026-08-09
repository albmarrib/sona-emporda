import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./.firebaserc', 'utf8'));
// wait .firebaserc only has projects. We need the actual config. 
