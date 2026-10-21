import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePostModal from '../components/common/CreatePostModal';

vi.mock('../api/posts.api', () => ({
  default: { createPost: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'me', name: 'Nada' } }),
}));

describe('Modal accessibility (shared hook)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exposes dialog semantics and moves focus inside on open', async () => {
    render(<CreatePostModal isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /create post/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CreatePostModal isOpen={true} onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab cycling inside the dialog', async () => {
    const user = userEvent.setup();
    render(<CreatePostModal isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /create post/i });

    // tab through every focusable element; focus must never leave the dialog
    for (let i = 0; i < 12; i++) {
      await user.keyboard('{Tab}');
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('does not close on Escape while posting', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const postsApi = (await import('../api/posts.api')).default;
    postsApi.createPost.mockImplementation(() => new Promise(() => {}));
    render(<CreatePostModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText(/compose an essay/i), 'hello');
    await user.click(screen.getByRole('button', { name: /publish/i }));
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
});
