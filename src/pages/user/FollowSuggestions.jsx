import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, UserCheck, ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import usersApi from '../../api/users.api';
import Footer from '../../components/common/Footer';

export default function FollowSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, limit: 12, total: 0, numberOfPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

 
  const [followingMap, setFollowingMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const fetchSuggestions = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await usersApi.getFollowSuggestions({ page, limit: 12 });
      const userList = res?.data?.suggestions || [];
      setSuggestions(userList);
      if (res?.meta?.pagination) {
        setPagination(res.meta.pagination);
      }
    } catch (err) {
      const msg = err.friendlyMessage || err.message || 'Unable to load member suggestions.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(pagination.currentPage);
  }, [fetchSuggestions, pagination.currentPage]);

  const handleFollowToggle = async (userId) => {
    if (!userId || loadingMap[userId]) return;

    setLoadingMap((prev) => ({ ...prev, [userId]: true }));
    const wasFollowing = Boolean(followingMap[userId]);

    
    setFollowingMap((prev) => ({ ...prev, [userId]: !wasFollowing }));

    try {
      const res = await usersApi.followUser(userId);
      if (res?.data && typeof res.data.following === 'boolean') {
        setFollowingMap((prev) => ({ ...prev, [userId]: res.data.following }));
      }
    } catch {
      
      setFollowingMap((prev) => ({ ...prev, [userId]: wasFollowing }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="auth-page-container" style={{ padding: '2rem 1.5rem' }}>
      {/* Pill Badge */}
      <div className="pill-badge">
        <span className="pill-dot"></span>
        <span>CURATED DISCOVERY • ROUTE INDEX</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Explore Authors & Curators
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', maxWidth: '520px', margin: '0.5rem auto 0 auto' }}>
          Discover evocative voices, spatial photographers, and creative directors active across the Route publication network.
        </p>
      </div>

      {error ? (
        <div className="alert-banner error" style={{ maxWidth: '640px', width: '100%' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : isLoading ? (
        <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="spinner dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Curating recommendations...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
          <Sparkles size={32} style={{ color: 'var(--primary-orange)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No suggestions found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.5rem' }}>
            Check back later as new members complete their induction.
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '980px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            {suggestions.map((item) => {
              const userId = item._id || item.id;
              const isFollowing = Boolean(followingMap[userId]);
              const isActionLoading = Boolean(loadingMap[userId]);

              return (
                <div
                  key={userId}
                  className="auth-card"
                  style={{
                    maxWidth: '100%',
                    padding: '1.5rem',
                    marginBottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <Link to={`/profile/${userId}`}>
                      <img
                        src={item.photo || '/images/default-avatar.jpg'}
                        alt={item.name}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--border-color)',
                          backgroundColor: 'var(--bg-input)',
                        }}
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-avatar.jpg';
                        }}
                      />
                    </Link>
                    <div style={{ overflow: 'hidden' }}>
                      <Link
                        to={`/profile/${userId}`}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          color: 'var(--text-main)',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </Link>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        @{item.username || 'author'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {item.followersCount || 0} followers
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/profile/${userId}`}
                      className="btn-preview-toggle"
                      style={{ flex: 1, textAlign: 'center', padding: '0.55rem', fontSize: '0.82rem' }}
                    >
                      View Folio
                    </Link>

                    <button
                      type="button"
                      className="btn-submit-orange"
                      style={{
                        flex: 1.2,
                        height: 38,
                        fontSize: '0.82rem',
                        backgroundColor: isFollowing ? 'var(--bg-input)' : 'var(--primary-orange)',
                        color: isFollowing ? 'var(--text-main)' : '#FFFFFF',
                        boxShadow: isFollowing ? 'none' : undefined,
                      }}
                      onClick={() => handleFollowToggle(userId)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <div className="spinner" style={{ width: 14, height: 14 }} />
                      ) : isFollowing ? (
                        <>
                          <UserCheck size={14} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.numberOfPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              <button
                type="button"
                className="btn-preview-toggle"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem' }}
                disabled={pagination.currentPage <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                Page {pagination.currentPage} of {pagination.numberOfPages}
              </span>

              <button
                type="button"
                className="btn-preview-toggle"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem' }}
                disabled={pagination.currentPage >= pagination.numberOfPages}
                onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <Footer showTag={true} />
    </div>
  );
}
