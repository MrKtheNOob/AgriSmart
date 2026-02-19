import type { FeatureCollection } from 'geojson';

export const fetchMoroccoRegionsGeoJSON = async (): Promise<FeatureCollection> => {
  try {
    const response = await fetch('https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MAR/ADM1/geoBoundaries-MAR-ADM1_simplified.geojson');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: FeatureCollection = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Morocco regions GeoJSON:", error);
    // Return an empty FeatureCollection or re-throw the error
    return {
      type: "FeatureCollection",
      features: [],
    };
  }
};
