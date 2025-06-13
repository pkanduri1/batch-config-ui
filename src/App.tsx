import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import { Container, Typography, Box, Card, CardContent, Button } from '@mui/material';
import { Build, Code, Visibility } from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              🔄 Batch Configuration Tool
            </Typography>
            
            <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
              Configure batch processing mappings with an intuitive web interface
            </Typography>

            <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Build color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Field Mapping</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Drag and drop interface for mapping source fields to target output fields with transformations.
                  </Typography>
                  <Button variant="outlined" size="small">Coming Soon</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Code color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">YAML Preview</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Real-time YAML configuration preview with syntax highlighting and validation.
                  </Typography>
                  <Button variant="outlined" size="small">Coming Soon</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Visibility color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Output Preview</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Preview generated output files before deploying to production batch processing.
                  </Typography>
                  <Button variant="outlined" size="small">Coming Soon</Button>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ mt: 4, p: 3, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h6" color="success.dark" gutterBottom>
                ✅ Setup Complete!
              </Typography>
              <Typography variant="body2" color="success.dark">
                React frontend is ready for development. TypeScript compatibility issues have been resolved.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
