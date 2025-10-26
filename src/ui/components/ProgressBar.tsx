import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  width?: number;
  character?: string;
  backgroundColor?: string;
  fillColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
  width = 40,
  character = '█',
  backgroundColor = 'gray',
  fillColor = 'green'
}) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filledChars = Math.round((percentage / 100) * width);
  const emptyChars = width - filledChars;

  return (
    <Box flexDirection="column">
      {label && (
        <Box marginBottom={1}>
          <Text>{label}</Text>
        </Box>
      )}
      <Box>
        <Text color={fillColor}>
          {character.repeat(filledChars)}
        </Text>
        <Text color={backgroundColor} dimColor>
          {character.repeat(emptyChars)}
        </Text>
        <Text> {percentage.toFixed(1)}%</Text>
      </Box>
      {total > 0 && (
        <Text color="gray" dimColor>
          {current} / {total}
        </Text>
      )}
    </Box>
  );
};