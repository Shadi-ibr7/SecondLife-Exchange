import { render, screen } from '@testing-library/react';
import { ThreadCard } from '../ThreadCard';
import { Thread } from '@/types';

const mockThread: Thread = {
  id: '1',
  scope: 'GENERAL',
  title: 'Test Thread',
  authorId: 'user1',
  author: {
    id: 'user1',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  postsCount: 5,
  lastPostAt: '2024-01-20T10:00:00Z',
  createdAt: '2024-01-20T09:00:00Z',
  updatedAt: '2024-01-20T10:00:00Z',
};

describe('ThreadCard', () => {
  it('renders thread information correctly', () => {
    render(<ThreadCard thread={mockThread} />);

    expect(screen.getByText('Test Thread')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('5 messages')).toBeInTheDocument();
  });

  it('displays correct scope badge', () => {
    render(<ThreadCard thread={mockThread} />);

    expect(screen.getByText('Général')).toBeInTheDocument();
  });

  it('shows last post time when available', () => {
    render(<ThreadCard thread={mockThread} />);

    expect(screen.getByText(/Dernière activité/)).toBeInTheDocument();
  });

  it('shows creation time', () => {
    render(<ThreadCard thread={mockThread} />);

    expect(screen.getByText(/Créé/)).toBeInTheDocument();
  });

  it('renders with different scope types', () => {
    const themeThread = {
      ...mockThread,
      scope: 'THEME' as const,
      scopeRef: 'theme-1',
    };
    render(<ThreadCard thread={themeThread} />);

    expect(screen.getByText('Thème')).toBeInTheDocument();
    expect(screen.getByText('theme-1')).toBeInTheDocument();
  });

  it('handles missing avatar gracefully', () => {
    const threadWithoutAvatar = {
      ...mockThread,
      author: { ...mockThread.author, avatarUrl: undefined },
    };

    render(<ThreadCard thread={threadWithoutAvatar} />);

    expect(screen.getByText('T')).toBeInTheDocument(); // Fallback initial
  });

  it('handles single message correctly', () => {
    const singlePostThread = { ...mockThread, postsCount: 1 };
    render(<ThreadCard thread={singlePostThread} />);

    expect(screen.getByText('1 message')).toBeInTheDocument();
  });
});

