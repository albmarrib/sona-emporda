import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = { projectId: "sona-emporda" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const querySnapshot = await getDocs(collection(db, "events"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.venueName && data.venueName.includes("Mirona")) {
      console.log(doc.id, JSON.stringify(data, null, 2));
    }
  });
}
run();
