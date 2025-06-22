// src/services/api/templateApi.ts
import axios from 'axios';
import { 
  FileTypeTemplate, 
  FieldTemplate, 
  TemplateImportRequest, 
  TemplateImportResult,
  TemplateValidationResult,
  FieldMappingConfig,
  TemplateToConfigurationResult
} from '../../types/template';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with interceptors (matching existing pattern)
const templateApi = axios.create({
  baseURL: `${API_BASE_URL}/api/admin/templates`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
templateApi.interceptors.request.use(
  (config) => {
    console.log(`🔄 Template API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Template API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
templateApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Template API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Template API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const templateApiService = {
  // File Type Template operations
  async getAllFileTypes(): Promise<FileTypeTemplate[]> {
    try {
      const response = await templateApi.get<FileTypeTemplate[]>('/file-types');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch file types:', error);
      throw new Error('Failed to load template file types');
    }
  },

  async getFileTypeTemplate(fileType: string): Promise<FileTypeTemplate> {
    try {
      const response = await templateApi.get<FileTypeTemplate>(`/${fileType}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch template for ${fileType}:`, error);
      throw new Error(`Failed to load template: ${fileType}`);
    }
  },

  async getTransactionTypes(fileType: string): Promise<string[]> {
    try {
      const response = await templateApi.get<string[]>(`/${fileType}/transaction-types`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch transaction types for ${fileType}:`, error);
      return ['default']; // Fallback
    }
  },

  async getTemplateFields(fileType: string, transactionType: string): Promise<FieldTemplate[]> {
    try {
      const response = await templateApi.get<FieldTemplate[]>(`/${fileType}/${transactionType}/fields`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch fields for ${fileType}/${transactionType}:`, error);
      throw new Error(`Failed to load template fields: ${fileType}/${transactionType}`);
    }
  },

  // Configuration generation
  async createConfigurationFromTemplate(
    fileType: string, 
    transactionType: string, 
    sourceSystem: string, 
    jobName: string
  ): Promise<FieldMappingConfig> {
    try {
      const response = await templateApi.post<FieldMappingConfig>(
        `/${fileType}/${transactionType}/create-config`,
        null,
        {
          params: { sourceSystem, jobName, createdBy: 'ui-user' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create configuration from template:', error);
      throw new Error('Failed to generate configuration from template');
    }
  },

  // Configuration generation with metadata
  async createConfigurationFromTemplateWithMetadata(
    fileType: string, 
    transactionType: string, 
    sourceSystem: string, 
    jobName: string
  ): Promise<TemplateToConfigurationResult> {
    try {
      const config = await this.createConfigurationFromTemplate(fileType, transactionType, sourceSystem, jobName);
      const templateFields = await this.getTemplateFields(fileType, transactionType);
      
      // Add template metadata
      const result: TemplateToConfigurationResult = {
        ...config,
        templateMetadata: {
          fileType,
          transactionType,
          fieldsFromTemplate: templateFields.length,
          totalFields: config.fields.length,
          generatedAt: new Date().toISOString()
        }
      };
      
      return result;
    } catch (error) {
      console.error('Failed to create configuration with metadata:', error);
      throw new Error('Failed to generate configuration with template metadata');
    }
  },

  // Import operations
  async importFromExcel(file: File, fileType: string): Promise<TemplateImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      formData.append('createdBy', 'ui-user');

      const response = await templateApi.post<TemplateImportResult>(
        '/import/excel',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 // Extended timeout for file upload
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to import Excel template:', error);
      throw new Error('Excel import failed');
    }
  },

  async importFromJson(request: TemplateImportRequest): Promise<TemplateImportResult> {
    try {
      const response = await templateApi.post<TemplateImportResult>('/import/json', request);
      return response.data;
    } catch (error) {
      console.error('Failed to import JSON template:', error);
      throw new Error('JSON import failed');
    }
  },

  // Validation
  async validateTemplate(template: FileTypeTemplate): Promise<TemplateValidationResult> {
    try {
      const response = await templateApi.post<TemplateValidationResult>('/validate', template);
      return response.data;
    } catch (error) {
      console.error('Failed to validate template:', error);
      throw new Error('Template validation failed');
    }
  },

  // CRUD operations for templates
  async createFileTypeTemplate(template: FileTypeTemplate): Promise<void> {
    try {
      await templateApi.post('/file-types', template, {
        params: { createdBy: 'ui-user' }
      });
    } catch (error) {
      console.error('Failed to create file type template:', error);
      throw new Error('Failed to create template');
    }
  },

  async updateFileTypeTemplate(template: FileTypeTemplate): Promise<void> {
    try {
      await templateApi.put(`/file-types/${template.fileType}`, template, {
        params: { modifiedBy: 'ui-user' }
      });
    } catch (error) {
      console.error('Failed to update file type template:', error);
      throw new Error('Failed to update template');
    }
  },

  async deleteFileTypeTemplate(fileType: string): Promise<void> {
    try {
      await templateApi.delete(`/file-types/${fileType}`, {
        params: { deletedBy: 'ui-user' }
      });
    } catch (error) {
      console.error('Failed to delete file type template:', error);
      throw new Error('Failed to delete template');
    }
  }
};

export default templateApiService;