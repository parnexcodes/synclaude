import React from 'react';
import { Box, Text, Newline } from 'ink';
import { ModelInfoImpl } from '../../models';

interface ModelListProps {
  models: ModelInfoImpl[];
  selectedIndex?: number;
  showCategories?: boolean;
}

export const ModelList: React.FC<ModelListProps> = ({
  models,
  selectedIndex,
  showCategories = false
}) => {
  if (models.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="gray">No models available.</Text>
        <Newline />
        <Text color="gray">Try running 'synclaude models --refresh' to update the model list.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {models.map((model, index) => (
        <Box key={model.id} marginBottom={1}>
          <Text color={selectedIndex === index ? 'blue' : 'white'}>
            {selectedIndex === index ? '➤ ' : '  '}
            {index + 1}. {model.getDisplayName()}
          </Text>
          <Newline />
          <Text color="gray" dimColor>
    {'    '}Provider: {model.getProvider()}
          </Text>
          {model.owned_by && (
            <>
              <Newline />
              <Text color="gray" dimColor>
        {'    '}Owner: {model.owned_by}
              </Text>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
};