const THAILAND_BOUNDS = {
  north: 20.5, // Northern-most latitude
  south: 5.6, // Southern-most latitude
  east: 105.7, // Eastern-most longitude
  west: 97.3, // Western-most longitude
}

export const isPointInThailand = (latitude: number, longitude: number): boolean => {
  return (
    latitude <= THAILAND_BOUNDS.north &&
    latitude >= THAILAND_BOUNDS.south &&
    longitude <= THAILAND_BOUNDS.east &&
    longitude >= THAILAND_BOUNDS.west
  )
}

export const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180)
}

export const isPointWithinRadius = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number,
): boolean => {
  const distance = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)
  return distance <= radiusKm
}

export const validateCoordinates = (latitude: number, longitude: number): boolean => {
  if (latitude === undefined || longitude === undefined) return false
  if (isNaN(latitude) || isNaN(longitude)) return false
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false
  return true
}

export const getDefaultThailandCoordinates = () => {
  return {
    latitude: 13.7563,
    longitude: 100.5018,
  }
}

