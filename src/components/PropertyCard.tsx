import React, { useState } from 'react';
import { Property } from '../types';
import { MapPin, Phone, MessageSquare, Building2, Calendar, Droplets, Car, Shield, Ruler } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  key?: React.Key;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [showContact, setShowContact] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Format Indian Price Currency neatly in words/Lakhs/Crores if to Buy, else Month Rent
  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Humanize creation dates nicely
  const formatDate = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Sanitize and format phone to standard WhatsApp url: https://wa.me/91<10_digit_phone>
  const getWhatsAppLink = (origPhone: string, itemTitle: string) => {
    const cleanDigits = origPhone.replace(/\D/g, '');
    let finalPhone = cleanDigits;
    if (finalPhone.length === 10) {
      finalPhone = '91' + finalPhone; // Default India prefix
    }
    const txt = `Hi ${property.owner_name}, I saw your listing for "${itemTitle}" on Kakinada House Finder. I am interested and would like to talk directly about the purchase/rent. Is it still available?`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(txt)}`;
  };

  return (
    <article 
      className="bg-white rounded-2xl border border-slate-250/60 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
      id={`property-card-${property.id}`}
    >
      
      {/* Property Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900" id={`card-image-box-${property.id}`}>
        {!imgError && property.image_url ? (
          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-full object-cover transform duration-500 hover:scale-108"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => {
              setImgError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
            <Building2 className="w-10 h-10 text-indigo-400 mb-2 animate-pulse" />
            <span className="text-white font-extrabold text-xs px-2 truncate w-full tracking-tight">{property.title}</span>
            <span className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">{property.type} • {property.location}</span>
          </div>
        )}
        
        {/* Deal Badges overlays */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5" id={`card-badges-${property.id}`}>
          
          {/* Sale/Rent Acquisition badge */}
          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider text-white shadow-sm ${
            property.listing_type === 'Buy' 
              ? 'bg-rose-600' 
              : 'bg-indigo-600'
          }`}>
            For {property.listing_type === 'Buy' ? 'Sale' : 'Rent'}
          </span>

          {/* Direct Owner Free Badge */}
          <span className="text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-400 border border-slate-700/50 px-2.5 py-1 rounded-md flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-amber-400" />
            No Broker Fee
          </span>

        </div>

        {/* Location banner overlay in image bottom */}
        <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md text-white border border-slate-700/30 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>{property.location}</span>
        </div>
      </div>

      {/* Property Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between" id={`card-content-${property.id}`}>
        <div>
          
          {/* Classification Specs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5" id={`card-meta-${property.id}`}>
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium text-indigo-850 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">{property.type}</span>
            <span className="text-slate-300">•</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Listed {formatDate(property.created_at)}</span>
          </div>

          {/* Pricing Highlight */}
          <div className="mb-2.5" id={`card-price-${property.id}`}>
            {property.listing_type === 'Buy' ? (
              <p className="text-2xl font-black text-indigo-950 tracking-tight flex items-baseline">
                {formatCurrency(property.price)}
                <span className="text-xs font-normal text-slate-500 ml-2">Total Price</span>
              </p>
            ) : (
              <p className="text-2xl font-black text-indigo-950 tracking-tight flex items-baseline">
                {formatCurrency(property.rent)}
                <span className="text-xs font-normal text-slate-500 ml-1.5">/ Month Rent</span>
              </p>
            )}
          </div>

          {/* Title Header */}
          <h3 className="font-extrabold text-slate-900 text-base leading-snug mb-3 line-clamp-2 hover:text-indigo-650 transition-colors">
            {property.title}
          </h3>

          {/* Dynamic Specifications Strip */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-650 bg-slate-50/80 border border-slate-100 rounded-xl p-3 mb-4.5" id={`card-spec-grid-${property.id}`}>
            <div className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-indigo-500" />
              <span>Area: <strong className="font-bold text-slate-800">{property.sqft || 'N/A'} Sq.Ft</strong></span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Rooms: <strong className="font-bold text-slate-800">{property.bedrooms ? `${property.bedrooms} BHK` : 'N/A'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-indigo-500" />
              <span>Water: <strong className="font-bold text-slate-800">{property.water_supply === 'Both' ? 'Sweet Municipal+Bore' : property.water_supply || 'N/A'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-indigo-500" />
              <span>Parking: <strong className="font-bold text-slate-800">{property.parking ? 'Yes, Available' : 'No Parking'}</strong></span>
            </div>

            {property.building_age !== undefined && (
              <div className="flex items-center gap-1.5 col-span-2 border-t border-slate-200/50 pt-1.5 mt-1 text-[11px] text-slate-500">
                <span>Building Age: <strong className="text-slate-700 font-bold">{property.building_age === 0 ? 'Brand New' : `${property.building_age} Years Old`}</strong></span>
              </div>
            )}
          </div>

          {/* Contextual Description */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 bg-indigo-50/30 border border-indigo-100/40 p-3 rounded-xl mb-5 italic text-slate-705">
            "{property.description || 'No additional descriptive details published.'}"
          </p>

        </div>

        {/* Owner Details & Direct WhatsApp/Call */}
        <div className="border-t border-slate-100 pt-4 mt-auto flex flex-col gap-2.5">
          
          <button
            type="button"
            onClick={() => setShowContact(!showContact)}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
            id={`contact-owner-btn-${property.id}`}
          >
            <Phone className="w-4 h-4 text-white" />
            <span>{showContact ? 'Hide Contact Info' : 'Contact Owner'}</span>
          </button>

          {showContact && (
            <div 
              className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col gap-3 animate-fade-in"
              id={`contact-panel-${property.id}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Verified Owner:</span>
                <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2.2 py-0.5 rounded uppercase tracking-wide text-[10px]">
                  {property.owner_name}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Direct Line:</span>
                <span className="font-mono text-slate-700 font-bold">{property.phone}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <a
                  href={`tel:${property.phone}`}
                  className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-2.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  id={`dial-btn-${property.id}`}
                >
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Call Direct</span>
                </a>

                <a
                  href={getWhatsAppLink(property.phone, property.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2 px-2.5 rounded-lg transition-colors cursor-pointer"
                  id={`whatsapp-btn-${property.id}`}
                  style={{ backgroundColor: '#0d9488' }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Dummy broker connection service as specified in task 6 */}
              <div className="pt-2 border-t border-slate-200 text-center">
                <a 
                  href="#book-viewing-dummy" 
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Status: Connecting you with verified representative for "' + property.title + '"... (This is a working dummy link)');
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-805 hover:underline font-bold"
                  id={`tour-link-${property.id}`}
                >
                  Schedule Free Tour / Connect (Dummy Link)
                </a>
              </div>
            </div>
          )}

        </div>

      </div>
    </article>
  );
}
