import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CircleCard from '../src/components/CircleCard';

describe('CircleCard', () => {
  const mockCircle = {
    id: 'test-circle-id',
    title: 'Test Circle',
    ownerId: 'test-owner-id',
    members: ['user1', 'user2', 'user3'],
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockProps = {
    circle: mockCircle,
    memberCount: 3,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders circle title correctly', () => {
    const { getByText } = render(<CircleCard {...mockProps} />);
    expect(getByText('Test Circle')).toBeTruthy();
  });

  it('displays member count correctly', () => {
    const { getByText } = render(<CircleCard {...mockProps} />);
    expect(getByText('3 members')).toBeTruthy();
  });

  it('displays singular member count correctly', () => {
    const singleMemberProps = {
      ...mockProps,
      memberCount: 1,
    };
    
    const { getByText } = render(<CircleCard {...singleMemberProps} />);
    expect(getByText('1 member')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByText } = render(<CircleCard {...mockProps} />);
    const card = getByText('Test Circle').parent;
    
    fireEvent.press(card);
    
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('renders people emoji', () => {
    const { getByText } = render(<CircleCard {...mockProps} />);
    expect(getByText('👥')).toBeTruthy();
  });

  it('renders arrow emoji', () => {
    const { getByText } = render(<CircleCard {...mockProps} />);
    expect(getByText('→')).toBeTruthy();
  });

  it('displays formatted creation date', () => {
    const { getByText } = render(<CircleCard {...mockProps} />);
    expect(getByText(/Jan 1, 2024/)).toBeTruthy();
  });

  it('renders "View updates" text', () => {
    const { getByText } = render(<CircleCard {...mockProps} />);
    expect(getByText('View updates')).toBeTruthy();
  });
});
