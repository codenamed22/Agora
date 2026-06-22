export const SUPPORTED_LANGUAGES = {
  python: { label: "Python 3", pistonLanguage: "python", version: "3.10.0" },
  cpp: { label: "C++", pistonLanguage: "c++", version: "10.2.0" },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, language);
}

export function supportedLanguageOptions() {
  return Object.entries(SUPPORTED_LANGUAGES).map(([value, config]) => ({
    value,
    label: config.label,
  }));
}
