/**
 * Copyright 2025 Perfana Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//require('jest')

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended'
  ],
  env: {
    'es6': true,
    'node': true
  },
  parserOptions: {
    'ecmaVersion': 2018
  },
  globals: {
    'debug': true,
    'require': true,
    'process': true
  },
  rules: {
    'no-unused-vars': ['error', {
      'args': 'none'
    }],
    'no-inner-declarations': 0,
    'no-console': 0,
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ]
  }
};
