import axios, { AxiosResponse } from 'axios';
import { ModelInfo, ApiModelsResponse, ApiError } from './types';
import { ModelInfoImpl } from './info';
import { ModelCache } from './cache';

export interface ModelManagerOptions {
  apiKey: string;
  modelsApiUrl: string;
  cacheFile: string;
  cacheDurationHours?: number;
}

export class ModelManager {
  private apiKey: string;
  private modelsApiUrl: string;
  private cache: ModelCache;

  constructor(options: ModelManagerOptions) {
    this.apiKey = options.apiKey;
    this.modelsApiUrl = options.modelsApiUrl;
    this.cache = new ModelCache({
      cacheFile: options.cacheFile,
      cacheDurationHours: options.cacheDurationHours || 24,
    });
  }

  async fetchModels(forceRefresh = false): Promise<ModelInfoImpl[]> {
    if (!forceRefresh && (await this.cache.isValid())) {
      console.info('Loading models from cache');
      return this.cache.load();
    }

    if (!this.apiKey) {
      console.warn('No API key configured');
      return [];
    }

    console.info('Fetching models from API');
    const models = await this.fetchFromApi();

    if (models.length > 0) {
      await this.cache.save(models);
      console.info(`Fetched ${models.length} models`);
    } else {
      console.warn('No models received from API');
    }

    return models;
  }

  private async fetchFromApi(): Promise<ModelInfoImpl[]> {
    try {
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      const response: AxiosResponse<ApiModelsResponse> = await axios.get(
        this.modelsApiUrl,
        {
          headers,
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        const modelsData = response.data.data || [];

        // Convert to ModelInfoImpl objects
        const models: ModelInfoImpl[] = [];
        for (const modelData of modelsData) {
          try {
            const model = new ModelInfoImpl(modelData);
            models.push(model);
          } catch (error) {
            console.warn(`Invalid model data: ${modelData.id || 'unknown'}:`, error);
          }
        }

        return models;
      } else {
        throw new ApiError(
          `API error: ${response.status} - ${response.statusText}`,
          response.status,
          response.data
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new ApiError(
            `API error: ${error.response.status} - ${error.response.statusText}`,
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          throw new ApiError('Network error: No response received from API');
        } else {
          throw new ApiError(`Network error: ${error.message}`);
        }
      }
      throw new ApiError(`Error fetching models: ${(error as Error).message}`);
    }
  }

  getModels(models?: ModelInfoImpl[]): ModelInfoImpl[] {
    if (!models) {
      throw new Error('Models must be provided or fetched first');
    }

    // Sort models by ID for consistent display
    return [...models].sort((a, b) => a.id.localeCompare(b.id));
  }

  async searchModels(query: string, models?: ModelInfoImpl[]): Promise<ModelInfoImpl[]> {
    if (!models) {
      models = await this.fetchModels();
    }

    if (!query) {
      return this.getModels(models);
    }

    const queryLower = query.toLowerCase();
    const matchingModels: ModelInfoImpl[] = [];

    for (const model of models) {
      // Search in model ID and components
      const searchText = [
        model.id.toLowerCase(),
        model.getProvider().toLowerCase(),
        model.getModelName().toLowerCase(),
      ].join(' ');

      if (searchText.includes(queryLower)) {
        matchingModels.push(model);
      }
    }

    // Sort results by ID
    return matchingModels.sort((a, b) => a.id.localeCompare(b.id));
  }

  async getModelById(modelId: string, models?: ModelInfoImpl[]): Promise<ModelInfoImpl | null> {
    if (!models) {
      models = await this.fetchModels();
    }

    return models.find(model => model.id === modelId) || null;
  }

  async clearCache(): Promise<boolean> {
    return this.cache.clear();
  }

  async getCacheInfo(): Promise<Record<string, any>> {
    return this.cache.getInfo();
  }
}