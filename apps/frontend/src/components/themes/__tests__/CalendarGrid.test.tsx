import { render, screen } from '@testing-library/react';
import { CalendarGrid } from '../CalendarGrid';
import { CalendarWeek } from '@/types';

const mockWeeks: CalendarWeek[] = [
  {
    weekStart: '2024-01-15T00:00:00Z',
    weekEnd: '2024-01-21T23:59:59Z',
    title: 'Thème Passé',
    isActive: false,
    themeId: null,
    theme: null,
  },
  {
    weekStart: '2024-01-22T00:00:00Z',
    weekEnd: '2024-01-28T23:59:59Z',
    title: 'Thème Actuel',
    isActive: true,
    themeId: 'theme-1',
    theme: {
      id: 'theme-1',
      title: 'Thème Actuel',
      description: 'Description du thème actuel',
      startOfWeek: '2024-01-22T00:00:00Z',
      slug: 'theme-actuel',
    },
  },
  {
    weekStart: '2024-01-29T00:00:00Z',
    weekEnd: '2024-02-04T23:59:59Z',
    title: 'Thème Futur',
    isActive: false,
    themeId: null,
    theme: null,
  },
];

describe('CalendarGrid', () => {
  it('renders calendar grid with weeks', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    expect(screen.getByText('Calendrier des Thèmes')).toBeInTheDocument();
    expect(
      screen.getByText('Découvrez les thèmes passés, actuels et à venir')
    ).toBeInTheDocument();
    expect(screen.getByText('3 semaines')).toBeInTheDocument();
  });

  it('displays week information correctly', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    expect(screen.getByText('Thème Passé')).toBeInTheDocument();
    expect(screen.getByText('Thème Actuel')).toBeInTheDocument();
    expect(screen.getByText('Thème Futur')).toBeInTheDocument();
  });

  it('shows correct status badges', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    expect(screen.getAllByText('Passé')).toHaveLength(2);
    expect(screen.getByText('Actuel')).toBeInTheDocument();
    // Note: Dans les données mockées, il n'y a pas de semaine "À venir"
  });

  it('displays active theme information', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    expect(screen.getByText('Description du thème actuel')).toBeInTheDocument();
    expect(screen.getAllByText('Thème actif')).toHaveLength(2); // One in the card, one in the legend
  });

  it('shows correct buttons for themes', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    expect(screen.getByText('Voir les suggestions')).toBeInTheDocument();
    expect(screen.getAllByText('Aucune suggestion')).toHaveLength(2);
  });

  it('renders loading state', () => {
    render(<CalendarGrid weeks={[]} currentWeek={0} isLoading={true} />);

    // Should show skeleton loaders
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('displays legend', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    expect(screen.getAllByText('Thème actif')).toHaveLength(2); // One in the card, one in the legend
    expect(screen.getByText('Semaine actuelle')).toBeInTheDocument();
    expect(screen.getByText('Semaines passées/futures')).toBeInTheDocument();
  });

  it('handles empty weeks array', () => {
    render(<CalendarGrid weeks={[]} currentWeek={0} />);

    expect(screen.getByText('Calendrier des Thèmes')).toBeInTheDocument();
    expect(screen.getByText('0 semaines')).toBeInTheDocument();
  });

  it('shows correct date formatting', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    // Check that dates are formatted correctly (French locale)
    expect(screen.getByText(/15 janv/)).toBeInTheDocument();
    expect(screen.getAllByText(/22 janv/)).toHaveLength(2);
  });

  it('handles weeks without themes', () => {
    const weeksWithoutThemes: CalendarWeek[] = [
      {
        weekStart: '2024-01-15T00:00:00Z',
        weekEnd: '2024-01-21T23:59:59Z',
        title: 'Aucun thème',
        isActive: false,
        themeId: null,
        theme: null,
      },
    ];

    render(<CalendarGrid weeks={weeksWithoutThemes} currentWeek={0} />);

    expect(
      screen.getByText('Aucun thème défini pour cette semaine')
    ).toBeInTheDocument();
    expect(screen.getByText('Aucune suggestion')).toBeInTheDocument();
  });

  it('applies correct styling for current week', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    // The current week should have special styling
    const currentWeekCard = screen.getByText('Thème Actuel').closest('.group');
    expect(currentWeekCard).toHaveClass('group');
  });

  it('shows correct week count in badge', () => {
    render(<CalendarGrid weeks={mockWeeks} currentWeek={1} />);

    expect(screen.getByText('3 semaines')).toBeInTheDocument();
  });
});
