import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Category, MenuItem, RestaurantInfo, User } from '../types/menu';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const storage = getStorage(app);

// Test connection on boot according to Firebase integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'restaurantInfo', 'current'));
    console.log('Firebase connection test succeeded.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // Authentication System (Strictly signInWithEmailAndPassword only, no fake local authentication fallback)
  async login(email: string, passwordString: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, passwordString);
    const firebaseUser = userCredential.user;
    
    const user: User = {
      uid: firebaseUser.uid,
      name: trimmedEmail.split('@')[0].toUpperCase(),
      email: trimmedEmail,
      role: 'admin'
    };
    localStorage.setItem('auth_session', JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut non-blocking alert:', err);
    }
    localStorage.removeItem('auth_session');
  },

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.email ? firebaseUser.email.split('@')[0].toUpperCase() : 'ADMIN',
            email: firebaseUser.email || '',
            role: 'admin'
          };
          localStorage.setItem('auth_session', JSON.stringify(user));
          resolve(user);
        } else {
          localStorage.removeItem('auth_session');
          resolve(null);
        }
      });
    });
  },

  // Image Upload handler utilizing real Firebase Cloud Storage
  async uploadImage(file: File, folder: string): Promise<string> {
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Firebase Storage upload error:', error);
      throw error;
    }
  },

  // Restaurant Settings CRUD (Purely Firestore, minimal human-readable default if absolutely unconfigured)
  async getRestaurantInfo(): Promise<RestaurantInfo> {
    const path = 'restaurantInfo';
    try {
      const docRef = doc(db, path, 'current');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as RestaurantInfo;
      }
      return {
        name: 'The Saffron Heritage',
        logoURL: '',
        address: 'Heritage Block, Connaught Place, New Delhi',
        contactNumber: '+91 11 4987 5500',
        coverURL: 'https://images.unsplash.com/photo-1585938338392-50a59970d8ee?auto=format&fit=crop&q=80&w=1200'
      };
    } catch (error) {
      console.warn('Error reading restaurant info, returning elegant default:', error);
      return {
        name: 'The Saffron Heritage',
        logoURL: '',
        address: 'Heritage Block, Connaught Place, New Delhi',
        contactNumber: '+91 11 4987 5500',
        coverURL: 'https://images.unsplash.com/photo-1585938338392-50a59970d8ee?auto=format&fit=crop&q=80&w=1200'
      };
    }
  },

  async updateRestaurantInfo(info: RestaurantInfo): Promise<RestaurantInfo> {
    const path = 'restaurantInfo';
    try {
      const docRef = doc(db, path, 'current');
      await setDoc(docRef, info);
      return info;
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Categories CRUD (Strictly sourced from real database Firestore)
  async getCategories(): Promise<Category[]> {
    const path = 'categories';
    try {
      const colRef = collection(db, path);
      const snap = await getDocs(colRef);
      const categories: Category[] = [];
      snap.forEach((docSnap) => {
        categories.push(docSnap.data() as Category);
      });
      // Sort to keep order consistent
      return categories.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error) {
      console.error('Error fetching categories from Firestore:', error);
      return [];
    }
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const path = 'categories';
    try {
      const id = `cat-${Date.now()}`;
      const newCategory: Category = { ...category, id };
      await setDoc(doc(db, path, id), newCategory);
      return newCategory;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateCategory(category: Category): Promise<Category> {
    const path = 'categories';
    try {
      await setDoc(doc(db, path, category.id), category);
      return category;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const path = 'categories';
    try {
      await deleteDoc(doc(db, path, id));
      
      // Secondary relational cleanup of menu items associated with this category
      const items = await this.getMenuItems();
      for (const item of items) {
        if (item.categoryId === id) {
          await this.updateMenuItem({ ...item, categoryId: '' });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Menu Items CRUD (Strictly sourced from real database Firestore)
  async getMenuItems(): Promise<MenuItem[]> {
    const path = 'menuItems';
    try {
      const colRef = collection(db, path);
      const snap = await getDocs(colRef);
      const items: MenuItem[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as MenuItem);
      });
      // Sort by creation date descending
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error('Error fetching menu items from Firestore:', error);
      return [];
    }
  },

  async createMenuItem(item: Omit<MenuItem, 'id' | 'createdAt'>): Promise<MenuItem> {
    const path = 'menuItems';
    try {
      const id = `item-${Date.now()}`;
      const newItem: MenuItem = {
        ...item,
        id,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, path, id), newItem);
      return newItem;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateMenuItem(item: MenuItem): Promise<MenuItem> {
    const path = 'menuItems';
    try {
      await setDoc(doc(db, path, item.id), item);
      return item;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteMenuItem(id: string): Promise<void> {
    const path = 'menuItems';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async toggleAvailability(id: string): Promise<boolean> {
    const path = 'menuItems';
    try {
      const docRef = doc(db, path, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('Menu item not found for availability check.');
      }
      const item = snap.data() as MenuItem;
      const updatedStatus = !item.availability;
      await setDoc(docRef, { ...item, availability: updatedStatus });
      return updatedStatus;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
