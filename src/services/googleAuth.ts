import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  Auth,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Minimum required scopes for Google Account Sign-In (email + basic profile)
export const SCOPES: string[] = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }
  return authInstance;
}

function buildGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  for (const scope of SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return provider;
}

// In-memory OAuth access token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function initGoogleAuth(
  onSignedInUser?: (user: User, accessToken: string | null) => void,
  onSignedOut?: () => void
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      onSignedInUser?.(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (!isSigningIn) {
        onSignedOut?.();
      }
    }
  });
}

export async function signInWithGoogle(): Promise<{
  user: User;
  accessToken: string | null;
}> {
  const auth = getFirebaseAuth();
  const provider = buildGoogleProvider();

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken ?? null;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    const code = error?.code as string | undefined;
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completion.');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by your browser. Allow popups for this site and try again.');
    }
    if (code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in popup request was superseded. Please try again.');
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error('This preview domain is not yet authorized for Google Sign-In.');
    }
    throw new Error(error?.message || 'Unable to sign in with Google right now.');
  } finally {
    isSigningIn = false;
  }
}

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

export async function googleSignOut(): Promise<void> {
  cachedAccessToken = null;
  try {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (err) {
    console.error('Error signing out of Google Auth:', err);
  }
}
