'use server';

// =============================================================================
// BACKUP SERVER ACTION & GITHUB ACTIONS DISPATCHER
// src/app/actions/backup.ts
// =============================================================================

export async function triggerLiveBackup(): Promise<{
  success: boolean;
  message: string;
  runUrl?: string;
}> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      success: false,
      message: 'GITHUB_TOKEN is not configured in environment variables.',
    };
  }

  try {
    const res = await fetch(
      'https://api.github.com/repos/RyanKeshary/jarivs-3.0-pokemon/actions/workflows/381293798/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token.trim()}`,
          'User-Agent': 'Jarvis-Backup-Dispatcher',
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
        }),
        cache: 'no-store',
      }
    );

    if (res.status === 204 || res.ok) {
      return {
        success: true,
        message: 'Disaster recovery backup triggered! Running in GitHub Actions and uploading to Google Drive.',
        runUrl: 'https://github.com/RyanKeshary/jarivs-3.0-pokemon/actions',
      };
    }

    const errText = await res.text();
    return {
      success: false,
      message: `Failed to dispatch backup (${res.status}): ${errText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error communicating with GitHub Actions.',
    };
  }
}
