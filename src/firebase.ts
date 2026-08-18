import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signOut as fbSignOut, 
  onAuthStateChanged, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Task, Category, AppNotification, AuthUser } from './types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if present
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const LOCAL_AUTH_STORAGE_KEY = 'doit_local_auth_profile_v2';

export function getLocalAuthSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalAuthSession(user: AuthUser) {
  try {
    localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearLocalAuthSession() {
  try {
    localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
  } catch {}
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Popup failed:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, name?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  return result.user;
}

export async function signInAnonymouslyUser(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  clearLocalAuthSession();
  try {
    await fbSignOut(auth);
  } catch {}
}

// User Profile Database Sync
export async function syncUserProfile(user: AuthUser | User) {
  if (!user || !user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    } else {
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
        email: user.email || snap.data().email,
        displayName: user.displayName || snap.data().displayName || 'User',
        photoURL: user.photoURL || snap.data().photoURL || ''
      });
    }
  } catch (e) {
    console.warn('Could not sync user profile to Firestore:', e);
  }
}

// User Tasks Real-Time Firestore Sync
export function subscribeToUserTasks(userId: string, onUpdate: (tasks: Task[]) => void, onError?: (error: any) => void) {
  try {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tasks.push({
          id: docSnap.id,
          title: data.title || 'Untitled Task',
          description: data.description || '',
          priority: data.priority || 'medium',
          categoryId: data.categoryId || 'cat-work',
          completed: !!data.completed,
          completedAt: data.completedAt,
          createdAt: data.createdAt || new Date().toISOString(),
          dueDate: data.dueDate || new Date().toISOString(),
          estimatedMinutes: data.estimatedMinutes || 15,
          recurring: data.recurring || { type: 'none' },
          subtasks: data.subtasks || [],
          tags: data.tags || [],
          reminderEmail: data.reminderEmail || '',
          reminderMinutesBefore: data.reminderMinutesBefore,
          reminderSent: !!data.reminderSent,
          isImportant: !!data.isImportant,
          isUrgent: !!data.isUrgent,
          order: typeof data.order === 'number' ? data.order : 0
        });
      });
      // Sort by order or createdAt
      tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
      onUpdate(tasks);
    }, (err) => {
      console.warn('Firestore user tasks note:', err?.message || err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('Firestore subscription catch:', err);
    if (onError) onError(err);
    return () => {};
  }
}

// Task CRUD in Firestore
export async function saveUserTaskToFirestore(userId: string, task: Task): Promise<void> {
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(taskRef, {
      ...task,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore save task note:', err);
    throw err;
  }
}

export async function deleteUserTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (err) {
    console.warn('Firestore delete task note:', err);
    throw err;
  }
}

export async function batchUpdateTasksOrderInFirestore(userId: string, tasks: Task[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    tasks.forEach((t, idx) => {
      const taskRef = doc(db, 'users', userId, 'tasks', t.id);
      batch.update(taskRef, { order: idx });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore batch update note:', err);
  }
}

// User Categories Firestore Sync
export function subscribeToUserCategories(userId: string, onUpdate: (cats: Category[]) => void) {
  try {
    const catsRef = collection(db, 'users', userId, 'categories');
    return onSnapshot(catsRef, (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const cats: Category[] = [];
        snapshot.forEach((docSnap) => {
          cats.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        onUpdate(cats);
      }
    }, (err) => {
      console.warn('Firestore categories subscription note:', err?.message || err);
    });
  } catch (err) {
    return () => {};
  }
}

export async function saveUserCategoryToFirestore(userId: string, cat: Category): Promise<void> {
  try {
    const catRef = doc(db, 'users', userId, 'categories', cat.id);
    await setDoc(catRef, cat, { merge: true });
  } catch (err) {
    console.warn('Firestore save category note:', err);
  }
}

// User App Notifications Firestore Sync
export function subscribeToUserNotifications(userId: string, onUpdate: (notifs: AppNotification[]) => void) {
  try {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notifsRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
      });
      onUpdate(notifs);
    }, (err) => {
      console.warn('Firestore notifications subscription note:', err?.message || err);
    });
  } catch (err) {
    return () => {};
  }
}

export async function saveUserNotificationToFirestore(userId: string, notif: AppNotification): Promise<void> {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notif.id);
    await setDoc(notifRef, notif, { merge: true });
  } catch (err) {
    console.warn('Firestore save notification note:', err);
  }
}

export async function markAllNotificationsReadInFirestore(userId: string, notifIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    notifIds.forEach(id => {
      const ref = doc(db, 'users', userId, 'notifications', id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore mark read note:', err);
  }
}

export async function clearAllNotificationsInFirestore(userId: string, notifIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    notifIds.forEach(id => {
      const ref = doc(db, 'users', userId, 'notifications', id);
      batch.delete(ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore clear notifications note:', err);
  }
}

export async function deleteSingleNotificationFromFirestore(userId: string, notifId: string): Promise<void> {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notifId);
    await deleteDoc(notifRef);
  } catch (err) {
    console.warn('Firestore delete notification note:', err);
  }
}
