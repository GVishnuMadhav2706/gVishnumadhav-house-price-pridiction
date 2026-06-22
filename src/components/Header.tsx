import React from 'react';
import { Building2, Database, HelpCircle, CheckCircle2, Search, Sparkles, PlusCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'directory' | 'predictor' | 'list';
  setActiveTab: (tab: 'directory' | 'predictor' | 'list') => void;
  config: {
    usingSupabase: boolean;
    supabaseConfigured: boolean;
    forceLocalMode: boolean;
    supabaseUrl: string | null;
    hasKey: boolean;
  };
  totalCount: number;
  onToggleDatabase: (forceLocal: boolean) => void;
}

export default function Header({ activeTab, setActiveTab, config, totalCount, onToggleDatabase }: HeaderProps) {
  const [showConfigInfo, setShowConfigInfo] = React.useState(false);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4.5 gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30 ring-2 ring-indigo-400/20" id="brand-logo">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  Kakinada House Finder
                </h1>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  No Broker
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct Owner Rentals & Sales • Zero Middlemen Commission
              </p>
            </div>
          </div>

          {/* Action Tabs & DB Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            
            {/* Quick Navigation Pills */}
            <nav className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex" id="main-nav-tabs">
              <button
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'directory'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
                id="nav-tab-directory"
              >
                <Search className="w-3.5 h-3.5" />
                <span>1. Find Homes</span>
              </button>
              
              <button
                onClick={() => setActiveTab('predictor')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'predictor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
                id="nav-tab-predictor"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>2. Price Predictor</span>
              </button>

              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
                id="nav-tab-list"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>3. List House</span>
              </button>
            </nav>

            {/* Database Badge */}
            <div 
              className="relative hidden sm:block"
              onMouseEnter={() => setShowConfigInfo(true)}
              onMouseLeave={() => setShowConfigInfo(false)}
            >
              <button
                type="button"
                onClick={() => setShowConfigInfo(!showConfigInfo)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  config.usingSupabase 
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/55 shadow-xs shadow-emerald-950' 
                    : 'bg-amber-950/40 text-amber-400 border border-amber-900/55 shadow-xs shadow-amber-950'
                }`}
                id="db-status-badge"
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${config.usingSupabase ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <Database className="w-3.5 h-3.5" />
                <span>{config.usingSupabase ? 'Supabase Active' : 'Local JSON Active'}</span>
                <HelpCircle className="w-3 h-3 text-slate-500" />
              </button>

              {showConfigInfo && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-950 text-slate-200 rounded-xl p-4 shadow-xl text-xs z-50 leading-relaxed border border-slate-800 animate-fadeIn" id="config-info-popover">
                  <h4 className="font-semibold text-sm mb-1.5 text-indigo-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4" /> Data Storage Manager
                  </h4>
                  {config.usingSupabase ? (
                    <div className="space-y-3">
                      <p>The application is connected to and writing directly to your remote Supabase cloud cluster:</p>
                      <p className="font-mono text-[10px] text-slate-400 break-all bg-slate-900 p-1.5 rounded">
                        Endpoint: {config.supabaseUrl}
                      </p>
                      <div className="pt-2 border-t border-slate-800">
                        <p className="text-slate-400 mb-2">If your cloud database limits are reached or returning 0 homes, activate local storage fallback:</p>
                        <button
                          type="button"
                          onClick={() => onToggleDatabase(true)}
                          className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-center text-xs transition-colors cursor-pointer"
                        >
                          🔒 Toggle to Force Local File Mode
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p>The application is keeping all properties saved safely inside the local server database file (<code className="bg-slate-900 text-amber-400 px-1 py-0.5 rounded">properties.json</code>) in AI Studio.</p>
                      <p className="text-emerald-400 font-medium">✨ This guarantees 100% database availability without being blocked by Supabase limits or quota restrictions!</p>
                      
                      {config.supabaseConfigured ? (
                        <div className="pt-2 border-t border-slate-800">
                          <p className="text-slate-400 mb-2">Supabase credentials are detected in your workspace! Choose to write to cloud:</p>
                          <button
                            type="button"
                            onClick={() => onToggleDatabase(false)}
                            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-center text-xs transition-colors cursor-pointer"
                          >
                            ⚡ Connect to Cloud Supabase
                          </button>
                        </div>
                      ) : (
                        <div className="border-t border-slate-800 pt-2 text-slate-400">
                          Want cloud storage? Paste the following environment keys into your AI Studio workspace Settings:
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 font-mono text-[10px]">
                            <li>SUPABASE_URL</li>
                            <li>SUPABASE_KEY</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Listings Count */}
            <div className="bg-slate-800/80 text-slate-300 px-2.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 font-mono" id="listings-stat">
              <span className="font-bold text-white text-sm mr-1">{totalCount}</span> Homes
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
