module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:prettier/recommended', // Must be last to override other configs
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // React specific rules
    'react/prop-types': 'off', // Turn off if using TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General JavaScript rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    
    // Code quality
    'eqeqeq': ['error', 'always'],
    'no-duplicate-imports': 'error',
    'no-return-await': 'error',
    
    // Prettier - handled by plugin
    'prettier/prettier': ['warn', {
      endOfLine: 'auto',
      singleQuote: true,
      semi: true,
      tabWidth: 2,
      trailingComma: 'es5',
    }],
  },
};

