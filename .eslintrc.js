module.exports = {
  extends: 'airbnb-base',
  parserOptions: {
    sourceType: 'script', // https://github.com/eslint/eslint/issues/5301
  },
  rules: {
    'no-underscore-dangle': ['error',
      {
        allow: ['_id'],
        allowAfterThis: true,
        allowAfterSuper: true,
      },
    ],
    'max-len': ['error',
      {
        code: 200,
        tabWidth: 2,
      },
    ],
    'no-console': 0,
    'class-methods-use-this': 0,
    'new-cap': ['error',
      {
        capIsNewExceptions: ['Router'], // express.Router
      },
    ],
  },
};
