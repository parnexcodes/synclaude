import { ConfigManager, AppConfigSchema } from '../src/config';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test configuration
    tempDir = await mkdtemp(join(tmpdir(), 'synclaude-test-'));
    configManager = new ConfigManager(join(tempDir, '.config', 'synclaude'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Configuration loading', () => {
    it('should load default configuration when no config file exists', () => {
      const config = configManager.config;

      expect(config.apiKey).toBe('');
      expect(config.baseUrl).toBe('https://api.synthetic.new');
      expect(config.modelsApiUrl).toBe('https://api.synthetic.new/openai/v1/models');
      expect(config.cacheDurationHours).toBe(24);
      expect(config.selectedModel).toBe('');
      expect(config.firstRunCompleted).toBe(false);
    });

    it('should save and load configuration', async () => {
      const testConfig = {
        apiKey: 'test-key-123',
        baseUrl: 'https://test.api.com',
        selectedModel: 'test:model',
        cacheDurationHours: 12,
      };

      const success = await configManager.updateConfig(testConfig);
      expect(success).toBe(true);

      // Create new instance to test loading
      const newConfigManager = new ConfigManager(join(tempDir, '.config', 'synclaude'));
      const config = newConfigManager.config;

      expect(config.apiKey).toBe('test-key-123');
      expect(config.baseUrl).toBe('https://test.api.com');
      expect(config.selectedModel).toBe('test:model');
      expect(config.cacheDurationHours).toBe(12);
    });
  });

  describe('API key management', () => {
    it('should check if API key is configured', () => {
      expect(configManager.hasApiKey()).toBe(false);

      configManager.config.apiKey = 'test-key';
      expect(configManager.hasApiKey()).toBe(true);
    });

    it('should set and get API key', async () => {
      await configManager.setApiKey('new-api-key');
      expect(configManager.getApiKey()).toBe('new-api-key');
    });
  });

  describe('Model management', () => {
    it('should manage selected model', async () => {
      await configManager.setSelectedModel('openai:gpt-4');
      expect(configManager.getSelectedModel()).toBe('openai:gpt-4');
    });

    it('should handle saved model state', async () => {
      expect(configManager.hasSavedModel()).toBe(false);
      expect(configManager.getSavedModel()).toBe('');

      await configManager.setSavedModel('anthropic:claude-3');
      await configManager.markFirstRunCompleted();

      expect(configManager.hasSavedModel()).toBe(true);
      expect(configManager.getSavedModel()).toBe('anthropic:claude-3');
    });
  });

  describe('First run management', () => {
    it('should detect first run', () => {
      expect(configManager.isFirstRun()).toBe(true);
    });

    it('should mark first run as completed', async () => {
      await configManager.markFirstRunCompleted();
      expect(configManager.isFirstRun()).toBe(false);
    });
  });

  describe('Cache duration management', () => {
    it('should set and get cache duration', async () => {
      await configManager.setCacheDuration(48);
      expect(configManager.getCacheDuration()).toBe(48);
    });

    it('should validate cache duration range', async () => {
      const success1 = await configManager.setCacheDuration(0); // Too low
      expect(success1).toBe(false);

      const success2 = await configManager.setCacheDuration(200); // Too high
      expect(success2).toBe(false);

      const success3 = await configManager.setCacheDuration(72); // Valid
      expect(success3).toBe(true);
    });
  });
});

describe('AppConfigSchema validation', () => {
  it('should validate valid configuration', () => {
    const validConfig = {
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com',
      modelsApiUrl: 'https://api.test.com/models',
      cacheDurationHours: 24,
      selectedModel: 'test:model',
      firstRunCompleted: true,
    };

    const result = AppConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject invalid configuration', () => {
    const invalidConfig = {
      cacheDurationHours: -1, // Invalid: must be >= 1
    };

    const result = AppConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should use default values for missing fields', () => {
    const partialConfig = {
      apiKey: 'test-key',
    };

    const result = AppConfigSchema.safeParse(partialConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.baseUrl).toBe('https://api.synthetic.new');
      expect(result.data.modelsApiUrl).toBe('https://api.synthetic.new/openai/v1/models');
      expect(result.data.cacheDurationHours).toBe(24);
    }
  });
});