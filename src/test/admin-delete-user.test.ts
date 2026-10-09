import { describe, it, expect } from 'vitest';

describe('Admin User Deletion & Re-registration Logic', () => {
  const MASTER_EMAILS = ['ryankeshary@gmail.com', 'shrey.sleeps@gmail.com'];

  function canDeleteParticipant(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (MASTER_EMAILS.includes(cleanEmail)) {
      return { allowed: false, reason: 'Action Prohibited: Cannot delete a Master Administrator record.' };
    }
    return { allowed: true };
  }

  function resolveTeamStateAfterParticipantRemoval(
    remainingMembers: Array<{ id: string; email: string; is_leader: boolean }>,
    wasLeader: boolean
  ) {
    if (remainingMembers.length === 0) {
      return { shouldDeleteTeam: true, newLeader: null };
    }
    if (wasLeader) {
      return { shouldDeleteTeam: false, newLeader: remainingMembers[0].email };
    }
    return { shouldDeleteTeam: false, newLeader: null };
  }

  it('prevents deletion of master administrator accounts', () => {
    expect(canDeleteParticipant('ryankeshary@gmail.com').allowed).toBe(false);
    expect(canDeleteParticipant('shrey.sleeps@gmail.com').allowed).toBe(false);
    expect(canDeleteParticipant('RYANKESHARY@GMAIL.COM').allowed).toBe(false);
    expect(canDeleteParticipant('student@slrtce.in').allowed).toBe(true);
  });

  it('deletes orphan team when last member is deleted', () => {
    const outcome = resolveTeamStateAfterParticipantRemoval([], true);
    expect(outcome.shouldDeleteTeam).toBe(true);
    expect(outcome.newLeader).toBeNull();
  });

  it('promotes next member to squad leader if deleted member was captain', () => {
    const remaining = [
      { id: 'member-2', email: 'teammate@slrtce.in', is_leader: false },
      { id: 'member-3', email: 'teammate2@slrtce.in', is_leader: false },
    ];
    const outcome = resolveTeamStateAfterParticipantRemoval(remaining, true);
    expect(outcome.shouldDeleteTeam).toBe(false);
    expect(outcome.newLeader).toBe('teammate@slrtce.in');
  });

  it('preserves team and existing leader if deleted member was not the captain', () => {
    const remaining = [
      { id: 'member-1', email: 'captain@slrtce.in', is_leader: true },
    ];
    const outcome = resolveTeamStateAfterParticipantRemoval(remaining, false);
    expect(outcome.shouldDeleteTeam).toBe(false);
    expect(outcome.newLeader).toBeNull();
  });

  it('restricts participant and team deletion to Master administrators only', () => {
    function verifyDeletionPermission(role: string, isMaster: boolean, action: 'delete_member' | 'delete_team') {
      if (!isMaster) {
        return { allowed: false, error: 'Action Prohibited: Only Master Administrators can delete records.' };
      }
      return { allowed: true };
    }

    // Regular admin should be blocked
    expect(verifyDeletionPermission('admin', false, 'delete_member').allowed).toBe(false);
    expect(verifyDeletionPermission('admin', false, 'delete_team').allowed).toBe(false);

    // Gate coordinator should be blocked
    expect(verifyDeletionPermission('coordinator', false, 'delete_member').allowed).toBe(false);
    expect(verifyDeletionPermission('coordinator', false, 'delete_team').allowed).toBe(false);

    // Master administrator should be allowed
    expect(verifyDeletionPermission('admin', true, 'delete_member').allowed).toBe(true);
    expect(verifyDeletionPermission('admin', true, 'delete_team').allowed).toBe(true);
  });
});
