import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';

/**
 * Admin Route Guard.
 *
 * Protects all /admin/* routes. Checks if the signed-in user has role 'admin' or 'manager'.
 * If the user is a trainer (role = 'trainer'), they are refused access and redirected to /.
 * The role is read from sessionStorage set by AdminLogin.
 */
export default function AdminGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedRole = sessionStorage.getItem('admin_role');

  useEffect(() => {
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
  }, [storedRole, navigate, location.pathname]);

  if (!storedRole || (storedRole !== 'admin' && storedRole !== 'manager')) {
    return null;
  }

  return <Outlet />;
}

/**
 * Layout wrapper for admin pages.
 * Provides a consistent sidebar navigation and page header.
 */
export function AdminLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const role = sessionStorage.getItem('admin_role');

  const navLinks = [
    { href: '/admin/overview', label: 'Overview' },
    { href: '/admin/participants', label: 'Participants' },
    { href: '/admin/teams', label: 'Teams' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/problem-statements', label: 'Problem Statements' },
    { href: '/admin/announcements', label: 'Announcements' },
    { href: '/admin/resources', label: 'Resources' },
    { href: '/admin/winners', label: 'Winners & Badges' },
  ];

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Sidebar navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-ink-800/90 border-r border-white/10 px-4 py-6 z-20">
        <h2 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
          Kanto League
        </h2>
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.href ||
              (link.href === '/admin/overview' && location.pathname === '/admin');
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`rounded-pixel text-xs font-pixel uppercase ${
                  isActive
                    ? 'bg-ball-500 text-shell-50'
                    : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
                } block py-3 px-4`}
              >
                {link.label}
              </Link>
            );
          })}
          {role === 'manager' && (
            <Link
              to="/admin/manage-admins"
              className={`rounded-pixel text-xs font-pixel uppercase ${
                location.pathname === '/admin/manage-admins'
                  ? 'bg-ball-500 text-shell-50'
                  : 'text-shell-400 hover:bg-ball-400 hover:text-shell-100 transition-colors'
              } block py-3 px-4`}
            >
              Manage Admins
            </Link>
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
            Logged in as: <span className="font-bold text-shell-100">{role || 'unknown'}</span>
          </p>
        </header>

        {children ?? <Outlet />}
      </main>
    </div>
  );
}