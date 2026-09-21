import { useState } from 'react';
import { useAuthController } from './controllers/useAuthController';
import { AppLayout, ActiveTab } from './views/layouts/AppLayout';
import { ProfileView } from './views/pages/ProfileView';
import { WorkoutView } from './views/pages/WorkoutView';
import { ExercisesView } from './views/pages/ExercisesView';
import { StatsView } from './views/pages/StatsView';
import { AdviceView } from './views/pages/AdviceView';
import { AuthView } from './views/pages/AuthView';

export function App() {
  const { user, signOut, setDemoUser } = useAuthController();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <AuthView
        onDemoLogin={() => {
          setDemoUser();
        }}
      />
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      onSignOut={handleSignOut}
    >
      {activeTab === 'profile' && <ProfileView user={user} />}
      {activeTab === 'workout' && <WorkoutView onNavigateTab={setActiveTab} />}
      {activeTab === 'exercises' && <ExercisesView userId={user?.id} />}
      {activeTab === 'stats' && <StatsView userId={user?.id} />}
      {activeTab === 'advice' && <AdviceView />}
    </AppLayout>
  );
}

export default App;
