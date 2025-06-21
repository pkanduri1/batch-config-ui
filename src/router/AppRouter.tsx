// src/router/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { ConfigurationPage } from '../pages/ConfigurationPage';
import { YamlPreviewPage } from '../pages/YamlPreviewPage';
import { TestingPage } from '../pages/TestingPage';
import { PageLayout } from '../components/layout/PageLayout';

export const AppRouter: React.FC = () => {
  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
        <Route path="/configuration/:systemId/:jobName" element={<ConfigurationPage />} />
        <Route path="/yaml-preview" element={<YamlPreviewPage />} />
        <Route path="/testing" element={<TestingPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </PageLayout>
  );
};