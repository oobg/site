export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 한국어 subject를 허용하기 위해 대소문자 규칙 비활성화
    'subject-case': [0],
  },
};
