# Senegal Agroecological Zones

The accompanying `senegal_agroecological_zones.geojson` contains six broad
agroecological zones published through the `SEN_ZONE` ArcGIS feature service:

- Zone Sylvo-Pastorale
- Niayes
- Bassin Arachidier
- Vallée du Fleuve
- Casamance
- Sénégal Oriental

Source: Ministry of Agriculture of Senegal, Agricultural Policy Unit,
*Plan d'action foncier du Sénégal* (1996). The service metadata permits reuse
with attribution.

Metadata:
`https://www.arcgis.com/sharing/rest/content/items/a566177e1b9349d58471e719d6c18a0c/info/metadata/metadata.xml?format=default&output=html`

Feature service query:
`https://services5.arcgis.com/sjP4Ugu5s0dZWLjd/ArcGIS/rest/services/SEN_ZONE/FeatureServer/0/query?where=1%3D1&outFields=FID%2CZONE%2CAEZ&outSR=4326&f=geojson&maxAllowableOffset=0.002&geometryPrecision=5`

The checked-in copy is reprojected to EPSG:4326 and simplified through the
ArcGIS query to reduce frontend bundle size. It is intended for broad map
context, not parcel-scale soil classification.
