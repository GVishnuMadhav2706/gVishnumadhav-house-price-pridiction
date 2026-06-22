import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { INITIAL_PROPERTIES } from './src/initialData.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client if env variables are present
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

let supabase: any = null;
let isSupabaseActive = false;

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
  } catch (err) {
    // File doesn't exist, write seed data
    const seeded = INITIAL_PROPERTIES.map((prop, idx) => ({
      ...prop,
      id: idx + 1,
      created_at: new Date(Date.now() - idx * 2 * 60 * 60 * 1000).toISOString(),
    }));
    await fs.writeFile(DATA_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    console.log('✅ Seeded 25 local sample properties successfully.');
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

// API Routes

// Express health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase: isSupabaseActive });
});

// Configuration endpoint for frontend UI awareness
app.get('/api/config', (req, res) => {
  res.json({
    usingSupabase: isSupabaseActive,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : null,
    hasKey: !!supabaseKey
  });
});

// GET /api/properties -> fetch properties (from Supabase if configured, fallback to local)
app.get('/api/properties', async (req, res) => {
  try {
    if (isSupabaseActive && supabase) {
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

    if (isSupabaseActive && supabase) {
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
