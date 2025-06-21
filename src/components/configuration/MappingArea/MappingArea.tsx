// src/components/configuration/MappingArea/MappingArea.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Alert,
  Menu,
  MenuItem,
  Tooltip,
  List,
  ListItem,
  Divider
} from '@mui/material';
import {
  DragIndicator,
  Edit,
  Delete,
  MoreVert,
  Add,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { FieldMapping } from '../../../types/configuration';
import { useConfigurationContext } from '../../../contexts/ConfigurationContext';

interface MappingItemProps {
  mapping: FieldMapping;
  index: number;
  onEdit: (mapping: FieldMapping) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

const MappingItem: React.FC<MappingItemProps> = ({ 
  mapping, 
  index, 
  onEdit, 
  onDelete, 
  isDragging 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(mapping);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (mapping.id) {
      onDelete(mapping.id);
    }
    handleMenuClose();
  };

  const getTransformationTypeColor = (type: string) => {
    switch (type) {
      case 'source': return 'primary';
      case 'constant': return 'success';
      case 'composite': return 'warning';
      case 'conditional': return 'error';
      default: return 'default';
    }
  };

  const getTransformationIcon = (type: string) => {
    switch (type) {
      case 'source': return '→';
      case 'constant': return '📌';
      case 'composite': return '⚡';
      case 'conditional': return '🔀';
      default: return '?';
    }
  };

  return (
    <Paper
      elevation={isDragging ? 8 : 1}
      sx={{
        p: 2,
        mb: 1,
        cursor: 'pointer',
        border: 1,
        borderColor: isDragging ? 'primary.main' : 'divider',
        backgroundColor: isDragging ? 'action.selected' : 'background.paper',
        transform: isDragging ? 'rotate(1deg)' : 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'action.hover',
          borderColor: 'primary.light'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <DragIndicator 
          sx={{ 
            color: 'text.secondary', 
            cursor: 'grab',
            mt: 0.5
          }} 
        />
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={mapping.targetPosition}
                size="small"
                color="primary"
                variant="filled"
                sx={{ minWidth: '32px', fontWeight: 'bold' }}
              />
              <Typography variant="body2" fontWeight="medium">
                {mapping.targetField}
              </Typography>
            </Box>
            
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>

          {/* Mapping Details */}
          <Box sx={{ display: 'flex', flex: 1, gap: 2, alignItems: 'center', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Source
              </Typography>
              <Typography variant="body2">
                {mapping.transformationType === 'source' && mapping.sourceField
                  ? mapping.sourceField
                  : mapping.transformationType === 'constant' && mapping.defaultValue
                  ? `"${mapping.defaultValue}"`
                  : mapping.transformationType === 'composite' && mapping.sources
                  ? `${mapping.sources.map(s => s.field).join(' + ')}`
                  : 'Not configured'
                }
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', px: 1 }}>
              <Typography variant="h6">
                {getTransformationIcon(mapping.transformationType)}
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Target ({mapping.length} chars)
              </Typography>
              <Typography variant="body2">
                {mapping.targetField}
              </Typography>
            </Box>
          </Box>

          {/* Tags Row */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={mapping.transformationType}
              size="small"
              color={getTransformationTypeColor(mapping.transformationType) as any}
              variant="outlined"
            />
            <Chip
              label={mapping.dataType}
              size="small"
              variant="outlined"
              color="default"
            />
            {mapping.pad && (
              <Chip
                label={`Pad ${mapping.pad}`}
                size="small"
                variant="outlined"
                color="info"
              />
            )}
            {mapping.conditions && mapping.conditions.length > 0 && (
              <Chip
                label="Conditional"
                size="small"
                variant="outlined"
                color="warning"
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Mapping
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Mapping
        </MenuItem>
      </Menu>
    </Paper>
  );
};

interface MappingAreaProps {
  onMappingSelect?: (mapping: FieldMapping) => void;
}

export const MappingArea: React.FC<MappingAreaProps> = ({ onMappingSelect }) => {
  const { 
    fieldMappings = [], 
    updateFieldMapping, 
    deleteFieldMapping, 
    reorderFieldMappings,
    addFieldMapping 
  } = useConfigurationContext();

  const [selectedMapping, setSelectedMapping] = useState<FieldMapping | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Handle reordering within mapping area
    if (source.droppableId === 'mapping-area' && destination.droppableId === 'mapping-area') {
      reorderFieldMappings(source.index, destination.index);
    }
    
    // Handle dropping from source fields (handled by parent ConfigurationPage)
  };

  const handleEditMapping = (mapping: FieldMapping) => {
    setSelectedMapping(mapping);
    onMappingSelect?.(mapping);
    console.log('Edit mapping:', mapping);
  };

  const handleDeleteMapping = (id: string) => {
    const mapping = fieldMappings.find(m => m.id === id);
    if (mapping) {
      deleteFieldMapping(mapping.fieldName, mapping.transactionType || 'default');
    }
  };

  const handleCreateMapping = () => {
    // TODO: Open creation dialog
    console.log('Create new mapping');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Field Mappings ({fieldMappings.length})
          </Typography>
          <Tooltip title="Add new mapping">
            <IconButton onClick={handleCreateMapping} color="primary">
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
        
        {fieldMappings.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Total record length: {fieldMappings.reduce((sum, m) => sum + m.length, 0)} characters
          </Typography>
        )}
      </Box>

      {/* Mappings List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {fieldMappings.length === 0 ? (
          <Box sx={{ 
            height: '200px',
            border: 2,
            borderStyle: 'dashed',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'action.hover'
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Field Mappings
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Drag source fields here to create mappings
              <br />
              or use the + button to add manually
            </Typography>
          </Box>
        ) : (
          <Droppable droppableId="mapping-area">
            {(provided, snapshot) => (
              <List
                {...provided.droppableProps}
                ref={provided.innerRef}
                sx={{ 
                  p: 0,
                  backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                  borderRadius: 1,
                  transition: 'background-color 0.2s ease',
                  minHeight: '100px'
                }}
              >
                {fieldMappings
                  .filter(mapping => mapping.id) // Filter out mappings without IDs
                  .sort((a, b) => a.targetPosition - b.targetPosition)
                  .map((mapping, index) => (
                  <Draggable 
                    key={mapping.id} 
                    draggableId={mapping.id!} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{ p: 0, mb: 1 }}
                      >
                        <MappingItem
                          mapping={mapping}
                          index={index}
                          onEdit={handleEditMapping}
                          onDelete={handleDeleteMapping}
                          isDragging={snapshot.isDragging}
                        />
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        )}
      </Box>

      {/* Validation Summary */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {fieldMappings.length > 0 ? (
          <Alert severity="success" variant="outlined">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" />
              <Typography variant="body2">
                {fieldMappings.length} mappings configured
              </Typography>
            </Box>
          </Alert>
        ) : (
          <Alert severity="warning" variant="outlined">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning fontSize="small" />
              <Typography variant="body2">
                No field mappings configured
              </Typography>
            </Box>
          </Alert>
        )}
      </Box>
    </Box>
  );
};