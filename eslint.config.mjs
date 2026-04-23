import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // 2. Tailwind 관련 설정 추가
    plugins: {
      tailwindcss: tailwind,
    },
    rules: {
      // 임의의 값(Arbitrary values)을 기존 클래스로 대체하라는 제안 끄기
      'tailwindcss/no-custom-classname': 'off',

      // 혹시 모르니 아래 규칙도 체크 (필요시 off)
      'tailwindcss/no-arbitrary-value': 'off',
      'tailwindcss/no-unnecessary-arbitrary-value': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
