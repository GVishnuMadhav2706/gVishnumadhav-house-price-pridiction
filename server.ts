import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { INITIAL_PROPERTIES } from './src/initialData';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client if env variables are present
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

let supabase: any = null;
let isSupabaseActive = false;
let forceLocalMode = true; // Use local JSON file database by default to bypass Supabase limits and errors

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isSupabaseActive = true;
    console.log('✅ Supabase client initialized.');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
  }
} else {
  console.log('ℹ️ Supabase credentials not found in env variables. Using local file storage fallback.');
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'properties.json');

// Ensure local JSON file database exists and is seeded
async function ensureLocalData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Ignore if directory exists
  }

  try {
    await fs.access(DATA_FILE);
    // Auto-migrate or reseed if old Western mock properties or food/DNA images are present
    const dataRaw = await fs.readFile(DATA_FILE, 'utf-8');
    const existing = JSON.parse(dataRaw);
    const hasOldStructures = existing.some((p: any) => 
      p.image_url?.includes('1626808642875') || 
      p.image_url?.includes('1625813506062') ||
      p.image_url?.includes('1623659212445') ||
      p.image_url?.includes('1628624747186') ||
      p.image_url?.includes('1628595351029') ||
      p.image_url?.includes('1598257006458') ||
      p.image_url?.includes('1582268611958') ||
      p.title?.includes('Scenic 3 BHK Apartment')
    );
    if (hasOldStructures) {
      console.log('🔄 Old food, DNA, mock properties, or old image detected. Migrating database to pristine Kakinada houses...');
      const seeded = INITIAL_PROPERTIES.map((prop, idx) => ({
        ...prop,
        id: idx + 1,
        created_at: new Date(Date.now() - idx * 2 * 60 * 60 * 1000).toISOString(),
      }));
      await fs.writeFile(DATA_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    }
  } catch (err) {
    // File doesn't exist, write seed data
    const seeded = INITIAL_PROPERTIES.map((prop, idx) => ({
      ...prop,
      id: idx + 1,
      created_at: new Date(Date.now() - idx * 2 * 60 * 60 * 1000).toISOString(),
    }));
    await fs.writeFile(DATA_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    console.log('✅ Seeded local sample middle class properties successfully.');
  }
}

// Retrieve local properties
async function getLocalProperties() {
  await ensureLocalData();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

// Save a new local property
async function saveLocalProperty(prop: any) {
  await ensureLocalData();
  const list = await getLocalProperties();
  const newProp = {
    ...prop,
    id: Date.now(), // Unique ID
    created_at: new Date().toISOString(),
  };
  list.unshift(newProp); // Add newest at front
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  return newProp;
}

// Helper to retrieve and format properties from Firestore REST API
async function getFirestoreProperties(apiKey: string) {
  const url = `https://firestore.googleapis.com/v1/projects/kakinada-house-finder/databases/(default)/documents/houses?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore response error: ${response.status} - ${errorText}`);
  }
  const json = await response.json();
  if (!json.documents) {
    return [];
  }

  return json.documents.map((doc: any, index: number) => {
    const fields = doc.fields || {};
    
    // Safety helper for string fields
    const getString = (f: any) => f?.stringValue || '';
    
    // Safety helper for numeric fields
    const getNumber = (f: any) => {
      if (f?.integerValue !== undefined) return parseInt(f.integerValue, 10);
      if (f?.doubleValue !== undefined) return parseFloat(f.doubleValue);
      if (f?.stringValue !== undefined) return parseFloat(f.stringValue) || 0;
      return 0;
    };

    // Safety helper for boolean fields
    const getBoolean = (f: any) => {
      if (f?.booleanValue !== undefined) return f.booleanValue;
      if (f?.stringValue !== undefined) return f.stringValue === 'true';
      return false;
    };

    const docId = doc.name ? doc.name.split('/').pop() : `fs_${index}`;
    const rent = getNumber(fields.rent);
    const location = getString(fields.location) || 'Kakinada';
    
    return {
      id: docId,
      title: getString(fields.title) || `Charming Kakinada Property`,
      location: location,
      type: getString(fields.type) || 'Apartment',
      listing_type: rent > 0 ? 'Rent' : 'Buy',
      price: getNumber(fields.price) || (rent > 0 ? rent * 100 : 5000000),
      rent: rent,
      description: getString(fields.description) || `Fantastic house listed in ${location}. Contact owner directly.`,
      // Support both 'image' and 'image_url' as requested by user
      image_url: getString(fields.image) || getString(fields.image_url) || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      owner_name: getString(fields.owner_name) || 'Property Owner',
      phone: getString(fields.phone) || '+91 94401 23456',
      sqft: getNumber(fields.sqft) || 1200,
      bedrooms: getNumber(fields.bedrooms) || 2,
      bathrooms: getNumber(fields.bathrooms) || 2,
      building_age: getNumber(fields.building_age) || 3,
      water_supply: getString(fields.water_supply) || 'Both',
      parking: fields.parking ? getBoolean(fields.parking) : true,
      created_at: doc.createTime || new Date().toISOString()
    };
  });
}

// Helper to save property to Firestore REST API
async function saveFirestoreProperty(apiKey: string, prop: any) {
  const url = `https://firestore.googleapis.com/v1/projects/kakinada-house-finder/databases/(default)/documents/houses?key=${apiKey}`;
  
  const payload = {
    fields: {
      title: { stringValue: prop.title || '' },
      location: { stringValue: prop.location || '' },
      rent: { integerValue: String(prop.rent || 0) },
      // Support both 'image' and 'image_url' as requested by user
      image: { stringValue: prop.image_url || '' },
      image_url: { stringValue: prop.image_url || '' },
      price: { integerValue: String(prop.price || 0) },
      type: { stringValue: prop.type || 'Apartment' },
      description: { stringValue: prop.description || '' },
      owner_name: { stringValue: prop.owner_name || '' },
      phone: { stringValue: prop.phone || '' },
      sqft: { integerValue: prop.sqft ? String(prop.sqft) : '1000' },
      bedrooms: { integerValue: prop.bedrooms ? String(prop.bedrooms) : '2' },
      bathrooms: { integerValue: prop.bathrooms ? String(prop.bathrooms) : '2' },
      building_age: { integerValue: prop.building_age ? String(prop.building_age) : '2' },
      water_supply: { stringValue: prop.water_supply || 'Both' },
      parking: { booleanValue: !!prop.parking }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore creation error: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  return json;
}

// API Routes

// Express health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase: isSupabaseActive });
});

// Configuration endpoint for frontend UI awareness
app.get('/api/config', (req, res) => {
  res.json({
    usingSupabase: isSupabaseActive && !forceLocalMode,
    supabaseConfigured: !!(supabaseUrl && supabaseKey),
    forceLocalMode,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : null,
    hasKey: !!supabaseKey,
    hasFirebaseKey: !!process.env.FIREBASE_API_KEY,
    firebaseProject: 'kakinada-house-finder'
  });
});

// Endpoint to toggle force local mode
app.post('/api/toggle-database', (req, res) => {
  const { local } = req.body;
  if (local === true || local === 'true') {
    forceLocalMode = true;
  } else {
    if (isSupabaseActive) {
      forceLocalMode = false;
    } else {
      return res.status(400).json({ error: 'Supabase is not configured or failed to initialize.' });
    }
  }
  res.json({
    success: true,
    usingSupabase: isSupabaseActive && !forceLocalMode,
    forceLocalMode
  });
});

// GET /api/properties -> fetch properties (from Firestore if configured, otherwise falls back)
app.get('/api/properties', async (req, res) => {
  try {
    const firebaseApiKey = process.env.FIREBASE_API_KEY;

    if (firebaseApiKey) {
      console.log('Fetching properties from Firestore REST API...');
      try {
        const firestoreData = await getFirestoreProperties(firebaseApiKey);
        return res.json({ data: firestoreData, source: 'firebase' });
      } catch (firestoreErr: any) {
        console.warn('⚠️ Firestore fetch error, falling back to local database:', firestoreErr.message);
        const localData = await getLocalProperties();
        return res.json({ 
          data: localData, 
          source: 'local_fallback_firebase_failed', 
          error: firestoreErr.message 
        });
      }
    }

    if (isSupabaseActive && supabase && !forceLocalMode) {
      console.log('Fetching properties from Supabase...');
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Supabase fetch error, falling back to local database:', error.message);
        const localData = await getLocalProperties();
        return res.json({ data: localData, source: 'local_fallback', error: error.message });
      }

      // If the Supabase request succeeds but table is empty, we can return empty or seed locally or return local fallback
      if (!data || data.length === 0) {
        console.log('Supabase properties table is empty. Injecting local seeded properties.');
        const localData = await getLocalProperties();
        return res.json({ data: localData, source: 'local_seeded', notice: 'Supabase table was empty.' });
      }

      return res.json({ data, source: 'supabase' });
    } else {
      const data = await getLocalProperties();
      return res.json({ data, source: 'local' });
    }
  } catch (err: any) {
    console.error('Error in GET /api/properties:', err);
    try {
      const localData = await getLocalProperties();
      return res.json({ data: localData, source: 'local_fallback_on_crash', error: err.message });
    } catch (fallbackErr) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// POST /api/properties -> Add new property listing
app.post('/api/properties', async (req, res) => {
  const { 
    title, 
    location, 
    type, 
    listing_type, 
    price, 
    rent, 
    description, 
    image_url, 
    owner_name, 
    phone,
    sqft,
    bedrooms,
    bathrooms,
    building_age,
    water_supply,
    parking
  } = req.body;

  // Basic validation
  if (!title || !location || !type || !listing_type || !owner_name || !phone) {
    return res.status(400).json({ error: 'Required fields are missing: title, location, type, listing_type, owner_name, phone' });
  }

  const numericPrice = Number(price) || 0;
  const numericRent = Number(rent) || 0;

  const propertyPayload = {
    title,
    location,
    type,
    listing_type,
    price: numericPrice,
    rent: numericRent,
    description: description || '',
    image_url: image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    owner_name,
    phone,
    sqft: Number(sqft) || undefined,
    bedrooms: Number(bedrooms) || undefined,
    bathrooms: Number(bathrooms) || undefined,
    building_age: Number(building_age) || undefined,
    water_supply: water_supply || undefined,
    parking: parking === true || parking === 'true'
  };

  try {
    // Write locally first as durable back-up
    const savedLocal = await saveLocalProperty(propertyPayload);

    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (firebaseApiKey) {
      console.log('Saving property to Firestore REST API...');
      try {
        const firestoreResponse = await saveFirestoreProperty(firebaseApiKey, propertyPayload);
        const docId = firestoreResponse.name ? firestoreResponse.name.split('/').pop() : savedLocal.id;
        return res.json({
          success: true,
          data: { ...propertyPayload, id: docId },
          source: 'firebase'
        });
      } catch (firestoreErr: any) {
        console.error('⚠️ Firestore insert error, fallback to local confirmation:', firestoreErr.message);
        return res.json({
          success: true,
          data: savedLocal,
          source: 'local_only_firebase_failed',
          firebaseError: firestoreErr.message
        });
      }
    }

    if (isSupabaseActive && supabase && !forceLocalMode) {
      console.log('Inserting property into Supabase...');
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyPayload])
        .select();

      if (error) {
        console.error('⚠️ Supabase insert error:', error.message);
        // We still succeed because we stored it locally
        return res.json({
          success: true,
          data: savedLocal,
          source: 'local_only_supabase_failed',
          supabaseError: error.message
        });
      }

      return res.json({
        success: true,
        data: data ? data[0] : savedLocal,
        source: 'supabase'
      });
    } else {
      return res.json({
        success: true,
        data: savedLocal,
        source: 'local'
      });
    }
  } catch (err: any) {
    console.error('Error in POST /api/properties:', err);
    return res.status(500).json({ error: 'Failed to add listed property.' });
  }
});

// Integrations & Static Asset Serving Setup

async function startServer() {
  await ensureLocalData();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kakinada House Finder server running on http://localhost:${PORT}`);
  });
}

startServer();
