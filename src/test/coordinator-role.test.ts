import { describe, it, expect } from 'vitest';

describe('Coordinator Role & Permission Boundaries', () => {
  const MASTER_EMAILS = ['ryankeshary@gmail.com', 'shrey.sleeps@gmail.com'];

  function checkPermission(role: string, action: string, email?: string) {
    const isMaster = email ? MASTER_EMAILS.includes(email.toLowerCase()) : false;
    const effectiveRole = isMaster ? 'master' : role;

    switch (action) {
      case 'checkin_attendee':
      case 'checkin_squad':
        return ['coordinator', 'manager', 'admin', 'master'].includes(effectiveRole);

      case 'access_checkin_page':
        return ['coordinator', 'manager', 'admin', 'master'].includes(effectiveRole);

      case 'access_dashboard_overview':
      case 'access_candidates_archive':
      case 'access_squads_archive':
      case 'access_event_configs':
      case 'access_bulletins':
      case 'access_audit_trail':
      case 'delete_participant':
      case 'delete_team':
      case 'update_event':
        return ['manager', 'admin', 'master'].includes(effectiveRole);

      case 'add_coordinator':
      case 'remove_coordinator':
      case 'reset_coordinator_password':
        return ['manager', 'admin', 'master'].includes(effectiveRole);

      case 'appoint_admin':
      case 'revoke_admin':
        return effectiveRole === 'master';

      default:
        return false;
    }
  }

  it('allows coordinators to access check-in page and perform check-ins', () => {
    expect(checkPermission('coordinator', 'access_checkin_page')).toBe(true);
    expect(checkPermission('coordinator', 'checkin_attendee')).toBe(true);
    expect(checkPermission('coordinator', 'checkin_squad')).toBe(true);
  });

  it('strictly blocks coordinators from all administrative and management tabs', () => {
    expect(checkPermission('coordinator', 'access_dashboard_overview')).toBe(false);
    expect(checkPermission('coordinator', 'access_candidates_archive')).toBe(false);
    expect(checkPermission('coordinator', 'access_squads_archive')).toBe(false);
    expect(checkPermission('coordinator', 'access_event_configs')).toBe(false);
    expect(checkPermission('coordinator', 'access_bulletins')).toBe(false);
    expect(checkPermission('coordinator', 'access_audit_trail')).toBe(false);
  });

  it('strictly blocks coordinators from destructive operations and appointing others', () => {
    expect(checkPermission('coordinator', 'delete_participant')).toBe(false);
    expect(checkPermission('coordinator', 'delete_team')).toBe(false);
    expect(checkPermission('coordinator', 'update_event')).toBe(false);
    expect(checkPermission('coordinator', 'add_coordinator')).toBe(false);
    expect(checkPermission('coordinator', 'remove_coordinator')).toBe(false);
  });

  it('allows both admins and managers to add and remove coordinators', () => {
    expect(checkPermission('admin', 'add_coordinator')).toBe(true);
    expect(checkPermission('admin', 'remove_coordinator')).toBe(true);
    expect(checkPermission('manager', 'add_coordinator')).toBe(true);
    expect(checkPermission('manager', 'remove_coordinator')).toBe(true);
    expect(checkPermission('master', 'add_coordinator')).toBe(true);
    expect(checkPermission('master', 'remove_coordinator')).toBe(true);
  });
});
