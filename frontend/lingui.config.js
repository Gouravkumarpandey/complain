// @ts-check
/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'es', 'fr', 'hi', 'zh'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: 'src/locales/{locale}/messages',
      include: ['src'],
      exclude: ['**/node_modules/**']
    }
  ],
  format: 'po',
  formatOptions: {
    lineNumbers: false
  },
  orderBy: 'messageId',
  fallbackLocales: {
    default: 'en'
  },
  pseudoLocale: 'pseudo',
  compileNamespace: 'es'
  // Removed all extractor configurations to use defaults
};