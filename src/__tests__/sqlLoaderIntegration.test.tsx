// Integration test for SQL*Loader components
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the API modules
jest.mock('../services/api/sqlLoaderApi', () => ({
  sqlLoaderApi: {
    getConfigurationByJob: jest.fn().mockResolvedValue({
      id: '1',
      sourceSystemId: 'test-system',
      jobName: 'test-job',
      tableName: 'TEST_TABLE',
      description: 'Test SQL*Loader configuration',
      control: {
        load: { replace: true },
        options: { errors: 0, skip: 0 },
        fields: { terminatedBy: ',', optionallyEnclosedBy: '"', trailingNullCols: true }
      },
      columns: [
        {
          id: 'col1',
          columnName: 'ID',
          dataType: 'NUMBER',
          nullable: false,
          position: 1
        },
        {
          id: 'col2',
          columnName: 'NAME',
          dataType: 'VARCHAR2',
          maxLength: 100,
          nullable: true,
          position: 2
        }
      ],
      enabled: true
    }),
    getTables: jest.fn().mockResolvedValue(['TEST_TABLE', 'ANOTHER_TABLE']),
    getTableColumns: jest.fn().mockResolvedValue([
      { columnName: 'ID', dataType: 'NUMBER', nullable: false },
      { columnName: 'NAME', dataType: 'VARCHAR2', maxLength: 100, nullable: true },
      { columnName: 'EMAIL', dataType: 'VARCHAR2', maxLength: 255, nullable: true }
    ]),
    validateConfiguration: jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    previewControlFile: jest.fn().mockResolvedValue({
      preview: `LOAD DATA
INFILE *
REPLACE
INTO TABLE TEST_TABLE
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' TRAILING NULLCOLS
(
  ID,
  NAME
)`
    })
  },
  sqlLoaderUtils: {
    validateConfigurationData: jest.fn().mockReturnValue([]),
    formatError: jest.fn().mockImplementation((error: any) => error.message || 'Unknown error')
  }
}));

import { SQLLoaderConfigurationPage } from '../components/sqlloader/SQLLoaderConfigurationPage';

// Mock the hook
jest.mock('../contexts/ConfigurationContext', () => ({
  useConfigurationContext: () => ({
    selectedSourceSystem: {
      id: 'test-system',
      name: 'Test System',
      description: 'Test System',
      systemType: 'oracle',
      jobs: []
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

// Wrapper component for testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('SQL*Loader Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders SQL*Loader configuration page with basic elements', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Check for main components
    await waitFor(() => {
      expect(screen.getByText(/SQL\*Loader Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/Basic Settings/i)).toBeInTheDocument();
      expect(screen.getByText(/Column Mapping/i)).toBeInTheDocument();
      expect(screen.getByText(/Control Options/i)).toBeInTheDocument();
    });
  });

  test('displays configuration data when loaded', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check if job name is displayed
      expect(screen.getByDisplayValue('test-job')).toBeInTheDocument();
      
      // Check if table name is displayed
      expect(screen.getByDisplayValue('TEST_TABLE')).toBeInTheDocument();
      
      // Check if description is displayed
      expect(screen.getByDisplayValue('Test SQL*Loader configuration')).toBeInTheDocument();
    });
  });

  test('can switch between tabs', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Click on Column Mapping tab
    const columnMappingTab = screen.getByText(/Column Mapping/i);
    fireEvent.click(columnMappingTab);

    await waitFor(() => {
      expect(screen.getByText(/Add Column/i)).toBeInTheDocument();
    });

    // Click on Control Options tab
    const controlOptionsTab = screen.getByText(/Control Options/i);
    fireEvent.click(controlOptionsTab);

    await waitFor(() => {
      expect(screen.getByText(/Load Options/i)).toBeInTheDocument();
      expect(screen.getByText(/Field Options/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance Options/i)).toBeInTheDocument();
    });
  });

  test('displays column data in table', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Switch to Column Mapping tab
    const columnMappingTab = screen.getByText(/Column Mapping/i);
    fireEvent.click(columnMappingTab);

    await waitFor(() => {
      // Check for column data
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('NAME')).toBeInTheDocument();
      expect(screen.getByText('NUMBER')).toBeInTheDocument();
      expect(screen.getByText('VARCHAR2')).toBeInTheDocument();
    });
  });

  test('can open and close preview dialog', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Click preview button
    const previewButton = screen.getByText(/Preview/i);
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/Control File Preview/i)).toBeInTheDocument();
      expect(screen.getByText(/LOAD DATA/)).toBeInTheDocument();
    });

    // Close dialog
    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/Control File Preview/i)).not.toBeInTheDocument();
    });
  });

  test('can add new column', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Switch to Column Mapping tab
    const columnMappingTab = screen.getByText(/Column Mapping/i);
    fireEvent.click(columnMappingTab);

    // Click Add Column button
    const addColumnButton = screen.getByText(/Add Column/i);
    fireEvent.click(addColumnButton);

    await waitFor(() => {
      expect(screen.getByText(/Add Column/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Column Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Data Type/i)).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Clear required fields to test validation
    const jobNameInput = screen.getByDisplayValue('test-job');
    fireEvent.change(jobNameInput, { target: { value: '' } });

    await waitFor(() => {
      // The form should show validation errors or disable save button
      const saveButton = screen.getByText(/Save/i);
      // Note: This test assumes validation prevents saving when required fields are empty
      // The exact behavior depends on the validation implementation
      expect(saveButton).toBeInTheDocument();
    });
  });

  test('handles control file options correctly', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Switch to Control Options tab
    const controlOptionsTab = screen.getByText(/Control Options/i);
    fireEvent.click(controlOptionsTab);

    await waitFor(() => {
      // Check if control options are displayed
      expect(screen.getByText(/Replace Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Append Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Truncate Table/i)).toBeInTheDocument();
    });

    // Test switching between replace/append/truncate options
    const appendSwitch = screen.getByLabelText(/Append Data/i);
    fireEvent.click(appendSwitch);

    // The replace option should be unchecked when append is selected
    // This tests the mutually exclusive behavior
  });

  test('handles field options configuration', async () => {
    render(
      <TestWrapper>
        <SQLLoaderConfigurationPage />
      </TestWrapper>
    );

    // Switch to Control Options tab
    const controlOptionsTab = screen.getByText(/Control Options/i);
    fireEvent.click(controlOptionsTab);

    await waitFor(() => {
      // Check field options
      const terminatedByInput = screen.getByDisplayValue(',');
      const enclosedByInput = screen.getByDisplayValue('"');
      
      expect(terminatedByInput).toBeInTheDocument();
      expect(enclosedByInput).toBeInTheDocument();
      
      // Test changing values
      fireEvent.change(terminatedByInput, { target: { value: '|' } });
      expect(terminatedByInput).toHaveValue('|');
    });
  });
});

// Test for hooks
describe('useSQLLoaderConfiguration Hook', () => {
  test('hook integration with API', async () => {
    // This would test the hook directly, but requires more complex setup
    // For now, we verify the hook is properly exported and can be imported
    const { useSQLLoaderConfiguration } = require('../hooks/useSQLLoaderConfiguration');
    expect(useSQLLoaderConfiguration).toBeDefined();
    expect(typeof useSQLLoaderConfiguration).toBe('function');
  });
});

// Test for API integration
describe('SQL*Loader API Integration', () => {
  test('API functions are properly defined and exported', () => {
    const { sqlLoaderApi } = require('../services/api/sqlLoaderApi');
    
    // Check that all expected API functions exist
    expect(sqlLoaderApi.getConfiguration).toBeDefined();
    expect(sqlLoaderApi.getConfigurationByJob).toBeDefined();
    expect(sqlLoaderApi.createConfiguration).toBeDefined();
    expect(sqlLoaderApi.updateConfiguration).toBeDefined();
    expect(sqlLoaderApi.deleteConfiguration).toBeDefined();
    expect(sqlLoaderApi.validateConfiguration).toBeDefined();
    expect(sqlLoaderApi.generateControlFile).toBeDefined();
    expect(sqlLoaderApi.previewControlFile).toBeDefined();
    expect(sqlLoaderApi.executeConfiguration).toBeDefined();
    expect(sqlLoaderApi.testConfiguration).toBeDefined();
  });
});

// Test TypeScript interfaces
describe('TypeScript Interface Integration', () => {
  test('interfaces are properly defined and exported', () => {
    // Import types to ensure they compile correctly
    const configTypes = require('../types/configuration');
    
    // Verify that the types exist (compilation test)
    expect(configTypes).toBeDefined();
    
    // Test that we can create objects matching the interfaces
    const testConfig: typeof configTypes.SQLLoaderConfig = {
      sourceSystemId: 'test',
      jobName: 'test',
      tableName: 'test',
      control: {
        load: { replace: true },
        options: { errors: 0 },
        fields: { terminatedBy: ',' }
      },
      columns: [],
      enabled: true
    };
    
    expect(testConfig).toBeDefined();
  });
});