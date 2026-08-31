import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, query, orderBy, getDoc } from 'firebase/firestore';

// OLD project - with custom database ID
const oldApp = initializeApp({
  apiKey: "AIzaSyCHxjl97vwJZ1v_QOsXplczI__dhHu7xso",
  authDomain: "tenacious-compound-ldtd0.firebaseapp.com",
  projectId: "tenacious-compound-ldtd0",
  storageBucket: "tenacious-compound-ldtd0.firebasestorage.app",
  messagingSenderId: "387559525439",
}, 'old');

// NEW project
const newApp = initializeApp({
  apiKey: "AIzaSyDE0Pqe9z8neXWrJM2NUAi4bWT38iPkEoc",
  authDomain: "doit-80b61.firebaseapp.com",
  projectId: "doit-80b61",
  storageBucket: "doit-80b61.firebasestorage.app",
  messagingSenderId: "64389748985",
  appId: "1:64389748985:web:bebed47f6a0c234478ea28",
}, 'new');

// Old project has a named database
const OLD_DB_ID = 'ai-studio-doitobsidiantask-1faa4df2-25a7-4cd7-a0e0-cd7c8451bc4c';
const oldDb = getFirestore(oldApp, OLD_DB_ID);
const newDb = getFirestore(newApp);

const USER_MAP = {
  's.puzderliski@gmail.com': '8cM8uK95UkRGEt3T2KlHfAm3ezu2',
  'aleksa.puzderliski@gmail.com': 'Lx27PgMCWocy6T6HLDW3YY1HvhD3',
};

async function migrateSubcollection(oldUid, newUid, subcollection) {
  try {
    const oldRef = collection(oldDb, 'users', oldUid, subcollection);
    const snapshot = await getDocs(oldRef);
    let count = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      await setDoc(doc(newDb, 'users', newUid, subcollection, docSnap.id), data);
      count++;
    }
    return count;
  } catch (err) {
    console.log(`    Subcollection ${subcollection} error: ${err.message}`);
    return 0;
  }
}

async function migrateUser(oldUid, newUid, email) {
  console.log(`\nMigrating ${email}...`);
  console.log(`  Old UID: ${oldUid}`);
  
  // Migrate profile
  try {
    const profileSnap = await getDoc(doc(oldDb, 'users', oldUid));
    if (profileSnap.exists()) {
      await setDoc(doc(newDb, 'users', newUid), profileSnap.data());
      console.log(`  Profile: OK`);
    } else {
      console.log(`  Profile: not found`);
    }
  } catch (err) {
    console.log(`  Profile error: ${err.message}`);
  }

  // Migrate subcollections
  for (const sub of ['tasks', 'categories', 'fitnessEntries', 'notifications']) {
    const count = await migrateSubcollection(oldUid, newUid, sub);
    if (count > 0) console.log(`  ${sub}: ${count} documents`);
  }
}

async function main() {
  console.log('=== Firestore Data Migration ===');
  console.log('Old: tenacious-compound-ldtd0');
  console.log('New: doit-80b61\n');

  for (const [email, oldUid] of Object.entries(USER_MAP)) {
    await migrateUser(oldUid, oldUid, email);
  }

  console.log('\nMigration complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
