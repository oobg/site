import { afterEach, describe, expect, it } from 'vitest';

import {
  CmsConfigurationError,
  getAssetStorageConfig,
  getOwnerEmails,
  getR2Config,
} from '@configs/cms-env';

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

  it('keeps R2 as the default storage backend', () => {
    delete process.env.ASSET_STORAGE_BACKEND;
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_PUBLIC_URL = 'https://cdn.raven.kr/';
    process.env.ASSET_PUBLIC_URL = 'https://cdn-dev.raven.kr';
    expect(getAssetStorageConfig()).toMatchObject({
      backend: 'r2',
      bucket: 'bucket',
      publicUrl: 'https://cdn.raven.kr',
    });
  });

  it('selects local storage from environment values without coupling it to the site hostname', () => {
    process.env.ASSET_STORAGE_BACKEND = 'local';
    process.env.ASSET_LOCAL_ROOT = '/srv/assets';
    process.env.ASSET_PUBLIC_URL = 'https://cdn-dev.raven.kr/';
    process.env.SITE_URL = 'https://preview.example.com';
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    expect(getAssetStorageConfig()).toEqual({
      backend: 'local',
      root: '/srv/assets',
      publicUrl: 'https://cdn-dev.raven.kr',
    });
  });

  it('rejects relative local roots and R2 credentials in local mode', () => {
    process.env.ASSET_STORAGE_BACKEND = 'local';
    process.env.ASSET_LOCAL_ROOT = 'assets';
    process.env.ASSET_PUBLIC_URL = 'https://cdn-dev.raven.kr';
    process.env.SITE_URL = 'https://dev.raven.kr';
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    expect(() => getAssetStorageConfig()).toThrow(CmsConfigurationError);

    process.env.ASSET_LOCAL_ROOT = '/srv/assets';
    process.env.R2_BUCKET = 'production-bucket';
    expect(() => getAssetStorageConfig()).toThrow(CmsConfigurationError);
  });

  it('rejects an unsafe local asset public URL', () => {
    process.env.ASSET_STORAGE_BACKEND = 'local';
    process.env.ASSET_LOCAL_ROOT = '/srv/assets';
    process.env.SITE_URL = 'https://preview.example.com';
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;

    for (const value of [
      'http://cdn.example.com',
      'https://user:pass@cdn.example.com',
      'https://cdn.example.com/assets',
      'https://cdn.example.com?source=dev',
      'not-a-url',
    ]) {
      process.env.ASSET_PUBLIC_URL = value;
      expect(() => getAssetStorageConfig()).toThrow(CmsConfigurationError);
    }
  });
});
