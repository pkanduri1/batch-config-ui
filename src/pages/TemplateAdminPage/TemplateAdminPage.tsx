// src/pages/TemplateAdminPage/TemplateAdminPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Upload,
  Edit,
  Delete,
  Add,
  Save,
  Cancel,
  FileUpload,
  AdminPanelSettings,
  Storage,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { templateApiService } from '../../services/api/templateApi';
import { FileTypeTemplate, FieldTemplate, TemplateImportResult } from '../../types/template';

export const TemplateAdminPage: React.FC = () => {
  const [fileTypes, setFileTypes] = useState<FileTypeTemplate[]>([]);
  const [selectedFileType, setSelectedFileType] = useState('');
  const [templateFields, setTemplateFields] = useState<FieldTemplate[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Add field dialog
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newField, setNewField] = useState<Partial<FieldTemplate>>({
    fieldName: '',
    targetPosition: 1,
    length: 1,
    dataType: 'String',
    format: '',
    required: 'N',
    description: '',
    transactionType: 'default'
  });

  useEffect(() => {
    fetchFileTypes();
  }, []);

  const fetchFileTypes = async () => {
    try {
      setLoading(true);
      const data = await templateApiService.getAllFileTypes();
      setFileTypes(data);
      setError(null);
    } catch (error) {
      setError('Failed to load file types');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateFields = async (fileType: string) => {
    try {
      setLoading(true);
      const data = await templateApiService.getTemplateFields(fileType, 'default');
      setTemplateFields(data);
      setError(null);
    } catch (error) {
      setError(`Failed to load template fields for ${fileType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileTypeChange = (fileType: string) => {
    setSelectedFileType(fileType);
    if (fileType) {
      fetchTemplateFields(fileType);
    } else {
      setTemplateFields([]);
    }
    setIsEditing(false);
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await templateApiService.importFromExcel(file, selectedFileType || 'p327');
      
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
      // Reset file input
      event.target.value = '';
    }
  };

  const addField = () => {
    if (!newField.fieldName || !newField.targetPosition) {
      setError('Field name and position are required');
      return;
    }
    
    const fieldToAdd: FieldTemplate = {
      fileType: selectedFileType,
      transactionType: 'default',
      fieldName: newField.fieldName!,
      targetPosition: newField.targetPosition!,
      length: newField.length!,
      dataType: newField.dataType!,
      format: newField.format,
      required: newField.required!,
      description: newField.description,
      enabled: 'Y'
    };
    
    const updatedFields = [...templateFields, fieldToAdd].sort(
      (a, b) => a.targetPosition - b.targetPosition
    );
    setTemplateFields(updatedFields);
    
    setNewField({
      fieldName: '',
      targetPosition: Math.max(...templateFields.map(f => f.targetPosition), 0) + 1,
      length: 1,
      dataType: 'String',
      format: '',
      required: 'N',
      description: '',
      transactionType: 'default'
    });
    setAddFieldOpen(false);
    setError(null);
  };

  const deleteField = (index: number) => {
    const updated = templateFields.filter((_, i) => i !== index);
    setTemplateFields(updated);
  };

  const saveTemplate = async () => {
    try {
      setLoading(true);
      const templateData = {
        fileType: selectedFileType,
        description: `Template for ${selectedFileType}`,
        createdBy: 'admin',
        replaceExisting: true,
        fields: templateFields
      };

      const result = await templateApiService.importFromJson(templateData);
      if (result.success) {
        setSuccessMessage('Template saved successfully!');
        setIsEditing(false);
        setError(null);
      } else {
        setError(`Save failed: ${result.message}`);
      }
    } catch (error) {
      setError('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        color: 'primary.main', 
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <AdminPanelSettings fontSize="large" />
        Template Administration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Header Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={selectedFileType}
                onChange={(e) => handleFileTypeChange(e.target.value)}
                label="File Type"
                disabled={loading}
              >
                <MenuItem value="">Select File Type</MenuItem>
                {fileTypes.map((ft) => (
                  <MenuItem key={ft.fileType} value={ft.fileType}>
                    {ft.fileType} - {ft.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUpload />}
              disabled={loading || !selectedFileType}
              fullWidth
            >
              Import Excel
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
              />
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEditing}
                    onChange={(e) => setIsEditing(e.target.checked)}
                    disabled={!selectedFileType || loading}
                  />
                }
                label="Edit Mode"
              />
              
              {isEditing && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  onClick={saveTemplate}
                  disabled={loading}
                >
                  Save Template
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Template Fields Table */}
      {selectedFileType && (
        <Card>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2 
            }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage />
                Template Fields: {selectedFileType}
              </Typography>
              <Chip 
                label={`${templateFields.length} fields`} 
                color="primary"
                variant="outlined"
              />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Position</TableCell>
                      <TableCell>Field Name</TableCell>
                      <TableCell>Length</TableCell>
                      <TableCell>Data Type</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Description</TableCell>
                      {isEditing && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateFields.map((field, index) => (
                      <TableRow key={field.fieldName} hover>
                        <TableCell align="center">
                          <Chip size="small" label={field.targetPosition} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {field.fieldName}
                          </Typography>
                        </TableCell>
                        <TableCell>{field.length}</TableCell>
                        <TableCell>
                          <Chip size="small" label={field.dataType} variant="outlined" />
                        </TableCell>
                        <TableCell>{field.format || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={field.required === 'Y' ? 'Required' : 'Optional'}
                            color={field.required === 'Y' ? 'error' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" noWrap>
                            {field.description || '-'}
                          </Typography>
                        </TableCell>
                        {isEditing && (
                          <TableCell>
                            <Tooltip title="Delete field">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteField(index)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Field FAB */}
      {isEditing && selectedFileType && (
        <Fab
          color="primary"
          aria-label="add field"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setAddFieldOpen(true)}
        >
          <Add />
        </Fab>
      )}

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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Position"
                value={newField.targetPosition}
                onChange={(e) => setNewField({...newField, targetPosition: parseInt(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Length"
                value={newField.length}
                onChange={(e) => setNewField({...newField, length: parseInt(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={newField.dataType}
                  onChange={(e) => setNewField({...newField, dataType: e.target.value as any})}
                  label="Data Type"
                >
                  <MenuItem value="String">String</MenuItem>
                  <MenuItem value="Numeric">Numeric</MenuItem>
                  <MenuItem value="Date">Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Format"
                value={newField.format}
                onChange={(e) => setNewField({...newField, format: e.target.value})}
                placeholder="+9(12)V9(6)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Required</InputLabel>
                <Select
                  value={newField.required}
                  onChange={(e) => setNewField({...newField, required: e.target.value as any})}
                  label="Required"
                >
                  <MenuItem value="N">Optional</MenuItem>
                  <MenuItem value="Y">Required</MenuItem>
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
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFieldOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button onClick={addField} variant="contained" startIcon={<Add />}>
            Add Field
          </Button>
        </DialogActions>
      </Dialog>

      {/* Usage Instructions */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.main', color: 'info.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          📋 Instructions
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Select a file type to view its template structure</li>
            <li>Import Excel files to bulk-create templates (251 fields for p327)</li>
            <li>Enable Edit mode to add/remove individual fields</li>
            <li>Templates define target structure - BAs only map source fields</li>
            <li>Save changes to make templates available for configuration</li>
          </ul>
        </Typography>
      </Paper>
    </Container>
  );
};

export default TemplateAdminPage;