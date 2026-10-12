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

  // 1. Direct GitHub Actions API Dispatch (if GITHUB_TOKEN is available)
  if (token && token.trim()) {
    try {
      const res = await fetch(
        'https://api.github.com/repos/RyanKeshary/jarivs-3.0-pokemon/actions/workflows/381293798/dispatches',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
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
    } catch {
      // Fall through to cloud proxy webhook
    }
  }

  // 2. Cloud Backup Webhook Fallback (works on Render, localhost, or any environment without GITHUB_TOKEN)
  try {
    const res = await fetch('https://indigo-techfest.vercel.app/api/cron/backup', {
      method: 'POST',
      headers: {
        'User-Agent': 'Jarvis-Admin-Backup-Caller',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        message: data.message || 'Disaster recovery backup triggered! Running in GitHub Actions and uploading to Google Drive.',
        runUrl: data.runUrl || 'https://github.com/RyanKeshary/jarivs-3.0-pokemon/actions',
      };
    }

    const errText = await res.text().catch(() => '');
    return {
      success: false,
      message: `Backup endpoint returned ${res.status}: ${errText || 'Unable to trigger backup.'}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error communicating with backup services.',
    };
  }
}

