import React, { useState, useEffect } from 'react';
import { User, AppSettings } from '../types';
import { getSettings, saveSettings, clearHistory } from '../utils/storage';
import { Button } from './Button';
import { InputField } from './InputField';
import {
  User as UserIcon,
  Settings,
  Bell,
  Database,
  Monitor,
  Check,
  ArrowLeft,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Trash2,
  Download,
  Save,
  Shield,
  Upload
} from 'lucide-react';

interface SettingsPageProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  onLogout: () => void; // Used for Delete Account
}

type SettingsTab = 'PROFILE' | 'TEST' | 'INTERFACE' | 'DATA' | 'NOTIFICATIONS';

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onBack, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [localUser, setLocalUser] = useState<User>(user);
  const [isSaved, setIsSaved] = useState(false);
  
  // Profile Form States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = () => {
    saveSettings(settings);
    onUpdateUser(localUser);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const updateSettings = (section: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure? This will delete all your test records, XP, and badges. This action cannot be undone.")) {
      clearHistory();
      alert("History cleared successfully.");
      window.location.reload(); // Hard refresh to reset state
    }
  };

  const tabs = [
    { id: 'PROFILE', label: 'User Profile', icon: UserIcon },
    { id: 'TEST', label: 'Test Preferences', icon: Shield },
    { id: 'INTERFACE', label: 'Interface', icon: Monitor },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
    { id: 'DATA', label: 'Data Management', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={onBack} className="w-auto p-2 h-10 w-10 flex items-center justify-center rounded-full border-slate-200">
               <ArrowLeft className="h-5 w-5 text-slate-600" />
             </Button>
             <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Settings className="h-6 w-6 text-slate-600" />
               Settings
             </h1>
          </div>
          <Button 
            onClick={handleSave} 
            className={`w-auto px-6 transition-all duration-300 ${isSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {isSaved ? <span className="flex items-center"><Check className="h-4 w-4 mr-2" /> Saved</span> : <span className="flex items-center"><Save className="h-4 w-4 mr-2" /> Save Changes</span>}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as SettingsTab)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                 `}
               >
                 <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                 {tab.label}
               </button>
             ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            
            {/* PROFILE SETTINGS */}
            {activeTab === 'PROFILE' && (
              <div className="p-6 sm:p-8 animate-fadeIn space-y-8">
                <div>
                   <h2 className="text-xl font-bold text-slate-800 mb-1">User Profile</h2>
                   <p className="text-sm text-slate-500">Manage your account information and security.</p>
                </div>

                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                   <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center relative overflow-hidden group">
                      <span className="text-3xl font-bold text-slate-400">{localUser.username.substring(0,2).toUpperCase()}</span>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                         <Upload className="h-8 w-8 text-white" />
                      </div>
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800">{localUser.fullName}</h3>
                      <p className="text-sm text-slate-500 mb-3">{localUser.role}</p>
                      <Button variant="outline" className="w-auto h-8 text-xs">Change Avatar</Button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <InputField 
                      id="username"
                      label="Username" 
                      value={localUser.username} 
                      onChange={(e) => setLocalUser({...localUser, username: e.target.value})} 
                   />
                   <InputField 
                      id="fullname"
                      label="Full Name" 
                      value={localUser.fullName} 
                      onChange={(e) => setLocalUser({...localUser, fullName: e.target.value})} 
                   />
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                   <h3 className="font-bold text-slate-800">Change Password</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField 
                        id="newpass"
                        label="New Password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <InputField 
                        id="confirmpass"
                        label="Confirm Password" 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                   </div>
                </div>
              </div>
            )}

            {/* TEST PREFERENCES */}
            {activeTab === 'TEST' && (
              <div className="p-6 sm:p-8 animate-fadeIn space-y-8">
                 <div>
                   <h2 className="text-xl font-bold text-slate-800 mb-1">Test Preferences</h2>
                   <p className="text-sm text-slate-500">Configure default settings for new tests.</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Default Duration</label>
                      <select 
                        value={settings.testPreferences.defaultDuration}
                        onChange={(e) => updateSettings('testPreferences', 'defaultDuration', parseInt(e.target.value))}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                      >
                         <option value={15}>15 Minutes</option>
                         <option value={30}>30 Minutes</option>
                         <option value={45}>45 Minutes</option>
                         <option value={60}>60 Minutes</option>
                         <option value={120}>2 Hours</option>
                      </select>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Default Question Count</label>
                      <input 
                         type="number" 
                         min={5} 
                         max={100}
                         value={settings.testPreferences.defaultQuestionCount}
                         onChange={(e) => updateSettings('testPreferences', 'defaultQuestionCount', parseInt(e.target.value))}
                         className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                      />
                   </div>

                   <div>
                      <label className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-lg border border-slate-200">
                         <div>
                            <span className="block font-medium text-slate-800">Auto-Submit on Timeout</span>
                            <span className="block text-xs text-slate-500">Automatically submit the exam when the timer reaches zero.</span>
                         </div>
                         <input 
                            type="checkbox" 
                            checked={settings.testPreferences.autoSubmit}
                            onChange={(e) => updateSettings('testPreferences', 'autoSubmit', e.target.checked)}
                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                         />
                      </label>
                   </div>
                </div>
              </div>
            )}

            {/* INTERFACE */}
            {activeTab === 'INTERFACE' && (
               <div className="p-6 sm:p-8 animate-fadeIn space-y-8">
                  <div>
                   <h2 className="text-xl font-bold text-slate-800 mb-1">Interface Settings</h2>
                   <p className="text-sm text-slate-500">Customize the look and feel of the application.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700">App Theme</label>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           onClick={() => updateSettings('interface', 'theme', 'light')}
                           className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${settings.interface.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                         >
                            <Sun className="h-6 w-6 text-orange-500" />
                            <span className="text-sm font-medium">Light Mode</span>
                         </button>
                         <button 
                           onClick={() => updateSettings('interface', 'theme', 'dark')}
                           className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${settings.interface.theme === 'dark' ? 'border-blue-500 bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50'}`}
                         >
                            <Moon className="h-6 w-6 text-indigo-300" />
                            <span className="text-sm font-medium">Dark Mode</span>
                         </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700">Language</label>
                      <select 
                         value={settings.interface.language}
                         onChange={(e) => updateSettings('interface', 'language', e.target.value)}
                         className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                      >
                         <option value="en">English (US)</option>
                         <option value="hi">Hindi</option>
                         <option value="te">Telugu</option>
                      </select>
                   </div>

                   <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700">Font Size</label>
                      <div className="flex bg-slate-100 rounded-lg p-1">
                         {['small', 'medium', 'large'].map(size => (
                            <button
                               key={size}
                               onClick={() => updateSettings('interface', 'fontSize', size)}
                               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${settings.interface.fontSize === size ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                               {size.charAt(0).toUpperCase() + size.slice(1)}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700">Sound Effects</label>
                      <button 
                         onClick={() => updateSettings('interface', 'soundEffects', !settings.interface.soundEffects)}
                         className={`w-full p-3 rounded-lg border flex items-center justify-between transition-colors ${settings.interface.soundEffects ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                      >
                         <span className="flex items-center gap-2">
                           {settings.interface.soundEffects ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                           {settings.interface.soundEffects ? 'Sound On' : 'Sound Muted'}
                         </span>
                         <span className="text-xs font-bold uppercase">{settings.interface.soundEffects ? 'Enabled' : 'Disabled'}</span>
                      </button>
                   </div>
                </div>
               </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'NOTIFICATIONS' && (
               <div className="p-6 sm:p-8 animate-fadeIn space-y-8">
                  <div>
                   <h2 className="text-xl font-bold text-slate-800 mb-1">Notifications</h2>
                   <p className="text-sm text-slate-500">Manage how we contact you.</p>
                </div>
                
                <div className="space-y-4 max-w-2xl">
                   {[
                      { key: 'dailyReminder', label: 'Daily Study Reminder', desc: 'Get reminded at 9 AM every day to study.' },
                      { key: 'achievementAlerts', label: 'Achievement Alerts', desc: 'Notify me when I unlock a new badge.' },
                      { key: 'studyStreakAlerts', label: 'Streak Alerts', desc: 'Notify me to keep my streak alive.' },
                      { key: 'emailNotifications', label: 'Email Reports', desc: 'Receive weekly progress reports via email.' },
                   ].map(item => (
                      <div key={item.key} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                         <div>
                            <h4 className="font-bold text-slate-800">{item.label}</h4>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                         </div>
                         <div className="relative inline-block w-12 mr-2 align-middle select-none">
                            <input 
                               type="checkbox" 
                               checked={(settings.notifications as any)[item.key]}
                               onChange={(e) => updateSettings('notifications', item.key, e.target.checked)}
                               className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-6"
                            />
                            <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${((settings.notifications as any)[item.key]) ? 'bg-blue-600' : 'bg-slate-300'}`}></label>
                         </div>
                      </div>
                   ))}
                </div>
                
                {/* CSS hack for toggle switch visualization since Tailwind standard form plugin isn't fully set up with custom toggle classes in the HTML head script */}
                <style>{`
                   .toggle-checkbox:checked { right: 0; border-color: #2563eb; }
                   .toggle-checkbox:checked + .toggle-label { background-color: #2563eb; }
                `}</style>
               </div>
            )}

            {/* DATA MANAGEMENT */}
            {activeTab === 'DATA' && (
               <div className="p-6 sm:p-8 animate-fadeIn space-y-8">
                  <div>
                   <h2 className="text-xl font-bold text-slate-800 mb-1">Data Management</h2>
                   <p className="text-sm text-slate-500">Control your data, exports, and account deletion.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                         <Download className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">Export Data</h4>
                      <p className="text-sm text-slate-500 mb-4">Download a copy of your test history, profile, and settings.</p>
                      <Button variant="secondary" className="w-full">Export to JSON</Button>
                   </div>

                   <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
                         <Trash2 className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">Clear History</h4>
                      <p className="text-sm text-slate-500 mb-4">Permanently delete all test records and progress.</p>
                      <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50" onClick={handleClearHistory}>Clear All History</Button>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                   <div className="p-6 bg-red-50 rounded-xl border border-red-200 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                         <h4 className="font-bold text-red-800 mb-1">Delete Account</h4>
                         <p className="text-sm text-red-600 max-w-md">Once you delete your account, there is no going back. Please be certain.</p>
                      </div>
                      <Button 
                         variant="outline" 
                         className="w-auto border-red-300 text-red-700 bg-white hover:bg-red-50"
                         onClick={() => {
                            if (confirm("DANGER: This will permanently delete your account and all local data. Continue?")) {
                               clearHistory();
                               onLogout();
                            }
                         }}
                      >
                         Delete Account
                      </Button>
                   </div>
                </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};