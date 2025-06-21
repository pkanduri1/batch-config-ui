// src/components/configuration/ConditionalBuilder/ConditionalBuilder.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Divider,
  Alert,
  Tooltip,
  Stack,
  Switch,
  FormControlLabel,
  SelectChangeEvent,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  PlayArrow,
  Code,
  Functions,
  MoreVert,
  DragIndicator,
  ContentCopy,
  Edit,
  Visibility
} from '@mui/icons-material';
import { Condition, SourceField } from '../../../types/configuration';
import { useConfigurationContext, useSourceSystemsState } from '../../../contexts/ConfigurationContext';

interface ConditionalBuilderProps {
  condition?: Condition;
  sourceFields?: SourceField[];
  onConditionChange?: (condition: Condition) => void;
  onValidate?: (condition: Condition) => Promise<boolean>;
  readOnly?: boolean;
  maxDepth?: number;
  currentDepth?: number;
}

interface TestCase {
  name: string;
  inputs: Record<string, any>;
  expectedOutput: string;
}

const ConditionalBuilder: React.FC<ConditionalBuilderProps> = ({
  condition,
  sourceFields = [],
  onConditionChange,
  onValidate,
  readOnly = false,
  maxDepth = 5,
  currentDepth = 0
}) => {
  const [localCondition, setLocalCondition] = useState<Condition>(() => {
    if (condition) {
      return condition;
    }
    // Initialize with a proper empty condition
    const initialCondition: Condition = {
      ifExpr: '',
      then: '',
      elseExpr: '',
      elseIfExprs: []
    };
    // Immediately notify parent of initial state
    setTimeout(() => onConditionChange?.(initialCondition), 0);
    return initialCondition;
  });
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { sourceFields: contextFields } = useSourceSystemsState();
  const availableFields = sourceFields.length > 0 ? sourceFields : contextFields;

  // Common operators and functions for expressions
  const operators = ['==', '!=', '>', '<', '>=', '<=', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'IS_EMPTY', 'IS_NOT_EMPTY'];
  const functions = ['UPPER', 'LOWER', 'TRIM', 'LENGTH', 'SUBSTRING', 'CONCAT', 'TO_NUMBER', 'TO_DATE'];

  useEffect(() => {
    if (condition) {
      setLocalCondition(condition);
    }
  }, [condition]);

  const handleConditionUpdate = (updatedCondition: Condition) => {
    setLocalCondition(updatedCondition);
    onConditionChange?.(updatedCondition);
  };

  const handleExpressionChange = (field: keyof Condition, value: string) => {
    const updated = { ...localCondition, [field]: value };
    handleConditionUpdate(updated);
    validateExpression(field, value);
  };

  const validateExpression = async (field: keyof Condition, value: string) => {
    try {
      // Basic validation
      if (!value.trim()) {
        setErrors(prev => ({ ...prev, [field]: '' }));
        return;
      }

      // Check for balanced parentheses
      const openParens = (value.match(/\(/g) || []).length;
      const closeParens = (value.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        setErrors(prev => ({ ...prev, [field]: 'Unbalanced parentheses' }));
        return;
      }

      // Check for valid field references
      const fieldReferences = value.match(/\{[^}]+\}/g) || [];
      for (const ref of fieldReferences) {
        const fieldName = ref.slice(1, -1);
        if (!availableFields.find(f => f.name === fieldName)) {
          setErrors(prev => ({ ...prev, [field]: `Unknown field: ${fieldName}` }));
          return;
        }
      }

      // Call external validation if provided
      if (onValidate) {
        const isValid = await onValidate({ ...localCondition, [field]: value });
        if (!isValid) {
          setErrors(prev => ({ ...prev, [field]: 'Invalid expression' }));
          return;
        }
      }

      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [field]: 'Validation error' }));
    }
  };

  const addElseIf = () => {
    const newElseIf: Condition = { ifExpr: '', then: '' };
    const updated = {
      ...localCondition,
      elseIfExprs: [...(localCondition.elseIfExprs || []), newElseIf]
    };
    handleConditionUpdate(updated);
  };

  const updateElseIf = (index: number, elseIfCondition: Condition) => {
    const updated = {
      ...localCondition,
      elseIfExprs: localCondition.elseIfExprs?.map((item, i) => 
        i === index ? elseIfCondition : item
      ) || []
    };
    handleConditionUpdate(updated);
  };

  const removeElseIf = (index: number) => {
    const updated = {
      ...localCondition,
      elseIfExprs: localCondition.elseIfExprs?.filter((_, i) => i !== index) || []
    };
    handleConditionUpdate(updated);
  };

  const insertFieldReference = (fieldName: string, targetField: keyof Condition) => {
    const currentValue = localCondition[targetField] as string || '';
    const newValue = currentValue + `{${fieldName}}`;
    handleExpressionChange(targetField, newValue);
  };

  const insertOperator = (operator: string, targetField: keyof Condition) => {
    const currentValue = localCondition[targetField] as string || '';
    const newValue = currentValue + ` ${operator} `;
    handleExpressionChange(targetField, newValue);
  };

  const insertFunction = (func: string, targetField: keyof Condition) => {
    const currentValue = localCondition[targetField] as string || '';
    const newValue = currentValue + `${func}()`;
    handleExpressionChange(targetField, newValue);
  };

  const runTestCase = async (testCase: TestCase) => {
    try {
      // Mock evaluation - in real implementation, this would call the backend
      const result = await mockEvaluateCondition(localCondition, testCase.inputs);
      setTestResults(prev => ({ ...prev, [testCase.name]: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testCase.name]: `Error: ${error}` }));
    }
  };

  const mockEvaluateCondition = async (condition: Condition, inputs: Record<string, any>): Promise<string> => {
    // Simple mock evaluation for demonstration
    // In production, this would be a proper expression evaluator
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(condition.then || 'default_value');
      }, 500);
    });
  };

  const addTestCase = () => {
    const newTestCase: TestCase = {
      name: `Test ${testCases.length + 1}`,
      inputs: {},
      expectedOutput: ''
    };
    setTestCases(prev => [...prev, newTestCase]);
  };

  const ExpressionBuilder = ({ 
    label, 
    value, 
    field, 
    multiline = false 
  }: { 
    label: string; 
    value: string; 
    field: keyof Condition; 
    multiline?: boolean;
  }) => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        <IconButton 
          size="small" 
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <MoreVert />
        </IconButton>
      </Box>
      
      <TextField
        fullWidth
        multiline={multiline}
        rows={multiline ? 3 : 1}
        value={value}
        onChange={(e) => handleExpressionChange(field, e.target.value)}
        error={!!errors[field]}
        helperText={errors[field] || 'Use {fieldName} for field references'}
        disabled={readOnly}
        sx={{ mb: 1 }}
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {availableFields.slice(0, 5).map((sourceField) => (
          <Chip
            key={sourceField.name}
            label={sourceField.name}
            size="small"
            variant="outlined"
            onClick={() => insertFieldReference(sourceField.name, field)}
            disabled={readOnly}
            sx={{ cursor: readOnly ? 'default' : 'pointer' }}
          />
        ))}
        <Chip
          label="More Fields..."
          size="small"
          variant="outlined"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={readOnly}
        />
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {availableFields.map((sourceField) => (
          <MenuItem 
            key={sourceField.name}
            onClick={() => {
              insertFieldReference(sourceField.name, field);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><Code /></ListItemIcon>
            <ListItemText 
              primary={sourceField.name}
              secondary={sourceField.dataType}
            />
          </MenuItem>
        ))}
        <Divider />
        {operators.map((op) => (
          <MenuItem 
            key={op}
            onClick={() => {
              insertOperator(op, field);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><Functions /></ListItemIcon>
            <ListItemText primary={op} />
          </MenuItem>
        ))}
        <Divider />
        {functions.map((func) => (
          <MenuItem 
            key={func}
            onClick={() => {
              insertFunction(func, field);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><Functions /></ListItemIcon>
            <ListItemText primary={func} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {currentDepth > 0 && <DragIndicator sx={{ mr: 1, color: 'text.secondary' }} />}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {currentDepth === 0 ? 'Conditional Logic' : `Nested Condition (Level ${currentDepth})`}
          </Typography>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>

        {/* Main IF condition */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">IF Condition</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ExpressionBuilder
              label="IF Expression"
              value={localCondition.ifExpr}
              field="ifExpr"
              multiline
            />
            
            <ExpressionBuilder
              label="THEN Value"
              value={localCondition.then || ''}
              field="then"
            />
          </AccordionDetails>
        </Accordion>

        {/* ELSE IF conditions */}
        {localCondition.elseIfExprs && localCondition.elseIfExprs.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                ELSE IF Conditions ({localCondition.elseIfExprs.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {localCondition.elseIfExprs.map((elseIf, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        ELSE IF #{index + 1}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => removeElseIf(index)}
                        disabled={readOnly}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    
                    {currentDepth < maxDepth ? (
                      <ConditionalBuilder
                        condition={elseIf}
                        sourceFields={sourceFields}
                        onConditionChange={(updated) => updateElseIf(index, updated)}
                        onValidate={onValidate}
                        readOnly={readOnly}
                        maxDepth={maxDepth}
                        currentDepth={currentDepth + 1}
                      />
                    ) : (
                      <Alert severity="warning">
                        Maximum nesting depth reached
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </AccordionDetails>
          </Accordion>
        )}

        {/* ELSE condition */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">ELSE (Default)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ExpressionBuilder
              label="ELSE Value"
              value={localCondition.elseExpr || ''}
              field="elseExpr"
            />
          </AccordionDetails>
        </Accordion>

        {/* Actions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            startIcon={<Add />}
            onClick={addElseIf}
            disabled={readOnly || currentDepth >= maxDepth}
            size="small"
          >
            Add ELSE IF
          </Button>
          
          <Button
            startIcon={<PlayArrow />}
            onClick={() => {/* Test logic */}}
            disabled={readOnly}
            size="small"
          >
            Test Condition
          </Button>

          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
                size="small"
              />
            }
            label="Advanced"
          />
        </Box>

        {/* Advanced Testing */}
        {showAdvanced && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Test Cases</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {testCases.map((testCase, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Test Name"
                          value={testCase.name}
                          onChange={(e) => {
                            const updated = [...testCases];
                            updated[index].name = e.target.value;
                            setTestCases(updated);
                          }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Expected Output"
                          value={testCase.expectedOutput}
                          onChange={(e) => {
                            const updated = [...testCases];
                            updated[index].expectedOutput = e.target.value;
                            setTestCases(updated);
                          }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={() => runTestCase(testCase)}
                          >
                            Run
                          </Button>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              const updated = testCases.filter((_, i) => i !== index);
                              setTestCases(updated);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        {testResults[testCase.name] && (
                          <Alert 
                            severity={
                              testResults[testCase.name] === testCase.expectedOutput 
                                ? 'success' 
                                : 'error'
                            }
                          >
                            Result: {testResults[testCase.name]}
                          </Alert>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                startIcon={<Add />}
                onClick={addTestCase}
                variant="outlined"
                size="small"
              >
                Add Test Case
              </Button>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default ConditionalBuilder;