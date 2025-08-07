// SQL*Loader Configuration Page Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  Save,
  PlayArrow,
  Refresh,
  GetApp,
  Publish,
  Visibility,
  Settings,
  TableChart,
  Code,
  CheckCircle,
  Error as ErrorIcon,
  Warning
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useParams } from 'react-router-dom';
import { useSQLLoaderConfiguration } from '../../../hooks/useSQLLoaderConfiguration';
import { SQLLoaderColumn, SQLLoaderConfig } from '../../../types/configuration';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const SQLLoaderConfigurationPage: React.FC = () => {
  const { systemId, jobName } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [controlFilePreview, setControlFilePreview] = useState('');
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [editingColumn, setEditingColumn] = useState<SQLLoaderColumn | null>(null);

  const {
    config,
    tableColumns,
    availableTables,
    validationResult,
    isLoading,
    isDirty,
    error,
    loadConfigurationByJob,
    loadTables,
    loadTableColumns,
    updateConfigField,
    updateControlSettings,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    validateConfiguration,
    previewControlFile,
    createConfiguration,
    updateConfiguration,
    testConfiguration
  } = useSQLLoaderConfiguration();

  // Load configuration on mount
  useEffect(() => {
    if (systemId && jobName) {
      loadConfigurationByJob(systemId, jobName);
      loadTables(systemId);
    }
  }, [systemId, jobName, loadConfigurationByJob, loadTables]);

  // Load table columns when table name changes
  useEffect(() => {
    if (config?.tableName && systemId) {
      loadTableColumns(systemId, config.tableName);
    }
  }, [config?.tableName, systemId, loadTableColumns]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = async () => {
    if (!config) return;
    
    const isValid = await validateConfiguration();
    if (!isValid) {
      alert('Please fix validation errors before saving.');
      return;
    }

    try {
      if (config.id) {
        await updateConfiguration(config.id, config);
      } else {
        await createConfiguration(config);
      }
      alert('Configuration saved successfully!');
    } catch (err) {
      alert('Failed to save configuration. Please try again.');
    }
  };

  const handleTest = async () => {
    if (!config) return;
    
    try {
      const result = await testConfiguration();
      alert(`Test completed: ${result.success ? 'Success' : 'Failed'}\nRecords processed: ${result.recordsLoaded || 0}`);
    } catch (err) {
      alert('Test failed. Please check your configuration.');
    }
  };

  const handlePreview = async () => {
    if (!config) return;
    
    try {
      const preview = await previewControlFile();
      setControlFilePreview(preview);
      setShowPreview(true);
    } catch (err) {
      alert('Failed to generate preview. Please check your configuration.');
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    reorderColumns(result.source.index, result.destination.index);
  };

  const handleAddColumn = () => {
    setEditingColumn({
      columnName: '',
      dataType: 'VARCHAR2',
      nullable: true,
      position: (config?.columns.length || 0) + 1
    });
    setShowColumnDialog(true);
  };

  const handleEditColumn = (column: SQLLoaderColumn) => {
    setEditingColumn({ ...column });
    setShowColumnDialog(true);
  };

  const handleSaveColumn = () => {
    if (!editingColumn) return;

    if (editingColumn.id) {
      updateColumn(editingColumn.id, editingColumn);
    } else {
      addColumn(editingColumn);
    }
    
    setShowColumnDialog(false);
    setEditingColumn(null);
  };

  const getValidationIcon = () => {
    if (!validationResult) return null;
    
    if (validationResult.errors.length > 0) {
      return <ErrorIcon color="error" />;
    } else if (validationResult.warnings.length > 0) {
      return <Warning color="warning" />;
    } else {
      return <CheckCircle color="success" />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          No SQL*Loader configuration found. A new configuration will be created when you save.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5">
              SQL*Loader Configuration: {config.jobName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source System: {config.sourceSystemId} | Table: {config.tableName || 'Not set'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {getValidationIcon()}
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={handlePreview}
              disabled={!config.tableName || config.columns.length === 0}
            >
              Preview
            </Button>
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={handleTest}
              disabled={!config.tableName || config.columns.length === 0}
            >
              Test
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!isDirty}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Validation Errors */}
      {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
        <Paper sx={{ p: 2, mb: 2 }}>
          {validationResult.errors.map((error, index) => (
            <Alert key={`error-${index}`} severity="error" sx={{ mb: 1 }}>
              {error.field}: {error.message}
            </Alert>
          ))}
          {validationResult.warnings.map((warning, index) => (
            <Alert key={`warning-${index}`} severity="warning" sx={{ mb: 1 }}>
              {warning.field}: {warning.message}
            </Alert>
          ))}
        </Paper>
      )}

      {/* Main Content */}
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<Settings />} label="Basic Settings" />
          <Tab icon={<TableChart />} label="Column Mapping" />
          <Tab icon={<Code />} label="Control Options" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {/* Basic Settings */}
          <Grid container spacing={3} sx={{ p: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Name"
                value={config.jobName}
                onChange={(e) => updateConfigField('jobName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Target Table</InputLabel>
                <Select
                  value={config.tableName}
                  onChange={(e) => updateConfigField('tableName', e.target.value)}
                  label="Target Table"
                >
                  {availableTables.map((table) => (
                    <MenuItem key={table} value={table}>
                      {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={config.description || ''}
                onChange={(e) => updateConfigField('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Input File Pattern"
                value={config.inputFilePattern || ''}
                onChange={(e) => updateConfigField('inputFilePattern', e.target.value)}
                helperText="e.g., *.csv or data_*.txt"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enabled}
                    onChange={(e) => updateConfigField('enabled', e.target.checked)}
                  />
                }
                label="Configuration Enabled"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Column Mapping */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Column Mapping</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddColumn}
              >
                Add Column
              </Button>
            </Box>

            {config.columns.length === 0 ? (
              <Alert severity="info">
                No columns configured. Add columns to define your data mapping.
              </Alert>
            ) : (
              <TableContainer>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="columns">
                    {(provided) => (
                      <Table ref={provided.innerRef} {...provided.droppableProps}>
                        <TableHead>
                          <TableRow>
                            <TableCell width={50}>#</TableCell>
                            <TableCell>Column Name</TableCell>
                            <TableCell>Data Type</TableCell>
                            <TableCell>Length</TableCell>
                            <TableCell>Nullable</TableCell>
                            <TableCell>Default Value</TableCell>
                            <TableCell width={100}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {config.columns.map((column, index) => (
                            <Draggable
                              key={column.id || index}
                              draggableId={column.id || index.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <TableRow
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{column.columnName}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={column.dataType}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>{column.maxLength || 'N/A'}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={column.nullable ? 'Yes' : 'No'}
                                      size="small"
                                      color={column.nullable ? 'default' : 'secondary'}
                                    />
                                  </TableCell>
                                  <TableCell>{column.defaultValue || '-'}</TableCell>
                                  <TableCell>
                                    <Tooltip title="Edit Column">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditColumn(column)}
                                      >
                                        <Settings />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Column">
                                      <IconButton
                                        size="small"
                                        onClick={() => column.id && deleteColumn(column.id)}
                                      >
                                        <Delete />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </TableBody>
                      </Table>
                    )}
                  </Droppable>
                </DragDropContext>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Control Options */}
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
              {/* Load Options */}
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Load Options</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.control.load?.replace || false}
                              onChange={(e) => updateControlSettings({
                                load: { ...config.control.load, replace: e.target.checked, append: false, truncate: false }
                              })}
                            />
                          }
                          label="Replace Data"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.control.load?.append || false}
                              onChange={(e) => updateControlSettings({
                                load: { ...config.control.load, append: e.target.checked, replace: false, truncate: false }
                              })}
                            />
                          }
                          label="Append Data"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.control.load?.truncate || false}
                              onChange={(e) => updateControlSettings({
                                load: { ...config.control.load, truncate: e.target.checked, replace: false, append: false }
                              })}
                            />
                          }
                          label="Truncate Table"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Field Options */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Field Options</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Terminated By"
                          value={config.control.fields?.terminatedBy || ''}
                          onChange={(e) => updateControlSettings({
                            fields: { ...config.control.fields, terminatedBy: e.target.value }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Enclosed By"
                          value={config.control.fields?.enclosedBy || ''}
                          onChange={(e) => updateControlSettings({
                            fields: { ...config.control.fields, enclosedBy: e.target.value }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Optionally Enclosed By"
                          value={config.control.fields?.optionallyEnclosedBy || ''}
                          onChange={(e) => updateControlSettings({
                            fields: { ...config.control.fields, optionallyEnclosedBy: e.target.value }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.control.fields?.trailingNullCols || false}
                              onChange={(e) => updateControlSettings({
                                fields: { ...config.control.fields, trailingNullCols: e.target.checked }
                              })}
                            />
                          }
                          label="Trailing Null Columns"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Performance Options */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Performance Options</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Skip Rows"
                          type="number"
                          value={config.control.options?.skip || 0}
                          onChange={(e) => updateControlSettings({
                            options: { ...config.control.options, skip: parseInt(e.target.value) || 0 }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Max Errors"
                          type="number"
                          value={config.control.options?.errors || 0}
                          onChange={(e) => updateControlSettings({
                            options: { ...config.control.options, errors: parseInt(e.target.value) || 0 }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Rows to Load"
                          type="number"
                          value={config.control.options?.rows || ''}
                          onChange={(e) => updateControlSettings({
                            options: { ...config.control.options, rows: parseInt(e.target.value) || undefined }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.control.options?.direct || false}
                              onChange={(e) => updateControlSettings({
                                options: { ...config.control.options, direct: e.target.checked }
                              })}
                            />
                          }
                          label="Direct Path"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Column Edit Dialog */}
      <Dialog open={showColumnDialog} onClose={() => setShowColumnDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingColumn?.id ? 'Edit Column' : 'Add Column'}
        </DialogTitle>
        <DialogContent>
          {editingColumn && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Column Name"
                  value={editingColumn.columnName}
                  onChange={(e) => setEditingColumn({ ...editingColumn, columnName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    value={editingColumn.dataType}
                    onChange={(e) => setEditingColumn({ ...editingColumn, dataType: e.target.value })}
                    label="Data Type"
                  >
                    <MenuItem value="VARCHAR2">VARCHAR2</MenuItem>
                    <MenuItem value="NUMBER">NUMBER</MenuItem>
                    <MenuItem value="DATE">DATE</MenuItem>
                    <MenuItem value="TIMESTAMP">TIMESTAMP</MenuItem>
                    <MenuItem value="CHAR">CHAR</MenuItem>
                    <MenuItem value="CLOB">CLOB</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Length"
                  type="number"
                  value={editingColumn.maxLength || ''}
                  onChange={(e) => setEditingColumn({ 
                    ...editingColumn, 
                    maxLength: parseInt(e.target.value) || undefined 
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingColumn.nullable}
                      onChange={(e) => setEditingColumn({ ...editingColumn, nullable: e.target.checked })}
                    />
                  }
                  label="Nullable"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Value"
                  value={editingColumn.defaultValue || ''}
                  onChange={(e) => setEditingColumn({ ...editingColumn, defaultValue: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={editingColumn.description || ''}
                  onChange={(e) => setEditingColumn({ ...editingColumn, description: e.target.value })}
                />
              </Grid>
              {editingColumn.dataType === 'DATE' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date Format"
                    value={editingColumn.dateFormat || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, dateFormat: e.target.value })}
                    placeholder="e.g., DD/MM/YYYY"
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowColumnDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveColumn} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Control File Preview</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              backgroundColor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '500px'
            }}
          >
            {controlFilePreview}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SQLLoaderConfigurationPage;