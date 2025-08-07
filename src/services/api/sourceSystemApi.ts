// US002: Source System API Service for Template Configuration Enhancement

import { SourceSystemInfo, CreateSourceSystemRequest, SourceSystemWithUsage } from '../../types/sourceSystem';

const API_BASE_URL = 'http://localhost:8080/api/api/admin/source-systems';

class SourceSystemApiService {
    
    /**
     * Get all enabled source systems for dropdown
     */
    async getAllSourceSystems(): Promise<SourceSystemInfo[]> {
        try {
            const response = await fetch(`${API_BASE_URL}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch source systems: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Source systems API response:', data);
            return data;
        } catch (error) {
            console.error('Error fetching source systems:', error);
            throw error;
        }
    }

    /**
     * Get source systems with usage information for a specific template
     */
    async getSourceSystemsWithUsage(fileType: string, transactionType: string): Promise<SourceSystemWithUsage[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/with-usage/${fileType}/${transactionType}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch source systems with usage: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Source systems with usage API response:', data);
            return data;
        } catch (error) {
            console.error('Error fetching source systems with usage:', error);
            throw error;
        }
    }

    /**
     * Get a specific source system by ID
     */
    async getSourceSystemById(id: string): Promise<SourceSystemInfo> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch source system: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Source system by ID API response:', data);
            return data;
        } catch (error) {
            console.error('Error fetching source system by ID:', error);
            throw error;
        }
    }

    /**
     * Create a new source system
     */
    async createSourceSystem(request: CreateSourceSystemRequest): Promise<SourceSystemInfo> {
        try {
            console.log('Creating source system:', request);
            
            const response = await fetch(`${API_BASE_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error(`Source system with ID '${request.id}' already exists`);
                }
                const errorText = await response.text();
                throw new Error(`Failed to create source system: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const data = await response.json();
            console.log('Created source system:', data);
            return data;
        } catch (error) {
            console.error('Error creating source system:', error);
            throw error;
        }
    }

    /**
     * Update an existing source system
     */
    async updateSourceSystem(id: string, request: CreateSourceSystemRequest): Promise<SourceSystemInfo> {
        try {
            console.log('Updating source system:', id, request);
            
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Source system with ID '${id}' not found`);
                }
                const errorText = await response.text();
                throw new Error(`Failed to update source system: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const data = await response.json();
            console.log('Updated source system:', data);
            return data;
        } catch (error) {
            console.error('Error updating source system:', error);
            throw error;
        }
    }

    /**
     * Delete (disable) a source system
     */
    async deleteSourceSystem(id: string): Promise<void> {
        try {
            console.log('Deleting source system:', id);
            
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Source system with ID '${id}' not found`);
                }
                const errorText = await response.text();
                throw new Error(`Failed to delete source system: ${response.status} ${response.statusText}. ${errorText}`);
            }

            console.log('Successfully deleted source system:', id);
        } catch (error) {
            console.error('Error deleting source system:', error);
            throw error;
        }
    }

    /**
     * Health check for the source system API
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
export const sourceSystemApiService = new SourceSystemApiService();