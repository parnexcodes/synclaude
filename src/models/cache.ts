import { readFile, writeFile, mkdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { ModelInfo, CacheInfo } from './types';
import { ModelInfoImpl } from './info';

export interface ModelCacheOptions {
  cacheFile: string;
  cacheDurationHours: number;
}

export class ModelCache {
  private cacheFile: string;
  private cacheDurationMs: number;

  constructor(options: ModelCacheOptions) {
    this.cacheFile = options.cacheFile;
    this.cacheDurationMs = options.cacheDurationHours * 60 * 60 * 1000;
  }

  async isValid(): Promise<boolean> {
    try {
      const stats = await stat(this.cacheFile);
      const mtime = stats.mtime;
      const now = new Date();
      const age = now.getTime() - mtime.getTime();

      return age < this.cacheDurationMs;
    } catch (error) {
      // File doesn't exist or can't be accessed
      return false;
    }
  }

  async load(): Promise<ModelInfoImpl[]> {
    if (!(await this.isValid())) {
      return [];
    }

    try {
      const data = await readFile(this.cacheFile, 'utf-8');
      const cacheData = JSON.parse(data);

      const modelsData = cacheData.models || [];
      return modelsData.map((modelData: any) => new ModelInfoImpl(modelData));
    } catch (error) {
      console.error('Error loading cache:', error);
      return [];
    }
  }

  async save(models: ModelInfoImpl[]): Promise<boolean> {
    try {
      // Ensure parent directory exists
      const parentDir = require('path').dirname(this.cacheFile);
      await mkdir(parentDir, { recursive: true });

      const cacheData = {
        models: models.map(model => model.toJSON()),
        timestamp: new Date().toISOString(),
        count: models.length,
      };

      const data = JSON.stringify(cacheData, null, 2);
      await writeFile(this.cacheFile, data, 'utf-8');

      console.debug(`Cached ${models.length} models to ${this.cacheFile}`);
      return true;
    } catch (error) {
      console.error('Error saving cache:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await unlink(this.cacheFile);
      console.debug('Cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  async getInfo(): Promise<CacheInfo> {
    try {
      const stats = await stat(this.cacheFile);
      const models = await this.load();

      return {
        exists: true,
        filePath: this.cacheFile,
        modifiedTime: stats.mtime.toISOString(),
        sizeBytes: stats.size,
        modelCount: models.length,
        isValid: await this.isValid(),
      };
    } catch (error) {
      return {
        exists: false,
        error: (error as Error).message,
      };
    }
  }
}