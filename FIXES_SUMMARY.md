# Bug Fixes Summary

## Issue 1: Push Notifications Not Working on Mobile ✅

### Root Cause
The app was using Web Push API (VAPID) which only works in web browsers. Capacitor mobile apps require native push notifications via FCM (Firebase Cloud Messaging) for Android and APNs (Apple Push Notification service) for iOS.

### Fixes Applied

1. **Updated `src/utils/pushService.ts`**
   - Added `isCapacitorApp()` detection to identify if running on native mobile
   - Implemented `registerCapacitorPushNotications()` for native push registration
   - Falls back to Web Push API for web browsers
   - Properly handles permission requests for native platforms

2. **Added `@capacitor/push-notifications` dependency** 
   - Updated `package.json` to include `@capacitor/push-notifications@^7.6.0`
   - This library enables native push notification support on Android and iOS

### How It Works
- On mobile: Uses Capacitor's native push notification service
- On web: Uses Web Push API (if VAPID key is configured)
- Gracefully handles missing dependencies

### Next Steps
1. Install dependencies: `pnpm install`
2. Configure FCM/APNs credentials in Firebase Console
3. Set up backend push service to send notifications
4. Rebuild and deploy with `pnpm build && cap sync android`

---

## Issue 2: Users Must Uninstall App to See New Courses ✅

### Root Cause
The service worker was using an aggressive caching strategy that cached API responses, preventing users from seeing newly assigned courses without reinstalling the app.

### Fixes Applied

1. **Updated Service Worker Caching Strategy** (`public/service-worker.js`)
   - Changed API requests from `cache-first` to `network-first`
   - API endpoints (paths containing `/api/`) are never cached
   - Falls back to cache only if network is unavailable
   - Static assets continue using `cache-first` for performance

2. **Added App Initialization** (`src/hooks/useInitializeCapacitor.ts`)
   - New hook to initialize Capacitor and register app state listeners
   - Listens for app foreground events to trigger data refresh

3. **Added Data Refresh on Foreground** (`src/hooks/useRefreshOnForeground.ts`)
   - New hook to invalidate course-related queries when app comes to foreground
   - Ensures users see newly assigned courses immediately
   - Also handles page visibility changes for better web experience

4. **Updated App Component** (`src/app/App.tsx`)
   - Integrated new hooks into main app initialization
   - Ensures Capacitor and refresh handlers are active

5. **Added Capacitor App Dependency**
   - Updated `package.json` to include `@capacitor/app@^7.6.0`
   - Enables app lifecycle monitoring

### How It Works
**Scenario: New course assigned to user**
1. Backend assigns new course while app is backgrounded
2. User brings app to foreground
3. App state change listener triggers (Capacitor)
4. `useRefreshOnForeground` hook is called
5. Course cache is invalidated
6. App fetches fresh data from network (not cached by service worker)
7. New course appears immediately ✓

### Installation
```bash
pnpm install
```

---

## Files Changed

1. ✅ `public/service-worker.js` - Fixed caching strategy
2. ✅ `src/utils/pushService.ts` - Added Capacitor push support
3. ✅ `src/app/App.tsx` - Integrated new hooks
4. ✅ `src/hooks/useInitializeCapacitor.ts` - New file
5. ✅ `src/hooks/useRefreshOnForeground.ts` - New file
6. ✅ `package.json` - Added Capacitor dependencies

---

## Testing Checklist

- [ ] Run `pnpm install` to install new dependencies
- [ ] Test push notifications on Android device
- [ ] Test push notifications on iOS device
- [ ] Assign a new course to a test user
- [ ] Bring app to foreground and verify new course appears without reinstalling
- [ ] Test offline mode still works (courses visible when offline)
- [ ] Test on web browser (should use Web Push if configured)

