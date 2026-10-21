import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, AlertCircle, RefreshCw, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/users.api';
import Footer from '../../components/common/Footer';


function getNotificationTarget(notif) {
  const type = (notif.type || notif.notificationType || '').toLowerCase();
  const postId =
    notif.post?._id || notif.post?.id ||
    notif.postId ||
    notif.relatedPost?._id || notif.relatedPost?.id ||
    null;
  const commentId =
    notif.comment?._id || notif.comment?.id ||
    notif.commentId ||
    notif.relatedComment?._id || notif.relatedComment?.id ||
    null;
  const replyId =
    notif.reply?._id || notif.reply?.id ||
    notif.replyId ||
    null;
  const senderId =
    notif.sender?._id || notif.sender?.id ||
    notif.actor?._id || notif.actor?.id ||
    notif.userId ||
    null;

 
  if (type.includes('follow') && senderId) {
    return { to: `/profile/${senderId}`, search: '' };
  }

  
  if ((type.includes('like') || type.includes('liked')) && postId) {
    return { to: '/', search: `?post=${postId}` };
  }


  if ((type.includes('comment') || type.includes('reply')) && postId) {
    const params = new URLSearchParams({ post: postId });
    if (commentId) params.set('comment', commentId);
    if (replyId && !commentId) params.set('comment', replyId);
    return { to: '/', search: `?${params.toString()}` };
  }

 
  if (postId) {
    return { to: '/', search: `?post=${postId}` };
  }

  
  if (senderId) {
    return { to: `/profile/${senderId}`, search: '' };
  }

  return null;
}


function NotifIcon({ notif }) {
  const type = (notif.type || notif.notificationType || '').toLowerCase();
  if (type.includes('follow')) return <UserPlus size={14} />;
  if (type.includes('like')) return <Heart size={14} fill="currentColor" />;
  if (type.includes('comment') || type.includes('reply')) return <MessageCircle size={14} />;
  return <Bell size={14} />;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [notifsRes, unreadRes] = await Promise.all([
        notificationsApi.getNotifications({ page: 1, limit: 50 }),
        notificationsApi.getUnreadCount(),
      ]);
      const list = notifsRes?.data?.notifications || [];
      setNotifications(list);
      setUnreadCount(unreadRes?.data?.unreadCount ?? 0);
    } catch (err) {
      const msg =
        err.friendlyMessage || err.message || 'Unable to load notifications.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (notifId) => {
    try {
      await notificationsApi.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === notifId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      
    }
  }, []);

  const handleMarkAll = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      
    } finally {
      setMarkingAll(false);
    }
  };

  
  const handleNotifClick = useCallback(async (notif) => {
    const notifId = notif._id || notif.id;
    const isRead = Boolean(notif.read);

    
    if (!isRead && notifId) {
      handleMarkAsRead(notifId);
    }

    const target = getNotificationTarget(notif);
    if (target) {
      navigate(`${target.to}${target.search}`);
    }
  }, [handleMarkAsRead, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const now = new Date();
      const diff = now - d;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="auth-page-container" style={{ padding: '2rem 1.5rem' }}>
      <div className="pill-badge">
        <span className="pill-dot" />
        <span>INBOX • NOTIFICATIONS</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Notifications
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.94rem',
            maxWidth: '480px',
            margin: '0.4rem auto 0 auto',
          }}
        >
          Activity on your posts, replies, and follows.
        </p>
      </div>

      {/* Actions bar */}
      {!isLoading && !error && notifications.length > 0 && unreadCount > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            maxWidth: '680px',
            marginBottom: '1rem',
          }}
        >
          <button
            type="button"
            className="btn-preview-toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
            }}
            onClick={handleMarkAll}
            disabled={markingAll}
          >
            <CheckCheck size={14} />
            <span>{markingAll ? 'Marking...' : 'Mark all as read'}</span>
          </button>
        </div>
      )}

      {error ? (
        <div
          className="alert-banner error"
          style={{ maxWidth: '680px', width: '100%' }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={loadNotifications}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={14} />
          </button>
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
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Loading notifications...
          </span>
        </div>
      ) : notifications.length === 0 ? (
        <div
          className="auth-card"
          style={{ maxWidth: '480px', textAlign: 'center', padding: '3.5rem 2rem' }}
        >
          <Bell size={36} style={{ color: 'var(--primary-orange)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No notifications yet</h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              marginTop: '0.4rem',
              lineHeight: 1.5,
            }}
          >
            When someone likes or comments on your posts, you will see it here.
          </p>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: '680px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {notifications.map((notif) => {
            const notifId = notif._id || notif.id;
            const isRead = Boolean(notif.read);
            const senderName =
              notif.sender?.name || notif.actor?.name || 'Someone';
            const senderPhoto =
              notif.sender?.photo || notif.actor?.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg';
            const senderId =
              notif.sender?._id || notif.sender?.id ||
              notif.actor?._id || notif.actor?.id ||
              null;
            const message =
              notif.message ||
              notif.body ||
              `${senderName} interacted with your content`;
            const target = getNotificationTarget(notif);
            const isNavigable = Boolean(target);
            const timeLabel = formatDate(notif.createdAt);

            const notifContent = (
              <>
                {/* Sender avatar — links to profile if known */}
                {senderId ? (
                  <Link
                    to={`/profile/${senderId}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ flexShrink: 0 }}
                  >
                    <img
                      src={senderPhoto}
                      alt={senderName}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                      }}
                    />
                  </Link>
                ) : (
                  <img
                    src={senderPhoto}
                    alt={senderName}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                    }}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: isRead ? 400 : 600,
                      color: 'var(--text-main)',
                      lineHeight: 1.4,
                    }}
                  >
                    {message}
                  </div>
                  {timeLabel && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        marginTop: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <NotifIcon notif={notif} />
                      {timeLabel}
                      {isNavigable && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--primary-orange)',
                            fontWeight: 600,
                            marginLeft: '0.25rem',
                          }}
                        >
                          View →
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-orange)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </>
            );

            return (
              <div
                key={notifId}
                className="auth-card"
                style={{
                  maxWidth: '100%',
                  padding: '1.1rem 1.4rem',
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  backgroundColor: isRead
                    ? 'var(--bg-card)'
                    : 'var(--primary-orange-subtle)',
                  borderColor: isRead
                    ? 'var(--border-color)'
                    : 'var(--primary-orange)',
                  cursor: isNavigable ? 'pointer' : (isRead ? 'default' : 'pointer'),
                  transition: 'background-color 0.2s, border-color 0.2s',
                }}
                onClick={() => handleNotifClick(notif)}
                role={isNavigable || !isRead ? 'button' : undefined}
                tabIndex={isNavigable || !isRead ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotifClick(notif);
                  }
                }}
              >
                {notifContent}
              </div>
            );
          })}
        </div>
      )}

      <Footer showTag={true} />
    </div>
  );
}
