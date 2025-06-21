// src/components/configuration/FieldConfig/FieldConfig.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  IconButton,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  SelectChangeEvent
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  Save,
  Cancel
} from '@mui/icons-material';
import { FieldMapping, CompositeSource, Condition } from '../../../types/configuration';
import { useConfigurationContext, useSourceSystemsState } from '../../../contexts/ConfigurationContext';

interface FieldConfigProps {
  selectedMapping?: FieldMapping | null;
  onClose?: () => void;
}

export const FieldConfig: React.FC<FieldConfigProps> = ({ 
  selectedMapping, 
  onClose 
}) => {
  const { updateFieldMapping, addFieldMapping } = useConfigurationContext();
  const { sourceFields } = useSourceSystemsState();
  
  const [formData, setFormData] = useState<Partial<FieldMapping>>({
    fieldName: '',
    targetField: '',
    targetPosition: 1,
    length: 0,
    dataType: 'string',
    transformationType: 'source',
    pad: 'right',
    padChar: ' ',
    defaultValue: '',
    sourceField: '',
    sources: [],
    conditions: []
  });

  const [isDirty, setIsDirty] = useState(false);

  // Initialize form when selectedMapping changes
  useEffect(() => {
    if (selectedMapping) {
      setFormData({ ...selectedMapping });
      setIsDirty(false);
    } else {
      // Reset to default for new mapping
      const nextPosition = Math.max(...([] as number[]), 0) + 1;
      setFormData({
        fieldName: '',
        targetField: '',
        targetPosition: nextPosition,
        length: 0,
        dataType: 'string',
        transformationType: 'source',
        pad: 'right',
        padChar: ' ',
        defaultValue: '',
        sourceField: '',
        sources: [],
        conditions: []
      });
      setIsDirty(false);
    }
  }, [selectedMapping]);

  const handleInputChange = (field: keyof FieldMapping, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!formData.fieldName || !formData.targetField) return;

    const mapping: FieldMapping = {
      id: selectedMapping?.id || `mapping_${Date.now()}`,
      fieldName: formData.fieldName!,
      value: formData.value || undefined,
      sourceField: formData.sourceField || '',
      targetField: formData.targetField!,
      length: formData.length || 0,
      pad: formData.pad || 'right',
      padChar: formData.padChar || ' ',
      sources: formData.sources || undefined,
      transform: formData.transform || '',
      delimiter: formData.delimiter || undefined,
      format: formData.format || '',
      sourceFormat: formData.sourceFormat || undefined,
      targetFormat: formData.targetFormat || undefined,
      transformationType: formData.transformationType || 'source',
      conditions: formData.conditions || [],
      targetPosition: formData.targetPosition || 1,
      dataType: formData.dataType || 'string',
      defaultValue: formData.defaultValue || ''
    };

    if (selectedMapping) {
      updateFieldMapping(mapping);
    } else {
      addFieldMapping(mapping);
    }
    
    setIsDirty(false);
    onClose?.();
  };

  const handleCancel = () => {
    if (selectedMapping) {
      setFormData({ ...selectedMapping });
    }
    setIsDirty(false);
    onClose?.();
  };

  const addCompositeSource = () => {
    const newSources = [...(formData.sources || []), { field: '' }];
    handleInputChange('sources', newSources);
  };

  const updateCompositeSource = (index: number, field: string) => {
    const newSources = [...(formData.sources || [])];
    newSources[index] = { field };
    handleInputChange('sources', newSources);
  };

  const removeCompositeSource = (index: number) => {
    const newSources = [...(formData.sources || [])];
    newSources.splice(index, 1);
    handleInputChange('sources', newSources);
  };

  if (!selectedMapping && !formData.fieldName) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Alert severity="info">
          Select a field mapping to edit its configuration
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">
          {selectedMapping ? 'Edit Field Mapping' : 'New Field Mapping'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure field transformation properties
        </Typography>
      </Box>

      {/* Basic Properties */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Basic Properties</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Field Name"
                value={formData.fieldName || ''}
                onChange={(e) => handleInputChange('fieldName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Field"
                value={formData.targetField || ''}
                onChange={(e) => handleInputChange('targetField', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Position"
                type="number"
                value={formData.targetPosition || 1}
                onChange={(e) => handleInputChange('targetPosition', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Length"
                type="number"
                value={formData.length || 0}
                onChange={(e) => handleInputChange('length', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={formData.dataType || 'string'}
                  onChange={(e) => handleInputChange('dataType', e.target.value)}
                  label="Data Type"
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="numeric">Numeric</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Transformation Type */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Transformation</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Transformation Type</InputLabel>
                <Select
                  value={formData.transformationType || 'source'}
                  onChange={(e) => handleInputChange('transformationType', e.target.value)}
                  label="Transformation Type"
                >
                  <MenuItem value="source">Source Field</MenuItem>
                  <MenuItem value="constant">Constant Value</MenuItem>
                  <MenuItem value="composite">Composite</MenuItem>
                  <MenuItem value="conditional">Conditional</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.transformationType === 'source' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Source Field</InputLabel>
                  <Select
                    value={formData.sourceField || ''}
                    onChange={(e) => handleInputChange('sourceField', e.target.value)}
                    label="Source Field"
                  >
                    {sourceFields.map(field => (
                      <MenuItem key={field.name} value={field.name}>
                        {field.name} ({field.dataType})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.transformationType === 'constant' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Value"
                  value={formData.defaultValue || ''}
                  onChange={(e) => handleInputChange('defaultValue', e.target.value)}
                />
              </Grid>
            )}

            {formData.transformationType === 'composite' && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Composite Sources
                  </Typography>
                  {(formData.sources || []).map((source, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <FormControl fullWidth>
                        <Select
                          value={source.field}
                          onChange={(e) => updateCompositeSource(index, e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">Select field...</MenuItem>
                          {sourceFields.map(field => (
                            <MenuItem key={field.name} value={field.name}>
                              {field.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton onClick={() => removeCompositeSource(index)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} onClick={addCompositeSource}>
                    Add Source
                  </Button>
                  
                  <TextField
                    fullWidth
                    label="Delimiter"
                    value={formData.delimiter || ''}
                    onChange={(e) => handleInputChange('delimiter', e.target.value)}
                    sx={{ mt: 2 }}
                    placeholder="e.g., space, comma, etc."
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Padding */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Padding</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pad Direction</InputLabel>
                <Select
                  value={formData.pad || 'right'}
                  onChange={(e) => handleInputChange('pad', e.target.value)}
                  label="Pad Direction"
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Pad Character"
                value={formData.padChar || ' '}
                onChange={(e) => handleInputChange('padChar', e.target.value)}
                inputProps={{ maxLength: 1 }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={!formData.fieldName || !formData.targetField || !isDirty}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};