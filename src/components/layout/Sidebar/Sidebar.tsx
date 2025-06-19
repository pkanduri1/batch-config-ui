// src/components/layout/Sidebar/Sidebar.tsx
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import {
  Dashboard,
  Storage,
  Settings,
  Code,
  PlayArrow,
  ExpandLess,
  ExpandMore,
  FolderOpen,
  Work,
  Close
} from '@mui/icons-material';
import { useConfigurationContext } from '../../../contexts/ConfigurationContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  drawerWidth: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, drawerWidth }) => {
  const {
    sourceSystems,
    selectedSourceSystem,
    selectedJob,
    selectSourceSystem,
    selectJob
  } = useConfigurationContext();

  const [expandedSystems, setExpandedSystems] = React.useState<string[]>([]);

  const toggleSystemExpanded = (systemId: string) => {
    setExpandedSystems(prev =>
      prev.includes(systemId)
        ? prev.filter(id => id !== systemId)
        : [...prev, systemId]
    );
  };

  const handleSystemSelect = async (systemId: string) => {
    try {
      await selectSourceSystem(systemId);
      if (!expandedSystems.includes(systemId)) {
        toggleSystemExpanded(systemId);
      }
    } catch (error) {
      console.error('Failed to select system:', error);
    }
  };

  const handleJobSelect = async (jobName: string) => {
    try {
      await selectJob(jobName);
    } catch (error) {
      console.error('Failed to select job:', error);
    }
  };

  const drawer = (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap>
          Navigation
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ display: { sm: 'none' } }}>
          <Close />
        </IconButton>
      </Box>
      
      <Divider />

      {/* Main Navigation */}
      <List>
        <ListItemButton>
          <ListItemIcon>
            <Dashboard />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        
        <ListItemButton disabled>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Configuration" />
        </ListItemButton>
        
        <ListItemButton disabled>
          <ListItemIcon>
            <Code />
          </ListItemIcon>
          <ListItemText primary="YAML Preview" />
        </ListItemButton>
        
        <ListItemButton disabled>
          <ListItemIcon>
            <PlayArrow />
          </ListItemIcon>
          <ListItemText primary="Testing" />
        </ListItemButton>
      </List>

      <Divider />

      {/* Source Systems */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Source Systems ({sourceSystems.length})
        </Typography>
      </Box>

      <List dense>
        {sourceSystems.map((system) => (
          <React.Fragment key={system.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedSourceSystem?.id === system.id}
                onClick={() => handleSystemSelect(system.id)}
              >
                <ListItemIcon>
                  <Storage />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap>
                        {system.name}
                      </Typography>
                      <Chip
                        label={system.jobs?.length || 0}
                        size="small"
                        variant="outlined"
                        sx={{ minWidth: 'auto', height: 16, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {system.systemType}
                    </Typography>
                  }
                />
                {system.jobs && system.jobs.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSystemExpanded(system.id);
                    }}
                  >
                    {expandedSystems.includes(system.id) ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </ListItemButton>
            </ListItem>

            {/* Jobs Submenu */}
            {system.jobs && (
              <Collapse
                in={expandedSystems.includes(system.id)}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {system.jobs.map((job) => (
                    <ListItemButton
                      key={job.name}
                      sx={{ pl: 4 }}
                      selected={selectedJob?.name === job.name}
                      onClick={() => handleJobSelect(job.name)}
                    >
                      <ListItemIcon>
                        <Work sx={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {job.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {job.description || 'Batch job'}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}

        {sourceSystems.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary" align="center">
                  No systems available
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>

      {/* Current Selection Info */}
      {selectedSourceSystem && (
        <>
          <Divider sx={{ mt: 2 }} />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Selection
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {selectedSourceSystem.name}
            </Typography>
            {selectedJob && (
              <Typography variant="body2" color="text.secondary">
                Job: {selectedJob.name}
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );

  return (
   // In Sidebar.tsx, replace the Drawer with:
<>
  {/* Mobile Drawer */}
  <Drawer
    variant="temporary"
    open={open}
    onClose={onClose}
    ModalProps={{ keepMounted: true }}
    sx={{
      display: { xs: 'block', sm: 'none' },
      '& .MuiDrawer-paper': { width: drawerWidth },
    }}
  >
    {drawer}
  </Drawer>
  
  {/* Desktop Drawer */}
  <Drawer
    variant="permanent"
    sx={{
      display: { xs: 'none', sm: 'block' },
      '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
    }}
    open
  >
    {drawer}
  </Drawer>
</>
  );
};