import { Component, type ReactNode, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RunnerProtectedRoute from './components/RunnerProtectedRoute';
import RunnerLoginPage from './pages/RunnerLoginPage';
import RunnerRegisterPage from './pages/RunnerRegisterPage';
import RunnerOnboardingPage from './pages/RunnerOnboardingPage';
import CoachDashboard from './pages/CoachDashboard';
import ActivityHistoryPage from './pages/ActivityHistoryPage';
import BadgesPage from './pages/BadgesPage';
import ProfilePage from './pages/ProfilePage';

class RunningCoachErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === 'string'
          ? error
          : 'Unknown error';
    return { hasError: true, errorMessage: message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
          <div className="bg-[#1E1E2E] border border-red-500/30 rounded-xl p-6 max-w-md w-full text-center">
            <p className="text-red-400 text-lg font-bold mb-2">Something went wrong</p>
            <p className="text-white/60 text-sm mb-4">{this.state.errorMessage}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="bg-[#00FF88] text-black font-bold px-6 py-2 rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RunningCoachApp() {
  const location = useLocation();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = '🏃 Running Coach';
    return () => { document.title = prevTitle; };
  }, [location.pathname]);

  return (
    <div className="running-coach-app min-h-screen bg-[#0D0D0D] text-white">
      <RunningCoachErrorBoundary>
        <Routes>
          <Route path="login" element={<RunnerLoginPage />} />
          <Route path="register" element={<RunnerRegisterPage />} />
          <Route element={<RunnerProtectedRoute />}>
            <Route path="onboarding" element={<RunnerOnboardingPage />} />
            <Route path="dashboard" element={<CoachDashboard />} />
            <Route path="history" element={<ActivityHistoryPage />} />
            <Route path="badges" element={<BadgesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/runningCoach/login" replace />} />
        </Routes>
      </RunningCoachErrorBoundary>
    </div>
  );
}
