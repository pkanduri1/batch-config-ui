import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  TableSortLabel,
  Checkbox,
  FormControlLabel,
  Fade,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  FileCopy as DuplicateIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';
import { templateApiService } from '../../services/api/templateApi';
import { FieldTemplate, FileType } from '../../types/template';

interface NewFieldData {
  fieldName: string;
  targetPosition: number;
  length: number;
  dataType: 'String' | 'Number' | 'Date' | 'Boolean' | 'Decimal' | 'Integer';
  format: string;
  required: string;
  description: string;
  transactionType: string;
}

interface NewFileTypeData {
  fileType: string;
  description: string;
  transactionType: string;
  maxFields: number;
  validationRules: string;
}

interface EditingField extends FieldTemplate {
  isEditing?: boolean;
  originalData?: FieldTemplate;
}

const TemplateAdminPage: React.FC = () => {
  // State management
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('default');
  const [transactionTypes, setTransactionTypes] = useState<string[]>(['default']);
  const [templateFields, setTemplateFields] = useState<EditingField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [addFileTypeOpen, setAddFileTypeOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);
  
  // Form data
  const [newField, setNewField] = useState<NewFieldData>({
    fieldName: '',
    targetPosition: 1,
    length: 1,
    dataType: 'String',
    format: '',
    required: 'N',
    description: '',
    transactionType: 'default'
  });
  
  const [newFileType, setNewFileType] = useState<NewFileTypeData>({
    fileType: '',
    description: '',
    transactionType: 'default',
    maxFields: 500,
    validationRules: ''
  });

  // Table configuration
  const [sortBy, setSortBy] = useState<keyof FieldTemplate>('targetPosition');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(false);

  const dataTypes = ['String', 'Number', 'Date', 'Boolean', 'Decimal', 'Integer'];
  const requiredOptions = [
    { value: 'Y', label: 'Required' },
    { value: 'N', label: 'Optional' }
  ];

  // Load data on component mount
  useEffect(() => {
    fetchFileTypes();
  }, []);

  useEffect(() => {
    if (selectedFileType) {
      fetchTransactionTypes(selectedFileType);
      setSelectedTransactionType('default');
    }
  }, [selectedFileType]);

  useEffect(() => {
    if (selectedFileType && selectedTransactionType) {
      fetchTemplateFields(selectedFileType, selectedTransactionType);
      resetNewFieldPosition();
    }
  }, [selectedFileType, selectedTransactionType]);

  // API calls
  const fetchFileTypes = async () => {
    try {
      setLoading(true);
      const types = await templateApiService.getFileTypes();
      setFileTypes(types);
    } catch (error) {
      setError('Failed to load file types');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionTypes = async (fileType: string) => {
    try {
      const types = await templateApiService.getTransactionTypes(fileType);
      console.log('Transaction types received:', types, 'Type:', typeof types, 'Length:', types?.length);
      // Always ensure "default" is available
      const finalTypes = types.length > 0 ? types : ['default'];
      setTransactionTypes(finalTypes);
    } catch (error) {
      console.error('Transaction types error:', error);
      setError(`Failed to load transaction types for ${fileType}`);
      setTransactionTypes(['default']);
    }
  };

  const fetchTemplateFields = async (fileType: string, transactionType: string = 'default') => {
    try {
      setLoading(true);
      const fields = await templateApiService.getTemplateFields(fileType, transactionType);
      setTemplateFields(fields.map(field => ({ ...field, isEditing: false })));
    } catch (error) {
      setError(`Failed to load template fields for ${fileType}/${transactionType}`);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const resetNewFieldPosition = () => {
    const maxPosition = Math.max(...templateFields.map(f => f.targetPosition), 0);
    setNewField(prev => ({ ...prev, targetPosition: maxPosition + 1 }));
  };

  const validateField = (field: NewFieldData): string[] => {
    const errors: string[] = [];
    
    if (!field.fieldName.trim()) {
      errors.push('Field name is required');
    } else if (templateFields.some(f => f.fieldName.toLowerCase() === field.fieldName.toLowerCase())) {
      errors.push('Field name already exists');
    }
    
    if (field.targetPosition <= 0) {
      errors.push('Position must be greater than 0');
    } else if (templateFields.some(f => f.targetPosition === field.targetPosition)) {
      errors.push('Position already exists');
    }
    
    if (field.length <= 0) {
      errors.push('Length must be greater than 0');
    }
    
    return errors;
  };

  const validateFileType = (fileType: NewFileTypeData): string[] => {
    const errors: string[] = [];
    
    if (!fileType.fileType.trim()) {
      errors.push('File type name is required');
    }
    
    if (!fileType.description.trim()) {
      errors.push('Description is required');
    }
    
    if (!fileType.transactionType.trim()) {
      errors.push('Transaction type is required');
    }
    
    if (fileType.maxFields <= 0) {
      errors.push('Max fields must be greater than 0');
    }
    
    return errors;
  };

  // Field management functions
  const handleAddField = async () => {
    const errors = validateField(newField);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    const fieldToAdd: FieldTemplate = {
      fileType: selectedFileType,
      transactionType: newField.transactionType || selectedTransactionType,
      fieldName: newField.fieldName,
      targetPosition: newField.targetPosition,
      length: newField.length,
      dataType: newField.dataType,
      format: newField.format,
      required: newField.required as 'Y' | 'N',
      description: newField.description,
      enabled: 'Y'
    };

    try {
      const updatedFields = [...templateFields, { ...fieldToAdd, isEditing: false }]
        .sort((a, b) => a.targetPosition - b.targetPosition);
      setTemplateFields(updatedFields);
      setAddFieldOpen(false);
      resetNewField();
      setSuccessMessage('Field added successfully');
    } catch (error) {
      setError('Failed to add field');
    }
  };

  const resetNewField = () => {
    setNewField({
      fieldName: '',
      targetPosition: Math.max(...templateFields.map(f => f.targetPosition), 0) + 1,
      length: 1,
      dataType: 'String',
      format: '',
      required: 'N',
      description: '',
      transactionType: selectedTransactionType
    });
  };

  const handleEditField = (index: number) => {
    const updatedFields = [...templateFields];
    updatedFields[index] = {
      ...updatedFields[index],
      isEditing: true,
      originalData: { ...updatedFields[index] }
    };
    setTemplateFields(updatedFields);
  };

  const handleSaveField = (index: number) => {
    const field = templateFields[index];
    const errors = validateField({
      fieldName: field.fieldName,
      targetPosition: field.targetPosition,
      length: field.length,
      dataType: field.dataType,
      format: field.format || '',
      required: field.required,
      description: field.description || '',
      transactionType: field.transactionType
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    const updatedFields = [...templateFields];
    updatedFields[index] = {
      ...updatedFields[index],
      isEditing: false,
      originalData: undefined
    };
    setTemplateFields(updatedFields);
    setSuccessMessage('Field updated successfully');
  };

  const handleCancelEdit = (index: number) => {
    const updatedFields = [...templateFields];
    if (updatedFields[index].originalData) {
      updatedFields[index] = {
        ...updatedFields[index].originalData!,
        isEditing: false,
        originalData: undefined
      };
    }
    setTemplateFields(updatedFields);
  };

  const handleFieldChange = (index: number, field: keyof FieldTemplate, value: any) => {
    const updatedFields = [...templateFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value
    };
    setTemplateFields(updatedFields);
  };

  const handleDeleteField = (index: number) => {
    setFieldToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteField = () => {
    if (fieldToDelete !== null) {
      const updatedFields = templateFields.filter((_, i) => i !== fieldToDelete);
      setTemplateFields(updatedFields);
      setSuccessMessage('Field deleted successfully');
    }
    setDeleteConfirmOpen(false);
    setFieldToDelete(null);
  };

  const handleDuplicateField = (index: number) => {
    const fieldToDuplicate = templateFields[index];
    const maxPosition = Math.max(...templateFields.map(f => f.targetPosition), 0);
    
    const duplicatedField: EditingField = {
      ...fieldToDuplicate,
      fieldName: `${fieldToDuplicate.fieldName}_copy`,
      targetPosition: maxPosition + 1,
      isEditing: false
    };

    setTemplateFields([...templateFields, duplicatedField]);
    setSuccessMessage('Field duplicated successfully');
  };

  // File type management
  const handleAddFileType = async () => {
    const errors = validateFileType(newFileType);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      setLoading(true);
      const result = await templateApiService.createFileType({
        fileType: newFileType.fileType,
        description: newFileType.description,
        maxFields: newFileType.maxFields,
        validationRules: newFileType.validationRules,
        transactionType: newFileType.transactionType,
        enabled: 'Y',
        createdBy: 'admin'
      });

      // Refresh file types from backend
      await fetchFileTypes();
      
      setAddFileTypeOpen(false);
      setNewFileType({
        fileType: '',
        description: '',
        transactionType: 'default',
        maxFields: 500,
        validationRules: ''
      });
      setSuccessMessage(`File type '${newFileType.fileType}' with transaction type '${newFileType.transactionType}' added successfully`);
    } catch (error) {
      setError('Failed to add file type');
    } finally {
      setLoading(false);
    }
  };

  // Excel import
  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedFileType) return;

    try {
      setLoading(true);
      const result = await templateApiService.importFromExcel(file, selectedFileType);
      
      if (result.success) {
        setSuccessMessage(`Successfully imported ${result.fieldsImported} fields`);
        fetchTemplateFields(selectedFileType);
      } else {
        setError(`Import failed: ${result.message}`);
      }
    } catch (error) {
      setError('Excel import failed');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  // Save template
  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      const templateData = {
        fileType: selectedFileType,
        description: `Template for ${selectedFileType}`,
        createdBy: 'admin',
        replaceExisting: true,
        fields: templateFields.map(({ isEditing, originalData, ...field }) => field)
      };

      const result = await templateApiService.importFromJson(templateData);
      if (result.success) {
        setSuccessMessage('Template saved successfully!');
      } else {
        setError(`Save failed: ${result.message}`);
      }
    } catch (error) {
      setError('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  // Sorting
  const handleSort = (field: keyof FieldTemplate) => {
    const newDirection = sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortDirection(newDirection);
  };

  const sortedFields = [...templateFields].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    // Handle undefined/null values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * modifier;
  });

  const filteredFields = showInactive 
    ? sortedFields 
    : sortedFields.filter(field => field.enabled === 'Y');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Template Administration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage file type templates and field definitions for batch configuration
        </Typography>
      </Paper>

      {/* File Type Selection and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>File Type</InputLabel>
                <Select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  label="File Type"
                >
                  {fileTypes.map((type) => (
                    <MenuItem key={type.fileType} value={type.fileType}>
                      {type.fileType} - {type.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth disabled={!selectedFileType}>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={selectedTransactionType}
                  onChange={(e) => setSelectedTransactionType(e.target.value)}
                  label="Transaction Type"
                >
                  {transactionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddFieldOpen(true)}
                  disabled={!selectedFileType || !selectedTransactionType}
                >
                  Add Field
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddFileTypeOpen(true)}
                >
                  Add File Type
                </Button>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={!selectedFileType}
                >
                  Excel Import
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                  />
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveTemplate}
                  disabled={!selectedFileType || templateFields.length === 0}
                >
                  Save Template
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Template Fields Table */}
      <Paper elevation={1}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Template Fields ({filteredFields.length})
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
              }
              label="Show inactive fields"
            />
          </Box>
        </Box>

        {selectedFileType ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'targetPosition'}
                      direction={sortDirection}
                      onClick={() => handleSort('targetPosition')}
                    >
                      Position
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'fieldName'}
                      direction={sortDirection}
                      onClick={() => handleSort('fieldName')}
                    >
                      Field Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'transactionType'}
                      direction={sortDirection}
                      onClick={() => handleSort('transactionType')}
                    >
                      Transaction Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Length</TableCell>
                  <TableCell>Data Type</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFields.map((field, index) => (
                  <TableRow key={`${field.fieldName}-${index}`}>
                    <TableCell>
                      {field.isEditing ? (
                        <TextField
                          type="number"
                          size="small"
                          value={field.targetPosition}
                          onChange={(e) => handleFieldChange(index, 'targetPosition', parseInt(e.target.value))}
                          sx={{ width: 80 }}
                        />
                      ) : (
                        field.targetPosition
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {field.isEditing ? (
                        <TextField
                          size="small"
                          value={field.fieldName}
                          onChange={(e) => handleFieldChange(index, 'fieldName', e.target.value)}
                        />
                      ) : (
                        field.fieldName
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {field.isEditing ? (
                        <Select
                          size="small"
                          value={field.transactionType}
                          onChange={(e) => handleFieldChange(index, 'transactionType', e.target.value)}
                          sx={{ minWidth: 120 }}
                        >
                          {transactionTypes.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Chip label={field.transactionType} size="small" color="primary" variant="outlined" />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {field.isEditing ? (
                        <TextField
                          type="number"
                          size="small"
                          value={field.length}
                          onChange={(e) => handleFieldChange(index, 'length', parseInt(e.target.value))}
                          sx={{ width: 80 }}
                        />
                      ) : (
                        field.length
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {field.isEditing ? (
                        <Select
                          size="small"
                          value={field.dataType}
                          onChange={(e) => handleFieldChange(index, 'dataType', e.target.value)}
                          sx={{ minWidth: 100 }}
                        >
                          {dataTypes.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Chip label={field.dataType} size="small" variant="outlined" />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {field.isEditing ? (
                        <TextField
                          size="small"
                          value={field.format || ''}
                          onChange={(e) => handleFieldChange(index, 'format', e.target.value)}
                        />
                      ) : (
                        field.format || '-'
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {field.isEditing ? (
                        <Select
                          size="small"
                          value={field.required}
                          onChange={(e) => handleFieldChange(index, 'required', e.target.value)}
                          sx={{ minWidth: 100 }}
                        >
                          {requiredOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Chip 
                          label={field.required === 'Y' ? 'Required' : 'Optional'}
                          size="small"
                          color={field.required === 'Y' ? 'error' : 'default'}
                        />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {field.isEditing ? (
                        <TextField
                          size="small"
                          multiline
                          rows={2}
                          value={field.description || ''}
                          onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                          sx={{ width: 200 }}
                        />
                      ) : (
                        <Tooltip title={field.description || ''}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {field.description || '-'}
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={field.enabled === 'Y' ? 'Active' : 'Inactive'}
                        size="small"
                        color={field.enabled === 'Y' ? 'success' : 'default'}
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box display="flex" gap={1}>
                        {field.isEditing ? (
                          <>
                            <Tooltip title="Save">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSaveField(index)}
                              >
                                <SaveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton
                                size="small"
                                onClick={() => handleCancelEdit(index)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEditField(index)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Duplicate">
                              <IconButton
                                size="small"
                                onClick={() => handleDuplicateField(index)}
                              >
                                <DuplicateIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteField(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Select a file type to view template fields
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Add Field Dialog */}
      <Dialog open={addFieldOpen} onClose={() => setAddFieldOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Field</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={newField.fieldName}
                onChange={(e) => setNewField({...newField, fieldName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Position"
                value={newField.targetPosition}
                onChange={(e) => setNewField({...newField, targetPosition: parseInt(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Length"
                value={newField.length}
                onChange={(e) => setNewField({...newField, length: parseInt(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={newField.dataType}
                  onChange={(e) => setNewField({...newField, dataType: e.target.value as NewFieldData['dataType']})}
                  label="Data Type"
                >
                  {dataTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Format"
                value={newField.format}
                onChange={(e) => setNewField({...newField, format: e.target.value})}
                placeholder="e.g., YYYY-MM-DD, ###.##"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Required</InputLabel>
                <Select
                  value={newField.required}
                  onChange={(e) => setNewField({...newField, required: e.target.value})}
                  label="Required"
                >
                  {requiredOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={newField.transactionType}
                  onChange={(e) => setNewField({...newField, transactionType: e.target.value})}
                  label="Transaction Type"
                >
                  {transactionTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newField.description}
                onChange={(e) => setNewField({...newField, description: e.target.value})}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFieldOpen(false)}>Cancel</Button>
          <Button onClick={handleAddField} variant="contained">Add Field</Button>
        </DialogActions>
      </Dialog>

      {/* Add File Type Dialog */}
      <Dialog open={addFileTypeOpen} onClose={() => setAddFileTypeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New File Type</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="File Type Name"
                value={newFileType.fileType}
                onChange={(e) => setNewFileType({...newFileType, fileType: e.target.value})}
                required
                placeholder="e.g., p327, atoctran"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newFileType.description}
                onChange={(e) => setNewFileType({...newFileType, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Transaction Type"
                value={newFileType.transactionType}
                onChange={(e) => setNewFileType({...newFileType, transactionType: e.target.value})}
                required
                placeholder="e.g., default, correction, reversal"
                helperText="Initial transaction type for this file type"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Fields"
                value={newFileType.maxFields}
                onChange={(e) => setNewFileType({...newFileType, maxFields: parseInt(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Validation Rules"
                value={newFileType.validationRules}
                onChange={(e) => setNewFileType({...newFileType, validationRules: e.target.value})}
                multiline
                rows={3}
                placeholder="Custom validation rules (optional)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFileTypeOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFileType} variant="contained">Add File Type</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this field? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteField} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      <Fade in={loading}>
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(0,0,0,0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <CircularProgress size={60} />
        </Box>
      </Fade>

      {/* Success/Error Alerts */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TemplateAdminPage;