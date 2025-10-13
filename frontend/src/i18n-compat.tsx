import i18next from 'i18next';
import { Trans as ReactI18nextTrans } from 'react-i18next';

// Export a Trans component compatible with Lingui's Trans usage
export const Trans = ReactI18nextTrans;

// Support both runtime calls like t('key') and template tag usage t`Hello ${name}`
export function t(strings: TemplateStringsArray | string, ...values: any[]) {
  if (typeof strings === 'string') {
    return i18next.t(strings as string);
  }

  // Join template literal into a single key (best-effort)
  let combined = '';
  for (let i = 0; i < strings.length; i++) {
    combined += strings[i];
    if (i < values.length) {
      combined += String(values[i]);
    }
  }
  // Use the combined string as the lookup key; fallback to combined literal
  const translated = i18next.t(combined);
  return translated || combined;
}

export default { Trans, t };
