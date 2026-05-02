import { normalizeLanguage, resolveLanguage } from './i18n';

describe('normalizeLanguage', () => {
  test('normalizes zh-Hant variants', () => {
    expect(normalizeLanguage('zh-TW')).toBe('zh-Hant');
    expect(normalizeLanguage('zh-HK')).toBe('zh-Hant');
  });

  test('normalizes zh-Hans variants', () => {
    expect(normalizeLanguage('zh-CN')).toBe('zh-Hans');
    expect(normalizeLanguage('zh')).toBe('zh-Hans');
  });

  test('returns en for unsupported', () => {
    expect(normalizeLanguage('fr')).toBe('en');
  });
});

describe('resolveLanguage', () => {
  test('prefers user preference', () => {
    expect(resolveLanguage('AU', 'ja', 'en')).toBe('ja');
  });

  test('falls back to country code', () => {
    expect(resolveLanguage('CN')).toBe('zh-Hans');
  });
});