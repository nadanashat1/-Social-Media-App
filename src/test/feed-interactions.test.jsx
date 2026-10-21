import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Feed from '../pages/feed/Feed';
import postsApi from '../api/posts.api';
import usersApi from '../api/users.api';

vi.mock('../api/posts.api', () => ({
  default: {
    getPosts: vi.fn(),
    getPost: vi.fn(),
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
    createPost: vi.fn(),
  },
}));

vi.mock('../api/users.api', () => ({
  default: {
    getFollowSuggestions: vi.fn(),
    followUser: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'me', name: 'Nada' } }),
}));

const POST = {
  _id: 'p1',
  body: 'A dispatch about Cairo light.',
  user: { _id: 'u1', name: 'Salma', username: 'salma' },
  likesCount: 3,
  commentsCount: 0,
  sharesCount: 0,
  liked: false,
  bookmarked: false,
  createdAt: '2026-10-01T10:00:00.000Z',
};

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = IO;
});

beforeEach(() => {
  vi.clearAllMocks();
  postsApi.getPosts.mockResolvedValue({
    data: { posts: [POST] },
    meta: { pagination: { currentPage: 1, numberOfPages: 1 } },
  });
  usersApi.getFollowSuggestions.mockResolvedValue({ data: { suggestions: [] } });
});

async function renderFeed() {
  render(
    <MemoryRouter>
      <Feed feedRefreshKey={0} />
    </MemoryRouter>
  );
  await screen.findByText('A dispatch about Cairo light.');
}

describe('Feed like/bookmark interactions', () => {
  it('ignores a second click while the like request is still pending', async () => {
    let resolveLike;
    postsApi.toggleLike.mockImplementation(
      () => new Promise((resolve) => { resolveLike = resolve; })
    );
    const user = userEvent.setup();
    await renderFeed();

    const likeBtn = screen.getByRole('button', { name: /like post/i });
    await user.click(likeBtn);
    await user.click(likeBtn);
    await user.click(likeBtn);

    expect(postsApi.toggleLike).toHaveBeenCalledTimes(1);
    resolveLike({ data: {} });
    await waitFor(() => expect(screen.getByRole('button', { name: /unlike post/i })).toBeInTheDocument());
  });

  it('shows an error message when the like request fails', async () => {
    postsApi.toggleLike.mockRejectedValue(
      Object.assign(new Error('boom'), { friendlyMessage: 'Could not reach the server.' })
    );
    const user = userEvent.setup();
    await renderFeed();

    await user.click(screen.getByRole('button', { name: /like post/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server.');
    // state stays untouched
    expect(screen.getByRole('button', { name: /like post/i })).toBeInTheDocument();
  });

  it('ignores a double-click on bookmark while pending', async () => {
    let resolveBm;
    postsApi.toggleBookmark.mockImplementation(
      () => new Promise((resolve) => { resolveBm = resolve; })
    );
    const user = userEvent.setup();
    await renderFeed();

    const bmBtn = screen.getByRole('button', { name: /save/i });
    await user.click(bmBtn);
    await user.click(bmBtn);

    expect(postsApi.toggleBookmark).toHaveBeenCalledTimes(1);
    resolveBm({ data: {} });
    await waitFor(() => expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument());
  });
});
