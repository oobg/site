import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import { StatusScreen } from '@/app/_components/StatusScreen';

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="페이지를 찾을 수 없어요"
      description="주소가 바뀌었거나 글이 내려갔을 수 있어요. 목록에서 다시 찾아보세요."
      action={<ArrowLink href={ROUTES.BLOG.LIST}>글 목록으로</ArrowLink>}
    />
  );
}
