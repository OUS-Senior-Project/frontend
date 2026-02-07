import nextConfig from 'eslint-config-next'
import prettierConfig from 'eslint-config-prettier'

export default [
  ...nextConfig,
  {
    name: 'prettier-overrides',
    rules: prettierConfig.rules,
  },
]
