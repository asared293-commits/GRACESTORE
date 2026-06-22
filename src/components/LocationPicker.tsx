/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ASH_COORDS } from '../lib/utils';
import { Search, Navigation } from 'lucide-react';

// Fix for Leaflet default icon issues in React
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialCoords?: { lat: number, lng: number };
  storeCoords?: { lat: number, lng: number };
  autoDetect?: boolean;
}

function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function LocationPicker({ onLocationSelect, initialCoords, storeCoords, autoDetect }: LocationPickerProps) {
  const [coords, setCoords] = useState<{ lat: number, lng: number }>(initialCoords || ASH_COORDS);
  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(addr);
      setSearchInput(addr);
      onLocationSelect(lat, lng, addr);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchInputChange = async (val: string) => {
    setSearchInput(val);
    if (val.length > 3) {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(val)}&limit=5&countrycodes=gh`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setCoords({ lat, lng });
    setAddress(s.display_name);
    setSearchInput(s.display_name);
    setShowSuggestions(false);
    onLocationSelect(lat, lng, s.display_name);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    if (suggestions.length > 0) {
      selectSuggestion(suggestions[0]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(searchInput)}&limit=1&countrycodes=gh`);
      const data = await res.json();
      if (data && data.length > 0) {
        selectSuggestion(data[0]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
        setSearching(false);
      },
      () => setSearching(false)
    );
  };

  useEffect(() => {
    if (initialCoords) {
      fetchAddress(initialCoords.lat, initialCoords.lng);
    } else if (autoDetect) {
       handleGeolocation();
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    fetchAddress(lat, lng);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-2">
           <div className="relative flex-grow">
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                placeholder="Search for a location..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
           </div>
           <button 
             type="button"
             onClick={() => handleSearch()}
             disabled={searching}
             className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
             title="Search"
           >
             <Search size={18} />
           </button>
           <button 
             type="button"
             onClick={handleGeolocation}
             disabled={searching}
             className="bg-neutral-100 text-neutral-600 px-4 py-2 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
             title="Use my current location"
           >
             <Navigation size={18} className={searching ? 'animate-spin' : ''} />
           </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-50 last:border-0"
              >
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative h-64 w-full rounded-xl overflow-hidden border border-neutral-200 z-0">
        <MapContainer center={[coords.lat, coords.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[coords.lat, coords.lng]} />
          {storeCoords && (
             <Marker 
               position={[storeCoords.lat, storeCoords.lng]} 
               icon={L.divIcon({
                 className: 'bg-indigo-600 w-4 h-4 rounded-full border-2 border-white shadow-lg',
                 iconSize: [16, 16],
                 iconAnchor: [8, 8]
               })}
             />
          )}
          <MapEvents onSelect={handleLocationSelect} />
          <ChangeView center={[coords.lat, coords.lng]} />
        </MapContainer>
      </div>
      <p className="text-[10px] text-neutral-400 italic">Click on map to adjust your precise delivery location.</p>
    </div>
  );
}
