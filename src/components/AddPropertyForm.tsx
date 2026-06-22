import React, { useState } from 'react';
import { X, Building2, MapPin, Tag, Landmark, User, Phone, AlignLeft, Info, HelpCircle } from 'lucide-react';
import { KAKINADA_LOCATIONS, PropertyType, ListingType, Property } from '../types';

interface AddPropertyFormProps {
  onClose: () => void;
  onSuccess: (newProperty: Property) => void;
}

const PRESET_IMAGES = [
  {
    label: "Modern Villa",
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=150&q=80"
  },
  {
    label: "Family Duplex",
    url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=150&q=80"
  },
  {
    label: "Cozy Apartment",
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=150&q=80"
  },
  {
    label: "Charming Tiny House",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    preview: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80"
  }
];

export default function AddPropertyForm({ onClose, onSuccess }: AddPropertyFormProps) {
  
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

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Selector state for image option
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(-1);

  const handleSelectPreset = (url: string, index: number) => {
    setImageUrl(url);
    setSelectedPresetIdx(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) return setError('Please specify a title for your property listing.');
    if (!location) return setError('Please choose a valid Kakinada area.');
    if (!ownerName.trim()) return setError('Please enter the owner name.');
    if (!phone.toLocalesString && !phone.trim()) return setError('Please enter a reach-out phone number.');

    // Phone verification (should be numeric, roughly 10+ digits)
    const phoneDigitsCount = phone.replace(/\D/g, '').length;
    if (phoneDigitsCount < 10) {
      return setError('Please enter a valid 10-digit phone/WhatsApp number.');
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

    // Set fallback image if empty
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl) {
      // Pick a random preset
      finalImageUrl = PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)].url;
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
          image_url: finalImageUrl,
          owner_name: ownerName,
          phone,
        }),
      });

      const resBody = await response.json();

      if (!response.ok) {
        throw new Error(resBody.error || 'Failed to submit property listing.');
      }

      setSuccess(true);
      if (resBody.data) {
        onSuccess(resBody.data);
      }

      // Automatically reset and close after a delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="add-property-drawer-root">
      
      {/* Semi-transparent Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity animate-fadeIn" 
        onClick={onClose}
        id="drawer-backdrop"
      />

      {/* Slide-over Container */}
      <div 
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-slideLeft"
        id="drawer-surface"
      >
        
        {/* Drawer Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">List Your Property</h2>
              <p className="text-xs text-emerald-700 font-medium">Free • Direct Owner Info • No Middlemen</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            id="drawer-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5" id="listing-form">
          
          {/* Display Success Screen */}
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3" id="submit-success-indicator">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl animate-bounce">
                🎉
              </div>
              <h3 className="text-xl font-bold text-slate-800">Listed Successfully!</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Your direct-owner property is now visible to active buyers and tenants across Kakinada.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex gap-2" id="form-error-panel">
                  <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <span>Listing Headline / Title</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Spacious Duplex House near JNTU Road"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  id="form-title"
                />
              </div>

              {/* Grid Location and Property Type */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Location Select Option */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Area Location</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    id="form-location"
                  >
                    <option value="">Select Area</option>
                    {KAKINADA_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Category Select */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Property Type</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as PropertyType)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    id="form-type"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Individual House">Individual House</option>
                    <option value="Small House">Small House</option>
                  </select>
                </div>

              </div>

              {/* Listing Mode Toggle (Rent vs Buy) */}
              <div className="bg-slate-100 p-1.5 rounded-xl flex" id="listing-type-segmented">
                <button
                  type="button"
                  onClick={() => setListingType('Rent')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    listingType === 'Rent' 
                      ? 'bg-white text-emerald-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Monthly Renting
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('Buy')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    listingType === 'Buy' 
                      ? 'bg-white text-rose-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Buying / Selling
                </button>
              </div>

              {/* Dynamic Prices Block */}
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4 transition-all">
                {listingType === 'Rent' ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        Monthly Rent Cost
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">in INR per month</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="e.g., 9500"
                      value={rent}
                      onChange={(e) => setRent(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg text-slate-800 text-sm p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      id="form-rent"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Note: Try to be competitive. Zero commission means you save rent yields!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-rose-600" />
                        Full Selling Price
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">in INR</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1000"
                        placeholder="e.g., 4200000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg text-slate-800 text-sm p-2.5 w-full pr-14 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                        id="form-price"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                        {Number(price) >= 100000 ? `₹${(Number(price) / 100000).toFixed(1)} Lakhs` : 'INR'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Note: Total price of individual houses ranges ₹15L to ₹95L generally depending on LRS/Vaastu.
                    </p>
                  </div>
                )}
              </div>

              {/* Owner and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Owner Name field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Owner Full Name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., M. Prasad"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    id="form-owner"
                  />
                </div>

                {/* Phone number field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Direct Phone / WhatsApp</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9848012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    id="form-phone"
                  />
                </div>

              </div>

              {/* Descriptive fields / Reasons */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Property Details & Selling Reason</span>
                </label>
                <textarea
                  placeholder="Explain details of water connections, municipal lines, near JNTUK/Hospitals, road dimensions or reasons for selling for genuine buyers."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  id="form-description"
                />
              </div>

              {/* Select Photo presets block */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>House Cover Photo</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click a sample to speed fill</span>
                </label>

                {/* Preset Options Carousel */}
                <div className="grid grid-cols-4 gap-2" id="preset-photo-selector">
                  {PRESET_IMAGES.map((preset, index) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url, index)}
                      className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedPresetIdx === index 
                          ? 'border-emerald-600 ring-2 ring-emerald-100 scale-95 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-350 hover:scale-102'
                      }`}
                      title={preset.label}
                    >
                      <img 
                        src={preset.preview} 
                        alt={preset.label} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] py-0.5 truncate text-center">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Direct Image URL Paste Input fallback */}
                <div className="flex flex-col gap-1 mt-2">
                  <input
                    type="url"
                    placeholder="Or paste custom image link here..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setSelectedPresetIdx(-1); // Reset presets active selection indicator
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    id="form-custom-image-url"
                  />
                </div>
              </div>

              {/* Submit Action block */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition-all active:scale-98 cursor-pointer text-center disabled:opacity-50 disabled:pointer-events-none"
                  id="form-submit-btn"
                >
                  {loading ? 'Submitting Listing...' : 'Publish Property Listing'}
                </button>
              </div>

            </>
          )}

        </form>
      </div>

    </div>
  );
}
