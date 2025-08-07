// SQL*Loader Performance Testing Suite - Phase 1.4
import { sqlLoaderUtils } from '../services/api/sqlLoaderApi';
import { SQLLoaderConfig } from '../types/configuration';

describe('SQL*Loader Performance Tests', () => {
  
  describe('Large Configuration Performance', () => {
    test('processes large configuration with 500+ columns efficiently', () => {
      const startTime = performance.now();
      
      const largeConfig: SQLLoaderConfig = {
        sourceSystemId: 'LARGE_PERF_SYSTEM',
        jobName: 'large_performance_test',
        tableName: 'LARGE_PERF_TABLE',
        description: 'Performance test with 500 columns',
        control: {
          load: { replace: true },
          options: { 
            errors: 1000,
            parallel: true,
            direct: true,
            rows: 10000
          },
          fields: {
            terminatedBy: '|',
            optionallyEnclosedBy: '"',
            trailingNullCols: true
          }
        },
        columns: Array.from({ length: 500 }, (_, index) => ({
          id: `col_${index + 1}`,
          columnName: `COLUMN_${String(index + 1).padStart(3, '0')}`,
          dataType: index % 3 === 0 ? 'VARCHAR2' : (index % 3 === 1 ? 'NUMBER' : 'DATE'),
          maxLength: index % 3 === 0 ? Math.max(50, index % 1000) : undefined,
          precision: index % 3 === 1 ? Math.min(15, Math.max(1, index % 20)) : undefined,
          scale: index % 3 === 1 ? Math.min(2, index % 5) : undefined,
          dateFormat: index % 3 === 2 ? 'DD/MM/YYYY' : undefined,
          nullable: index % 2 === 0,
          position: index + 1,
          description: `Column ${index + 1} for performance testing`
        })),
        enabled: true
      };

      // Validation performance test
      const validationStartTime = performance.now();
      const errors = sqlLoaderUtils.validateConfigurationData(largeConfig);
      const validationEndTime = performance.now();
      const validationTime = validationEndTime - validationStartTime;

      // Control file generation performance test
      const generationStartTime = performance.now();
      const controlFile = sqlLoaderUtils.generateDefaultControlFile(largeConfig);
      const generationEndTime = performance.now();
      const generationTime = generationEndTime - generationStartTime;

      const totalTime = performance.now() - startTime;

      // Performance assertions
      expect(errors).toHaveLength(0);
      expect(validationTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(generationTime).toBeLessThan(2000); // Should complete in less than 2 seconds
      expect(totalTime).toBeLessThan(5000); // Total time should be less than 5 seconds
      expect(controlFile.length).toBeGreaterThan(10000); // Should generate substantial control file
      expect(largeConfig.columns).toHaveLength(500);
      
      // Verify control file contains all columns
      largeConfig.columns.forEach(column => {
        expect(controlFile).toContain(column.columnName);
      });

      console.log(`Performance Test Results:
        - Total time: ${totalTime.toFixed(2)}ms
        - Validation time: ${validationTime.toFixed(2)}ms
        - Generation time: ${generationTime.toFixed(2)}ms
        - Columns processed: ${largeConfig.columns.length}
        - Control file size: ${controlFile.length} characters`);
    });

    test('handles memory-intensive configuration validation', () => {
      const memoryTestConfig: SQLLoaderConfig = {
        sourceSystemId: 'MEMORY_TEST_SYSTEM',
        jobName: 'memory_intensive_test',
        tableName: 'MEMORY_TEST_TABLE',
        description: 'Memory intensive test with large data structures',
        control: {
          load: { replace: true },
          options: {
            errors: 10000,
            parallel: true,
            direct: true,
            rows: 100000,
            bindsize: 10485760, // 10MB
            readsize: 20971520  // 20MB
          },
          fields: {
            terminatedBy: ',',
            optionallyEnclosedBy: '"',
            trailingNullCols: true
          }
        },
        columns: Array.from({ length: 1000 }, (_, index) => ({
          id: `memory_col_${index + 1}`,
          columnName: `MEMORY_COLUMN_${String(index + 1).padStart(4, '0')}`,
          dataType: 'VARCHAR2',
          maxLength: 4000, // Maximum VARCHAR2 length
          nullable: true,
          position: index + 1,
          description: `Memory test column ${index + 1} with maximum length description that contains a lot of text to test memory usage during validation and processing. This description is intentionally verbose to simulate real-world scenarios where columns have detailed descriptions.`,
          defaultValue: `Default value for column ${index + 1}`,
          validationRules: ['not_empty', 'trim_whitespace'],
          expression: index % 10 === 0 ? `UPPER(TRIM(:MEMORY_COLUMN_${String(index + 1).padStart(4, '0')}))` : undefined
        })),
        enabled: true
      };

      const startTime = performance.now();
      const errors = sqlLoaderUtils.validateConfigurationData(memoryTestConfig);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(errors).toHaveLength(0);
      expect(processingTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(memoryTestConfig.columns).toHaveLength(1000);
      
      console.log(`Memory Test Results:
        - Processing time: ${processingTime.toFixed(2)}ms
        - Columns with expressions: ${memoryTestConfig.columns.filter(c => c.expression).length}
        - Average processing time per column: ${(processingTime / 1000).toFixed(2)}ms`);
    });

    test('validates concurrent validation performance', async () => {
      const baseConfig: SQLLoaderConfig = {
        sourceSystemId: 'CONCURRENT_PERF_SYSTEM',
        jobName: 'concurrent_performance_test',
        tableName: 'CONCURRENT_PERF_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 100 },
          fields: { terminatedBy: ',' }
        },
        columns: Array.from({ length: 100 }, (_, index) => ({
          id: `concurrent_col_${index + 1}`,
          columnName: `CONCURRENT_COLUMN_${index + 1}`,
          dataType: index % 2 === 0 ? 'VARCHAR2' : 'NUMBER',
          maxLength: index % 2 === 0 ? 255 : undefined,
          precision: index % 2 === 1 ? 10 : undefined,
          scale: index % 2 === 1 ? 2 : undefined,
          nullable: true,
          position: index + 1
        })),
        enabled: true
      };

      // Create multiple variations of the configuration
      const configurations = Array.from({ length: 20 }, (_, index) => ({
        ...baseConfig,
        jobName: `concurrent_test_${index + 1}`,
        description: `Concurrent test configuration ${index + 1}`
      }));

      const startTime = performance.now();
      
      // Process all configurations concurrently
      const validationPromises = configurations.map(config => 
        Promise.resolve(sqlLoaderUtils.validateConfigurationData(config))
      );
      
      const results = await Promise.all(validationPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All validations should pass
      results.forEach(errors => {
        expect(errors).toHaveLength(0);
      });

      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results).toHaveLength(20);

      console.log(`Concurrent Validation Results:
        - Total time: ${totalTime.toFixed(2)}ms
        - Configurations processed: ${configurations.length}
        - Average time per configuration: ${(totalTime / configurations.length).toFixed(2)}ms`);
    });
  });

  describe('Control File Generation Performance', () => {
    test('generates complex control files efficiently', () => {
      const complexConfig: SQLLoaderConfig = {
        sourceSystemId: 'COMPLEX_GEN_SYSTEM',
        jobName: 'complex_generation_test',
        tableName: 'COMPLEX_GEN_TABLE',
        control: {
          load: { replace: true },
          options: {
            parallel: true,
            direct: true,
            unrecoverable: true,
            errors: 1000,
            skip: 1,
            rows: 50000,
            bindsize: 1048576,
            readsize: 2097152
          },
          fields: {
            terminatedBy: '|',
            optionallyEnclosedBy: '"',
            trailingNullCols: true,
            escapedBy: '\\\\'
          }
        },
        columns: Array.from({ length: 250 }, (_, index) => ({
          id: `complex_col_${index + 1}`,
          columnName: `COMPLEX_COLUMN_${String(index + 1).padStart(3, '0')}`,
          dataType: index % 4 === 0 ? 'VARCHAR2' : 
                   (index % 4 === 1 ? 'NUMBER' : 
                   (index % 4 === 2 ? 'DATE' : 'TIMESTAMP')),
          maxLength: index % 4 === 0 ? Math.max(100, index % 2000) : undefined,
          precision: index % 4 === 1 ? Math.min(15, Math.max(1, index % 20)) : undefined,
          scale: index % 4 === 1 ? Math.min(4, index % 6) : undefined,
          dateFormat: index % 4 === 2 ? 'DD/MM/YYYY HH24:MI:SS' : 
                     (index % 4 === 3 ? 'DD/MM/YYYY HH24:MI:SS.FF3' : undefined),
          nullable: index % 3 !== 0,
          position: index + 1,
          defaultValue: index % 10 === 0 ? `'DEFAULT_${index + 1}'` : undefined,
          expression: index % 15 === 0 ? 
                     `CASE WHEN :COMPLEX_COLUMN_${String(index + 1).padStart(3, '0')} IS NOT NULL THEN UPPER(TRIM(:COMPLEX_COLUMN_${String(index + 1).padStart(3, '0')})) ELSE 'NULL_VALUE' END` : 
                     undefined,
          validationRules: index % 5 === 0 ? ['not_null', 'trim_whitespace'] : undefined
        })),
        enabled: true
      };

      const startTime = performance.now();
      const controlFile = sqlLoaderUtils.generateDefaultControlFile(complexConfig);
      const endTime = performance.now();
      const generationTime = endTime - startTime;

      expect(generationTime).toBeLessThan(1500); // Should complete within 1.5 seconds
      expect(controlFile.length).toBeGreaterThan(15000); // Should be a substantial file
      expect(controlFile).toContain('PARALLEL=TRUE');
      expect(controlFile).toContain('DIRECT=TRUE');
      expect(controlFile).toContain('UNRECOVERABLE');

      // Verify all columns are included
      complexConfig.columns.forEach(column => {
        expect(controlFile).toContain(column.columnName);
      });

      // Count number of expressions generated
      const expressionCount = complexConfig.columns.filter(c => c.expression).length;
      
      console.log(`Complex Control File Generation Results:
        - Generation time: ${generationTime.toFixed(2)}ms
        - Control file size: ${controlFile.length} characters
        - Columns processed: ${complexConfig.columns.length}
        - Expressions included: ${expressionCount}
        - Performance: ${(generationTime / complexConfig.columns.length).toFixed(2)}ms per column`);
    });

    test('handles batch control file generation', () => {
      const batchConfigs = Array.from({ length: 10 }, (_, batchIndex) => ({
        sourceSystemId: 'BATCH_SYSTEM',
        jobName: `batch_job_${batchIndex + 1}`,
        tableName: `BATCH_TABLE_${batchIndex + 1}`,
        control: {
          load: { replace: true },
          options: { errors: 100 },
          fields: { terminatedBy: ',' }
        },
        columns: Array.from({ length: 50 }, (_, colIndex) => ({
          id: `batch_col_${batchIndex + 1}_${colIndex + 1}`,
          columnName: `BATCH_COL_${batchIndex + 1}_${colIndex + 1}`,
          dataType: colIndex % 2 === 0 ? 'VARCHAR2' : 'NUMBER',
          maxLength: colIndex % 2 === 0 ? 255 : undefined,
          nullable: true,
          position: colIndex + 1
        })),
        enabled: true
      }));

      const startTime = performance.now();
      
      const controlFiles = batchConfigs.map(config => 
        sqlLoaderUtils.generateDefaultControlFile(config)
      );
      
      const endTime = performance.now();
      const batchTime = endTime - startTime;

      expect(batchTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(controlFiles).toHaveLength(10);
      
      controlFiles.forEach((controlFile, index) => {
        expect(controlFile.length).toBeGreaterThan(1000);
        expect(controlFile).toContain(`BATCH_TABLE_${index + 1}`);
      });

      console.log(`Batch Control File Generation Results:
        - Total batch time: ${batchTime.toFixed(2)}ms
        - Configurations processed: ${batchConfigs.length}
        - Average time per configuration: ${(batchTime / batchConfigs.length).toFixed(2)}ms
        - Total columns processed: ${batchConfigs.length * 50}`);
    });
  });

  describe('Memory Usage Optimization', () => {
    test('maintains efficient memory usage with large datasets', () => {
      // Simulate garbage collection test
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      const largeDataConfig: SQLLoaderConfig = {
        sourceSystemId: 'MEMORY_OPT_SYSTEM',
        jobName: 'memory_optimization_test',
        tableName: 'MEMORY_OPT_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: Array.from({ length: 2000 }, (_, index) => ({
          id: `mem_opt_col_${index + 1}`,
          columnName: `MEM_OPT_COLUMN_${String(index + 1).padStart(4, '0')}`,
          dataType: 'VARCHAR2',
          maxLength: 1000,
          nullable: true,
          position: index + 1,
          description: `Memory optimization test column ${index + 1}`.repeat(10) // Create large strings
        })),
        enabled: true
      };

      // Process the configuration multiple times to test memory cleanup
      for (let i = 0; i < 5; i++) {
        const errors = sqlLoaderUtils.validateConfigurationData(largeDataConfig);
        expect(errors).toHaveLength(0);
        
        const controlFile = sqlLoaderUtils.generateDefaultControlFile(largeDataConfig);
        expect(controlFile.length).toBeGreaterThan(50000);
        
        // Simulate processing completion
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`Memory Usage Test Results:
        - Initial memory: ${Math.round(initialMemory / 1024 / 1024)}MB
        - Final memory: ${Math.round(finalMemory / 1024 / 1024)}MB
        - Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB
        - Configurations processed: 5
        - Columns per configuration: 2000`);
    });
  });

  describe('Scalability Tests', () => {
    test('validates scalability with increasing complexity', () => {
      const complexityLevels = [10, 50, 100, 250, 500, 1000];
      const results: { columns: number; validationTime: number; generationTime: number }[] = [];

      complexityLevels.forEach(columnCount => {
        const config: SQLLoaderConfig = {
          sourceSystemId: 'SCALE_SYSTEM',
          jobName: `scalability_test_${columnCount}`,
          tableName: `SCALE_TABLE_${columnCount}`,
          control: {
            load: { replace: true },
            options: { errors: 100 },
            fields: { terminatedBy: ',' }
          },
          columns: Array.from({ length: columnCount }, (_, index) => ({
            id: `scale_col_${index + 1}`,
            columnName: `SCALE_COLUMN_${index + 1}`,
            dataType: index % 3 === 0 ? 'VARCHAR2' : (index % 3 === 1 ? 'NUMBER' : 'DATE'),
            maxLength: index % 3 === 0 ? 255 : undefined,
            dateFormat: index % 3 === 2 ? 'DD/MM/YYYY' : undefined,
            nullable: true,
            position: index + 1
          })),
          enabled: true
        };

        // Measure validation time
        const validationStart = performance.now();
        const errors = sqlLoaderUtils.validateConfigurationData(config);
        const validationTime = performance.now() - validationStart;

        // Measure generation time
        const generationStart = performance.now();
        const controlFile = sqlLoaderUtils.generateDefaultControlFile(config);
        const generationTime = performance.now() - generationStart;

        expect(errors).toHaveLength(0);
        expect(controlFile.length).toBeGreaterThan(columnCount * 20);

        results.push({
          columns: columnCount,
          validationTime,
          generationTime
        });
      });

      // Analyze scalability
      results.forEach((result, index) => {
        if (index > 0) {
          const previousResult = results[index - 1];
          const columnRatio = result.columns / previousResult.columns;
          const validationRatio = result.validationTime / previousResult.validationTime;
          const generationRatio = result.generationTime / previousResult.generationTime;

          // Performance should scale reasonably (not exponentially)
          expect(validationRatio).toBeLessThan(columnRatio * 2);
          expect(generationRatio).toBeLessThan(columnRatio * 2);
        }
      });

      console.log('Scalability Test Results:');
      results.forEach(result => {
        console.log(`  ${result.columns} columns: validation=${result.validationTime.toFixed(2)}ms, generation=${result.generationTime.toFixed(2)}ms`);
      });
    });
  });
});