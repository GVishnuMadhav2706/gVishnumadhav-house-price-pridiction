import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Search,
  PlusCircle,
  HelpCircle as InfoIcon
} from 'lucide-react';
import Header from './components/Header';
import SearchFilters from './components/SearchFilters';
import PropertyCard from './components/PropertyCard';
import AddPropertyForm from './components/AddPropertyForm';
import PricePredictor from './components/PricePredictor';
import { Property, KAKINADA_LOCATIONS } from './types';

export default function App() {
  // Navigation Page States ('directory' = Page 1, 'predictor' = Page 2, 'list' = Page 3)
  const [activeTab, setActiveTab] = useState<'directory' | 'predictor' | 'list'>('directory');

  // App Core States
  const [properties, setProperties] = useState<Property[]>([]);
  const [config, setConfig] = useState({
    usingSupabase: false,
    supabaseUrl: null as string | null,
    hasKey: false,
  });

  // Filters State for Page 1 Directory
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedListingType, setSelectedListingType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number>(0);

  // Layout & Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<string>('local');
  const [showSupabaseSetupGuide, setShowSupabaseSetupGuide] = useState<boolean>(false);

  // Fetch initial configs and listings from direct API
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

  // Perform multi-parameters reactive filtering for Page 1
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

      // 5. Keyword search query lookups (enhanced with structural search values)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = property.title.toLowerCase().includes(query);
        const matchesDescription = property.description.toLowerCase().includes(query);
        const matchesLocation = property.location.toLowerCase().includes(query);
        const matchesOwner = property.owner_name.toLowerCase().includes(query);
        const matchesType = property.type.toLowerCase().includes(query);
        const matchesWater = property.water_supply && property.water_supply.toLowerCase().includes(query);
        
        let matchesBhk = false;
        if (property.bedrooms) {
          matchesBhk = `${property.bedrooms} bhk`.includes(query) || `${property.bedrooms}bhk`.includes(query);
        }

        if (!matchesTitle && !matchesDescription && !matchesLocation && !matchesOwner && !matchesType && !matchesWater && !matchesBhk) {
          return false;
        }
      }

      return true;
    });
  }, [properties, selectedLocation, selectedType, selectedListingType, priceRange, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans" id="app-root">
      
      {/* Top Header Navigation tabs container (handles switching active page) */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config} 
        totalCount={properties.length}
      />

      {/* Main content body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full" id="main-content">
        
        {/* Dynamic Page Views rendering */}

        {/* PAGE 1: Property Directory */}
        {activeTab === 'directory' && (
          <div className="space-y-8 animate-fadeIn" id="page-directory">
            
            {/* Elegant Indigo banner hero with zero green */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-lg border border-indigo-850" id="hero-banner">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-5 pointer-events-none select-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] hidden md:block" />
              
              <div className="max-w-2xl relative z-10 space-y-4">
                
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Kakinada's Premium Direct-to-Owner Gateway</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Direct Owner Houses in <span className="text-amber-400 underline decoration-wavy decoration-2 underline-offset-4">Kakinada</span>
                </h2>
                
                <p className="text-slate-300 sm:text-base leading-relaxed text-sm">
                  Find local independent G+1 villas, newly constructed flats, and family row cottages instantly. Free of broker contracts, listing fees, or commission margins. Talk directly to landlords.
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1.5">
                  <span className="flex items-center gap-1 text-indigo-200">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Pure Direct-Owner Lists</span>
                  </span>
                  <span className="flex items-center gap-1 text-indigo-200">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Real-time Contact info</span>
                  </span>
                  <span className="flex items-center gap-1 text-indigo-200">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Preloaded Kakinada Sectors</span>
                  </span>
                </div>

              </div>

              {/* Direct Quick CTA switches */}
              <div className="md:absolute right-6 bottom-6 sm:bottom-10 mt-6 md:mt-0 flex flex-wrap gap-2.5 z-10">
                <button
                  onClick={() => setShowSupabaseSetupGuide(!showSupabaseSetupGuide)}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>{showSupabaseSetupGuide ? 'Hide Technical Guide' : 'Supabase Table SQL'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('predictor')}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Try AI Price Predictor</span>
                </button>
              </div>
            </section>

            {/* Supabase SQL Setup guide block */}
            {showSupabaseSetupGuide && (
              <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 border border-slate-800 animate-slideDown shadow-lg space-y-4" id="tech-guide-panel">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-indigo-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Deploying back-end properties database in production
                  </h3>
                  <button 
                    onClick={() => setShowSupabaseSetupGuide(false)}
                    className="text-xs text-slate-400 hover:text-white uppercase font-bold cursor-pointer"
                  >
                    hide
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Run the SQL below in your Supabase project dashboard's SQL Editor window. The Node full-stack applet connects automatically when <code>SUPABASE_URL</code> is declared in the environments.
                </p>
                <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto max-h-52 border border-slate-800">
{`-- Create properties table in Supabase
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
  sqft integer,
  bedrooms integer,
  bathrooms integer,
  building_age integer,
  water_supply text,
  parking boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS permissions
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.properties FOR INSERT WITH CHECK (true);`}
                </pre>
              </div>
            )}

            {/* Multi-parameter search filters directory */}
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

            {/* Grid listing content */}
            <div className="space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                    {selectedLocation ? `${selectedLocation} Neighborhood` : 'All Kakinada Sub-divisions'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Explore direct family listings matching your requirements
                  </p>
                </div>
                
                <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-850 px-3.5 py-1.5 rounded-xl font-bold font-mono">
                  Showing {filteredProperties.length} matches (of {properties.length} total)
                </span>
              </div>

              {isLoading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center space-y-3" id="main-loader-view">
                  <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                  <p className="text-indigo-950 text-xs font-bold animate-pulse">Retrieving properties from Kakinada server cache...</p>
                </div>
              ) : errorMessage ? (
                <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200 text-center max-w-xl mx-auto space-y-4" id="con-error-view">
                  <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-lg">Server Handshake Issue</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
                  <button onClick={fetchData} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer">Retry Connecting</button>
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/60 py-16 px-6 text-center max-w-xl mx-auto flex flex-col items-center" id="empty-results-view">
                  <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-xl border border-slate-100 mb-4 animate-pulse">🔍</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1">No Matching Real Estates</h4>
                  <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed max-w-md">
                    No active property postings matched those filters. Try broad keywords (e.g. &apos;BHK&apos;, &apos;water&apos;) or clear limitations.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button onClick={handleResetFilters} className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer border border-slate-200 transition-all">Clear Filters</button>
                    <button onClick={() => setActiveTab('list')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all">Add House Listing</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="properties-grid">
                  {filteredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

        {/* PAGE 2: Price / Rent Estimator Instrument */}
        {activeTab === 'predictor' && (
          <div className="space-y-6 animate-fadeIn" id="page-predictor">
            <div className="text-center max-w-2xl mx-auto pb-4 space-y-2">
              <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-750 px-3 py-1 rounded-full font-extrabold tracking-wide uppercase inline-block">
                Predictive Analytics Panel
              </span>
              <h2 className="text-2.5xl font-black text-slate-900 tracking-tight">Kakinada House Price & Rent Predictor</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Input land square foot area, bedrooms, sweet municipal water availability, and local area coordinates to instantly forecast fair listing ranges.
              </p>
            </div>

            <PricePredictor properties={properties} />
          </div>
        )}

        {/* PAGE 3: Add Property Registration Form */}
        {activeTab === 'list' && (
          <div className="space-y-6 animate-fadeIn" id="page-add-listing">
            <div className="text-center max-w-2xl mx-auto pb-4 space-y-2">
              <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-750 px-3 py-1 rounded-full font-extrabold tracking-wide uppercase inline-block font-mono">
                Direct Registration
              </span>
              <h2 className="text-2.5xl font-black text-slate-900 tracking-tight">Register Your House For Free</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Publish details about your physical property built-up specs, age, water systems, and contact details to list directly in Kakinada.
              </p>
            </div>

            <AddPropertyForm 
              onSuccess={(prop) => {
                handlePropertyAdded(prop);
                // Return user gracefully back to main Directory to view their submitted item!
                setActiveTab('directory');
                // Scroll page smoothly to directory list header
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }} 
            />
          </div>
        )}

      </main>

      {/* Elegant dark footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs space-y-5">
          <div className="flex justify-center items-center gap-2 text-white font-bold text-sm">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <span>Kakinada House Finder (No Middlemen)</span>
          </div>
          <p className="max-w-md mx-auto text-slate-400 leading-relaxed text-xs">
            Direct owner database covering Suryaraopeta, Indrapalem, Gandhinagar, Beach Road, Bhanugudi, Sarpavaram, and surrounding suburbs. Eliminate broker fees.
          </p>
          <div className="border-t border-slate-900 pt-6 text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
            <p>© {new Date().getFullYear()} Kakinada House Finder. Built as full-stack TypeScript applet.</p>
            <div className="flex flex-wrap justify-center items-center gap-4 text-slate-500">
              <span>Direct Link WhatsApp API v3</span>
              <span>•</span>
              <span>Local Sandbox Node Persistence</span>
              <span>•</span>
              <span>Supabase Production Certified</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
