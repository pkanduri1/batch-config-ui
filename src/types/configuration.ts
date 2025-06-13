// Core type definitions for the batch configuration tool

export interface FieldMapping {
  fieldName: string;
  sourceField?: string;
  targetField: string;
  targetPosition: number;
  length: number;
  dataType: 'string' | 'numeric' | 'date';
  transformationType: 'constant' | 'source' | 'composite' | 'conditional' | 'blank';
  defaultValue?: string;
  pad?: 'left' | 'right';
  padChar?: string;
  format?: string;
  sourceFormat?: string;
  targetFormat?: string;
  value?: string; // For constant transformations
  
  // Conditional logic
  conditions?: Condition[];
  
  // Composite field sources
  sources?: CompositeSource[];
  transform?: string; // For composite: 'sum' | 'concat'
  delimiter?: string; // For composite concat
}

export interface Condition {
  ifExpr: string;
  then?: string;
  elseExpr?: string;
  elseIfExprs?: Condition[];
}

export interface CompositeSource {
  field: string;
  form?: string;
}

export interface Configuration {
  fileType: string;
  transactionType: string;
  sourceSystem: string;
  jobName: string;
  fields: Record<string, FieldMapping>;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  warnings: string[];
  errors: string[];
  summary?: {
    totalFields: number;
    recordLength: number;
    sourceFieldsUsed: number;
    constantFields: number;
    transactionTypes: number;
  };
}

export interface SourceSystem {
  id: string;
  name: string;
  description: string;
  jobs: string[];
  inputBasePath?: string;
  outputBasePath?: string;
}

export interface SourceField {
  name: string;
  dataType: string;
  maxLength?: number;
  nullable: boolean;
  description?: string;
}

export interface JobConfig {
  sourceSystem: string;
  jobName: string;
  files: FileConfig[];
  multiTxn?: boolean;
}

export interface FileConfig {
  inputPath?: string;
  transactionTypes?: string[];
  template?: string;
  target?: string;
  params?: Record<string, string>;
  sourceSystem?: string;
  jobName?: string;
  transactionType?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// UI State types
export interface ConfigurationState {
  currentConfiguration: Configuration | null;
  sourceFields: SourceField[];
  validationResult: ValidationResult | null;
  isLoading: boolean;
  isDirty: boolean;
}

export interface DropResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  } | null;
  draggableId: string;
}