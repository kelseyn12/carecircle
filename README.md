# Care Circle

A React Native app that lets Care Leads create Circles, invite family/friends, and share medical/personal updates securely.

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.17.0 or higher)
- Expo CLI
- Firebase project
- iOS Simulator or Android Emulator (for testing)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd careCircle
   npm install
   ```

2. **Set up Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, Storage, and Cloud Functions
   - Get your Firebase config from Project Settings > General > Your apps
   - Create a `.env` file in the root directory with your Firebase config:

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 📱 Features

### ✅ Implemented
- **Authentication**: Email/password sign-in and sign-up
- **User Management**: User profiles with display names
- **Navigation**: Stack navigation with authentication guards
- **UI Components**: Modern, accessible interface with NativeWind
- **Form Validation**: Zod schemas for input validation
- **Error Handling**: User-friendly error messages

### 🚧 In Progress
- **Firebase Integration**: Firestore queries and real-time updates
- **Circle Management**: Create, list, and manage care circles
- **Update Sharing**: Text and photo updates with reactions
- **Invite System**: Dynamic links for circle invitations
- **Push Notifications**: Real-time notifications for updates

### 📋 Planned
- **Social Login**: Google and Apple Sign-In
- **Offline Support**: Offline data synchronization
- **Advanced Features**: Circle archiving, notification settings
- **Testing**: Unit and integration tests
- **Deployment**: App store preparation

## 🏗️ Project Structure

```
src/
├── lib/                    # Firebase and utilities
│   ├── firebase.ts         # Firebase configuration
│   └── authContext.tsx     # Authentication context
├── navigation/             # Navigation setup
│   └── AppNavigator.tsx    # Main navigation
├── screens/               # Screen components
│   ├── SignInScreen.tsx   # Authentication
│   ├── HomeScreen.tsx     # Dashboard
│   ├── CreateCircleScreen.tsx
│   ├── CircleFeedScreen.tsx
│   ├── NewUpdateScreen.tsx
│   ├── InviteScreen.tsx
│   └── JoinScreen.tsx
├── components/            # Reusable components
│   ├── CircleCard.tsx
│   └── UpdateCard.tsx
├── validation/            # Form validation
│   └── schemas.ts         # Zod schemas
└── types/                 # TypeScript definitions
    └── index.ts
```

## 🔧 Development

### Available Scripts
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run build` - Build for production

### Code Style
- TypeScript for type safety
- NativeWind for styling
- Zod for validation
- React Navigation for navigation
- Firebase for backend services

### Environment Variables
Create a `.env` file with your Firebase configuration:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🔒 Security

### Implemented
- Firebase Authentication
- Input validation with Zod
- Secure password requirements
- User session management

### Planned
- Firestore security rules
- Row-level security (RLS)
- EXIF data stripping
- Rate limiting
- Data encryption

## 📚 Documentation

- [TODO.md](./TODO.md) - Development roadmap
- [guidelines/](./guidelines/) - Project documentation
  - [conventions.md](./guidelines/conventions.md) - Coding standards
  - [file-system-map.md](./guidelines/file-system-map.md) - Project structure
  - [glossary.md](./guidelines/glossary.md) - Methods reference
  - [refactoring-log.md](./guidelines/refactoring-log.md) - Refactoring history

## 🤝 Contributing

1. Follow the coding conventions in `guidelines/conventions.md`
2. Update documentation for any changes
3. Test thoroughly before submitting
4. Follow the TODO.md roadmap for development

## 📄 License

This project is private and confidential.

## 🆘 Support

For issues and questions:
1. Check the TODO.md for current development status
2. Review the guidelines documentation
3. Check Firebase configuration
4. Ensure all dependencies are installed

## 🔄 Next Steps

1. **Firebase Setup**: Configure your Firebase project
2. **Environment Variables**: Set up your `.env` file
3. **Test Authentication**: Try signing in and signing up
4. **Implement Features**: Follow the TODO.md roadmap
5. **Deploy**: Prepare for app store submission

---

**Note**: This is a development version. Some features are placeholders and will be implemented according to the TODO.md roadmap.
