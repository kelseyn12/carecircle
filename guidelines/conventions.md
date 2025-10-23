# Care Circle - Coding Conventions

## Project Structure
```
src/
  lib/           # Firebase configuration and utilities
  navigation/    # React Navigation setup
  screens/       # Screen components
  components/    # Reusable UI components
  validation/    # Zod schemas for form validation
  types/         # TypeScript type definitions
```

## Naming Conventions

### Files and Directories
- Use PascalCase for component files: `CircleCard.tsx`
- Use camelCase for utility files: `firebase.ts`
- Use kebab-case for directories: `validation/`

### Components
- Use PascalCase for component names: `CircleCard`
- Use descriptive names that indicate purpose: `NewUpdateScreen`
- Prefix with screen type when appropriate: `CreateCircleScreen`

### Variables and Functions
- Use camelCase: `handleCreateCircle`, `isLoading`
- Use descriptive names: `circleTitle` not `title`
- Use boolean prefixes: `isLoading`, `hasError`, `canEdit`

### Constants
- Use UPPER_SNAKE_CASE: `MAX_UPDATE_LENGTH`
- Group related constants in objects

## Code Style

### TypeScript
- Always use explicit types for props and state
- Use interfaces for object shapes
- Prefer type unions over any
- Use generic types where appropriate

### React Components
- Use functional components with hooks
- Keep components under 200-300 lines
- Extract complex logic into custom hooks
- Use proper prop destructuring

### Styling
- Use NativeWind (Tailwind CSS) for styling
- Prefer utility classes over custom styles
- Use consistent spacing and color scales
- Follow mobile-first responsive design

## File Organization

### Component Structure
```typescript
// Imports
import React from 'react';
import { View, Text } from 'react-native';

// Types
interface ComponentProps {
  // props
}

// Component
const Component: React.FC<ComponentProps> = ({ prop }) => {
  // hooks
  // handlers
  // render
  return (
    <View>
      <Text>Content</Text>
    </View>
  );
};

export default Component;
```

### Screen Structure
1. Imports (React, React Native, Navigation, Types)
2. Navigation types
3. Component definition
4. State and hooks
5. Handlers and effects
6. Render function
7. Export

## Best Practices

### Security
- Always validate user input with Zod schemas
- Use Firestore security rules
- Strip EXIF data from photos
- Implement rate limiting
- Use row-level security (RLS)

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Use FlatList for large lists
- Optimize images before upload
- Implement offline support

### Error Handling
- Use try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry mechanisms
- Handle network failures gracefully

### Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure proper color contrast
- Support screen readers
- Test with accessibility tools

## Documentation

### Comments
- Use JSDoc for functions
- Explain complex business logic
- Document API endpoints
- Include examples for utilities
- Keep comments up to date

### README Files
- Include setup instructions
- Document environment variables
- Provide usage examples
- List dependencies
- Include troubleshooting

## Testing

### Unit Tests
- Test component rendering
- Test user interactions
- Test error scenarios
- Mock external dependencies
- Aim for high coverage

### Integration Tests
- Test complete user flows
- Test Firebase integration
- Test navigation flows
- Test offline scenarios
- Test error recovery

## Git Workflow

### Commit Messages
- Use conventional commits
- Be descriptive and concise
- Reference issues when applicable
- Use present tense
- Keep under 50 characters for subject

### Branch Naming
- Use feature/ prefix for features
- Use fix/ prefix for bug fixes
- Use chore/ prefix for maintenance
- Include issue number when applicable

## Code Review

### Checklist
- [ ] Code follows conventions
- [ ] Types are properly defined
- [ ] Error handling is implemented
- [ ] Security considerations addressed
- [ ] Performance optimizations applied
- [ ] Tests are included
- [ ] Documentation is updated
