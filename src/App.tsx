import { useState, useEffect } from 'react';
import { useAuthController } from './controllers/useAuthController';
import { AppLayout, ActiveTab } from './views/layouts/AppLayout';
import { ProfileView } from './views/pages/ProfileView';
import { WorkoutView } from './views/pages/WorkoutView';
import { ExercisesView } from './views/pages/ExercisesView';
import { StatsView } from './views/pages/StatsView';
import { AdviceView } from './views/pages/AdviceView';
import { AuthView } from './views/pages/AuthView';
import { OnboardingModal } from './views/components/OnboardingModal';
import { useMeasurementStore } from './models/repositories/MeasurementStore';
import { useWorkoutStore } from './models/repositories/WorkoutStore';
import { usePRStore } from './models/repositories/PRStore';
import { useStreakStore } from './models/repositories/StreakStore';

export function App() {
  const {
    user,
    needsOnboarding,
    completeOnboarding,
    onboardingLoading,
    onboardingError,
    checkBackendProfile,
    signOut,
    setDemoUser,
  } = useAuthController();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  useEffect(() => {
    if (user) {
      useStreakStore.getState().recordLogin(user.id);
      if (user.id !== 'demo-athlete-1') {
        if (needsOnboarding) {
          checkBackendProfile();
        }
        useWorkoutStore.getState().syncFromBackend().catch(() => {});
        usePRStore.getState().syncFromBackend().catch(() => {});
      }
    }
  }, [user, needsOnboarding, checkBackendProfile]);

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
    <>
      {needsOnboarding && (
        <OnboardingModal
          username={user.username}
          onSignOut={handleSignOut}
          onSubmit={async (data) => {
            const { measurements, ...profileData } = data;
            const ok = await completeOnboarding(profileData);
            if (ok && measurements && Object.keys(measurements).length > 0) {
              try {
                await useMeasurementStore.getState().saveMeasurement({
                  date: new Date().toISOString().split('T')[0],
                  ...measurements,
                });
              } catch (e) {
                console.warn('Could not save baseline measurements:', e);
              }
            }
          }}
          loading={onboardingLoading}
          error={onboardingError}
        />
      )}
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
    </>
  );
}

export default App;
