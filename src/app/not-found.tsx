import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';

export default function NotFound() {
  return (
    <main>
      <h1>페이지를 찾을 수 없어요</h1>
      <ArrowLink href={ROUTES.HOME}>홈으로</ArrowLink>
    </main>
  );
}
