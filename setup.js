//====================================================================
var theMap;
var mapMaxZoom = 10;

var xf;
var dataJson = [];

//====================================================================
$(document).ready(function() {


  d3.tsv("NEMO_config_list.tsv", function(data) {
    data.forEach(function(d, i) {
          d.Id = i+1;
          d.Coordinates = eval(d.Coordinates);
    	  dataJson.push({"type": "Feature",
			 "id": d.Id,
			 "properties": {
				"name": d.Name,
				"description": d.Description,
			  	"style": {
            				"weight": 3,
            				"color": d.Color,
            				"opacity": 1,
            			//	"fillColor": d.Color,		// not used, use rather colorCalculator
            				"fillOpacity": 0.3
        			}
			  },
			 "geometry": {
				"type": "Polygon",
				"coordinates": [d.Coordinates]
			  }});
    });

    dataJson = {"type":"FeatureCollection","features": dataJson};
    console.log(dataJson);

    initCrossfilter(data);
 
    theMap = mapChart.map();

    //new L.graticule({ interval: 10, style: { color: '#333', weight: 0.5, opacity: 1. } }).addTo(theMap);
    new L.Control.MousePosition({lngFirst: true}).addTo(theMap);
    new L.Control.zoomHome({homeZoom: 2, homeCoordinates: [45, -20]}).addTo(theMap);
  
    mapmadeUrl = 'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
    mapmade = new L.TileLayer(mapmadeUrl, { maxZoom: mapMaxZoom+1});
    new L.Control.MiniMap(mapmade, { toggleDisplay: true, zoomLevelOffset: -4 }).addTo(theMap);

    $('.leaflet-control-zoomhome-home')[0].click();

    $('#chart-table').on('click', '.dc-table-column', function() {
      id = d3.select(this.parentNode).select(".dc-table-column._0").text();
      dataTable.filter(id);
      dc.redrawAll();
    });

    $('#chart-table').on('mouseover', '.dc-table-column', function() {
      // displays title only if text does not fit in col width
      if (this.offsetWidth < this.scrollWidth) {
        d3.select(this).attr('title', d3.select(this).text());
      }
    });

  });
});

//====================================================================
function initCrossfilter(data) {

  //-----------------------------------
  xf = crossfilter(data);

  //-----------------------------------
  mapDim = xf.dimension(function(d) { return d.Id });
  mapGroup = mapDim.group();

  tagsDim = xf.dimension( function(d) { return d.Tags; });
  tagsGroup = tagsDim.group();

  tableDim = xf.dimension(function(d) { return d.Id });

  //-----------------------------------
  mapChart  = dc.leafletChoroplethChart("#chart-map");

  mapChart
      .width(1000)
      .height(300)
      .dimension(mapDim)
      .group(mapGroup)
      .center([45, -20])
      .zoom(2)         
      .tiles(function(map) {			// overwrite default baselayer
	   return L.tileLayer(
                'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
                { attribution: 'LSCE &copy; 2016 | Baselayer &copy; ArcGis' }).addTo(map); 
      })
      .mapOptions({maxZoom: mapMaxZoom, zoomControl: false})
      .geojson(dataJson.features)
      .featureOptions(function(feature) { return feature.properties.style; })
      .featureKeyAccessor(function(feature) { return feature.id; })
      .colorCalculator(function (d) { return d.Color; })
      .title(function(d) {
		var id = d.key -1;
                return "Name: " + "<b>" + data[id].Name + "</b></br>"
                     + "Description: " + "<b>" +  data[id].Description + "</b></br>"
                     + "Tags: " + "<b>" +  data[id].Tags + "</b></br>"
                     + "Contact: " + "<b>" + data[id].Contact + "</b></br>";
      });
      

//-----------------------------------
  dataCount = dc.dataCount('#chart-count');

  dataCount 
        .dimension(xf)
        .group(xf.groupAll())
        .html({
            some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records',
            all: 'All records selected. Please zoom on the map or click on the table to apply filters.'
        });

//-----------------------------------

// next step will be to use multiple tags
// http://stackoverflow.com/questions/28796895/update-multiple-tags-rowchart-in-dc-js

  tagsChart  = dc.rowChart("#chart-tags");

  tagsChart
    .width(180)
    .height(200)
    .margins({top: 10, right: 10, bottom: 30, left: 10})
    .dimension(tagsDim)
    .group(tagsGroup)
    .elasticX(true)
    .gap(2)
    .xAxis().ticks(4);

//-----------------------------------
  dataTable = dc.dataTable("#chart-table");

  dataTable
    .dimension(tableDim)
    .group(function(d) {})
    .showGroups(false)
    //.size(10)
    .size(xf.size()) //display all data
    .columns([
      function(d) { return d.Id; },
      function(d) { return d.Name; },
      function(d) { return d.Contact; },
      function(d) { return d.Description; },
      function(d) { return d.Tags; },
    ])
    .sortBy(function(d){ return +d.Id; })
    .order(d3.ascending);

  //-----------------------------------
  dc.renderAll();

}

//====================================================================
