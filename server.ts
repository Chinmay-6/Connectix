import 'dotenv/config';
import express from "express";
import path from "path";
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import os from 'os';
import compression from 'compression';

// Initialize Firebase Admin safely (singleton pattern for Serverless)
if (!getApps().length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      if (privateKey.startsWith('nMII')) {
        privateKey = privateKey.substring(1);
      }
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
    }
    if (!privateKey.includes('-----END PRIVATE KEY-----')) {
      privateKey = `${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      })
    });
  } else {
    let projectId = process.env.VITE_FIREBASE_PROJECT_ID || "connectx-b614a";
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.projectId) projectId = config.projectId;
      }
    } catch (e) {
      console.error("Failed to read firebase config", e);
    }
    initializeApp({ projectId });
  }
}

const app = express();

app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '1mb' }));

const db = getFirestore();

// In-memory cache for fast response
let memoryPlacesCache: any[] | null = null;
let memoryCacheLastUpdated = 0;
const CACHE_TTL_MS = 5000;

// Local JSON fallback store path in /tmp for Vercel Serverless read/write compatibility
const dataDir = process.env.VERCEL ? os.tmpdir() : path.join(process.cwd(), 'data');
const localStorePath = path.join(dataDir, 'hotels.json');
const scanLogsPath = path.join(dataDir, 'scan_logs.json');

const readLocalHotels = (): any[] => {
  try {
    if (fs.existsSync(localStorePath)) {
      return JSON.parse(fs.readFileSync(localStorePath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading local hotels JSON:', e);
  }
  return [
    {
      id: 'QR001',
      hotelName: 'The Grand Palace Resort',
      googleReviewUrl: 'https://maps.google.com/?q=The+Grand+Palace',
      scanCount: 142,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'QR002',
      hotelName: 'Seaside Boutique Hotel',
      googleReviewUrl: 'https://maps.google.com/?q=Seaside+Boutique+Hotel',
      scanCount: 89,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];
};

const writeLocalHotels = (hotels: any[]) => {
  try {
    fs.writeFileSync(localStorePath, JSON.stringify(hotels, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local hotels JSON:', e);
  }
};

const readScanLogs = (): any[] => {
  try {
    if (fs.existsSync(scanLogsPath)) {
      return JSON.parse(fs.readFileSync(scanLogsPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading scan logs JSON:', e);
  }
  return [];
};

let dbMode: 'firestore' | 'local-fallback' = 'firestore';
let dbErrorMessage: string | null = null;
const dbModeObj = { mode: dbMode, errMsg: dbErrorMessage };

const getCachedPlaces = async (dbModeRef: { mode: 'firestore' | 'local-fallback'; errMsg: string | null }): Promise<any[]> => {
  const now = Date.now();
  if (memoryPlacesCache && (now - memoryCacheLastUpdated < CACHE_TTL_MS)) {
    return memoryPlacesCache;
  }

  let places: any[] = [];
  if (dbModeRef.mode === 'firestore') {
    try {
      const snapshot = await db.collection('hotels').get();
      places = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const pName = data.placeName || data.hotelName || 'Unnamed Place';
        const pType = data.placeType || data.type || 'Hotel';
        return {
          ...data,
          placeName: pName,
          hotelName: pName,
          placeType: pType,
          type: pType,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
        };
      });
      places.sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));
    } catch (fsErr: any) {
      console.warn('Firestore fetch failed, serving local fallback:', fsErr.message);
      dbModeRef.mode = 'local-fallback';
      dbModeRef.errMsg = fsErr.message;
      places = readLocalHotels();
    }
  } else {
    places = readLocalHotels();
  }

  memoryPlacesCache = places;
  memoryCacheLastUpdated = now;
  return places;
};

const invalidatePlacesCache = () => {
  memoryPlacesCache = null;
  memoryCacheLastUpdated = 0;
};

const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

function getLocalNetworkIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (e) {}
  return '127.0.0.1';
}

const recordScanEvent = async (qrId: string, placeName: string, placeType: string, req: express.Request) => {
  const ua = (req.headers['user-agent'] || '').toString();
  let deviceType = 'Desktop / Browser';
  if (/iPhone|iPad|iPod/i.test(ua)) deviceType = 'Mobile (iOS)';
  else if (/Android/i.test(ua)) deviceType = 'Mobile (Android)';
  else if (/Mobile|Tablet/i.test(ua)) deviceType = 'Mobile Device';

  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').toString();

  const scanLog = {
    id: `SCAN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    qrId,
    placeName,
    placeType,
    deviceType,
    ip: clientIp,
    userAgent: ua,
    timestamp: new Date().toISOString()
  };

  if (dbMode === 'firestore') {
    try {
      await db.collection('scan_events').add({
        ...scanLog,
        createdAt: FieldValue.serverTimestamp()
      });
    } catch (e) {}
  }

  const logs = readScanLogs();
  logs.unshift(scanLog);
  if (logs.length > 500) logs.pop();
  try {
    fs.writeFileSync(scanLogsPath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing scan log:', e);
  }
  return scanLog;
};

// -------------------------------------------------------------
// SYSTEM HEALTH API
// -------------------------------------------------------------
app.get('/api/system/status', async (req, res) => {
  const localIp = getLocalNetworkIp();
  const hostHeader = (req.headers.host || '').toString();
  const protocol = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http')).toString();

  let publicUrl = '';
  if (hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1')) {
    publicUrl = `${protocol}://${hostHeader}`;
  } else if (process.env.APP_URL) {
    publicUrl = process.env.APP_URL;
  } else if (process.env.VERCEL_URL) {
    publicUrl = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.RENDER_EXTERNAL_URL) {
    publicUrl = process.env.RENDER_EXTERNAL_URL;
  } else {
    publicUrl = `http://${localIp}:3000`;
  }


  res.json({
    dbMode,
    dbErrorMessage,
    localIp,
    networkScanUrl: publicUrl,
    publicUrl,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'connectx-b614a'
  });
});

const processScanData = async (qrId: string, req: express.Request): Promise<{ success: boolean; googleReviewUrl?: string; hotelName?: string; error?: string; status: number }> => {
  try {
    const places = await getCachedPlaces(dbModeObj);
    dbMode = dbModeObj.mode;
    dbErrorMessage = dbModeObj.errMsg;

    const place = places.find(h => h.id === qrId);
    if (!place) {
      return { success: false, error: 'QR Code not found', status: 404 };
    }

    place.scanCount = (place.scanCount || 0) + 1;
    const targetUrl = place.googleReviewUrl;
    const hotelName = place.placeName || place.hotelName || 'Place';
    const placeType = place.placeType || place.type || 'Hotel';

    recordScanEvent(qrId, hotelName, placeType, req).catch(console.error);

    if (dbMode === 'firestore') {
      db.collection('hotels').doc(qrId).update({ scanCount: FieldValue.increment(1) }).catch(fsErr => {
        console.warn('Firestore scan increment failed, updating local store fallback:', fsErr.message);
        dbMode = 'local-fallback';
      });
    } else {
      const localHotels = readLocalHotels();
      const idx = localHotels.findIndex(h => h.id === qrId);
      if (idx !== -1) {
        localHotels[idx].scanCount = (localHotels[idx].scanCount || 0) + 1;
        writeLocalHotels(localHotels);
      }
    }

    if (targetUrl) {
      return { success: true, googleReviewUrl: targetUrl, hotelName, status: 200 };
    }
    return { success: false, error: 'Review URL not configured for this QR Code', status: 404 };
  } catch (error: any) {
    console.error('Error handling scan:', error);
    return { success: false, error: 'Internal Server Error', status: 500 };
  }
};

app.get('/api/scan/:qrId', async (req, res) => {
  const result = await processScanData(req.params.qrId, req);
  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json({
    success: true,
    qrId: req.params.qrId,
    hotelName: result.hotelName,
    googleReviewUrl: result.googleReviewUrl
  });
});

app.get('/scan/:qrId', async (req, res) => {
  const acceptsJson = req.headers.accept?.includes('application/json');
  const result = await processScanData(req.params.qrId, req);

  if (!result.success) {
    if (acceptsJson) return res.status(result.status).json({ error: result.error });
    return res.status(result.status).send(result.error);
  }

  if (acceptsJson) {
    return res.json({
      success: true,
      qrId: req.params.qrId,
      hotelName: result.hotelName,
      googleReviewUrl: result.googleReviewUrl
    });
  }

  return res.redirect(302, result.googleReviewUrl!);
});

// -------------------------------------------------------------
// ADMIN API (Secure Area)
// -------------------------------------------------------------
const handleAddPlace = async (req: express.Request, res: express.Response) => {
  try {
    const placeName = req.body.placeName || req.body.hotelName;
    const googleReviewUrl = req.body.googleReviewUrl;
    const placeType = req.body.placeType || req.body.type || 'Hotel';

    if (!placeName || !googleReviewUrl) {
      return res.status(400).json({ error: 'Place name and Google Review URL are required' });
    }

    const hotelsList = await getCachedPlaces(dbModeObj);

    let maxNum = 0;
    hotelsList.forEach(h => {
      if (h.id && typeof h.id === 'string' && h.id.startsWith('QR')) {
        const num = parseInt(h.id.replace('QR', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const qrId = `QR${String(maxNum + 1).padStart(3, '0')}`;

    const newPlace = {
      id: qrId,
      placeName,
      hotelName: placeName,
      placeType,
      type: placeType,
      googleReviewUrl,
      scanCount: 0,
      createdAt: new Date().toISOString()
    };

    invalidatePlacesCache();

    if (dbMode === 'firestore') {
      try {
        await db.collection('hotels').doc(qrId).set({
          ...newPlace,
          createdAt: FieldValue.serverTimestamp()
        });
      } catch (fsErr: any) {
        console.warn('Firestore set failed, persisting to local store:', fsErr.message);
        dbMode = 'local-fallback';
        dbErrorMessage = fsErr.message;
        const currentLocal = readLocalHotels();
        currentLocal.unshift(newPlace);
        writeLocalHotels(currentLocal);
      }
    } else {
      const currentLocal = readLocalHotels();
      currentLocal.unshift(newPlace);
      writeLocalHotels(currentLocal);
    }

    res.status(201).json(newPlace);
  } catch (error: any) {
    console.error('Error adding place:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.post('/api/admin/places', verifyAuth, handleAddPlace);
app.post('/api/admin/hotels', verifyAuth, handleAddPlace);

const handleGetPlaces = async (req: express.Request, res: express.Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const places = await getCachedPlaces(dbModeObj);
    dbMode = dbModeObj.mode;
    dbErrorMessage = dbModeObj.errMsg;
    res.json(places);
  } catch (error: any) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.get('/api/admin/places', verifyAuth, handleGetPlaces);
app.get('/api/admin/hotels', verifyAuth, handleGetPlaces);

const handleDeletePlace = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Place ID is required' });
  }

  try {
    invalidatePlacesCache();

    if (dbMode === 'firestore') {
      try {
        await db.collection('hotels').doc(id).delete();
      } catch (fsErr: any) {
        console.warn('Firestore delete failed, updating local store fallback:', fsErr.message);
        dbMode = 'local-fallback';
        dbErrorMessage = fsErr.message;
      }
    }

    const currentLocal = readLocalHotels();
    const updatedLocal = currentLocal.filter((h: any) => h.id !== id);
    writeLocalHotels(updatedLocal);

    return res.json({ success: true, message: `Place ${id} deleted successfully`, id });
  } catch (error: any) {
    console.error('Error deleting place:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

app.delete('/api/admin/places/:id', verifyAuth, handleDeletePlace);
app.delete('/api/admin/hotels/:id', verifyAuth, handleDeletePlace);

app.get('/api/admin/analytics', verifyAuth, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const places = await getCachedPlaces(dbModeObj);
    const data = places.map(p => ({
      name: p.placeName || p.hotelName || 'Unnamed Place',
      type: p.placeType || p.type || 'Hotel',
      scans: p.scanCount || 0
    }));
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/api/admin/scan-logs', verifyAuth, async (req, res) => {
  try {
    let logs: any[] = [];
    if (dbMode === 'firestore') {
      try {
        const snapshot = await db.collection('scan_events').limit(100).get();
        logs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.timestamp || new Date().toISOString())
          };
        });
        logs.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      } catch (fsErr) {
        logs = readScanLogs();
      }
    } else {
      logs = readScanLogs();
    }

    const mobileScans = logs.filter(l => (l.deviceType || '').includes('Mobile')).length;
    const desktopScans = logs.length - mobileScans;

    res.json({
      totalScans: logs.length,
      mobileScans,
      desktopScans,
      logs
    });
  } catch (error: any) {
    console.error('Error fetching scan logs:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// For local dev running `npm run dev`
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);

  if (process.env.NODE_ENV !== "production" && !hasDist) {
    import("vite").then(async ({ createServer: createViteServer }) => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`TAPHUB SERVER READY AT http://localhost:${PORT}`);
      });
    });
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(indexHtmlPath));
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`TAPHUB PROD SERVER READY AT http://localhost:${PORT}`);
    });
  }
}

export default app;
