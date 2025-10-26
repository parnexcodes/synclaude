import { ModelInfoImpl } from '../src/models';

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