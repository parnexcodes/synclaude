import { ModelInfoImpl, ModelCategoryUtils } from '../src/models';

describe('ModelInfo', () => {
  it('should create valid model info', () => {
    const modelData = {
      id: 'openai:gpt-4',
      object: 'model',
      created: 1234567890,
      owned_by: 'OpenAI',
    };

    const model = new ModelInfoImpl(modelData);

    expect(model.id).toBe('openai:gpt-4');
    expect(model.object).toBe('model');
    expect(model.created).toBe(1234567890);
    expect(model.owned_by).toBe('OpenAI');
  });

  it('should handle model without optional fields', () => {
    const modelData = {
      id: 'claude:claude-3-sonnet',
      object: 'model',
    };

    const model = new ModelInfoImpl(modelData);

    expect(model.id).toBe('claude:claude-3-sonnet');
    expect(model.created).toBeUndefined();
    expect(model.owned_by).toBeUndefined();
  });

  it('should extract provider correctly', () => {
    const model1 = new ModelInfoImpl({ id: 'openai:gpt-4', object: 'model' });
    expect(model1.getProvider()).toBe('openai');

    const model2 = new ModelInfoImpl({ id: 'claude-3', object: 'model' });
    expect(model2.getProvider()).toBe('unknown');
  });

  it('should extract model name correctly', () => {
    const model1 = new ModelInfoImpl({ id: 'openai:gpt-4', object: 'model' });
    expect(model1.getModelName()).toBe('gpt-4');

    const model2 = new ModelInfoImpl({ id: 'claude-3', object: 'model' });
    expect(model2.getModelName()).toBe('claude-3');
  });

  it('should return display name', () => {
    const model = new ModelInfoImpl({ id: 'openai:gpt-4', object: 'model' });
    expect(model.getDisplayName()).toBe('openai:gpt-4');
  });

  it('should convert to JSON', () => {
    const modelData = {
      id: 'openai:gpt-4',
      object: 'model',
      created: 1234567890,
      owned_by: 'OpenAI',
    };

    const model = new ModelInfoImpl(modelData);
    const json = model.toJSON();

    expect(json).toEqual(modelData);
  });
});

describe('ModelCategoryUtils', () => {
  it('should categorize embedding models correctly', () => {
    const embeddingModel1 = new ModelInfoImpl({ id: 'openai:text-embedding-ada-002', object: 'model' });
    const embeddingModel2 = new ModelInfoImpl({ id: 'embedding-model', object: 'model' });
    const normalModel = new ModelInfoImpl({ id: 'openai:gpt-4', object: 'model' });

    expect(ModelCategoryUtils.isEmbeddingModel(embeddingModel1)).toBe(true);
    expect(ModelCategoryUtils.isEmbeddingModel(embeddingModel2)).toBe(true);
    expect(ModelCategoryUtils.isEmbeddingModel(normalModel)).toBe(false);
  });

  it('should filter embedding models', () => {
    const models = [
      new ModelInfoImpl({ id: 'openai:text-embedding', object: 'model' }),
      new ModelInfoImpl({ id: 'openai:gpt-4', object: 'model' }),
      new ModelInfoImpl({ id: 'claude:embedding-model', object: 'model' }),
      new ModelInfoImpl({ id: 'anthropic:claude-3', object: 'model' }),
    ];

    const filtered = ModelCategoryUtils.filterEmbeddingModels(models);

    expect(filtered).toHaveLength(2);
    expect(filtered.map(m => m.id)).toEqual(['openai:gpt-4', 'anthropic:claude-3']);
  });

  it('should sort models by name', () => {
    const models = [
      new ModelInfoImpl({ id: 'z-model', object: 'model' }),
      new ModelInfoImpl({ id: 'a-model', object: 'model' }),
      new ModelInfoImpl({ id: 'm-model', object: 'model' }),
    ];

    const sorted = ModelCategoryUtils.sortModelsByName(models);

    expect(sorted.map(m => m.id)).toEqual(['a-model', 'm-model', 'z-model']);
  });

  it('should not modify original array when sorting', () => {
    const models = [
      new ModelInfoImpl({ id: 'z-model', object: 'model' }),
      new ModelInfoImpl({ id: 'a-model', object: 'model' }),
    ];

    const sorted = ModelCategoryUtils.sortModelsByName(models);

    expect(models.map(m => m.id)).toEqual(['z-model', 'a-model']); // Original unchanged
    expect(sorted.map(m => m.id)).toEqual(['a-model', 'z-model']); // Sorted copy
  });
});