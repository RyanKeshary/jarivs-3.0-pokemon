import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminGate from './admin-gate';
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
 *   /admin/login          -> Master Login (public, no guard needed; AdminGate handles redirect if already logged in)
 *   /admin/*              -> All other routes guarded by AdminGate
 *
 * Access:
 *   - 'admin' role: full access to all admin features
 *   - 'manager' role: full access PLUS manage-admins section
 *   - 'trainer' role: redirected to / (refused)
 */
const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="login"
        element={
          <AdminLogin />
        }
      />
      <Route
        path="*"
        element={
          <AdminGate />
        }
      />
      {/* Nested admin routes - only reachable if AdminGate passes */}
      <Route
        path=""
        element={
          <AdminLayout>
            <Routes>
              <Route path="overview" element={<AdminOverview />} />
              <Route path="participants" element={<AdminParticipants />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="problem-statements" element={<AdminProblemStatements />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="winners" element={<AdminWinners />} />
              {sessionStorage.getItem('admin_role') === 'manager' && (
                <Route path="manage-admins" element={<AdminManageAdmins />} />
              )}
            </Routes>
          </AdminLayout>
        }
      />
    </Routes>
  );
};

export default AdminRoutes;