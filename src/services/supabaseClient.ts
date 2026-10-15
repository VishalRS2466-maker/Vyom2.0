/**
 * VYOM Supabase Client Service
 * Provides secure client-side integration using Supabase Anon/Public Key.
 * Supports runtime credential configuration via Settings panel or environment variables.
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AssetRecord, UserSession } from '../types/risk';
import { INITIAL_DEMO_ASSETS } from '../data/tamilNaduGeodata';

const LOCAL_STORAGE_KEY_URL = 'vyom_supabase_url';
const LOCAL_STORAGE_KEY_ANON = 'vyom_supabase_anon_key';
const LOCAL_STORAGE_KEY_DEMO_USER = 'vyom_demo_user';
const LOCAL_STORAGE_KEY_ASSETS = 'vyom_local_assets';

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
  source: 'env' | 'user_settings' | 'none';
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private configState: SupabaseConfigState = {
    url: '',
    anonKey: '',
    isConfigured: false,
    isConnected: false,
    connectionStatus: 'disconnected',
    source: 'none',
  };

  constructor() {
    this.initFromStorageOrEnv();
  }

  private initFromStorageOrEnv() {
    // 1. Check runtime localStorage first
    let url = '';
    let anonKey = '';
    let source: 'env' | 'user_settings' | 'none' = 'none';

    try {
      url = localStorage.getItem(LOCAL_STORAGE_KEY_URL) || '';
      anonKey = localStorage.getItem(LOCAL_STORAGE_KEY_ANON) || '';
      if (url && anonKey) {
        source = 'user_settings';
      }
    } catch {
      // ignore SSR or storage exceptions
    }

    // 2. Check import.meta.env fallback
    if (!url || !anonKey) {
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      if (envUrl && envAnon && envUrl !== 'https://your-project.supabase.co') {
        url = envUrl;
        anonKey = envAnon;
        source = 'env';
      }
    }

    if (url && anonKey && url.startsWith('http')) {
      try {
        this.client = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        this.configState = {
          url,
          anonKey: anonKey.substring(0, 10) + '...' + anonKey.substring(anonKey.length - 6),
          isConfigured: true,
          isConnected: true,
          connectionStatus: 'connected',
          source,
        };
      } catch (err: any) {
        this.client = null;
        this.configState = {
          url,
          anonKey: '',
          isConfigured: false,
          isConnected: false,
          connectionStatus: 'error',
          errorMessage: err.message || 'Failed to initialize Supabase client',
          source,
        };
      }
    } else {
      this.client = null;
      this.configState = {
        url: '',
        anonKey: '',
        isConfigured: false,
        isConnected: false,
        connectionStatus: 'disconnected',
        source: 'none',
      };
    }
  }

  public getConfigState(): SupabaseConfigState {
    return { ...this.configState };
  }

  public async setCredentials(url: string, anonKey: string): Promise<{ success: boolean; error?: string }> {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      return { success: false, error: 'Both Supabase URL and Public Anon Key are required.' };
    }

    if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('http://')) {
      return { success: false, error: 'Supabase URL must start with https://' };
    }

    try {
      const testClient = createClient(trimmedUrl, trimmedKey);
      // Test basic ping
      const { error } = await testClient.auth.getSession();
      if (error && error.message.includes('Invalid API key')) {
        return { success: false, error: 'Invalid Supabase API key provided.' };
      }

      // Persist in localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY_URL, trimmedUrl);
      localStorage.setItem(LOCAL_STORAGE_KEY_ANON, trimmedKey);

      this.client = testClient;
      this.configState = {
        url: trimmedUrl,
        anonKey: trimmedKey.substring(0, 8) + '...' + trimmedKey.substring(trimmedKey.length - 4),
        isConfigured: true,
        isConnected: true,
        connectionStatus: 'connected',
        source: 'user_settings',
      };

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to connect to Supabase.' };
    }
  }

  public clearCredentials(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY_URL);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ANON);
    this.client = null;
    this.configState = {
      url: '',
      anonKey: '',
      isConfigured: false,
      isConnected: false,
      connectionStatus: 'disconnected',
      source: 'none',
    };
  }

  // --- Real Supabase Auth Methods ---

  public async signUp(email: string, password: string, fullName: string) {
    if (!this.client) {
      // In Demo mode, store demo session locally
      const demoUser: UserSession = {
        id: 'usr-demo-' + Math.random().toString(36).substring(2, 9),
        email,
        fullName: fullName || email.split('@')[0],
        role: 'Catastrophe Risk Underwriter',
        organization: 'Tamil Nadu Cat Risk Intelligence',
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_DEMO_USER, JSON.stringify(demoUser));
      return { user: demoUser, error: null, isDemo: true };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            organization: 'Catastrophe Intelligence Underwriter',
          },
        },
      });

      if (error) {
        return { user: null, error: error.message, isDemo: false };
      }

      const user = data.user
        ? {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || fullName || 'Underwriter',
            role: 'Catastrophe Risk Underwriter' as const,
            organization: 'VYOM Risk Network',
          }
        : null;

      return { user, error: null, isDemo: false };
    } catch (err: any) {
      return { user: null, error: err.message || 'Signup failed', isDemo: false };
    }
  }

  public async signIn(email: string, password: string) {
    if (!this.client) {
      // Fallback demo authentication
      const demoUser: UserSession = {
        id: 'usr-demo-session',
        email,
        fullName: email.split('@')[0].toUpperCase(),
        role: 'Catastrophe Risk Underwriter',
        organization: 'VYOM Catastrophe Intelligence',
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_DEMO_USER, JSON.stringify(demoUser));
      return { user: demoUser, error: null, isDemo: true };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message, isDemo: false };
      }

      const user: UserSession = {
        id: data.user.id,
        email: data.user.email || email,
        fullName: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'Catastrophe Risk Underwriter',
        organization: data.user.user_metadata?.organization || 'VYOM Risk Network',
        token: data.session?.access_token,
      };

      return { user, error: null, isDemo: false };
    } catch (err: any) {
      return { user: null, error: err.message || 'Sign in error', isDemo: false };
    }
  }

  public async signOut() {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (err) {
        console.error('Supabase sign out error', err);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY_DEMO_USER);
  }

  public async getCurrentSession(): Promise<UserSession | null> {
    if (this.client) {
      try {
        const { data } = await this.client.auth.getSession();
        if (data.session?.user) {
          return {
            id: data.session.user.id,
            email: data.session.user.email || '',
            fullName: data.session.user.user_metadata?.full_name || 'Risk Analyst',
            role: 'Catastrophe Risk Underwriter',
            organization: 'VYOM Network',
            token: data.session.access_token,
          };
        }
      } catch {
        // Fall back to demo session
      }
    }

    const savedDemo = localStorage.getItem(LOCAL_STORAGE_KEY_DEMO_USER);
    if (savedDemo) {
      try {
        return JSON.parse(savedDemo);
      } catch {
        return null;
      }
    }
    return null;
  }

  public async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return {
        success: true,
        message: 'Demo mode: In production with connected Supabase, a recovery reset email would be sent to ' + email,
      };
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: `Password reset instructions dispatched to ${email}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to dispatch password reset' };
    }
  }

  // --- Asset Storage Operations (With Fallback) ---

  public async getAssets(): Promise<{ assets: AssetRecord[]; isFromSupabase: boolean; error?: string }> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('assets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: AssetRecord[] = data.map((item: any) => ({
            id: item.id || `AST-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            type: item.type || 'Commercial',
            zone: item.zone || 'chennai',
            lat: Number(item.lat),
            lng: Number(item.lng),
            insuredValueInr: Number(item.insured_value_inr),
            constructionCategory: item.construction_category || 'TN-RCC-2024',
            yearBuilt: Number(item.year_built) || 2020,
            plinthHeightMeters: Number(item.plinth_height_meters) || 1.0,
            deductibleInr: Number(item.deductible_inr) || 0,
            limitInr: Number(item.limit_inr) || Number(item.insured_value_inr),
            isDemonstrationData: false,
            createdAt: item.created_at || new Date().toISOString(),
          }));
          return { assets: mapped, isFromSupabase: true };
        }
      } catch {
        // Fall back to local storage
      }
    }

    // Local / Demo Assets fallback
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY_ASSETS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { assets: parsed, isFromSupabase: false };
        }
      }
    } catch {
      // ignore
    }

    // Default demonstration fixture
    return { assets: INITIAL_DEMO_ASSETS, isFromSupabase: false };
  }

  public async saveAsset(asset: AssetRecord): Promise<{ success: boolean; error?: string }> {
    if (this.client) {
      try {
        const { error } = await this.client.from('assets').upsert({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          zone: asset.zone,
          lat: asset.lat,
          lng: asset.lng,
          insured_value_inr: asset.insuredValueInr,
          construction_category: asset.constructionCategory,
          year_built: asset.yearBuilt,
          plinth_height_meters: asset.plinthHeightMeters,
          deductible_inr: asset.deductibleInr,
          limit_inr: asset.limitInr,
          created_at: asset.createdAt,
        });

        if (!error) {
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Could not write to Supabase assets table, saving to local store:', err.message);
      }
    }

    // Local save
    try {
      const currentRes = await this.getAssets();
      const updated = [asset, ...currentRes.assets.filter((a) => a.id !== asset.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY_ASSETS, JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async deleteAsset(assetId: string): Promise<boolean> {
    if (this.client) {
      try {
        await this.client.from('assets').delete().eq('id', assetId);
      } catch {
        // continue to local
      }
    }

    try {
      const currentRes = await this.getAssets();
      const updated = currentRes.assets.filter((a) => a.id !== assetId);
      localStorage.setItem(LOCAL_STORAGE_KEY_ASSETS, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();
