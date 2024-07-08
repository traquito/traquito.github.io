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

    GetDTLocal()
    {
        return this.spotData.dtLocal;
    }

    GetSeenDataList()
    {
        return this.spotData.seenDataList;
    }
}

// https://openlayers.org/en/latest/examples/custom-controls.html
class MapControl extends ol.control.Control {
    constructor(spotMap)
    {
        const button = document.createElement('button');
        button.innerHTML = 'L';
        
        const element = document.createElement('div');
        element.className = 'ol-unselectable ol-control';
        element.style.top = "7px";
        element.style.right = "30px";
        element.appendChild(button);

        super({
            element: element,
        });

        this.spotMap = spotMap;

        // button.addEventListener('click', this.handleRotateNorth.bind(this), false);
        button.addEventListener('click', () => {
            this.spotMap.OnLineToggle();
        });
    }

    handleRotateNorth() {
        this.getMap().getView().setRotation(0);
    }
}

class MapControlRx extends ol.control.Control {
    constructor(spotMap)
    {
        const button = document.createElement('button');
        button.innerHTML = 'R';
        
        const element = document.createElement('div');
        element.className = 'ol-unselectable ol-control';
        element.style.top = "7px";
        element.style.right = "53px";
        element.appendChild(button);

        super({
            element: element,
        });

        this.spotMap = spotMap;

        this.enabled = localStorage.getItem("showRxState") == "true";

        // button.addEventListener('click', this.handleRotateNorth.bind(this), false);
        button.addEventListener('click', () => {
            this.enabled = !this.enabled;

            if (this.enabled)
            {
                this.spotMap.SetShowRxState("default");
            }
            else
            {
                this.spotMap.SetShowRxState("disabled");
            }

            localStorage.setItem("showRxState", this.enabled);
        });
    }

    IsEnabled()
    {
        return this.enabled;
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

        this.dataSetPreviously = false;

        this.dt__data = new Map();

        this.spotListLast = [];
        this.mapControl = new MapControl(this);
        this.showLines = true;

        this.mapControlRx = new MapControlRx(this);
        this.showRxState = "default";
        if (this.mapControlRx.IsEnabled() == false)
        {
            this.showRxState = "disabled";
        }

        this.Load();
    }

    Load()
    {
        this.MakeMapBase();
        this.MakeMapLayers();
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
            controls: controls.extend([
                overviewMapControl,
                new ol.control.FullScreen(),
                this.mapControl,
                this.mapControlRx,
            ]),
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

        // make sure the mini-map is closed by default
        overviewMapControl.setCollapsed(true);
    }

    MakeMapLayers()
    {
        // create a layer to put rx station markers on
        this.rxLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [],
            }),
        });
        this.map.addLayer(this.rxLayer);

        // create a layer to put spot markers on
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
            if (this.showRxState != "disabled")
            {
                this.showRxState = "default";
                this.HandleSeen(this.spotListLast);
            }

            this.overlay.setPosition(undefined);
            closer.blur();
            return false;
          };
    }

    OnLineToggle()
    {
        this.showLines = !this.showLines;

        // re-display
        this.SetSpotList(this.spotListLast);
    }

    GetLatestFeatureByType(featureList, type)
    {
        let featureMap = new Map();

        // filter by type
        for (const feature of featureList)
        {
            if (feature.get("type") == type)
            {
                let dt = feature.get("spot").GetDTLocal();

                featureMap.set(dt, feature);
            }
        }

        // get the latest feature if any
        let featureDtList = Array.from(featureMap.keys()).sort();
        
        let feature = null;
        if (featureDtList.length >= 1)
        {
            let rxFeatureDt = featureDtList.at(-1);

            feature = feature = featureMap.get(rxFeatureDt);
        }

        return feature;
    }

    OnPointerMove(pixel, coordinate, e)
    {
        // if map moving (by a fling), a mouseover event causes a noticable
        // hang in motion. prevent that by only handling this event if we
        // are not in motion.
        if (this.moveState == "moving") { return; }
        if (this.showRxState == "disabled") { return; }
        if (this.showRxState == "frozen") { return; }

        // figure out what you're hovering over.
        // prioritize mousing over spots.
        //
        // update - holy shit this takes like 100ms when the dev console
        // is open, but seemingly not when it isn't
        let featureList = this.map.getFeaturesAtPixel(pixel);

        // console.log(`${featureList.length} features found`)

        let spotFeature = this.GetLatestFeatureByType(featureList, "spot");

        // accumulate firing of the same spot, and also distinguish between
        // hovering over something vs nothing

        if (this.spotFeatureLast == spotFeature)
        {
            // either still the same something, or still nothing, but either
            // way we don't care and ignore it
            spotFeature = null;
        }
        else
        {
            // there was a change
            if (spotFeature)
            {
                // was nothing, now something
                const spot = spotFeature.get("spot");

                this.showRxState = "hover";
                this.HandleSeen([spot]);
            }
            else
            {
                // was something, now nothing
                this.showRxState = "default";
                this.HandleSeen(this.spotListLast);
            }

            // remember for next time
            this.spotFeatureLast = spotFeature;
        }
    }

    OnClick(pixel, coordinate, e)
    {
        let featureList = this.map.getFeaturesAtPixel(pixel);

        if (featureList.length)
        {
            let feature = this.GetLatestFeatureByType(featureList, "spot");

            let spotLast = null;
            if (feature)
            {
                spotLast = feature.get("spot");
            }

            if (spotLast)
            {
                // if the external click generator passes along the
                // specific spot to use, use it instead
                if (e.spot)
                {
                    spotLast = e.spot;
                }

                // set rx location updates frozen since we know we're
                // doing a popup here. the rx locations of this spot
                // should already be being shown given the mouse
                // clicked it, but let's be explicit anyway
                if (this.showRxState != "disabled")
                {
                    // temporarily lift a potential freeze
                    // (from prior popup click) to show the rx for this
                    // specific spot
                    this.showRxState = "hover";
                    this.HandleSeen([spotLast]);

                    // now freeze
                    this.showRxState = "frozen";
                }

                // fill out popup
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
                let altM = 0;
                let altMGraph = td.Get(0, "AltMGraph");
                if (altMGraph)
                {
                    altMGraph = altMGraph.toString();
                    altM = parseInt(altMGraph.replace(/\,/g,''), 10);
                }

                content.innerHTML += `<span id='jumplink'>jump to data<span>`;
                content.innerHTML += "<br>";
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

                // make jump link active
                let domJl = document.getElementById("jumplink");
                domJl.classList.add("fakelink");
                domJl.onclick =  () => {
                    window.top.postMessage({
                        type: "JUMP_TO_DATA",
                        ts: spotLast.GetDTLocal(),
                    }, "*");
                };

                // position
                this.overlay.setPosition(coordinate);
            }
        }
    }

    // https://openlayers.org/en/latest/apidoc/module-ol_MapBrowserEvent-MapBrowserEvent.html
    SetupEventHandlers()
    {
        this.map.on('click', e => {
            this.OnClick(e.pixel, e.coordinate, e)
        });
        
        this.map.on('pointermove', e => {
            this.OnPointerMove(e.pixel, e.coordinate, e)
        });

        this.moveState = "stopped";
        this.map.on('movestart', e => {
            // console.log("move start")
            this.moveState = "moving";
        });
        this.map.on('moveend', e => {
            // console.log("move end")
            this.moveState = "stopped";
        });

        // this.map.on('precompose', e => { console.log("precompose") });
        // this.map.on('postcompose', e => { console.log("postcompose") });
        // this.map.on('prerender', e => { console.log("prerender") });
        // this.map.on('postrender', e => { console.log("postrender") });
        // this.map.on('rendercomplete', e => {
        //     console.log("rendercomplete");
        // });
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

        // force at least a single decimal place or the page doesn't drop a pin correctly
        let latStr = lat.toFixed(9);
        let lngStr = lng.toFixed(9);

        return `https://windy.com/?wind,${labelUse},${latStr},${lngStr},5,d:picker`;
    }

    SetShowRxState(state)
    {
        this.showRxState = state;

        this.HandleSeen(this.spotListLast);
    }

    HandleSeen(spotList)
    {
        if (this.showRxState == "frozen") { return ; }

        // clear any existing rx
        this.rxLayer.getSource().clear(true);

        if (this.showRxState == "disabled") { return; }

        // set up rx style
        let styleSeen = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 255, 1)',
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 255, 1)',
                    width: 0.1,
                }),
            }),
        });

        // decide which rx to show depending on state
        if (this.showRxState == "default")
        {
            if (spotList.length)
            {
                const spotLatest = spotList.at(-1);
                for (const seenData of spotLatest.GetSeenDataList())
                {
                    let pointSeen = new ol.geom.Point(ol.proj.fromLonLat([seenData.lng, seenData.lat]));
    
                    let featureSeen = new ol.Feature({
                        geometry: pointSeen,
                    });
        
                    featureSeen.setStyle(styleSeen);
                    featureSeen.set("type", "rx");
                    featureSeen.set("spot", spotLatest);
        
                    this.rxLayer.getSource().addFeature(featureSeen);
                }
            }
        }
        else
        {
            for (const spot of spotList)
            {
                // add receiving stations
                for (const seenData of spot.GetSeenDataList())
                {
                    let pointSeen = new ol.geom.Point(ol.proj.fromLonLat([seenData.lng, seenData.lat]));

                    let featureSeen = new ol.Feature({
                        geometry: pointSeen,
                    });
        
                    featureSeen.setStyle(styleSeen);
                    featureSeen.set("type", "rx");
                    featureSeen.set("spot", spot);
        
                    this.rxLayer.getSource().addFeature(featureSeen);
                }
            }
        }
    }

    SetSpotList(spotList)
    {
        // draw first so spots overlap
        this.HandleSeen(spotList);

        // clear old spot features
        if (this.dataSetPreviously == true)
        {
            let FnCount = (thing) => {
                let count = 0;
    
                thing.forEachFeature(t => {
                    ++count;
                });
    
                return count;
            };

            // console.log(`clearing ${FnCount(this.spotLayer.getSource())} features`)
            this.spotLayer.getSource().clear(true);
        }

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

            feature.set("type", "spot");
            feature.set("spot", spot);

            this.spotLayer.getSource().addFeature(feature);
        }

        // cache data about spots
        for (const spot of spotList)
        {
            this.dt__data.set(spot.GetDTLocal(), {
                spot: spot,
            });
        }

        // add lines
        if (spotList.length > 1 && this.showLines)
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
            if (this.dataSetPreviously == true)
            {
                // leave center and zoom as it was previously
            }
            else
            {
                // center map on latest
                let spotLatest = spotList.at(-1);
                this.map.getView().setCenter(spotLatest.GetLoc());
                this.map.getView().setZoom(6);
            }
        }

        this.dataSetPreviously = true;

        this.spotListLast = spotList;

        // handle if the latest spot is currently being highlighted
        if (this.focusFeature)
        {
            this.UnHighlightLatest();
            this.HighlightLatest();
        }
    }

    FocusOn(ts)
    {
        // hopefully find the spot based on time right away
        let data = this.dt__data.get(ts);   
        let spot = null;

        // console.log(`FocusOn ${ts}`)

        if (data)
        {
            // console.log(`found immediately`)
            spot = data.spot;
        }
        else
        {
            // console.log(`hunting for it`)
            // we don't have that time, find the spot that is closest in time
            let tsDiffMin = null;
            for (let [keyTs, valueData] of this.dt__data)
            {
                let spotTmp = valueData.spot;
                let tsDiff = Math.abs(utl.MsDiff(keyTs, ts));

                // console.log(`${keyTs} - ${ts} = ${tsDiff}`)

                if (tsDiffMin == null || tsDiff < tsDiffMin)
                {
                    tsDiffMin = tsDiff;

                    // console.log(`new spot`)

                    spot = spotTmp;
                }
            }

            // overwrite the time now that we have a specific spot to focus on
            if (tsDiffMin)
            {
                ts = spot.GetDTLocal();
            }
        }
        
        // work out where on the screen this spot is
        let pixel = this.map.getPixelFromCoordinate(spot.GetLoc());

        // if it is out of the screen, things don't seem to work correctly,
        // so zoom out so much that everything is on the screen
        let [pixX, pixY] = pixel;
        let [mapWidth, mapHeight] = this.map.getSize();
        if (pixX < 0 || pixX > mapWidth || pixY < 0 || pixY > mapHeight)
        {
            // console.log(`have to move the screen`)
            this.map.getView().setCenter(spot.GetLoc());
            this.map.getView().setZoom(1);
        }

        // async complete the rest after the map has a chance to do stuff for
        // potentially zooming out
        setTimeout(() => {
            let pixel = this.map.getPixelFromCoordinate(spot.GetLoc());

            // now that we can see the feature, we use a pixel to point, but now
            // need to figure out which specific feature is the one we're
            // looking for, since many can be "at" the same pixel
            let f = null;
            let tsDiffMin = null;
            this.map.forEachFeatureAtPixel(pixel, (feature, layer) => {
                let fSpot = feature.get("spot");
                if (fSpot)
                {
                    let tsDiff = Math.abs(utl.MsDiff(ts, fSpot.GetDTLocal()));

                    // console.log(`${ts} - ${fSpot.GetDTLocal()} = ${tsDiff}`)

                    if (tsDiffMin == null || tsDiff < tsDiffMin)
                    {
                        tsDiffMin = tsDiff;

                        // console.log(`new feature`)
                        f = feature;
                    }
                }
            });

            // console.log(`done looking at features`)

            let coordinate = null;
            if (f)
            {
                let g = f.getGeometry();
                let c = g.getCoordinates();
                coordinate = c;
            }

            this.map.dispatchEvent({
                type: 'click',
                pixel: pixel,
                pixel_: pixel,
                dragging: false,
                coordinate: coordinate,
                coordinate_: coordinate,
                originalEvent: {},
                dragging: false,
                map: this.map,
                spot: spot,
            });
        }, 50);
    }

    HighlightLatest()
    {
        this.focusFeature = null;

        if (this.spotListLast.length != 0)
        {
            let spot = this.spotListLast[this.spotListLast.length - 1];

            let style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 15,
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.1)',
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 0, 0, 1)',
                        width: 2.0,
                    }),
                }),
            });
    
            let point = new ol.geom.Point(spot.GetLoc());
            let feature = new ol.Feature({
                geometry: point,
            });
            feature.setStyle(style);
            feature.set("type", "spot");
            feature.set("spot", spot);
            this.spotLayer.getSource().addFeature(feature);

            this.focusFeature = feature;
        }
    }

    UnHighlightLatest()
    {
        if (this.focusFeature)
        {
            this.spotLayer.getSource().removeFeature(this.focusFeature);

            this.focusFeature = null;
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
 





