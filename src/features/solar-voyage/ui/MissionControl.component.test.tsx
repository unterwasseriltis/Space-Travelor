import { render, screen } from '@testing-library/react';
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
});
