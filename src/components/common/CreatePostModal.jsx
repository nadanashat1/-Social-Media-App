import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, AlertCircle } from 'lucide-react';
import postsApi from '../../api/posts.api';
import { useAuth } from '../../context/AuthContext';


export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setBody('');
      setImage(null);
      setImagePreview(null);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' && !isPosting) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isPosting, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setError(null);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPosting) return;
    if (!body.trim() && !image) return;

    setIsPosting(true);
    setError(null);
    try {
      const res = await postsApi.createPost({ body, image });
      const createdPost = res?.data?.post || null;
      if (onPostCreated) onPostCreated(createdPost);
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Failed to publish. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleBackdropClick = () => {
    if (!isPosting) onClose();
  };

  const canSubmit = !isPosting && (body.trim().length > 0 || image !== null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="auth-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          marginBottom: 0,
          padding: '1.75rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Create Post</span>
          <button
            type="button"
            onClick={() => { if (!isPosting) onClose(); }}
            style={{ color: 'var(--text-dim)' }}
            aria-label="Close create post"
          >
            <X size={20} />
          </button>
        </div>


        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <img
            src={user?.photo || '/images/default-avatar.jpg'}
            alt={user?.name || 'You'}
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onError={(e) => { e.currentTarget.src = '/images/default-avatar.jpg'; }}
          />
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', paddingTop: '0.6rem' }}>
            {user?.name || 'Route Author'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <textarea
            className="form-input"
            style={{
              height: '100px',
              padding: '0.85rem',
              resize: 'none',
              lineHeight: 1.5,
            }}
            placeholder="Compose an essay excerpt, spatial observation, or inquiry…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isPosting}
          />

          {imagePreview && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={imagePreview}
                alt="Post attachment preview"
                style={{
                  maxHeight: '200px',
                  width: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  display: 'block',
                }}
              />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {error && (
            <div style={{ fontSize: '0.82rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}


          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
                disabled={isPosting}
              />
              <button
                type="button"
                className="btn-preview-toggle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isPosting}
              >
                <ImageIcon size={14} />
                <span>Photo</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-preview-toggle"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.86rem' }}
                onClick={() => { if (!isPosting) onClose(); }}
                disabled={isPosting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-create-post"
                style={{ padding: '0.45rem 1.2rem', fontSize: '0.86rem' }}
                disabled={!canSubmit}
              >
                {isPosting ? (
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                ) : (
                  <>
                    <Send size={14} />
                    <span>Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
