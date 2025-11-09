# CareCircle Connect - Icon Creation Guide

This guide provides specifications and instructions for creating all required icon assets for CareCircle Connect.

## Icon Specifications

### 1. Main App Icon (`icon.png`)
- **Size**: 1024 x 1024 pixels
- **Format**: PNG (no transparency for iOS, can have transparency for Android)
- **Usage**: Primary app icon for iOS and Android
- **Location**: `./assets/icon.png`
- **Design Notes**:
  - Should be recognizable at small sizes (app icon on home screen)
  - Use the CareCircle Connect branding (heart/circle theme)
  - Keep important elements centered (icons are often cropped to circles)
  - Avoid text (it becomes unreadable at small sizes)
  - Use high contrast colors for visibility

### 2. Adaptive Icon - Foreground (`adaptive-icon.png`)
- **Size**: 1024 x 1024 pixels (Android will crop to safe zone)
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground layer
- **Location**: `./assets/adaptive-icon.png`
- **Safe Zone**: Keep important content within the center 66% (672 x 672 pixels)
- **Background Color**: White (`#FFFFFF`) - configured in `app.config.js`
- **Design Notes**:
  - Android will apply various masks (circle, rounded square, squircle)
  - Important elements should be in the center safe zone
  - Use transparency for non-essential decorative elements
  - The background color is set separately in config

### 3. Splash Icon (`splash-icon.png`)
- **Size**: 1024 x 1024 pixels (recommended)
- **Format**: PNG (transparency optional)
- **Usage**: Splash screen display
- **Location**: `./assets/splash-icon.png`
- **Background**: White (`#FFFFFF`) - configured in `app.config.js`
- **Design Notes**:
  - Should match or complement the main app icon
  - Can be slightly larger/more detailed since it's shown full-screen
  - Center the design (will be displayed with `resizeMode: 'contain'`)

### 4. Favicon (`favicon.png`)
- **Size**: 32 x 32 pixels (minimum), 192 x 192 pixels (recommended)
- **Format**: PNG or ICO
- **Usage**: Web browser tab icon
- **Location**: `./assets/favicon.png`
- **Design Notes**:
  - Should be a simplified version of the main icon
  - Must be readable at very small sizes (16x16 to 32x32)
  - High contrast is essential

## Design Guidelines

### Brand Identity
- **App Name**: CareCircle Connect
- **Theme**: Care, connection, family, support
- **Visual Elements**: Consider using:
  - Heart symbol (💙) or heart shape
  - Circle/ring representing connection
  - Interconnected elements
  - Warm, caring colors (blues, purples, soft tones)

### Color Palette Suggestions
- Primary: Blue tones (`#3b82f6`, `#60a5fa`, `#93c5fd`)
- Secondary: Purple tones (`#8b5cf6`, `#a78bfa`, `#c4b5fd`)
- Accent: Soft pink/coral for warmth
- Background: White or light blue (`#f0f9ff`)

### Design Tools & Services

#### Online Icon Generators
1. **AppIcon.co** (https://appicon.co)
   - Upload one 1024x1024 icon
   - Generates all sizes automatically
   - Free for basic use

2. **IconKitchen** (https://icon.kitchen)
   - Google's adaptive icon generator
   - Great for Android adaptive icons
   - Free

3. **Figma** (https://figma.com)
   - Professional design tool
   - Free for individuals
   - Export to PNG at exact sizes

4. **Canva** (https://canva.com)
   - User-friendly design tool
   - Templates for app icons
   - Free tier available

#### Design Software
- **Adobe Illustrator** - Vector design (best for scalability)
- **Sketch** - Mac-only design tool
- **Figma** - Web-based, cross-platform
- **GIMP** - Free, open-source image editor

## Step-by-Step Creation Process

### Option 1: Design from Scratch

1. **Create Base Design** (1024x1024px)
   - Use design tool of choice
   - Design centered icon with CareCircle Connect theme
   - Export as `icon.png`

2. **Create Adaptive Icon**
   - Use same design or simplified version
   - Ensure important elements are in center 66%
   - Export as `adaptive-icon.png` with transparency

3. **Create Splash Icon**
   - Can use same as main icon or slightly enhanced version
   - Export as `splash-icon.png`

4. **Create Favicon**
   - Simplify design for small size
   - Export at 192x192px as `favicon.png`

### Option 2: Use Icon Generator Service

1. **Design or Find Base Icon** (1024x1024px)
   - Create your design
   - Or use a service like AppIcon.co

2. **Generate All Sizes**
   - Upload to AppIcon.co or similar service
   - Download generated assets
   - Place in `./assets/` directory

### Option 3: Use Expo's Icon Generator

If you have a base design, you can use Expo's tools:

```bash
# Install expo-cli if not already installed
npm install -g expo-cli

# Generate icons (requires base icon.png)
npx expo-optimize
```

## Quick Design Ideas for CareCircle Connect

### Concept 1: Heart Circle
- Central heart symbol (💙)
- Surrounded by a circle/ring
- Gradient background (blue to purple)
- Clean, modern look

### Concept 2: Interconnected Hearts
- Multiple small hearts forming a circle
- Lines connecting them
- Represents care network
- Warm, friendly appearance

### Concept 3: Care Symbol
- Stylized "C" for Care/Circle/Connect
- Heart integrated into the design
- Professional yet approachable
- Works well at small sizes

### Concept 4: Abstract Connection
- Abstract shapes representing people
- Connected by lines/circles
- Modern, minimalist
- Represents network/community

## Testing Your Icons

### Before Finalizing
1. **Test at Small Sizes**
   - View icon at 20x20, 40x40, 60x60 pixels
   - Ensure it's still recognizable
   - Check readability

2. **Test on Devices**
   - Build app and test on actual device
   - Check how it looks on home screen
   - Verify splash screen appearance

3. **Test Adaptive Icon**
   - Android applies different masks
   - Test with circle, rounded square, squircle masks
   - Ensure important content isn't cropped

### Validation Checklist
- [ ] icon.png is 1024x1024px
- [ ] adaptive-icon.png is 1024x1024px with transparency
- [ ] splash-icon.png is 1024x1024px
- [ ] favicon.png is at least 32x32px (192x192px recommended)
- [ ] All icons use PNG format
- [ ] Icons are centered and work at small sizes
- [ ] No text in icons (becomes unreadable)
- [ ] High contrast for visibility
- [ ] Matches CareCircle Connect branding

## File Structure

After creation, your assets folder should look like:

```
assets/
├── icon.png              (1024x1024)
├── adaptive-icon.png      (1024x1024, transparent)
├── splash-icon.png       (1024x1024)
└── favicon.png           (192x192 or 32x32)
```

## Current Configuration

Your `app.config.js` is already configured to use these files:
- `icon: './assets/icon.png'` - Main app icon
- `splash.image: './assets/icon.png'` - Splash screen (currently uses icon.png)
- `android.adaptiveIcon.foregroundImage: './assets/adaptive-icon.png'` - Android adaptive icon
- `web.favicon: './assets/icon.png'` - Web favicon (currently uses icon.png)

**Note**: You may want to update the splash screen and favicon to use dedicated files once created.

## Resources

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design - Adaptive Icons](https://material.io/design/iconography/product-icons.html)
- [Expo Icon Documentation](https://docs.expo.dev/guides/app-icons/)
- [AppIcon.co](https://appicon.co) - Free icon generator
- [IconKitchen](https://icon.kitchen) - Google's adaptive icon tool

## Next Steps

1. **Design or commission** your icon design
2. **Create all required sizes** using tools above
3. **Place files** in `./assets/` directory
4. **Update app.config.js** if using dedicated splash-icon.png or favicon.png
5. **Test** by building the app
6. **Iterate** based on how icons look on devices

