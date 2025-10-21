import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBanner } from '../NotificationBanner';
import { notificationService } from '@/lib/notifications';
import { toast } from 'react-hot-toast';

// Mock the notification service
jest.mock('@/lib/notifications', () => ({
  notificationService: {
    isSupported: jest.fn(),
    isGranted: jest.fn(),
    getPermissionStatus: jest.fn(),
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    sendTestNotification: jest.fn(),
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('NotificationBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when notifications are not granted', () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('default');

    render(<NotificationBanner />);

    expect(
      screen.getByText('Activer les rappels hebdomadaires')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Recevez une notification chaque lundi à 9h pour découvrir le nouveau thème de la semaine.'
      )
    ).toBeInTheDocument();
  });

  it('does not render when notifications are already granted', () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(true);

    render(<NotificationBanner />);

    expect(
      screen.queryByText('Activer les rappels hebdomadaires')
    ).not.toBeInTheDocument();
  });

  it('does not render when notifications are not supported', () => {
    mockNotificationService.isSupported.mockReturnValue(false);

    render(<NotificationBanner />);

    expect(
      screen.queryByText('Activer les rappels hebdomadaires')
    ).not.toBeInTheDocument();
  });

  it('shows denied status when permission is denied', () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('denied');

    render(<NotificationBanner />);

    expect(
      screen.getByText(
        'Les notifications ont été refusées. Vous pouvez les activer dans les paramètres de votre navigateur.'
      )
    ).toBeInTheDocument();
  });

  it('handles enable notifications click', async () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('default');
    mockNotificationService.requestPermission.mockResolvedValue(true);
    mockNotificationService.getToken.mockResolvedValue('test-token');

    render(<NotificationBanner />);

    const enableButton = screen.getByText('Activer les notifications');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNotificationService.getToken).toHaveBeenCalled();
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      'Notifications activées avec succès !'
    );
  });

  it('handles enable notifications failure', async () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('default');
    mockNotificationService.requestPermission.mockResolvedValue(false);

    render(<NotificationBanner />);

    const enableButton = screen.getByText('Activer les notifications');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockNotificationService.requestPermission).toHaveBeenCalled();
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      'Permission de notification refusée'
    );
  });

  it('handles test notification click when granted', async () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('granted');
    mockNotificationService.sendTestNotification.mockResolvedValue(true);

    render(<NotificationBanner />);

    const testButton = screen.getByText('Test');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockNotificationService.sendTestNotification).toHaveBeenCalled();
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      'Notification de test envoyée !'
    );
  });

  it('handles test notification failure', async () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('granted');
    mockNotificationService.sendTestNotification.mockRejectedValue(
      new Error('Test failed')
    );

    render(<NotificationBanner />);

    const testButton = screen.getByText('Test');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockNotificationService.sendTestNotification).toHaveBeenCalled();
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      "Erreur lors de l'envoi de la notification de test"
    );
  });

  it('handles dismiss button click', () => {
    const onDismiss = jest.fn();
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);

    render(<NotificationBanner onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: '' });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('disables enable button when permission is denied', () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('denied');

    render(<NotificationBanner />);

    const enableButton = screen.getByText('Activer les notifications');
    expect(enableButton).toBeDisabled();
  });

  it('shows loading state during enable process', async () => {
    mockNotificationService.isSupported.mockReturnValue(true);
    mockNotificationService.isGranted.mockReturnValue(false);
    mockNotificationService.getPermissionStatus.mockReturnValue('default');

    // Mock a delayed response
    mockNotificationService.requestPermission.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );
    mockNotificationService.getToken.mockResolvedValue('test-token');

    render(<NotificationBanner />);

    const enableButton = screen.getByText('Activer les notifications');
    fireEvent.click(enableButton);

    expect(screen.getByText('Activation...')).toBeInTheDocument();
    expect(enableButton).toBeDisabled();
  });
});
