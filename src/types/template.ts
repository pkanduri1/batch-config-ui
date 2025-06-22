// src/types/template.ts
import { FieldMapping } from './configuration';

export interface FieldTemplate {
  fileType: string;
  transactionType: string;
  fieldName: string;
  targetPosition: number;
  length: number;
  dataType: 'String' | 'Numeric' | 'Date';
  format?: string;
  required: 'Y' | 'N';
  description?: string;
  version?: number;
  enabled?: string;
  sourceField?: string; // For configuration mapping
  transformationType?: 'source' | 'constant' | 'composite' | 'conditional';
}

export interface FileTypeTemplate {
  fileType: string;
  description: string;
  totalFields: number;
  recordLength: number;
  enabled: string;
  fields?: FieldTemplate[];
}

export interface TemplateImportRequest {
  fileType: string;
  description: string;
  createdBy: string;
  replaceExisting: boolean;
  fields: FieldTemplate[];
}

export interface TemplateImportResult {
  success: boolean;
  fileType: string;
  fieldsImported: number;
  fieldsSkipped: number;
  errors: string[];
  warnings: string[];
  message: string;
}

// Define FieldMappingConfig to match backend API response
export interface FieldMappingConfig {
  sourceSystem: string;
  jobName: string;
  transactionType: string;
  description?: string;
  fields: FieldMapping[];
  createdDate?: string;
  createdBy?: string;
  version?: number;
}

// Extended result with template metadata
export interface TemplateToConfigurationResult extends FieldMappingConfig {
  templateMetadata: {
    fileType: string;
    transactionType: string;
    fieldsFromTemplate: number;
    totalFields: number;
    templateVersion?: number;
    generatedAt: string;
  };
}

// Extend existing ValidationResult for templates
export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicatePositions?: number[];
  missingRequiredFields?: string[];
  conflictingFields?: string[];
}

