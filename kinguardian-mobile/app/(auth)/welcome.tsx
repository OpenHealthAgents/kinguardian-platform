import { useContext, useEffect } from 'react';
import { AppContext } from '../../src/store/AppContext';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

export default function WelcomeRoute() {
  const context = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!context) return null;

  return (
    <OnboardingScreen
      onComplete={(_config) => {
        context.setCurrentScreen('health_dashboard');
        context.showToast('Onboarding complete! Concierge active.');
        router.replace('/(coordinator)');
      }}
    />
  );
}
