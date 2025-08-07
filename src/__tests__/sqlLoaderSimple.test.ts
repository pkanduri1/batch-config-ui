// Simple SQL*Loader component tests
import { sqlLoaderUtils } from '../services/api/sqlLoaderApi';
import { SQLLoaderConfig } from '../types/configuration';

describe('SQL*Loader Utils', () => {
  test('validates configuration correctly', () => {
    const validConfig: SQLLoaderConfig = {
      sourceSystemId: 'test-system',
      jobName: 'test-job',
      tableName: 'TEST_TABLE',
      control: {
        load: { replace: true },
        options: { errors: 0 },
        fields: { terminatedBy: ',' }
      },
      columns: [
        {
          columnName: 'ID',
          dataType: 'NUMBER',
          nullable: false
        }
      ],
      enabled: true
    };

    const errors = sqlLoaderUtils.validateConfigurationData(validConfig);
    expect(errors).toHaveLength(0);
  });

  test('detects missing required fields', () => {
    const invalidConfig: SQLLoaderConfig = {
      sourceSystemId: '',
      jobName: '',
      tableName: '',
      control: {
        load: { replace: true },
        options: { errors: 0 },
        fields: { terminatedBy: ',' }
      },
      columns: [],
      enabled: true
    };

    const errors = sqlLoaderUtils.validateConfigurationData(invalidConfig);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('Source System ID is required');
    expect(errors).toContain('Job Name is required');
    expect(errors).toContain('Table Name is required');
    expect(errors).toContain('At least one column must be defined');
  });

  test('generates control file correctly', () => {
    const config: SQLLoaderConfig = {
      sourceSystemId: 'test-system',
      jobName: 'test-job',
      tableName: 'TEST_TABLE',
      control: {
        load: { replace: true },
        options: { errors: 0 },
        fields: { 
          terminatedBy: ',',
          optionallyEnclosedBy: '"',
          trailingNullCols: true
        }
      },
      columns: [
        {
          columnName: 'ID',
          dataType: 'NUMBER',
          nullable: false,
          position: 1
        },
        {
          columnName: 'NAME',
          dataType: 'VARCHAR2',
          maxLength: 100,
          nullable: true,
          position: 2
        }
      ],
      enabled: true
    };

    const controlFile = sqlLoaderUtils.generateDefaultControlFile(config);
    
    expect(controlFile).toContain('LOAD DATA');
    expect(controlFile).toContain('INTO TABLE TEST_TABLE');
    expect(controlFile).toContain('REPLACE');
    expect(controlFile).toContain("TERMINATED BY ','");
    expect(controlFile).toContain('OPTIONALLY ENCLOSED BY \'"\'');
    expect(controlFile).toContain('ID');
    expect(controlFile).toContain('NAME');
  });

  test('handles date columns with format', () => {
    const config: SQLLoaderConfig = {
      sourceSystemId: 'test-system',
      jobName: 'test-job',
      tableName: 'TEST_TABLE',
      control: {
        load: { replace: true },
        options: { errors: 0 },
        fields: { terminatedBy: ',' }
      },
      columns: [
        {
          columnName: 'CREATED_DATE',
          dataType: 'DATE',
          nullable: true,
          dateFormat: 'DD/MM/YYYY',
          position: 1
        }
      ],
      enabled: true
    };

    const controlFile = sqlLoaderUtils.generateDefaultControlFile(config);
    
    expect(controlFile).toContain('CREATED_DATE');
    expect(controlFile).toContain('DATE "DD/MM/YYYY"');
  });
});

describe('SQL*Loader Types', () => {
  test('SQLLoaderConfig interface is properly structured', () => {
    const config: SQLLoaderConfig = {
      sourceSystemId: 'test',
      jobName: 'test',
      tableName: 'test',
      description: 'test config',
      control: {
        load: {
          data: 'test.dat',
          infile: 'test.csv',
          badfile: 'test.bad',
          discardfile: 'test.dsc',
          logfile: 'test.log',
          replace: true,
          append: false,
          truncate: false
        },
        options: {
          skip: 0,
          errors: 0,
          rows: 1000,
          bindsize: 65536,
          readsize: 65536,
          parallel: false,
          direct: false,
          unrecoverable: false
        },
        fields: {
          terminatedBy: ',',
          enclosedBy: '"',
          optionallyEnclosedBy: '"',
          escapedBy: '\\',
          missingFieldValues: 'nullif',
          trailingNullCols: true
        }
      },
      columns: [
        {
          id: '1',
          columnName: 'ID',
          dataType: 'NUMBER',
          maxLength: 10,
          nullable: false,
          defaultValue: '0',
          description: 'Primary key',
          position: 1,
          terminated: true,
          enclosed: false,
          optionallyEnclosed: true,
          dateFormat: undefined,
          expression: undefined,
          required: true,
          validationRules: ['not_null']
        }
      ],
      inputFilePattern: '*.csv',
      outputPath: '/output',
      archivePath: '/archive',
      enabled: true,
      schedule: '0 0 * * *',
      createdBy: 'admin',
      createdDate: '2024-01-01',
      lastModified: '2024-01-01',
      version: 1
    };

    // Test that the configuration object is properly structured
    expect(config.sourceSystemId).toBe('test');
    expect(config.jobName).toBe('test');
    expect(config.tableName).toBe('test');
    expect(config.enabled).toBe(true);
    expect(config.columns).toHaveLength(1);
    expect(config.control.load?.replace).toBe(true);
    expect(config.control.fields?.terminatedBy).toBe(',');
  });
});

describe('SQL*Loader API Interface', () => {
  test('API module exports all required functions', () => {
    const { sqlLoaderApi } = require('../services/api/sqlLoaderApi');
    
    // Configuration Management
    expect(typeof sqlLoaderApi.getConfigurations).toBe('function');
    expect(typeof sqlLoaderApi.getConfiguration).toBe('function');
    expect(typeof sqlLoaderApi.getConfigurationByJob).toBe('function');
    expect(typeof sqlLoaderApi.createConfiguration).toBe('function');
    expect(typeof sqlLoaderApi.updateConfiguration).toBe('function');
    expect(typeof sqlLoaderApi.deleteConfiguration).toBe('function');

    // Table and Column Management
    expect(typeof sqlLoaderApi.getTableColumns).toBe('function');
    expect(typeof sqlLoaderApi.getTables).toBe('function');

    // Validation
    expect(typeof sqlLoaderApi.validateConfiguration).toBe('function');

    // Control File Generation
    expect(typeof sqlLoaderApi.generateControlFile).toBe('function');
    expect(typeof sqlLoaderApi.previewControlFile).toBe('function');

    // Execution and Testing
    expect(typeof sqlLoaderApi.executeConfiguration).toBe('function');
    expect(typeof sqlLoaderApi.testConfiguration).toBe('function');

    // Status and Monitoring
    expect(typeof sqlLoaderApi.getExecutionHistory).toBe('function');
    expect(typeof sqlLoaderApi.getConfigurationStatus).toBe('function');

    // Import/Export
    expect(typeof sqlLoaderApi.exportConfiguration).toBe('function');
    expect(typeof sqlLoaderApi.importConfiguration).toBe('function');
  });

  test('Utility functions are exported', () => {
    const { sqlLoaderUtils } = require('../services/api/sqlLoaderApi');
    
    expect(typeof sqlLoaderUtils.formatError).toBe('function');
    expect(typeof sqlLoaderUtils.validateConfigurationData).toBe('function');
    expect(typeof sqlLoaderUtils.generateDefaultControlFile).toBe('function');
  });
});

describe('SQL*Loader Hook Interface', () => {
  test('Hook is properly exported', () => {
    const { useSQLLoaderConfiguration } = require('../hooks/useSQLLoaderConfiguration');
    
    expect(typeof useSQLLoaderConfiguration).toBe('function');
  });
});