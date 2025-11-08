#!/bin/bash

# Script to start iOS and Android development builds
# These commands require interactive input for encryption and keystore prompts

echo "🚀 Starting CareCircle Connect Development Builds"
echo ""
echo "This script will start both iOS and Android development builds."
echo "You'll need to answer prompts for:"
echo "  - iOS: Encryption compliance (answer: yes)"
echo "  - Android: Keystore generation (answer: yes)"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "📱 Starting iOS development build..."
eas build --profile development --platform ios

echo ""
echo "🤖 Starting Android development build..."
eas build --profile development --platform android

echo ""
echo "✅ Builds started! Check status with: eas build:list"
echo "   Or visit: https://expo.dev/accounts/kelseyn12/projects/care-circle/builds"

