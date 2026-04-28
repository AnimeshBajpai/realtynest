import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useRunnerAuthStore } from '../store/runnerAuthStore';

export default function RunnerProtectedRoute() {
  const { token, runner, getMe } = useRunnerAuthStore();
  const location = useLocation();
  const [fetchingProfile, setFetchingProfile] = useState(false);

  useEffect(() => {
    if (token && !runner && !fetchingProfile) {
      setFetchingProfile(true);
      getMe().finally(() => setFetchingProfile(false));
    }
  }, [token, runner, getMe, fetchingProfile]);

  if (!token) {
    return <Navigate to="/runningCoach/login" replace />;
  }

  // Waiting for runner profile to load
  if (!runner) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00FF88]/30 border-t-[#00FF88] rounded-full animate-spin" />
      </div>
    );
  }

  if (!runner.onboardingCompleted) {
    const isOnboardingRoute = location.pathname.includes('/onboarding');
    if (!isOnboardingRoute) {
      return <Navigate to="/runningCoach/onboarding" replace />;
    }
  }

  return <Outlet />;
}
