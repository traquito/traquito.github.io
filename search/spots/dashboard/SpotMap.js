import * as utl from '/js/Utl.js';

function ToDOM(html)
{
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function GetTime(d = new Date())
{
    let dayOfWeekArr = new Array(7);
    dayOfWeekArr[0] = "Sun";
    dayOfWeekArr[1] = "Mon";
    dayOfWeekArr[2] = "Tue";
    dayOfWeekArr[3] = "Wed";
    dayOfWeekArr[4] = "Thu";
    dayOfWeekArr[5] = "Fri";
    dayOfWeekArr[6] = "Sat";
    
    let monthOfYearArr = new Array(12);
    monthOfYearArr[0]  = "Jan";
    monthOfYearArr[1]  = "Feb";
    monthOfYearArr[2]  = "Mar";
    monthOfYearArr[3]  = "Apr";
    monthOfYearArr[4]  = "May";
    monthOfYearArr[5]  = "Jun";
    monthOfYearArr[6]  = "Jul";
    monthOfYearArr[7]  = "Aug";
    monthOfYearArr[8]  = "Sep";
    monthOfYearArr[9]  = "Oct";
    monthOfYearArr[10] = "Nov";
    monthOfYearArr[11] = "Dec";
    
    let dayOfWeek = dayOfWeekArr[d.getDay()];
    
    let yyyy = d.getFullYear();
    let mm   = (d.getMonth() + 1).toString().length == 1 ?  ("0" + (d.getMonth() + 1)) : (d.getMonth() + 1);
    let dd   = (d.getDay() + 1).toString().length == 1 ?  ("0" + (d.getDay() + 1)) : (d.getDay() + 1);
    
    let month = monthOfYearArr[d.getMonth()];
    
    let dayOfMonth = d.getDate().toString().length == 1 ? ("0" + d.getDate()) : d.getDate();
    
    let HH = (d.getHours().toString().length   == 1 ? ("0" + d.getHours()  ) : d.getHours()  );
    let MM = (d.getMinutes().toString().length == 1 ? ("0" + d.getMinutes()) : d.getMinutes());
    let SS = (d.getSeconds().toString().length == 1 ? ("0" + d.getSeconds()) : d.getSeconds());
    
    let hhmmss = HH + ":" + MM + ":" + SS;
    
    let yyyymmdd = yyyy + "-" + mm + "-" + dd;
    
    let tsFull = yyyymmdd + " " + hhmmss;

    
    let t = {
        dayOfWeek,
        yyyy,
        mm,
        dd,
        
        month,
        
        dayOfMonth,
        
        HH,
        MM,
        SS,
        
        hhmmss,
        
        yyyymmdd,
        
        tsFull,
    };
    
    return t;
}


export function Log(logStr)
{
    let t = GetTime();
    
    let stackStr = new Error().stack.toString().replace(/\n/, '').replace( /  +/g, ' ' )
    let callerStr = stackStr.split(' ')[5];
    
    let logStamped = `[${callerStr}]\n${t.tsFull}: ${logStr}`;
    
    console.log(logStamped);
}




export class Spot
{
    constructor(spotData)
    {
        this.spotData = spotData;

        this.loc = ol.proj.fromLonLat([this.GetLng(), this.GetLat()]);
    }

    GetLoc()
    {
        return this.loc;
    }

    GetLat()
    {
        return this.spotData.lat;
    }
    
    GetLng()
    {
        return this.spotData.lng;
    }

    GetAccuracy()
    {
        return this.spotData.accuracy;
    }
}
 


export class SpotMap
{
    constructor(cfg)
    {
        this.cfg = cfg;
        this.idContainer = this.cfg.idMap;
        
        // Initial state of map
        this.initialCenterLocation = ol.proj.fromLonLat([-40, 40]);
        this.initialZoom           = 1;

        this.Load();
    }

    Load()
    {
        this.MakeMapBase();
        this.MakeMapSpotLayer();
        this.MakeMapOverlay();
        this.SetupEventHandlers();
    }

    MakeMapBase()
    {
        // for base raster, we use Open Street Maps
        const source = new ol.source.OSM();

        // let's set up a little mini-map in the lower-left corner
        const overviewMapControl = new ol.control.OverviewMap({
            layers: [
                new ol.layer.Tile({
                    source: source,
                }),
            ],
        });

        // set up controls for mini-map
        let controls = new ol.Collection();

        // Load map instance
        this.map = new ol.Map({
            controls: controls.extend([overviewMapControl, new ol.control.FullScreen()]),
            target: this.idContainer,
            layers: [
                new ol.layer.Tile({
                    source: source,
                })
            ],
            view: new ol.View({
                center: this.initialCenterLocation,
                zoom: this.initialZoom,
            }),
        });

        // make sure the mini-map is open by default
        overviewMapControl.setCollapsed(false);
    }

    MakeMapSpotLayer()
    {
        // create a layer to put markers on
        this.spotLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [],
            }),
        });
        this.map.addLayer(this.spotLayer);
    }

    MakeMapOverlay()
    {
        this.overlay = new ol.Overlay({
            element: document.getElementById('popup'),
            autoPan: {
                animation: {
                    duration: 250,
                },
            },
        });

        this.map.addOverlay(this.overlay);

        let closer = document.getElementById('popup-closer');
        closer.onclick = () => {
            this.overlay.setPosition(undefined);
            closer.blur();
            return false;
          };
    }

    SetupEventHandlers()
    {
        this.map.on('click', e => {
            let featureList = this.map.getFeaturesAtPixel(e.pixel);

            if (featureList.length)
            {
                let spotLast = null;
                for (let feature of featureList)
                {
                    let spot = feature.get("spot");

                    if (spot != undefined)
                    {
                        spotLast = spot;
                    }
                }

                if (spotLast)
                {
                    let td = spotLast.spotData.td;

                    let content = document.getElementById('popup-content');
                    // content.innerHTML = `<p>You clicked ${td.Get(0, "DateTimeLocal")}</p>`;
                    content.innerHTML = ``;
                    let table = utl.MakeTableTransposed(td.GetDataTable());
                    content.appendChild(table);

                    // add additional links
                    let lat = spotLast.GetLat();
                    let lng = spotLast.GetLng();
                    // get altitude but strip comma from it first
                    let altM = parseInt(td.Get(0, "AltMGraph").replace(/\,/g,''), 10);

                    content.innerHTML += "<br>";
                    content.innerHTML += "Links:";

                    // create a table of links to show
                    let dataTableLinks = [
                        ["windy.com", "suncalc.org", "hysplit"]
                    ];
                    let dataRow = [];

                    // fill out windy links
                    let windyLinksList = [];
                    windyLinksList.push(utl.MakeLink(this.MakeUrlWindyWind(lat, lng, altM), "wind"));
                    windyLinksList.push(utl.MakeLink(this.MakeUrlWindyCloudtop(lat, lng), "cloudtop"));
                    windyLinksList.push(utl.MakeLink(this.MakeUrlWindyRain(lat, lng), "rain"));
                    
                    let windyLinksStr = windyLinksList.join(", ");
                    dataRow.push(windyLinksStr);
                    
                    // fill out suncalc links
                    let suncalcLinksList = [];
                    suncalcLinksList.push(utl.MakeLink(this.MakeUrlSuncalc(lat, lng), "suncalc"));

                    let suncalcLinksStr = suncalcLinksList.join(", ");
                    dataRow.push(suncalcLinksStr);
                    
                    // fill out hysplit links
                    let hysplitLinksList = [];
                    hysplitLinksList.push(utl.MakeLink(this.MakeUrlHysplitTrajectory(), "traj"));
                    hysplitLinksList.push(utl.MakeLink(this.MakeUrlHysplitTrajectoryBalloon(), "for balloons"));

                    let hysplitLinksStr = hysplitLinksList.join(", ");
                    dataRow.push(hysplitLinksStr);
                    
                    // push data into data table
                    dataTableLinks.push(dataRow);

                    // construct html table and insert
                    let linksTable = utl.MakeTableTransposed(dataTableLinks);
                    content.appendChild(linksTable);
                    
                    this.overlay.setPosition(e.coordinate);
                }
            }
        });
    }

    MakeUrlHysplitTrajectoryBalloon()
    {
        return `https://www.ready.noaa.gov/hypub-bin/trajsrc.pl?trjtype=4`;
    }

    MakeUrlHysplitTrajectory()
    {
        // save a click from https://www.ready.noaa.gov/HYSPLIT_traj.php
        // then https://www.ready.noaa.gov/hypub-bin/trajtype.pl

        return `https://www.ready.noaa.gov/hypub-bin/trajsrc.pl`;
    }

    MakeUrlSuncalc(lat, lng)
    {
        // seems providing a date and a time will set the page to something other than
        // "now," but it expects the date and time to be in the local timezone, which I
        // have no way of getting (easily).  Does not appear to support UTC.

        let mapZoom = 5;
        return `https://suncalc.org/#/${lat},${lng},${mapZoom}/null/null/null/null`;
    }

    MakeUrlWindyRain(lat, lng)
    {
        return `https://windy.com/?rain,${lat},${lng},5,d:picker`;
    }

    MakeUrlWindyCloudtop(lat, lng)
    {
        return `https://windy.com/?cloudtop,${lat},${lng},5,d:picker`;
    }

    MakeUrlWindyWind(lat, lng, altM)
    {
        let altLabelList = [
            [0, "surface"],
            [100, "100m"],
            [600, "950h"],
            [750, "925h"],
            [900, "900h"],
            [1500, "850h"],
            [2000, "800h"],
            [3000, "700h"],
            [4200, "600h"],
            [5500, "500h"],
            [7000, "400h"],
            [9000, "300h"],
            [10000, "250h"],
            [11700, "200h"],
            [13500, "150h"],
        ];

        if (altM < 0) { altM = 0; }

        // determine the correct elevation for the map
        let labelUse = null;
        for (let [alt, label] of altLabelList)
        {
            // console.log(`Checking ${altM} against ${alt}, ${label}`);

            if (altM >= alt)
            {
                labelUse = label;

                // console.log(`using ${labelUse} for now`);
            }
        }
        // console.log(`using ${labelUse} final`);

        return `https://windy.com/?wind,${labelUse},${lat},${lng},5,d:picker`;
    }

    AddSpotList(spotList)
    {
        let styleHighAccuracy = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.4)',
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(55, 143, 205, 1)',
                    width: 1.1,
                }),
            }),
        });

        let styleLowAccuracy = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.4)',
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(205, 143, 55, 1)',
                    width: 1.1,
                }),
            }),
        });

        // add points
        for (const spot of spotList)
        {
            let point = new ol.geom.Point(spot.GetLoc());

            let style = spot.GetAccuracy() == "high" ? styleHighAccuracy : styleLowAccuracy;

            let feature = new ol.Feature({
                geometry: point,
            });

            feature.setStyle(style);

            feature.set("spot", spot);

            this.spotLayer.getSource().addFeature(feature);
        }

        // add lines
        if (spotList.length > 1)
        {
            // get latLngList from spots
            let latLngList = [];
            for (const spot of spotList)
            {
                latLngList.push([spot.GetLat(), spot.GetLng()]);
            }

            // do special processing to draw lines, which avoids the 180/-180 boundary issue
            let lineStringList = this.MakeLineStringList(latLngList);

            // plot it
            for (const lineString of lineStringList)
            {
                // turn into a line
                let feature = new ol.Feature({
                    geometry: lineString,
                });
        
                feature.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'green',
                        width: 1,
                    }),
                }));
        
                this.spotLayer.getSource().addFeature(feature);
            }
        }

        if (spotList.length)
        {
            // center map on latest
            let spotLatest = spotList.at(-1);
            this.map.getView().setCenter(spotLatest.GetLoc());
            this.map.getView().setZoom(6);
        }
    }

// lng( 179.5846), lat(40.7089) => lng(19991266.226313718),  lat(4969498.835332252)
// lng(-176.8324), lat(41.7089) => lng(-19684892.723752473), lat(5117473.325588154)
     MakeLineStringList(latLngList)
     {
        let locListList = [[]];

        function CloseToWrap(lng)
        {
            // if you're within x degrees of the wraparound, let's assume
            // this is the case we're dealing with (not the wrap over europe)
            return (180 - Math.abs(lng)) < 20;
        }

        let latLast;
        let lngLast;
        for (let i = 0; i < latLngList.length; ++i)
        {
            let [lat, lng] = latLngList[i];

            // only check subsequent points to see if they cross the 180/-180 longitude
            if (i)
            {
                if (lngLast > 0 && lng < 0 && (CloseToWrap(lngLast) || CloseToWrap(lng)))
                {
                    // oops, it happened going from +180 to -180

                    // let's convert latitude to easier to math numbers
                    // latitude is 90 at the poles, converges to zero at the
                    // equator.
                    // the south is depicted as having a negative latitude.
                    // so let's call it 0 (north pole) to 180 (south pole)

                    let latEz     = (lat     < 0) ? (90 + -lat)     : lat;
                    let latLastEz = (latLast < 0) ? (90 + -latLast) : latLast;

                    // want to determine crossover point
                    let latCrossoverEz;

                    // let's look at whether travel toward north or south
                    if (latLastEz < latEz)
                    {
                        // example: 20m, chan 65, VE3OCL, 2023-04-25 to 2023-04-26

                        // moving north, interpolate
                        // let's model a giant triangle from last pos to this pos

                        // measure horizontal distance
                        let lngToMark = 180 - lngLast;
                        let markToLng = lng - -180;
                        let dx = lngToMark + markToLng;
                        
                        // measure vertical distance
                        let dy = latEz - latLastEz;

                        // calculate big triangle hypotenuse
                        let dc = Math.sqrt((dx ** 2) + (dy ** 2));

                        // now we can calculate the portion of the big triangle
                        // that the meridian slices off, which itself is a triangle
                        // on the left side.

                        // horizontal distance is lngToMark
                        let a = lngToMark;

                        // the small hypotenuse is the same percent of its length
                        // as the length to the mark is of the entire distance
                        let c = lngToMark / dx * dc;

                        // now reverse the Pythagorean theorem
                        let b = Math.sqrt(Math.sqrt(c) - Math.sqrt(a));

                        // ok that's our crossover point
                        latCrossoverEz = latLastEz + b;
                    }
                    else if (latLastEz == latEz)
                    {
                        // you know the lat
                        latCrossoverEz = latEz;
                    }
                    else if (latLastEz > latEz)
                    {
                        // example: 20m, chan 99, VE3KCL, 2023-04-30 to 2023-04-31

                        // moving south, interpolate
                        // let's model a giant triangle from last pos to this pos

                        // measure horizontal distance
                        let lngToMark = 180 - lngLast;
                        let markToLng = lng - -180;
                        let dx = lngToMark + markToLng;
                        
                        // measure vertical distance
                        let dy = latLastEz - latEz;

                        // calculate big triangle hypotenuse
                        let dc = Math.sqrt((dx ** 2) + (dy ** 2));

                        // now we can calculate the portion of the big triangle
                        // that the meridian slices off, which itself is a triangle
                        // on the left side.

                        // horizontal distance is lngToMark
                        let a = lngToMark;

                        // the small hypotenuse is the same percent of its length
                        // as the length to the mark is of the entire distance
                        let c = lngToMark / dx * dc;

                        // now reverse the Pythagorean theorem
                        let b = Math.sqrt(Math.sqrt(c) - Math.sqrt(a));

                        // ok that's our crossover point
                        latCrossoverEz = latLastEz - b;
                    }

                    // convert ez back to real latitude
                    let latCrossover = (latCrossoverEz > 90) ? (-latCrossoverEz + 90) : latCrossoverEz;

                    // now break this point into two, one which gets from the prior
                    // point to the break, and then from the break to this point.
                    // put in the right (opposite) order for conversion
                    let one   = [180, latCrossover];
                    let two   = [-180, latCrossover];
                    let three = [lng, lat];

                    locListList.at(-1).push(ol.proj.fromLonLat(one));
                    locListList.push([]);
                    locListList.at(-1).push(ol.proj.fromLonLat(two));
                    locListList.at(-1).push(ol.proj.fromLonLat(three));
                }
                else if (lngLast < 0 && lng > 0 && (CloseToWrap(lngLast) || CloseToWrap(lng)))
                {
                    // oops, it happened going from -180 to +180

                    // let's convert latitude to easier to math numbers
                    // latitude is 90 at the poles, converges to zero at the
                    // equator.
                    // the south is depicted as having a negative latitude.
                    // so let's call it 0 (north pole) to 180 (south pole)

                    let latEz     = (lat     < 0) ? (90 + -lat)     : lat;
                    let latLastEz = (latLast < 0) ? (90 + -latLast) : latLast;

                    // want to determine crossover point
                    let latCrossoverEz;

                    // let's look at whether travel toward north or south
                    if (latLastEz < latEz)
                    {
                        // example: 20m, chan 99, VE3CKL, 2023-03-12 to 2023-03-12

                        // moving north, interpolate
                        // let's model a giant triangle from last pos to this pos

                        // measure horizontal distance
                        let lngToMark = 180 - lng;
                        let markToLng = lngLast - -180;
                        let dx = lngToMark + markToLng;
                        
                        // measure vertical distance
                        let dy = latEz - latLastEz;

                        // calculate big triangle hypotenuse
                        let dc = Math.sqrt((dx ** 2) + (dy ** 2));

                        // now we can calculate the portion of the big triangle
                        // that the meridian slices off, which itself is a triangle
                        // on the left side.

                        // horizontal distance is lngToMark
                        let a = lngToMark;

                        // the small hypotenuse is the same percent of its length
                        // as the length to the mark is of the entire distance
                        let c = lngToMark / dx * dc;

                        // now reverse the Pythagorean theorem
                        let b = Math.sqrt(Math.sqrt(c) - Math.sqrt(a));

                        // ok that's our crossover point
                        latCrossoverEz = latLastEz + b;
                    }
                    else if (latLastEz == latEz)
                    {
                        // you know the lat
                        latCrossoverEz = latEz;
                    }
                    else if (latLastEz > latEz)
                    {
                        // example: ??

                        // moving south, interpolate
                        // let's model a giant triangle from last pos to this pos

                        // measure horizontal distance
                        let lngToMark = 180 - lng;
                        let markToLng = lngLast - -180;
                        let dx = lngToMark + markToLng;
                        
                        // measure vertical distance
                        let dy = latLastEz - latEz;

                        // calculate big triangle hypotenuse
                        let dc = Math.sqrt((dx ** 2) + (dy ** 2));

                        // now we can calculate the portion of the big triangle
                        // that the meridian slices off, which itself is a triangle
                        // on the left side.

                        // horizontal distance is lngToMark
                        let a = lngToMark;

                        // the small hypotenuse is the same percent of its length
                        // as the length to the mark is of the entire distance
                        let c = lngToMark / dx * dc;

                        // now reverse the Pythagorean theorem
                        let b = Math.sqrt(Math.sqrt(c) - Math.sqrt(a));

                        // ok that's our crossover point
                        latCrossoverEz = latLastEz - b;
                    }

                    // convert ez back to real latitude
                    let latCrossover = (latCrossoverEz > 90) ? (-latCrossoverEz + 90) : latCrossoverEz;

                    // now break this point into two, one which gets from the prior
                    // point to the break, and then from the break to this point.
                    // put in the right (opposite) order for conversion
                    let one   = [-180, latCrossover];
                    let two   = [180, latCrossover];
                    let three = [lng, lat];

                    locListList.at(-1).push(ol.proj.fromLonLat(one));
                    locListList.push([]);
                    locListList.at(-1).push(ol.proj.fromLonLat(two));
                    locListList.at(-1).push(ol.proj.fromLonLat(three));
                }
                else
                {
                    locListList.at(-1).push(ol.proj.fromLonLat([lng, lat]));
                }
            }
            else
            {
                locListList.at(-1).push(ol.proj.fromLonLat([lng, lat]));
            }

            latLast = lat;
            lngLast = lng;
        }

        // convert locListList to LineStringList
        let lineStringList = [];
        for (let locList of locListList)
        {
            lineStringList.push(new ol.geom.LineString(locList));
        }

        return lineStringList
    }



}
 





