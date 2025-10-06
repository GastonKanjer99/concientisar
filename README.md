# 🌍 2025 NASA Space Apps Challenge  

## 🔬 Through the Radar Looking Glass: Revealing Earth Processes with SAR  

### 📖 Summary  
Like *Alice in Wonderland*, we invite you to travel down the rabbit hole to reveal a world that looks like Earth… but not quite.  

Using **Synthetic Aperture Radar (SAR)**, we can capture images of our planet by emitting radar pulses and recording the energy reflected after interacting with Earth’s surface.  

Our goal is to download and analyze **multi-frequency** or **multi-polarization SAR data** for a chosen study area – e.g., tropical wetlands, glaciers, wildfire zones, flooded neighborhoods, volcanic eruptions – and develop **hypotheses about the physical drivers** shaping those environments.  

## Our Project
Using SAR and NDVI imagery from Sentinel-1, Sentinel-2, PALSAR-2, SAOCOM, and Biomass (P-band) satellites, we analyze how fires caused by livestock producers have transformed the wetland ecosystem of the Paraná River Delta. Our goal is to show that these practices harm not only biodiversity and natural resources but also the livestock trade economic returns. We processed public SAR and NDVI datasets through Google Earth Engine, focusing on surface vegetation (VH), roughness (VV), forest biomass (HH), forest volume (HV), and vegetative vigor (NDVI). The study reveals that burning reduces soil permeability, increasing flood risk and erosion, which raises logistical costs along the Paraná waterway and affects cattle transport during floods, and, augmenting the cuantity of floods because of it water permeability. Temporal analysis shows that post-fire regrowth consists mainly of low-biomass grasslands replacing diverse native flora. We created an interactive web platform with visualizations and an app built with Google Earth Engine, offering two sections: one for livestock producers (who does not have a technical undesrtandment) and another for ilustrated audiences. Users can explore different satellite layers, visualize temporal changes, and access guides and FAQs aimed at promoting awareness and sustainable land management.

## Links
### [Webpage](https://concientisar.netlify.app/)

### Español
[Documentación](https://docs.google.com/document/d/1Nx9t3hA60h5Nn-RzJ81RPYQccmkUzeToLPm-4Y6EEoQ/edit?tab=t.0)

[Presentación en Canva](https://www.canva.com/design/DAG08WusUsk/yP19EbOqC3J06iXx6a4B5A/edit)

### English
[Documentation](https://docs.google.com/document/d/1zuwalp1RLlBQ7OiOp45CiqLKuLuXwLLyjW36oFyg-o4/edit?tab=t.0#heading=h.rotbcpd371ow)

[Canva presentation](https://www.canva.com/design/DAG0-iVtSLM/UXop92kCNR3CilhTLpky-A/edit)

## Project Details
Our platform is a Google Earth Engine web application that performs multi-temporal, multi-sensor remote sensing analysis of wildfires in the Paraná River Delta. The system integrates four complementary data sources to overcome the limitations of single-sensor approaches in wetland environments.

### HOW IT WORKS
1. #### SAR Polarimetry Analysis:
   - Sentinel-1 C-band (5.6 cm wavelength): Detects surface roughness changes and vegetation structure loss with 10m resolution.
   - ALOS-2 PALSAR-2 L-band (23.6 cm wavelength): Penetrates deeper into vegetation canopy, sensitive to biomass changes at 25m resolution.
   - Dual-polarization (VV/VH, HH/HV) captures different scattering mechanisms.
   - Cross-polarization (VH, HV) is particularly sensitive to vegetation loss.
2. #### Optical Validation:
   - Sentinel-2 multispectral imagery (10-20m resolution).
   - NDVI (Normalized Difference Vegetation Index): Measures vegetation health.
   - NBR (Normalized Burn Ratio): Specifically designed for burn scar detection.
   - dNBR (difference NBR): Quantifies burn severity.
3. Thermal Hotspot Detection:
   - MODIS Fire product: Active fire detection during October 2020 burn events.
   - 1km resolution, daily coverage.
4. Interactive Visualization:
   - Temporal slider: Smooth transitions between Pre (Aug 2020), During (Oct 2020), and Post (Sep 2024) periods.
   - Layer selector: Toggle between different sensors and polarizations.
   - RGB composites: False-color visualizations for enhanced interpretation.
   - Statistical analysis: Calculate mean backscatter changes across the region.

### BENEFITS
- All-weather monitoring: SAR penetrates clouds and smoke
- Multi-frequency validation: C-band and L-band provide complementary information
- Long-term assessment: 4-year temporal analysis (2020-2024)
- Free and accessible: Built on Google Earth Engine public infrastructure
- No software installation required: Web-based interface

### INTENDED IMPACT:
- Demonstrate that when burning occurs in the Paraná Delta, the regrowth of grassland produces a much lower amount of biomass compared to the native flora that originally existed there.
- Demonstrate the loss of soil permeability resulting from the reduction of biomass and repeated burnings.
- Analyze changes in the Paraná waterway caused by shifts in river courses generated by soil erosion.
- Analyze variations in the depth (draft) of the Paraná waterway and seek correlations with the burning of the islands.

### TECHNICAL IMPLEMENTATION:
- Platform: Google Earth Engine (JavaScript API)
- Programming Language: JavaScript (Earth Engine Code Editor)
- Data Processing: Cloud-based parallel processing on GEE infrastructure
- UI Framework: Earth Engine UI widgets (panels, sliders, selectors, buttons)
- Visualization: Custom color palettes optimized for SAR and optical data
- Geospatial Processing: Median compositing, temporal differencing, masking
- Statistical Analysis: Zonal statistics with ee.Reducer

### DATASETS USED:
- COPERNICUS/S1_GRD: Sentinel-1 Ground Range Detected
- JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR: ALOS-2 PALSAR-2
- COPERNICUS/S2_SR_HARMONIZED: Sentinel-2 Surface Reflectance
- MODIS/006/MOD14A1: MODIS Thermal Anomalies/Fire
- JRC/GSW1_4/GlobalSurfaceWater: Water mask for filtering

### CREATIVE ASPECTS:
- Accumulative layer visualization: Temporal slider shows layers building up rather than replacing, allowing users to see change progression
- Dual color schemes: Both colorized and grayscale SAR visualizations for different interpretation needs
- Multi-sensor comparison: Side-by-side analysis of C-band vs L-band responses
- Adaptive interface: Dynamic legend updates based on selected layer
- Optimized for the specific challenge: Focused on the 2020 Paraná Delta fires, one of Argentina's worst environmental disasters

### TEAM CONSIDERATIONS:
- Data availability: Selected sensors with free, open access
- Temporal alignment: Matched image dates across sensors when possible
- Spatial coverage: Ensured all sensors covered the entire Delta region
- Processing efficiency: Optimized code for fast rendering in web browser
- User experience: Designed intuitive controls for non-expert users
- Scientific rigor: Validated SAR changes with optical indices and thermal data
- Scalability: Code structure allows easy adaptation to other regions/dates

## NASA DATA
- [Intro to Remote Sensing](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing)
- [Intro to Synthetic ApertureRadar (SAR)](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar)
- [NASA Earthdata Search](https://search.earthdata.nasa.gov/search)
- [NASA Applied Remote Sensing Training (ARSET) Trainings](https://appliedsciences.nasa.gov/get-involved/training)

## Space Agency Partner & Other Data
- [MODIS Thermal Anomalies and Fire Daily Global 1km](https://lpdaac.usgs.gov/products/mod14a1v006/)
- [NASA Earthdata - MODIS Fire Products](https://earthdata.nasa.gov/earth-observation-data/near-real-time/firms/active-fire-data)
- [Copernicus Sentinel-1 SAR GRD](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD)
- [Copernicus Sentinel-2 MSI Surface Reflectance](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- [Sentinel Online - Sentinel-1 Technical Guide](https://sentinels.copernicus.eu/web/sentinel/technical-guides/sentinel-1-sar)
- [ALOS-2 PALSAR-2 ScanSAR L-band SAR](https://developers.google.com/earth-engine/datasets/catalog/JAXA_ALOS_PALSAR-2_Level2_2_ScanSAR)
- [JAXA ALOS-2 Mission Overview](https://www.eorc.jaxa.jp/ALOS-2/en/about/overview.htm)
- [JRC Global Surface Water Dataset](https://developers.google.com/earth-engine/datasets/catalog/JRC_GSW1_4_GlobalSurfaceWater)
- [EC JRC Global Surface Water Explorer](https://global-surface-water.appspot.com/)
- [Google Earth Engine Platform](https://earthengine.google.com/)
- [Google Earth Engine Code Editor](https://code.earthengine.google.com/)
- [Google Earth Engine JavaScript API Documentation](https://developers.google.com/earth-engine/guides/getstarted)
- [Normalized Burn Ratio (NBR) - USGS](https://www.usgs.gov/landsat-missions/landsat-normalized-burn-ratio)
- [SAR Handbook - Comprehensive Methodologies for Forest Monitoring](https://servirglobal.net/Global/Articles/Article/2674/sar-handbook-comprehensive-methodologies-for-forest-monitoring-and-biomass-estimation)


### 👩‍🔬 Team
- Altuzarra, Ernesto Tomas
- Gomez, Maximiliano
- Kanjer, Gastón Alberto
- Palacio, Sebastián
- Tapia, Fabrizio
- Rapanelli, Julián Ignacio
