export type PropertyType = 'Apartment' | 'Individual House' | 'Small House';
export type ListingType = 'Buy' | 'Rent';

export interface Property {
  id: string | number;
  title: string;
  location: string;
  type: PropertyType;
  listing_type: ListingType;
  price: number; // in INR
  rent: number; // in INR per month
  description: string;
  image_url: string;
  owner_name: string;
  phone: string;
  created_at: string;
}

export const KAKINADA_LOCATIONS = [
  "Suryaraopeta",
  "Gandhinagar",
  "Jagannaickpur",
  "Ramanayyapeta",
  "Beach Road",
  "Bhanugudi Junction",
  "Indrapalem",
  "Turangi",
  "Vakalapudi",
  "APSP Area",
  "Madhavapatnam",
  "Sambamurthy Nagar",
  "Narasannapeta",
  "Sarpavaram",
  "Port Area",
  "Dairy Farm Center",
  "Venkat Nagar",
  "Balaji Cheruvu",
  "Thimmapuram",
  "Peddapuram Road"
] as const;

export type KakinadaLocation = typeof KAKINADA_LOCATIONS[number];
