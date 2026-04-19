import js from '@eslint/js';

export default [
  {
    ...js.configs.recommended,
    files: ['js/**/*.js'],
    rules: {
      // Catch unused variables, functions, and parameters
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      // Catch functions declared but never called
      'no-unreachable': 'warn',
    },
  },
];
