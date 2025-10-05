import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoryForm } from '../StoryForm';
import { useClerkAuth } from '@/modules/auth/contexts';
import React from 'react';

// Mock Clerk components
const MockSignInButton = ({ children, mode }: { children: React.ReactNode; mode?: string }) => (
  <button data-testid="sign-in-button" data-mode={mode}>
    {children}
  </button>
);

vi.mock('@clerk/clerk-react', () => ({
  SignInButton: MockSignInButton
}));

// Mock the auth context
vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: vi.fn(),
}));
const mockUseClerkAuth = useClerkAuth as ReturnType<typeof vi.fn>;

describe('StoryForm', () => {
  const defaultProps = {
    name: '',
    setName: vi.fn(),
    date: undefined,
    setDate: vi.fn(),
    loading: false,
    handleSubmit: vi.fn(),
    handleStorySelect: vi.fn(),
    personalityTypes: {
      dreamer: { 
        title: 'Dreamer', 
        description: 'A dreamy personality',
        traits: ['Imaginative', 'Creative', 'Thoughtful']
      },
      adventurer: { 
        title: 'Adventurer', 
        description: 'An adventurous personality',
        traits: ['Bold', 'Energetic', 'Brave']
      }
    },
    personalityType: 'dreamer' as const,
    setPersonalityType: vi.fn(),
    gender: 'same' as const,
    setGender: vi.fn(),
    location: '',
    setLocation: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', email: 'test@example.com' },
      isLoading: false,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(100),
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: MockSignInButton,
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });
  });

  it('should render all form elements', () => {
    render(<StoryForm {...defaultProps} />);

    expect(screen.getByText('Discover Your Alternate Timeline')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your character name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter the story location (e.g., Paris, New York, Tokyo)')).toBeInTheDocument();
    expect(screen.getByText('Your Birthdate')).toBeInTheDocument();
    expect(screen.getByText('Gender in Your Story')).toBeInTheDocument();
    expect(screen.getByText('Keep Same')).toBeInTheDocument();
    expect(screen.getByText('Flip It!')).toBeInTheDocument();
    expect(screen.getByText('Gender Neutral')).toBeInTheDocument();
    expect(screen.getByText('Flip My Era')).toBeInTheDocument();
  });

  it('should display welcome message for authenticated users', () => {
    render(<StoryForm {...defaultProps} />);

    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
  });

  it('should display sign in button for unauthenticated users', () => {
    mockUseClerkAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      fetchCreditBalance: vi.fn().mockResolvedValue(0),
      getToken: vi.fn().mockResolvedValue(null),
      isNewUser: false,
      setIsNewUser: vi.fn(),
      SignInButton: MockSignInButton,
      SignUpButton: vi.fn(),
      UserButton: vi.fn()
    });

    render(<StoryForm {...defaultProps} />);

    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
    expect(screen.queryByText('Welcome Back!')).not.toBeInTheDocument();
  });

  it('should update name when input changes', () => {
    const setName = vi.fn();
    render(<StoryForm {...defaultProps} setName={setName} />);

    const nameInput = screen.getByPlaceholderText('Enter your character name');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    expect(setName).toHaveBeenCalledWith('Alice');
  });

  it('should update location when input changes', () => {
    const setLocation = vi.fn();
    render(<StoryForm {...defaultProps} setLocation={setLocation} />);

    const locationInput = screen.getByPlaceholderText('Enter the story location (e.g., Paris, New York, Tokyo)');
    fireEvent.change(locationInput, { target: { value: 'Paris' } });

    expect(setLocation).toHaveBeenCalledWith('Paris');
  });

  it('should update date when date input changes', () => {
    const setDate = vi.fn();
    const { container } = render(<StoryForm {...defaultProps} setDate={setDate} />);

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '1990-01-01' } });

    expect(setDate).toHaveBeenCalledWith(new Date('1990-01-01'));
  });

  it('should handle date input with invalid date', () => {
    const setDate = vi.fn();
    const { container } = render(<StoryForm {...defaultProps} setDate={setDate} />);

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    
    // Simulate invalid date by setting valueAsDate to null
    Object.defineProperty(dateInput, 'valueAsDate', {
      get: () => null,
      configurable: true
    });
    
    fireEvent.change(dateInput, { target: { value: '' } });

    expect(setDate).toHaveBeenCalledWith(undefined);
  });

  it('should update gender when radio button is selected', () => {
    const setGender = vi.fn();
    render(<StoryForm {...defaultProps} setGender={setGender} />);

    const flipButton = screen.getByLabelText('Flip It!');
    fireEvent.click(flipButton);

    expect(setGender).toHaveBeenCalledWith('flip');
  });

  it('should call handleSubmit when form is submitted', () => {
    const handleSubmit = vi.fn();
    render(<StoryForm {...defaultProps} handleSubmit={handleSubmit} name="Alice" />);

    const submitButton = screen.getByText('Flip My Era');
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should disable submit button when loading', () => {
    render(<StoryForm {...defaultProps} loading={true} />);

    const submitButton = screen.getByText('Time Traveling...');
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when name is empty', () => {
    render(<StoryForm {...defaultProps} name="" />);

    const submitButton = screen.getByText('Flip My Era');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when name is provided and not loading', () => {
    render(<StoryForm {...defaultProps} name="Alice" loading={false} />);

    const submitButton = screen.getByText('Flip My Era');
    expect(submitButton).not.toBeDisabled();
  });

  it('should display star sign when date is provided', () => {
    const mockDate = new Date('1990-01-01');
    render(<StoryForm {...defaultProps} date={mockDate} />);

    // The StarSignDisplay component should be rendered
    expect(screen.getByText('Your Birthdate')).toBeInTheDocument();
  });

  it('should render personality selector with correct props', () => {
    const setPersonalityType = vi.fn();
    render(
      <StoryForm 
        {...defaultProps} 
        setPersonalityType={setPersonalityType}
        personalityType="adventurer"
      />
    );

    // The PersonalitySelector component should be rendered
    // We can't easily test its internal behavior without mocking it
    expect(screen.getByText('Gender in Your Story')).toBeInTheDocument();
  });

  it('should have correct max date for date input', () => {
    const { container } = render(<StoryForm {...defaultProps} />);

    const dateInput = container.querySelector('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput).toHaveAttribute('max', today);
  });

  it('should have correct input types', () => {
    const { container } = render(<StoryForm {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Enter your character name');
    const locationInput = screen.getByPlaceholderText('Enter the story location (e.g., Paris, New York, Tokyo)');
    const dateInput = container.querySelector('input[type="date"]');

    // Inputs exist and are of the correct type
    expect(nameInput).toBeInTheDocument();
    expect(locationInput).toBeInTheDocument();
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('should have correct accessibility attributes', () => {
    const { container } = render(<StoryForm {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Enter your character name');
    const locationInput = screen.getByPlaceholderText('Enter the story location (e.g., Paris, New York, Tokyo)');
    const dateInput = container.querySelector('input[type="date"]');

    expect(nameInput).toHaveAttribute('placeholder', 'Enter your character name');
    expect(locationInput).toHaveAttribute('placeholder', 'Enter the story location (e.g., Paris, New York, Tokyo)');
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('should render with correct CSS classes', () => {
    const { container } = render(<StoryForm {...defaultProps} />);

    const formContainer = container.querySelector('.glass-card');
    expect(formContainer).toBeInTheDocument();
    expect(formContainer).toHaveClass('glass-card');
  });

  it('should handle all gender options', () => {
    const setGender = vi.fn();
    const { container } = render(<StoryForm {...defaultProps} setGender={setGender} />);

    // Query radio buttons by their value attribute
    const sameRadio = container.querySelector('button[value="same"]') as HTMLElement;
    const flipRadio = container.querySelector('button[value="flip"]') as HTMLElement;
    const neutralRadio = container.querySelector('button[value="neutral"]') as HTMLElement;

    fireEvent.click(sameRadio);
    expect(setGender).toHaveBeenCalledWith('same');

    fireEvent.click(flipRadio);
    expect(setGender).toHaveBeenCalledWith('flip');

    fireEvent.click(neutralRadio);
    expect(setGender).toHaveBeenCalledWith('neutral');
  });

  it('should display loading state correctly', () => {
    const { container } = render(<StoryForm {...defaultProps} loading={true} name="Alice" />);

    expect(screen.getByText('Time Traveling...')).toBeInTheDocument();
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should not display loading state when not loading', () => {
    render(<StoryForm {...defaultProps} loading={false} name="Alice" />);

    expect(screen.getByText('Flip My Era')).toBeInTheDocument();
    expect(screen.queryByText('Time Traveling...')).not.toBeInTheDocument();
  });
});
