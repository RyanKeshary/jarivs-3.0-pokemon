import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Admin Route Guard.
 *
 * Protects all /admin/* routes. Checks if the signed-in user has role 'admin' or 'manager'.
 * If the user is a trainer (role = 'trainer'), they are refused access and redirected to /.
 * The role is read from sessionStorage set by AdminLogin.
 *
 * Usage: <Route path="admin/*" element={<AdminGate />} />
 */
export default function AdminGate() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedRole = sessionStorage.getItem('admin_role');
    if (!storedRole) {
      // Not logged in as admin/manager; redirect to login
      navigate('/admin/login', { replace: true });
      return;
    }

    if (storedRole !== 'admin' && storedRole !== 'manager') {
      // Trainer trying to access admin - refuse access
      navigate('/', { replace: true });
      return;
    }
  }, [storedRole, navigate]);

  // If we get here, the user is authorized
  return null;
}

/**
 * Layout wrapper for admin pages.
 * Provides a consistent sidebar navigation and page header.
 */
function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Sidebar navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-ink-800/90 border-right border-white/10 px-4 py-6">
        <h2 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
          Kanto League
        </h2>
        <nav className="space-y-2">
          <a
            href="/admin/overview"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/overview' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
            aria-current="page"
            >Overview</a
          >
          <a
            href="/admin/participants"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/participants' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
          >Participants</a>
          <a
            href="/admin/teams"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/teams' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
          >Teams</a>
          <a
            href="/admin/settings"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/settings' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
          >Settings</a>
          <a
            href="/admin/problem-statements"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/problem-statements' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
          >Problem Statements</a>
          <a
            href="/admin/announcements"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/announcements' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
          >Announcements</a>
          <a
            href="/admin/resources"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/resources' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
          >Resources</a>
          <a
            href="/admin/winners"
            className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
              location.pathname === '/admin/winners' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
            } block py-3 px-4`}
          >Winners & Badges</a>
          {sessionStorage.getItem('admin_role') === 'manager' && (
            <a
              href="/admin/manage-admins"
              className={`rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
                location.pathname === '/admin/manage-admins' ? 'bg-ball-500 text-shell-50' : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
              } block py-3 px-4`}
            >Manage Admins</a>
          )}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="ml-64 p-8 sm:p-12 bg-ink-900 min-h-screen">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-shell-50 uppercase tracking-wider">
            Kanto League Admin
          </h1>
          <p className="text-shell-400 mt-2">
            Logged in as: <span className="font-bold text-shell-100">{sessionStorage.getItem('admin_role')}</span>
          </p>
        </header>

        {children}
      </main>
    </div>
  );
}