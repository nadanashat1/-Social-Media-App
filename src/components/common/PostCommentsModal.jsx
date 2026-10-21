import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageCircle, Heart, Send, Image as ImageIcon, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import postsApi from '../../api/posts.api';
import { useAuth } from '../../context/AuthContext';
import useModalA11y from '../../hooks/useModalA11y';


export default function PostCommentsModal({ post, onClose, onPostUpdate, highlightCommentId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fileInputRef = useRef(null);
  const postId = post?._id || post?.id;

  const dialogRef = useModalA11y(Boolean(post), onClose);

  const fetchComments = useCallback(
    async (targetPage = 1, append = false) => {
      if (!postId) return;
      if (append) setLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      try {
        const res = await postsApi.getComments(postId, { page: targetPage, limit: 20 });
        const list = res?.data?.comments || [];
        const pagination = res?.meta?.pagination;
        setComments((prev) => {
          if (!append) return list;
          const existingIds = new Set(prev.map((c) => c._id || c.id));
          const fresh = list.filter((c) => !existingIds.has(c._id || c.id));
          return [...prev, ...fresh];
        });
        if (pagination) {
          setHasMore(pagination.currentPage < pagination.numberOfPages);
        } else {
          setHasMore(list.length === 20);
        }
      } catch (err) {
        const msg = err.friendlyMessage || err.message || 'Could not load comments.';
        setError(msg);
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    fetchComments(1, false);
  }, [fetchComments]);

  useEffect(() => {
    if (highlightCommentId && comments.length > 0) {
      const el = document.getElementById(`comment-${highlightCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightCommentId, comments]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Image must be under 5 MB.');
      return;
    }
    setSubmitError(null);
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setCommentImage(null);
    if (commentImagePreview) URL.revokeObjectURL(commentImagePreview);
    setCommentImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!commentText.trim() && !commentImage) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await postsApi.createComment(postId, {
        content: commentText.trim(),
        image: commentImage,
      });
      const newComment = res?.data?.comment;
      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
      }
      setCommentText('');
      removeImage();
      if (onPostUpdate) {
        onPostUpdate({ commentsCount: (post.commentsCount ?? 0) + 1 });
      }
    } catch (err) {
      setSubmitError(err.friendlyMessage || err.message || 'Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage, true);
  };

  const formatDate = (ds) => {
    if (!ds) return '';
    try {
      return new Date(ds).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (!post) return null;
  const author = post.user || {};

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Post comments"
        className="auth-card"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          marginBottom: 0,
          padding: '1.75rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
       
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={18} color="var(--primary-orange)" />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Comments</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--text-dim)' }}
            aria-label="Close comments"
          >
            <X size={20} />
          </button>
        </div>

        
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: post.body ? '0.75rem' : 0,
            }}
          >
            <img
              src={author.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
              alt={author.name || 'Author'}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {author.name || 'Route Author'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                @{author.username || 'member'} • {formatDate(post.createdAt)}
              </div>
            </div>
          </div>
          {post.body && (
            <p
              style={{
                fontSize: '0.92rem',
                lineHeight: 1.55,
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {post.body}
            </p>
          )}
          {post.image && (
            <div
              style={{
                marginTop: '0.75rem',
                borderRadius: '10px',
                overflow: 'hidden',
                maxHeight: '240px',
              }}
            >
              <img
                src={post.image}
                alt="Post attachment"
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.75rem',
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Heart size={13} />
              {post.likesCount ?? 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MessageCircle size={13} />
              {post.commentsCount ?? comments.length}
            </span>
          </div>
        </div>

       
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <img
              src={user?.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
              alt={user?.name || 'You'}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => {
                e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
              }}
            />
            <textarea
              className="form-input"
              style={{ height: '70px', padding: '0.7rem', resize: 'none', lineHeight: 1.4 }}
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          
          {commentImagePreview && (
            <div style={{ position: 'relative', display: 'inline-block', marginLeft: '3rem' }}>
              <img
                src={commentImagePreview}
                alt="Comment attachment preview"
                style={{ maxHeight: '140px', borderRadius: '10px', objectFit: 'cover', display: 'block' }}
              />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: 'absolute',
                  top: '0.3rem',
                  right: '0.3rem',
                  color: '#fff',
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Remove image"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {submitError && (
            <div style={{ fontSize: '0.8rem', color: '#DC2626', marginLeft: '3rem' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '3rem' }}>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="btn-preview-toggle"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <ImageIcon size={13} />
                <span>Photo</span>
              </button>
            </div>
            <button
              type="submit"
              className="btn-create-post"
              style={{ padding: '0.4rem 1rem', fontSize: '0.84rem' }}
              disabled={isSubmitting || (!commentText.trim() && !commentImage)}
            >
              {isSubmitting ? (
                <div className="spinner" style={{ width: 13, height: 13 }} />
              ) : (
                <>
                  <Send size={13} />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </form>

        
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner dark" style={{ margin: '0 auto', width: 24, height: 24 }} />
            </div>
          ) : error ? (
            <div className="alert-banner error" style={{ padding: '0.75rem 1rem' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.84rem' }}>{error}</span>
              <button
                type="button"
                className="alert-dismiss-btn"
                onClick={() => fetchComments(1, false)}
              >
                <RefreshCw size={13} />
              </button>
            </div>
          ) : comments.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                padding: '1.5rem 0',
              }}
            >
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map((comment) => {
                const commentId = comment._id || comment.id;
                const creator = comment.commentCreator || {};
                return (
                  <div
                    key={commentId}
                    style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}
                  >
                    <img
                      src={creator.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
                      alt={creator.name || 'Commenter'}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.85rem',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            color: 'var(--text-main)',
                            marginBottom: '0.2rem',
                          }}
                        >
                          {creator.name || 'Reader'}
                          <span
                            style={{
                              fontWeight: 400,
                              color: 'var(--text-dim)',
                              marginLeft: '0.5rem',
                              fontSize: '0.76rem',
                            }}
                          >
                            @{creator.username || 'member'}
                          </span>
                        </div>
                        {comment.content && (
                          <p
                            style={{
                              fontSize: '0.88rem',
                              lineHeight: 1.45,
                              color: 'var(--text-main)',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {comment.content}
                          </p>
                        )}
                        {comment.image && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              maxHeight: '200px',
                            }}
                          >
                            <img
                              src={comment.image}
                              alt="Comment attachment"
                              loading="lazy"
                              style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {comment.createdAt && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-dim)',
                            marginTop: '0.3rem',
                            paddingLeft: '0.85rem',
                          }}
                        >
                          {formatDate(comment.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-preview-toggle"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <div className="spinner dark" style={{ width: 14, height: 14 }} />
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        <span>Load more comments</span>
                      </>
                    )}
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
