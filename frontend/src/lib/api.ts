import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

const defaultConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const authApi = axios.create(defaultConfig);
export const api = axios.create(defaultConfig);

const pathAliases: Array<[string, string]> = [
  ['/academic-staff', '/akademik-kadro'],
  ['/certificates', '/sertifikalar'],
  ['/notifications', '/bildirimler'],
  ['/profiles', '/profiller'],
  ['/students', '/ogrenciler'],
  ['/events', '/etkinlikler'],
  ['/clubs', '/kulupler'],
  ['/users', '/kullanicilar'],
];

const normalizeApiPath = (url?: string) => {
  if (!url || /^https?:\/\//i.test(url)) return url;

  const [path, query = ''] = url.split('?');
  const alias = pathAliases.find(([from]) => path === from || path.startsWith(`${from}/`));
  if (!alias) return url;

  const [from, to] = alias;
  const normalized = `${to}${path.slice(from.length)}`;
  return query ? `${normalized}?${query}` : normalized;
};

authApi.interceptors.request.use(
  (config) => {
    config.url = normalizeApiPath(config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.request.use(
  (config) => {
    config.url = normalizeApiPath(config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/giris') {
        window.location.href = '/giris';
      }
    }

    return Promise.reject(error);
  }
);
