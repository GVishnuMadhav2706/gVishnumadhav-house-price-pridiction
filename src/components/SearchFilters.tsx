import { KAKINADA_LOCATIONS, PropertyType, ListingType } from '../types';
import { Search, MapPin, Home, Tag, RotateCcw } from 'lucide-react';

interface SearchFiltersProps {
  selectedLocation: string;
  selectedType: string;
  selectedListingType: string;
  searchQuery: string;
  priceRange: number;
  maxPriceLimit: number;
  onLocationChange: (loc: string) => void;
  onTypeChange: (type: string) => void;
  onListingTypeChange: (listType: string) => void;
  onSearchQueryChange: (query: string) => void;
  onPriceRangeChange: (price: number) => void;
  onReset: () => void;
}

export default function SearchFilters({
  selectedLocation,
  selectedType,
  selectedListingType,
  searchQuery,
  priceRange,
  maxPriceLimit,
  onLocationChange,
  onTypeChange,
  onListingTypeChange,
  onSearchQueryChange,
  onPriceRangeChange,
  onReset,
}: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs hover:shadow-md transition-shadow mb-8" id="search-filters-card">
      <div className="flex flex-col gap-5">
        
        {/* Top Free-Text Search Bar */}
        <div className="relative" id="text-search-container">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-indigo-500" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search by keywords (e.g., 'sweet Godavari water', 'near JNTU road', 'duplex balcony', 'G+1', 'Bachelors allowed')..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            id="text-search-input"
          />
        </div>

        {/* Triple Select Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="filters-grid">
          
          {/* Location Area Dropdown */}
          <div className="flex flex-col gap-1.5" id="filter-location-col">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kakinada Neighborhood</span>
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
              id="filter-location-select"
            >
              <option value="">All Areas (Anywhere in Kakinada)</option>
              {KAKINADA_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Property Type Dropdown */}
          <div className="flex flex-col gap-1.5" id="filter-type-col">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              <span>Property Classification</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
              id="filter-type-select"
            >
              <option value="">All Property Types</option>
              <option value="Apartment">Apartment Space</option>
              <option value="Individual House">Individual House</option>
              <option value="Small House">Small / Studio House</option>
            </select>
          </div>

          {/* Listing Type (Buy / Rent) Dropdown */}
          <div className="flex flex-col gap-1.5" id="filter-listing-type-col">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Acquisition Mode</span>
            </label>
            <select
              value={selectedListingType}
              onChange={(e) => onListingTypeChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
              id="filter-listing-type-select"
            >
              <option value="">Buy or Rent (All)</option>
              <option value="Buy">For Sale / Buying</option>
              <option value="Rent">For Rent / Monthly</option>
            </select>
          </div>

          {/* Dynamic Budget Range Slider */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-3 lg:col-span-1" id="filter-budget-col">
            <div className="flex justify-between items-center gap-2">
              <label className="text-xs font-bold text-slate-600">
                Max Budget Limit
              </label>
              <span className="text-xs font-extrabold text-indigo-700 font-mono">
                {priceRange === 0 
                  ? 'No Limit' 
                  : selectedListingType === 'Rent'
                    ? `₹${(priceRange).toLocaleString('en-IN')}/mo`
                    : `₹${(priceRange / 100000).toFixed(1)} Lakhs`
                }
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="0"
                max={maxPriceLimit || 10000000}
                step={selectedListingType === 'Rent' ? 1000 : 100000}
                value={priceRange}
                onChange={(e) => onPriceRangeChange(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                id="filter-budget-range"
              />
              <button
                onClick={onReset}
                title="Reset Filters"
                className="flex items-center justify-center p-2.5 text-slate-400 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer shadow-2xs"
                id="reset-filters-btn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
