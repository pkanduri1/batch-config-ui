// src/pages/HomePage/HomePage.tsx
import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  Settings,
  Storage,
  PlayArrow,
  Refresh,
  ChevronRight,
  Info,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useConfigurationContext } from '../../contexts/ConfigurationContext';
import { useTheme } from '../../contexts/ThemeContext';

export const HomePage: React.FC = () => {
  const {
    sourceSystems,
    isLoading,
    error,
    refreshSourceSystems,
    selectSourceSystem,
    selectedSourceSystem
  } = useConfigurationContext();
  
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (sourceSystems.length === 0) {
      refreshSourceSystems();
    }
  }, [sourceSystems.length, refreshSourceSystems]);

  const handleSystemSelect = async (systemId: string) => {
    try {
      await selectSourceSystem(systemId);
    } catch (err) {
      console.error('Failed to select system:', err);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Batch Configuration Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Configure field mappings and transformations for batch processing systems
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {isLoading ? '...' : sourceSystems.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Source Systems
                  </Typography>
                </Box>
                <Storage color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {sourceSystems.reduce((total, system) => total + (system.jobs?.length || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Jobs
                  </Typography>
                </Box>
                <Settings color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {selectedSourceSystem ? '1' : '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active System
                  </Typography>
                </Box>
                <CheckCircle color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configurations
                  </Typography>
                </Box>
                <PlayArrow color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error State */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={refreshSourceSystems}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading source systems...</Typography>
        </Box>
      )}

      {/* Source Systems Grid */}
      {!isLoading && !error && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h5">Source Systems</Typography>
                  <IconButton onClick={refreshSourceSystems} color="primary">
                    <Refresh />
                  </IconButton>
                </Box>
                
                {sourceSystems.length === 0 ? (
                  <Alert severity="info" icon={<Info />}>
                    No source systems configured. Contact your administrator to set up source systems.
                  </Alert>
                ) : (
                  <List>
                    {sourceSystems.map((system, index) => (
                      <React.Fragment key={system.id}>
                        <ListItem
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: isDarkMode ? 'grey.800' : 'grey.100'
                            },
                            bgcolor: selectedSourceSystem?.id === system.id 
                              ? (isDarkMode ? 'primary.dark' : 'primary.light')
                              : 'transparent'
                          }}
                          onClick={() => handleSystemSelect(system.id)}
                        >
                          <ListItemIcon>
                            <Storage color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6">{system.name}</Typography>
                                <Chip 
                                  label={`${system.jobs?.length || 0} jobs`} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {system.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  System Type: {system.systemType || 'Standard'}
                                </Typography>
                              </Box>
                            }
                          />
                          <ChevronRight />
                        </ListItem>
                        {index < sourceSystems.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Quick Actions
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Settings />}
                    disabled={!selectedSourceSystem}
                    sx={{ mb: 1 }}
                  >
                    Configure Mappings
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Select a source system to configure field mappings
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PlayArrow />}
                    disabled
                    sx={{ mb: 1 }}
                  >
                    Test Configuration
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Test your configuration with sample data
                  </Typography>
                </Box>

                <Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Refresh />}
                    onClick={refreshSourceSystems}
                    sx={{ mb: 1 }}
                  >
                    Refresh Systems
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Reload source systems and job definitions
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Selected System Info */}
            {selectedSourceSystem && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Selected System
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {selectedSourceSystem.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedSourceSystem.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Available Jobs ({selectedSourceSystem.jobs?.length || 0})
                  </Typography>
                  {selectedSourceSystem.jobs?.map((job) => (
                    <Chip
                      key={job.name}
                      label={job.name}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
};