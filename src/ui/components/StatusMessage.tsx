import React from 'react';
import { Box, Text } from 'ink';

type StatusType = 'info' | 'success' | 'warning' | 'error';

interface StatusMessageProps {
  type: StatusType;
  message: string;
  icon?: string;
}

const statusConfig = {
  info: { color: 'blue', icon: 'ℹ' },
  success: { color: 'green', icon: '✓' },
  warning: { color: 'yellow', icon: '⚠' },
  error: { color: 'red', icon: '✗' },
};

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  icon
}) => {
  const config = statusConfig[type];
  const displayIcon = icon || config.icon;

  return (
    <Box>
      <Text color={config.color} bold>
        {displayIcon} {message}
      </Text>
    </Box>
  );
};