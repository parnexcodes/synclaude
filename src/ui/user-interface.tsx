import { render } from 'ink';
import React from 'react';
import chalk from 'chalk';
import { ModelInfoImpl } from '../models';
import { ModelSelector } from './components/ModelSelector';
import { StatusMessage } from './components/StatusMessage';
import { ProgressBar } from './components/ProgressBar';

export interface UIOptions {
  verbose?: boolean;
  quiet?: boolean;
}

export class UserInterface {
  private verbose: boolean;
  private quiet: boolean;

  constructor(options: UIOptions = {}) {
    this.verbose = options.verbose || false;
    this.quiet = options.quiet || false;
  }

  // Simple console output methods
  info(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log(`ℹ ${message}`, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log(`✓ ${message}`, ...args);
    }
  }

  // Colored success message for important notifications
  coloredSuccess(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log(chalk.green(`✓ ${message}`), ...args);
    }
  }

  // Colored info message for important notifications
  coloredInfo(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log(chalk.blue(`ℹ ${message}`), ...args);
    }
  }

  // Highlighted message with colored elements within
  highlightInfo(message: string, highlights: string[] = []): void {
    if (!this.quiet) {
      let output = chalk.blue('ℹ ');
      let processedMessage = message;

      // Color each highlighted occurrence
      highlights.forEach(highlight => {
        const regex = new RegExp(`(${highlight})`, 'g');
        processedMessage = processedMessage.replace(regex, chalk.cyan('$1'));
      });

      output += processedMessage;
      console.log(output);
    }
  }

  warning(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.warn(`⚠ ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    console.error(`✗ ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.debug(`🐛 ${message}`, ...args);
    }
  }

  // Show a simple list of models
  showModelList(models: ModelInfoImpl[], selectedIndex?: number): void {
    if (models.length === 0) {
      this.info('No models available');
      return;
    }

    console.log('\nAvailable Models:');
    console.log('================');

    models.forEach((model, index) => {
      const marker = selectedIndex === index ? '➤' : ' ';
      console.log(`${marker} ${index + 1}. ${model.getDisplayName()}`);
      console.log(`    Provider: ${model.getProvider()}`);
      if (model.owned_by) {
        console.log(`    Owner: ${model.owned_by}`);
      }
      console.log('');
    });
  }

  // Interactive model selection using Ink
  async selectModel(models: ModelInfoImpl[]): Promise<ModelInfoImpl | null> {
    if (models.length === 0) {
      this.error('No models available for selection');
      return null;
    }

    return new Promise((resolve) => {
      const { waitUntilExit } = render(
        <ModelSelector
          models={models}
          onSelect={(model) => {
            this.success(`Selected model: ${model.getDisplayName()}`);
            resolve(model);
          }}
          onCancel={() => {
            this.info('Model selection cancelled');
            resolve(null);
          }}
        />
      );

      waitUntilExit().catch(() => {
        resolve(null);
      });
    });
  }

  // Show progress (simple console version)
  showProgress(current: number, total: number, label?: string): void {
    if (this.quiet) return;

    const percentage = Math.round((current / total) * 100);
    const barLength = 20;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    const labelStr = label ? `${label} ` : '';
    process.stdout.write(`\r${labelStr}[${bar}] ${percentage}% (${current}/${total})`);

    if (current >= total) {
      console.log(''); // New line when complete
    }
  }

  // Ask for user input (simple)
  async askQuestion(question: string, defaultValue?: string): Promise<string> {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
      rl.question(prompt, (answer: string) => {
        rl.close();
        resolve(answer || defaultValue || '');
      });
    });
  }

  // Confirm action
  async confirm(message: string, defaultValue = false): Promise<boolean> {
    const defaultStr = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.askQuestion(`${message} (${defaultStr})`, defaultValue ? 'y' : 'n');
    return answer.toLowerCase().startsWith('y');
  }

  // Show status message using Ink component
  showStatus(type: 'info' | 'success' | 'warning' | 'error', message: string): void {
    const { waitUntilExit } = render(
      <StatusMessage type={type} message={message} />
    );
    waitUntilExit();
  }

  // Clear terminal
  clear(): void {
    console.clear();
  }
}