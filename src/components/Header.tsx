import React from 'react';
import { Building2, PlusCircle, Database, HelpCircle, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onAddPropertyClick: () => void;
  config: {
    usingSupabase: boolean;
    supabaseUrl: string | null;
    hasKey: boolean;
  };
  totalCount: number;
}

export default function Header({ onAddPropertyClick, config, totalCount }: HeaderProps) {
  const [showConfigInfo, setShowConfigInfo] = React.useState(false);

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-100" id="brand-logo">
              <Building2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Kakinada House Finder
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full inline-block">
                  No Broker
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Direct Owner-to-Buyer/Tenant Property Portal • Zero Brokerage
              </p>
            </div>
          </div>

          {/* Database Setup & Actions */}
          <div className="flex items-center flex-wrap gap-3 md:justify-end">
            
            {/* Database Badge */}
            <div 
              className="relative"
              onMouseEnter={() => setShowConfigInfo(true)}
              onMouseLeave={() => setShowConfigInfo(false)}
            >
              <button
                type="button"
                onClick={() => setShowConfigInfo(!showConfigInfo)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  config.usingSupabase 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
                id="db-status-badge"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{config.usingSupabase ? 'Supabase Connected' : 'Local Sandbox Mode'}</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </button>

              {showConfigInfo && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 text-white rounded-xl p-4 shadow-xl text-xs z-50 leading-relaxed border border-slate-800 animate-fadeIn" id="config-info-popover">
                  <h4 className="font-semibold text-sm mb-1.5 text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Database Connectivity
                  </h4>
                  {config.usingSupabase ? (
                    <div className="space-y-2">
                      <p>The application is successfully writing to and reading from your live production Supabase cluster.</p>
                      <p className="font-mono text-[10px] text-slate-300 break-all bg-slate-800 p-1.5 rounded">
                        Endpoint: {config.supabaseUrl}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>The application is currently saving listings permanently in a local server file (<code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded">properties.json</code>) in AI Studio.</p>
                      <div className="border-t border-slate-800 pt-2 text-slate-300">
                        To activate Supabase, insert your secrets in the AI Studio environment:
                        <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                          <li>SUPABASE_URL</li>
                          <li>SUPABASE_KEY</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Listings Count */}
            <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200" id="listings-stat">
              <span className="font-bold text-slate-800 text-sm mr-1">{totalCount}</span> Listings
            </div>

            {/* List Property CTA */}
            <button
              onClick={onAddPropertyClick}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              id="list-property-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your Property</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
