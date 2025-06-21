// src/pages/ConfigurationPage/ConfigurationPage.tsx
import React, { useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  Paper, 
  Divider,
  Chip,
  CircularProgress 
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useConfigurationContext, useSourceSystemsState } from '../../contexts/ConfigurationContext';
import { SourceFieldList } from '../../components/configuration/SourceFieldList/SourceFieldList';
import { MappingArea } from '../../components/configuration/MappingArea/MappingArea';
import { FieldConfig } from '../../components/configuration/FieldConfig/FieldConfig';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { FieldMapping } from '../../types/configuration';

const ConfigurationPage: React.FC = () => {
  const { systemId, jobName } = useParams();
  const { 
    selectedSourceSystem, 
    selectedJob, 
    selectSourceSystem, 
    selectJob,
    sourceSystems,
    sourceFields 
  } = useSourceSystemsState();
  
  const { isLoading, error } = useConfigurationContext();
  const [selectedMapping, setSelectedMapping] = React.useState<FieldMapping | null>(null);

  // Handle field drag from source list to mapping area
  const handleFieldDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Handle reordering within mapping area
    if (source.droppableId === 'mapping-area' && destination.droppableId === 'mapping-area') {
      // This will be handled by MappingArea's onDragEnd
      return;
    }
    
    // Handle dropping source field into mapping area (create new mapping)
    if (source.droppableId === 'source-fields' && destination.droppableId === 'mapping-area') {
      const draggedField = sourceFields[source.index];
      console.log('Creating mapping for field:', draggedField);
      // TODO: Add field mapping creation logic
    }
  };

  // Auto-select system and job based on URL params
  useEffect(() => {
    if (systemId && sourceSystems.length > 0) {
      const system = sourceSystems.find(s => s.id === systemId);
      if (system && system.id !== selectedSourceSystem?.id) {
        selectSourceSystem(systemId);
      }
    }
  }, [systemId, sourceSystems, selectedSourceSystem, selectSourceSystem]);

  useEffect(() => {
    if (jobName && selectedSourceSystem) {
      const job = selectedSourceSystem.jobs.find(j => j.name === jobName);
      if (job && job.name !== selectedJob?.name) {
        selectJob(jobName);
      }
    }
  }, [jobName, selectedSourceSystem, selectedJob, selectJob]);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading configuration: {error}
        </Alert>
      </Box>
    );
  }

  // No selection state
  if (!selectedSourceSystem || !selectedJob) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Field Configuration
        </Typography>
        <Alert severity="info">
          Select a source system and job from the sidebar to configure field mappings
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom>
          Field Configuration
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={selectedSourceSystem.name} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
          <Typography variant="body2" color="text.secondary">•</Typography>
          <Chip 
            label={selectedJob.name} 
            color="secondary" 
            variant="outlined" 
            size="small"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {sourceFields.length} source fields available
          </Typography>
        </Box>
      </Box>

      {/* 3-Panel Interface */}
      <DragDropContext onDragEnd={handleFieldDragEnd}>
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          overflow: 'hidden',
          gap: 1,
          p: 1
        }}>
          {/* Left Panel - Source Fields */}
          <Paper 
            elevation={1} 
            sx={{ 
              width: '300px', 
              minWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Source Fields</Typography>
              <Typography variant="body2" color="text.secondary">
                Drag fields to create mappings
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              <SourceFieldList 
                sourceFields={sourceFields} 
              />
            </Box>
          </Paper>

          {/* Center Panel - Mapping Area */}
          <Paper 
            elevation={1} 
            sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: '400px'
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Field Mappings</Typography>
              <Typography variant="body2" color="text.secondary">
                Configure target field mappings
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <MappingArea onMappingSelect={setSelectedMapping} />
            </Box>
          </Paper>

          {/* Right Panel - Field Configuration */}
          <Paper 
            elevation={1} 
            sx={{ 
              width: '350px', 
              minWidth: '350px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Field Configuration</Typography>
              <Typography variant="body2" color="text.secondary">
                Edit mapping properties
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <FieldConfig 
                selectedMapping={selectedMapping}
                onClose={() => setSelectedMapping(null)}
              />
            </Box>
          </Paper>
        </Box>
      </DragDropContext>
    </Box>
  );
};

export { ConfigurationPage };