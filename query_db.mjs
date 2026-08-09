import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0cjn1bSmYg3JsuBLYw0wFIrx62-qlJwU",
  authDomain: "sona-emporda.firebaseapp.com",
  projectId: "sona-emporda",
  storageBucket: "sona-emporda.firebasestorage.app",
  messagingSenderId: "616535257427",
  appId: "1:616535257427:web:e60605f9efd1bea13f71a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEvents() {
  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    console.log("Total events:", querySnapshot.size);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data().title, doc.data().venueName);
    });
    process.exit(0);
  } catch (error) {
    console.error("Error reading events:", error);
    process.exit(1);
  }
}

checkEvents();
