import { render, screen, fireEvent } from '@testing-library/react';
import { PostCard } from '../PostCard';
import { Post } from '@/types';

const mockPost: Post = {
  id: '1',
  threadId: 'thread1',
  authorId: 'user1',
  content: 'This is a test post content',
  createdAt: '2024-01-20T10:00:00Z',
  author: {
    id: 'user1',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  repliesCount: 2,
  isEdited: false,
};

const mockPostEdited: Post = {
  ...mockPost,
  editedAt: '2024-01-20T11:00:00Z',
  isEdited: true,
};

describe('PostCard', () => {
  it('renders post content correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows reply count when available', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('2 réponses')).toBeInTheDocument();
  });

  it('shows edited badge when post is edited', () => {
    render(<PostCard post={mockPostEdited} />);

    expect(screen.getByText('Modifié')).toBeInTheDocument();
  });

  it('does not show edited badge when post is not edited', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.queryByText('Modifié')).not.toBeInTheDocument();
  });

  it('shows action buttons when showActions is true', () => {
    const mockOnReply = jest.fn();
    render(
      <PostCard post={mockPost} onReply={mockOnReply} showActions={true} />
    );

    expect(screen.getByText('Répondre')).toBeInTheDocument();
  });

  it('calls onReply when reply button is clicked', () => {
    const mockOnReply = jest.fn();
    render(
      <PostCard post={mockPost} onReply={mockOnReply} showActions={true} />
    );

    fireEvent.click(screen.getByText('Répondre'));
    expect(mockOnReply).toHaveBeenCalledWith(mockPost);
  });

  it('does not show action buttons when showActions is false', () => {
    render(<PostCard post={mockPost} showActions={false} />);

    expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
  });

  it('handles single reply correctly', () => {
    const singleReplyPost = { ...mockPost, repliesCount: 1 };
    render(<PostCard post={singleReplyPost} />);

    expect(screen.getByText('1 réponse')).toBeInTheDocument();
  });

  it('handles zero replies correctly', () => {
    const noRepliesPost = { ...mockPost, repliesCount: 0 };
    render(<PostCard post={noRepliesPost} />);

    expect(screen.queryByText(/réponse/)).not.toBeInTheDocument();
  });

  it('handles missing avatar gracefully', () => {
    const postWithoutAvatar = {
      ...mockPost,
      author: { ...mockPost.author, avatarUrl: undefined },
    };

    render(<PostCard post={postWithoutAvatar} />);

    expect(screen.getByText('T')).toBeInTheDocument(); // Fallback initial
  });

  it('preserves whitespace in content', () => {
    const postWithWhitespace = {
      ...mockPost,
      content: 'Line 1\nLine 2\nLine 3',
    };

    render(<PostCard post={postWithWhitespace} />);

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });
});
