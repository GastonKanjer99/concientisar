var aoi = ee.Geometry.Polygon([
    [[-60.95, -34.20], [-60.95, -32.20], [-59.90, -32.20], 
     [-58.50, -33.00], [-58.50, -34.20], [-60.95, -34.20]]
  ]);
  
  Map.centerObject(aoi, 9);
  Map.addLayer(ee.Image().paint(ee.FeatureCollection(aoi), 0, 2), 
    {palette:['yellow']}, 'Paraná River Delta', true, 0.5);
  
  var pre    = {start: '2020-08-01', end: '2020-09-15'};
  var during = {start: '2020-10-01', end: '2020-10-15'};
  var post   = {start: '2024-08-01', end: '2024-09-15'};
  
  var s1_pre = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi).filterDate(pre.start, pre.end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VH').median().clip(aoi);
  
  var s1_dur = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi).filterDate(during.start, during.end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VH').median().clip(aoi);
  
  var s1_post = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi).filterDate(post.start, post.end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VH').median().clip(aoi);
  
  var s1_pre_vv = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi).filterDate(pre.start, pre.end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VV').median().clip(aoi);
  var s1_dur_vv = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi).filterDate(during.start, during.end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VV').median().clip(aoi);
  var s1_post_vv = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi).filterDate(post.start, post.end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VV').median().clip(aoi);
  
  var pre_rgb  = s1_pre_vv.addBands(s1_pre).addBands(s1_pre_vv.subtract(s1_pre).rename('VVminusVH'))
    .rename(['VV','VH','VVminusVH']);
  var dur_rgb  = s1_dur_vv.addBands(s1_dur).addBands(s1_dur_vv.subtract(s1_dur).rename('VVminusVH'))
    .rename(['VV','VH','VVminusVH']);
  var post_rgb = s1_post_vv.addBands(s1_post).addBands(s1_post_vv.subtract(s1_post).rename('VVminusVH'))
    .rename(['VV','VH','VVminusVH']);
  
  var palsar_hh_2020 = ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
    .filterBounds(aoi).filterDate('2020-01-01', '2020-12-31')
    .select('HH').median().clip(aoi);
  var palsar_hh_2023 = ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
    .filterBounds(aoi).filterDate('2023-01-01', '2023-12-31')
    .select('HH').median().clip(aoi);
  var palsar_hv_2020 = ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
    .filterBounds(aoi).filterDate('2020-01-01', '2020-12-31')
    .select('HV').median().clip(aoi);
  var palsar_hv_2023 = ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
    .filterBounds(aoi).filterDate('2023-01-01', '2023-12-31')
    .select('HV').median().clip(aoi);
  
  var ndvi_pre = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi).filterDate(pre.start, pre.end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .select(['B4', 'B8']).median()
    .normalizedDifference(['B8', 'B4']).clip(aoi);
  
  var ndvi_post = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi).filterDate(post.start, post.end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .select(['B4', 'B8']).median()
    .normalizedDifference(['B8', 'B4']).clip(aoi);
  
  var modis_fire = ee.ImageCollection('MODIS/006/MOD14A1')
    .filterDate(during.start, during.end)
    .filterBounds(aoi)
    .select('FireMask');
  var fireComposite = modis_fire.max().clip(aoi);
  var firePoints = fireComposite.gt(7);
  
  var water = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence').clip(aoi);
  var landMask = water.lt(80);
  
  var delta_cband = s1_post.subtract(s1_pre).updateMask(landMask);
  var delta_lband = palsar_hv_2023.subtract(palsar_hv_2020).updateMask(landMask);
  var delta_ndvi = ndvi_post.subtract(ndvi_pre).updateMask(landMask);
  
  var deltaVis = {min: -5, max: 5, palette: ['red','white','green']};
  var ndviDeltaVis = {min: -0.5, max: 0.5, palette: ['red','white','green']};
  var vhVis = {min: -25, max: -10, palette: ['000000','1b4fd0','58c5f1','f9f871','ffffff']};
  var vvVis = {min: -20, max: -5, palette: ['000000','14213d','277da1','90be6d','f9c74f','ffffff']};
  var rgbVis = {min: [-18, -22, 2], max: [-5, -10, 12]};
  var viirsVis = {min: 0, max: 1, palette: ['FF6600']};
  var palsarVis = {min: 0, max: 10000, palette: ['000000','0b1559','1b4fd0','58c5f1','f9f871','ffffff']};
  
  var lyr_cband = Map.addLayer(delta_cband, deltaVis, 'C-band: Surface Changes', false);
  var lyr_lband = Map.addLayer(delta_lband, deltaVis, 'L-band: Biomass Changes', false);
  var lyr_ndvi = Map.addLayer(delta_ndvi, ndviDeltaVis, 'NDVI: Vegetation Changes', false);
  
  var lyr_vh_pre = Map.addLayer(s1_pre, vhVis, 'VH Pre (2020)', false);
  var lyr_vh_dur = Map.addLayer(s1_dur, vhVis, 'VH During (oct-2020)', false);
  var lyr_vh_post= Map.addLayer(s1_post, vhVis, 'VH Post (2024)', false);
  
  var lyr_vv_pre  = Map.addLayer(s1_pre_vv, vvVis, 'VV Pre (2020)', false);
  var lyr_vv_dur  = Map.addLayer(s1_dur_vv, vvVis, 'VV During (oct-2020)', false);
  var lyr_vv_post = Map.addLayer(s1_post_vv, vvVis, 'VV Post (2024)', false);
  
  var lyr_rgb_pre  = Map.addLayer(pre_rgb.select(['VV','VH','VVminusVH']), rgbVis, 'RGB SAR Pre (2020)', false);
  var lyr_rgb_dur  = Map.addLayer(dur_rgb.select(['VV','VH','VVminusVH']), rgbVis, 'RGB SAR During (oct-2020)', false);
  var lyr_rgb_post = Map.addLayer(post_rgb.select(['VV','VH','VVminusVH']), rgbVis, 'RGB SAR Post (2024)', false);
  
  var lyrFire = Map.addLayer(firePoints.selfMask(), viirsVis, 'MODIS Fire Hotspots (oct-2020)', false);
  
  var lyr_palsar_hh_2020 = Map.addLayer(palsar_hh_2020, palsarVis, 'PALSAR-2 HH (2020)', false);
  var lyr_palsar_hh_2023 = Map.addLayer(palsar_hh_2023, palsarVis, 'PALSAR-2 HH (2023)', false);
  var lyr_palsar_hv_2020 = Map.addLayer(palsar_hv_2020, palsarVis, 'PALSAR-2 HV (2020)', false);
  var lyr_palsar_hv_2023 = Map.addLayer(palsar_hv_2023, palsarVis, 'PALSAR-2 HV (2023)', false);
  
  var panel = ui.Panel({
    style: {position: 'top-left', width: '380px', height: '75%', padding: '10px'}
  });
  
  panel.add(ui.Label('🛰 Paraná River Delta', 
    {fontWeight: 'bold', fontSize: '18px', color: '0000FF'}));
  panel.add(ui.Label('Multi-frequency Analysis 2020-2024', 
    {fontSize: '12px', color: '666'}));
  panel.add(ui.Label('─────────────────────────────', {fontSize: '10px'}));
  
  panel.add(ui.Label('Select a comparison:', 
    {fontWeight: 'bold', margin: '10px 0 5px 0'}));
  
  var activeLayer = null;
  
  function showLayer(layer, name, description) {
    [lyr_vh_pre, lyr_vh_dur, lyr_vh_post,
     lyr_vv_pre, lyr_vv_dur, lyr_vv_post,
     lyr_rgb_pre, lyr_rgb_dur, lyr_rgb_post,
     lyr_palsar_hh_2020, lyr_palsar_hh_2023,
     lyr_palsar_hv_2020, lyr_palsar_hv_2023].forEach(function(l){ l.setShown(false); l.setOpacity(1); });
  
    temporalModeActive = false;
  
    if (activeLayer) activeLayer.setShown(false);
    layer.setShown(true);
    activeLayer = layer;
    infoPanel.clear();
    infoPanel.add(ui.Label('📊 ' + name, {fontWeight: 'bold', fontSize: '13px', color: '0000FF'}));
    infoPanel.add(ui.Label(description, {fontSize: '11px', margin: '5px 0'}));
    infoPanel.style().set('shown', true);
  }
  
  var btn1 = ui.Button({
    label: '1️⃣ C-band: Surface Changes',
    onClick: function() {
      showLayer(lyr_cband, 'Sentinel-1 C-band (5.6 cm)', 
        '🔴 Red: Surface vegetation loss\n' +
        '⚪ White: No changes\n' +
        '🟢 Green: Recovery/growth\n\n' +
        '💡 Detects: Moisture, surface cover, rapid changes');
    },
    style: {width: '320px', margin: '5px 0', padding: '8px'}
  });
  panel.add(btn1);
  
  var btn2 = ui.Button({
    label: '2️⃣ L-band: Biomass Changes',
    onClick: function() {
      showLayer(lyr_lband, 'PALSAR-2 L-band (23.6 cm)', 
        '🔴 Red: Deep biomass loss\n' +
        '⚪ White: No structural changes\n' +
        '🟢 Green: Biomass increase\n\n' +
        '💡 Detects: Forest structure, woody biomass, canopy penetration');
    },
    style: {width: '320px', margin: '5px 0', padding: '8px'}
  });
  panel.add(btn2);
  
  var btn3 = ui.Button({
    label: '3️⃣ NDVI: Vegetation Changes',
    onClick: function() {
      showLayer(lyr_ndvi, 'Sentinel-2 Optical NDVI', 
        '🔴 Red: Green vegetation loss\n' +
        '⚪ White: No changes\n' +
        '🟢 Green: Greenness increase\n\n' +
        '💡 Detects: Plant health, chlorophyll, active photosynthesis');
    },
    style: {width: '320px', margin: '5px 0', padding: '8px'}
  });
  panel.add(btn3);
  
  panel.add(ui.Label('─────────────────────────────', {fontSize: '10px', margin: '10px 0'}));
  
  panel.add(ui.Label('Additional layers (overlay):', {fontWeight: 'bold', margin: '10px 0 5px 0'}));
  var chkFire = ui.Checkbox({
    label: 'MODIS Fire Hotspots (oct-2020)', value: false,
    onChange: function(v){ lyrFire.setShown(v); }
  });
  panel.add(chkFire);
  
  var infoPanel = ui.Panel({style: {shown: false, padding: '8px', backgroundColor: 'f0f0f0'}});
  panel.add(infoPanel);
  
  panel.add(ui.Label('─────────────────────────────', {fontSize: '10px', margin: '10px 0'}));
  
  panel.add(ui.Label('Temporal transition:', {fontWeight: 'bold', margin: '8px 0 4px 0', color: 'FF0000'}));
  panel.add(ui.Label('Pre → During → Post (or 2020 → 2023 in L-band): select type and move slider', {fontSize: '11px', fontStyle: 'italic'}));
  
  var sliderLayerType = 'VH';
  var temporalModeActive = true;
  var sliderTypeSelect = ui.Select({
    items: [
      '1. Sentinel-1 VH C-band',
      '2. Sentinel-1 VV C-band',
      '3. Sentinel-1 RGB C-band',
      '4. PALSAR-2 HH L-band',
      '5. PALSAR-2 HV L-band'
    ],
    value: '1. Sentinel-1 VH C-band',
    placeholder: 'Layer type',
    onChange: function(type){
      if (type.indexOf('VH C-band') >= 0 && type.indexOf('RGB') < 0) sliderLayerType = 'VH';
      else if (type.indexOf('VV C-band') >= 0) sliderLayerType = 'VV';
      else if (type.indexOf('RGB') >= 0) sliderLayerType = 'RGB';
      else if (type.indexOf('HH L-band') >= 0) sliderLayerType = 'PALSAR2_HH';
      else sliderLayerType = 'PALSAR2_HV';
      temporalModeActive = true;
      updateTemporalLayers(temporalSlider.getValue());
      updateSliderLegend();
    },
    style: {width: '260px'}
  });
  panel.add(sliderTypeSelect);
  
  var sliderLabel = ui.Label('Period: Pre (100%)', {fontSize: '11px', color: '008800'});
  panel.add(sliderLabel);
  
  var rightLegendPanel = ui.Panel({
    style: {position: 'top-right', padding: '8px', backgroundColor: 'white', width: '240px', border: '1px solid #ddd'}
  });
  Map.add(rightLegendPanel);
  
  function legendRow(color, text) {
    var box = ui.Label({
      style: {backgroundColor: color, padding: '10px', margin: '0 6px 0 0', border: '1px solid #aaa', width: '20px'}
    });
    var lbl = ui.Label({value: text, style: {fontSize: '10px'}});
    return ui.Panel({widgets: [box, lbl], layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '2px 0'}});
  }
  
  function updateSliderLegend() {
    rightLegendPanel.clear();
    rightLegendPanel.add(ui.Label('Legend (slider mode)', {fontWeight: 'bold', fontSize: '12px'}));
    if (sliderLayerType === 'VH') {
      rightLegendPanel.add(ui.Label('Sentinel-1 VH (dB)', {fontWeight: 'bold', fontSize: '11px'}));
      rightLegendPanel.add(legendRow('#000000', 'Very low (water/smooth)'));
      rightLegendPanel.add(legendRow('#1b4fd0', 'Low (wet soil)'));
      rightLegendPanel.add(legendRow('#58c5f1', 'Medium (mixed)'));
      rightLegendPanel.add(legendRow('#f9f871', 'High (vegetation)'));
      rightLegendPanel.add(legendRow('#ffffff', 'Very high (structure)'));
    } else if (sliderLayerType === 'VV') {
      rightLegendPanel.add(ui.Label('Sentinel-1 VV (dB)', {fontWeight: 'bold', fontSize: '11px'}));
      rightLegendPanel.add(legendRow('#000000', 'Very low (water)'));
      rightLegendPanel.add(legendRow('#14213d', 'Low (soil)'));
      rightLegendPanel.add(legendRow('#277da1', 'Medium (mixed)'));
      rightLegendPanel.add(legendRow('#90be6d', 'High (vegetation)'));
      rightLegendPanel.add(legendRow('#ffffff', 'Very high (structure)'));
    } else if (sliderLayerType === 'RGB') {
      rightLegendPanel.add(ui.Label('RGB SAR', {fontWeight: 'bold', fontSize: '11px'}));
      rightLegendPanel.add(legendRow('#ff0000', 'Red = VV (surface)'));
      rightLegendPanel.add(legendRow('#00ff00', 'Green = VH (vegetation)'));
      rightLegendPanel.add(legendRow('#0000ff', 'Blue = VV−VH (contrast)'));
      rightLegendPanel.add(ui.Label('• Red↑: smooth surfaces  • Green↑: vegetation  • Blue↑: VV>VH', {fontSize: '10px', margin: '6px 0 0 0'}));
    } else if (sliderLayerType === 'PALSAR2_HH') {
      rightLegendPanel.add(ui.Label('PALSAR-2 HH (DN)', {fontWeight: 'bold', fontSize: '11px'}));
      rightLegendPanel.add(legendRow('#000000', 'Low (water)'));
      rightLegendPanel.add(legendRow('#1b4fd0', 'Medium-low (soil)'));
      rightLegendPanel.add(legendRow('#58c5f1', 'Medium (mixed)'));
      rightLegendPanel.add(legendRow('#f9f871', 'High (vegetation)'));
      rightLegendPanel.add(legendRow('#ffffff', 'Very high (structure)'));
    } else if (sliderLayerType === 'PALSAR2_HV') {
      rightLegendPanel.add(ui.Label('PALSAR-2 HV (DN)', {fontWeight: 'bold', fontSize: '11px'}));
      rightLegendPanel.add(legendRow('#000000', 'Low (water)'));
      rightLegendPanel.add(legendRow('#1b4fd0', 'Medium-low (soil)'));
      rightLegendPanel.add(legendRow('#58c5f1', 'Medium (vegetation)'));
      rightLegendPanel.add(legendRow('#f9f871', 'High (dense vegetation)'));
      rightLegendPanel.add(legendRow('#ffffff', 'Very high (structure)'));
    }
  }
  
  function updateTemporalLayers(value) {
    if (temporalModeActive && activeLayer) { activeLayer.setShown(false); activeLayer = null; }
  
    [lyr_vh_pre, lyr_vh_dur, lyr_vh_post,
     lyr_vv_pre, lyr_vv_dur, lyr_vv_post,
     lyr_rgb_pre, lyr_rgb_dur, lyr_rgb_post,
     lyr_palsar_hh_2020, lyr_palsar_hh_2023,
     lyr_palsar_hv_2020, lyr_palsar_hv_2023].forEach(function(l){ l.setShown(false); l.setOpacity(1); });
  
    var layers = [];
    var hasThree = true;
    if (sliderLayerType === 'VH')        layers = [lyr_vh_pre,  lyr_vh_dur,  lyr_vh_post];
    else if (sliderLayerType === 'VV')   layers = [lyr_vv_pre,  lyr_vv_dur,  lyr_vv_post];
    else if (sliderLayerType === 'RGB')  layers = [lyr_rgb_pre, lyr_rgb_dur, lyr_rgb_post];
    else if (sliderLayerType === 'PALSAR2_HH') { layers = [lyr_palsar_hh_2020, lyr_palsar_hh_2023]; hasThree = false; }
    else { layers = [lyr_palsar_hv_2020, lyr_palsar_hv_2023]; hasThree = false; }
  
    var opacity1, opacity2, opacity3;
    if (!hasThree) {
      if (value === 0) {
        opacity1 = 1;
        opacity2 = 0;
      } else {
        opacity1 = Math.min(1, value * 2); if (opacity1 > 1) opacity1 = 1;
        opacity2 = value / 2;
      }
      layers[0].setShown(true); layers[0].setOpacity(opacity1);
      layers[1].setShown(opacity2 > 0); layers[1].setOpacity(opacity2);
      var labelTxt = (sliderLayerType === 'PALSAR2_HH' || sliderLayerType === 'PALSAR2_HV') ? '2020 → 2023' : 'Pre → Post';
      sliderLabel.setValue(value < 1 ?
        'Period: Pre (' + Math.round(opacity1*100) + '%)' :
        labelTxt + ' (' + Math.round(opacity2*100) + '% second layer)');
      sliderLabel.style().set('color', value < 1 ? '008800' : '0088FF');
      return;
    }
  
    if (value <= 1) {
      var t = value;
      if (value === 0) {
        opacity1 = 1;
        opacity2 = 0;
        opacity3 = 0;
      } else {
        opacity1 = Math.min(1, value * 2); if (opacity1 > 1) opacity1 = 1;
        opacity2 = t;
        opacity3 = 0;
      }
      sliderLabel.setValue(value < 0.5 ?
        'Period: Pre (' + Math.round(opacity1*100) + '%)' :
        'Period: Pre + During (' + Math.round(opacity2*100) + '% During)');
      sliderLabel.style().set('color', value < 0.5 ? '008800' : 'AA8800');
    } else {
      var t2 = value - 1;
      opacity1 = 1; opacity2 = 1; opacity3 = t2;
      sliderLabel.setValue('Period: Pre + During + Post (' + Math.round(opacity3*100) + '% Post)');
      sliderLabel.style().set('color', '0088FF');
    }
  
    layers[0].setShown(true);              layers[0].setOpacity(opacity1);
    layers[1].setShown(opacity2 > 0);      layers[1].setOpacity(opacity2);
    layers[2].setShown(opacity3 > 0);      layers[2].setOpacity(opacity3);
  }
  
  var temporalSlider = ui.Slider({
    min: 0, max: 2, value: 0, step: 0.05,
    style: {width: '300px', padding: '5px'},
    onChange: function(v){ temporalModeActive = true; updateTemporalLayers(v); }
  });
  panel.add(temporalSlider);
  
  var navPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '5px 0'}});
  var btnPre = ui.Button({label: '◀ Pre', onClick: function(){ temporalModeActive = true; temporalSlider.setValue(0); updateTemporalLayers(0); }, style: {width: '80px'}});
  var btnDur = ui.Button({label: '● During', onClick: function(){ temporalModeActive = true; temporalSlider.setValue(1); updateTemporalLayers(1); }, style: {width: '100px'}});
  var btnPost= ui.Button({label: 'Post ▶', onClick: function(){ temporalModeActive = true; temporalSlider.setValue(2); updateTemporalLayers(2); }, style: {width: '80px'}});
  navPanel.add(btnPre); navPanel.add(btnDur); navPanel.add(btnPost);
  panel.add(navPanel);
  
  temporalModeActive = true;
  updateTemporalLayers(0);
  updateSliderLegend();
  
  panel.add(ui.Label('─────────────────────────────', {fontSize: '10px', margin: '10px 0'}));
  
  panel.add(ui.Label('📈 Quick Statistics', {fontWeight: 'bold', margin: '10px 0 5px 0'}));
  
  var statsPanel = ui.Panel({style: {shown: false}});
  panel.add(statsPanel);
  
  var btnStats = ui.Button({
    label: '📊 Calculate average changes',
    onClick: function() {
      statsPanel.clear();
      statsPanel.style().set('shown', true);
      statsPanel.add(ui.Label('Calculating...', {color: '999'}));
      
      var stats_cband = delta_cband.reduceRegion({
        reducer: ee.Reducer.mean(), geometry: aoi, scale: 100, maxPixels: 1e9
      });
      var stats_lband = delta_lband.reduceRegion({
        reducer: ee.Reducer.mean(), geometry: aoi, scale: 100, maxPixels: 1e9
      });
      var stats_ndvi = delta_ndvi.reduceRegion({
        reducer: ee.Reducer.mean(), geometry: aoi, scale: 100, maxPixels: 1e9
      });
  
      stats_cband.evaluate(function(c) {
        stats_lband.evaluate(function(l) {
          stats_ndvi.evaluate(function(n) {
            statsPanel.clear();
            var cband_val = c.VH;
            var lband_val = l.HV;
            var ndvi_val = n.nd;
            statsPanel.add(ui.Label('Average change 2020→2024:', {fontWeight: 'bold', fontSize: '11px'}));
            statsPanel.add(ui.Label('C-band: ' + cband_val.toFixed(2) + ' dB', 
              {fontSize: '11px', color: cband_val < 0 ? 'FF0000' : '00AA00'}));
            statsPanel.add(ui.Label('L-band: ' + lband_val.toFixed(2) + ' DN', 
              {fontSize: '11px', color: lband_val < 0 ? 'FF0000' : '00AA00'}));
            statsPanel.add(ui.Label('NDVI: ' + ndvi_val.toFixed(3), 
              {fontSize: '11px', color: ndvi_val < 0 ? 'FF0000' : '00AA00'}));
            statsPanel.add(ui.Label('', {margin: '5px 0'}));
            statsPanel.add(ui.Label('🔴 Negative = Degradation', {fontSize: '10px'}));
            statsPanel.add(ui.Label('🟢 Positive = Recovery', {fontSize: '10px'}));
          });
        });
      });
    },
    style: {width: '250px'}
  });
  panel.add(btnStats);
  
  panel.add(ui.Label('─────────────────────────────', {fontSize: '10px', margin: '10px 0'}));
  
  panel.add(ui.Label('📅 Periods:', {fontWeight: 'bold', fontSize: '11px'}));
  panel.add(ui.Label('Pre: Aug 2020', {fontSize: '10px'}));
  panel.add(ui.Label('During: Oct 2020', {fontSize: '10px'}));
  panel.add(ui.Label('Post: Aug 2024 (C-band, NDVI)', {fontSize: '10px'}));
  panel.add(ui.Label('Post: 2023 (L-band)', {fontSize: '10px'}));
  
  panel.add(ui.Label('', {margin: '5px 0'}));
  panel.add(ui.Label('🔥 Event: Fires Oct 2020', {fontSize: '10px', color: 'FF6600'}));
  
  Map.add(panel);
  
  var legend = ui.Panel({
    style: {position: 'bottom-right', padding: '8px', backgroundColor: 'white'}
  });
  legend.add(ui.Label('Change Legend', {fontWeight: 'bold', fontSize: '12px'}));
  legend.add(ui.Label('─────────────────', {fontSize: '10px'}));
  function makeLegendRow(color, label) {
    var colorBox = ui.Label({
      style: {backgroundColor: color, padding: '8px', margin: '0 6px 0 0', border: '1px solid black'}
    });
    var description = ui.Label({value: label, style: {margin: '0', fontSize: '10px'}});
    return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
  }
  legend.add(makeLegendRow('FF0000', 'Loss/Degradation'));
  legend.add(makeLegendRow('FFFFFF', 'No changes'));
  legend.add(makeLegendRow('00FF00', 'Recovery/Growth'));
  Map.add(legend);
  
  print('=== PARANÁ RIVER DELTA - SIMPLE + TEMPORAL ===');
  print('3 comparisons + Pre/Dur/Post slider in VH');
  print('✓ Script ready for GEE');
