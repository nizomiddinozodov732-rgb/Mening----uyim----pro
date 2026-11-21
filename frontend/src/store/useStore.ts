import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Token ni faqat bir marta o'qiymiz — har so'rovda localStorage emas
let _token: string | null = null;

api.interceptors.request.use((config) => {
  if (!_token && typeof window !== 'undefined') {
    _token = localStorage.getItem('access_token');
  }
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

// Eskirgan/nomaqbul token 401 qaytarsa — tokenni tozalab, tokensiz qayta so'raymiz.
// Aks holda AllowAny endpointlar ham 401 bilan yopilib qoladi.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && _token && original && !original._retried) {
      original._retried = true;
      original.headers = original.headers ?? {};
      delete (original.headers as Record<string, unknown>).Authorization;
      useStore.getState().logout();
      return api(original);
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profession: string;
  profession_display: string;
  avatar: string | null;
  bio: string;
  rating: number;
  rating_count: number;
  is_verified: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  is_subscribed: boolean;
  subscription_end: string | null;
}

export interface WishlistItem {
  id: number;
  type: 'property' | 'material' | 'service';
  title: string;
  price: string;
  image: string | null;
  location?: string;
  addedAt: string;
}

interface AppState {
  user: User | null;
  accessToken: string | null;
  wishlist: WishlistItem[];
  isLoggedIn: boolean;
  theme: 'dark' | 'light';

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number, type: WishlistItem['type']) => void;
  isInWishlist: (id: number, type: WishlistItem['type']) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  clearWishlist: () => void;
  logout: () => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      wishlist: [],
      isLoggedIn: false,
      theme: 'light',

      setTheme: (theme) => {
        set({ theme });
      },

      setUser: (user) => set({ user, isLoggedIn: !!user }),

      setToken: (token) => {
        _token = token;
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('access_token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            localStorage.removeItem('access_token');
            delete api.defaults.headers.common['Authorization'];
          }
        }
        set({ accessToken: token });
      },

      addToWishlist: (item) =>
        set((state) => {
          if (state.wishlist.some(w => w.id === item.id && w.type === item.type)) return state;
          return { wishlist: [item, ...state.wishlist] };
        }),

      removeFromWishlist: (id, type) =>
        set((state) => ({
          wishlist: state.wishlist.filter(w => !(w.id === id && w.type === type)),
        })),

      isInWishlist: (id, type) =>
        get().wishlist.some(w => w.id === id && w.type === type),

      toggleWishlist: (item) => {
        const exists = get().isInWishlist(item.id, item.type);
        if (exists) get().removeFromWishlist(item.id, item.type);
        else get().addToWishlist(item);
      },

      clearWishlist: () => set({ wishlist: [] }),

      logout: () => {
        _token = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          delete api.defaults.headers.common['Authorization'];
        }
        set({ user: null, accessToken: null, isLoggedIn: false });
      },

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'houseshop-storage',
      storage: createJSONStorage(() => localStorage),
      // Faqat wishlist va theme ni saqlash — user va token ni yo'q
      partialize: (state) => ({
        wishlist: state.wishlist,
        theme: state.theme,
      }),
      // Rehydration bo'lganda API token ni ham tiklash
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (token) {
            _token = token;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        }
      },
    }
  )
);
