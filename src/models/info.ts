import { ModelInfo } from './types';

export class ModelInfoImpl implements ModelInfo {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;

  constructor(data: ModelInfo) {
    const result = require('./types').ModelInfoSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid model data: ${result.error.message}`);
    }

    const modelData = result.data;
    this.id = modelData.id;
    this.object = modelData.object;
    this.created = modelData.created;
    this.owned_by = modelData.owned_by;
  }

  getDisplayName(): string {
    return this.id;
  }

  getProvider(): string {
    if (this.id.includes(':')) {
      return this.id.split(':', 1)[0] || 'unknown';
    }
    return 'unknown';
  }

  getModelName(): string {
    if (this.id.includes(':')) {
      return this.id.split(':', 2)[1] || this.id;
    }
    return this.id;
  }

  toJSON(): ModelInfo {
    return {
      id: this.id,
      object: this.object,
      created: this.created,
      owned_by: this.owned_by,
    };
  }
}

export function createModelInfo(data: ModelInfo): ModelInfoImpl {
  return new ModelInfoImpl(data);
}