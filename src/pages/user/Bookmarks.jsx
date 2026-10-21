import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Heart, MessageCircle, AlertCircle } from 'lucide-react';
import usersApi from '../../api/users.api';
import postsApi from '../../api/posts.api';
import Footer from '../../components/common/Footer';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    async function loadBookmarks() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await usersApi.getBookmarks();
        const list = res?.data?.bookmarks || [];
        setBookmarks(list);
      } catch (err) {
        const msg = err.friendlyMessage || err.message || 'Unable to load bookmarks.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookmarks();
  }, []);

  const handleRemoveBookmark = async (postId) => {
    if (removingIds.has(postId)) return;

    setRemovingIds((prev) => new Set([...prev, postId]));

    setBookmarks((prev) => prev.filter((p) => (p._id || p.id) !== postId));

    try {
      await postsApi.toggleBookmark(postId);

    } catch (err) {

      try {
        const res = await usersApi.getBookmarks();
        const list = res?.data?.bookmarks || [];
        setBookmarks(list);
      } catch {
       
        
      }
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  return (
    <div className="auth-page-container" style={{ padding: '2rem 1.5rem' }}>
      {/* Pill Badge */}
      <div className="pill-badge">
        <span className="pill-dot" />
        <span>SAVED ESSAYS • PERSONAL ARCHIVE</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Your Bookmarked Works
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.94rem',
            maxWidth: '480px',
            margin: '0.4rem auto 0 auto',
          }}
        >
          Curated collection of essays, photography collections, and dialogue pieces you have saved for later reading.
        </p>
      </div>

      {error ? (
        <div className="alert-banner error" style={{ maxWidth: '640px', width: '100%' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : isLoading ? (
        <div
          style={{
            minHeight: '40vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <div className="spinner dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Accessing your archive...</span>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Bookmark size={36} style={{ color: 'var(--primary-orange)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No bookmarks saved yet</h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              marginTop: '0.4rem',
              lineHeight: 1.5,
            }}
          >
            Whenever you encounter an inspiring essay or thought-provoking publication, bookmark it to revisit here.
          </p>
          <Link
            to="/discover"
            className="btn-create-post"
            style={{ display: 'inline-flex', marginTop: '1.5rem', textDecoration: 'none' }}
          >
            Explore Publications
          </Link>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {bookmarks.map((post) => {
            const postId = post._id || post.id;
            const isRemoving = removingIds.has(postId);
            return (
              <article
                key={postId}
                className="auth-card"
                style={{ maxWidth: '100%', padding: '1.75rem', marginBottom: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <img
                    src={post.user?.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
                    alt={post.user?.name || 'Author'}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                      {post.user?.name || 'Route Author'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Archived'}
                    </div>
                  </div>
                  {/* Remove bookmark button */}
                  <button
                    type="button"
                    className="btn-preview-toggle"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.78rem',
                      color: 'var(--primary-orange)',
                      borderColor: 'var(--primary-orange)',
                    }}
                    onClick={() => handleRemoveBookmark(postId)}
                    disabled={isRemoving}
                    aria-label="Remove bookmark"
                  >
                    {isRemoving ? (
                      <div className="spinner dark" style={{ width: 12, height: 12 }} />
                    ) : (
                      <>
                        <Bookmark size={13} fill="var(--primary-orange)" />
                        <span>Saved</span>
                      </>
                    )}
                  </button>
                </div>

                {post.body && (
                  <p style={{ fontSize: '0.96rem', lineHeight: 1.6, marginBottom: post.image ? '1rem' : '0.5rem' }}>
                    {post.body}
                  </p>
                )}

                {post.image && (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', maxHeight: '400px' }}>
                    <img
                      src={post.image}
                      alt="Essay visual"
                      style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    color: 'var(--text-dim)',
                    fontSize: '0.84rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Heart size={15} color="var(--primary-orange)" />
                    <span>{post.likesCount || 0}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MessageCircle size={15} />
                    <span>{post.commentsCount || 0}</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Footer showTag={true} />
    </div>
  );
}
