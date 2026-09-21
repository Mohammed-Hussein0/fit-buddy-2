import { useState } from 'react';
import { Card, Button } from '../components/ui';
import { useAuthController } from '../../controllers/useAuthController';
import { Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthViewProps {
  onDemoLogin?: () => void;
}

export function AuthView({ onDemoLogin }: AuthViewProps) {
  const { signIn, signUp, loading, error } = useAuthController();
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, password, username || 'Athlete');
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 selection:bg-[#dc2626] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#dc2626] flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-[#dc2626]/20">
            FB
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Fit Buddy</h1>
          <p className="text-xs font-bold text-neutral-400 font-mono-stat">
            {isSignUp ? 'REGISTER ATHLETE ACCOUNT' : 'IRON & STRENGTH TRACKER'}
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                  Athlete Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/60 border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="athlete@fitbuddy.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#dc2626] font-mono-stat"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#dc2626]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Athlete Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#27272a] flex flex-col gap-2.5 text-center">
            <button
              onClick={() => setIsSignUp((v) => !v)}
              className="text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              {isSignUp ? 'Existing account? Sign in' : "Don't have an account? Sign up"}
            </button>

            {onDemoLogin && (
              <button
                type="button"
                onClick={onDemoLogin}
                className="inline-flex items-center justify-center gap-1 text-xs font-black text-[#ef4444] hover:underline cursor-pointer pt-1 uppercase tracking-wider font-mono-stat"
              >
                <span>Instant Access (Demo Mode)</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
