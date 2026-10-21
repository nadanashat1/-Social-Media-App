import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Heart, MessageCircle, Bookmark, Sparkles, Send,
  Repeat, AlertCircle, RefreshCw, Share2, Image as ImageIcon, X,
} from 'lucide-react';
import postsApi from '../../api/posts.api';
import usersApi from '../../api/users.api';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/common/Footer';
import PostCommentsModal from '../../components/common/PostCommentsModal';
import PostLikesModal from '../../components/common/PostLikesModal';

export default function Feed({ feedRefreshKey }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [moreError, setMoreError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Composer state
  const [newPostBody, setNewPostBody] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const composerFileRef = useRef(null);

  // Follow states for sidebar
  const [followingMap, setFollowingMap] = useState({});

  // Active post for comments modal
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [highlightCommentId, setHighlightCommentId] = useState(null);

  // Active post for likes modal
  const [activeLikesPostId, setActiveLikesPostId] = useState(null);

  // Deep linking to post from search query (e.g. ?post=123&comment=456)
  const queryPostId = searchParams.get('post');
  const queryCommentId = searchParams.get('comment');

  useEffect(() => {
    if (queryPostId) {
      let isMounted = true;
      const found = posts.find((p) => (p._id || p.id) === queryPostId);
      if (found) {
        setActiveCommentPost(found);
        setHighlightCommentId(queryCommentId || null);
      } else {
        postsApi.getPost(queryPostId).then((res) => {
          if (isMounted && res?.data?.post) {
            setActiveCommentPost(res.data.post);
            setHighlightCommentId(queryCommentId || null);
          }
        }).catch(() => {
          // If post doesn't exist, ignore
        });
      }
      return () => { isMounted = false; };
    }
  }, [queryPostId, queryCommentId, posts]);

  const handleCloseCommentModal = useCallback(() => {
    setActiveCommentPost(null);
    setHighlightCommentId(null);
    if (searchParams.has('post') || searchParams.has('comment')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('post');
        next.delete('comment');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Sentinel ref for IntersectionObserver (infinite scroll)
  const sentinelRef = useRef(null);
  const isFetchingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const currentPageRef = useRef(1);

  // Keep refs in sync with state (to avoid stale closures in observer)
  useEffect(() => {
    isFetchingMoreRef.current = isFetchingMore;
  }, [isFetchingMore]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // ─── Fetch first page (or refresh) ────────────────────────────────────────
  const fetchInitialPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMoreError(null);
    setCurrentPage(1);
    currentPageRef.current = 1;

    try {
      const response = await postsApi.getPosts({ limit: 15, page: 1 });

      if (response?.success === false) {
        throw new Error(response.message || 'Failed to load feed.');
      }

      let postsArray = [];
      if (Array.isArray(response?.data?.posts)) {
        postsArray = response.data.posts;
      } else if (Array.isArray(response?.posts)) {
        postsArray = response.posts;
      } else if (Array.isArray(response?.data)) {
        postsArray = response.data;
      }

      setPosts(postsArray);

      const pagination = response?.meta?.pagination || response?.paginationInfo || response?.pagination;
      if (pagination) {
        const more =
          (pagination.currentPage < pagination.numberOfPages) ||
          (pagination.nextPage != null);
        setHasMore(more);
        hasMoreRef.current = more;
      } else {
        const more = postsArray.length === 15;
        setHasMore(more);
        hasMoreRef.current = more;
      }
    } catch (err) {
      const msg =
        err.friendlyMessage ||
        err.message ||
        'Unable to connect to Route network feed.';
      setError(msg);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMorePosts = useCallback(async () => {
    if (isFetchingMoreRef.current || !hasMoreRef.current) return;
    setIsFetchingMore(true);
    isFetchingMoreRef.current = true;
    setMoreError(null);

    const nextPage = currentPageRef.current + 1;

    try {
      const response = await postsApi.getPosts({ limit: 15, page: nextPage });

      let incoming = [];
      if (Array.isArray(response?.data?.posts)) {
        incoming = response.data.posts;
      } else if (Array.isArray(response?.posts)) {
        incoming = response.posts;
      } else if (Array.isArray(response?.data)) {
        incoming = response.data;
      }

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id || p.id));
        const fresh = incoming.filter((p) => !existingIds.has(p._id || p.id));
        return [...prev, ...fresh];
      });

      const pagination = response?.meta?.pagination || response?.paginationInfo || response?.pagination;
      const resolvedPage = pagination?.currentPage || nextPage;
      setCurrentPage(resolvedPage);
      currentPageRef.current = resolvedPage;

      if (pagination) {
        const more =
          (pagination.currentPage < pagination.numberOfPages) ||
          (pagination.nextPage != null);
        setHasMore(more);
        hasMoreRef.current = more;
      } else {
        const more = incoming.length === 15;
        setHasMore(more);
        hasMoreRef.current = more;
      }
    } catch (err) {
      const msg =
        err.friendlyMessage || err.message || 'Failed to load more posts.';
      setMoreError(msg);
    } finally {
      setIsFetchingMore(false);
      isFetchingMoreRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchInitialPosts();
  }, [fetchInitialPosts, feedRefreshKey]);

  useEffect(() => {
    let isMounted = true;
    async function loadSuggestions() {
      try {
        const sugRes = await usersApi.getFollowSuggestions({ page: 1, limit: 5 });
        if (isMounted) {
          const list = sugRes?.data?.suggestions || [];
          setSuggestions(list);
        }
      } catch {
        if (isMounted) setSuggestions([]);
      }
    }
    loadSuggestions();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isFetchingMoreRef.current) {
          fetchMorePosts();
        }
      },
      { rootMargin: '300px', threshold: 0 }
    );
    observer.observe(sentinel);

    
    const rect = sentinel.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight + 300;
    if (alreadyVisible && hasMoreRef.current && !isFetchingMoreRef.current) {
      fetchMorePosts();
    }

    return () => {
      observer.disconnect();
    };
  }, [fetchMorePosts, posts.length]);

 
  const handleComposerImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPostError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPostError('Image must be under 5 MB.');
      return;
    }
    setPostError(null);
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const removeComposerImage = () => {
    setPostImage(null);
    if (postImagePreview) URL.revokeObjectURL(postImagePreview);
    setPostImagePreview(null);
    if (composerFileRef.current) composerFileRef.current.value = '';
  };

 
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (isPosting) return;
    if (!newPostBody.trim() && !postImage) return;

    setIsPosting(true);
    setPostError(null);

    try {
      const res = await postsApi.createPost({ body: newPostBody, image: postImage });
      const createdPost = res?.data?.post || null;

      if (createdPost && (createdPost._id || createdPost.id)) {
        setPosts((prev) => [createdPost, ...prev]);
      } else {
        await fetchInitialPosts();
      }
      setNewPostBody('');
      removeComposerImage();
    } catch (err) {
      setPostError(err.friendlyMessage || err.message || 'Failed to publish post.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFollowSidebar = async (userId) => {
    const wasFollowing = Boolean(followingMap[userId]);
    setFollowingMap((prev) => ({ ...prev, [userId]: !wasFollowing }));
    try {
      const res = await usersApi.followUser(userId);
      if (res?.data && typeof res.data.following === 'boolean') {
        setFollowingMap((prev) => ({ ...prev, [userId]: res.data.following }));
      }
    } catch {
      setFollowingMap((prev) => ({ ...prev, [userId]: wasFollowing }));
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await postsApi.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId || p.id === postId) {
            const wasLiked = Boolean(p.liked);
            const currentLikes = p.likesCount ?? (Array.isArray(p.likes) ? p.likes.length : 0);
            return {
              ...p,
              liked: !wasLiked,
              likesCount: wasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
            };
          }
          return p;
        })
      );
    } catch {
      
    }
  };

  const handleBookmarkPost = async (postId) => {
    try {
      await postsApi.toggleBookmark(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId || p.id === postId) {
            return { ...p, bookmarked: !p.bookmarked };
          }
          return p;
        })
      );
    } catch {
     
    }
  };

  const handleCommentClick = (post) => {
    setActiveCommentPost(post);
  };

  const handlePostUpdated = (postId, update) => {
    setPosts((prev) =>
      prev.map((p) => {
        if ((p._id || p.id) === postId) return { ...p, ...update };
        return p;
      })
    );
  };

  const formatPostDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <>
      <div className="auth-page-container" style={{ padding: '2rem 1.5rem', alignItems: 'stretch' }}>
        <div
          style={{
            maxWidth: '1080px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            gap: '2rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Main Column */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Create Post Card */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '1.5rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <img
                  src={user?.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
                  alt={user?.name || 'User'}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg'; }}
                />
                <form onSubmit={handleCreatePost} style={{ flex: 1 }}>
                  <textarea
                    className="form-input"
                    style={{ height: '80px', padding: '0.8rem', resize: 'none', lineHeight: 1.4 }}
                    placeholder="Compose an essay excerpt, spatial observation, or inquiry..."
                    value={newPostBody}
                    onChange={(e) => setNewPostBody(e.target.value)}
                    disabled={isPosting}
                  />

                  {/* Image preview in composer */}
                  {postImagePreview && (
                    <div style={{ position: 'relative', marginTop: '0.65rem', display: 'inline-block' }}>
                      <img
                        src={postImagePreview}
                        alt="Post preview"
                        style={{ maxHeight: '160px', width: '100%', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={removeComposerImage}
                        style={{
                          position: 'absolute',
                          top: '0.4rem',
                          right: '0.4rem',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 26,
                          height: 26,
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

                  {postError && (
                    <div style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.4rem' }}>
                      {postError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <div>
                      <input
                        ref={composerFileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleComposerImageChange}
                        disabled={isPosting}
                      />
                      <button
                        type="button"
                        className="btn-preview-toggle"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                        onClick={() => composerFileRef.current?.click()}
                        disabled={isPosting}
                      >
                        <ImageIcon size={13} />
                        <span>Photo</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="btn-create-post"
                      style={{ padding: '0.45rem 1.25rem', fontSize: '0.88rem' }}
                      disabled={isPosting || (!newPostBody.trim() && !postImage)}
                    >
                      {isPosting ? (
                        <div className="spinner" style={{ width: 14, height: 14 }} />
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Publish Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Initial Loading State */}
            {isLoading && (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner dark" style={{ margin: '0 auto 1rem auto', width: 28, height: 28 }} />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Loading network feed...
                </span>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="feed-error-container">
                <AlertCircle size={32} color="#DC2626" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Unable to Load Publications
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', marginBottom: '1.25rem' }}>
                  {error}
                </p>
                <button
                  type="button"
                  className="btn-create-post"
                  onClick={fetchInitialPosts}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.86rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Retry Request</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && posts.length === 0 && (
              <div className="auth-card" style={{ maxWidth: '100%', textAlign: 'center', padding: '3.5rem 2rem' }}>
                <Sparkles size={32} style={{ color: 'var(--primary-orange)', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Welcome to your Route Feed</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                  Follow curators from the suggestions panel to populate your stream with essays and works.
                </p>
              </div>
            )}

            {/* Posts List */}
            {!isLoading && !error && posts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {posts.map((post) => {
                  const postId = post._id || post.id;
                  const author = post.user || {};
                  const authorId = author._id || author.id;
                  const isShared = Boolean(post.isShare || post.sharedPost);
                  const sharedPost = post.sharedPost;
                  const origAuthor = sharedPost?.user || {};
                  const origAuthorId = origAuthor._id || origAuthor.id;

                  const likesCount = post.likesCount ?? (Array.isArray(post.likes) ? post.likes.length : 0);
                  const commentsCount = post.commentsCount ?? 0;
                  const sharesCount = post.sharesCount ?? 0;
                  const isLiked = Boolean(
                    post.liked || (Array.isArray(post.likes) && user?._id && post.likes.includes(user._id))
                  );
                  const isBookmarked = Boolean(post.bookmarked);

                  return (
                    <article
                      key={postId}
                      className="auth-card"
                      style={{ maxWidth: '100%', padding: '1.75rem', marginBottom: 0 }}
                    >
                      {/* Shared indicator */}
                      {isShared && (
                        <div className="shared-indicator">
                          <Repeat size={14} />
                          <span>Shared Dispatch</span>
                        </div>
                      )}

                      {/* Author Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Link to={authorId ? `/profile/${authorId}` : '#'}>
                            <img
                              src={author.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
                              alt={author.name || 'Author'}
                              style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg'; }}
                            />
                          </Link>
                          <div>
                            <Link
                              to={authorId ? `/profile/${authorId}` : '#'}
                              style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}
                            >
                              {author.name || 'Route Author'}
                            </Link>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              @{author.username || 'member'} • {formatPostDate(post.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Post Text Body */}
                      {post.body && (
                        <p style={{ fontSize: '0.96rem', lineHeight: 1.6, marginBottom: (post.image || isShared) ? '1rem' : '0.5rem', whiteSpace: 'pre-wrap' }}>
                          {post.body}
                        </p>
                      )}

                      {/* Post Image */}
                      {post.image && (
                        <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '1.25rem', maxHeight: '480px' }}>
                          <img
                            src={post.image}
                            alt="Post attachment"
                            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {/* Embedded Shared Post */}
                      {isShared && sharedPost && (
                        <div className="shared-post-embed">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                            <Link to={origAuthorId ? `/profile/${origAuthorId}` : '#'}>
                              <img
                                src={origAuthor.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
                                alt={origAuthor.name || 'Original author'}
                                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => { e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg'; }}
                              />
                            </Link>
                            <div>
                              <Link
                                to={origAuthorId ? `/profile/${origAuthorId}` : '#'}
                                style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}
                              >
                                {origAuthor.name || 'Original Author'}
                              </Link>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                                @{origAuthor.username || 'member'} • {formatPostDate(sharedPost.createdAt)}
                              </div>
                            </div>
                          </div>
                          {sharedPost.body && (
                            <p style={{ fontSize: '0.91rem', lineHeight: 1.55, marginBottom: sharedPost.image ? '0.75rem' : 0, whiteSpace: 'pre-wrap' }}>
                              {sharedPost.body}
                            </p>
                          )}
                          {sharedPost.image && (
                            <div style={{ borderRadius: '10px', overflow: 'hidden', maxHeight: '380px', marginTop: '0.5rem' }}>
                              <img
                                src={sharedPost.image}
                                alt="Shared post attachment"
                                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Top Comment Preview */}
                      {post.topComment && post.topComment.content && (
                        <div className="top-comment-box">
                          <div className="top-comment-author">
                            <MessageCircle size={13} color="var(--primary-orange)" />
                            <span>{post.topComment.commentCreator?.name || 'Reader'}:</span>
                          </div>
                          <div className="top-comment-content">{post.topComment.content}</div>
                        </div>
                      )}

                      {/* Engagement Actions Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '0.85rem',
                          marginTop: '0.75rem',
                          borderTop: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          fontSize: '0.86rem',
                        }}
                      >
                        {/* Like Control and Count */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <button
                            type="button"
                            onClick={() => handleLikePost(postId)}
                            aria-label={isLiked ? 'Unlike post' : 'Like post'}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.25rem',
                              color: isLiked ? '#DC2626' : 'inherit',
                              transition: 'transform 0.15s ease, color 0.15s ease',
                            }}
                          >
                            <Heart
                              size={16}
                              fill={isLiked ? '#DC2626' : 'none'}
                              color={isLiked ? '#DC2626' : 'currentColor'}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveLikesPostId(postId)}
                            className="like-count-btn"
                            aria-label={`View ${likesCount} likes`}
                            title={likesCount > 0 ? `View ${likesCount} users who liked this` : 'No likes yet'}
                            style={{
                              color: isLiked ? '#DC2626' : 'inherit',
                              fontWeight: isLiked ? 700 : 500,
                            }}
                          >
                            {likesCount}
                          </button>
                        </div>

                        {/* Comments — clickable */}
                        <button
                          type="button"
                          onClick={() => handleCommentClick(post)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          aria-label="View comments"
                        >
                          <MessageCircle size={16} />
                          <span>{commentsCount}</span>
                        </button>

                        {/* Shares count (display only) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Share2 size={16} />
                          <span>{sharesCount}</span>
                        </div>

                        {/* Bookmark */}
                        <button
                          type="button"
                          onClick={() => handleBookmarkPost(postId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            color: isBookmarked ? 'var(--primary-orange)' : 'inherit',
                            fontWeight: isBookmarked ? 700 : 500,
                          }}
                        >
                          <Bookmark
                            size={16}
                            fill={isBookmarked ? 'var(--primary-orange)' : 'none'}
                            color={isBookmarked ? 'var(--primary-orange)' : 'currentColor'}
                          />
                          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} style={{ height: 1 }} />

                {/* Loading more indicator */}
                {isFetchingMore && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div className="spinner dark" style={{ margin: '0 auto', width: 22, height: 22 }} />
                  </div>
                )}

                {/* Load-more error + retry */}
                {moreError && !isFetchingMore && (
                  <div
                    className="alert-banner error"
                    style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem' }}
                  >
                    <AlertCircle size={16} />
                    <span style={{ fontSize: '0.84rem', flex: 1 }}>{moreError}</span>
                    <button
                      type="button"
                      className="alert-dismiss-btn"
                      onClick={fetchMorePosts}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                )}

                {/* End of feed */}
                {!hasMore && !isFetchingMore && posts.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    You have reached the end of the feed.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside style={{ width: '320px', flexShrink: 0 }} className="desktop-sidebar">
            <div className="auth-card" style={{ maxWidth: '100%', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 800 }}>Suggested Authors</div>
                <Link to="/discover" style={{ fontSize: '0.78rem', color: 'var(--primary-orange)', fontWeight: 700 }}>
                  See All
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {suggestions.map((sug) => {
                  const sugId = sug._id || sug.id;
                  const isFollowing = Boolean(followingMap[sugId]);
                  return (
                    <div key={sugId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <Link to={`/profile/${sugId}`}>
                          <img
                            src={sug.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
                            alt={sug.name}
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg'; }}
                          />
                        </Link>
                        <div style={{ overflow: 'hidden' }}>
                          <Link
                            to={`/profile/${sugId}`}
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {sug.name}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            @{sug.username}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-preview-toggle"
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          backgroundColor: isFollowing ? 'var(--bg-input)' : undefined,
                          color: isFollowing ? 'var(--text-dim)' : 'var(--primary-orange)',
                          fontWeight: 700,
                        }}
                        onClick={() => handleFollowSidebar(sugId)}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6, padding: '0 0.5rem' }}>
              <p>Route Independent Press Network • Est. 2025</p>
              <p style={{ marginTop: '0.25rem' }}>All dispatches protected by editorial protocol.</p>
            </div>
          </aside>
        </div>

        <Footer showTag={true} />
      </div>

      {/* Comments Modal */}
      {activeCommentPost && (
        <PostCommentsModal
          post={activeCommentPost}
          highlightCommentId={highlightCommentId}
          onClose={handleCloseCommentModal}
          onPostUpdate={(update) =>
            handlePostUpdated(activeCommentPost._id || activeCommentPost.id, update)
          }
        />
      )}

      {/* Likes Modal */}
      {activeLikesPostId && (
        <PostLikesModal
          postId={activeLikesPostId}
          onClose={() => setActiveLikesPostId(null)}
        />
      )}
    </>
  );
}
