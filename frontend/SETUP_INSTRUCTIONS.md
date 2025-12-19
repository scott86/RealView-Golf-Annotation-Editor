# Google Maps Setup Instructions

## 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install `@react-google-maps/api` which was added to package.json.

## 2. Get Your Google Maps API Key

If you don't have one yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required)
   - **Geocoding API** (optional, for address search)
   - **Places API** (optional, for location search)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### Secure Your API Key (Important!)

1. Click on your API key to edit it
2. Under **Application restrictions**, select "HTTP referrers (web sites)"
3. Add these referrers:
   - `http://localhost:3000/*`
   - `http://localhost:5173/*` (Vite default)
   - Your production domain when ready
4. Under **API restrictions**, select "Restrict key" and choose only the APIs you enabled

## 3. Add API Key to Environment Variables

Create a `.env` file in the `frontend` folder:

```bash
cd frontend
# On Windows PowerShell:
New-Item .env

# Or manually create the file
```

Add this line to `frontend/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important Notes:**
- Replace `your_actual_api_key_here` with your actual Google Maps API key
- The prefix `VITE_` is required for Vite to expose the variable to the browser
- Never commit your `.env` file to version control (it's already in `.gitignore`)

## 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` and click the "🗺️ Open Map View" button!

## 5. Features Included

- ✅ Satellite imagery base layer (Google Maps)
- ✅ Map type controls (Roadmap, Satellite, Hybrid, Terrain)
- ✅ Street View control
- ✅ Zoom controls
- ✅ Fullscreen control
- ✅ Current coordinates and zoom level display
- ✅ Smooth navigation (pan, zoom, rotate)

## Troubleshooting

### "Google Maps API Key Missing" Error

- Make sure your `.env` file is in the `frontend` folder
- Verify the variable name is exactly `VITE_GOOGLE_MAPS_API_KEY`
- Restart the dev server after creating/modifying `.env`

### Map Shows "For development purposes only" Watermark

- You need to enable billing in Google Cloud Console
- Don't worry - Google provides $200/month free credit
- Most development usage stays well within the free tier

### Map Doesn't Load

- Check browser console for errors
- Verify you enabled "Maps JavaScript API" in Google Cloud Console
- Check if your API key has the correct restrictions

## Next Steps

You can customize the map in `frontend/src/components/MapView.tsx`:

- Change initial location (default is NYC)
- Add markers, polygons, polylines
- Add custom controls
- Integrate with your backend API for location data

Example locations to try:
```typescript
// San Francisco
initialCenter={{ lat: 37.7749, lng: -122.4194 }}

// London
initialCenter={{ lat: 51.5074, lng: -0.1278 }}

// Tokyo
initialCenter={{ lat: 35.6762, lng: 139.6503 }}
```

