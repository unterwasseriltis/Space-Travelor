import backgroundImage from '../../assets/background-game.jpg';
import { MissionControl } from '@/features/solar-voyage/ui/MissionControl';

export function App() {
  return <MissionControl backgroundImage={backgroundImage} />;
}
