// US002: Template Source Mapping API Service for Template Configuration Enhancement

import { TemplateSourceMappingRequest, TemplateSourceMappingResponse, FieldMapping } from '../../types/sourceSystem';

const API_BASE_URL = 'http://localhost:8080/api/api/admin/template-source-mappings';

class TemplateSourceMappingApiService {
    
    /**
     * Save template-source field mappings
     */
    async saveTemplateSourceMapping(request: TemplateSourceMappingRequest): Promise<TemplateSourceMappingResponse> {
        try {
            console.log('Saving template-source mappings:', request);
            
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save template-source mappings: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const data = await response.json();
            console.log('Template-source mappings saved successfully:', data);
            return data;
        } catch (error) {
            console.error('Error saving template-source mappings:', error);
            throw error;
        }
    }

    /**
     * Get existing template-source mappings for a specific combination
     */
    async getTemplateSourceMapping(fileType: string, transactionType: string, sourceSystemId: string): Promise<TemplateSourceMappingResponse | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/${fileType}/${transactionType}/${sourceSystemId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 404) {
                console.log('No existing mappings found for', fileType, transactionType, sourceSystemId);
                return null;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch template-source mappings: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Retrieved template-source mappings:', data);
            return data;
        } catch (error) {
            console.error('Error fetching template-source mappings:', error);
            throw error;
        }
    }

    /**
     * Get all template-source mappings for a specific template
     */
    async getTemplateSourceMappings(fileType: string, transactionType: string): Promise<TemplateSourceMappingResponse[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/${fileType}/${transactionType}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch template-source mappings: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Retrieved all template-source mappings for template:', data);
            return data;
        } catch (error) {
            console.error('Error fetching template-source mappings for template:', error);
            throw error;
        }
    }

    /**
     * Update existing template-source mappings
     */
    async updateTemplateSourceMapping(fileType: string, transactionType: string, sourceSystemId: string, request: TemplateSourceMappingRequest): Promise<TemplateSourceMappingResponse> {
        try {
            console.log('Updating template-source mappings:', fileType, transactionType, sourceSystemId, request);
            
            const response = await fetch(`${API_BASE_URL}/${fileType}/${transactionType}/${sourceSystemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update template-source mappings: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const data = await response.json();
            console.log('Template-source mappings updated successfully:', data);
            return data;
        } catch (error) {
            console.error('Error updating template-source mappings:', error);
            throw error;
        }
    }

    /**
     * Delete template-source mappings
     */
    async deleteTemplateSourceMapping(fileType: string, transactionType: string, sourceSystemId: string): Promise<void> {
        try {
            console.log('Deleting template-source mappings:', fileType, transactionType, sourceSystemId);
            
            const response = await fetch(`${API_BASE_URL}/${fileType}/${transactionType}/${sourceSystemId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete template-source mappings: ${response.status} ${response.statusText}. ${errorText}`);
            }

            console.log('Template-source mappings deleted successfully');
        } catch (error) {
            console.error('Error deleting template-source mappings:', error);
            throw error;
        }
    }

    /**
     * Get template usage statistics for a source system
     */
    async getUsageBySourceSystem(sourceSystemId: string): Promise<TemplateSourceMappingResponse[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/usage/${sourceSystemId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch usage for source system: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Retrieved usage for source system:', data);
            return data;
        } catch (error) {
            console.error('Error fetching usage for source system:', error);
            throw error;
        }
    }

    /**
     * Health check for the template source mapping API
     */
    async healthCheck(): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.text();
            return data;
        } catch (error) {
            console.error('Error in health check:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const templateSourceMappingApiService = new TemplateSourceMappingApiService();