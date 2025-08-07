// SQL*Loader API service
import axios from 'axios';
import {
  SQLLoaderConfig,
  SQLLoaderColumn,
  SQLLoaderValidationResult,
  SQLLoaderExecutionResult,
  ApiResponse
} from '../../types/configuration';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export const sqlLoaderApi = {
  // Configuration Management
  getConfigurations: async (sourceSystemId?: string): Promise<SQLLoaderConfig[]> => {
    try {
      const url = sourceSystemId 
        ? `${API_BASE_URL}/v1/sql-loader/configurations?sourceSystemId=${sourceSystemId}`
        : `${API_BASE_URL}/v1/sql-loader/configurations`;
      
      const response = await axios.get<SQLLoaderConfig[]>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch SQL*Loader configurations:', error);
      throw new Error('Failed to load SQL*Loader configurations');
    }
  },

  getConfiguration: async (configId: string): Promise<SQLLoaderConfig> => {
    try {
      const response = await axios.get<SQLLoaderConfig>(
        `${API_BASE_URL}/v1/sql-loader/configurations/${configId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch SQL*Loader configuration ${configId}:`, error);
      throw new Error(`Failed to load SQL*Loader configuration: ${configId}`);
    }
  },

  getConfigurationByJob: async (sourceSystemId: string, jobName: string): Promise<SQLLoaderConfig> => {
    try {
      const response = await axios.get<SQLLoaderConfig>(
        `${API_BASE_URL}/v1/sql-loader/configurations/by-job/${sourceSystemId}/${jobName}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch SQL*Loader configuration for ${sourceSystemId}.${jobName}:`, error);
      throw new Error(`Failed to load SQL*Loader configuration for ${sourceSystemId}.${jobName}`);
    }
  },

  createConfiguration: async (config: Omit<SQLLoaderConfig, 'id'>): Promise<ApiResponse<SQLLoaderConfig>> => {
    try {
      const response = await axios.post<ApiResponse<SQLLoaderConfig>>(
        `${API_BASE_URL}/v1/sql-loader/configurations`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create SQL*Loader configuration:', error);
      throw new Error('Failed to create SQL*Loader configuration');
    }
  },

  updateConfiguration: async (configId: string, config: Partial<SQLLoaderConfig>): Promise<ApiResponse<SQLLoaderConfig>> => {
    try {
      const response = await axios.put<ApiResponse<SQLLoaderConfig>>(
        `${API_BASE_URL}/v1/sql-loader/configurations/${configId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update SQL*Loader configuration ${configId}:`, error);
      throw new Error(`Failed to update SQL*Loader configuration: ${configId}`);
    }
  },

  deleteConfiguration: async (configId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${API_BASE_URL}/v1/sql-loader/configurations/${configId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to delete SQL*Loader configuration ${configId}:`, error);
      throw new Error(`Failed to delete SQL*Loader configuration: ${configId}`);
    }
  },

  // Table and Column Management
  getTableColumns: async (sourceSystemId: string, tableName: string): Promise<SQLLoaderColumn[]> => {
    try {
      const response = await axios.get<SQLLoaderColumn[]>(
        `${API_BASE_URL}/v1/sql-loader/tables/${sourceSystemId}/${tableName}/columns`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch columns for table ${tableName}:`, error);
      throw new Error(`Failed to load columns for table: ${tableName}`);
    }
  },

  getTables: async (sourceSystemId: string): Promise<string[]> => {
    try {
      const response = await axios.get<string[]>(
        `${API_BASE_URL}/v1/sql-loader/tables/${sourceSystemId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch tables for source system ${sourceSystemId}:`, error);
      throw new Error(`Failed to load tables for source system: ${sourceSystemId}`);
    }
  },

  // Validation
  validateConfiguration: async (config: SQLLoaderConfig): Promise<SQLLoaderValidationResult> => {
    try {
      const response = await axios.post<SQLLoaderValidationResult>(
        `${API_BASE_URL}/v1/sql-loader/configurations/validate`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Failed to validate SQL*Loader configuration:', error);
      throw new Error('Failed to validate SQL*Loader configuration');
    }
  },

  // Control File Generation
  generateControlFile: async (config: SQLLoaderConfig): Promise<{ controlFile: string }> => {
    try {
      const response = await axios.post<{ controlFile: string }>(
        `${API_BASE_URL}/v1/sql-loader/control-file/generate`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Failed to generate SQL*Loader control file:', error);
      throw new Error('Failed to generate SQL*Loader control file');
    }
  },

  previewControlFile: async (config: SQLLoaderConfig): Promise<{ preview: string }> => {
    try {
      const response = await axios.post<{ preview: string }>(
        `${API_BASE_URL}/v1/sql-loader/control-file/preview`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Failed to preview SQL*Loader control file:', error);
      throw new Error('Failed to preview SQL*Loader control file');
    }
  },

  // Execution and Testing
  executeConfiguration: async (configId: string, inputFile?: string): Promise<SQLLoaderExecutionResult> => {
    try {
      const response = await axios.post<SQLLoaderExecutionResult>(
        `${API_BASE_URL}/v1/sql-loader/configurations/${configId}/execute`,
        { inputFile }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to execute SQL*Loader configuration ${configId}:`, error);
      throw new Error(`Failed to execute SQL*Loader configuration: ${configId}`);
    }
  },

  testConfiguration: async (config: SQLLoaderConfig, sampleData?: string): Promise<SQLLoaderExecutionResult> => {
    try {
      const response = await axios.post<SQLLoaderExecutionResult>(
        `${API_BASE_URL}/v1/sql-loader/test`,
        {
          configuration: config,
          sampleData
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to test SQL*Loader configuration:', error);
      throw new Error('Failed to test SQL*Loader configuration');
    }
  },

  // Status and Monitoring
  getExecutionHistory: async (configId: string, limit?: number): Promise<SQLLoaderExecutionResult[]> => {
    try {
      const url = limit 
        ? `${API_BASE_URL}/v1/sql-loader/configurations/${configId}/history?limit=${limit}`
        : `${API_BASE_URL}/v1/sql-loader/configurations/${configId}/history`;
        
      const response = await axios.get<SQLLoaderExecutionResult[]>(url);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch execution history for configuration ${configId}:`, error);
      throw new Error(`Failed to load execution history for configuration: ${configId}`);
    }
  },

  getConfigurationStatus: async (configId: string): Promise<{ status: string; lastExecution?: string }> => {
    try {
      const response = await axios.get<{ status: string; lastExecution?: string }>(
        `${API_BASE_URL}/v1/sql-loader/configurations/${configId}/status`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch status for configuration ${configId}:`, error);
      throw new Error(`Failed to load status for configuration: ${configId}`);
    }
  },

  // Template and Import/Export
  exportConfiguration: async (configId: string): Promise<{ exportData: string }> => {
    try {
      const response = await axios.get<{ exportData: string }>(
        `${API_BASE_URL}/v1/sql-loader/configurations/${configId}/export`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to export SQL*Loader configuration ${configId}:`, error);
      throw new Error(`Failed to export SQL*Loader configuration: ${configId}`);
    }
  },

  importConfiguration: async (importData: string): Promise<ApiResponse<SQLLoaderConfig>> => {
    try {
      const response = await axios.post<ApiResponse<SQLLoaderConfig>>(
        `${API_BASE_URL}/v1/sql-loader/configurations/import`,
        { importData }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to import SQL*Loader configuration:', error);
      throw new Error('Failed to import SQL*Loader configuration');
    }
  }
};

// Utility functions for SQL*Loader API
export const sqlLoaderUtils = {
  formatError: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    return error.message || 'An unexpected error occurred';
  },

  validateConfigurationData: (config: SQLLoaderConfig): string[] => {
    const errors: string[] = [];

    if (!config.sourceSystemId) {
      errors.push('Source System ID is required');
    }

    if (!config.jobName) {
      errors.push('Job Name is required');
    }

    if (!config.tableName) {
      errors.push('Table Name is required');
    }

    if (!config.columns || config.columns.length === 0) {
      errors.push('At least one column must be defined');
    }

    config.columns?.forEach((column, index) => {
      if (!column.columnName) {
        errors.push(`Column ${index + 1}: Column name is required`);
      }
      if (!column.dataType) {
        errors.push(`Column ${index + 1}: Data type is required`);
      }
    });

    return errors;
  },

  generateDefaultControlFile: (config: SQLLoaderConfig): string => {
    const { tableName, columns, control } = config;
    
    let controlFile = `LOAD DATA\n`;
    
    if (control.load?.infile) {
      controlFile += `INFILE '${control.load.infile}'\n`;
    } else {
      controlFile += `INFILE *\n`;
    }

    if (control.load?.badfile) {
      controlFile += `BADFILE '${control.load.badfile}'\n`;
    }

    if (control.load?.discardfile) {
      controlFile += `DISCARDFILE '${control.load.discardfile}'\n`;
    }

    if (control.load?.replace) {
      controlFile += `REPLACE\n`;
    } else if (control.load?.append) {
      controlFile += `APPEND\n`;
    } else if (control.load?.truncate) {
      controlFile += `TRUNCATE\n`;
    }

    controlFile += `INTO TABLE ${tableName}\n`;

    // Field specification
    if (control.fields) {
      controlFile += `FIELDS`;
      
      if (control.fields.terminatedBy) {
        controlFile += ` TERMINATED BY '${control.fields.terminatedBy}'`;
      }
      
      if (control.fields.enclosedBy) {
        controlFile += ` ENCLOSED BY '${control.fields.enclosedBy}'`;
      }
      
      if (control.fields.optionallyEnclosedBy) {
        controlFile += ` OPTIONALLY ENCLOSED BY '${control.fields.optionallyEnclosedBy}'`;
      }
      
      controlFile += `\n`;
    }

    controlFile += `(\n`;

    // Column definitions
    columns.forEach((column, index) => {
      controlFile += `  ${column.columnName}`;
      
      if (column.position) {
        controlFile += ` POSITION(${column.position})`;
      }
      
      if (column.dataType === 'DATE' && column.dateFormat) {
        controlFile += ` DATE "${column.dateFormat}"`;
      }
      
      if (column.expression) {
        controlFile += ` "${column.expression}"`;
      }
      
      if (index < columns.length - 1) {
        controlFile += ',';
      }
      
      controlFile += `\n`;
    });

    controlFile += `)\n`;

    return controlFile;
  }
};