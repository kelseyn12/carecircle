# Care Circle - Development Roadmap

## 🚀 Project Overview
A React Native (Expo, TypeScript) app that lets Care Leads create Circles, invite family/friends, and share medical/personal updates securely. Family/friends can view updates, react with emojis, and get notifications.

## 📋 Development Tasks

### Phase 1: Firebase Setup & Environment Configuration
- [ ] **Firebase Project Setup**
  - [ ] Create Firebase project in console
  - [ ] Enable Authentication, Firestore, Storage, Cloud Functions, FCM
  - [ ] Generate Firebase config and add to environment variables
  - [ ] Set up Firebase CLI and initialize project

- [ ] **Environment Configuration**
  - [ ] Create `.env` file with Firebase config
  - [ ] Add environment variables to `app.config.js`
  - [ ] Set up different configs for dev/test/prod environments
  - [ ] Configure Firebase security rules

### Phase 2: Authentication Implementation
- [ ] **Firebase Auth Integration**
  - [ ] Implement email/password authentication
  - [ ] Add Google Sign-In integration
  - [ ] Add Apple Sign-In integration
  - [ ] Implement sign-out functionality
  - [ ] Add authentication state management

- [ ] **User Management**
  - [ ] Create user profile on first sign-in
  - [ ] Update user profile with display name and photo
  - [ ] Implement user profile editing
  - [ ] Add push token registration for notifications

### Phase 3: Core Circle Functionality
- [ ] **Create & List Circles**
  - [ ] Implement Firestore document creation for circles
  - [ ] Add form validation with Zod schemas
  - [ ] Create circle listing with real-time updates
  - [ ] Add circle deletion functionality
  - [ ] Implement circle member management

- [ ] **Circle Data Model**
  - [ ] Set up Firestore collections structure
  - [ ] Implement Firestore security rules for circles
  - [ ] Add circle member permissions
  - [ ] Create circle update queries

### Phase 4: Invite Flow with Dynamic Links
- [ ] **Cloud Functions for Invites**
  - [ ] Create `createInvite` Cloud Function
  - [ ] Create `acceptInvite` Cloud Function
  - [ ] Implement invite validation and expiration
  - [ ] Add email sending functionality

- [ ] **Dynamic Links Integration**
  - [ ] Set up Firebase Dynamic Links
  - [ ] Generate invite links with proper parameters
  - [ ] Handle deep link navigation to join screen
  - [ ] Implement invite link validation

- [ ] **Invite Management**
  - [ ] Create invite documents in Firestore
  - [ ] Add invite expiration handling
  - [ ] Implement invite status tracking
  - [ ] Add invite cleanup for expired invites

### Phase 5: Join Flow & Consent
- [ ] **Join Screen Implementation**
  - [ ] Create consent flow with privacy information
  - [ ] Add invite validation and circle information display
  - [ ] Implement join circle functionality
  - [ ] Add user to circle members array
  - [ ] Navigate to circle feed after joining

- [ ] **Privacy & Security**
  - [ ] Add clear consent messaging
  - [ ] Implement privacy policy acceptance
  - [ ] Add data sharing consent
  - [ ] Create user agreement flow

### Phase 6: Updates & Media Sharing
- [ ] **Post Updates Functionality**
  - [ ] Implement text update creation
  - [ ] Add image picker integration
  - [ ] Implement photo upload to Firebase Storage
  - [ ] Strip EXIF data from photos before upload
  - [ ] Add update validation (max 2000 characters)

- [ ] **Media Handling**
  - [ ] Integrate Expo ImagePicker
  - [ ] Add Expo ImageManipulator for EXIF stripping
  - [ ] Implement photo compression and optimization
  - [ ] Add photo preview and editing
  - [ ] Handle upload retry logic

### Phase 7: Push Notifications
- [ ] **Expo Notifications Setup**
  - [ ] Configure Expo push notification service
  - [ ] Register for push tokens
  - [ ] Handle notification permissions
  - [ ] Implement notification scheduling

- [ ] **Cloud Function Notifications**
  - [ ] Create `onUpdateCreated` Cloud Function
  - [ ] Send push notifications to all circle members
  - [ ] Exclude update author from notifications
  - [ ] Add notification content customization

- [ ] **Notification Management**
  - [ ] Implement notification handling
  - [ ] Add notification settings per circle
  - [ ] Create mute notifications functionality
  - [ ] Add notification history

### Phase 8: Emoji Reactions
- [ ] **Reaction System**
  - [ ] Implement emoji reaction functionality
  - [ ] Add reaction storage in Firestore
  - [ ] Create reaction UI components
  - [ ] Add reaction count display
  - [ ] Implement reaction removal

- [ ] **Reaction Features**
  - [ ] Support ❤️ 🙏 👍 emoji reactions
  - [ ] Add reaction animations
  - [ ] Implement reaction notifications
  - [ ] Add reaction analytics

### Phase 9: Firestore Security Rules
- [ ] **Security Implementation**
  - [ ] Create comprehensive Firestore security rules
  - [ ] Implement row-level security (RLS)
  - [ ] Add user authentication checks
  - [ ] Create circle membership validation
  - [ ] Add update access controls

- [ ] **Data Protection**
  - [ ] Implement data encryption
  - [ ] Add audit logging
  - [ ] Create data retention policies
  - [ ] Add GDPR compliance features

### Phase 10: Cloud Functions (Advanced)
- [ ] **Invite Management Functions**
  - [ ] Handle expired invites cleanup
  - [ ] Implement invite resending
  - [ ] Add invite analytics
  - [ ] Create invite validation

- [ ] **Notification Functions**
  - [ ] Implement notification batching
  - [ ] Add notification preferences
  - [ ] Create notification templates
  - [ ] Add notification delivery tracking

### Phase 11: Offline Support & Error Handling
- [ ] **Offline Functionality**
  - [ ] Implement offline update queuing
  - [ ] Add offline data synchronization
  - [ ] Create offline indicator
  - [ ] Handle network reconnection

- [ ] **Error Handling**
  - [ ] Add comprehensive error handling
  - [ ] Implement retry mechanisms
  - [ ] Create error reporting
  - [ ] Add user-friendly error messages

### Phase 12: UX Polish & Features
- [ ] **Empty States**
  - [ ] Create engaging empty state designs
  - [ ] Add helpful onboarding messages
  - [ ] Implement guided tours
  - [ ] Add feature discovery

- [ ] **Error Handling**
  - [ ] Create user-friendly error messages
  - [ ] Add error recovery options
  - [ ] Implement error reporting
  - [ ] Add error analytics

- [ ] **Advanced Features**
  - [ ] Add mute notifications per circle
  - [ ] Implement circle archiving
  - [ ] Add update editing/deletion
  - [ ] Create circle analytics

### Phase 13: Testing & Quality Assurance
- [ ] **Unit Testing**
  - [ ] Write unit tests for components
  - [ ] Add integration tests for Firebase functions
  - [ ] Create test utilities and mocks
  - [ ] Add test coverage reporting

- [ ] **End-to-End Testing**
  - [ ] Create E2E test scenarios
  - [ ] Test complete user flows
  - [ ] Add performance testing
  - [ ] Create accessibility testing

### Phase 14: Build & Deployment
- [ ] **Device Testing**
  - [ ] Test on iOS devices
  - [ ] Test on Android devices
  - [ ] Add device-specific optimizations
  - [ ] Test push notifications on devices

- [ ] **Build Configuration**
  - [ ] Configure production builds
  - [ ] Set up app store preparation
  - [ ] Add build automation
  - [ ] Create deployment scripts

## 🔧 Technical Implementation Notes

### Security Requirements
- Only circle members can read/write updates or media
- Invites handled only by Cloud Functions
- Strip photo EXIF before upload
- Max 2,000 characters per update
- Throttle repeated posts
- Rate limit all API endpoints
- Use row-level security (RLS)
- Add captcha on auth routes
- Enable attack challenge on WAF

### Data Model (Firestore)
```
users/{userId}:
  displayName, photoURL, expoPushToken, createdAt

circles/{circleId}:
  title, ownerId, members[], createdAt

updates/{updateId}:
  circleId, authorId, text, photoURL?, createdAt, reactions?

invites/{inviteId}:
  circleId, createdBy, expiresAt, dynamicLink?
```

### Cloud Functions
- `createInvite` → creates dynamic link and invite doc
- `acceptInvite` → validates invite, adds user to members[]
- `onUpdateCreated` → sends push notifications to all members except author

### UX Tone
- Soft, caring visuals (muted blues/greys, rounded corners)
- Friendly copy ("Share an update", not "Submit post")
- Clear consent message before joining a circle

## 📱 Next Steps
1. Set up Firebase project and environment variables
2. Implement authentication flow
3. Create basic circle functionality
4. Add invite system with dynamic links
5. Implement updates and media sharing
6. Add push notifications
7. Polish UX and add advanced features
8. Test on devices and deploy

## 🎯 Success Criteria
- [ ] Users can create circles and invite family/friends
- [ ] Secure sharing of medical/personal updates
- [ ] Real-time notifications for new updates
- [ ] Emoji reactions and engagement
- [ ] Offline support and error handling
- [ ] Production-ready security and performance
