import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UploadPhotoModal({ isOpen, onClose }) {
  const { uploadPhoto, user } = useAuth();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a photo to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await uploadPhoto(selectedFile);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        onClose();
      }, 1200);
    } catch (err) {
      const msg = err.friendlyMessage || err.message || 'Failed to upload photo. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1.5rem',
      }}
      onClick={handleClose}
    >
      <div
        className="auth-card"
        style={{
          maxWidth: '460px',
          marginBottom: 0,
          position: 'relative',
          padding: '2rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            color: 'var(--text-dim)',
          }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'var(--primary-orange-subtle)',
              color: 'var(--primary-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
            }}
          >
            <Camera size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Update Profile Photo</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Upload a high-fidelity image for your Route folio.
          </p>
        </div>

        {error && (
          <div className="alert-banner error" style={{ padding: '0.75rem 1rem' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.84rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner success" style={{ padding: '0.75rem 1rem' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '0.84rem' }}>Profile photo updated successfully!</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-input)',
              border: '3px solid var(--border-color)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={previewUrl || user?.photo || '/images/default-avatar.jpg'}
              alt="Avatar preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = '/images/default-avatar.jpg';
              }}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="btn-preview-toggle"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload size={14} style={{ marginRight: 6, display: 'inline' }} />
            Choose New Image
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-preview-toggle"
            style={{ flex: 1, height: 46, fontSize: '0.9rem' }}
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-submit-orange"
            style={{ flex: 2, height: 46 }}
            onClick={handleUpload}
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Uploading to R2...</span>
              </>
            ) : (
              <span>Save Photo</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
