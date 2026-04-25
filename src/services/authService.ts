import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { LocalStorageRepository } from './storageRepository';

const ALLOWLIST_COLLECTION = 'authAllowlist';
const ADMIN_COLLECTION = 'adminUsers';
const AUTH_CACHE_KEY = 'sku.authDecision.cache.v1';

export type AuthStatus = 'checking' | 'signed-out' | 'allowed' | 'denied' | 'unconfigured';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  isAdmin: boolean;
  error: Error | null;
}

interface CachedAuthDecision {
  email: string;
  allowed: boolean;
  checkedAt: string;
}

interface AllowlistDocument {
  active?: boolean;
  type?: 'email';
  value?: string;
}

type AuthListener = (state: AuthState) => void;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toEmailAllowlistId(email: string): string {
  return `email__${email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')}`;
}

export class AuthService {
  private state: AuthState = { user: null, status: 'checking', isAdmin: false, error: null };
  private listeners = new Set<AuthListener>();
  private readonly cache = new LocalStorageRepository<CachedAuthDecision>(AUTH_CACHE_KEY);

  constructor(
    private readonly auth: Auth | null,
    private readonly db: Firestore | null,
    private readonly googleProvider: GoogleAuthProvider | null,
  ) {
    if (!this.auth || !this.db) {
      this.state = {
        user: null,
        status: 'unconfigured',
        isAdmin: false,
        error: new Error('Firebase is not configured'),
      };
      return;
    }

    onAuthStateChanged(this.auth, (user) => {
      void this.resolveUser(user);
    });
  }

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async signIn(): Promise<void> {
    if (!this.auth || !this.googleProvider) {
      this.setState({
        user: null,
        status: 'unconfigured',
        isAdmin: false,
        error: new Error('Firebase is not configured'),
      });
      return;
    }

    this.setState({ ...this.state, status: 'checking', error: null });
    await signInWithPopup(this.auth, this.googleProvider);
  }

  async signOut(): Promise<void> {
    if (!this.auth) return;
    await signOut(this.auth);
    this.cache.remove();
    this.setState({ user: null, status: 'signed-out', isAdmin: false, error: null });
  }

  private async resolveUser(user: User | null): Promise<void> {
    if (!user) {
      this.setState({ user: null, status: 'signed-out', isAdmin: false, error: null });
      return;
    }

    this.setState({ user, status: 'checking', isAdmin: false, error: null });

    try {
      const allowed = await this.isUserAllowed(user.email ?? '');
      const isAdmin = allowed ? await this.isUserAdmin(user.uid) : false;
      this.cache.write({
        email: normalizeEmail(user.email ?? ''),
        allowed,
        checkedAt: new Date().toISOString(),
      });
      this.setState({ user, status: allowed ? 'allowed' : 'denied', isAdmin, error: null });
    } catch (error) {
      const cached = this.cache.read();
      const normalizedEmail = normalizeEmail(user.email ?? '');
      if (cached?.email === normalizedEmail && cached.allowed) {
        this.setState({ user, status: 'allowed', isAdmin: false, error: null });
        return;
      }

      this.setState({
        user,
        status: 'denied',
        isAdmin: false,
        error: error instanceof Error ? error : new Error('Unable to verify access'),
      });
    }
  }

  private async isUserAllowed(email: string): Promise<boolean> {
    if (!this.db || !email) return false;

    const normalizedEmail = normalizeEmail(email);
    const result = await getDoc(
      doc(this.db, ALLOWLIST_COLLECTION, toEmailAllowlistId(normalizedEmail)),
    );
    if (!result.exists()) return false;

    const data = result.data() as AllowlistDocument;
    return data.active !== false;
  }

  private async isUserAdmin(uid: string): Promise<boolean> {
    if (!this.db || !uid) return false;

    const result = await getDoc(doc(this.db, ADMIN_COLLECTION, uid));
    if (!result.exists()) return false;

    const data = result.data() as { active?: boolean };
    return data.active !== false;
  }

  private setState(state: AuthState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  }
}
