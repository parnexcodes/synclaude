import axios from 'axios';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync } from 'fs';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  downloadUrl?: string;
  changelog?: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  versionInfo: VersionInfo | null;
}

export interface UpdateOptions {
  checkUrl?: string;
  autoInstall?: boolean;
}

export class UpdateManager {
  private readonly versionFile: string;
  private readonly checkUrl: string;
  private readonly currentVersion: string;

  constructor(options: UpdateOptions = {}) {
    this.versionFile = join(homedir(), '.config', 'synclaude', 'version.json');
    this.checkUrl = options.checkUrl || 'https://api.github.com/repos/parnexcodes/synclaude/releases/latest';

    // Read current version from package.json
    try {
      const packageJsonPath = join(__dirname, '../../package.json');
      this.currentVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
    } catch (error) {
      // Fallback to hardcoded version if we can't read package.json
      this.currentVersion = '1.2.1';
    }
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const latestVersionInfo = await this.fetchLatestVersion();
      const hasUpdate = this.compareVersions(this.currentVersion, latestVersionInfo.version) < 0;

      return {
        hasUpdate,
        currentVersion: this.currentVersion,
        latestVersion: latestVersionInfo.version,
        versionInfo: latestVersionInfo,
      };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion,
        versionInfo: null,
      };
    }
  }

  private async fetchLatestVersion(): Promise<VersionInfo> {
    try {
      const response = await axios.get(this.checkUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'synclaude-update-check',
        },
      });

      const data = response.data;
      return {
        version: data.tag_name?.replace(/^v/, '') || '0.0.0',
        releaseDate: data.published_at || new Date().toISOString(),
        downloadUrl: data.assets?.[0]?.browser_download_url,
        changelog: data.body,
      };
    } catch (error) {
      // Fallback to local version cache if network fails
      const cachedVersion = await this.getCachedVersion();
      return cachedVersion || {
        version: this.currentVersion,
        releaseDate: new Date().toISOString(),
      };
    }
  }

  private async getCachedVersion(): Promise<VersionInfo | null> {
    try {
      const data = await readFile(this.versionFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  async saveUpdateCheck(versionInfo: VersionInfo): Promise<void> {
    try {
      const data = {
        ...versionInfo,
        lastChecked: new Date().toISOString(),
      };

      await writeFile(this.versionFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save version info:', error);
    }
  }

  async shouldCheckForUpdates(lastCheckTime?: string): Promise<boolean> {
    if (!lastCheckTime) {
      return true;
    }

    const lastCheck = new Date(lastCheckTime);
    const now = new Date();
    const hoursSinceCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

    // Check for updates every 24 hours
    return hoursSinceCheck >= 24;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  formatUpdateMessage(result: UpdateCheckResult): string {
    if (!result.hasUpdate) {
      return `You're using the latest version (${result.currentVersion})`;
    }

    return `Update available: ${result.currentVersion} → ${result.latestVersion}`;
  }

  async performUpdate(): Promise<boolean> {
    // For npm packages, we can trigger npm update
    try {
      console.info('Updating synclaude via npm...');
      const { spawn } = require('child_process');

      return new Promise((resolve) => {
        const child = spawn('npm', ['update', '-g', 'synclaude'], {
          stdio: 'inherit',
        });

        child.on('close', (code: number | null) => {
          if (code === 0) {
            console.info('Update completed successfully');
            resolve(true);
          } else {
            console.error('Update failed');
            resolve(false);
          }
        });

        child.on('error', (error: Error) => {
          console.error('Update error:', error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('Failed to perform update:', error);
      return false;
    }
  }
}