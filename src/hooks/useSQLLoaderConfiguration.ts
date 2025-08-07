// Custom hook for SQL*Loader configuration management
import { useState, useCallback, useEffect } from 'react';
import {
  SQLLoaderConfig,
  SQLLoaderColumn,
  SQLLoaderValidationResult,
  SQLLoaderExecutionResult,
  SQLLoaderState
} from '../types/configuration';
import { sqlLoaderApi, sqlLoaderUtils } from '../services/api/sqlLoaderApi';

export interface UseSQLLoaderConfigurationReturn {
  // State
  config: SQLLoaderConfig | null;
  configurations: SQLLoaderConfig[];
  tableColumns: SQLLoaderColumn[];
  availableTables: string[];
  validationResult: SQLLoaderValidationResult | null;
  executionHistory: SQLLoaderExecutionResult[];
  isLoading: boolean;
  isDirty: boolean;
  error: string | null;

  // Configuration Management
  loadConfiguration: (configId: string) => Promise<void>;
  loadConfigurationByJob: (sourceSystemId: string, jobName: string) => Promise<void>;
  loadConfigurations: (sourceSystemId?: string) => Promise<void>;
  createConfiguration: (config: Omit<SQLLoaderConfig, 'id'>) => Promise<boolean>;
  updateConfiguration: (configId: string, updates: Partial<SQLLoaderConfig>) => Promise<boolean>;
  deleteConfiguration: (configId: string) => Promise<boolean>;
  resetConfiguration: () => void;

  // Table and Column Management
  loadTables: (sourceSystemId: string) => Promise<void>;
  loadTableColumns: (sourceSystemId: string, tableName: string) => Promise<void>;
  addColumn: (column: Omit<SQLLoaderColumn, 'id'>) => void;
  updateColumn: (columnId: string, updates: Partial<SQLLoaderColumn>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;

  // Configuration Updates
  updateConfigField: <K extends keyof SQLLoaderConfig>(field: K, value: SQLLoaderConfig[K]) => void;
  updateControlSettings: (controlUpdates: Partial<SQLLoaderConfig['control']>) => void;

  // Validation and Testing
  validateConfiguration: () => Promise<boolean>;
  generateControlFile: () => Promise<string>;
  previewControlFile: () => Promise<string>;
  testConfiguration: (sampleData?: string) => Promise<SQLLoaderExecutionResult>;
  executeConfiguration: (inputFile?: string) => Promise<SQLLoaderExecutionResult>;

  // History and Status
  loadExecutionHistory: (configId: string, limit?: number) => Promise<void>;
  getConfigurationStatus: (configId: string) => Promise<{ status: string; lastExecution?: string }>;

  // Import/Export
  exportConfiguration: (configId: string) => Promise<string>;
  importConfiguration: (importData: string) => Promise<boolean>;

  // Utilities
  hasUnsavedChanges: () => boolean;
  getValidationErrors: () => string[];
}

export const useSQLLoaderConfiguration = (
  initialSourceSystemId?: string,
  initialJobName?: string
): UseSQLLoaderConfigurationReturn => {
  const [state, setState] = useState<SQLLoaderState>({
    currentConfig: null,
    availableConfigs: [],
    tableColumns: [],
    validationResult: null,
    isLoading: false,
    isDirty: false,
    error: null
  });

  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [executionHistory, setExecutionHistory] = useState<SQLLoaderExecutionResult[]>([]);
  const [originalConfig, setOriginalConfig] = useState<SQLLoaderConfig | null>(null);

  // Error handling helper
  const handleError = useCallback((error: any, defaultMessage: string) => {
    const errorMessage = sqlLoaderUtils.formatError(error);
    setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    console.error(defaultMessage, error);
  }, []);

  // Configuration Management
  const loadConfiguration = useCallback(async (configId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const config = await sqlLoaderApi.getConfiguration(configId);
      setState(prev => ({ 
        ...prev, 
        currentConfig: config, 
        isLoading: false, 
        isDirty: false 
      }));
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
    } catch (error) {
      handleError(error, 'Failed to load SQL*Loader configuration');
    }
  }, [handleError]);

  const loadConfigurationByJob = useCallback(async (sourceSystemId: string, jobName: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const config = await sqlLoaderApi.getConfigurationByJob(sourceSystemId, jobName);
      setState(prev => ({ 
        ...prev, 
        currentConfig: config, 
        isLoading: false, 
        isDirty: false 
      }));
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
    } catch (error) {
      // If configuration doesn't exist, create a default one
      const errorMessage = (error as Error)?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        const defaultConfig: Omit<SQLLoaderConfig, 'id'> = {
          sourceSystemId,
          jobName,
          tableName: '',
          description: `SQL*Loader configuration for ${jobName}`,
          control: {
            load: {
              replace: true
            },
            options: {
              errors: 0,
              skip: 0
            },
            fields: {
              terminatedBy: ',',
              optionallyEnclosedBy: '"',
              trailingNullCols: true
            }
          },
          columns: [],
          enabled: true
        };
        
        setState(prev => ({ 
          ...prev, 
          currentConfig: defaultConfig as SQLLoaderConfig, 
          isLoading: false, 
          isDirty: true 
        }));
        setOriginalConfig(null);
      } else {
        handleError(error as Error, 'Failed to load SQL*Loader configuration by job');
      }
    }
  }, [handleError]);

  const loadConfigurations = useCallback(async (sourceSystemId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const configs = await sqlLoaderApi.getConfigurations(sourceSystemId);
      setState(prev => ({ 
        ...prev, 
        availableConfigs: configs, 
        isLoading: false 
      }));
    } catch (error) {
      handleError(error, 'Failed to load SQL*Loader configurations');
    }
  }, [handleError]);

  const createConfiguration = useCallback(async (config: Omit<SQLLoaderConfig, 'id'>): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sqlLoaderApi.createConfiguration(config);
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          currentConfig: response.data!, 
          availableConfigs: [...prev.availableConfigs, response.data!],
          isLoading: false, 
          isDirty: false 
        }));
        setOriginalConfig(JSON.parse(JSON.stringify(response.data)));
        return true;
      }
      return false;
    } catch (error) {
      handleError(error, 'Failed to create SQL*Loader configuration');
      return false;
    }
  }, [handleError]);

  const updateConfiguration = useCallback(async (configId: string, updates: Partial<SQLLoaderConfig>): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sqlLoaderApi.updateConfiguration(configId, updates);
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          currentConfig: response.data!, 
          availableConfigs: prev.availableConfigs.map(c => 
            c.id === configId ? response.data! : c
          ),
          isLoading: false, 
          isDirty: false 
        }));
        setOriginalConfig(JSON.parse(JSON.stringify(response.data)));
        return true;
      }
      return false;
    } catch (error) {
      handleError(error, 'Failed to update SQL*Loader configuration');
      return false;
    }
  }, [handleError]);

  const deleteConfiguration = useCallback(async (configId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sqlLoaderApi.deleteConfiguration(configId);
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          currentConfig: prev.currentConfig?.id === configId ? null : prev.currentConfig,
          availableConfigs: prev.availableConfigs.filter(c => c.id !== configId),
          isLoading: false, 
          isDirty: false 
        }));
        if (state.currentConfig?.id === configId) {
          setOriginalConfig(null);
        }
        return true;
      }
      return false;
    } catch (error) {
      handleError(error, 'Failed to delete SQL*Loader configuration');
      return false;
    }
  }, [handleError, state.currentConfig?.id]);

  const resetConfiguration = useCallback(() => {
    if (originalConfig) {
      setState(prev => ({ 
        ...prev, 
        currentConfig: JSON.parse(JSON.stringify(originalConfig)), 
        isDirty: false,
        error: null
      }));
    }
  }, [originalConfig]);

  // Table and Column Management
  const loadTables = useCallback(async (sourceSystemId: string) => {
    try {
      const tables = await sqlLoaderApi.getTables(sourceSystemId);
      setAvailableTables(tables);
    } catch (error) {
      handleError(error, 'Failed to load available tables');
    }
  }, [handleError]);

  const loadTableColumns = useCallback(async (sourceSystemId: string, tableName: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const columns = await sqlLoaderApi.getTableColumns(sourceSystemId, tableName);
      setState(prev => ({ 
        ...prev, 
        tableColumns: columns, 
        isLoading: false 
      }));
    } catch (error) {
      handleError(error, 'Failed to load table columns');
    }
  }, [handleError]);

  // Column Management
  const addColumn = useCallback((column: Omit<SQLLoaderColumn, 'id'>) => {
    if (!state.currentConfig) return;

    const newColumn: SQLLoaderColumn = {
      ...column,
      id: `column_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: state.currentConfig.columns.length + 1
    };

    setState(prev => {
      if (!prev.currentConfig) return prev;
      return {
        ...prev,
        currentConfig: {
          ...prev.currentConfig,
          columns: [...prev.currentConfig.columns, newColumn]
        },
        isDirty: true
      };
    });
  }, [state.currentConfig]);

  const updateColumn = useCallback((columnId: string, updates: Partial<SQLLoaderColumn>) => {
    if (!state.currentConfig) return;

    setState(prev => {
      if (!prev.currentConfig) return prev;
      return {
        ...prev,
        currentConfig: {
          ...prev.currentConfig,
          columns: prev.currentConfig.columns.map(col =>
            col.id === columnId ? { ...col, ...updates } : col
          )
        },
        isDirty: true
      };
    });
  }, [state.currentConfig]);

  const deleteColumn = useCallback((columnId: string) => {
    if (!state.currentConfig) return;

    setState(prev => {
      if (!prev.currentConfig) return prev;
      return {
        ...prev,
        currentConfig: {
          ...prev.currentConfig,
          columns: prev.currentConfig.columns.filter(col => col.id !== columnId)
        },
        isDirty: true
      };
    });
  }, [state.currentConfig]);

  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    if (!state.currentConfig) return;

    setState(prev => {
      if (!prev.currentConfig) return prev;
      
      const newColumns = [...prev.currentConfig.columns];
      const [movedColumn] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, movedColumn);

      // Update positions
      newColumns.forEach((col, index) => {
        col.position = index + 1;
      });

      return {
        ...prev,
        currentConfig: {
          ...prev.currentConfig,
          columns: newColumns
        },
        isDirty: true
      };
    });
  }, [state.currentConfig]);

  // Configuration Updates
  const updateConfigField = useCallback(<K extends keyof SQLLoaderConfig>(
    field: K, 
    value: SQLLoaderConfig[K]
  ) => {
    if (!state.currentConfig) return;

    setState(prev => {
      if (!prev.currentConfig) return prev;
      return {
        ...prev,
        currentConfig: {
          ...prev.currentConfig,
          [field]: value
        },
        isDirty: true
      };
    });
  }, [state.currentConfig]);

  const updateControlSettings = useCallback((controlUpdates: Partial<SQLLoaderConfig['control']>) => {
    if (!state.currentConfig) return;

    setState(prev => {
      if (!prev.currentConfig) return prev;
      return {
        ...prev,
        currentConfig: {
          ...prev.currentConfig,
          control: {
            ...prev.currentConfig.control,
            ...controlUpdates
          }
        },
        isDirty: true
      };
    });
  }, [state.currentConfig]);

  // Validation and Testing
  const validateConfiguration = useCallback(async (): Promise<boolean> => {
    if (!state.currentConfig) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const validationResult = await sqlLoaderApi.validateConfiguration(state.currentConfig);
      setState(prev => ({ 
        ...prev, 
        validationResult, 
        isLoading: false 
      }));
      return validationResult.isValid;
    } catch (error) {
      handleError(error, 'Failed to validate SQL*Loader configuration');
      return false;
    }
  }, [state.currentConfig, handleError]);

  const generateControlFile = useCallback(async (): Promise<string> => {
    if (!state.currentConfig) throw new Error('No configuration available');

    try {
      const response = await sqlLoaderApi.generateControlFile(state.currentConfig);
      return response.controlFile;
    } catch (error) {
      handleError(error, 'Failed to generate control file');
      throw error;
    }
  }, [state.currentConfig, handleError]);

  const previewControlFile = useCallback(async (): Promise<string> => {
    if (!state.currentConfig) throw new Error('No configuration available');

    try {
      const response = await sqlLoaderApi.previewControlFile(state.currentConfig);
      return response.preview;
    } catch (error) {
      handleError(error, 'Failed to preview control file');
      throw error;
    }
  }, [state.currentConfig, handleError]);

  const testConfiguration = useCallback(async (sampleData?: string): Promise<SQLLoaderExecutionResult> => {
    if (!state.currentConfig) throw new Error('No configuration available');

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await sqlLoaderApi.testConfiguration(state.currentConfig, sampleData);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      handleError(error, 'Failed to test SQL*Loader configuration');
      throw error;
    }
  }, [state.currentConfig, handleError]);

  const executeConfiguration = useCallback(async (inputFile?: string): Promise<SQLLoaderExecutionResult> => {
    if (!state.currentConfig?.id) throw new Error('No configuration available');

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await sqlLoaderApi.executeConfiguration(state.currentConfig.id, inputFile);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      handleError(error, 'Failed to execute SQL*Loader configuration');
      throw error;
    }
  }, [state.currentConfig, handleError]);

  // History and Status
  const loadExecutionHistory = useCallback(async (configId: string, limit?: number) => {
    try {
      const history = await sqlLoaderApi.getExecutionHistory(configId, limit);
      setExecutionHistory(history);
    } catch (error) {
      handleError(error, 'Failed to load execution history');
    }
  }, [handleError]);

  const getConfigurationStatus = useCallback(async (configId: string) => {
    try {
      return await sqlLoaderApi.getConfigurationStatus(configId);
    } catch (error) {
      handleError(error, 'Failed to get configuration status');
      throw error;
    }
  }, [handleError]);

  // Import/Export
  const exportConfiguration = useCallback(async (configId: string): Promise<string> => {
    try {
      const response = await sqlLoaderApi.exportConfiguration(configId);
      return response.exportData;
    } catch (error) {
      handleError(error, 'Failed to export configuration');
      throw error;
    }
  }, [handleError]);

  const importConfiguration = useCallback(async (importData: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sqlLoaderApi.importConfiguration(importData);
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          currentConfig: response.data!, 
          availableConfigs: [...prev.availableConfigs, response.data!],
          isLoading: false, 
          isDirty: false 
        }));
        setOriginalConfig(JSON.parse(JSON.stringify(response.data)));
        return true;
      }
      return false;
    } catch (error) {
      handleError(error, 'Failed to import configuration');
      return false;
    }
  }, [handleError]);

  // Utilities
  const hasUnsavedChanges = useCallback((): boolean => {
    return state.isDirty;
  }, [state.isDirty]);

  const getValidationErrors = useCallback((): string[] => {
    if (!state.currentConfig) return ['No configuration loaded'];
    return sqlLoaderUtils.validateConfigurationData(state.currentConfig);
  }, [state.currentConfig]);

  // Load initial configuration
  useEffect(() => {
    if (initialSourceSystemId && initialJobName) {
      loadConfigurationByJob(initialSourceSystemId, initialJobName);
    }
  }, [initialSourceSystemId, initialJobName, loadConfigurationByJob]);

  return {
    // State
    config: state.currentConfig,
    configurations: state.availableConfigs,
    tableColumns: state.tableColumns,
    availableTables,
    validationResult: state.validationResult,
    executionHistory,
    isLoading: state.isLoading,
    isDirty: state.isDirty,
    error: state.error,

    // Configuration Management
    loadConfiguration,
    loadConfigurationByJob,
    loadConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    resetConfiguration,

    // Table and Column Management
    loadTables,
    loadTableColumns,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,

    // Configuration Updates
    updateConfigField,
    updateControlSettings,

    // Validation and Testing
    validateConfiguration,
    generateControlFile,
    previewControlFile,
    testConfiguration,
    executeConfiguration,

    // History and Status
    loadExecutionHistory,
    getConfigurationStatus,

    // Import/Export
    exportConfiguration,
    importConfiguration,

    // Utilities
    hasUnsavedChanges,
    getValidationErrors
  };
};