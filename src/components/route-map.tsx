"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap } from "leaflet"

interface MapLocation {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

interface RouteMapProps {
  locations: MapLocation[]
  selectedLocationIds: string[]
  locationUrgency?: Record<string, string>
  hoveredLocationId?: string | null
  onLocationClick: (locationId: string) => void
}

function pinIcon(color: string, size: "normal" | "large" = "normal") {
  const w = size === "large" ? 36 : 28
  const h = size === "large" ? 46 : 36
  const cx = w / 2
  const r = size === "large" ? 6 : 5
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <path d="M${cx} 0C${cx * 0.448} 0 0 ${cx * 0.448} 0 ${cx}c0 ${cx * 0.687} ${cx} ${h - cx} ${cx} ${h - cx}S${w} ${cx + cx * 0.687} ${w} ${cx}C${w} ${cx * 0.448} ${w - cx * 0.448} 0 ${cx} 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="white"/>
  </svg>`
}

function pinColor(isSelected: boolean, urgency?: string) {
  if (isSelected) return "#22c55e"
  if (urgency === "critical") return "#ef4444"
  if (urgency === "moderate") return "#f97316"
  return "#3b82f6"
}

export default function RouteMap({
  locations,
  selectedLocationIds,
  locationUrgency = {},
  hoveredLocationId,
  onLocationClick,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const prevLocationIdsRef = useRef<string>("")

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setTimeout(() => { map.invalidateSize() }, 100)

      const locs = locations.filter((l) => l.latitude && l.longitude)
      if (locs.length === 1) {
        map.setView([locs[0].latitude, locs[0].longitude], 13)
      } else if (locs.length > 1) {
        const bounds = L.latLngBounds(locs.map((l) => [l.latitude, l.longitude]))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
      } else {
        map.setView([39.5, -98.35], 4)
      }

      locs.forEach((loc) => {
        addMarker(L, map, loc, selectedLocationIds.includes(loc.id), locationUrgency[loc.id])
      })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current.clear()
      }
    }
  }, [])

  // Update markers when selection or locations change
  useEffect(() => {
    if (!mapRef.current) return

    import("leaflet").then((L) => {
      if (!mapRef.current) return
      const map = mapRef.current

      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()

      const locs = locations.filter((l) => l.latitude && l.longitude)
      locs.forEach((loc) => {
        addMarker(L, map, loc, selectedLocationIds.includes(loc.id), locationUrgency[loc.id])
      })

      const locationKey = locs.map((l) => l.id).join(",")
      if (locationKey !== prevLocationIdsRef.current && locs.length > 0) {
        prevLocationIdsRef.current = locationKey
        if (locs.length === 1) {
          map.setView([locs[0].latitude, locs[0].longitude], 13)
        } else {
          const bounds = L.latLngBounds(locs.map((l) => [l.latitude, l.longitude]))
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
        }
      }
    })
  }, [locations, selectedLocationIds])

  // Update pin size and popup when hovered location changes
  useEffect(() => {
    if (!mapRef.current) return

    import("leaflet").then((L) => {
      markersRef.current.forEach((marker, locId) => {
        const isSelected = selectedLocationIds.includes(locId)
        const urgency = locationUrgency[locId]
        const color = pinColor(isSelected, urgency)
        const isHovered = locId === hoveredLocationId

        marker.setIcon(
          L.divIcon({
            html: pinIcon(color, isHovered ? "large" : "normal"),
            className: "",
            iconSize: isHovered ? [36, 46] : [28, 36],
            iconAnchor: isHovered ? [18, 46] : [14, 36],
            popupAnchor: [0, -48],
          })
        )

        if (isHovered) {
          marker.openPopup()
        } else {
          marker.closePopup()
        }
      })
    })
  }, [hoveredLocationId])

  function addMarker(L: any, map: LeafletMap, loc: MapLocation, isSelected: boolean, urgency?: string) {
    const color = pinColor(isSelected, urgency)
    const icon = L.divIcon({
      html: pinIcon(color),
      className: "",
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -38],
    })

    const marker = L.marker([loc.latitude, loc.longitude], { icon })
      .addTo(map)
      .bindPopup(
        `<div style="min-width:140px">
          <div style="font-weight:600;font-size:13px">${loc.name}</div>
          <div style="font-size:11px;color:#666;margin-top:2px">${loc.address}</div>
          <div style="margin-top:8px;font-size:12px;color:${isSelected ? "#16a34a" : "#2563eb"};font-weight:500">
            ${isSelected ? "✓ On route — click to remove" : "Click to add to route"}
          </div>
        </div>`,
        { closeButton: false }
      )

    marker.on("click", () => {
      onLocationClick(loc.id)
    })

    markersRef.current.set(loc.id, marker)
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 400 }} className="rounded-lg" />
      {locations.filter((l) => l.latitude && l.longitude).length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 rounded-lg text-center px-6">
          <p className="text-sm font-medium">No locations with map coordinates</p>
          <p className="text-xs text-muted-foreground mt-1">
            Edit locations and enable "Show on map" to add pins
          </p>
        </div>
      )}
    </div>
  )
}
