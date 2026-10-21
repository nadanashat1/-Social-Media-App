import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import postsApi from '../../api/posts.api';


export default function PostLikesModal({ postId, onClose }) {
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);

  const fetchLikes = useCallback(
    async (targetPage = 1, append = false) => {
      if (!postId) return;
      if (append) setLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      try {
        const res = await postsApi.getPostLikes(postId, { page: targetPage, limit: 20 });
        const list = res?.data?.likes || [];
        const pagination = res?.meta?.pagination;

        setLikes((prev) => {
          if (!append) return list;
          const existingIds = new Set(prev.map((u) => u._id || u.id));
          const fresh = list.filter((u) => !existingIds.has(u._id || u.id));
          return [...prev, ...fresh];
        });

        if (pagination) {
          setTotalLikes(pagination.total ?? list.length);
          setHasMore(pagination.currentPage < pagination.numberOfPages);
        } else {
          setTotalLikes(list.length);
          setHasMore(list.length === 20);
        }
        setPage(targetPage);
      } catch (err) {
        const msg = err.friendlyMessage || err.message || 'Could not load likes.';
        setError(msg);
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    fetchLikes(1, false);
  }, [fetchLikes]);

  
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

 
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLikes(page + 1, true);
    }
  };

  if (!postId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="likes-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          marginBottom: 0,
          animation: 'fadeInScale 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <Heart size={16} fill="#EF4444" color="#EF4444" />
            </div>
            <div>
              <h2
                id="likes-modal-title"
                style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}
              >
                Liked by
              </h2>
            </div>
            {totalLikes > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-dim)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                }}
              >
                {totalLikes}
              </span>
            )}
          </div>

          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={onClose}
            aria-label="Close likes modal"
            style={{
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

       
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            minHeight: '220px',
            maxHeight: 'calc(85vh - 120px)',
          }}
        >
          {isLoading ? (
            <div
              style={{
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
              }}
            >
              <div className="spinner dark" style={{ width: 26, height: 26 }} />
              <span style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                Loading readers...
              </span>
            </div>
          ) : error ? (
            <div
              className="alert-banner error"
              style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', flex: 1 }}>{error}</span>
              <button
                type="button"
                className="btn-preview-toggle"
                onClick={() => fetchLikes(1, false)}
                style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : likes.length === 0 ? (
            <div
              style={{
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem 1rem',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-input)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem',
                  color: 'var(--text-dim)',
                }}
              >
                <Heart size={22} />
              </div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                No likes yet
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Be the first to appreciate this publication.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {likes.map((liker) => {
                const likerId = liker._id || liker.id;
                const likerPhoto = liker.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                const likerName = liker.name || 'Route Reader';
                const likerUsername = liker.username || 'member';

                return (
                  <div
                    key={likerId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '12px',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Link
                      to={`/profile/${likerId}`}
                      onClick={onClose}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textDecoration: 'none',
                        color: 'inherit',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <img
                        src={likerPhoto}
                        alt={likerName}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          backgroundColor: 'var(--bg-input)',
                        }}
                        onError={(e) => {
                          e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                        }}
                      />
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {likerName}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-dim)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          @{likerUsername}
                        </div>
                      </div>
                    </Link>

                    <Link
                      to={`/profile/${likerId}`}
                      onClick={onClose}
                      className="btn-preview-toggle"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <UserCheck size={13} />
                      <span>View</span>
                    </Link>
                  </div>
                );
              })}

            
              {hasMore && (
                <div style={{ textAlign: 'center', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-preview-toggle"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    {loadingMore ? 'Loading more...' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
