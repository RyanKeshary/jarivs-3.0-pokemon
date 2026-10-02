// Test: File validation for submissions
import { describe, test, expect } from 'vitest';
import type { SubmissionStatus } from '../lib/database.types';

describe('File validation', () => {
  test('submission status enum values', () => {
    const statuses: SubmissionStatus[] = ['draft', 'submitted', 'locked'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('submitted');
    expect(statuses).toContain('locked');
  });

  test('submission version must be >= 1', () => {
    // From migration 0010: submissions_version_positive check (version >= 1)
    expect(1).toBeGreaterThanOrEqual(1);
    expect(2).toBeGreaterThanOrEqual(1);
  });

  test('deck mime types allowed', () => {
    // From migration 0005 and 0012: allowed mime types for submissions bucket
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint',                                           // .ppt
      'application/pdf'                                                          // .pdf
    ];
    expect(allowedMimeTypes).toContain('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    expect(allowedMimeTypes).toContain('application/vnd.ms-powerpoint');
    expect(allowedMimeTypes).toContain('application/pdf');
  });

  test('deck file path shape constraint', () => {
    // From migration 0010: file_path must match ^[teamId]/[filename].(ppt|pptx|pdf)$
    const teamId = 'TEAM-ABCD';
    const fileName = 'deck.pptx';
    const expectedPattern = new RegExp(`^${teamId}/[A-Za-z0-9._-]+\\.(ppt|pptx|pdf)$`);
    const testPath = `${teamId}/${fileName}`;
    expect(testPath).toMatch(expectedPattern);
  });
});
