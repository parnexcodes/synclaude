import { Command } from 'commander';
import { SyntheticClaudeApp } from '../core/app';
import { ConfigManager } from '../config';
import { readFileSync } from 'fs';
import { join } from 'path';

export function createProgram(): Command {
  const program = new Command();

  // Read version from package.json
  const packageJsonPath = join(__dirname, '../../package.json');
  const packageVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;

  program
    .name('synclaude')
    .description('Interactive model selection tool for Claude Code with Synthetic AI models')
    .version(packageVersion);

  program
    .option('-m, --model <model>', 'Use specific model (skip selection)')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-error output');

  // Main command (launch Claude Code)
  program
    .action(async (options) => {
      const app = new SyntheticClaudeApp();
      await app.run(options);
    });

  // Model selection command
  program
    .command('model')
    .description('Interactive model selection and save to config')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (options) => {
      const app = new SyntheticClaudeApp();
      await app.interactiveModelSelection();
    });

  // List models command
  program
    .command('models')
    .description('List available models')
    .option('--refresh', 'Force refresh model cache')
    .action(async (options) => {
      const app = new SyntheticClaudeApp();
      await app.listModels(options);
    });

  // Search models command
  program
    .command('search <query>')
    .description('Search models by name or provider')
    .option('--refresh', 'Force refresh model cache')
    .action(async (query, options) => {
      const app = new SyntheticClaudeApp();
      await app.searchModels(query, options);
    });

  // Configuration commands
  const configCmd = program
    .command('config')
    .description('Manage configuration');

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(async () => {
      const app = new SyntheticClaudeApp();
      await app.showConfig();
    });

  configCmd
    .command('set <key> <value>')
    .description('Set configuration value')
    .action(async (key, value) => {
      const app = new SyntheticClaudeApp();
      await app.setConfig(key, value);
    });

  configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .action(async () => {
      const app = new SyntheticClaudeApp();
      await app.resetConfig();
    });

  // Setup command
  program
    .command('setup')
    .description('Run initial setup')
    .action(async () => {
      const app = new SyntheticClaudeApp();
      await app.setup();
    });

  // Doctor command - check system health
  program
    .command('doctor')
    .description('Check system health and configuration')
    .action(async () => {
      const app = new SyntheticClaudeApp();
      await app.doctor();
    });

  // Cache management
  const cacheCmd = program
    .command('cache')
    .description('Manage model cache');

  cacheCmd
    .command('clear')
    .description('Clear model cache')
    .action(async () => {
      const app = new SyntheticClaudeApp();
      await app.clearCache();
    });

  cacheCmd
    .command('info')
    .description('Show cache information')
    .action(async () => {
      const app = new SyntheticClaudeApp();
      await app.cacheInfo();
    });

  return program;
}