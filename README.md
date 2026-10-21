# Route - Social Media App

A social media web app built with React and Vite: an infinite-scroll feed, posts with images, likes, comments, bookmarks, follows, notifications, and user profiles, all running against a live REST API.

A project for the Full Stack Web Development diploma at Route Academy.

## Live Demo

https://nadanashat1.github.io/-Social-Media-App/

## Features

### Authentication
- Sign up with name, username, email, date of birth, and gender, with client-side validation
- Sign in with either email or username
- "Remember me" sessions (localStorage) or session-only login (sessionStorage)
- Change password - the API issues a new token, which the app stores so you stay signed in
- Session restore on reload; when the API rejects the token (401), the session is fully ended (storage and in-app state cleared) and you are routed back to sign in
- Protected routes and public-only routes: signed-out users can't reach the app, signed-in users can't bounce back to the auth pages

### Feed and posts
- Infinite scroll feed built on IntersectionObserver (15 posts per page)
- Create posts with text, an image, or both, with a preview before posting
- Shared (reposted) posts rendered with the original author
- Like and unlike posts, and browse everyone who liked a post in a modal
- Comment on posts, with optional image attachments and paginated loading
- Bookmark posts and revisit them on a dedicated Bookmarks page
- Deep links: `/?post=<id>&comment=<id>` opens a post and highlights a specific comment (used by notifications)

### Profiles and social graph
- Your own profile and any other user's profile, with their posts
- Follow and unfollow, with follower counts from the API
- Follow suggestions in the feed sidebar and on a paginated Discover page
- Profile photo upload with preview

### Notifications
- Follow, like, comment, and reply notifications, each with its own icon
- Unread-count badge in the header; mark one or all as read
- Notifications link to their source post or profile

### Interface
- Dark and light themes, persisted between visits
- Editorial visual design: serif headlines (Newsreader) paired with Plus Jakarta Sans and Outfit
- Hand-written CSS with custom properties, no UI component library

## Tech stack

- React 19 + Vite 8 (JavaScript / JSX)
- React Router 7
- Axios with request/response interceptors (token injection, friendly error messages)
- lucide-react icons
- Oxlint
- Backend: Route Academy's hosted REST API (`https://route-posts.routemisr.com`)

## Project structure

- `src/api/` - API layer: one Axios client with interceptors, plus per-resource modules (auth, posts, users, notifications)
- `src/context/AuthContext.jsx` - global auth and theme state, session init, token and profile management
- `src/components/common/` - shared components (header, footer, route guards, modals)
- `src/pages/` - route-level pages (auth, feed, profile, bookmarks, notifications, discover)
- `src/styles/` - theme tokens and layout CSS

## Getting started

Requires Node.js 20.19+ or 22.12+ (Vite 8 requirement).

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173). Create an account from the sign-up page to start using the app.

No environment variables are needed: the app talks to the course's shared API, and the base URL lives in `src/api/client.js`.

Other scripts:

```bash
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # Oxlint
```

## Notes

- The backend is provided by the course, so accounts and data are shared with other students' apps built on the same API.
- No automated tests yet.
