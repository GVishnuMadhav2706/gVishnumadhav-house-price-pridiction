import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Home, 
  MessageCircle, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import Header from './components/Header';
import SearchFilters from './components/SearchFilters';
import PropertyCard from './components/PropertyCard';
import AddPropertyForm from './components/AddPropertyForm';
import { Property, KAKINADA_LOCATIONS } from './types';

export default function App() {
  // App Core States
  const [properties, setProperties] = useState<Property[]>([]);
  const [config, setConfig] = useState({
    usingSupabase: false,
    supabaseUrl: null as string | null,
    hasKey: false,
  });

  // Filters State
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedListingType, setSelectedListingType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number>(0);

  // Layout UI States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<string>('local');
  const [showSupabaseSetupGuide, setShowSupabaseSetupGuide] = useState<boolean>(false);

  // Fetch initial configs and listings from API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Load config
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      // Load properties
      const propertiesRes = await fetch('/api/properties');
      if (!propertiesRes.ok) {
        throw new Error('Failed to retrieve properties from backend api.');
      }
      const propertiesData = await propertiesRes.json();
      setProperties(propertiesData.data || []);
      setDataSources(propertiesData.source || 'local');

    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMessage(err.message || 'Failed to connect to the backend development server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Determine dynamic price range limits depending on Rent vs Buy
  const maxPriceLimit = useMemo(() => {
    if (selectedListingType === 'Rent') {
      return 25000; // Rent range ceiling ₹25,000/month
    } else {
      return 10000000; // Buy range ceiling ₹1 Crore (₹100 Lakhs)
    }
  }, [selectedListingType]);

  // Handle active Listing Type change to adjust slider margins
  const handleListingTypeChange = (val: string) => {
    setSelectedListingType(val);
    setPriceRange(0); // Reset price slider criteria on acquisition toggle to prevent filter clips
  };

  const handleResetFilters = () => {
    setSelectedLocation('');
    setSelectedType('');
    setSelectedListingType('');
    setSearchQuery('');
    setPriceRange(0);
  };

  // Callback after listing a new property
  const handlePropertyAdded = (newProperty: Property) => {
    // Insert at beginning of listings array local state
    setProperties((prev) => [newProperty, ...prev]);
  };

  // Perform multi-parameters reactive filtering
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // 1. Location Filter
      if (selectedLocation && property.location !== selectedLocation) {
        return false;
      }

      // 2. Property Type Filter
      if (selectedType && property.type !== selectedType) {
        return false;
      }

      // 3. Acquisition Listing Type Filter
      if (selectedListingType && property.listing_type !== selectedListingType) {
        return false;
      }

      // 4. Budget Slider Filter (only if active / non-zero value selected)
      if (priceRange > 0) {
        if (property.listing_type === 'Buy') {
          if (property.price > priceRange) return false;
        } else if (property.listing_type === 'Rent') {
          if (property.rent > priceRange) return false;
        }
      }

      // 5. Keyword search query lookups
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = property.title.toLowerCase().includes(query);
        const matchesDescription = property.description.toLowerCase().includes(query);
        const matchesLocation = property.location.toLowerCase().includes(query);
        const matchesOwner = property.owner_name.toLowerCase().includes(query);
        const matchesType = property.type.toLowerCase().includes(query);

        if (!matchesTitle && !matchesDescription && !matchesLocation && !matchesOwner && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [properties, selectedLocation, selectedType, selectedListingType, priceRange, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans" id="app-root">
      
      {/* Header component */}
      <Header 
        onAddPropertyClick={() => setShowAddModal(true)} 
        config={config} 
        totalCount={properties.length}
      />

      {/* Main Container Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full" id="main-content">
        
        {/* Welcome Premium Hero Section */}
        <section className="relative overflow-hidden bg-radial from-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-xl" id="hero-banner">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none select-none bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:16px_16px] hidden md:block" />
          
          <div className="max-w-2xl relative z-10 space-y-4">
            
            {/* Direct Badging */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-xs border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Broker-Free Platform</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Looking for a House in <span className="text-emerald-400 underline decoration-wavy decoration-2 underline-offset-4">Kakinada</span>?
            </h2>
            
            <p className="text-slate-350 sm:text-base leading-relaxed text-sm">
              Discover verified direct owner rentals & sales in Kakinada areas like Bhanugudi, Beach Road, Indrapalem, and Gandhinagar. Call or WhatsApp landlords immediately. No commissions, no middle-fees.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <span className="flex items-center gap-1 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Commision</span>
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Predefined Local Kakinada Areas</span>
              </span>
              <span className="flex items-center gap-1 text-slate-300 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant WhatsApp Dialing</span>
              </span>
            </div>

          </div>

          <div className="md:absolute right-6 bottom-6 sm:bottom-10 mt-6 md:mt-0 flex flex-wrap gap-2.5 z-10">
            <button
              onClick={() => setShowSupabaseSetupGuide(!showSupabaseSetupGuide)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-xs px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{showSupabaseSetupGuide ? 'Hide Setup Guide' : 'Supabase SQL Setup'}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-990/40 hover:scale-103 active:scale-97 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>List Your Property Free</span>
            </button>
          </div>
        </section>

        {/* Supabase Technical Setup SQL Guide Toggle panel */}
        {showSupabaseSetupGuide && (
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 mb-8 border border-slate-800 animate-slideDown shadow-lg space-y-4" id="tech-guide-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Interactive Supabase SQL Schema setup guide
              </h3>
              <button 
                onClick={() => setShowSupabaseSetupGuide(false)}
                className="text-xs text-slate-400 hover:text-slate-100 uppercase font-semibold cursor-pointer"
              >
                close
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If deploying this app to Production (or connecting your personal Supabase instance in AI Studio's environments), go to your <strong className="text-slate-350">Supabase Dashboard &gt; SQL Editor</strong> and run this exact database execution to initialize the properties table:
            </p>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-60 border border-slate-850">
{`-- Create table "properties" for Kakinada House Finder
CREATE TABLE IF NOT EXISTS public.properties (
  id bigint generated by default as identity primary key,
  title text not null,
  location text not null,
  type text not null,
  listing_type text not null,
  price bigint default 0,
  rent bigint default 0,
  description text,
  image_url text,
  owner_name text not null,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable select & insert permissions if you have custom RLS enabled:
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to anyone" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Allow inserts using public key" ON public.properties FOR INSERT WITH CHECK (true);`}
            </pre>
            <div className="flex items-center gap-2 bg-emerald-950/45 border border-emerald-900/30 text-emerald-300 text-[11px] p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Note:</strong> The API handles writing and seeding. Even without Supabase setup, the system works natively in <strong>Local Sandbox Mode</strong>, saving submissions directly in server cache!
              </span>
            </div>
          </div>
        )}

        {/* Core Search & Filters Bar */}
        <SearchFilters
          selectedLocation={selectedLocation}
          selectedType={selectedType}
          selectedListingType={selectedListingType}
          searchQuery={searchQuery}
          priceRange={priceRange}
          maxPriceLimit={maxPriceLimit}
          onLocationChange={setSelectedLocation}
          onTypeChange={setSelectedType}
          onListingTypeChange={handleListingTypeChange}
          onSearchQueryChange={setSearchQuery}
          onPriceRangeChange={setPriceRange}
          onReset={handleResetFilters}
        />

        {/* Listings Display Segment */}
        <div className="space-y-6" id="listings-display-root">
          
          {/* Header context labels */}
          <div className="flex items-center justify-between flex-wrap gap-2" id="results-headline-row">
            <div>
              <h3 className="font-bold text-lg text-slate-800 tracking-tight">
                {selectedLocation || 'All Kakinada'} Property Directory
              </h3>
              <p className="text-xs text-slate-500">
                Sorted by most recently listed first
              </p>
            </div>
            
            {/* Small stats summary */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100 font-medium font-mono">
              <span>Showing {filteredProperties.length} of {properties.length} matches</span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-3" id="main-loader-view">
              <Building2 className="w-10 h-10 animate-bounce text-emerald-600" />
              <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading listings from Kakinada server...</p>
            </div>
          ) : errorMessage ? (
            /* Warning / Connection Error view */
            <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200 text-center max-w-xl mx-auto space-y-4" id="con-error-view">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
              <h4 className="font-bold text-slate-800 text-lg">Server Handshake Issue</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {errorMessage}
              </p>
              <button 
                onClick={fetchData}
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Retry Connecting
              </button>
            </div>
          ) : filteredProperties.length === 0 ? (
            /* Empty matches State */
            <div className="bg-white rounded-3xl border border-slate-100 py-16 px-6 text-center max-w-xl mx-auto flex flex-col items-center" id="empty-results-view">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-xl border border-slate-100 mb-4 animate-pulse">
                🔍
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-1">No Matching Properties</h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed max-w-md">
                We couldn't find any direct listings fitting your specified criteria. Try clearing some selections or broaden your search keywords.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleResetFilters}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all border border-slate-200"
                >
                  Clear Search Filters
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-emerald-100"
                >
                  List a Custom House Here
                </button>
              </div>
            </div>
          ) : (
            /* Real Grid list */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="properties-grid">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

        </div>

      </main>

      {/* Footer Segment */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-16 border-t border-slate-800" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs space-y-4">
          <div className="flex justify-center items-center gap-1.5 text-slate-300 font-bold">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Kakinada House Finder (No Broker)</span>
          </div>
          <p className="max-w-md mx-auto text-slate-550 leading-relaxed">
            Finding apartments, independent houses, or small houses in Suryaraopeta, Indrapalem, Gandhinagar, and Beach Road shouldn't cost broker commission fees. Deal directly, contact immediately, and save lakhs.
          </p>
          <div className="border-t border-slate-800 pt-6 text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Kakinada House Finder. Built as a fully full-stack resilient applet.</p>
            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <span>Direct Link WhatsApp APIs</span>
              <span>•</span>
              <span>Auto-Seeded JSON File-Cache backed</span>
              <span>•</span>
              <span>Supabase Production Compatible</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Add Property Slide-over Form Overlay */}
      {showAddModal && (
        <AddPropertyForm
          onClose={() => setShowAddModal(false)}
          onSuccess={(prop) => {
            handlePropertyAdded(prop);
          }}
        />
      )}

    </div>
  );
}
