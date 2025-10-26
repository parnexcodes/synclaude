import { z } from 'zod';

export const ModelInfoSchema = z.object({
  id: z.string().describe('Model identifier'),
  object: z.string().default('model').describe('Object type'),
  created: z.number().optional().describe('Creation timestamp'),
  owned_by: z.string().optional().describe('Model owner'),
});

export type ModelInfo = z.infer<typeof ModelInfoSchema>;


export interface CacheInfo {
  exists: boolean;
  filePath?: string;
  modifiedTime?: string;
  sizeBytes?: number;
  modelCount?: number;
  isValid?: boolean;
  error?: string;
}

export interface ApiModelsResponse {
  data: ModelInfo[];
  object?: string;
}

export class ModelValidationError extends Error {
  constructor(message: string, public override cause?: unknown) {
    super(message);
    this.name = 'ModelValidationError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}