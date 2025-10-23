# Care Circle - Glossary of Methods

## Firebase Methods

### Authentication Methods
**Location**: `src/lib/firebase.ts`
- `signInWithEmailAndPassword(email, password)` - User sign-in
- `createUserWithEmailAndPassword(email, password)` - User registration
- `signOut()` - User sign-out
- `onAuthStateChanged(callback)` - Auth state listener
- `updateProfile(user, profile)` - Update user profile

### Firestore Methods
**Location**: `src/lib/firebase.ts`
- `collection(db, 'users')` - Users collection reference
- `collection(db, 'circles')` - Circles collection reference
- `collection(db, 'updates')` - Updates collection reference
- `collection(db, 'invites')` - Invites collection reference
- `doc(collection, id)` - Document reference
- `addDoc(collection, data)` - Create document
- `updateDoc(doc, data)` - Update document
- `deleteDoc(doc)` - Delete document
- `getDoc(doc)` - Get single document
- `getDocs(query)` - Get multiple documents
- `onSnapshot(doc, callback)` - Real-time listener

## Screen Methods

### SignInScreen
**Location**: `src/screens/SignInScreen.tsx`
- `handleSignIn()` - Process user sign-in
- `handleSignUp()` - Process user registration
- `validateForm()` - Validate input fields

### HomeScreen
**Location**: `src/screens/HomeScreen.tsx`
- `fetchCircles()` - Load user's circles from Firestore
- `handleRefresh()` - Pull-to-refresh functionality
- `handleCreateCircle()` - Navigate to create circle
- `handleCirclePress(circleId)` - Navigate to circle feed

### CreateCircleScreen
**Location**: `src/screens/CreateCircleScreen.tsx`
- `handleCreateCircle()` - Create new circle in Firestore
- `validateCircleData()` - Validate circle form data
- `navigateToInvite()` - Navigate to invite screen

### CircleFeedScreen
**Location**: `src/screens/CircleFeedScreen.tsx`
- `fetchUpdates()` - Load circle updates from Firestore
- `handleNewUpdate()` - Navigate to create update
- `handleInvite()` - Navigate to invite screen
- `handleReaction(updateId, emoji)` - Add emoji reaction

### NewUpdateScreen
**Location**: `src/screens/NewUpdateScreen.tsx`
- `handlePickImage()` - Open image picker
- `handleShareUpdate()` - Create update in Firestore
- `stripExifData(imageUri)` - Remove EXIF data from photos
- `uploadPhoto(imageUri)` - Upload photo to Firebase Storage

### InviteScreen
**Location**: `src/screens/InviteScreen.tsx`
- `handleCreateInvite()` - Create invite via Cloud Function
- `handleShareLink()` - Share invite link
- `validateEmail(email)` - Validate email format

### JoinScreen
**Location**: `src/screens/JoinScreen.tsx`
- `validateInvite()` - Validate invite token
- `handleAcceptInvite()` - Accept invitation
- `handleDecline()` - Decline invitation

## Component Methods

### CircleCard
**Location**: `src/components/CircleCard.tsx`
- `formatMemberCount(count)` - Format member count display
- `formatLastUpdate(date)` - Format last update time
- `handlePress()` - Navigate to circle feed

### UpdateCard
**Location**: `src/components/UpdateCard.tsx`
- `handleReaction(emoji)` - Toggle emoji reaction
- `getReactionCount(emoji)` - Get reaction count
- `formatTimeAgo(date)` - Format relative time
- `handleImagePress()` - Open full-size image

## Validation Methods

### Zod Schemas
**Location**: `src/validation/schemas.ts`
- `userSchema` - Validate user data
- `createCircleSchema` - Validate circle creation
- `createUpdateSchema` - Validate update creation
- `inviteSchema` - Validate invite data
- `reactionSchema` - Validate reaction data

## Navigation Methods

### AppNavigator
**Location**: `src/navigation/AppNavigator.tsx`
- `checkAuthState()` - Check user authentication
- `navigateToScreen(screen, params)` - Navigate to screen
- `handleDeepLink(url)` - Handle deep link navigation

## Cloud Functions (Future)

### Invite Functions
**Location**: `functions/src/invites.ts`
- `createInvite(data)` - Create invite and dynamic link
- `acceptInvite(inviteId, userId)` - Accept invitation
- `validateInvite(inviteId)` - Validate invite token
- `expireInvite(inviteId)` - Mark invite as expired

### Notification Functions
**Location**: `functions/src/notifications.ts`
- `onUpdateCreated(update)` - Send push notifications
- `scheduleNotification(userId, data)` - Schedule notification
- `sendBulkNotifications(userIds, data)` - Send to multiple users

## Utility Methods

### Image Processing
**Location**: `src/utils/imageUtils.ts` (to be created)
- `stripExifData(imageUri)` - Remove EXIF data
- `compressImage(imageUri)` - Compress image
- `resizeImage(imageUri, maxWidth, maxHeight)` - Resize image
- `validateImageSize(imageUri)` - Check image size limits

### Notification Utils
**Location**: `src/utils/notificationUtils.ts` (to be created)
- `registerForPushNotifications()` - Register for push tokens
- `scheduleLocalNotification(title, body)` - Schedule local notification
- `handleNotificationPress(notification)` - Handle notification tap

### Validation Utils
**Location**: `src/utils/validationUtils.ts` (to be created)
- `validateEmail(email)` - Email validation
- `validatePhone(phone)` - Phone validation
- `sanitizeInput(input)` - Sanitize user input
- `validateImageFile(file)` - Validate image file

## Error Handling Methods

### Global Error Handler
**Location**: `src/utils/errorHandler.ts` (to be created)
- `handleFirebaseError(error)` - Handle Firebase errors
- `handleNetworkError(error)` - Handle network errors
- `logError(error, context)` - Log errors for debugging
- `showUserFriendlyError(error)` - Show user-friendly messages

## Security Methods

### Security Utils
**Location**: `src/utils/securityUtils.ts` (to be created)
- `validateUserPermissions(userId, resource)` - Check user permissions
- `sanitizeUserInput(input)` - Sanitize user input
- `validateCircleAccess(userId, circleId)` - Check circle access
- `rateLimitCheck(userId, action)` - Check rate limits

## Data Processing Methods

### Firestore Helpers
**Location**: `src/utils/firestoreUtils.ts` (to be created)
- `batchWrite(operations)` - Batch Firestore operations
- `paginateQuery(query, limit, startAfter)` - Paginate queries
- `optimizeQuery(query)` - Optimize Firestore queries
- `handleOfflineSync()` - Handle offline data sync

## Usage Patterns

### Authentication Flow
1. `SignInScreen.handleSignIn()` → Firebase Auth
2. `onAuthStateChanged()` → Update app state
3. Navigate to `HomeScreen` on success

### Circle Creation Flow
1. `CreateCircleScreen.handleCreateCircle()` → Firestore
2. Navigate to `InviteScreen`
3. `InviteScreen.handleCreateInvite()` → Cloud Function

### Update Sharing Flow
1. `NewUpdateScreen.handlePickImage()` → Image picker
2. `stripExifData()` → Remove EXIF
3. `handleShareUpdate()` → Firestore + Storage
4. Cloud Function sends notifications

### Invitation Flow
1. `InviteScreen.handleCreateInvite()` → Cloud Function
2. Generate dynamic link
3. `JoinScreen.validateInvite()` → Validate token
4. `handleAcceptInvite()` → Add to circle

## Method Dependencies

### Firebase Dependencies
- All Firestore methods depend on Firebase config
- Auth methods require Firebase Auth setup
- Storage methods need Firebase Storage config

### Navigation Dependencies
- Screen methods depend on navigation props
- Deep linking requires proper URL handling
- Authentication state affects navigation flow

### Validation Dependencies
- All form methods use Zod schemas
- Input validation depends on schema definitions
- Error handling uses validation results

## Future Methods (To Be Implemented)

### Advanced Features
- `muteNotifications(circleId)` - Mute circle notifications
- `archiveCircle(circleId)` - Archive circle
- `editUpdate(updateId, data)` - Edit existing update
- `deleteUpdate(updateId)` - Delete update
- `exportCircleData(circleId)` - Export circle data
- `importCircleData(data)` - Import circle data
