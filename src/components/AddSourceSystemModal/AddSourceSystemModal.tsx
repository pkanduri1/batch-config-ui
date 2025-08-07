import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Alert,
    CircularProgress,
    Box
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { sourceSystemApiService } from '../../services/api/sourceSystemApi';
import { SourceSystemInfo, CreateSourceSystemRequest } from '../../types/sourceSystem';

interface AddSourceSystemModalProps {
    open: boolean;
    onClose: () => void;
    onSourceSystemCreated: (newSystem: SourceSystemInfo) => void;
}

export const AddSourceSystemModal: React.FC<AddSourceSystemModalProps> = ({
    open,
    onClose,
    onSourceSystemCreated
}) => {
    const [formData, setFormData] = useState<CreateSourceSystemRequest>({
        id: '',
        name: '',
        type: 'ORACLE',
        description: '',
        connectionString: '',
        enabled: true
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

    const validateForm = (): boolean => {
        const errors: {[key: string]: string} = {};

        if (!formData.id || formData.id.trim() === '') {
            errors.id = 'System ID is required';
        } else if (!/^[A-Z0-9_]+$/.test(formData.id)) {
            errors.id = 'System ID must contain only uppercase letters, numbers, and underscores';
        } else if (formData.id.length > 50) {
            errors.id = 'System ID must not exceed 50 characters';
        }

        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'System name is required';
        } else if (formData.name.length > 100) {
            errors.name = 'System name must not exceed 100 characters';
        }

        if (formData.description && formData.description.length > 500) {
            errors.description = 'Description must not exceed 500 characters';
        }

        if (formData.connectionString && formData.connectionString.length > 1000) {
            errors.connectionString = 'Connection string must not exceed 1000 characters';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof CreateSourceSystemRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'id' ? value.toUpperCase() : value
        }));
        
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        
        if (error) {
            setError(null);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Submitting source system creation:', formData);
            const createdSystem = await sourceSystemApiService.createSourceSystem(formData);
            
            console.log('Source system created successfully:', createdSystem);
            onSourceSystemCreated(createdSystem);
            handleClose();
            
        } catch (error) {
            console.error('Error creating source system:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create source system';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                id: '',
                name: '',
                type: 'ORACLE',
                description: '',
                connectionString: '',
                enabled: true
            });
            setError(null);
            setValidationErrors({});
            onClose();
        }
    };

    const generateSampleId = () => {
        if (formData.name) {
            const suggested = formData.name
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                .substring(0, 20);
            handleInputChange('id', suggested);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                <Add color="primary" />
                <Typography variant="h6" component="span">
                    Add New Source System
                </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create a new source system that can be used for template configurations.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="System ID"
                            value={formData.id}
                            onChange={(e) => handleInputChange('id', e.target.value)}
                            error={!!validationErrors.id}
                            helperText={validationErrors.id || "Unique identifier (e.g., LOAN, CRM, BILLING)"}
                            required
                            disabled={loading}
                            placeholder="e.g., LOAN_SYSTEM"
                        />
                        <Button 
                            size="small" 
                            onClick={generateSampleId}
                            sx={{ mt: 0.5 }}
                            disabled={!formData.name || loading}
                        >
                            Generate from Name
                        </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="System Name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            error={!!validationErrors.name}
                            helperText={validationErrors.name || "Display name (e.g., Loan Origination System)"}
                            required
                            disabled={loading}
                            placeholder="e.g., Loan Origination System"
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth disabled={loading}>
                            <InputLabel>Connection Type</InputLabel>
                            <Select
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                label="Connection Type"
                            >
                                <MenuItem value="ORACLE">
                                    <Box>
                                        <Typography variant="body2">Oracle Database</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Oracle database connection
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="SQLSERVER">
                                    <Box>
                                        <Typography variant="body2">SQL Server</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Microsoft SQL Server connection
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="FILE">
                                    <Box>
                                        <Typography variant="body2">File System</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            File-based data source
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="API">
                                    <Box>
                                        <Typography variant="body2">REST API</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            REST API endpoint
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Status: <strong>Enabled</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            New source systems are enabled by default
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            error={!!validationErrors.description}
                            helperText={validationErrors.description || "Brief description of the source system (optional)"}
                            multiline
                            rows={2}
                            disabled={loading}
                            placeholder="e.g., Main loan origination system for mortgage and personal loans"
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Connection String"
                            value={formData.connectionString}
                            onChange={(e) => handleInputChange('connectionString', e.target.value)}
                            error={!!validationErrors.connectionString}
                            helperText={validationErrors.connectionString || "Connection details (optional, can be configured later)"}
                            disabled={loading}
                            placeholder="e.g., jdbc:oracle:thin:@localhost:1521:orcl"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button 
                    onClick={handleClose}
                    disabled={loading}
                    startIcon={<Close />}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    disabled={loading || !formData.id || !formData.name}
                    startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                >
                    {loading ? 'Creating...' : 'Create Source System'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};