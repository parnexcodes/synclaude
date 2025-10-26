import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiModelsResponse, ApiError } from '../models/types';

export interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private axios: AxiosInstance;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'synclaude/1.0.0',
      ...options.headers,
    };

    this.axios = axios.create({
      baseURL: options.baseURL || 'https://api.synthetic.new',
      timeout: options.timeout || 30000,
      headers: this.defaultHeaders,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        console.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        console.debug(`API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error(`API Error Response: ${error.response.status} ${error.response.statusText}`);
          } else if (error.request) {
            console.error('API Network Error: No response received');
          } else {
            console.error('API Request Setup Error:', error.message);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setApiKey(apiKey: string): void {
    this.axios.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  }

  setBaseURL(baseURL: string): void {
    this.axios.defaults.baseURL = baseURL;
  }

  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await this.axios.get<T>(url, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await this.axios.post<T>(url, data, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await this.axios.put<T>(url, data, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await this.axios.delete<T>(url, config);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async fetchModels(apiKey: string, modelsUrl: string): Promise<ApiModelsResponse> {
    this.setApiKey(apiKey);

    try {
      const response = await this.get<ApiModelsResponse>(modelsUrl);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to fetch models: ${(error as Error).message}`);
    }
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        const message = data?.message || data?.error || error.response.statusText;

        return new ApiError(
          `API error ${status}: ${message}`,
          status,
          data
        );
      } else if (error.request) {
        return new ApiError('Network error: No response received from API');
      } else {
        return new ApiError(`Request error: ${error.message}`);
      }
    }

    return new ApiError(`Unknown error: ${(error as Error).message}`);
  }

  getAxiosInstance(): AxiosInstance {
    return this.axios;
  }
}