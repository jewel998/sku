import { Navigate, useLocation } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  if (auth.status === 'allowed') {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-slate-800 border border-slate-600 rounded-lg p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-blue-300" />
          <h1 className="text-xl font-bold text-slate-100">Sign in</h1>
        </div>
        <p className="text-sm text-slate-300 mb-5">
          Use an approved Google account to open SKU Label Maker.
        </p>

        {auth.status === 'denied' ? (
          <div className="mb-4 rounded-lg border border-red-700/40 bg-red-900/20 p-3 text-sm text-red-200">
            Your account is signed in, but it is not allowed for this app.
          </div>
        ) : null}

        {auth.status === 'unconfigured' ? (
          <div className="mb-4 rounded-lg border border-amber-700/40 bg-amber-900/20 p-3 text-sm text-amber-100">
            Firebase environment variables are missing. Add them before using protected routes.
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void auth.signIn()}
          disabled={auth.status === 'checking' || auth.status === 'unconfigured'}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          <LogIn className="w-4 h-4" />
          {auth.status === 'checking' ? 'Checking...' : 'Continue with Google'}
        </button>
      </section>
    </div>
  );
}
