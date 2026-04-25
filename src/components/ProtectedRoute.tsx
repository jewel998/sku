import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'allowed') {
    return children;
  }

  if (auth.status === 'checking') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking access...</span>
        </div>
      </div>
    );
  }

  if (auth.status === 'signed-out' || auth.status === 'unconfigured') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800 border border-slate-600 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3 text-red-300">
          <LogIn className="w-5 h-5" />
          <h1 className="text-lg font-semibold">Access denied</h1>
        </div>
        <p className="text-sm text-slate-300 mb-4">
          This Google account is not in the Firebase allowlist.
        </p>
        <button
          type="button"
          onClick={() => void auth.signOut()}
          className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
