module.exports = {
  env: {
    node: true,
    es2021: true,
    commonjs: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended', // Must be last
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Node.js specific
    'no-console': 'off', // Allow console in Node.js
    'global-require': 'off',
    'no-process-exit': 'off',
    
    // General rules
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-underscore-dangle': ['error', { allow: ['_id', '__dirname', '__filename'] }],
    'prefer-destructuring': 'warn',
    'consistent-return': 'warn',
    'func-names': 'off',
    
    // Import rules
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/prefer-default-export': 'off',
    
    // Code quality
    'eqeqeq': ['error', 'always'],
    'no-param-reassign': ['error', { props: false }],
    'no-return-await': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    
    // Async/await
    'no-await-in-loop': 'warn',
    'require-await': 'warn',
    
    // Prettier
    'prettier/prettier': ['warn', {
      endOfLine: 'auto',
      singleQuote: true,
      semi: true,
      tabWidth: 2,
      trailingComma: 'es5',
    }],
  },
};

