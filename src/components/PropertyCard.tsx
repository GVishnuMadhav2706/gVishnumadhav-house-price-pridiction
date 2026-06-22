import React from 'react';
import { Property } from '../types';
import { MapPin, Phone, MessageSquare, Building, Calendar, DollarSign, Sparkles } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  key?: React.Key;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  
  // Format Indian Price Currency neatly in words/Lakhs/Crores if to Buy, else Month Rent
  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Crore`;
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
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
      id={`property-card-${property.id}`}
    >
      
      {/* Property Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100" id={`card-image-box-${property.id}`}>
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-full object-cover transform duration-500 hover:scale-108"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
            // Safe fallback image if Unsplash fails
            e.currentTarget.src = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
          }}
        />
        
        {/* Deal Badges overlays */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5" id={`card-badges-${property.id}`}>
          
          {/* Sale/Rent Acquisition badge */}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            property.listing_type === 'Buy' 
              ? 'bg-rose-500 text-white shadow-xs' 
              : 'bg-emerald-500 text-white shadow-xs'
          }`}>
            For {property.listing_type === 'Buy' ? 'Sale' : 'Rent'}
          </span>

          {/* Direct Owner Free Badge */}
          <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            No Broker
          </span>

        </div>

        {/* Location banner overlay in image bottom */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>{property.location}</span>
        </div>
      </div>

      {/* Property Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between" id={`card-content-${property.id}`}>
        <div>
          
          {/* Classification Specs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2" id={`card-meta-${property.id}`}>
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>{property.type}</span>
            <span className="text-slate-300">•</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Listed {formatDate(property.created_at)}</span>
          </div>

          {/* Pricing Highlight */}
          <div className="mb-2" id={`card-price-${property.id}`}>
            {property.listing_type === 'Buy' ? (
              <p className="text-xl font-extrabold text-slate-900 tracking-tight flex items-baseline">
                {formatCurrency(property.price)}
                <span className="text-xs font-normal text-slate-500 ml-1.5">Direct Price</span>
              </p>
            ) : (
              <p className="text-xl font-extrabold text-emerald-700 tracking-tight flex items-baseline">
                {formatCurrency(property.rent)}
                <span className="text-xs font-normal text-slate-500 ml-1">/ Month</span>
              </p>
            )}
          </div>

          {/* Title Header */}
          <h3 className="font-bold text-slate-800 text-base leading-snug mb-2 line-clamp-2 hover:text-emerald-700 transition-colors">
            {property.title}
          </h3>

          {/* Reason / Contextual Description */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 bg-slate-50 border border-slate-100 p-2.5 rounded-lg mb-4 italic">
            "{property.description || 'No descriptive details available yet.'}"
          </p>

        </div>

        {/* Owner Details & Direct Dialers */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          
          {/* Direct Owner Name Display */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-500 font-medium">Owner Details:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-sm">
              {property.owner_name}
            </span>
          </div>

          {/* Communication Links Group */}
          <div className="grid grid-cols-2 gap-2" id={`owner-callout-${property.id}`}>
            
            {/* Standard Call Button */}
            <a
              href={`tel:${property.phone}`}
              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
              id={`dial-btn-${property.id}`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Owner</span>
            </a>

            {/* Direct WhatsApp Message Tunnel */}
            <a
              href={getWhatsAppLink(property.phone, property.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
              id={`whatsapp-btn-${property.id}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

          </div>

        </div>

      </div>
    </article>
  );
}
