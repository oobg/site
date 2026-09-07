import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import styles from './AdminBackLink.module.css';

export function AdminBackLink() {
  return (
    <Link className={styles.link} href={ROUTES.ADMIN.HOME}>
      <ArrowLeft aria-hidden size={18} />
      목록으로
    </Link>
  );
}
