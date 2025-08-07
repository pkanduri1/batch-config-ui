// SQL*Loader End-to-End Integration Tests - Phase 1.4
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { SQLLoaderConfig } from '../types/configuration';

// Mock the services
jest.mock('../services/api/sqlLoaderApi', () => ({
  sqlLoaderApi: {
    getConfigurations: jest.fn(),
    getConfiguration: jest.fn(),
    getConfigurationByJob: jest.fn(),
    createConfiguration: jest.fn(),
    updateConfiguration: jest.fn(),
    deleteConfiguration: jest.fn(),
    getTables: jest.fn(),
    getTableColumns: jest.fn(),
    validateConfiguration: jest.fn(),
    generateControlFile: jest.fn(),
    previewControlFile: jest.fn(),
    executeConfiguration: jest.fn(),
    testConfiguration: jest.fn(),
    getExecutionHistory: jest.fn(),
    getConfigurationStatus: jest.fn(),
    exportConfiguration: jest.fn(),
    importConfiguration: jest.fn()
  },
  sqlLoaderUtils: {
    validateConfigurationData: jest.fn(),
    generateDefaultControlFile: jest.fn(),
    formatError: jest.fn()
  }
}));

jest.mock('../contexts/ConfigurationContext', () => ({
  useConfigurationContext: () => ({
    selectedSourceSystem: {
      id: 'TEST_SYSTEM',
      name: 'Test System',
      description: 'Test System Description',
      systemType: 'oracle',
      jobs: [{ name: 'test_job', sourceSystem: 'TEST_SYSTEM', jobName: 'test_job', files: [] }]
    },
    selectedJob: null,
    sourceSystems: [],
    sourceFields: [],
    fieldMappings: [],
    isLoading: false,
    error: null,
    selectSourceSystem: jest.fn(),
    selectJob: jest.fn(),
    addFieldMapping: jest.fn(),
    reorderFieldMappings: jest.fn()
  })
}));

// Import components after mocking
import { SQLLoaderConfigurationPage } from '../components/sqlloader/SQLLoaderConfigurationPage';
import { sqlLoaderApi, sqlLoaderUtils } from '../services/api/sqlLoaderApi';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('SQL*Loader End-to-End Integration Tests', () => {
  const mockConfig: SQLLoaderConfig = {
    id: 'e2e-test-config',
    sourceSystemId: 'E2E_TEST_SYSTEM',
    jobName: 'e2e_integration_test',
    tableName: 'E2E_TEST_TABLE',
    description: 'End-to-end integration test configuration',
    control: {
      load: { replace: true },
      options: { errors: 100, skip: 0, rows: 1000 },
      fields: {
        terminatedBy: ',',
        optionallyEnclosedBy: '"',
        trailingNullCols: true
      }
    },
    columns: [
      {
        id: 'e2e_col_1',
        columnName: 'CUSTOMER_ID',
        dataType: 'NUMBER',
        nullable: false,
        position: 1,
        validationRules: ['not_null', 'positive']
      },
      {
        id: 'e2e_col_2',
        columnName: 'CUSTOMER_NAME',
        dataType: 'VARCHAR2',
        maxLength: 255,
        nullable: true,
        position: 2,
        optionallyEnclosed: true
      },
      {
        id: 'e2e_col_3',
        columnName: 'REGISTRATION_DATE',
        dataType: 'DATE',
        dateFormat: 'DD/MM/YYYY',
        nullable: true,
        position: 3
      },
      {
        id: 'e2e_col_4',
        columnName: 'ACCOUNT_BALANCE',
        dataType: 'NUMBER',
        precision: 15,
        scale: 2,
        nullable: true,
        position: 4,
        defaultValue: '0.00'
      }
    ],
    enabled: true,
    createdBy: 'e2e_test_user',
    createdDate: '2024-01-01T00:00:00.000Z',
    lastModified: '2024-01-01T00:00:00.000Z',
    version: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (sqlLoaderApi.getConfigurationByJob as jest.Mock).mockResolvedValue(mockConfig);
    (sqlLoaderApi.getTables as jest.Mock).mockResolvedValue(['E2E_TEST_TABLE', 'ANOTHER_TABLE']);
    (sqlLoaderApi.getTableColumns as jest.Mock).mockResolvedValue([
      { columnName: 'CUSTOMER_ID', dataType: 'NUMBER', nullable: false },
      { columnName: 'CUSTOMER_NAME', dataType: 'VARCHAR2', maxLength: 255, nullable: true },
      { columnName: 'REGISTRATION_DATE', dataType: 'DATE', nullable: true },
      { columnName: 'ACCOUNT_BALANCE', dataType: 'NUMBER', precision: 15, scale: 2, nullable: true }
    ]);
    (sqlLoaderApi.validateConfiguration as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    (sqlLoaderApi.previewControlFile as jest.Mock).mockResolvedValue({
      preview: `LOAD DATA
INFILE *
REPLACE
INTO TABLE E2E_TEST_TABLE
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' TRAILING NULLCOLS
(
  CUSTOMER_ID,
  CUSTOMER_NAME,
  REGISTRATION_DATE DATE "DD/MM/YYYY",
  ACCOUNT_BALANCE DEFAULTIF CUSTOMER_ID=BLANKS
)`
    });
    (sqlLoaderUtils.validateConfigurationData as jest.Mock).mockReturnValue([]);
    (sqlLoaderUtils.generateDefaultControlFile as jest.Mock).mockReturnValue('-- Generated Control File');
  });

  describe('Complete Configuration Workflow', () => {
    test('creates new SQL*Loader configuration from scratch', async () => {
      const user = userEvent.setup();
      
      // Mock API for new configuration
      (sqlLoaderApi.getConfigurationByJob as jest.Mock).mockResolvedValue(null);
      (sqlLoaderApi.createConfiguration as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConfig
      });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      // Fill in basic configuration
      const jobNameInput = screen.getByLabelText(/Job Name/i);
      await user.clear(jobNameInput);
      await user.type(jobNameInput, 'new_integration_job');

      const tableNameSelect = screen.getByLabelText(/Table Name/i);
      await user.click(tableNameSelect);
      await user.click(screen.getByText('E2E_TEST_TABLE'));

      const descriptionInput = screen.getByLabelText(/Description/i);
      await user.type(descriptionInput, 'New configuration created via E2E test');

      // Navigate to Column Mapping tab
      const columnMappingTab = screen.getByRole('tab', { name: /Column Mapping/i });
      await user.click(columnMappingTab);

      await waitFor(() => {
        expect(screen.getByText(/Add Column/i)).toBeInTheDocument();
      });

      // Add columns
      const addColumnButton = screen.getByText(/Add Column/i);
      await user.click(addColumnButton);

      // Fill in column details (assuming modal appears)
      await waitFor(() => {
        const columnNameInput = screen.getByLabelText(/Column Name/i);
        expect(columnNameInput).toBeInTheDocument();
      });

      // Navigate to Control Options tab
      const controlOptionsTab = screen.getByRole('tab', { name: /Control Options/i });
      await user.click(controlOptionsTab);

      await waitFor(() => {
        expect(screen.getByText(/Load Options/i)).toBeInTheDocument();
      });

      // Configure load options
      const replaceDataToggle = screen.getByLabelText(/Replace Data/i);
      if (!replaceDataToggle.checked) {
        await user.click(replaceDataToggle);
      }

      // Save configuration
      const saveButton = screen.getByText(/Save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(sqlLoaderApi.createConfiguration).toHaveBeenCalled();
      });
    });

    test('edits existing SQL*Loader configuration', async () => {
      const user = userEvent.setup();
      
      (sqlLoaderApi.updateConfiguration as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockConfig, description: 'Updated description' }
      });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      // Wait for configuration to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('e2e_integration_test')).toBeInTheDocument();
      });

      // Edit description
      const descriptionInput = screen.getByDisplayValue(/End-to-end integration test configuration/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated integration test configuration');

      // Navigate to Column Mapping tab
      const columnMappingTab = screen.getByRole('tab', { name: /Column Mapping/i });
      await user.click(columnMappingTab);

      await waitFor(() => {
        expect(screen.getByText('CUSTOMER_ID')).toBeInTheDocument();
        expect(screen.getByText('CUSTOMER_NAME')).toBeInTheDocument();
      });

      // Edit a column
      const editButtons = screen.getAllByLabelText(/Edit/i);
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
        
        // Wait for edit dialog
        await waitFor(() => {
          const maxLengthInput = screen.getByLabelText(/Max Length/i);
          if (maxLengthInput) {
            user.clear(maxLengthInput);
            user.type(maxLengthInput, '300');
          }
        });
      }

      // Save changes
      const saveButton = screen.getByText(/Save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(sqlLoaderApi.updateConfiguration).toHaveBeenCalled();
      });
    });
  });

  describe('Validation and Testing Workflow', () => {
    test('validates configuration and shows results', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      // Click validate button
      const validateButton = screen.getByText(/Validate/i);
      await user.click(validateButton);

      await waitFor(() => {
        expect(sqlLoaderApi.validateConfiguration).toHaveBeenCalled();
      });

      // Expect validation results to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Validation Successful/i)).toBeInTheDocument();
      });
    });

    test('handles validation errors and warnings', async () => {
      const user = userEvent.setup();
      
      // Mock validation with errors
      (sqlLoaderApi.validateConfiguration as jest.Mock).mockResolvedValue({
        isValid: false,
        errors: [
          { code: 'MISSING_REQUIRED_FIELD', message: 'Column CUSTOMER_ID cannot be null', severity: 'ERROR' },
          { code: 'INVALID_DATA_TYPE', message: 'Invalid data type for REGISTRATION_DATE', severity: 'ERROR' }
        ],
        warnings: [
          { code: 'PERFORMANCE_WARNING', message: 'Large table without parallel option may be slow', severity: 'WARNING' }
        ]
      });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      const validateButton = screen.getByText(/Validate/i);
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/Validation Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/Column CUSTOMER_ID cannot be null/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid data type for REGISTRATION_DATE/i)).toBeInTheDocument();
        expect(screen.getByText(/Large table without parallel option may be slow/i)).toBeInTheDocument();
      });
    });

    test('tests configuration with sample data', async () => {
      const user = userEvent.setup();
      
      (sqlLoaderApi.testConfiguration as jest.Mock).mockResolvedValue({
        success: true,
        recordsProcessed: 1000,
        recordsRejected: 5,
        executionTime: 45.2,
        message: 'Test completed successfully'
      });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      const testButton = screen.getByText(/Test/i);
      await user.click(testButton);

      await waitFor(() => {
        expect(sqlLoaderApi.testConfiguration).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Test completed successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/1000/i)).toBeInTheDocument(); // Records processed
        expect(screen.getByText(/5/i)).toBeInTheDocument(); // Records rejected
      });
    });
  });

  describe('Control File Management Workflow', () => {
    test('previews generated control file', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      const previewButton = screen.getByText(/Preview/i);
      await user.click(previewButton);

      await waitFor(() => {
        expect(sqlLoaderApi.previewControlFile).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Control File Preview/i)).toBeInTheDocument();
        expect(screen.getByText(/LOAD DATA/)).toBeInTheDocument();
        expect(screen.getByText(/E2E_TEST_TABLE/)).toBeInTheDocument();
      });

      // Close preview dialog
      const closeButton = screen.getByText(/Close/i);
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Control File Preview/i)).not.toBeInTheDocument();
      });
    });

    test('generates and downloads control file', async () => {
      const user = userEvent.setup();
      
      (sqlLoaderApi.generateControlFile as jest.Mock).mockResolvedValue({
        controlFileContent: `LOAD DATA
INFILE 'e2e_test.dat'
REPLACE
INTO TABLE E2E_TEST_TABLE
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' TRAILING NULLCOLS
(
  CUSTOMER_ID,
  CUSTOMER_NAME,
  REGISTRATION_DATE DATE "DD/MM/YYYY",
  ACCOUNT_BALANCE DEFAULTIF CUSTOMER_ID=BLANKS
)`,
        fileName: 'e2e_test.ctl'
      });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      const generateButton = screen.getByText(/Generate Control File/i);
      await user.click(generateButton);

      await waitFor(() => {
        expect(sqlLoaderApi.generateControlFile).toHaveBeenCalled();
      });

      // Verify download was initiated (in a real environment, this would download the file)
      await waitFor(() => {
        expect(screen.getByText(/Control file generated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Import and Export Workflow', () => {
    test('exports configuration to JSON', async () => {
      const user = userEvent.setup();
      
      (sqlLoaderApi.exportConfiguration as jest.Mock).mockResolvedValue({
        configurationData: JSON.stringify(mockConfig),
        fileName: 'e2e_config_export.json'
      });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      // Assuming export button exists in the UI
      const moreOptionsButton = screen.getByLabelText(/More options/i);
      await user.click(moreOptionsButton);

      const exportButton = screen.getByText(/Export Configuration/i);
      await user.click(exportButton);

      await waitFor(() => {
        expect(sqlLoaderApi.exportConfiguration).toHaveBeenCalledWith(mockConfig.id);
      });
    });

    test('imports configuration from JSON', async () => {
      const user = userEvent.setup();
      
      (sqlLoaderApi.importConfiguration as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConfig,
        message: 'Configuration imported successfully'
      });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      // Simulate file upload
      const fileInput = screen.getByLabelText(/Import Configuration/i);
      const file = new File([JSON.stringify(mockConfig)], 'import_config.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(sqlLoaderApi.importConfiguration).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Configuration imported successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (sqlLoaderApi.validateConfiguration as jest.Mock).mockRejectedValue(
        new Error('Network error: Unable to connect to validation service')
      );

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      const validateButton = screen.getByText(/Validate/i);
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        expect(screen.getByText(/Unable to connect to validation service/i)).toBeInTheDocument();
      });

      // Verify retry functionality
      const retryButton = screen.getByText(/Retry/i);
      expect(retryButton).toBeInTheDocument();
    });

    test('recovers from temporary failures', async () => {
      const user = userEvent.setup();
      
      // Mock initial failure then success
      (sqlLoaderApi.validateConfiguration as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          isValid: true,
          errors: [],
          warnings: []
        });

      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      const validateButton = screen.getByText(/Validate/i);
      await user.click(validateButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Temporary failure/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText(/Retry/i);
      await user.click(retryButton);

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText(/Validation Successful/i)).toBeInTheDocument();
      });
    });

    test('prevents data loss on navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('e2e_integration_test')).toBeInTheDocument();
      });

      // Make changes to the configuration
      const descriptionInput = screen.getByDisplayValue(/End-to-end integration test configuration/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Modified configuration');

      // Attempt to navigate away (simulate)
      // In a real scenario, this would trigger a beforeunload event or router guard
      
      // For testing purposes, verify that dirty state is tracked
      expect(screen.getByText(/Unsaved Changes/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Responsiveness', () => {
    test('handles large configuration efficiently', async () => {
      const largeConfig: SQLLoaderConfig = {
        ...mockConfig,
        columns: Array.from({ length: 200 }, (_, index) => ({
          id: `large_col_${index + 1}`,
          columnName: `LARGE_COLUMN_${index + 1}`,
          dataType: index % 2 === 0 ? 'VARCHAR2' : 'NUMBER',
          maxLength: index % 2 === 0 ? 255 : undefined,
          nullable: true,
          position: index + 1
        }))
      };

      (sqlLoaderApi.getConfigurationByJob as jest.Mock).mockResolvedValue(largeConfig);

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <SQLLoaderConfigurationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      });

      // Navigate to Column Mapping tab
      const user = userEvent.setup();
      const columnMappingTab = screen.getByRole('tab', { name: /Column Mapping/i });
      await user.click(columnMappingTab);

      await waitFor(() => {
        expect(screen.getByText('LARGE_COLUMN_1')).toBeInTheDocument();
        expect(screen.getByText('LARGE_COLUMN_200')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time even with large datasets
      expect(renderTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});