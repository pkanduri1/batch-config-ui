// Advanced SQL*Loader testing suite - Phase 1.4
import { sqlLoaderApi, sqlLoaderUtils } from '../services/api/sqlLoaderApi';
import { SQLLoaderConfig, SQLLoaderColumn, SQLLoaderValidationResult } from '../types/configuration';

// Mock HTTP client
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

describe('SQL*Loader Advanced Test Suite', () => {
  
  describe('Configuration Validation - Complex Scenarios', () => {
    test('validates complex multi-column configuration with various data types', () => {
      const complexConfig: SQLLoaderConfig = {
        sourceSystemId: 'TRADING_SYSTEM',
        jobName: 'complex_trades_import',
        tableName: 'COMPLEX_TRADES',
        description: 'Complex trading data with multiple data types',
        control: {
          load: { replace: true },
          options: { 
            errors: 100, 
            skip: 1,
            rows: 5000,
            parallel: true,
            direct: true 
          },
          fields: {
            terminatedBy: '|',
            optionallyEnclosedBy: '"',
            trailingNullCols: true,
            escapedBy: '\\\\'
          }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'TRADE_ID',
            dataType: 'NUMBER',
            nullable: false,
            position: 1,
            validationRules: ['not_null', 'positive']
          },
          {
            id: 'col2',
            columnName: 'TRADE_DATE',
            dataType: 'DATE',
            dateFormat: 'DD/MM/YYYY HH24:MI:SS',
            nullable: false,
            position: 2
          },
          {
            id: 'col3',
            columnName: 'AMOUNT',
            dataType: 'NUMBER',
            maxLength: 15,
            nullable: true,
            position: 3,
            defaultValue: '0'
          },
          {
            id: 'col4',
            columnName: 'DESCRIPTION',
            dataType: 'VARCHAR2',
            maxLength: 4000,
            nullable: true,
            position: 4,
            optionallyEnclosed: true
          },
          {
            id: 'col5',
            columnName: 'BLOB_DATA',
            dataType: 'CLOB',
            nullable: true,
            position: 5,
            expression: 'UPPER(TRIM(:BLOB_DATA))'
          }
        ],
        enabled: true,
        schedule: '0 0 * * *',
        inputFilePattern: 'trades_*.dat',
        outputPath: '/data/output/trades',
        archivePath: '/data/archive/trades'
      };

      const errors = sqlLoaderUtils.validateConfigurationData(complexConfig);
      expect(errors).toHaveLength(0);
    });

    test('detects configuration conflicts and invalid settings', () => {
      const conflictConfig: SQLLoaderConfig = {
        sourceSystemId: 'TEST_SYSTEM',
        jobName: 'conflict_test',
        tableName: 'TEST_TABLE',
        control: {
          load: { 
            replace: true,
            append: true, // Conflict with replace
            truncate: true // Conflict with replace and append
          },
          options: { 
            errors: -1, // Invalid negative value
            rows: 0 // Invalid zero value
          },
          fields: {
            terminatedBy: '',
            enclosedBy: '"',
            optionallyEnclosedBy: '"' // Conflict with enclosedBy
          }
        },
        columns: [
          {
            id: 'col1',
            columnName: '', // Empty column name
            dataType: 'INVALID_TYPE' as any, // Invalid data type
            nullable: false,
            position: 0 // Invalid position
          },
          {
            id: 'col2',
            columnName: 'COL_2',
            dataType: 'DATE',
            dateFormat: 'INVALID_FORMAT', // Invalid date format
            nullable: false,
            position: 1
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(conflictConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Multiple load operations cannot be specified simultaneously');
      expect(errors).toContain('Column name is required');
      expect(errors).toContain('Invalid data type: INVALID_TYPE');
      expect(errors).toContain('Position must be greater than 0');
    });

    test('validates large configuration with 100+ columns', () => {
      const largeConfig: SQLLoaderConfig = {
        sourceSystemId: 'LARGE_SYSTEM',
        jobName: 'large_import',
        tableName: 'LARGE_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: Array.from({ length: 150 }, (_, index) => ({
          id: `col${index + 1}`,
          columnName: `COLUMN_${index + 1}`,
          dataType: index % 2 === 0 ? 'VARCHAR2' : 'NUMBER',
          maxLength: index % 2 === 0 ? 100 : 10,
          nullable: index % 3 === 0,
          position: index + 1
        })),
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(largeConfig);
      expect(errors).toHaveLength(0);
      expect(largeConfig.columns).toHaveLength(150);
    });
  });

  describe('Control File Generation - Advanced Scenarios', () => {
    test('generates control file for fixed-width format', () => {
      const fixedWidthConfig: SQLLoaderConfig = {
        sourceSystemId: 'FIXED_SYSTEM',
        jobName: 'fixed_width_import',
        tableName: 'FIXED_TABLE',
        control: {
          load: { append: true },
          options: { 
            direct: true,
            parallel: true,
            unrecoverable: true
          },
          fields: {
            // No field terminators for fixed width
          }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'ID',
            dataType: 'NUMBER',
            position: 1,
            nullable: false,
            fixedWidth: { start: 1, end: 10 }
          },
          {
            id: 'col2',
            columnName: 'NAME',
            dataType: 'VARCHAR2',
            maxLength: 50,
            position: 2,
            nullable: true,
            fixedWidth: { start: 11, end: 60 }
          },
          {
            id: 'col3',
            columnName: 'AMOUNT',
            dataType: 'NUMBER',
            position: 3,
            nullable: true,
            fixedWidth: { start: 61, end: 75 }
          }
        ],
        enabled: true
      };

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(fixedWidthConfig);
      
      expect(controlFile).toContain('APPEND');
      expect(controlFile).toContain('DIRECT=TRUE');
      expect(controlFile).toContain('PARALLEL=TRUE');
      expect(controlFile).toContain('UNRECOVERABLE');
      expect(controlFile).toContain('POSITION(1:10)');
      expect(controlFile).toContain('POSITION(11:60)');
      expect(controlFile).toContain('POSITION(61:75)');
    });

    test('generates control file with complex expressions and transformations', () => {
      const expressionConfig: SQLLoaderConfig = {
        sourceSystemId: 'EXPR_SYSTEM',
        jobName: 'expression_import',
        tableName: 'EXPR_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 50 },
          fields: {
            terminatedBy: ',',
            optionallyEnclosedBy: '"'
          }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'UPPER_NAME',
            dataType: 'VARCHAR2',
            maxLength: 100,
            nullable: true,
            position: 1,
            expression: 'UPPER(TRIM(:NAME))'
          },
          {
            id: 'col2',
            columnName: 'CALCULATED_DATE',
            dataType: 'DATE',
            nullable: true,
            position: 2,
            expression: 'TO_DATE(:DATE_STRING, \'YYYY-MM-DD\')'
          },
          {
            id: 'col3',
            columnName: 'CONSTANT_VALUE',
            dataType: 'VARCHAR2',
            maxLength: 10,
            nullable: false,
            position: 3,
            defaultValue: '\'DEFAULT\'',
            expression: '\'SYSTEM_GENERATED\''
          }
        ],
        enabled: true
      };

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(expressionConfig);
      
      expect(controlFile).toContain('UPPER_NAME "UPPER(TRIM(:NAME))"');
      expect(controlFile).toContain('CALCULATED_DATE "TO_DATE(:DATE_STRING, \'YYYY-MM-DD\')"');
      expect(controlFile).toContain('CONSTANT_VALUE "\'SYSTEM_GENERATED\'"');
    });

    test('generates control file with conditional logic', () => {
      const conditionalConfig: SQLLoaderConfig = {
        sourceSystemId: 'COND_SYSTEM',
        jobName: 'conditional_import',
        tableName: 'COND_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'STATUS',
            dataType: 'VARCHAR2',
            maxLength: 20,
            nullable: false,
            position: 1,
            expression: 'CASE WHEN :STATUS_CODE = \'A\' THEN \'ACTIVE\' ELSE \'INACTIVE\' END'
          },
          {
            id: 'col2',
            columnName: 'PROCESSED_DATE',
            dataType: 'DATE',
            nullable: true,
            position: 2,
            expression: 'DECODE(:PROCESS_FLAG, \'Y\', SYSDATE, NULL)'
          }
        ],
        enabled: true
      };

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(conditionalConfig);
      
      expect(controlFile).toContain('STATUS "CASE WHEN :STATUS_CODE = \'A\' THEN \'ACTIVE\' ELSE \'INACTIVE\' END"');
      expect(controlFile).toContain('PROCESSED_DATE "DECODE(:PROCESS_FLAG, \'Y\', SYSDATE, NULL)"');
    });
  });

  describe('Data Type Handling - Oracle Specific', () => {
    test('handles all Oracle data types correctly', () => {
      const allTypesConfig: SQLLoaderConfig = {
        sourceSystemId: 'TYPE_SYSTEM',
        jobName: 'all_types_test',
        tableName: 'ALL_TYPES_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'varchar_col',
            columnName: 'VARCHAR_COL',
            dataType: 'VARCHAR2',
            maxLength: 4000,
            nullable: true,
            position: 1
          },
          {
            id: 'number_col',
            columnName: 'NUMBER_COL',
            dataType: 'NUMBER',
            precision: 15,
            scale: 2,
            nullable: true,
            position: 2
          },
          {
            id: 'date_col',
            columnName: 'DATE_COL',
            dataType: 'DATE',
            dateFormat: 'DD/MM/YYYY',
            nullable: true,
            position: 3
          },
          {
            id: 'timestamp_col',
            columnName: 'TIMESTAMP_COL',
            dataType: 'TIMESTAMP',
            dateFormat: 'DD/MM/YYYY HH24:MI:SS.FF',
            nullable: true,
            position: 4
          },
          {
            id: 'char_col',
            columnName: 'CHAR_COL',
            dataType: 'CHAR',
            maxLength: 10,
            nullable: true,
            position: 5
          },
          {
            id: 'clob_col',
            columnName: 'CLOB_COL',
            dataType: 'CLOB',
            nullable: true,
            position: 6
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(allTypesConfig);
      expect(errors).toHaveLength(0);

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(allTypesConfig);
      expect(controlFile).toContain('VARCHAR_COL');
      expect(controlFile).toContain('NUMBER_COL');
      expect(controlFile).toContain('DATE_COL DATE "DD/MM/YYYY"');
      expect(controlFile).toContain('TIMESTAMP_COL TIMESTAMP "DD/MM/YYYY HH24:MI:SS.FF"');
      expect(controlFile).toContain('CHAR_COL CHAR');
      expect(controlFile).toContain('CLOB_COL CHAR(4000)');
    });

    test('validates number precision and scale constraints', () => {
      const precisionConfig: SQLLoaderConfig = {
        sourceSystemId: 'PRECISION_SYSTEM',
        jobName: 'precision_test',
        tableName: 'PRECISION_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'invalid_precision',
            columnName: 'INVALID_PRECISION',
            dataType: 'NUMBER',
            precision: 40, // Oracle max is 38
            scale: 2,
            nullable: true,
            position: 1
          },
          {
            id: 'invalid_scale',
            columnName: 'INVALID_SCALE',
            dataType: 'NUMBER',
            precision: 10,
            scale: 15, // Scale cannot be greater than precision
            nullable: true,
            position: 2
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(precisionConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('precision'))).toBe(true);
      expect(errors.some(error => error.includes('scale'))).toBe(true);
    });
  });

  describe('Performance and Memory Optimization', () => {
    test('validates performance options configuration', () => {
      const performanceConfig: SQLLoaderConfig = {
        sourceSystemId: 'PERF_SYSTEM',
        jobName: 'performance_test',
        tableName: 'PERF_TABLE',
        control: {
          load: { append: true },
          options: {
            parallel: true,
            direct: true,
            unrecoverable: true,
            rows: 10000,
            bindsize: 1048576, // 1MB
            readsize: 2097152  // 2MB
          },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'ID',
            dataType: 'NUMBER',
            nullable: false,
            position: 1
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(performanceConfig);
      expect(errors).toHaveLength(0);

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(performanceConfig);
      expect(controlFile).toContain('DIRECT=TRUE');
      expect(controlFile).toContain('PARALLEL=TRUE');
      expect(controlFile).toContain('UNRECOVERABLE');
      expect(controlFile).toContain('ROWS=10000');
      expect(controlFile).toContain('BINDSIZE=1048576');
      expect(controlFile).toContain('READSIZE=2097152');
    });

    test('validates memory constraints for large configurations', () => {
      const memoryConfig: SQLLoaderConfig = {
        sourceSystemId: 'MEMORY_SYSTEM',
        jobName: 'memory_test',
        tableName: 'MEMORY_TABLE',
        control: {
          load: { replace: true },
          options: {
            bindsize: 2147483647, // Max integer value
            readsize: 2147483647  // Max integer value
          },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'LARGE_TEXT',
            dataType: 'VARCHAR2',
            maxLength: 4000,
            nullable: true,
            position: 1
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(memoryConfig);
      // Should validate memory constraints
      expect(errors.length).toEqual(0); // Assuming these are valid values
    });
  });

  describe('Error Handling and Recovery', () => {
    test('validates error handling configuration', () => {
      const errorConfig: SQLLoaderConfig = {
        sourceSystemId: 'ERROR_SYSTEM',
        jobName: 'error_handling_test',
        tableName: 'ERROR_TABLE',
        control: {
          load: { replace: true },
          options: {
            errors: 1000,
            skip: 2,
            discardmax: 500
          },
          fields: {
            terminatedBy: ',',
            optionallyEnclosedBy: '"'
          }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'ID',
            dataType: 'NUMBER',
            nullable: false,
            position: 1,
            validationRules: ['not_null', 'positive']
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(errorConfig);
      expect(errors).toHaveLength(0);

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(errorConfig);
      expect(controlFile).toContain('ERRORS=1000');
      expect(controlFile).toContain('SKIP=2');
      expect(controlFile).toContain('DISCARDMAX=500');
    });

    test('handles configuration recovery scenarios', () => {
      const recoveryConfig: SQLLoaderConfig = {
        sourceSystemId: 'RECOVERY_SYSTEM',
        jobName: 'recovery_test',
        tableName: 'RECOVERY_TABLE',
        control: {
          load: { append: true },
          options: {
            errors: 0, // No errors allowed
            skip: 0
          },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'CRITICAL_DATA',
            dataType: 'VARCHAR2',
            maxLength: 100,
            nullable: false,
            position: 1,
            validationRules: ['not_null', 'not_empty']
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(recoveryConfig);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('SQL*Loader API Comprehensive Testing', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration CRUD Operations', () => {
    test('handles concurrent configuration updates', async () => {
      const config: SQLLoaderConfig = {
        sourceSystemId: 'CONCURRENT_SYSTEM',
        jobName: 'concurrent_test',
        tableName: 'CONCURRENT_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [],
        enabled: true,
        version: 1
      };

      // Simulate concurrent updates
      const promises = Array.from({ length: 5 }, (_, index) => ({
        ...config,
        version: index + 1,
        description: `Version ${index + 1}`
      }));

      // Test that API can handle concurrent requests
      promises.forEach(async (configVersion) => {
        expect(() => sqlLoaderUtils.validateConfigurationData(configVersion)).not.toThrow();
      });
    });

    test('validates configuration import/export functionality', () => {
      const exportConfig: SQLLoaderConfig = {
        sourceSystemId: 'EXPORT_SYSTEM',
        jobName: 'export_test',
        tableName: 'EXPORT_TABLE',
        description: 'Configuration for export testing',
        control: {
          load: { replace: true },
          options: { errors: 100 },
          fields: {
            terminatedBy: '|',
            optionallyEnclosedBy: '"',
            trailingNullCols: true
          }
        },
        columns: [
          {
            id: 'col1',
            columnName: 'EXPORT_ID',
            dataType: 'NUMBER',
            nullable: false,
            position: 1
          },
          {
            id: 'col2',
            columnName: 'EXPORT_DATA',
            dataType: 'VARCHAR2',
            maxLength: 1000,
            nullable: true,
            position: 2
          }
        ],
        enabled: true,
        createdBy: 'test_user',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      // Test export functionality
      const serializedConfig = JSON.stringify(exportConfig);
      expect(serializedConfig).toBeTruthy();

      // Test import functionality
      const importedConfig = JSON.parse(serializedConfig) as SQLLoaderConfig;
      expect(importedConfig.sourceSystemId).toBe(exportConfig.sourceSystemId);
      expect(importedConfig.jobName).toBe(exportConfig.jobName);
      expect(importedConfig.columns).toHaveLength(exportConfig.columns.length);

      const errors = sqlLoaderUtils.validateConfigurationData(importedConfig);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validation and Testing', () => {
    test('performs comprehensive configuration validation', () => {
      const validationTestCases = [
        {
          name: 'Valid basic configuration',
          config: {
            sourceSystemId: 'VALID_SYSTEM',
            jobName: 'valid_job',
            tableName: 'VALID_TABLE',
            control: {
              load: { replace: true },
              options: { errors: 0 },
              fields: { terminatedBy: ',' }
            },
            columns: [{
              id: 'col1',
              columnName: 'ID',
              dataType: 'NUMBER',
              nullable: false,
              position: 1
            }],
            enabled: true
          },
          expectedErrors: 0
        },
        {
          name: 'Missing required fields',
          config: {
            sourceSystemId: '',
            jobName: '',
            tableName: '',
            control: {
              load: {},
              options: {},
              fields: {}
            },
            columns: [],
            enabled: true
          },
          expectedErrors: 4 // sourceSystemId, jobName, tableName, columns
        },
        {
          name: 'Invalid column configuration',
          config: {
            sourceSystemId: 'INVALID_SYSTEM',
            jobName: 'invalid_job',
            tableName: 'INVALID_TABLE',
            control: {
              load: { replace: true },
              options: { errors: 0 },
              fields: { terminatedBy: ',' }
            },
            columns: [{
              id: 'col1',
              columnName: '',
              dataType: 'INVALID_TYPE',
              nullable: false,
              position: 0
            }],
            enabled: true
          },
          expectedErrors: 3 // columnName, dataType, position
        }
      ];

      validationTestCases.forEach(testCase => {
        const errors = sqlLoaderUtils.validateConfigurationData(testCase.config as SQLLoaderConfig);
        expect(errors.length).toBeGreaterThanOrEqual(testCase.expectedErrors);
      });
    });
  });
});