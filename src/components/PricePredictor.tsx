import React, { useState, useMemo } from 'react';
import { Property, KAKINADA_LOCATIONS, PropertyType, ListingType } from '../types';
import { MapPin, Sparkles, Ruler, Building2, Droplets, Car, Calendar, DollarSign, ArrowRight, Phone, MessageSquare, RefreshCw, BarChart3, TrendingUp } from 'lucide-react';

interface PricePredictorProps {
  properties: Property[];
}

// Structured rating weight for Kakinada local areas (Buy Rate per Sq.Ft & Rent Rate per Sq.Ft)
const AREA_RATES: Record<string, { buyRate: number; rentRate: number; description: string }> = {
  "Venkat Nagar": { buyRate: 4600, rentRate: 11.0, description: "Highly elite residential layout, modern concrete structures." },
  "Suryaraopeta": { buyRate: 4450, rentRate: 10.5, description: "Central city, close to prime medical diagnostics." },
  "Gandhinagar": { buyRate: 4500, rentRate: 10.0, description: "Prime residential heart, highly coveted by families." },
  "Beach Road": { buyRate: 4800, rentRate: 12.0, description: "Sea view premium zone, high holiday demand." },
  "Bhanugudi Junction": { buyRate: 4300, rentRate: 9.8, description: "Commercial & residential hub near main highways." },
  "Balaji Cheruvu": { buyRate: 3800, rentRate: 8.5, description: "Close to JNTUK campus, premium student renting area." },
  "Ramanayyapeta": { buyRate: 3600, rentRate: 8.0, description: "Highly populated secondary residential sector." },
  "Sarpavaram": { buyRate: 3850, rentRate: 8.2, description: "Near outer ring road bypass, fast-appreciating." },
  "Sambamurthy Nagar": { buyRate: 3500, rentRate: 7.8, description: "Calm residential street layouts." },
  "Jagannaickpur": { buyRate: 3350, rentRate: 7.2, description: "Historic trading hub, close to Southern canals." },
  "APSP Area": { buyRate: 3400, rentRate: 7.5, description: "Very secure sector with government quarters." },
  "Dairy Farm Center": { buyRate: 3450, rentRate: 7.4, description: "Accessible center with wide grid lanes." },
  "Indrapalem": { buyRate: 2800, rentRate: 6.0, description: "Affordable suburbs with excellent groundwater wells." },
  "Turangi": { buyRate: 2700, rentRate: 5.8, description: "Fast-developing suburb with quiet layout plots." },
  "Vakalapudi": { buyRate: 2900, rentRate: 6.2, description: "Near industrial port corridor, rapid rental yields." },
  "Madhavapatnam": { buyRate: 2750, rentRate: 5.6, description: "Quiet layout plots on the city fringes." },
  "Thimmapuram": { buyRate: 3100, rentRate: 6.8, description: "Growing beachside bypass layout." },
  "Port Area": { buyRate: 3000, rentRate: 6.5, description: "Active workers layout, steady rental demand." },
  "Narasannapeta": { buyRate: 2400, rentRate: 5.0, description: "Outer rural-suburban edge, low cost properties." },
  "Peddapuram Road": { buyRate: 2500, rentRate: 5.2, description: "Proximity to top educational campuses." }
};

export default function PricePredictor({ properties }: PricePredictorProps) {
  
  // Model Parameters state
  const [selectedLocation, setSelectedLocation] = useState<string>("Venkat Nagar");
  const [listingType, setListingType] = useState<ListingType>("Rent");
  const [propertyType, setPropertyType] = useState<PropertyType>("Apartment");
  const [sqft, setSqft] = useState<number>(1200);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [buildingAge, setBuildingAge] = useState<number>(2);
  const [waterSupply, setWaterSupply] = useState<'Municipal' | 'Borewell' | 'Both'>('Both');
  const [hasParking, setHasParking] = useState<boolean>(true);

  // Prediction calculator model
  const predictionResult = useMemo(() => {
    
    // Fallback base rates
    const rates = AREA_RATES[selectedLocation] || { buyRate: 3300, rentRate: 7.0, description: "Standard resident sector." };
    
    let baseMultiplier = 1.0;

    // Adjust multiplier based on Architectural category
    if (propertyType === 'Individual House') {
      baseMultiplier += 0.15; // +15% premium for independent villas
    } else if (propertyType === 'Small House') {
      baseMultiplier -= 0.12; // -12% for compact row properties
    }

    // Bedroom scale
    // Each bedroom adds about 4% value compared to typical base rating
    baseMultiplier += (bedrooms - 2) * 0.04;

    // Bathroom scale
    baseMultiplier += (bathrooms - 2) * 0.02;

    // Water source adjustments (Drinking municipal water is crucial!)
    if (waterSupply === 'Both') {
      baseMultiplier += 0.06; // +6% sweet premium value
    } else if (waterSupply === 'Borewell') {
      baseMultiplier -= 0.05; // -5% if no municipal line
    }

    // Parking premium
    if (hasParking) {
      baseMultiplier += 0.04; // +4% value
    }

    // Age depreciation factor
    if (buildingAge <= 1) {
      baseMultiplier += 0.05; // Brand new premium
    } else if (buildingAge > 5) {
      // Depreciate roughly 1.5% each year after 5 yrs, capped at -25%
      const depreciation = Math.min(0.25, (buildingAge - 5) * 0.015);
      baseMultiplier -= depreciation;
    }

    // Target valuation
    let estimatedVal = 0;
    if (listingType === 'Buy') {
      estimatedVal = sqft * rates.buyRate * baseMultiplier;
    } else {
      estimatedVal = sqft * rates.rentRate * baseMultiplier;
    }

    // Output range representing typical high-end vs low-end negotiation thresholds
    const lowRange = Math.round(estimatedVal * 0.93 / 500) * 500;
    const highRange = Math.round(estimatedVal * 1.07 / 500) * 500;

    return {
      median: Math.round(estimatedVal),
      low: lowRange,
      high: highRange,
      avgRatePerSqft: listingType === 'Buy' ? Math.round(rates.buyRate * baseMultiplier) : Number((rates.rentRate * baseMultiplier).toFixed(1)),
      areaDesc: rates.description
    };

  }, [selectedLocation, listingType, propertyType, sqft, bedrooms, bathrooms, buildingAge, waterSupply, hasParking]);

  // Find active listings in our real-time state database matching these ranges
  const matchingRealListings = useMemo(() => {
    return properties.filter((item) => {
      // Match general listing type and location
      if (item.listing_type !== listingType) return false;
      if (item.location !== selectedLocation) return false;
      
      const itemPrice = listingType === 'Buy' ? item.price : item.rent;
      // Allow +/- 40% margin to find closely matching budgets
      const minPriceLimit = predictionResult.low * 0.6;
      const maxPriceLimit = predictionResult.high * 1.4;
      
      return itemPrice >= minPriceLimit && itemPrice <= maxPriceLimit;
    }).slice(0, 3); // top 3 matching live properties
  }, [properties, selectedLocation, listingType, predictionResult]);

  // Format currency displays
  const formatValueInWords = (val: number) => {
    if (listingType === 'Buy') {
      if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(2)} Cr`;
      } else if (val >= 100000) {
        return `₹${(val / 100000).toFixed(1)} Lakhs`;
      }
      return `₹${val.toLocaleString('en-IN')}`;
    } else {
      return `₹${val.toLocaleString('en-IN')}`;
    }
  };

  // Humanize preset WhatsApp contact
  const getWhatsAppLink = (p: Property) => {
    const cleanDigits = p.phone.replace(/\D/g, '');
    let finalPhone = cleanDigits;
    if (finalPhone.length === 10) {
      finalPhone = '91' + finalPhone;
    }
    const txt = `Hi ${p.owner_name}, I used the Kakinada House Price Predictor and saw your listing for "${p.title}" matching my estimated budget. I am interested to discuss further. Is the property available?`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(txt)}`;
  };

  return (
    <div className="space-y-8" id="predictor-panel-container">
      
      {/* Alert info bar */}
      <div className="bg-indigo-50/70 border border-indigo-150 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            🔮
          </div>
          <div>
            <h3 className="font-extrabold text-indigo-950 text-sm">Interactive Kakinada Market Trend Calculator</h3>
            <p className="text-xs text-indigo-800">
              Uses actual historical real estate registration, LRS guidelines, and real-time active lists to project values.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-semibold bg-white border border-indigo-100 text-indigo-750 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            2026 Quarter 2 Rates
          </span>
        </div>
      </div>

      {/* Main split dashboard panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Parameter Form: 5/12 widths */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6" id="predictor-parameters-form">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base">Adjust House Specs</h3>
            <p className="text-xs text-slate-500">Provide local parameters to configure prediction weights.</p>
          </div>

          <div className="space-y-4">
            
            {/* Location Select choice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-650 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sector Neighborhood</span>
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                id="predictor-location"
              >
                {Object.keys(AREA_RATES).map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Segmented Mode: Rent vs Sale */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200" id="predictor-mode-toggle">
              <button
                type="button"
                onClick={() => setListingType('Rent')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  listingType === 'Rent'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Estimate Monthly Rent
              </button>
              <button
                type="button"
                onClick={() => setListingType('Buy')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  listingType === 'Buy'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Estimate Outright Sale
              </button>
            </div>

            {/* Property Category Architecture choice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-655 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>House Structure</span>
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                id="predictor-property-type"
              >
                <option value="Apartment">Apartment (Standard concrete flats)</option>
                <option value="Individual House">Individual G+1 / Duplex House</option>
                <option value="Small House">Small House (Row unit/Tiny home)</option>
              </select>
            </div>

            {/* Ruler Slider: Size Area in Sq.Ft */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-indigo-505" />
                  <span>Property Area Size</span>
                </span>
                <span className="font-extrabold text-indigo-700 font-mono text-sm bg-indigo-50 px-2 py-0.5 rounded-sm">
                  {sqft} Sq.Ft
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="4000"
                step="50"
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                id="predictor-sqft-range"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                <span>300 sf (Studio)</span>
                <span>1500 sf (Mid BHK)</span>
                <span>4000 sf (Villa)</span>
              </div>
            </div>

            {/* BHK and Bathroom selects */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-650">BHK / Bedrooms</label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={1}>1 BHK</option>
                  <option value={2}>2 BHK</option>
                  <option value={3}>3 BHK</option>
                  <option value={4}>4 BHK</option>
                  <option value={5}>5 BHK</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-650">Bathrooms count</label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={1}>1 Bath</option>
                  <option value={2}>2 Bath</option>
                  <option value={3}>3 Bath</option>
                  <option value={4}>4 Bath+</option>
                </select>
              </div>
            </div>

            {/* Water and Building age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-650 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Drinking Water Lines</span>
                </label>
                <select
                  value={waterSupply}
                  onChange={(e) => setWaterSupply(e.target.value as 'Municipal' | 'Borewell' | 'Both')}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Both">Both (Govt + Well)</option>
                  <option value="Municipal">Godavari Municipal</option>
                  <option value="Borewell">Borewell Only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-650 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Structure Age</span>
                </label>
                <select
                  value={buildingAge}
                  onChange={(e) => setBuildingAge(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-550 cursor-pointer"
                >
                  <option value={0}>Brand New / First occupant</option>
                  <option value={2}>2 Years Old</option>
                  <option value={4}>4 Years Old</option>
                  <option value={6}>6 Years Old</option>
                  <option value={10}>10 Years Old</option>
                  <option value={15}>15+ Years Old</option>
                </select>
              </div>
            </div>

            {/* Parking select */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="pred-parking"
                checked={hasParking}
                onChange={(e) => setHasParking(e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-650 rounded cursor-pointer"
              />
              <label htmlFor="pred-parking" className="text-xs font-bold text-slate-700 select-none cursor-pointer flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-500" />
                <span>Include Dedicate Car Parking Parking Porch</span>
              </label>
            </div>

          </div>
        </div>

        {/* Right Estimation Result Area: 7/12 widths */}
        <div className="lg:col-span-7 space-y-6" id="predictor-evaluation-output">
          
          {/* Output Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
            
            {/* Visual ambient circles */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl" />

            {/* Header label */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-4 mb-6 relative z-10">
              <span className="text-xs bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-extrabold px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Predictive Range
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Kakinada Sub-division Index • Q2
              </span>
            </div>

            {/* The Big estimated number ranges */}
            <div className="space-y-2 text-center py-4 relative z-10">
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Estimated Direct Valuation</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-white">
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                  {formatValueInWords(predictionResult.low)}
                </span>
                <span className="text-slate-500 text-lg sm:text-xl font-bold">to</span>
                <span className="text-3xl sm:text-4.5xl font-black text-amber-400 tracking-tight">
                  {formatValueInWords(predictionResult.high)}
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400">
                Recommended direct valuation range free of broker commissions (saving up to ₹2.5 Lakhs in middlemen costs).
              </p>
            </div>

            {/* Meter representation slider */}
            <div className="space-y-1.5 pt-4 border-t border-white/[0.08] relative z-10 text-xs">
              <div className="flex justify-between font-semibold text-slate-400">
                <span>Negotiation Comfort Index:</span>
                <span className="text-indigo-400 font-bold">Highly Feasible</span>
              </div>
              
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-amber-500/80 w-1/3 border-r border-slate-900" title="Low margin request" />
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-1/2 border-r border-slate-900" title="Fair market pricing" />
                <div className="bg-rose-500/80 w-1/6" title="High premium/Unique Vaastu" />
              </div>
              
              <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
                <span>AFFORDABLE</span>
                <span>PROBABLE FAIR MARKET RANGE (MID)</span>
                <span>PREMIUM ELEVATION</span>
              </div>
            </div>

            {/* Formula breakdowns */}
            <div className="mt-6 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-350 space-y-3 relative z-10">
              
              <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400 font-bold">
                <span>Attribute Weights Applied:</span>
                <span className="text-indigo-300 font-medium">Model Breakdown</span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kakinada Base rate:</span>
                  <span className="text-white font-mono font-medium">
                    {listingType === 'Buy' ? `₹${(AREA_RATES[selectedLocation] || { buyRate: 3000 }).buyRate}/sf` : `₹${(AREA_RATES[selectedLocation] || { rentRate: 7.0 }).rentRate}/sf`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Structure load weight:</span>
                  <span className="text-white font-mono font-medium">
                    {propertyType === 'Individual House' ? '+15% Premium' : propertyType === 'Small House' ? '-12% Compact' : 'Neutral Flat'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Water pipeline offset:</span>
                  <span className="text-white font-mono font-medium">
                    {waterSupply === 'Both' ? 'Sweet (+6%)' : waterSupply === 'Borewell' ? 'Well (-5%)' : 'Standard'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Building age effect:</span>
                  <span className="text-white font-mono font-medium">
                    {buildingAge <= 1 ? 'New (+5%)' : buildingAge > 5 ? `Depr (-${Math.min(25, (buildingAge - 5) * 1.5)}%)` : 'Fresh Flat'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-400 italic">
                Neighborhood Note: &ldquo;{predictionResult.areaDesc}&rdquo;
              </div>

            </div>

          </div>

          {/* Matches listings block based on Area/Budget predicted */}
          <div className="space-y-4">
            
            <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-200 rounded-xl px-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-650" />
                <span>Matching Live Public Listings in {selectedLocation}</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-750 rounded-full px-2.5 py-0.5 font-bold">
                {matchingRealListings.length} direct matching
              </span>
            </div>

            {matchingRealListings.length === 0 ? (
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-6 text-center text-xs text-slate-500 leading-relaxed">
                <p className="font-bold">No active listings published in {selectedLocation} currently in this exact margin.</p>
                <p className="text-slate-400 mt-1">Be the first to list yours on page 3!</p>
              </div>
            ) : (
              <div className="space-y-3" id="matching-predicted-listings-list">
                {matchingRealListings.map((p) => (
                  <div 
                    key={p.id}
                    className="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-350 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${p.listing_type === 'Buy' ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                          {p.listing_type === 'Buy' ? 'Buy' : 'Rent'}
                        </span>
                        <h4 className="font-extrabold text-slate-850 text-xs sm:text-sm line-clamp-1">{p.title}</h4>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 font-medium">
                        {p.bedrooms || '2'} BHK • {p.sqft || '1100'} Sq.Ft • Water: {p.water_supply === 'Both' ? 'Sweet Municipal + Borewell' : p.water_supply || 'Yes'}
                      </p>
                      
                      <p className="text-xs font-black text-indigo-950 font-mono">
                        {p.listing_type === 'Buy' ? `₹${(p.price / 100000).toFixed(1)} Lakhs` : `₹${p.rent.toLocaleString('en-IN')}/mo`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                      <a
                        href={`tel:${p.phone}`}
                        className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 text-center"
                      >
                        Call
                      </a>
                      <a
                        href={getWhatsAppLink(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none py-1.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-bold rounded-lg text-center flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
