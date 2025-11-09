module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    // FSD architecture rules
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/app/**',
            from: './src/pages/**',
            message: 'app cannot import from pages',
          },
          {
            target: './src/app/**',
            from: './src/widgets/**',
            message: 'app cannot import from widgets',
          },
          {
            target: './src/app/**',
            from: './src/features/**',
            message: 'app cannot import from features',
          },
          {
            target: './src/app/**',
            from: './src/entities/**',
            message: 'app cannot import from entities',
          },
          {
            target: './src/pages/**',
            from: './src/app/**',
            message: 'pages cannot import from app',
          },
          {
            target: './src/widgets/**',
            from: './src/pages/**',
            message: 'widgets cannot import from pages',
          },
          {
            target: './src/widgets/**',
            from: './src/app/**',
            message: 'widgets cannot import from app',
          },
          {
            target: './src/features/**',
            from: './src/pages/**',
            message: 'features cannot import from pages',
          },
          {
            target: './src/features/**',
            from: './src/widgets/**',
            message: 'features cannot import from widgets',
          },
          {
            target: './src/features/**',
            from: './src/app/**',
            message: 'features cannot import from app',
          },
          {
            target: './src/entities/**',
            from: './src/pages/**',
            message: 'entities cannot import from pages',
          },
          {
            target: './src/entities/**',
            from: './src/widgets/**',
            message: 'entities cannot import from widgets',
          },
          {
            target: './src/entities/**',
            from: './src/features/**',
            message: 'entities cannot import from features',
          },
          {
            target: './src/entities/**',
            from: './src/app/**',
            message: 'entities cannot import from app',
          },
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
};

