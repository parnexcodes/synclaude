import { readFile, writeFile, mkdir, chmod } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { AppConfigSchema, AppConfig, ConfigValidationError, ConfigLoadError, ConfigSaveError } from './types';

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private _config: AppConfig | null = null;

  constructor(configDir?: string) {
    this.configDir = configDir || join(homedir(), '.config', 'synclaude');
    this.configPath = join(this.configDir, 'config.json');
  }

  get config(): AppConfig {
    if (this._config === null) {
      this._config = this.loadConfig();
    }
    return this._config;
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await mkdir(this.configDir, { recursive: true });
    } catch (error) {
      throw new ConfigSaveError(`Failed to create config directory: ${this.configDir}`, error);
    }
  }

  private loadConfig(): AppConfig {
    try {
      // Use fs.readFileSync instead of require to avoid module loading errors
      const fs = require('fs');

      if (!fs.existsSync(this.configPath)) {
        // Config file doesn't exist, return defaults
        return AppConfigSchema.parse({});
      }

      const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      const result = AppConfigSchema.safeParse(configData);

      if (!result.success) {
        // Try to preserve firstRunCompleted flag even if other config is invalid
        const preservedConfig = {
          firstRunCompleted: configData.firstRunCompleted || false,
        };

        const fallbackResult = AppConfigSchema.safeParse(preservedConfig);

        if (fallbackResult.success) {
          return fallbackResult.data;
        }

        return AppConfigSchema.parse({});
      }

      return result.data;
    } catch (error) {
      // Try to recover firstRunCompleted from partial config data
      const fs = require('fs');
      if (fs.existsSync(this.configPath)) {
        try {
          const partialConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
          if (partialConfig.firstRunCompleted === true) {
            return AppConfigSchema.parse({ firstRunCompleted: true });
          }
        } catch {
          // Recovery failed, use defaults
        }
      }

      return AppConfigSchema.parse({});
    }
  }

  async saveConfig(config?: AppConfig): Promise<boolean> {
    const configToSave = config || this._config;
    if (!configToSave) {
      throw new ConfigSaveError('No configuration to save');
    }

    try {
      await this.ensureConfigDir();

      // Create backup of existing config
      try {
        const fs = require('fs/promises');
        const fsSync = require('fs');
        if (fsSync.existsSync(this.configPath)) {
          const backupPath = `${this.configPath}.backup`;
          const existingData = await readFile(this.configPath, 'utf-8');
          await writeFile(backupPath, existingData, 'utf-8');
        }
      } catch (backupError) {
        // Backup failed, but continue with saving
        console.warn('Failed to create config backup:', backupError);
      }

      // Write new configuration
      const configJson = JSON.stringify(configToSave, null, 2);
      await writeFile(this.configPath, configJson, 'utf-8');

      // Set secure permissions
      try {
        await chmod(this.configPath, 0o600);
      } catch (chmodError) {
        console.warn('Failed to set secure permissions on config file:', chmodError);
      }

      this._config = configToSave;
      return true;
    } catch (error) {
      throw new ConfigSaveError(`Failed to save configuration to ${this.configPath}`, error);
    }
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<boolean> {
    try {
      const currentData = this.config;
      const updatedData = { ...currentData, ...updates };

      const result = AppConfigSchema.safeParse(updatedData);
      if (!result.success) {
        throw new ConfigValidationError(`Invalid configuration update: ${result.error.message}`);
      }

      return await this.saveConfig(result.data);
    } catch (error) {
      if (error instanceof ConfigValidationError || error instanceof ConfigSaveError) {
        throw error;
      }
      throw new ConfigSaveError('Failed to update configuration', error);
    }
  }

  hasApiKey(): boolean {
    return Boolean(this.config.apiKey);
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  async setApiKey(apiKey: string): Promise<boolean> {
    return this.updateConfig({ apiKey });
  }

  getSelectedModel(): string {
    return this.config.selectedModel;
  }

  async setSelectedModel(model: string): Promise<boolean> {
    return this.updateConfig({ selectedModel: model });
  }

  getCacheDuration(): number {
    return this.config.cacheDurationHours;
  }

  async setCacheDuration(hours: number): Promise<boolean> {
    try {
      return await this.updateConfig({ cacheDurationHours: hours });
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        return false;
      }
      throw error;
    }
  }

  async isCacheValid(cacheFile: string): Promise<boolean> {
    try {
      const { stat } = require('fs/promises');
      const stats = await stat(cacheFile);
      const cacheAge = Date.now() - stats.mtime.getTime();
      const maxAge = this.config.cacheDurationHours * 60 * 60 * 1000;
      return cacheAge < maxAge;
    } catch (error) {
      return false;
    }
  }

  isFirstRun(): boolean {
    return !this.config.firstRunCompleted;
  }

  async markFirstRunCompleted(): Promise<boolean> {
    return this.updateConfig({ firstRunCompleted: true });
  }

  hasSavedModel(): boolean {
    return Boolean(this.config.selectedModel && this.config.firstRunCompleted);
  }

  getSavedModel(): string {
    if (this.hasSavedModel()) {
      return this.config.selectedModel;
    }
    return '';
  }

  async setSavedModel(model: string): Promise<boolean> {
    return this.updateConfig({ selectedModel: model, firstRunCompleted: true });
  }
}