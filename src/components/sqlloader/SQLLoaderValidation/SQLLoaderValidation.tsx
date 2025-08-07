// SQL*Loader Configuration Validation Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh,
  BugReport,
  ExpandMore
} from '@mui/icons-material';
import {
  SQLLoaderConfig,
  SQLLoaderValidationResult,
  SQLLoaderValidationError
} from '../../../types/configuration';
import { sqlLoaderUtils } from '../../../services/api/sqlLoaderApi';

interface SQLLoaderValidationProps {
  config: SQLLoaderConfig | null;
  validationResult: SQLLoaderValidationResult | null;
  isValidating: boolean;
  onValidate: () => Promise<void>;
  onShowDetails?: (error: SQLLoaderValidationError) => void;
}

interface ValidationSummary {
  totalIssues: number;
  errors: number;
  warnings: number;
  passed: boolean;
}

const SQLLoaderValidation: React.FC<SQLLoaderValidationProps> = ({
  config,
  validationResult,
  isValidating,
  onValidate,
  onShowDetails
}) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedError, setSelectedError] = useState<SQLLoaderValidationError | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);

  // Calculate validation summary
  useEffect(() => {
    if (validationResult) {
      const summary: ValidationSummary = {
        totalIssues: validationResult.errors.length + validationResult.warnings.length,
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        passed: validationResult.isValid
      };
      setValidationSummary(summary);
    } else {
      setValidationSummary(null);
    }
  }, [validationResult]);

  const handleShowDetails = (error: SQLLoaderValidationError) => {
    setSelectedError(error);
    setShowDetailsDialog(true);
    if (onShowDetails) {
      onShowDetails(error);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsDialog(false);
    setSelectedError(null);
  };

  const getValidationIcon = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getValidationColor = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Basic validation checks
  const getBasicValidationErrors = (): string[] => {
    if (!config) return ['No configuration loaded'];
    return sqlLoaderUtils.validateConfigurationData(config);
  };

  const basicErrors = getBasicValidationErrors();
  const hasBasicErrors = basicErrors.length > 0;

  if (!config) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="info">
            No configuration loaded. Load a configuration to see validation results.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Validation Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReport />
              Validation Results
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onValidate}
              disabled={isValidating || hasBasicErrors}
            >
              Validate
            </Button>
          </Box>

          {isValidating && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Validating configuration...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Validation Summary */}
          {validationSummary && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  {validationSummary.passed ? (
                    <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                  )}
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {validationSummary.passed ? 'Valid' : 'Invalid'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {validationSummary.errors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Errors
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {validationSummary.warnings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Warnings
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.primary">
                    {validationSummary.totalIssues}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Issues
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Basic Validation Errors */}
      {hasBasicErrors && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              Basic validation failed. Please fix these issues before running detailed validation.
            </Alert>
            <List>
              {basicErrors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Detailed Validation Results */}
      {validationResult && !hasBasicErrors && (
        <Box>
          {/* Success Message */}
          {validationResult.isValid && validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Configuration validation passed! Your SQL*Loader configuration is ready to use.
            </Alert>
          )}

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" color="error">
                  Errors ({validationResult.errors.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {validationResult.errors.map((error, index) => (
                    <ListItem key={`error-${index}`} divider>
                      <ListItemIcon>
                        {getValidationIcon(error.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{error.message}</Typography>
                            <Chip
                              label={error.field}
                              size="small"
                              color={getValidationColor(error.severity)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={error.code && `Error Code: ${error.code}`}
                      />
                      <Button
                        size="small"
                        onClick={() => handleShowDetails(error)}
                      >
                        Details
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" color="warning.main">
                  Warnings ({validationResult.warnings.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {validationResult.warnings.map((warning, index) => (
                    <ListItem key={`warning-${index}`} divider>
                      <ListItemIcon>
                        {getValidationIcon(warning.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">{warning.message}</Typography>
                            <Chip
                              label={warning.field}
                              size="small"
                              color={getValidationColor(warning.severity)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={warning.code && `Warning Code: ${warning.code}`}
                      />
                      <Button
                        size="small"
                        onClick={() => handleShowDetails(warning)}
                      >
                        Details
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Control File Preview */}
          {validationResult.controlFilePreview && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Generated Control File Preview</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}
                >
                  {validationResult.controlFilePreview}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}

      {/* Validation Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedError && getValidationIcon(selectedError.severity)}
            Validation Issue Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Field
                  </Typography>
                  <Typography variant="body1">{selectedError.field}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Severity
                  </Typography>
                  <Chip
                    label={selectedError.severity}
                    color={getValidationColor(selectedError.severity)}
                    size="small"
                  />
                </Grid>
                {selectedError.code && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Error Code
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedError.code}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Message
                  </Typography>
                  <Typography variant="body1">{selectedError.message}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Suggested Solutions */}
              <Typography variant="h6" gutterBottom>
                Suggested Solutions
              </Typography>
              <List>
                {getSuggestedSolutions(selectedError).map((solution, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary={solution} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function to get suggested solutions based on error
const getSuggestedSolutions = (error: SQLLoaderValidationError): string[] => {
  const solutions: string[] = [];

  switch (error.code) {
    case 'MISSING_COLUMN_NAME':
      solutions.push('Provide a valid column name for the field.');
      solutions.push('Column names must not be empty and should follow Oracle naming conventions.');
      break;
    case 'INVALID_DATA_TYPE':
      solutions.push('Select a valid Oracle data type (VARCHAR2, NUMBER, DATE, etc.).');
      solutions.push('Ensure the data type is supported by your Oracle database version.');
      break;
    case 'MISSING_TABLE_NAME':
      solutions.push('Select a target table from the available tables.');
      solutions.push('Ensure the table exists in the target database schema.');
      break;
    case 'DUPLICATE_COLUMN':
      solutions.push('Remove duplicate column mappings.');
      solutions.push('Each column should only be mapped once in the configuration.');
      break;
    case 'INVALID_FIELD_TERMINATOR':
      solutions.push('Provide a valid field terminator character.');
      solutions.push('Common terminators include comma (,), tab (\\t), or pipe (|).');
      break;
    default:
      solutions.push('Review the configuration field mentioned in the error.');
      solutions.push('Check the SQL*Loader documentation for detailed requirements.');
      solutions.push('Contact support if the issue persists.');
      break;
  }

  return solutions;
};

export default SQLLoaderValidation;