import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  where,
  writeBatch,
  limit as firestoreLimit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Task, Category, AppNotification, AuthUser, FitnessEntry, UserProfile, Group, GroupTask, GroupMember, GroupTaskComment } from './types';

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
export const db = getFirestore(app);

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
    // Popup was blocked or the user closed it. Fall back to a redirect flow
    // (browsers reliably allow redirect-based OAuth), then resolve the result
    // on the next page load via getRedirectResult().
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      console.warn('Google Sign-In popup blocked/closed, falling back to redirect.');
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecting to Google Sign-In…');
    }
    console.error('Google Sign-In Popup failed:', error);
    throw error;
  }
}

// Resolve a pending Google Sign-In redirect (started in signInWithGoogle when the
// popup was blocked). Call this on app startup; returns null if no redirect is pending.
export async function resolveGoogleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) return result.user;
  } catch (error: any) {
    // auth/no-current-auth-in-progress is expected when there is no pending redirect
    if (error?.code !== 'auth/no-current-auth-in-progress') {
      console.warn('Google redirect result resolution failed:', error);
    }
  }
  return null;
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
      console.log('[Firestore] Tasks subscription fired:', tasks.length, 'tasks for user:', userId);
      onUpdate(tasks);
    }, (err) => {
      console.warn('[Firestore] Tasks subscription ERROR:', err?.message || err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('Firestore subscription catch:', err);
    if (onError) onError(err);
    return () => {};
  }
}

// One-shot fetch of user tasks (used as polling fallback when onSnapshot fails)
export async function fetchUserTasks(userId: string): Promise<Task[]> {
  try {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
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
    tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    console.log('[Firestore] Fetched', tasks.length, 'tasks for user:', userId);
    return tasks;
  } catch (err) {
    console.warn('[Firestore] fetchUserTasks failed:', err);
    return [];
  }
}

// Task CRUD in Firestore
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = stripUndefined(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function saveUserTaskToFirestore(userId: string, task: Task): Promise<void> {
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    console.log('[Firestore] Saving task:', task.id, task.title);
    await setDoc(taskRef, stripUndefined({
      ...task,
      userId,
      updatedAt: new Date().toISOString()
    } as Record<string, unknown>), { merge: true });
    console.log('[Firestore] Task saved OK:', task.id);
  } catch (err) {
    console.warn('[Firestore] FAILED to save task:', task.id, err);
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

// ==================== FITNESS SYNC ====================

export function subscribeToUserFitness(userId: string, onUpdate: (entries: FitnessEntry[]) => void) {
  try {
    const fitnessRef = collection(db, 'users', userId, 'fitness');
    const q = query(fitnessRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const entries: FitnessEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push({ id: docSnap.id, ...docSnap.data() } as FitnessEntry);
      });
      onUpdate(entries);
    }, (err) => {
      console.warn('Firestore fitness subscription note:', err?.message || err);
    });
  } catch (err) {
    return () => {};
  }
}

export async function saveFitnessEntryToFirestore(userId: string, entry: FitnessEntry): Promise<void> {
  try {
    const entryRef = doc(db, 'users', userId, 'fitness', entry.id);
    await setDoc(entryRef, stripUndefined({
      ...entry,
      userId,
      updatedAt: new Date().toISOString()
    } as Record<string, unknown>), { merge: true });
  } catch (err) {
    console.warn('Firestore save fitness entry note:', err);
    throw err;
  }
}

export async function deleteUserFitnessEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  try {
    const entryRef = doc(db, 'users', userId, 'fitness', entryId);
    await deleteDoc(entryRef);
  } catch (err) {
    console.warn('Firestore delete fitness entry note:', err);
  }
}

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  xp: number;
  rank: string;
  totalWorkouts: number;
  currentStreak: number;
  isCurrentUser?: boolean;
}

export async function fetchPublicLeaderboard(): Promise<LeaderboardUser[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('fitnessProfile.leaderboardPublic', '==', true), firestoreLimit(50));
    const snapshot = await getDocs(q);
    const users: LeaderboardUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const profile = data.fitnessProfile as UserProfile | undefined;
      if (profile) {
        users.push({
          uid: docSnap.id,
          displayName: profile.displayName || data.displayName || 'Anonymous',
          photoURL: data.photoURL || '',
          xp: profile.fitnessStats?.xp || 0,
          rank: profile.fitnessStats?.rank || 'Weak Rookie',
          totalWorkouts: profile.fitnessStats?.totalWorkouts || 0,
          currentStreak: profile.fitnessStats?.currentStreak || 0,
        });
      }
    });
    return users.sort((a, b) => b.xp - a.xp);
  } catch (err) {
    console.warn('Firestore fetch leaderboard note:', err);
    return [];
  }
}

export function subscribeToPublicLeaderboard(onUpdate: (users: LeaderboardUser[]) => void, onError?: (err: any) => void) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, firestoreLimit(100));
    return onSnapshot(q, (snapshot) => {
      console.log('[Leaderboard] Snapshot! Total docs:', snapshot.size);
      const users: LeaderboardUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const profile = data.fitnessProfile;
        const isPublic = profile?.leaderboardPublic;
        console.log('[Leaderboard] doc:', docSnap.id, 'hasProfile:', !!profile, 'leaderboardPublic:', isPublic, 'xp:', profile?.fitnessStats?.xp);
        if (profile && isPublic === true) {
          users.push({
            uid: docSnap.id,
            displayName: profile.displayName || data.displayName || 'Anonymous',
            photoURL: data.photoURL || '',
            xp: profile.fitnessStats?.xp || 0,
            rank: profile.fitnessStats?.rank || 'Weak Rookie',
            totalWorkouts: profile.fitnessStats?.totalWorkouts || 0,
            currentStreak: profile.fitnessStats?.currentStreak || 0,
          });
        }
      });
      console.log('[Leaderboard] Public users found:', users.length);
      onUpdate(users.sort((a, b) => b.xp - a.xp));
    }, (err) => {
      console.warn('[Leaderboard] Subscription error:', err);
      onError?.(err);
    });
  } catch (err) {
    console.warn('[Leaderboard] Subscribe error:', err);
    onUpdate([]);
    return () => {};
  }
}

export async function saveUserProfileToFirestore(userId: string, profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const clean = stripUndefined(profile as unknown as Record<string, unknown>);
    console.log('[Firestore] Saving profile, leaderboardPublic:', clean.leaderboardPublic, 'bodyWeight:', clean.bodyWeight);
    await setDoc(userRef, { fitnessProfile: clean }, { merge: true });
    console.log('[Firestore] Profile saved OK');
  } catch (err) {
    console.warn('[Firestore] Save profile error:', err);
  }
}

export function subscribeToUserProfile(userId: string, onUpdate: (profile: UserProfile | null) => void) {
  try {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.fitnessProfile) {
          onUpdate(data.fitnessProfile as UserProfile);
        }
      }
    }, (err) => {
      console.warn('Firestore user profile subscription note:', err?.message || err);
    });
  } catch (err) {
    return () => {};
  }
}

// ===== GROUP FUNCTIONS =====

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createGroup(name: string, description: string, user: AuthUser): Promise<Group> {
  const groupRef = doc(collection(db, 'groups'));
  const group: Group = {
    id: groupRef.id,
    name,
    description,
    joinCode: generateJoinCode(),
    createdBy: user.uid,
    members: [{
      uid: user.uid,
      displayName: user.displayName || 'User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: 'admin',
      joinedAt: new Date().toISOString(),
    }],
    createdAt: new Date().toISOString(),
    color: '#f97316',
  };
  await setDoc(groupRef, group);
  return group;
}

export async function joinGroup(joinCode: string, user: AuthUser): Promise<Group | null> {
  const q = query(collection(db, 'groups'), where('joinCode', '==', joinCode.toUpperCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const groupDoc = snapshot.docs[0];
  const groupData = groupDoc.data() as Group;
  if (groupData.members.some((m) => m.uid === user.uid)) return groupData;
  const newMember: GroupMember = {
    uid: user.uid,
    displayName: user.displayName || 'User',
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: 'member',
    joinedAt: new Date().toISOString(),
  };
  await updateDoc(doc(db, 'groups', groupDoc.id), {
    members: [...groupData.members, newMember],
  });
  return { ...groupData, members: [...groupData.members, newMember] };
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;
  const group = snap.data() as Group;
  await updateDoc(groupRef, {
    members: group.members.filter((m) => m.uid !== userId),
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  const tasksSnap = await getDocs(collection(db, 'groups', groupId, 'tasks'));
  const batch = writeBatch(db);
  tasksSnap.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'groups', groupId));
  await batch.commit();
}

export function subscribeToUserGroups(userId: string, onUpdate: (groups: Group[]) => void) {
  try {
    const q = query(collection(db, 'groups'));
    return onSnapshot(q, (snapshot) => {
      const groups: Group[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Group;
        if (data.members?.some((m) => m.uid === userId)) {
          groups.push({ ...data, id: d.id });
        }
      });
      onUpdate(groups);
    }, (err) => {
      console.warn('[Groups] Subscription error:', err);
    });
  } catch (err) {
    console.warn('[Groups] Subscribe error:', err);
    onUpdate([]);
    return () => {};
  }
}

export async function addGroupTask(groupId: string, task: Omit<GroupTask, 'id' | 'comments'>, user: AuthUser): Promise<string> {
  const taskRef = doc(collection(db, 'groups', groupId, 'tasks'));
  const fullTask: GroupTask = {
    ...task,
    id: taskRef.id,
    groupId,
    createdBy: user.uid,
    createdByName: user.displayName || 'User',
    comments: [],
  } as GroupTask;
  await setDoc(taskRef, stripUndefined(fullTask as unknown as Record<string, unknown>));
  return taskRef.id;
}

export async function updateGroupTask(groupId: string, taskId: string, updates: Partial<GroupTask>): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId, 'tasks', taskId), updates as any);
}

export async function deleteGroupTask(groupId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'tasks', taskId));
}

export async function addGroupTaskComment(groupId: string, taskId: string, comment: Omit<GroupTaskComment, 'id' | 'createdAt'>): Promise<void> {
  const taskRef = doc(db, 'groups', groupId, 'tasks', taskId);
  const snap = await getDoc(taskRef);
  if (!snap.exists()) return;
  const task = snap.data() as GroupTask;
  const newComment: GroupTaskComment = {
    ...comment,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await updateDoc(taskRef, { comments: [...(task.comments || []), newComment] });
}

export function subscribeToGroupTasks(groupId: string, onUpdate: (tasks: GroupTask[]) => void) {
  try {
    const q = query(collection(db, 'groups', groupId, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const tasks: GroupTask[] = [];
      snapshot.forEach((d) => {
        tasks.push(d.data() as GroupTask);
      });
      onUpdate(tasks);
    }, (err) => {
      console.warn('[GroupTasks] Subscription error:', err);
    });
  } catch (err) {
    console.warn('[GroupTasks] Subscribe error:', err);
    onUpdate([]);
    return () => {};
  }
}

export async function refreshGroupJoinCode(groupId: string): Promise<string> {
  const newCode = generateJoinCode();
  await updateDoc(doc(db, 'groups', groupId), { joinCode: newCode });
  return newCode;
}

// Account & Data Deletion
export async function deleteUserAccount(userId: string): Promise<void> {
  // Delete all subcollections under users/{userId}
  const subcollections = ['tasks', 'categories', 'notifications', 'fitness'];
  for (const subcol of subcollections) {
    const snap = await getDocs(collection(db, 'users', userId, subcol));
    const batch = writeBatch(db);
    snap.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit().catch(() => {});
  }
  // Delete the user document itself
  await deleteDoc(doc(db, 'users', userId)).catch(() => {});
}
