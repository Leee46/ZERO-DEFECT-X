export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean += '/api';
    }
    return clean;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('10.') || host.startsWith('192.168.')) {
      return `http://${host}:8000/api`;
    }
  }

  return 'https://zero-defect-x-backend.onrender.com/api';
};

export class ApiClient {
  private baseUrlOverride?: string;

  constructor(baseUrl?: string) {
    this.baseUrlOverride = baseUrl;
  }

  private getEffectiveUrl(endpoint: string): string {
    const base = this.baseUrlOverride || getApiBaseUrl();
    return `${base}${endpoint}`;
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(this.getEffectiveUrl(endpoint));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`API fetch failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(this.getEffectiveUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`API post failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async uploadVisionImage<T>(formData: FormData): Promise<T> {
    try {
      const response = await fetch(this.getEffectiveUrl('/vision/analyze'), {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Upload error HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Vision analyze upload failed:', error);
      throw error;
    }
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(this.getEffectiveUrl(endpoint), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`API patch failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.get<{ status: string }>('/health');
      return res?.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
