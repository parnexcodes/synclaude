import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { ModelInfoImpl } from '../../models';

interface ModelSelectorProps {
  models: ModelInfoImpl[];
  onSelect: (model: ModelInfoImpl) => void;
  onCancel: () => void;
  searchPlaceholder?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  onSelect,
  onCancel,
  searchPlaceholder = 'Search models...'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredModels, setFilteredModels] = useState<ModelInfoImpl[]>(models);

  const { exit } = useApp();
  const { write } = useStdout();

  // Filter models based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredModels(models);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = models.filter(model => {
      const searchText = [
        model.id.toLowerCase(),
        model.getProvider().toLowerCase(),
        model.getModelName().toLowerCase()
      ].join(' ');

      return searchText.includes(query);
    });

    setFilteredModels(filtered);
    setSelectedIndex(0); // Reset selection when filter changes
  }, [searchQuery, models]);

  // Calculate visible range for better scrolling
  const visibleStartIndex = Math.max(0, selectedIndex - 5);
  const visibleEndIndex = Math.min(filteredModels.length, selectedIndex + 6);
  const visibleModels = filteredModels.slice(visibleStartIndex, visibleEndIndex);

  // Handle keyboard input
  useInput((input, key) => {
    // Handle text input for search
    if (input && !key.ctrl && !key.meta && !key.return && !key.escape && !key.tab &&
        !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow &&
        !key.delete && !key.backspace && input !== 'q') {
      setSearchQuery(prev => prev + input);
      return;
    }

    // Handle backspace
    if (key.backspace || key.delete) {
      setSearchQuery(prev => prev.slice(0, -1));
      return;
    }

    if (key.escape) {
      onCancel();
      exit();
      return;
    }

    if (key.return) {
      if (filteredModels.length > 0 && selectedIndex < filteredModels.length) {
        const selectedModel = filteredModels[selectedIndex];
        if (selectedModel) {
          onSelect(selectedModel);
          exit();
        }
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(filteredModels.length - 1, prev + 1));
      return;
    }

    // Handle number keys for quick selection
    if (input >= '1' && input <= '9') {
      const index = parseInt(input) - 1;
      if (index < filteredModels.length) {
        const selectedModel = filteredModels[index];
        if (selectedModel) {
          onSelect(selectedModel);
          exit();
        }
      }
      return;
    }

    // 'q' to quit
    if (input === 'q') {
      onCancel();
      exit();
    }
  });

  if (models.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: No models available</Text>
        <Text color="gray">Press 'q' to quit or Escape to cancel</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan">Select a Model:</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">Search: {searchQuery || "(type to search)"} </Text>
      </Box>

      {filteredModels.length > 0 ? (
        <>
          <Box marginBottom={1}>
            <Text color="gray">
              Found {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''}
            </Text>
          </Box>

          {/* Show scroll indicators if needed */}
          {visibleStartIndex > 0 && (
            <Box marginBottom={1}>
              <Text color="gray">▲ {visibleStartIndex} more above</Text>
            </Box>
          )}

          {visibleModels.map((model, index) => {
            const actualIndex = visibleStartIndex + index;
            return (
              <Box key={model.id} marginBottom={1}>
                <Box flexDirection="column">
                  <Box>
                    <Text
                      color={actualIndex === selectedIndex ? 'green' : 'white'}
                      bold={actualIndex === selectedIndex}
                    >
                      {actualIndex === selectedIndex ? '▸ ' : '  '}
                      {actualIndex + 1}. {model.getDisplayName()}
                    </Text>
                  </Box>
                  <Box marginLeft={4}>
                    <Text color="gray" dimColor>
                      Provider: {model.getProvider()}
                      {model.owned_by && ` | Owner: ${model.owned_by}`}
                    </Text>
                  </Box>
                </Box>
              </Box>
            );
          })}

          {/* Show scroll indicators if needed */}
          {visibleEndIndex < filteredModels.length && (
            <Box marginBottom={1}>
              <Text color="gray">▼ {filteredModels.length - visibleEndIndex} more below</Text>
            </Box>
          )}

          <Box marginTop={1}>
            <Text color="gray">
              Use ↑↓ to navigate, Enter to select, 1-9 for quick selection, q to quit
            </Text>
          </Box>
        </>
      ) : (
        <Box>
          <Text color="yellow">No models match your search.</Text>
          <Text color="gray">Try different search terms.</Text>
        </Box>
      )}
    </Box>
  );
};