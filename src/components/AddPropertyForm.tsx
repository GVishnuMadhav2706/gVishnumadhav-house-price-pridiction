import React, { useState } from 'react';
import { Building2, MapPin, Tag, Landmark, User, Phone, AlignLeft, Info, HelpCircle, CheckCircle2, Ruler, Droplets, Car, Calendar, Sparkles, Upload, Image, X } from 'lucide-react';
import { KAKINADA_LOCATIONS, PropertyType, ListingType, Property } from '../types';

interface AddPropertyFormProps {
  onSuccess: (newProperty: Property) => void;
}

const PRESET_IMAGES = [
  {
    label: "G+1 Indian Villa",
    url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=150&q=80"
  },
  {
    label: "Modern G+1 Villa",
    url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=150&q=80"
  },
  {
    label: "Indian Flat Block",
    url: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=150&q=80"
  },
  {
    label: "Direct Brick House",
    url: "https://images.unsplash.com/photo-1626808642875-0aa545452faa?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1626808642875-0aa545452faa?auto=format&fit=crop&w=150&q=80"
  }
];

export default function AddPropertyForm({ onSuccess }: AddPropertyFormProps) {
  
  // Field States
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState<string>('');
  const [type, setType] = useState<PropertyType>('Apartment');
  const [listingType, setListingType] = useState<ListingType>('Rent');
  const [price, setPrice] = useState('');
  const [rent, setRent] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Additional Detail States (Filling options requested!)
  const [sqft, setSqft] = useState('1100');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [buildingAge, setBuildingAge] = useState('2');
  const [waterSupply, setWaterSupply] = useState<'Municipal' | 'Borewell' | 'Both'>('Both');
  const [parking, setParking] = useState(true);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Selector state for image option
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  React.useEffect(() => {
    // default set first preset as base
    if (!imageUrl) {
      setImageUrl(PRESET_IMAGES[0].url);
    }
  }, []);

  const handleSelectPreset = (url: string, index: number) => {
    setImageUrl(url);
    setSelectedPresetIdx(index);
    setUploadedFileName(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Selected image size is too large. Please select an image under 10MB to upload successfully.");
        return;
      }
      setUploadedFileName(file.name);
      setSelectedPresetIdx(-1);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
      };
      reader.onerror = () => {
        setError("Failed to read local photo. Please try a different photo or copy-paste an image link.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please drop a valid image file (PNG, JPG, JPEG, WEBP) only.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Selected image size is too large. Please select an image under 10MB to upload successfully.");
        return;
      }
      setUploadedFileName(file.name);
      setSelectedPresetIdx(-1);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
      };
      reader.onerror = () => {
        setError("Failed to read local photo. Please try a different photo or copy-paste an image link.");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerRemoveUpload = () => {
    setUploadedFileName(null);
    setSelectedPresetIdx(0);
    setImageUrl(PRESET_IMAGES[0].url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) return setError('Please specify a title/headline for your property.');
    if (!location) return setError('Please choose a valid Kakinada neighborhood.');
    if (!ownerName.trim()) return setError('Please enter the owner/contact person name.');
    if (!phone.trim()) return setError('Please enter a reach-out contact phone number.');

    const phoneDigitsCount = phone.replace(/\D/g, '').length;
    if (phoneDigitsCount < 10) {
      return setError('Please enter a valid 10-digit Indian mobile or WhatsApp number.');
    }

    if (Number(sqft) <= 100) {
      return setError('Square footage should be a realistic building area (minimum 100 sq.ft).');
    }

    // Capture financial stats depending on Rent vs Buy
    let payloadPrice = 0;
    let payloadRent = 0;

    if (listingType === 'Buy') {
      const p = Number(price);
      if (!p || p <= 1000) return setError('Please enter an accurate sale price (minimum ₹1,000).');
      payloadPrice = p;
    } else {
      const r = Number(rent);
      if (!r || r <= 100) return setError('Please enter an accurate monthly rent (minimum ₹100).');
      payloadRent = r;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          location,
          type,
          listing_type: listingType,
          price: payloadPrice,
          rent: payloadRent,
          description,
          image_url: imageUrl,
          owner_name: ownerName,
          phone,
          sqft: Number(sqft),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          building_age: Number(buildingAge),
          water_supply: waterSupply,
          parking: parking
        }),
      });

      const resBody = await response.json();

      if (!response.ok) {
        throw new Error(resBody.error || 'Failed to publish your property listing.');
      }

      setSuccess(true);
      if (resBody.data) {
        onSuccess(resBody.data);
      }

      // Reset form variables
      setTitle('');
      setPrice('');
      setRent('');
      setDescription('');
      setOwnerName('');
      setPhone('');
      
      // Auto success banner duration reset
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      setError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="add-property-full-page">
      
      {/* Side guidance card / Instructions */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-800">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <h3 className="text-lg font-black tracking-tight mb-2">Direct Listing Portal</h3>
          <p className="text-xs text-indigo-200/90 leading-relaxed mb-6">
            List your rental or sale property for absolutely free. Buyers and tenants will call you directly on WhatsApp or Call. No third-party brokers, no commissions, no hidden service charges!
          </p>

          <div className="space-y-4 border-t border-indigo-800/60 pt-5 text-xs">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>How To List Successfully?</span>
            </h4>
            <ul className="space-y-3 text-indigo-150 list-none">
              <li className="flex gap-2">
                <span className="text-amber-400 font-extrabold font-mono shrink-0">1.</span>
                <span>Select accurate residential details (sq.ft, sweet Godavari water connection, parking structure).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-extrabold font-mono shrink-0">2.</span>
                <span>Upload a clean, bright front facade photo or choose one of our highly typical Indian G+1 / Apartment presets.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-extrabold font-mono shrink-0">3.</span>
                <span>Ensure your WhatsApp number matches your phone so users can easily start chats.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Local Advantage note */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 text-xs text-stone-700 space-y-2">
          <h4 className="font-bold text-amber-850 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Kakinada Municipal Regulations</span>
          </h4>
          <p className="leading-relaxed">
            In prime regions (Venkat Nagar, Suryaraopeta, Gandhinagar), properties having <strong>dual sweet water lines</strong> (Municipal and Borewell) enjoy up to 10% premium on rents and sell faster. Make sure to specify this accurately!
          </p>
        </div>
      </div>

      {/* Main Form workspace */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs" id="form-container-panel">
        
        <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enter Your Property Specifications</h2>
            <p className="text-xs text-slate-500">Provide direct details to publish in our public directory.</p>
          </div>
          <span className="text-xs bg-slate-100 font-semibold px-2.5 py-1 text-slate-600 rounded-full">
            No Verification Wait
          </span>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-250 text-emerald-900 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-3.5" id="form-success-banner">
            <div className="w-12 h-12 bg-emerald-600 rounded-full text-white flex items-center justify-center text-xl shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-emerald-950">Property Published Successfully!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your direct listing is now live, stored in the master database, and visible instantly in "Find Homes".
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-4 mb-6 flex gap-2" id="form-error-banner">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="house-submit-form">
          
          {/* Section 1: Core Description */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">1. Core Information</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Property Headline / Title</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., G+1 Independent 3 BHK House with sweet water"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                id="listing-title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Kakinada Sector Location</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  id="listing-location"
                >
                  <option value="">Select Neighborhood Area</option>
                  {KAKINADA_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Property Architectural Category</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PropertyType)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  id="listing-type"
                >
                  <option value="Apartment">Apartment (Flat block)</option>
                  <option value="Individual House">Individual House (G+1/G+2 Villa)</option>
                  <option value="Small House">Small House (Row cottage/Studio)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 2: Pricing & Mode */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">2. Pricing Model</h3>
            
            <div className="bg-slate-50 p-1.5 rounded-xl flex border border-slate-200/80" id="segmented-pricing">
              <button
                type="button"
                onClick={() => setListingType('Rent')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  listingType === 'Rent' 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Renting (Monthly Rent Payment)
              </button>
              <button
                type="button"
                onClick={() => setListingType('Buy')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  listingType === 'Buy' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Buy Out / Direct Outright Sale
              </button>
            </div>

            <div className="bg-indigo-50/20 rounded-2xl border border-indigo-100/40 p-4.5">
              {listingType === 'Rent' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      Expected Rent (Per Month)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">in INR</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold block">₹</span>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="e.g., 11000"
                      value={rent}
                      onChange={(e) => setRent(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl text-slate-800 text-sm p-3 pl-8 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      id="listing-rent-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-rose-600" />
                      Expected Selling Amount
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">in INR</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold block">₹</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      placeholder="e.g., 4500000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl text-slate-800 text-sm p-3 pl-8 pr-20 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      id="listing-price-input"
                    />
                    <span className="absolute right-3.5 top-3 text-xs text-indigo-700 font-black pointer-events-none">
                      {Number(price) >= 100000 ? `₹${(Number(price) / 100000).toFixed(1)} Lakhs` : 'INR'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Comprehensive Structural Specs (Basic Details filling options requested!) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
              3. Structural Dimensions & Utilities (Basic Details Options)
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Sqft. Area */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-slate-400" />
                  <span>Area (Sq.Ft)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 1200"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  id="listing-sqft"
                />
              </div>

              {/* Bedrooms count */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>BHK / Bedrooms</span>
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  id="listing-bedrooms"
                >
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK (Most Common)</option>
                  <option value="3">3 BHK (Premium)</option>
                  <option value="4">4 BHK (Duplex)</option>
                  <option value="5">5 BHK+ (Villas)</option>
                </select>
              </div>

              {/* Bathrooms count */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bathrooms</span>
                </label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  id="listing-bathrooms"
                >
                  <option value="1">1 Bathroom</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="3">3 Bathrooms</option>
                  <option value="4">4 Bathrooms+</option>
                </select>
              </div>

              {/* Building age */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Building Age (Yrs)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={buildingAge}
                  onChange={(e) => setBuildingAge(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  id="listing-age"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Water Supply */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Water Supply Type</span>
                </label>
                <select
                  value={waterSupply}
                  onChange={(e) => setWaterSupply(e.target.value as 'Municipal' | 'Borewell' | 'Both')}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  id="listing-water"
                >
                  <option value="Both">Both Municipal (Sweet Godavari) & Borewell</option>
                  <option value="Municipal animate-pulse">Municipal Sweet Connection Only</option>
                  <option value="Borewell">Borewell Only (Ground Water)</option>
                </select>
              </div>

              {/* Parking Selection checkbox */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-5 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  id="listing-parking"
                  checked={parking}
                  onChange={(e) => setParking(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="listing-parking" className="text-xs font-extrabold text-slate-700 select-none cursor-pointer flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-indigo-500" />
                  <span>Dedicated Vehicle Car/Bike Parking Porch</span>
                </label>
              </div>

            </div>
          </div>

          {/* Section 4: Owner Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">4. Contact & Ownership Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1_5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Owner's Full Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., M. Venkata Ramana Raju"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  id="listing-owner-name"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Direct Mobile Number</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g., 9848012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  id="listing-phone"
                />
              </div>

            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Description & Particular Amenities</span>
              </label>
              <textarea
                placeholder="Give descriptive particulars (e.g. Near Bhanugudi flyover, continuous sweet drinking Godavari pipelines, marble floorings, G+1 floor configuration details)..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                id="listing-description"
              />
            </div>
          </div>

          {/* Section 5: Cover Photo Elevation with Local Folder Upload */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-600" />
                <span>5. Property Cover Photo</span>
                <span className="text-rose-500">*</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Upload a real photo of the house from your computer/mobile folders, select one of our premium Indian home templates, or paste a web address.
              </p>
            </div>

            {/* Folder Image Uploader Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative overflow-hidden flex flex-col items-center justify-center gap-3 ${
                dragActive 
                  ? 'border-indigo-600 bg-indigo-50/70 scale-99' 
                  : uploadedFileName 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-50/50'
              }`}
              id="file-uploader-dragzone"
            >
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                id="folder-image-picker"
                title="Select a photo of the house from a folder"
              />

              {imageUrl && imageUrl.startsWith('data:image/') ? (
                // Base64 File Preview Card
                <div className="flex flex-col items-center gap-2 w-full max-w-xs relative z-20">
                  <div className="relative w-32 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden border border-emerald-300 shadow-sm">
                    <img 
                      src={imageUrl} 
                      alt="Local Upload Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        triggerRemoveUpload();
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer z-35"
                      title="Remove custom photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-emerald-600 truncate max-w-xs">{uploadedFileName || 'Custom Photo Connected'}</p>
                    <p className="text-[10px] text-slate-400">Successfully read & ready to publish!</p>
                  </div>
                </div>
              ) : (
                // Folder Pick Placeholder
                <div className="py-2 flex flex-col items-center gap-1.5 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs mb-1">
                    <Upload className="w-5 h-5 animate-bounce" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    <span className="text-indigo-600 hover:underline">Click to browse folders</span> or drag & drop photo here
                  </p>
                  <p className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG, WEBP files up to 10MB</p>
                </div>
              )}
            </div>

            {/* Presets Separator Line */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or Use High Quality Indian Templates</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* High Quality Indian Templates Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="image-preset-selectors">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url, idx)}
                  className={`relative aspect-video sm:aspect-square border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                    selectedPresetIdx === idx 
                      ? 'border-indigo-600 ring-4 ring-indigo-100 scale-98 font-bold' 
                      : 'border-slate-200 hover:border-slate-300 hover:scale-102'
                  }`}
                >
                  <img src={preset.preview} alt={preset.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[9px] py-1 truncate text-center font-semibold">
                    {preset.label}
                  </span>
                  {selectedPresetIdx === idx && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom URL pasting zone */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500">Or copy-paste any direct web image URL address:</label>
              <input
                type="url"
                placeholder="e.g., https://my-image-site.com/house-front.jpg"
                value={imageUrl && !imageUrl.startsWith('data:image/') ? imageUrl : ''}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setSelectedPresetIdx(-1);
                  setUploadedFileName(null);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                id="listing-image-url"
              />
            </div>
          </div>

          {/* Action Trigger Submit */}
          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm shadow-md hover:shadow-lg transition-all active:scale-99 cursor-pointer text-center disabled:opacity-50 disabled:pointer-events-none tracking-wide"
              id="submit-property-btn"
            >
              {loading ? 'Registering details...' : 'Publish Direct Owner Listing Now'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
