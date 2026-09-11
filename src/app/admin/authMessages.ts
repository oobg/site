const authMessages: Record<string, string> = {
  oauth: 'Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  'invalid-origin': '로그인 콜백 주소를 확인할 수 없습니다. SITE_URL 설정을 확인해 주세요.',
  'not-configured': '관리자 로그인 환경 변수가 아직 설정되지 않았습니다.',
};

export const getAuthMessage = (key: string | undefined) =>
  key && Object.hasOwn(authMessages, key) ? authMessages[key] : undefined;
