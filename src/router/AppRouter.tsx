// src/router/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { ConfigurationPage } from '../pages/ConfigurationPage';
import { YamlPreviewPage } from '../pages/YamlPreviewPage';
import { TestingPage } from '../pages/TestingPage';
import { PageLayout } from '../components/layout/PageLayout';
import { TemplateConfigurationPage } from '../pages/TemplateConfigurationPage/TemplateConfigurationPage';
import { TemplateAdminPage } from '../pages/TemplateAdminPage/TemplateAdminPage';

export const AppRouter: React.FC = () => {
  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
        <Route path="/configuration/:systemId/:jobName" element={<ConfigurationPage />} />
        {/* New Template-Based Configuration Routes */}
        <Route path="/template-configuration" element={<TemplateConfigurationPage />} />
        <Route path="/template-configuration/:systemId/:jobName" element={<TemplateConfigurationPage />} />
        
        {/* Template Administration Routes */}
        <Route path="/admin/templates" element={<TemplateAdminPage />} />
        <Route path="/yaml-preview" element={<YamlPreviewPage />} />
        <Route path="/testing" element={<TestingPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </PageLayout>
  );
};