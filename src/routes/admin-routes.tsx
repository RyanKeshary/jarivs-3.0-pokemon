import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminGate, { AdminLayout } from './admin-gate';
import AdminLogin from './admin-login';
import AdminOverview from './admin-overview';
import AdminParticipants from './admin-participants';
import AdminTeams from './admin-teams';
import AdminSettings from './admin-settings';
import AdminProblemStatements from './admin-problem-statements';
import AdminAnnouncements from './admin-announcements';
import AdminResources from './admin-resources';
import AdminWinners from './admin-winners';
import AdminManageAdmins from './admin-manage-admins';

/**
 * Admin Routes.
 *
 * Structure:
 *   /admin/login          -> Master Login (public; AdminGate redirects if already logged in)
 *   /admin/*              -> All other routes guarded by AdminGate and wrapped by AdminLayout
 */
const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminGate />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="problem-statements" element={<AdminProblemStatements />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="winners" element={<AdminWinners />} />
          <Route path="manage-admins" element={<AdminManageAdmins />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;