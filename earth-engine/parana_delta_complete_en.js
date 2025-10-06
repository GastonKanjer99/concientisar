var aoi = ee.Geometry.Polygon([
  [
    [-60.95, -34.20],
    [-60.95, -32.20],
    [-59.90, -32.20],
    [-58.50, -33.00],
    [-58.50, -34.20],
    [-60.95, -34.20]
  ]
]);

Map.centerObject(aoi, 9);
Map.addLayer(ee.Image().paint(ee.FeatureCollection(aoi), 0, 2), 
  {palette:['yellow']}, 'AOI - Complete Delta', true, 0.8);

var preRange   = {start: '2020-08-01', end: '2020-09-15'};
var duringRange= {start: '2020-10-01', end: '2020-10-15'}; 
var postRange  = {start: '2024-08-01', end: '2024-09-15'};

function maskEdges(img) {
  var ang = img.select('angle');
  var mask = ang.gt(30).and(ang.lt(45));
  return img.updateMask(mask);
}

function s1Composite(rangeObj) {
  var base = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi)
    .filterDate(rangeObj.start, rangeObj.end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'));

  var asc = base.filter(ee.Filter.eq('orbitProperties_pass','ASCENDING'));
  var picked = ee.ImageCollection(ee.Algorithms.If(asc.size().gt(0), asc, base))
    .map(maskEdges);

  var med = picked.median();
  var vvDb = med.select('VV').rename('VV_dB').clip(aoi);
  var vhDb = med.select('VH').rename('VH_dB').clip(aoi);
  var ratioDb = vvDb.subtract(vhDb).rename('VVminusVH_dB');
  return vvDb.addBands(vhDb).addBands(ratioDb);
}

var pre   = s1Composite(preRange);
var during= s1Composite(duringRange);
var post  = s1Composite(postRange);

print('Loading PALSAR-2 L-band (most recent)...');

var palsar2_2020 = ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
  .filterBounds(aoi)
  .filterDate('2020-01-01', '2020-12-31')
  .select(['HH', 'HV'])
  .median()
  .clip(aoi);

var palsar2_2023 = ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
  .filterBounds(aoi)
  .filterDate('2023-01-01', '2023-12-31')
  .select(['HH', 'HV'])
  .median()
  .clip(aoi);

print('PALSAR-2 2020 bands:', palsar2_2020.bandNames());
print('PALSAR-2 2023 bands:', palsar2_2023.bandNames());
print('PALSAR-2 images 2020:', ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
  .filterBounds(aoi).filterDate('2020-01-01', '2020-12-31').size());
print('PALSAR-2 images 2023:', ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
  .filterBounds(aoi).filterDate('2023-01-01', '2023-12-31').size());

var water = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence').clip(aoi);
var deltaVH = post.select('VH_dB').subtract(pre.select('VH_dB')).rename('deltaVH_dB');
var deltaVH_masked = deltaVH.updateMask(water.lt(80));

function maskS2clouds(image){
  var qa = image.select('QA60');
  var cloudBit = 1 << 10;
  var cirrusBit = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBit).eq(0).and(qa.bitwiseAnd(cirrusBit).eq(0));
  return image.updateMask(mask).divide(10000);
}

function s2Composite(start, end){
  var col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .map(maskS2clouds)
    .select(['B4','B8','B11','B12']);
  
  return col.median().clip(aoi);
}

var s2_pre = s2Composite(preRange.start, preRange.end);
var s2_post = s2Composite(postRange.start, postRange.end);

var ndvi_pre = s2_pre.normalizedDifference(['B8','B4']).rename('NDVI_pre');
var ndvi_post = s2_post.normalizedDifference(['B8','B4']).rename('NDVI_post');
var ndvi_delta = ndvi_post.subtract(ndvi_pre).rename('NDVI_delta');

var nbr_pre = s2_pre.normalizedDifference(['B8','B12']).rename('NBR_pre');
var nbr_post = s2_post.normalizedDifference(['B8','B12']).rename('NBR_post');
var dnbr = nbr_pre.subtract(nbr_post).rename('dNBR');

var modis_fire = ee.ImageCollection('MODIS/006/MOD14A1')
  .filterDate(duringRange.start, duringRange.end)
  .filterBounds(aoi)
  .select('FireMask');

var fireComposite = modis_fire.max().clip(aoi);
var firePoints = fireComposite.gt(7);

print('MODIS Fire images count:', modis_fire.size());

var vhVis   = {min: -25, max: -10, palette: ['000000','0b1559','1b4fd0','58c5f1','f9f871','ffffff']};
var vvVis   = {min: -20, max:  -5, palette: ['000000','14213d','277da1','90be6d','f9c74f','ffffff']};
var ratioVis= {min:   0, max:  15, palette: ['000000','3a0ca3','4361ee','4cc9f0','f8961e','d00000']};
var deltaVis= {min:  -5, max:   5, palette: ['6a040f','d00000','ffffff','70e000','008000']};
var grayVis = {min: -25, max:   0, palette: ['000000','ffffff']};
var ndviVis = {min: -0.2, max: 0.8, palette: ['8B4513','FFFF00','90EE90','006400']};
var dnbrVis = {min: -0.5, max: 1.2, palette: ['006400','90EE90','FFFF00','FF8C00','FF0000','8B0000']};
var viirsVis = {min: 0, max: 1, palette: ['FF6600']};

var lyrPreVH   = ui.Map.Layer(pre.select('VH_dB'), vhVis, '1. Pre VH C-band (2020) - Color', false);
var lyrDurVH   = ui.Map.Layer(during.select('VH_dB'), vhVis, '2. During VH C-band (oct 2020) - Color', false);
var lyrPostVH  = ui.Map.Layer(post.select('VH_dB'), vhVis, '3. Post VH C-band (2024) - Color', false);

var vhVisGray = {min: -25, max: 0, palette: ['000000','808080','ffffff']};
var lyrPreVH_gray   = ui.Map.Layer(pre.select('VH_dB'), vhVisGray, '4. Pre VH C-band (2020) - Grayscale', false);
var lyrDurVH_gray   = ui.Map.Layer(during.select('VH_dB'), vhVisGray, '5. During VH C-band (oct 2020) - Grayscale', false);
var lyrPostVH_gray  = ui.Map.Layer(post.select('VH_dB'), vhVisGray, '6. Post VH C-band (2024) - Grayscale', false);

var lyrPreVV   = ui.Map.Layer(pre.select('VV_dB'), vvVis, '4. Pre VV C-band (2020) - Color', false);
var lyrDurVV   = ui.Map.Layer(during.select('VV_dB'), vvVis, '5. During VV C-band (oct 2020) - Color', false);
var lyrPostVV  = ui.Map.Layer(post.select('VV_dB'), vvVis, '6. Post VV C-band (2024) - Color', false);

var palsarVis = {min: 0, max: 10000, palette: ['000000','0b1559','1b4fd0','58c5f1','f9f871','ffffff']};
var lyrPALSAR2_HH_2020 = ui.Map.Layer(palsar2_2020.select('HH'), palsarVis, '7. PALSAR-2 HH L-band (2020)', false);
var lyrPALSAR2_HH_2023 = ui.Map.Layer(palsar2_2023.select('HH'), palsarVis, '8. PALSAR-2 HH L-band (2023)', false);
var lyrPALSAR2_HV_2020 = ui.Map.Layer(palsar2_2020.select('HV'), palsarVis, '9. PALSAR-2 HV L-band (2020)', false);
var lyrPALSAR2_HV_2023 = ui.Map.Layer(palsar2_2023.select('HV'), palsarVis, '10. PALSAR-2 HV L-band (2023)', false);

var lyrPreRGB  = ui.Map.Layer(pre.select(['VV_dB','VH_dB','VVminusVH_dB']), 
  {min:[-18,-22, 2], max:[-5,-10,12]}, '11. Pre RGB C-band (2020)', false);
var lyrDurRGB  = ui.Map.Layer(during.select(['VV_dB','VH_dB','VVminusVH_dB']), 
  {min:[-18,-22, 2], max:[-5,-10,12]}, '12. During RGB C-band (oct 2020)', false);
var lyrPostRGB = ui.Map.Layer(post.select(['VV_dB','VH_dB','VVminusVH_dB']), 
  {min:[-18,-22, 2], max:[-5,-10,12]}, '13. Post RGB C-band (2024)', false);

var lyrDeltaVH = ui.Map.Layer(deltaVH_masked, deltaVis, '14. Delta VH (Post-Pre)', false);

var lyrNDVI_pre = ui.Map.Layer(ndvi_pre, ndviVis, '15. NDVI Pre (2020)', false);
var lyrNDVI_post = ui.Map.Layer(ndvi_post, ndviVis, '16. NDVI Post (2024)', false);
var lyrDNBR = ui.Map.Layer(dnbr, dnbrVis, '17. dNBR (NBR difference)', false);

var lyrFire = ui.Map.Layer(firePoints.selfMask(), viirsVis, 
  '18. MODIS Fire Hotspots (oct 2020)', false);

var lyrWater = ui.Map.Layer(water, {min:0, max:100, palette:['white','0000FF']}, 
  '19. JRC Permanent Water (%)', false);

Map.layers().add(lyrPreVH);
Map.layers().add(lyrDurVH);
Map.layers().add(lyrPostVH);
Map.layers().add(lyrPreVH_gray);
Map.layers().add(lyrDurVH_gray);
Map.layers().add(lyrPostVH_gray);
Map.layers().add(lyrPreVV);
Map.layers().add(lyrDurVV);
Map.layers().add(lyrPostVV);

Map.layers().add(lyrPALSAR2_HH_2020);
Map.layers().add(lyrPALSAR2_HH_2023);
Map.layers().add(lyrPALSAR2_HV_2020);
Map.layers().add(lyrPALSAR2_HV_2023);

Map.layers().add(lyrPreRGB);
Map.layers().add(lyrDurRGB);
Map.layers().add(lyrPostRGB);

Map.layers().add(lyrDeltaVH);
Map.layers().add(lyrNDVI_pre);
Map.layers().add(lyrNDVI_post);
Map.layers().add(lyrDNBR);
Map.layers().add(lyrFire);
Map.layers().add(lyrWater);

lyrPreVH.setShown(true);
lyrPreVH.setOpacity(1);
lyrDurVH.setShown(false);
lyrPostVH.setShown(false);

lyrPreVV.setShown(false);
lyrPALSAR2_HH_2020.setShown(false);

var legendPanel = ui.Panel({
  style: {position: 'bottom-right', padding: '8px', backgroundColor: 'white'}
});

function makeLegendRow(color, label) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: color,
      padding: '8px',
      margin: '0 8px 0 0',
      border: '1px solid black'
    }
  });
  var description = ui.Label({
    value: label,
    style: {margin: '0', fontSize: '11px'}
  });
  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}

function updateLegend(layerName) {
  legendPanel.clear();
  
  var layerStr = String(layerName);
  legendPanel.add(ui.Label('Legend: ' + layerStr, {fontWeight: 'bold', fontSize: '12px'}));
  
  if (layerStr.indexOf('VH') > -1 && layerStr.indexOf('Color') > -1) {
    legendPanel.add(ui.Label('C-band VH (cross-pol):', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('000000', 'Black: Water / Very low (-25 dB)'));
    legendPanel.add(makeLegendRow('0b1559', 'Dark blue: Wet soil (-20 dB)'));
    legendPanel.add(makeLegendRow('1b4fd0', 'Blue: Low grasslands (-17 dB)'));
    legendPanel.add(makeLegendRow('58c5f1', 'Cyan: Shrubs / Crops (-15 dB)'));
    legendPanel.add(makeLegendRow('f9f871', 'Yellow: Medium vegetation (-12 dB)'));
    legendPanel.add(makeLegendRow('ffffff', 'White: Forests / Dense veg (-10 dB)'));
    legendPanel.add(ui.Label('Sensitive to vegetation volume', {fontSize: '9px', fontStyle: 'italic', color: '666'}));
  }
  else if (layerStr.indexOf('VV') > -1 && layerStr.indexOf('Color') > -1) {
    legendPanel.add(ui.Label('C-band VV (co-pol):', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('000000', 'Black: Smooth water (-20 dB)'));
    legendPanel.add(makeLegendRow('14213d', 'Dark blue: Bare soil (-15 dB)'));
    legendPanel.add(makeLegendRow('277da1', 'Blue: Low vegetation (-10 dB)'));
    legendPanel.add(makeLegendRow('90be6d', 'Green: Medium vegetation (-7 dB)'));
    legendPanel.add(makeLegendRow('f9c74f', 'Yellow: Forests / Rough (-5 dB)'));
    legendPanel.add(makeLegendRow('ffffff', 'White: Urban / Structures'));
    legendPanel.add(ui.Label('Sensitive to surface roughness', {fontSize: '9px', fontStyle: 'italic', color: '666'}));
  }
  else if (layerStr.indexOf('PALSAR-2 HH') > -1) {
    legendPanel.add(ui.Label('L-band HH (horizontal-horizontal):', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('000000', 'Water / Very low (0-2000)'));
    legendPanel.add(makeLegendRow('0b1559', 'Low - Bare soil (2000-4000)'));
    legendPanel.add(makeLegendRow('1b4fd0', 'Medium-low - Grasslands (4000-6000)'));
    legendPanel.add(makeLegendRow('58c5f1', 'Medium - Shrubs (6000-8000)'));
    legendPanel.add(makeLegendRow('f9f871', 'High - Forest (8000-9000)'));
    legendPanel.add(makeLegendRow('ffffff', 'Very high - Dense biomass (>9000)'));
  }
  else if (layerStr.indexOf('PALSAR-2 HV') > -1) {
    legendPanel.add(ui.Label('L-band HV (cross-pol):', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('000000', 'Water / Very low (0-1000)'));
    legendPanel.add(makeLegendRow('0b1559', 'Low - Soil/Grassland (1000-2000)'));
    legendPanel.add(makeLegendRow('1b4fd0', 'Medium-low - Low vegetation (2000-3000)'));
    legendPanel.add(makeLegendRow('58c5f1', 'Medium - Shrubs (3000-4000)'));
    legendPanel.add(makeLegendRow('f9f871', 'High - Medium forest (4000-5000)'));
    legendPanel.add(makeLegendRow('ffffff', 'Very high - Dense forest (>5000)'));
  }
  else if (layerStr.indexOf('Grayscale') > -1) {
    legendPanel.add(ui.Label('VH Grayscale:', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('000000', 'Black: Water (-25 dB)'));
    legendPanel.add(makeLegendRow('404040', 'Dark gray: Wet soil (-20 dB)'));
    legendPanel.add(makeLegendRow('808080', 'Medium gray: Grasslands (-12 dB)'));
    legendPanel.add(makeLegendRow('c0c0c0', 'Light gray: Medium vegetation (-5 dB)'));
    legendPanel.add(makeLegendRow('ffffff', 'White: Dense forests (0 dB)'));
    legendPanel.add(ui.Label('Better for texture analysis', {fontSize: '9px', fontStyle: 'italic', color: '666'}));
  }
  else if (layerStr.indexOf('RGB') > -1) {
    legendPanel.add(ui.Label('RGB C-band Composite:', {fontSize: '11px', fontWeight: 'bold'}));
    legendPanel.add(ui.Label('R: VV (surface)', {fontSize: '10px', color: 'red'}));
    legendPanel.add(ui.Label('G: VH (vegetation)', {fontSize: '10px', color: 'green'}));
    legendPanel.add(ui.Label('B: VV-VH (ratio)', {fontSize: '10px', color: 'blue'}));
    legendPanel.add(ui.Label('───────────────', {fontSize: '9px'}));
    legendPanel.add(makeLegendRow('0000FF', 'Dark blue: Smooth water'));
    legendPanel.add(makeLegendRow('8B008B', 'Purple: Water with vegetation'));
    legendPanel.add(makeLegendRow('FF00FF', 'Magenta: Urban/structures'));
    legendPanel.add(makeLegendRow('FFFF00', 'Yellow: Grasslands/crops'));
    legendPanel.add(makeLegendRow('00FF00', 'Green: Dense vegetation (forests)'));
    legendPanel.add(makeLegendRow('000000', 'Black: Deep water'));
    legendPanel.add(ui.Label('Note: Purple dominates in wetlands', {fontSize: '9px', fontStyle: 'italic', color: '666'}));
  }
  else if (layerStr.indexOf('Delta VH') > -1) {
    legendPanel.add(ui.Label('VH Change (Post - Pre):', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('6a040f', 'Dark red: Severe loss (-5 dB)'));
    legendPanel.add(makeLegendRow('d00000', 'Red: Moderate loss (-2 dB)'));
    legendPanel.add(makeLegendRow('ffcccc', 'Pink: Slight loss (-0.5 dB)'));
    legendPanel.add(makeLegendRow('ffffff', 'White: No change (0 dB)'));
    legendPanel.add(makeLegendRow('ccffcc', 'Light green: Slight gain (+0.5 dB)'));
    legendPanel.add(makeLegendRow('70e000', 'Green: Moderate gain (+2 dB)'));
    legendPanel.add(makeLegendRow('008000', 'Dark green: Severe gain (+5 dB)'));
    legendPanel.add(ui.Label('Red = Deforestation, Green = Recovery', {fontSize: '9px', fontStyle: 'italic', color: '666'}));
  }
  else if (layerStr.indexOf('NDVI') > -1) {
    legendPanel.add(ui.Label('NDVI (Normalized Difference):', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('8B4513', 'Brown: Bare soil / Water (-0.2 to 0)'));
    legendPanel.add(makeLegendRow('FFFF00', 'Yellow: Sparse veg / Grassland (0.2)'));
    legendPanel.add(makeLegendRow('ADFF2F', 'Yellow-green: Moderate veg (0.4)'));
    legendPanel.add(makeLegendRow('90EE90', 'Light green: Medium veg / Crops (0.5)'));
    legendPanel.add(makeLegendRow('228B22', 'Green: Dense veg / Shrubs (0.7)'));
    legendPanel.add(makeLegendRow('006400', 'Dark green: Dense forests (0.8+)'));
    legendPanel.add(ui.Label('Range: -1 (water) to +1 (dense veg)', {fontSize: '9px', fontStyle: 'italic', color: '666'}));
  }
  else if (layerStr.indexOf('dNBR') > -1) {
    legendPanel.add(ui.Label('dNBR (NBR Difference):', {fontSize: '10px', fontWeight: 'bold'}));
    legendPanel.add(makeLegendRow('006400', 'Dark green: Recovery / No burn (-0.5)'));
    legendPanel.add(makeLegendRow('90EE90', 'Light green: Low burn (0.1-0.27)'));
    legendPanel.add(makeLegendRow('FFFF00', 'Yellow: Moderate-low burn (0.27-0.44)'));
    legendPanel.add(makeLegendRow('FF8C00', 'Orange: Moderate-high burn (0.44-0.66)'));
    legendPanel.add(makeLegendRow('FF0000', 'Red: High / Severe burn (0.66-1.3)'));
    legendPanel.add(makeLegendRow('8B0000', 'Dark red: Very high burn (>1.3)'));
    legendPanel.add(ui.Label('Detects fire severity', {fontSize: '9px', fontStyle: 'italic', color: '666'}));
  }
  else if (layerStr.indexOf('Fire') > -1 || layerStr.indexOf('MODIS') > -1) {
    legendPanel.add(makeLegendRow('FF6600', 'Active fire detected (thermal)'));
    legendPanel.add(ui.Label('Source: MODIS Fire MOD14A1', {fontSize: '10px', fontStyle: 'italic'}));
  }
  else if (layerStr.indexOf('Water') > -1) {
    legendPanel.add(makeLegendRow('ffffff', 'No water (0%)'));
    legendPanel.add(makeLegendRow('8080FF', 'Occasional water (50%)'));
    legendPanel.add(makeLegendRow('0000FF', 'Permanent water (100%)'));
  }
}

var panel = ui.Panel({
  style: {
    position: 'top-left', 
    width: '400px',
    height: '70%',
    padding: '8px'
  }
});

panel.add(ui.Label('Paraná River Delta - Multi-sensor Analysis', 
  {fontWeight: 'bold', fontSize: '16px', color: '0000FF'}));
panel.add(ui.Label('Changes 2020-2024 (SAR + Optical + Thermal)', 
  {fontSize: '12px', color: '666'}));

var options = [
  '0. None',
  '1. Sentinel-1 Pre VH C-band (2020) Color',
  '2. Sentinel-1 During VH C-band (oct-2020) Color',
  '3. Sentinel-1 Post VH C-band (2024) Color',
  '4. Sentinel-1 Pre VH C-band (2020) Grayscale',
  '5. Sentinel-1 During VH C-band (oct-2020) Grayscale',
  '6. Sentinel-1 Post VH C-band (2024) Grayscale',
  '7. Sentinel-1 Pre VV C-band (2020) Color',
  '8. Sentinel-1 During VV C-band (oct-2020) Color',
  '9. Sentinel-1 Post VV C-band (2024) Color',
  '10. PALSAR-2 HH L-band (2020)',
  '11. PALSAR-2 HH L-band (2023)',
  '12. PALSAR-2 HV L-band (2020)',
  '13. PALSAR-2 HV L-band (2023)',
  '14. Sentinel-1 Pre RGB C-band (2020)',
  '15. Sentinel-1 During RGB C-band (oct-2020)',
  '16. Sentinel-1 Post RGB C-band (2024)',
  '17. Sentinel-1 Delta VH (2020→ 2024)',
  '18. Sentinel-2 NDVI Pre (2020)',
  '19. Sentinel-2 NDVI Post (2024)',
  '20. Sentinel-2 dNBR (2020→ 2024)'
];

var select = ui.Select({
  items: options, 
  placeholder: 'Select main layer',
  onChange: function(v){
    if (v === '0. None') {
      [lyrPreVH, lyrDurVH, lyrPostVH, lyrPreVH_gray, lyrDurVH_gray, lyrPostVH_gray,
       lyrPreVV, lyrDurVV, lyrPostVV,
       lyrPALSAR2_HH_2020, lyrPALSAR2_HH_2023, lyrPALSAR2_HV_2020, lyrPALSAR2_HV_2023,
       lyrPreRGB, lyrDurRGB, lyrPostRGB, lyrDeltaVH, lyrNDVI_pre,
       lyrNDVI_post, lyrDNBR, lyrFire, lyrWater]
        .forEach(function(l){ l.setShown(false); });
      return;
    }
    
    [lyrPreVH, lyrDurVH, lyrPostVH, lyrPreVH_gray, lyrDurVH_gray, lyrPostVH_gray,
     lyrPreVV, lyrDurVV, lyrPostVV,
     lyrPALSAR2_HH_2020, lyrPALSAR2_HH_2023, lyrPALSAR2_HV_2020, lyrPALSAR2_HV_2023,
     lyrPreRGB, lyrDurRGB, lyrPostRGB, lyrDeltaVH, lyrNDVI_pre,
     lyrNDVI_post, lyrDNBR, lyrFire, lyrWater]
      .forEach(function(l){ l.setShown(false); });
    
    var mapBy = {
      '1. Sentinel-1 Pre VH C-band (2020) Color': lyrPreVH,
      '2. Sentinel-1 During VH C-band (oct-2020) Color': lyrDurVH,
      '3. Sentinel-1 Post VH C-band (2024) Color': lyrPostVH,
      '4. Sentinel-1 Pre VH C-band (2020) Grayscale': lyrPreVH_gray,
      '5. Sentinel-1 During VH C-band (oct-2020) Grayscale': lyrDurVH_gray,
      '6. Sentinel-1 Post VH C-band (2024) Grayscale': lyrPostVH_gray,
      '7. Sentinel-1 Pre VV C-band (2020) Color': lyrPreVV,
      '8. Sentinel-1 During VV C-band (oct-2020) Color': lyrDurVV,
      '9. Sentinel-1 Post VV C-band (2024) Color': lyrPostVV,
      '10. PALSAR-2 HH L-band (2020)': lyrPALSAR2_HH_2020,
      '11. PALSAR-2 HH L-band (2023)': lyrPALSAR2_HH_2023,
      '12. PALSAR-2 HV L-band (2020)': lyrPALSAR2_HV_2020,
      '13. PALSAR-2 HV L-band (2023)': lyrPALSAR2_HV_2023,
      '14. Sentinel-1 Pre RGB C-band (2020)': lyrPreRGB,
      '15. Sentinel-1 During RGB C-band (oct-2020)': lyrDurRGB,
      '16. Sentinel-1 Post RGB C-band (2024)': lyrPostRGB,
      '17. Sentinel-1 Delta VH (2020→ 2024)': lyrDeltaVH,
      '18. Sentinel-2 NDVI Pre (2020)': lyrNDVI_pre,
      '19. Sentinel-2 NDVI Post (2024)': lyrNDVI_post,
      '20. Sentinel-2 dNBR (2020→ 2024)': lyrDNBR
    };
    var selectedLayer = mapBy[v];
    selectedLayer.setShown(true);
    selectedLayer.setOpacity(1);
    
    updateLegend(v);
  }
});
panel.add(select);

panel.add(ui.Label('Additional layers (overlay):', {fontWeight: 'bold', margin: '10px 0 5px 0'}));

var chkFire = ui.Checkbox({
  label: 'MODIS Fire Hotspots (oct-2020)',
  value: false,
  onChange: function(checked) { lyrFire.setShown(checked); }
});
panel.add(chkFire);

var chkWater = ui.Checkbox({
  label: 'JRC Permanent Water (historical)',
  value: false,
  onChange: function(checked) { lyrWater.setShown(checked); }
});
panel.add(chkWater);

panel.add(ui.Label('Temporal Comparison:', {fontWeight: 'bold', margin: '15px 0 5px 0', color: 'FF0000'}));
panel.add(ui.Label('Move slider to see changes Pre → During → Post', {fontSize: '11px', fontStyle: 'italic'}));

var sliderLayerType = 'VH_Color';

var sliderTypeSelect = ui.Select({
  items: [
    '0. None',
    '1. Sentinel-1 VH C-band Color',
    '2. Sentinel-1 VH C-band Grayscale',
    '3. Sentinel-1 VV C-band',
    '4. Sentinel-1 RGB C-band',
    '5. PALSAR-2 HH L-band',
    '6. PALSAR-2 HV L-band',
    '7. Sentinel-2 NDVI'
  ],
  value: '1. Sentinel-1 VH C-band Color',
  placeholder: 'Layer type',
  onChange: function(type) {
    if (type === '0. None') {
      [lyrPreVH, lyrDurVH, lyrPostVH, lyrPreVH_gray, lyrDurVH_gray, lyrPostVH_gray,
       lyrPreVV, lyrDurVV, lyrPostVV,
       lyrPreRGB, lyrDurRGB, lyrPostRGB,
       lyrPALSAR2_HH_2020, lyrPALSAR2_HH_2023,
       lyrPALSAR2_HV_2020, lyrPALSAR2_HV_2023,
       lyrNDVI_pre, lyrNDVI_post]
        .forEach(function(l){ l.setShown(false); });
      return;
    }
    
    if (type === '1. Sentinel-1 VH C-band Color') sliderLayerType = 'VH_Cband';
    else if (type === '2. Sentinel-1 VH C-band Grayscale') sliderLayerType = 'VH_Grises';
    else if (type === '3. Sentinel-1 VV C-band') sliderLayerType = 'VV_Cband';
    else if (type === '4. Sentinel-1 RGB C-band') sliderLayerType = 'RGB_Cband';
    else if (type === '5. PALSAR-2 HH L-band') sliderLayerType = 'PALSAR2_HH';
    else if (type === '6. PALSAR-2 HV L-band') sliderLayerType = 'PALSAR2_HV';
    else if (type === '7. Sentinel-2 NDVI') sliderLayerType = 'NDVI';
    
    var currentVal = slider.getValue();
    updateSliderLayers(currentVal);
    updateSliderLegend();
  },
  style: {width: '220px'}
});
panel.add(sliderTypeSelect);

var sliderLabel = ui.Label('Period: Pre (2020)', {fontSize: '12px', fontWeight: 'bold', color: '0000FF'});
panel.add(sliderLabel);

var slider = ui.Slider({
  min: 0,
  max: 2,
  value: 0,
  step: 0.05,
  style: {width: '300px', padding: '5px'},
  onChange: function(value) {
    updateSliderLayers(value);
  }
});
panel.add(slider);

var sliderLabelsPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '300px', padding: '0px'}
});
sliderLabelsPanel.add(ui.Label('Pre', {fontSize: '10px', width: '100px', textAlign: 'left'}));
sliderLabelsPanel.add(ui.Label('During', {fontSize: '10px', width: '100px', textAlign: 'center'}));
sliderLabelsPanel.add(ui.Label('Post', {fontSize: '10px', width: '100px', textAlign: 'right'}));
panel.add(sliderLabelsPanel);

var btnPanelNav = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {margin: '5px 0'}
});

var btnPre = ui.Button({
  label: '◀ Pre',
  onClick: function() { 
    slider.setValue(0);
    updateSliderLayers(0);
    var layers = getCurrentLayers();
    if (layers.length > 0) {
      layers[0].setOpacity(1);
    }
  },
  style: {width: '80px'}
});

var btnDurante = ui.Button({
  label: '● During',
  onClick: function() { slider.setValue(1); },
  style: {width: '100px'}
});

var btnPost = ui.Button({
  label: 'Post ▶',
  onClick: function() { slider.setValue(2); },
  style: {width: '80px'}
});

btnPanelNav.add(btnPre);
btnPanelNav.add(btnDurante);
btnPanelNav.add(btnPost);
panel.add(btnPanelNav);

var animationActive = false;
var animationStep = 0;

var btnAnimate = ui.Button({
  label: '▶ Animate (Pre → Post)',
  onClick: function() {
    if (!animationActive) {
      animationActive = true;
      btnAnimate.setLabel('⏸ Stop animation');
      animationStep = 0;
      animateSlider();
    } else {
      animationActive = false;
      btnAnimate.setLabel('▶ Animate (Pre → Post)');
    }
  },
  style: {width: '200px', margin: '5px 0'}
});
panel.add(btnAnimate);

function animateSlider() {
  if (!animationActive) return;
  
  animationStep += 0.1;
  if (animationStep > 2) {
    animationStep = 0;
  }
  
  slider.setValue(animationStep);
  
  ee.Number(1).evaluate(function() {
    if (animationActive) {
      animateSlider();
    }
  });
}

panel.add(ui.Label('Tip: Drag slider to see layers accumulating', 
  {fontSize: '10px', fontStyle: 'italic', color: '999', margin: '5px 0'}));

function getCurrentLayers() {
  if (sliderLayerType === 'VH_Cband') {
    return [lyrPreVH, lyrDurVH, lyrPostVH];
  } else if (sliderLayerType === 'VH_Grises') {
    return [lyrPreVH_gray, lyrDurVH_gray, lyrPostVH_gray];
  } else if (sliderLayerType === 'VV_Cband') {
    return [lyrPreVV, lyrDurVV, lyrPostVV];
  } else if (sliderLayerType === 'RGB_Cband') {
    return [lyrPreRGB, lyrDurRGB, lyrPostRGB];
  } else if (sliderLayerType === 'PALSAR2_HH') {
    return [lyrPALSAR2_HH_2020, lyrPALSAR2_HH_2023];
  } else if (sliderLayerType === 'PALSAR2_HV') {
    return [lyrPALSAR2_HV_2020, lyrPALSAR2_HV_2023];
  } else if (sliderLayerType === 'NDVI') {
    return [lyrNDVI_pre, lyrNDVI_post];
  }
  return [];
}

function updateSliderLayers(value) {
  var layers = [];
  var hasThreeLayers = true;
  
  if (sliderLayerType === 'VH_Cband') {
    layers = [lyrPreVH, lyrDurVH, lyrPostVH];
  } else if (sliderLayerType === 'VH_Grises') {
    layers = [lyrPreVH_gray, lyrDurVH_gray, lyrPostVH_gray];
  } else if (sliderLayerType === 'VV_Cband') {
    layers = [lyrPreVV, lyrDurVV, lyrPostVV];
  } else if (sliderLayerType === 'RGB_Cband') {
    layers = [lyrPreRGB, lyrDurRGB, lyrPostRGB];
  } else if (sliderLayerType === 'PALSAR2_HH') {
    layers = [lyrPALSAR2_HH_2020, lyrPALSAR2_HH_2023];
    hasThreeLayers = false;
  } else if (sliderLayerType === 'PALSAR2_HV') {
    layers = [lyrPALSAR2_HV_2020, lyrPALSAR2_HV_2023];
    hasThreeLayers = false;
  } else if (sliderLayerType === 'NDVI') {
    layers = [lyrNDVI_pre, lyrNDVI_post];
    hasThreeLayers = false;
  }
  
  var allLayers = [lyrPreVH, lyrDurVH, lyrPostVH,
                   lyrPreVH_gray, lyrDurVH_gray, lyrPostVH_gray,
                   lyrPreVV, lyrDurVV, lyrPostVV,
                   lyrPreRGB, lyrDurRGB, lyrPostRGB,
                   lyrPALSAR2_HH_2020, lyrPALSAR2_HH_2023,
                   lyrPALSAR2_HV_2020, lyrPALSAR2_HV_2023,
                   lyrNDVI_pre, lyrNDVI_post];
  allLayers.forEach(function(l) {
    if (layers.indexOf(l) === -1) {
      l.setShown(false);
      l.setOpacity(1);
    }
  });
  
  var opacity1, opacity2, opacity3;
  
  if (!hasThreeLayers) {
    opacity1 = Math.min(1, value * 2);
    if (opacity1 > 1) opacity1 = 1;
    
    opacity2 = value / 2;
    
    var labelText = '';
    if (sliderLayerType === 'PALSAR2_HH' || sliderLayerType === 'PALSAR2_HV') {
      labelText = sliderLayerType === 'PALSAR2_HH' ? 'PALSAR-2 HH' : 'PALSAR-2 HV';
    } else {
      labelText = 'NDVI';
    }
    
    if (value < 1) {
      sliderLabel.setValue('Period: Pre ' + labelText + ' (' + Math.round(opacity1*100) + '%)');
      sliderLabel.style().set('color', '00AA00');
    } else {
      sliderLabel.setValue('Period: Pre + Post ' + labelText + ' (' + Math.round(opacity2*100) + '% Post)');
      sliderLabel.style().set('color', '0088FF');
    }
    
    layers[0].setShown(true);
    layers[0].setOpacity(opacity1);
    
    layers[1].setShown(opacity2 > 0);
    layers[1].setOpacity(opacity2);
    
    return;
  }
  
  if (value <= 1) {
    var t = value;
    
    opacity1 = Math.min(1, value * 2);
    if (opacity1 > 1) opacity1 = 1;
    
    opacity2 = t;
    
    opacity3 = 0;
    
    if (value < 0.5) {
      sliderLabel.setValue('Period: Pre appearing (' + Math.round(opacity1*100) + '%)');
      sliderLabel.style().set('color', '00AA00');
    } else {
      sliderLabel.setValue('Period: Pre + During (' + Math.round(opacity2*100) + '% During)');
      sliderLabel.style().set('color', 'AAAA00');
    }
  } else {
    var t = value - 1;
    
    opacity1 = 1;
    
    opacity2 = 1;
    
    opacity3 = t;
    
    sliderLabel.setValue('Period: Pre + During + Post (' + Math.round(opacity3*100) + '% Post)');
    sliderLabel.style().set('color', '0088FF');
  }
  
  layers[0].setShown(true);
  layers[0].setOpacity(opacity1);
  
  layers[1].setShown(opacity2 > 0);
  layers[1].setOpacity(opacity2);
  
  layers[2].setShown(opacity3 > 0);
  layers[2].setOpacity(opacity3);
}

panel.add(ui.Label('Dates:', {fontWeight: 'bold', margin: '15px 0 5px 0'}));
panel.add(ui.Label('Pre: ' + preRange.start + ' → ' + preRange.end, {fontSize: '11px'}));
panel.add(ui.Label('During: ' + duringRange.start + ' → ' + duringRange.end, {fontSize: '11px'}));
panel.add(ui.Label('Post: ' + postRange.start + ' → ' + postRange.end, {fontSize: '11px'}));

panel.add(ui.Label('Quantitative analysis:', {fontWeight: 'bold', margin: '15px 0 5px 0'}));

var btnStats = ui.Button({
  label: '📊 Calculate Sentinel-1 VH C-band statistics',
  onClick: function() {
    statsResultsPanel.clear();
    statsResultsPanel.style().set('shown', true);
    
    var statsPre = pre.select('VH_dB').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    var statsPost = post.select('VH_dB').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    statsPre.evaluate(function(pre_vals) {
      statsPost.evaluate(function(post_vals) {
        statsResultsPanel.clear();
        statsResultsPanel.add(ui.Label('Band: VH (cross-pol, vegetation)', {color: '666', fontSize: '10px', fontStyle: 'italic'}));
        statsResultsPanel.add(ui.Label('Sentinel-1 Pre VH (2020):', {fontWeight: 'bold', color: '00AA00'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + pre_vals['VH_dB_mean'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + pre_vals['VH_dB_min'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + pre_vals['VH_dB_max'].toFixed(2) + ' dB', {fontSize: '11px'}));
        
        statsResultsPanel.add(ui.Label('Sentinel-1 Post VH (2024):', {fontWeight: 'bold', color: '0088FF'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + post_vals['VH_dB_mean'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + post_vals['VH_dB_min'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + post_vals['VH_dB_max'].toFixed(2) + ' dB', {fontSize: '11px'}));
        
        var delta = post_vals['VH_dB_mean'] - pre_vals['VH_dB_mean'];
        statsResultsPanel.add(ui.Label('Mean change: ' + delta.toFixed(2) + ' dB', 
          {fontWeight: 'bold', color: delta > 0 ? '00AA00' : 'FF0000'}));
      });
    });
  },
  style: {width: '300px'}
});
panel.add(btnStats);

var btnStatsVV = ui.Button({
  label: '📊 Calculate Sentinel-1 VV C-band statistics',
  onClick: function() {
    statsResultsPanel.clear();
    statsResultsPanel.style().set('shown', true);
    
    var statsPre = pre.select('VV_dB').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    var statsPost = post.select('VV_dB').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    statsPre.evaluate(function(pre_vals) {
      statsPost.evaluate(function(post_vals) {
        statsResultsPanel.clear();
        statsResultsPanel.add(ui.Label('Band: VV (co-pol, water/surface)', {color: '666', fontSize: '10px', fontStyle: 'italic'}));
        statsResultsPanel.add(ui.Label('Sentinel-1 Pre VV (2020):', {fontWeight: 'bold', color: '00AA00'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + pre_vals['VV_dB_mean'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + pre_vals['VV_dB_min'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + pre_vals['VV_dB_max'].toFixed(2) + ' dB', {fontSize: '11px'}));
        
        statsResultsPanel.add(ui.Label('Sentinel-1 Post VV (2024):', {fontWeight: 'bold', color: '0088FF'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + post_vals['VV_dB_mean'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + post_vals['VV_dB_min'].toFixed(2) + ' dB', {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + post_vals['VV_dB_max'].toFixed(2) + ' dB', {fontSize: '11px'}));
        
        var delta = post_vals['VV_dB_mean'] - pre_vals['VV_dB_mean'];
        statsResultsPanel.add(ui.Label('Mean change: ' + delta.toFixed(2) + ' dB', 
          {fontWeight: 'bold', color: delta > 0 ? '00AA00' : 'FF0000'}));
      });
    });
  },
  style: {width: '300px'}
});
panel.add(btnStatsVV);

var btnStatsPALSAR_HH = ui.Button({
  label: '📊 Calculate PALSAR-2 HH L-band statistics',
  onClick: function() {
    statsResultsPanel.clear();
    statsResultsPanel.style().set('shown', true);
    
    var stats2020 = palsar2_2020.select('HH').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    var stats2023 = palsar2_2023.select('HH').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    stats2020.evaluate(function(vals2020) {
      stats2023.evaluate(function(vals2023) {
        statsResultsPanel.clear();
        statsResultsPanel.add(ui.Label('Band: HH (co-pol, surface)', {color: '666', fontSize: '10px', fontStyle: 'italic'}));
        statsResultsPanel.add(ui.Label('PALSAR-2 HH (2020):', {fontWeight: 'bold', color: '00AA00'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + vals2020['HH_mean'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + vals2020['HH_min'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + vals2020['HH_max'].toFixed(2), {fontSize: '11px'}));
        
        statsResultsPanel.add(ui.Label('PALSAR-2 HH (2023):', {fontWeight: 'bold', color: '0088FF'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + vals2023['HH_mean'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + vals2023['HH_min'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + vals2023['HH_max'].toFixed(2), {fontSize: '11px'}));
        
        var delta = vals2023['HH_mean'] - vals2020['HH_mean'];
        statsResultsPanel.add(ui.Label('Mean change: ' + delta.toFixed(2), 
          {fontWeight: 'bold', color: delta > 0 ? '00AA00' : 'FF0000'}));
      });
    });
  },
  style: {width: '300px'}
});
panel.add(btnStatsPALSAR_HH);

var btnStatsPALSAR_HV = ui.Button({
  label: '📊 Calculate PALSAR-2 HV L-band statistics',
  onClick: function() {
    statsResultsPanel.clear();
    statsResultsPanel.style().set('shown', true);
    
    var stats2020 = palsar2_2020.select('HV').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    var stats2023 = palsar2_2023.select('HV').reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    stats2020.evaluate(function(vals2020) {
      stats2023.evaluate(function(vals2023) {
        statsResultsPanel.clear();
        statsResultsPanel.add(ui.Label('Band: HV (cross-pol, vegetation)', {color: '666', fontSize: '10px', fontStyle: 'italic'}));
        statsResultsPanel.add(ui.Label('PALSAR-2 HV (2020):', {fontWeight: 'bold', color: '00AA00'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + vals2020['HV_mean'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + vals2020['HV_min'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + vals2020['HV_max'].toFixed(2), {fontSize: '11px'}));
        
        statsResultsPanel.add(ui.Label('PALSAR-2 HV (2023):', {fontWeight: 'bold', color: '0088FF'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + vals2023['HV_mean'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + vals2023['HV_min'].toFixed(2), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + vals2023['HV_max'].toFixed(2), {fontSize: '11px'}));
        
        var delta = vals2023['HV_mean'] - vals2020['HV_mean'];
        statsResultsPanel.add(ui.Label('Mean change: ' + delta.toFixed(2), 
          {fontWeight: 'bold', color: delta > 0 ? '00AA00' : 'FF0000'}));
      });
    });
  },
  style: {width: '300px'}
});
panel.add(btnStatsPALSAR_HV);

var btnStatsNDVI = ui.Button({
  label: '📊 Calculate Sentinel-2 NDVI statistics',
  onClick: function() {
    statsResultsPanel.clear();
    statsResultsPanel.style().set('shown', true);
    
    var statsPre = ndvi_pre.reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    var statsPost = ndvi_post.reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: aoi,
      scale: 100,
      maxPixels: 1e10
    });
    
    statsPre.evaluate(function(pre_vals) {
      statsPost.evaluate(function(post_vals) {
        statsResultsPanel.clear();
        statsResultsPanel.add(ui.Label('Index: NDVI (vegetation)', {color: '666', fontSize: '10px', fontStyle: 'italic'}));
        statsResultsPanel.add(ui.Label('Sentinel-2 NDVI Pre (2020):', {fontWeight: 'bold', color: '00AA00'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + pre_vals['NDVI_pre_mean'].toFixed(3), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + pre_vals['NDVI_pre_min'].toFixed(3), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + pre_vals['NDVI_pre_max'].toFixed(3), {fontSize: '11px'}));
        
        statsResultsPanel.add(ui.Label('Sentinel-2 NDVI Post (2024):', {fontWeight: 'bold', color: '0088FF'}));
        statsResultsPanel.add(ui.Label('  Mean: ' + post_vals['NDVI_post_mean'].toFixed(3), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Min: ' + post_vals['NDVI_post_min'].toFixed(3), {fontSize: '11px'}));
        statsResultsPanel.add(ui.Label('  Max: ' + post_vals['NDVI_post_max'].toFixed(3), {fontSize: '11px'}));
        
        var delta = post_vals['NDVI_post_mean'] - pre_vals['NDVI_pre_mean'];
        statsResultsPanel.add(ui.Label('Mean change: ' + delta.toFixed(3), 
          {fontWeight: 'bold', color: delta > 0 ? '00AA00' : 'FF0000'}));
      });
    });
  },
  style: {width: '300px'}
});
panel.add(btnStatsNDVI);

var statsResultsPanel = ui.Panel({style: {shown: false}});
panel.add(statsResultsPanel);

var sliderLegendPanel = ui.Panel({
  style: {
    position: 'top-right', 
    padding: '8px', 
    backgroundColor: 'white', 
    width: '200px',
    margin: '60px 10px 0 0'
  }
});

function updateSliderLegend() {
  sliderLegendPanel.clear();
  sliderLegendPanel.add(ui.Label('🎬 Temporal Comparison', {fontWeight: 'bold', fontSize: '13px', color: 'FF0000'}));
  sliderLegendPanel.add(ui.Label('Type: ' + sliderTypeSelect.getValue(), {fontSize: '11px', color: '666', fontWeight: 'bold'}));
  sliderLegendPanel.add(ui.Label('Layers accumulate (do not disappear)', {fontSize: '10px', color: '999', fontStyle: 'italic'}));
  sliderLegendPanel.add(ui.Label('─────────────────', {fontSize: '10px'}));
  
  if (sliderLayerType === 'VH_Cband') {
    sliderLegendPanel.add(ui.Label('VH C-band (cross-pol):', {fontSize: '10px', fontWeight: 'bold'}));
    sliderLegendPanel.add(makeLegendRow('000000', 'Black: Water (-25 dB)'));
    sliderLegendPanel.add(makeLegendRow('0b1559', 'Dark blue: Wet soil (-20 dB)'));
    sliderLegendPanel.add(makeLegendRow('1b4fd0', 'Blue: Grasslands (-17 dB)'));
    sliderLegendPanel.add(makeLegendRow('58c5f1', 'Cyan: Shrubs (-15 dB)'));
    sliderLegendPanel.add(makeLegendRow('f9f871', 'Yellow: Medium veg (-12 dB)'));
    sliderLegendPanel.add(makeLegendRow('ffffff', 'White: Forests (-10 dB)'));
    sliderLegendPanel.add(ui.Label('Vegetation volume', {fontSize: '9px', fontStyle: 'italic', color: '999'}));
  } else if (sliderLayerType === 'VH_Grises') {
    sliderLegendPanel.add(ui.Label('VH Grayscale:', {fontSize: '10px', fontWeight: 'bold'}));
    sliderLegendPanel.add(makeLegendRow('000000', 'Black: Water (-25 dB)'));
    sliderLegendPanel.add(makeLegendRow('404040', 'Dark gray: Soil (-20 dB)'));
    sliderLegendPanel.add(makeLegendRow('808080', 'Medium gray: Grasslands (-12 dB)'));
    sliderLegendPanel.add(makeLegendRow('c0c0c0', 'Light gray: Medium veg (-5 dB)'));
    sliderLegendPanel.add(makeLegendRow('ffffff', 'White: Forests (0 dB)'));
    sliderLegendPanel.add(ui.Label('Texture analysis', {fontSize: '9px', fontStyle: 'italic', color: '999'}));
  } else if (sliderLayerType === 'VV_Cband') {
    sliderLegendPanel.add(ui.Label('VV C-band (co-pol):', {fontSize: '10px', fontWeight: 'bold'}));
    sliderLegendPanel.add(makeLegendRow('000000', 'Black: Water (-20 dB)'));
    sliderLegendPanel.add(makeLegendRow('14213d', 'Dark blue: Soil (-15 dB)'));
    sliderLegendPanel.add(makeLegendRow('277da1', 'Blue: Low veg (-10 dB)'));
    sliderLegendPanel.add(makeLegendRow('90be6d', 'Green: Medium veg (-7 dB)'));
    sliderLegendPanel.add(makeLegendRow('f9c74f', 'Yellow: Forests (-5 dB)'));
    sliderLegendPanel.add(makeLegendRow('ffffff', 'White: Urban'));
    sliderLegendPanel.add(ui.Label('Surface roughness', {fontSize: '9px', fontStyle: 'italic', color: '999'}));
  } else if (sliderLayerType === 'RGB_Cband') {
    sliderLegendPanel.add(ui.Label('RGB Composite:', {fontSize: '10px', fontWeight: 'bold'}));
    sliderLegendPanel.add(ui.Label('R: VV | G: VH | B: Ratio', {fontSize: '9px', color: '666'}));
    sliderLegendPanel.add(makeLegendRow('0000FF', 'Blue: Water'));
    sliderLegendPanel.add(makeLegendRow('8B008B', 'Purple: Wetland'));
    sliderLegendPanel.add(makeLegendRow('FF00FF', 'Magenta: Urban'));
    sliderLegendPanel.add(makeLegendRow('FFFF00', 'Yellow: Grassland'));
    sliderLegendPanel.add(makeLegendRow('00FF00', 'Green: Forest'));
  } else if (sliderLayerType === 'PALSAR2_HH') {
    sliderLegendPanel.add(ui.Label('PALSAR-2 HH L-band:', {fontSize: '10px', fontWeight: 'bold'}));
    sliderLegendPanel.add(makeLegendRow('000000', 'Black: Water (0-2k)'));
    sliderLegendPanel.add(makeLegendRow('0b1559', 'Dark blue: Soil (2-4k)'));
    sliderLegendPanel.add(makeLegendRow('1b4fd0', 'Blue: Grassland (4-6k)'));
    sliderLegendPanel.add(makeLegendRow('58c5f1', 'Cyan: Shrubs (6-8k)'));
    sliderLegendPanel.add(makeLegendRow('f9f871', 'Yellow: Forest (8-9k)'));
    sliderLegendPanel.add(makeLegendRow('ffffff', 'White: Biomass (>9k)'));
    sliderLegendPanel.add(ui.Label('Only 2020 and 2023', {fontSize: '9px', fontStyle: 'italic', color: '999'}));
  } else if (sliderLayerType === 'PALSAR2_HV') {
    sliderLegendPanel.add(ui.Label('PALSAR-2 HV L-band:', {fontSize: '10px', fontWeight: 'bold'}));
    sliderLegendPanel.add(makeLegendRow('000000', 'Black: Water (0-1k)'));
    sliderLegendPanel.add(makeLegendRow('0b1559', 'Dark blue: Soil (1-2k)'));
    sliderLegendPanel.add(makeLegendRow('1b4fd0', 'Blue: Low veg (2-3k)'));
    sliderLegendPanel.add(makeLegendRow('58c5f1', 'Cyan: Shrubs (3-4k)'));
    sliderLegendPanel.add(makeLegendRow('f9f871', 'Yellow: Forest (4-5k)'));
    sliderLegendPanel.add(makeLegendRow('ffffff', 'White: Dense forest (>5k)'));
    sliderLegendPanel.add(ui.Label('Only 2020 and 2023', {fontSize: '9px', fontStyle: 'italic', color: '999'}));
  } else if (sliderLayerType === 'NDVI') {
    sliderLegendPanel.add(ui.Label('NDVI (Sentinel-2):', {fontSize: '10px', fontWeight: 'bold'}));
    sliderLegendPanel.add(makeLegendRow('8B4513', 'Brown: Soil / Water (-0.2)'));
    sliderLegendPanel.add(makeLegendRow('FFFF00', 'Yellow: Sparse veg (0.2)'));
    sliderLegendPanel.add(makeLegendRow('ADFF2F', 'Yellow-green: Mod. veg (0.4)'));
    sliderLegendPanel.add(makeLegendRow('90EE90', 'Light green: Crops (0.5)'));
    sliderLegendPanel.add(makeLegendRow('228B22', 'Green: Shrubs (0.7)'));
    sliderLegendPanel.add(makeLegendRow('006400', 'Dark green: Forests (0.8+)'));
    sliderLegendPanel.add(ui.Label('Only Pre and Post available', {fontSize: '9px', fontStyle: 'italic', color: '999'}));
  }
}

Map.add(panel);
Map.add(sliderLegendPanel);
Map.add(legendPanel);

updateLegend('1. Pre VH (2020) - Color');
updateSliderLegend();

print('=== DIAGNOSTICS ===');
print('AOI - Complete Delta');
print('PRE bands:', pre.bandNames());
print('POST bands:', post.bandNames());

var countPre = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi).filterDate(preRange.start, preRange.end)
  .filter(ee.Filter.eq('instrumentMode', 'IW')).size();
var countPost = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi).filterDate(postRange.start, postRange.end)
  .filter(ee.Filter.eq('instrumentMode', 'IW')).size();

print('S1 PRE images (2020):', countPre);
print('S1 POST images (2024):', countPost);

var preStats = pre.select('VH_dB').reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: aoi,
  scale: 100,
  maxPixels: 1e9
});
print('Pre VH min/max:', preStats);

var postStats = post.select('VH_dB').reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: aoi,
  scale: 100,
  maxPixels: 1e9
});
print('Post VH min/max:', postStats);

print('Complete script loaded ✓');
print('Use left panel to navigate layers');
print('Use checkboxes for overlays (Fire hotspots, water)');
