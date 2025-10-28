import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UpdateCard from '../src/components/UpdateCard';
import { EMOJIS } from '../src/utils/emojiUtils';

// Mock the auth context
jest.mock('../src/lib/authContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      displayName: 'Test User',
    },
  }),
}));

describe('UpdateCard', () => {
  const mockUpdate = {
    id: 'test-update-id',
    circleId: 'test-circle-id',
    authorId: 'test-author-id',
    text: 'This is a test update',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    reactions: {
      'user1': EMOJIS.HEART,
      'user2': EMOJIS.THUMBS_UP,
    },
  };

  const mockProps = {
    update: mockUpdate,
    authorName: 'Test Author',
    currentUserId: 'test-user-id',
    onReaction: jest.fn(),
    onComment: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders update text correctly', () => {
    const { getByText } = render(<UpdateCard {...mockProps} />);
    expect(getByText('This is a test update')).toBeTruthy();
  });

  it('renders author name correctly', () => {
    const { getByText } = render(<UpdateCard {...mockProps} />);
    expect(getByText('Test Author')).toBeTruthy();
  });

  it('renders reaction buttons', () => {
    const { getByText } = render(<UpdateCard {...mockProps} />);
    expect(getByText(EMOJIS.HEART)).toBeTruthy();
    expect(getByText(EMOJIS.PRAY)).toBeTruthy();
    expect(getByText(EMOJIS.THUMBS_UP)).toBeTruthy();
    expect(getByText(EMOJIS.COMMENT)).toBeTruthy();
  });

  it('displays reaction counts correctly', () => {
    const { getByText } = render(<UpdateCard {...mockProps} />);
    expect(getByText('1')).toBeTruthy(); // Heart reaction count
    expect(getByText('1')).toBeTruthy(); // Thumbs up reaction count
  });

  it('calls onReaction when reaction button is pressed', () => {
    const { getByText } = render(<UpdateCard {...mockProps} />);
    const heartButton = getByText(EMOJIS.HEART);
    
    fireEvent.press(heartButton);
    
    expect(mockProps.onReaction).toHaveBeenCalledWith('test-update-id', EMOJIS.HEART);
  });

  it('calls onComment when comment button is pressed', () => {
    const { getByText } = render(<UpdateCard {...mockProps} />);
    const commentButton = getByText(EMOJIS.COMMENT);
    
    fireEvent.press(commentButton);
    
    expect(mockProps.onComment).toHaveBeenCalledWith('test-update-id');
  });

  it('renders photo when photoURL is provided', () => {
    const updateWithPhoto = {
      ...mockUpdate,
      photoURL: 'https://example.com/photo.jpg',
    };
    
    const { getByTestId } = render(
      <UpdateCard {...mockProps} update={updateWithPhoto} />
    );
    
    expect(getByTestId('update-photo')).toBeTruthy();
  });

  it('highlights user reactions correctly', () => {
    const updateWithUserReaction = {
      ...mockUpdate,
      reactions: {
        'test-user-id': EMOJIS.HEART,
        'user2': EMOJIS.THUMBS_UP,
      },
    };
    
    const { getByText } = render(
      <UpdateCard {...mockProps} update={updateWithUserReaction} />
    );
    
    // The heart button should be highlighted since the current user reacted with it
    const heartButton = getByText(EMOJIS.HEART).parent;
    expect(heartButton.props.style.backgroundColor).toBe('#fecaca');
  });

  it('formats date correctly', () => {
    const { getByText } = render(<UpdateCard {...mockProps} />);
    // The date should be formatted and displayed
    expect(getByText(/Jan 1, 2024/)).toBeTruthy();
  });
});
