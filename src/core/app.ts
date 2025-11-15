import { join } from 'path';
import { homedir } from 'os';
import { ConfigManager } from '../config';
import { ModelManager } from '../models';
import { UserInterface } from '../ui';
import { ClaudeLauncher, LaunchOptions } from '../launcher';
import { ModelInfoImpl } from '../models';
import { setupLogging, log } from '../utils/logger';

export interface AppOptions {
  verbose?: boolean;
  quiet?: boolean;
  continue?: boolean;
}


export class SyntheticClaudeApp {
  private configManager: ConfigManager;
  private ui: UserInterface;
  private launcher: ClaudeLauncher;
  private modelManager: ModelManager | null = null;

  constructor() {
    this.configManager = new ConfigManager();
    this.ui = new UserInterface({
      verbose: this.configManager.config.apiKey ? this.configManager.config.cacheDurationHours > 0 : false,
    });
    this.launcher = new ClaudeLauncher();
  }

  async setupLogging(options: AppOptions): Promise<void> {
    setupLogging(options.verbose, options.quiet);
    // Removed verbose startup log
  }

  private getModelManager(): ModelManager {
    if (!this.modelManager) {
      const config = this.configManager.config;
      const cacheFile = join(homedir(), '.config', 'synclaude', 'models_cache.json');

      this.modelManager = new ModelManager({
        apiKey: config.apiKey,
        modelsApiUrl: config.modelsApiUrl,
        cacheFile,
        cacheDurationHours: config.cacheDurationHours,
      });
    }

    return this.modelManager;
  }

  async run(options: AppOptions & LaunchOptions): Promise<void> {
    await this.setupLogging(options);

    // Note: Updates are now handled manually by users via `npm update -g synclaude`
    // This eliminates complex update checking and related bugs

    // Handle first-time setup
    if (this.configManager.isFirstRun()) {
      await this.setup();
      return;
    }

    // Check Claude Code installation early
    const claudeInstalled = await this.launcher.checkClaudeInstallation();
    if (!claudeInstalled) {
      this.showClaudeInstallationInstructions();
      return;
    }

    // Handle continue flag
    if (options.continue) {
      await this.continueSession(options);
      return;
    }

    // Get model to use
    const model = await this.selectModel(options.model);
    if (!model) {
      this.ui.error('No model selected');
      return;
    }

    // Launch Claude Code
    await this.launchClaudeCode(model, options);
  }

  async interactiveModelSelection(): Promise<boolean> {
    if (!this.configManager.hasApiKey()) {
      this.ui.error('No API key configured. Please run "synclaude setup" first.');
      return false;
    }

    try {
      const modelManager = this.getModelManager();
      this.ui.coloredInfo('Fetching available models...');
      const models = await modelManager.fetchModels();

      if (models.length === 0) {
        this.ui.error('No models available. Please check your API key and connection.');
        return false;
      }

      // Sort models for consistent display
      const sortedModels = modelManager.getModels(models);
      const selectedModel = await this.ui.selectModel(sortedModels);
      if (!selectedModel) {
        this.ui.info('Model selection cancelled');
        return false;
      }

      await this.configManager.setSavedModel(selectedModel.id);
      this.ui.coloredSuccess(`Model saved: ${selectedModel.getDisplayName()}`);
      this.ui.highlightInfo('Now run "synclaude" to start Claude Code with this model.', ['synclaude']);
      return true;
    } catch (error) {
      this.ui.error(`Error during model selection: ${error}`);
      return false;
    }
  }

  async listModels(options: { refresh?: boolean }): Promise<void> {
    log.info('Listing models', { options });

    if (!this.configManager.hasApiKey()) {
      this.ui.error('No API key configured. Please run "synclaude setup" first.');
      return;
    }

    try {
      const modelManager = this.getModelManager();
      this.ui.coloredInfo('Fetching available models...');
      const models = await modelManager.fetchModels(options.refresh);

      // Sort and display all models
      const sortedModels = modelManager.getModels(models);
      this.ui.showModelList(sortedModels);
    } catch (error) {
      this.ui.error(`Error fetching models: ${error}`);
    }
  }

  async searchModels(query: string, options: { refresh?: boolean }): Promise<void> {
    log.info('Searching models', { query, options });

    if (!this.configManager.hasApiKey()) {
      this.ui.error('No API key configured. Please run "synclaude setup" first.');
      return;
    }

    try {
      const modelManager = this.getModelManager();
      this.ui.coloredInfo(`Searching for models matching "${query}"...`);
      const models = await modelManager.searchModels(query, undefined);

      if (models.length === 0) {
        this.ui.info(`No models found matching "${query}"`);
        return;
      }

      this.ui.coloredInfo(`Found ${models.length} model${models.length === 1 ? '' : 's'} matching "${query}":`);
      this.ui.showModelList(models);
    } catch (error) {
      this.ui.error(`Error searching models: ${error}`);
    }
  }

  async showConfig(): Promise<void> {
    const config = this.configManager.config;

    this.ui.info('Current Configuration:');
    this.ui.info('=====================');
    this.ui.info(`API Key: ${config.apiKey ? '••••••••' + config.apiKey.slice(-4) : 'Not set'}`);
    this.ui.info(`Base URL: ${config.baseUrl}`);
    this.ui.info(`Models API: ${config.modelsApiUrl}`);
    this.ui.info(`Cache Duration: ${config.cacheDurationHours} hours`);
    this.ui.info(`Selected Model: ${config.selectedModel || 'None'}`);
    this.ui.info(`First Run Completed: ${config.firstRunCompleted}`);
  }

  async setConfig(key: string, value: string): Promise<void> {
    // Simple key-value config setting
    const updates: Record<string, any> = {};

    switch (key) {
      case 'apiKey':
        updates.apiKey = value;
        break;
      case 'baseUrl':
        updates.baseUrl = value;
        break;
      case 'modelsApiUrl':
        updates.modelsApiUrl = value;
        break;
      case 'cacheDurationHours':
        updates.cacheDurationHours = parseInt(value, 10);
        break;
      case 'selectedModel':
        updates.selectedModel = value;
        break;
      default:
        this.ui.error(`Unknown configuration key: ${key}`);
        return;
    }

    const success = await this.configManager.updateConfig(updates);
    if (success) {
      this.ui.success(`Configuration updated: ${key} = ${value}`);
    } else {
      this.ui.error(`Failed to update configuration: ${key}`);
    }
  }

  async resetConfig(): Promise<void> {
    const confirmed = await this.ui.confirm('Are you sure you want to reset all configuration to defaults?');
    if (!confirmed) {
      this.ui.info('Configuration reset cancelled');
      return;
    }

    // Clear config
    await this.configManager.saveConfig(require('../config').AppConfigSchema.parse({}));
    this.ui.success('Configuration reset to defaults');
  }

  async setup(): Promise<void> {
    this.ui.coloredInfo('Welcome to Synclaude! Let\'s set up your configuration.');
    this.ui.info('==============================================');

    const config = this.configManager.config;

    // Get API key if not set
    let apiKey = config.apiKey;
    if (!apiKey) {
      apiKey = await this.ui.askPassword('Enter your Synthetic API key');
      if (!apiKey) {
        this.ui.error('API key is required');
        return;
      }
    }

    // Update config with API key
    const success = await this.configManager.setApiKey(apiKey);
    if (!success) {
      this.ui.error('Failed to save API key');
      return;
    }

    this.ui.coloredSuccess('API key saved');

    // Optional: Test API connection
    const testConnection = await this.ui.confirm('Test API connection?', true);
    if (testConnection) {
      try {
        const modelManager = this.getModelManager();
        this.ui.coloredInfo('Testing connection...');
        const models = await modelManager.fetchModels(true);
        this.ui.coloredSuccess(`Connection successful! Found ${models.length} models`);
      } catch (error) {
        this.ui.error(`Connection failed: ${error}`);
        return;
      }
    }

    // Interactive model selection
    const selectModel = await this.ui.confirm('Select a model now?', true);
    if (selectModel) {
      await this.interactiveModelSelection();
    }

    // Mark first run as completed
    await this.configManager.markFirstRunCompleted();

    this.ui.coloredSuccess('Setup completed successfully!');
    this.ui.highlightInfo('You can now run "synclaude" to launch Claude Code', ['synclaude']);
  }

  async doctor(): Promise<void> {
    this.ui.info('System Health Check');
    this.ui.info('===================');

    // Check Claude Code installation
    const claudeInstalled = await this.launcher.checkClaudeInstallation();
    this.ui.showStatus(claudeInstalled ? 'success' : 'error',
                      `Claude Code: ${claudeInstalled ? 'Installed' : 'Not found'}`);

    if (claudeInstalled) {
      const version = await this.launcher.getClaudeVersion();
      if (version) {
        this.ui.info(`Claude Code version: ${version}`);
      }
    } else {
      // Show installation instructions if Claude Code is not found
      this.ui.info('');
      this.ui.coloredInfo('To install Claude Code:', ['cyan']);

      const platform = process.platform;
      if (platform === 'darwin' || platform === 'linux') {
        this.ui.info('  curl -fsSL https://claude.ai/install.sh | bash');
        this.ui.info('  # or with Homebrew: brew install --cask claude-code');
      } else if (platform === 'win32') {
        this.ui.info('  irm https://claude.ai/install.ps1 | iex');
      }
      this.ui.info('  # or via npm (not recommended): npm install -g @anthropic-ai/claude-code');
      this.ui.info('');
    }

    // Check configuration
    this.ui.showStatus(this.configManager.hasApiKey() ? 'success' : 'error',
                      'Configuration: API key ' + (this.configManager.hasApiKey() ? 'configured' : 'missing'));

    // Check API connection
    if (this.configManager.hasApiKey()) {
      try {
        const modelManager = this.getModelManager();
        const models = await modelManager.fetchModels(true);
        this.ui.showStatus('success', `API connection: OK (${models.length} models)`);
      } catch (error) {
        this.ui.showStatus('error', `API connection: Failed (${error})`);
      }
    }

    // Note: Manual updates via `npm update -g synclaude`
    this.ui.info('To check for updates, run: npm update -g synclaude');
  }

  async clearCache(): Promise<void> {
    const modelManager = this.getModelManager();
    const success = await modelManager.clearCache();

    if (success) {
      this.ui.success('Model cache cleared');
    } else {
      this.ui.error('Failed to clear cache');
    }
  }

  async cacheInfo(): Promise<void> {
    const modelManager = this.getModelManager();
    const cacheInfo = await modelManager.getCacheInfo();

    this.ui.info('Cache Information:');
    this.ui.info('==================');

    if (cacheInfo.exists) {
      this.ui.info(`Status: ${cacheInfo.isValid ? 'Valid' : 'Expired'}`);
      this.ui.info(`File: ${cacheInfo.filePath}`);
      this.ui.info(`Size: ${cacheInfo.sizeBytes} bytes`);
      this.ui.info(`Models: ${cacheInfo.modelCount}`);
      this.ui.info(`Modified: ${cacheInfo.modifiedTime}`);
    } else {
      this.ui.info('Status: No cache file');
    }
  }

  private async selectModel(preselectedModel?: string): Promise<string | null> {
    if (preselectedModel) {
      return preselectedModel;
    }

    // Use saved model if available, otherwise show error
    if (this.configManager.hasSavedModel()) {
      return this.configManager.getSavedModel();
    }

    this.ui.error('No model selected. Run "synclaude model" to select a model.');
    return null;
  }

  private showClaudeInstallationInstructions(): void {
    this.ui.error('Claude Code is not installed or not found in PATH');
    this.ui.info('');
    this.ui.info('Please install Claude Code first:');
    this.ui.info('');

    // Detect platform and show appropriate instructions
    const platform = process.platform;
    if (platform === 'darwin' || platform === 'linux') {
      this.ui.coloredInfo('On Linux/Mac:', ['cyan']);
      this.ui.info('  curl -fsSL https://claude.ai/install.sh | bash');
      this.ui.info('');
      this.ui.coloredInfo('Alternative with Homebrew:', ['cyan']);
      this.ui.info('  brew install --cask claude-code');
      this.ui.info('');
    } else if (platform === 'win32') {
      this.ui.coloredInfo('On Windows:', ['cyan']);
      this.ui.info('  irm https://claude.ai/install.ps1 | iex');
      this.ui.info('');
    }

    this.ui.coloredInfo('Via npm (not recommended):', ['cyan']);
    this.ui.info('  npm install -g @anthropic-ai/claude-code');
    this.ui.info('');

    this.ui.highlightInfo('Then try running synclaude again.', ['synclaude']);
  }

  private async launchClaudeCode(model: string, options: LaunchOptions): Promise<void> {
    const action = options.continue ? 'Resuming' : 'Launching with';
    this.ui.highlightInfo(`${action} ${model}...`, [model]);

    const result = await this.launcher.launchClaudeCode({
      model,
      continue: options.continue,
      additionalArgs: options.additionalArgs,
      env: {
        ANTHROPIC_AUTH_TOKEN: this.configManager.getApiKey(),
      },
    });

    if (!result.success) {
      this.ui.error(`Failed to ${options.continue ? 'resume' : 'launch'} Claude Code: ${result.error}`);
    }
  }

  private async continueSession(options: AppOptions & LaunchOptions): Promise<void> {
    // Get model to use
    let targetModel = options.model;

    if (!targetModel) {
      // Ask if user wants to switch models for resume
      const switchModel = await this.ui.confirm('Switch to a different model for resume?', false);
      if (switchModel) {
        const success = await this.interactiveModelSelection();
        if (success) {
          targetModel = this.configManager.getSavedModel();
        } else {
          const savedModel = this.configManager.getSavedModel();
          this.ui.info(`Model selection cancelled. Using saved model: ${savedModel}`);
          targetModel = savedModel;
        }
      }
    } else {
      this.ui.coloredInfo(`Resuming with model: ${targetModel}`);
    }

    // If no specific model selected, use the saved model
    if (!targetModel) {
      const selectedModel = await this.selectModel();
      if (!selectedModel) {
        this.ui.error('No model selected. Use "synclaude model" to select a model first.');
        return;
      }
      targetModel = selectedModel;
    }

    // Launch Claude Code with continue flag and optional model switching
    await this.launchClaudeCode(targetModel!, { ...options, continue: true });
  }

}