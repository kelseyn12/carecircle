# Care Circle - File System Map

## Project Structure Overview
```
careCircle/
├── App.tsx                          # Main app entry point
├── global.css                       # NativeWind global styles
├── tailwind.config.js              # Tailwind CSS configuration
├── babel.config.js                  # Babel configuration for NativeWind
├── metro.config.js                  # Metro bundler configuration
├── package.json                     # Dependencies and scripts
├── TODO.md                          # Development roadmap
├── guidelines/                      # Project documentation
│   ├── conventions.md               # Coding conventions
│   ├── file-system-map.md          # This file
│   ├── glossary.md                 # Methods and functions glossary
│   ├── refactoring-log.md          # Refactoring history
│   └── todo-list.md                # Current tasks
└── src/                            # Source code
    ├── lib/                        # Firebase and utilities
    │   └── firebase.ts             # Firebase configuration
    ├── navigation/                 # Navigation setup
    │   └── AppNavigator.tsx        # Main navigation component
    ├── screens/                    # Screen components
    │   ├── SignInScreen.tsx        # Authentication screen
    │   ├── HomeScreen.tsx          # Main dashboard
    │   ├── CreateCircleScreen.tsx  # Circle creation
    │   ├── CircleFeedScreen.tsx    # Circle updates feed
    │   ├── NewUpdateScreen.tsx     # Create new update
    │   ├── InviteScreen.tsx        # Invite people to circle
    │   └── JoinScreen.tsx          # Accept circle invitation
    ├── components/                 # Reusable components
    │   ├── CircleCard.tsx          # Circle display card
    │   └── UpdateCard.tsx          # Update display card
    ├── validation/                 # Form validation
    │   └── schemas.ts              # Zod validation schemas
    └── types/                      # TypeScript definitions
        └── index.ts                # Type definitions
```

## File Descriptions

### Root Level Files
- **App.tsx**: Main application entry point with navigation setup
- **global.css**: Global Tailwind CSS styles for NativeWind
- **tailwind.config.js**: Tailwind CSS configuration with custom theme
- **babel.config.js**: Babel configuration for NativeWind and Reanimated
- **metro.config.js**: Metro bundler configuration for NativeWind
- **TODO.md**: Comprehensive development roadmap and task list

### Guidelines Directory
- **conventions.md**: Coding standards, naming conventions, and best practices
- **file-system-map.md**: This file - project structure documentation
- **glossary.md**: Methods, functions, and their usage documentation
- **refactoring-log.md**: History of code refactoring and improvements
- **todo-list.md**: Current development tasks and progress tracking

### Source Code Structure

#### lib/ - Firebase and Utilities
- **firebase.ts**: Firebase configuration, authentication, Firestore, Storage setup

#### navigation/ - Navigation
- **AppNavigator.tsx**: Main navigation component with stack and tab navigation

#### screens/ - Screen Components
- **SignInScreen.tsx**: User authentication (email/password, social login)
- **HomeScreen.tsx**: Dashboard showing user's circles
- **CreateCircleScreen.tsx**: Form to create new care circles
- **CircleFeedScreen.tsx**: Display updates for a specific circle
- **NewUpdateScreen.tsx**: Form to create new updates with photo support
- **InviteScreen.tsx**: Invite people to join a circle
- **JoinScreen.tsx**: Accept circle invitations with consent flow

#### components/ - Reusable Components
- **CircleCard.tsx**: Display circle information in list format
- **UpdateCard.tsx**: Display individual updates with reactions

#### validation/ - Form Validation
- **schemas.ts**: Zod schemas for form validation and data validation

#### types/ - TypeScript Definitions
- **index.ts**: TypeScript interfaces and types for the application

## Navigation Flow
```
SignInScreen → HomeScreen → CreateCircleScreen
                ↓
            CircleFeedScreen → NewUpdateScreen
                ↓
            InviteScreen → JoinScreen
```

## Data Flow
1. **Authentication**: SignInScreen → Firebase Auth
2. **Circle Management**: HomeScreen ↔ Firestore (circles collection)
3. **Updates**: CircleFeedScreen ↔ Firestore (updates collection)
4. **Invitations**: InviteScreen → Cloud Functions → Dynamic Links
5. **Joining**: JoinScreen → Cloud Functions → Firestore

## Dependencies
- **React Navigation**: @react-navigation/native, @react-navigation/stack
- **Styling**: nativewind, tailwindcss
- **Firebase**: @react-native-firebase/* (to be added)
- **Validation**: zod
- **Expo**: expo-notifications, expo-image-picker, expo-linking
- **Animations**: react-native-reanimated

## Environment Configuration
- Firebase config (API keys, project ID)
- Dynamic Links domain
- Environment-specific settings (dev/test/prod)

## Security Considerations
- Firestore security rules
- Row-level security (RLS)
- EXIF data stripping
- Rate limiting
- Input validation with Zod
- Authentication guards

## Future Additions
- Cloud Functions directory
- Tests directory
- Assets directory
- Documentation directory
- CI/CD configuration files
