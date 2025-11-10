# Firebase Minification Fix for TestFlight

## Issue
"Cannot call a class as a function" error in TestFlight builds but not in local dev builds.

## Root Cause
This is a known issue with Firebase v9+ modular SDK when code is minified in production builds. The minification process can break class constructors, causing `httpsCallable` to fail.

## Solution Applied

### 1. Fixed Import Statement
Changed from:
```typescript
import { httpsCallable } from 'firebase/functions';
```

To:
```typescript
import { httpsCallable, type HttpsCallable } from 'firebase/functions';
```

### 2. Improved Callable Creation
- Store the result of `httpsCallable` in a typed variable
- Validate the callable before use
- Ensure synchronous creation before async operations

### 3. Hermes Configuration (Optional)
If the issue persists, you can temporarily disable Hermes in `app.config.js`:
```js
'expo-build-properties': {
  ios: {
    hermes: false,  // Disable Hermes
  },
  android: {
    hermes: false,  // Disable Hermes
  },
}
```

**Note**: Hermes is currently commented out. Uncomment if needed for testing.

## Testing Steps

1. **Test with current fix first** (Hermes enabled):
   ```bash
   eas build --platform ios --profile production
   ```

2. **If still failing, disable Hermes**:
   - Uncomment `hermes: false` in `app.config.js`
   - Rebuild and test

3. **If disabling Hermes fixes it**, you can:
   - Keep Hermes disabled (slightly larger bundle size)
   - Or investigate Firebase version compatibility
   - Or use a different approach to callable functions

## Alternative Solutions (if needed)

### Option 1: Use Firebase REST API directly
Instead of `httpsCallable`, make direct HTTP requests to Firebase Functions.

### Option 2: Update Firebase version
Check if there's a newer Firebase version that fixes this issue:
```bash
npm update firebase
```

### Option 3: Use Firebase compat mode (not recommended)
Only as a last resort, as it increases bundle size significantly.

## Current Implementation

The fix ensures:
1. ✅ Proper type imports for `HttpsCallable`
2. ✅ Synchronous callable creation
3. ✅ Validation before use
4. ✅ Better error messages

## Verification

After deploying, check:
- [ ] Invite link creation works in TestFlight
- [ ] No console errors related to Firebase Functions
- [ ] Error boundary doesn't trigger

## Related Issues

- Firebase v9+ modular SDK minification issues
- Hermes engine compatibility with Firebase
- Expo production build optimizations

