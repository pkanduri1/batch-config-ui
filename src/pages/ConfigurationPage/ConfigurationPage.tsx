// src/pages/ConfigurationPage/ConfigurationPage.tsx
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

export const ConfigurationPage: React.FC = () => {
  const { systemId, jobName } = useParams();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Field Configuration
      </Typography>
      {systemId && jobName ? (
        <Alert severity="info">
          Configuring {systemId} - {jobName}
        </Alert>
      ) : (
        <Alert severity="warning">
          Select a source system and job to configure field mappings
        </Alert>
      )}
    </Box>
  );
};