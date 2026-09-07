import { afterEach, describe, expect, it } from 'vitest';

import { CmsConfigurationError, getOwnerEmails, getR2Config } from '@configs/cms-env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('CMS environment', () => {
  it('normalizes and deduplicates the explicit owner allowlist', () => {
    process.env.CMS_OWNER_EMAILS = ' Owner@Example.com,owner@example.com, second@example.com ';
    expect([...getOwnerEmails()]).toEqual(['owner@example.com', 'second@example.com']);
  });

  it('fails closed when any R2 credential is missing', () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    delete process.env.R2_PUBLIC_URL;
    expect(() => getR2Config()).toThrow(CmsConfigurationError);
  });
});
