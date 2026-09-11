import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@features/admin/components/GoogleLoginButton', () => ({
  GoogleLoginButton: () => <button>Google 로그인</button>,
}));

import { LoginPanel } from '@features/admin/components/LoginPanel';

describe('LoginPanel', () => {
  it('does not expose infrastructure credential names to anonymous visitors', () => {
    render(<LoginPanel configured={false} />);

    expect(screen.getByRole('status')).toHaveTextContent('관리자에게');
    expect(screen.queryByText(/R2_SECRET_ACCESS_KEY|CMS_OWNER_EMAILS/)).not.toBeInTheDocument();
  });
});
