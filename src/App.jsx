import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicOnlyRoute from './components/common/PublicOnlyRoute';
import CreatePostModal from './components/common/CreatePostModal';


import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import Profile from './pages/user/Profile';
import ChangePassword from './pages/user/ChangePassword';
import FollowSuggestions from './pages/user/FollowSuggestions';
import Bookmarks from './pages/user/Bookmarks';
import Notifications from './pages/user/Notifications';
import Feed from './pages/feed/Feed';
import UploadPhotoModal from './pages/user/UploadPhotoModal';

import './styles/theme.css';
import './styles/layout.css';

export default function App() {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
 
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  const handlePostCreated = useCallback(() => {
    setFeedRefreshKey((k) => k + 1);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header
            onOpenCreatePost={() => setIsCreatePostOpen(true)}
            onOpenUploadPhoto={() => setIsPhotoModalOpen(true)}
          />

          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Authentication Routes */}
              <Route
                path="/signin"
                element={
                  <PublicOnlyRoute>
                    <SignIn />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <SignUp />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected User & Social Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed
                      onOpenUploadPhoto={() => setIsPhotoModalOpen(true)}
                      feedRefreshKey={feedRefreshKey}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile onPostCreated={handlePostCreated} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <Profile onPostCreated={handlePostCreated} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId"
                element={
                  <ProtectedRoute>
                    <Profile onPostCreated={handlePostCreated} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discover"
                element={
                  <ProtectedRoute>
                    <FollowSuggestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suggestions"
                element={
                  <ProtectedRoute>
                    <FollowSuggestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute>
                    <Bookmarks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <UploadPhotoModal
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
          />

          <CreatePostModal
            isOpen={isCreatePostOpen}
            onClose={() => setIsCreatePostOpen(false)}
            onPostCreated={handlePostCreated}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
