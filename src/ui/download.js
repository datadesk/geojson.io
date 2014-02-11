var leafletImage = require('leaflet-image'),
    shpwrite = require('shp-write'),
    clone = require('clone'),
    geojson2dsv = require('geojson2dsv'),
    topojson = require('topojson'),
    saveAs = require('filesaver.js'),
    tokml = require('tokml');

module.exports = download;

function download(context) {

    var shpSupport = typeof ArrayBuffer !== 'undefined';


    function downloadTopo() {
        var content = JSON.stringify(topojson.topology({
            collection: clone(context.data.get('map'))
        }, {'property-transform': allProperties}));

        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.topojson');

        analytics.track('download/topojson');
    }

    function downloadGeoJSON() {
        if (d3.event) d3.event.preventDefault();
        var content = JSON.stringify(context.data.get('map'));
        var meta = context.data.get('meta');
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), (meta && meta.name) || 'map.geojson');
        analytics.track('download/geojson');
    }

    function downloadImage() {
        if (d3.event) d3.event.preventDefault();
        d3.select('.map').classed('loading', true);
        leafletImage(context.map, function(err, canvas) {
            d3.select('.map').classed('loading', false);
            var data = canvas.toDataURL('image/png').match(/data:(.*),(.*)/),
                content = window.atob(data[2]),
                meta = context.data.get('meta'),
                arr = new Uint8Array(content.length);

            for (var i = 0, length = content.length; i < length; i++) {
                arr[i] = content.charCodeAt(i);
            }

            saveAs(new Blob([arr.buffer], {
                type: 'image/png'
            }), (meta && meta.name ? meta.name.split('.')[0] : 'map') + '.png');
            analytics.track('download/image');
        });
    }

    function downloadDSV() {
        if (d3.event) d3.event.preventDefault();
        var content = geojson2dsv(context.data.get('map'));
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'points.csv');
        analytics.track('download/dsv');
    }

    function downloadKML() {
        if (d3.event) d3.event.preventDefault();
        var content = tokml(context.data.get('map'));
        var meta = context.data.get('meta');
        saveAs(new Blob([content], {
            type: 'text/plain;charset=utf-8'
        }), 'map.kml');
        analytics.track('download/kml');
    }

    function downloadShp() {
        if (d3.event) d3.event.preventDefault();
        d3.select('.map').classed('loading', true);
        try {
            shpwrite.download(context.data.get('map'));
        } finally {
            d3.select('.map').classed('loading', false);
        }
        analytics.track('download/shp');
    }

    function allProperties(properties, key, value) {
        properties[key] = value;
        return true;
    }

    return function(selection) {

        selection.select('.download').remove();
        selection.select('.tooltip.in')
          .classed('in', false);

        var sel = selection.append('div')
            .attr('class', 'download pad1');

        var actions = [{
            icon: 'icon-map-marker',
            title: 'GeoJSON',
            action: downloadGeoJSON
        }, {
            icon: 'icon-picture',
            title: 'Image',
            action: downloadImage
        }, {
            icon: 'icon-file',
            title: 'TopoJSON',
            action: downloadTopo
        }, {
            icon: 'icon-table',
            title: 'CSV',
            action: downloadDSV
        }, {
            icon: 'icon-code',
            title: 'KML',
            action: downloadKML
        }];

        if (shpSupport) {
            actions.push({
                icon: 'icon-file-alt',
                title: 'Shapefile (beta)',
                action: downloadShp
            });
        }

        var links = sel
            .selectAll('.action')
            .data(actions)
            .enter()
            .append('a')
            .attr('class', 'action')
            .on('click', function(d) {
                d.action.apply(this, d);
            });

        links.append('span')
            .attr('class', function(d) { return d.icon + ' pre-icon'; });

        links.append('span')
            .text(function(d) { return d.title; });

        sel.append('a')
            .attr('class', 'icon-remove')
            .on('click', function() { sel.remove(); });
    };
}
