import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MissionControl } from '@/features/solar-voyage/ui/MissionControl';

describe('MissionControl component', () => {
  it('starts a mission and shows navigation controls', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /new mission/i }));

    expect(screen.getByText(/navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/current coordinates/i)).toBeInTheDocument();
  });

  it('starts a trip and shows the transit countdown', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /new mission/i }));
    await user.click(screen.getByRole('button', { name: /accelerate/i }));

    expect(screen.getByText(/transit countdown/i)).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('keeps the ship centered while minimap zoom changes', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /new mission/i }));

    const shipMarker = screen.getByTestId('minimap-ship');
    const marsMarker = screen.getByTestId('minimap-body-Mars');
    const zoomSlider = screen.getByRole('slider', { name: /minimap zoom/i });

    expect(shipMarker).toHaveStyle({ left: '50%', top: '50%' });

    const initialMarsLeft = marsMarker.style.left;
    fireEvent.change(zoomSlider, { target: { value: '100' } });

    expect(shipMarker).toHaveStyle({ left: '50%', top: '50%' });
    expect(screen.getByTestId('minimap-zoom-value')).toHaveTextContent('25000%');
    expect(marsMarker.style.left).not.toBe(initialMarsLeft);
  });
});
