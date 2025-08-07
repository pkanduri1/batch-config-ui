// US002: Source System types for Template Configuration Enhancement

export interface SourceSystemInfo {
    id: string;
    name: string;
    type: 'ORACLE' | 'SQLSERVER' | 'FILE' | 'API';
    description?: string;
    connectionString?: string;
    enabled: boolean;
    createdDate: string;
    jobCount: number;
}

export interface CreateSourceSystemRequest {
    id: string;
    name: string;
    type: 'ORACLE' | 'SQLSERVER' | 'FILE' | 'API';
    description?: string;
    connectionString?: string;
    enabled?: boolean;
}

export interface SourceSystemWithUsage extends SourceSystemInfo {
    hasExistingConfiguration: boolean;
    existingJobName?: string;
    lastConfigured?: string;
    templateCount?: number;
}

export interface TemplateSourceMapping {
    id: number;
    fileType: string;
    transactionType: string;
    sourceSystemId: string;
    jobName: string;
    targetFieldName: string;
    sourceFieldName?: string;
    transformationType: 'source' | 'constant' | 'formula' | 'lookup' | 'conditional';
    transformationConfig?: string;
    targetPosition?: number;
    length?: number;
    dataType?: string;
    createdBy: string;
    createdDate: string;
    enabled: boolean;
}

export interface TemplateSourceMappingRequest {
    fileType: string;
    transactionType: string;
    sourceSystemId: string;
    jobName: string;
    fieldMappings: FieldMapping[];
    createdBy: string;
}

export interface TemplateSourceMappingResponse {
    fileType: string;
    transactionType: string;
    sourceSystemId: string;
    sourceSystemName?: string;
    jobName: string;
    fieldMappings?: FieldMapping[];
    mappingCount: number;
    createdBy?: string;
    createdDate?: string;
    modifiedBy?: string;
    modifiedDate?: string;
    success: boolean;
    message?: string;
}

export interface FieldMapping {
    targetFieldName: string;
    sourceFieldName?: string;
    transformationType: 'source' | 'constant' | 'formula' | 'lookup' | 'conditional';
    transformationConfig?: string;
    targetPosition?: number;
    length?: number;
    dataType?: string;
}