import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Mail, Camera, Lock, Heart, MessageCircle, UserPlus, UserCheck, AlertCircle, Sparkles, Send, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import usersApi from '../../api/users.api';
import postsApi from '../../api/posts.api';
import UploadPhotoModal from './UploadPhotoModal';
import Footer from '../../components/common/Footer';

export default function Profile({ onPostCreated }) {
  const { userId } = useParams();
  const { user: currentUser, refreshProfile } = useAuth();

  const isOwnProfile = !userId || userId === currentUser?._id || userId === currentUser?.id;

  const [profileData, setProfileData] = useState(isOwnProfile ? currentUser : null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);

 
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  
  const [composerBody, setComposerBody] = useState('');
  const [composerImage, setComposerImage] = useState(null);
  const [composerImagePreview, setComposerImagePreview] = useState(null);
  const [isComposerPosting, setIsComposerPosting] = useState(false);
  const [composerError, setComposerError] = useState(null);
  const composerFileRef = useRef(null);

  const fetchUserPosts = useCallback(async (targetUserId) => {
    setPostsLoading(true);
    try {
      const res = await usersApi.getUserPosts(targetUserId);
      const postList = res?.data?.posts || [];
      setPosts(postList);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

 
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOwnProfile) {
        const res = await usersApi.getProfileData();
        const profileUser = res?.data?.user;
        setProfileData(profileUser || currentUser);
        setFollowersCount(profileUser?.followersCount || 0);

       
        if (profileUser?._id || profileUser?.id) {
          const targetId = profileUser._id || profileUser.id;
          fetchUserPosts(targetId);
        }
      } else {
        const res = await usersApi.getUserProfile(userId);
        const profileUser = res?.data?.user;
        setProfileData(profileUser);
        setFollowersCount(profileUser?.followersCount || 0);

        // Check if current user is following this user
        if (Array.isArray(profileUser?.followers) && currentUser?._id) {
          const isFollowed = profileUser.followers.some(
            (f) => (typeof f === 'string' ? f === currentUser._id : f?._id === currentUser._id)
          );
          setIsFollowing(isFollowed);
        }

        fetchUserPosts(userId);
      }
    } catch (err) {
      const msg = err.friendlyMessage || err.message || 'Unable to load profile data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isOwnProfile, currentUser, fetchUserPosts]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle follow / unfollow
  const handleFollowToggle = async () => {
    if (!userId || followLoading) return;
    setFollowLoading(true);

    // Optimistic toggle
    const prevFollowing = isFollowing;
    const prevCount = followersCount;
    setIsFollowing(!prevFollowing);
    setFollowersCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await usersApi.followUser(userId);
      if (res?.data) {
        if (typeof res.data.following === 'boolean') {
          setIsFollowing(res.data.following);
        }
        if (typeof res.data.followersCount === 'number') {
          setFollowersCount(res.data.followersCount);
        }
      }
    } catch {
      // Revert on error
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePhotoUpdated = async () => {
    await refreshProfile();
    await fetchProfile();
  };

  const avatar = profileData?.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg';

  return (
    <div className="auth-page-container" style={{ padding: '2rem 1.5rem' }}>
      {/* Upload Photo Modal */}
      <UploadPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          handlePhotoUpdated();
        }}
      />

      {error ? (
        <div className="auth-card" style={{ maxWidth: '640px', textAlign: 'center' }}>
          <AlertCircle size={32} color="#DC2626" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Profile Not Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </p>
          <Link to="/" className="btn-create-post" style={{ display: 'inline-flex' }}>
            Return to Feed
          </Link>
        </div>
      ) : isLoading ? (
        <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="spinner dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Loading folio...</span>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '780px' }}>
          {/* Profile Header Card */}
          <div className="auth-card" style={{ maxWidth: '100%', padding: '2rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div className="profile-head-main" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {/* Avatar with upload overlay */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={avatar}
                    alt={profileData?.name || 'User avatar'}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                    }}
                  />
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(true)}
                      title="Upload new photo"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-orange)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                {/* Name & Handle */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                      {profileData?.name || 'Unnamed Author'}
                    </h1>
                    <span className="pill-dot" style={{ width: 8, height: 8 }} />
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                    @{profileData?.username || 'member'}
                  </div>
                  {profileData?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      <Mail size={13} />
                      <span>{profileData.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="profile-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      className="btn-preview-toggle"
                      style={{ padding: '0.55rem 0.9rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => setIsPhotoModalOpen(true)}
                    >
                      <Camera size={14} />
                      <span>Photo</span>
                    </button>
                    <Link
                      to="/change-password"
                      className="btn-preview-toggle"
                      style={{ padding: '0.55rem 0.9rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Lock size={14} />
                      <span>Security</span>
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-submit-orange"
                    style={{
                      height: 42,
                      padding: '0 1.25rem',
                      fontSize: '0.88rem',
                      backgroundColor: isFollowing ? 'var(--bg-input)' : 'var(--primary-orange)',
                      color: isFollowing ? 'var(--text-main)' : '#FFFFFF',
                      boxShadow: isFollowing ? 'none' : undefined,
                    }}
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={16} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Follow Author</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Row */}
            <div
              className="profile-metrics"
              style={{
                display: 'flex',
                gap: '2.5rem',
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{followersCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Followers
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {profileData?.followingCount ?? (Array.isArray(profileData?.following) ? profileData.following.length : 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Following
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{posts.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Publications
                </div>
              </div>
              {isOwnProfile && (
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    {profileData?.bookmarksCount ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Bookmarks
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Posts Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Published Works & Notes</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                {posts.length} {posts.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {/* Create Post composer — only on own profile */}
            {isOwnProfile && (
              <div className="auth-card" style={{ maxWidth: '100%', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                  <img
                    src={profileData?.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg'}
                    alt={profileData?.name || 'You'}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg'; }}
                  />
                  <form
                    style={{ flex: 1 }}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (isComposerPosting) return;
                      if (!composerBody.trim() && !composerImage) return;
                      setIsComposerPosting(true);
                      setComposerError(null);
                      try {
                        const res = await postsApi.createPost({ body: composerBody, image: composerImage });
                        const created = res?.data?.post;
                        if (created && (created._id || created.id)) {
                          setPosts((prev) => [created, ...prev]);
                        }
                        setComposerBody('');
                        if (composerImagePreview) URL.revokeObjectURL(composerImagePreview);
                        setComposerImage(null);
                        setComposerImagePreview(null);
                        if (composerFileRef.current) composerFileRef.current.value = '';
                        if (onPostCreated) onPostCreated(created);
                      } catch (err) {
                        setComposerError(err.friendlyMessage || err.message || 'Failed to publish.');
                      } finally {
                        setIsComposerPosting(false);
                      }
                    }}
                  >
                    <textarea
                      className="form-input"
                      style={{ height: '72px', padding: '0.75rem', resize: 'none', lineHeight: 1.4 }}
                      placeholder="Share a new note or essay with your followers..."
                      value={composerBody}
                      onChange={(e) => setComposerBody(e.target.value)}
                      disabled={isComposerPosting}
                    />

                    {composerImagePreview && (
                      <div style={{ position: 'relative', marginTop: '0.6rem', display: 'inline-block', width: '100%' }}>
                        <img
                          src={composerImagePreview}
                          alt="Post preview"
                          style={{ maxHeight: '140px', width: '100%', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (composerImagePreview) URL.revokeObjectURL(composerImagePreview);
                            setComposerImage(null);
                            setComposerImagePreview(null);
                            if (composerFileRef.current) composerFileRef.current.value = '';
                          }}
                          style={{
                            position: 'absolute', top: '0.35rem', right: '0.35rem',
                            backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                            borderRadius: '50%', width: 24, height: 24,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {composerError && (
                      <div style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.35rem' }}>{composerError}</div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
                      <div>
                        <input
                          ref={composerFileRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!file.type.startsWith('image/')) { setComposerError('Please select an image file.'); return; }
                            if (file.size > 5 * 1024 * 1024) { setComposerError('Image must be under 5 MB.'); return; }
                            setComposerError(null);
                            setComposerImage(file);
                            setComposerImagePreview(URL.createObjectURL(file));
                          }}
                          disabled={isComposerPosting}
                        />
                        <button
                          type="button"
                          className="btn-preview-toggle"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.32rem 0.65rem', fontSize: '0.76rem' }}
                          onClick={() => composerFileRef.current?.click()}
                          disabled={isComposerPosting}
                        >
                          <ImageIcon size={12} />
                          <span>Photo</span>
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="btn-create-post"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.84rem' }}
                        disabled={isComposerPosting || (!composerBody.trim() && !composerImage)}
                      >
                        {isComposerPosting ? (
                          <div className="spinner" style={{ width: 13, height: 13 }} />
                        ) : (
                          <><Send size={13} /><span>Publish</span></>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}


            {postsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner dark" style={{ margin: '0 auto 0.75rem auto' }} />
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Loading entries...</span>
              </div>
            ) : posts.length === 0 ? (
              <div
                className="auth-card"
                style={{
                  maxWidth: '100%',
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  color: 'var(--text-muted)',
                }}
              >
                <Sparkles size={28} style={{ margin: '0 auto 0.75rem auto', color: 'var(--primary-orange)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  No published works yet
                </h3>
                <p style={{ fontSize: '0.86rem', marginTop: '0.25rem', maxWidth: '380px', margin: '0.25rem auto 0 auto' }}>
                  This author has not yet published any spatial essays or community notes.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {posts.map((post) => (
                  <article
                    key={post._id || post.id}
                    className="auth-card"
                    style={{
                      maxWidth: '100%',
                      padding: '1.5rem',
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <img
                        src={post.user?.photo || avatar}
                        alt={post.user?.name || 'Author'}
                        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{post.user?.name || profileData?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: post.image ? '1rem' : '0.5rem', whiteSpace: 'pre-wrap' }}>
                      {post.body}
                    </p>

                    {post.image && (
                      <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', maxHeight: '420px' }}>
                        <img
                          src={post.image}
                          alt="Post asset"
                          loading="lazy"
                          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Heart size={15} color="var(--primary-orange)" />
                        <span>{post.likesCount || (Array.isArray(post.likes) ? post.likes.length : 0)} Likes</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MessageCircle size={15} />
                        <span>{post.commentsCount || 0} Comments</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer showTag={true} />
    </div>
  );
}
