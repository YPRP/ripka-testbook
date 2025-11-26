import React, { useState, useEffect } from 'react';
import { User, LoginStatus } from '../types';
import { Button } from './Button';
import { InputField } from './InputField';
import { User as UserIcon, Lock, Eye, EyeOff, ShieldCheck, GraduationCap } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState<LoginStatus>(LoginStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulating fetching stored creds (only username for security in real apps)
  useEffect(() => {
    const storedUser = localStorage.getItem('ripka_remember_user');
    if (storedUser) {
      setUsername(storedUser);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(LoginStatus.LOADING);
    setErrorMsg('');

    // Simulate network delay for realistic feel
    setTimeout(() => {
      // Credentials Validation Logic
      // Valid usernames: "YP" or "RP"
      // Password: "BUGGALU"
      
      const isValidUser = username === 'YP' || username === 'RP';
      const isValidPass = password === 'BUGGALU';

      if (isValidUser && isValidPass) {
        setStatus(LoginStatus.SUCCESS);
        
        // Handle "Remember Me"
        if (rememberMe) {
          localStorage.setItem('ripka_remember_user', username);
        } else {
          localStorage.removeItem('ripka_remember_user');
        }

        // Create User Object
        const userData: User = {
          username: username,
          fullName: username === 'YP' ? 'Yash P.' : 'Riya P.',
          role: 'Candidate',
          lastLogin: new Date().toISOString(),
        };

        onLoginSuccess(userData);
      } else {
        setStatus(LoginStatus.ERROR);
        setErrorMsg('Invalid credentials. Please check your username and password.');
        // Shake animation could be triggered here
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1497294815431-9365093b7331?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center">
      {/* Overlay for better text contrast on background image */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-0"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-xl shadow-lg">
             <GraduationCap className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          RIPKA TESTBOOK
        </h2>
        <p className="mt-2 text-center text-sm text-slate-200">
          Secure Assessment Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border-t-4 border-blue-600">
          
          <div className="mb-6 flex justify-center">
             <div className="px-4 py-1 bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide rounded-full border border-blue-100">
               Login to your account
             </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <InputField
              id="username"
              label="Username"
              type="text"
              placeholder="Enter YP or RP"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              icon={<UserIcon className="h-5 w-5 text-slate-400" />}
              autoComplete="username"
            />

            <InputField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock className="h-5 w-5 text-slate-400" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-500 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              error={status === LoginStatus.ERROR ? errorMsg : undefined}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                isLoading={status === LoginStatus.LOADING}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Secure Connection
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
               Protected by TCS iON Style Security Protocols v2.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};