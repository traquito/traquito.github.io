import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {useGeographic} from 'ol/proj';



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


class Spot
{
    constructor(spotData)
    {
        this.spotData = spotData;
    }

    GetRowId()
    {
        return this.spotData['ROWID'];
    }

    GetTime()
    {
        return this.spotData['TIME'];
    }

    GetLocationTransmitter()
    {
        return {
            lat: parseFloat(this.spotData['LAT']),
            lng: parseFloat(this.spotData['LNG']),
        };
    }
    
    GetMiles()
    {
        return parseInt(this.spotData['MI']);
    }
    
    GetAltitudeFt()
    {
        return parseInt(this.spotData['ALTITUDE_FT']);
    }
    
    GetSpeedMph()
    {
        return parseInt(this.spotData['SPEED_MPH']);
    }
    
    GetTemperatureC()
    {
        return parseInt(this.spotData['TEMPERATURE_C']);
    }
    
    GetTemperatureF()
    {
        return Math.round((this.GetTemperatureC() * 9.0 / 5.0) + 32);
    }
    
    GetVoltage()
    {
        return parseInt(this.spotData['VOLTAGE']);
    }
    
    GetReporter()
    {
        return this.spotData['REPORTER'];
    }
    
    GetLocationReporter()
    {
        return {
            lat: parseFloat(this.spotData['RLAT']),
            lng: parseFloat(this.spotData['RLNG']),
        };
    }
    
    GetSNR()
    {
        return this.spotData['SNR'];
    }
    
    GetFrequency()
    {
        return this.spotData['FREQUENCY'];
    }
    
    GetDrift()
    {
        return this.spotData['DRIFT'];
    }
}



export class SpotMap
{
    constructor(cfg)
    {
        useGeographic();

        this.cfg = cfg;
        this.idContainer = this.cfg.idMap;
        // this.cbOnDeleteSpot = this.cfg.cbOnDeleteSpot;
        
        // Initial state of map
        this.initialCenterLocation = [ 0, 0 ];
        this.initialZoom           = 4;
        
        // hold all map elements regardless of other access routes
        this.mapElementList = [];

        // hold all spots
        this.spotList = [];

        // begin
        this.Load();
    }
    
    TrackMapElement(mapElement)
    {
        this.mapElementList.push(mapElement);
    }
    
    DiscardAllMapElements()
    {
        for (let mapElement of this.mapElementList)
        {
            mapElement.setMap(null);
        }
    }

    Load()
    {
        Log("SpotMap Loaded");
        
        this.Reset();
    }
    
    Reset()
    {
        // Keep state
        this.spotList = [];
        this.reporterName__data = new Map();
        this.markerListRx = [];
        this.txDataList = [];
        this.infoWindowList = [];

        this.tracking = true;
        
        if (this.map)
        {
            this.DiscardAllMapElements();
        }
        else
        {
            // Load map instance
            this.map = new Map({
                target: this.idContainer,
                layers: [
                    new TileLayer({
                        source: new OSM(),
                    })
                ],
                view: new View({
                    center: this.initialCenterLocation,
                    zoom: 2,
                }),
            });
        }
        
        // Tie in
        this.SetUpHandles();
        this.SetUpHandlers();
        this.UpdateMapInfo();
    }
    
    
    ///////////////////////////////////
    // Handles to other resources
    ///////////////////////////////////
    
    SetUpHandles()
    {
        return;
        this.domMapStatus = document.getElementById(this.cfg.idMapStatus);
    }
    
    
    ///////////////////////////////////
    // Event handling
    ///////////////////////////////////
    
    SetUpHandlers()
    {
        return;
        this.map.addListener('click', () => {
            this.CloseAllInfoWindows();
            
            this.tracking = false;
            
            this.CloseAllReporterPaths();
        });
    }
        
    
    
    
    ///////////////////////////////////
    // UI Commands
    ///////////////////////////////////
    
    CloseAllInfoWindows()
    {
        for (let infoWindow of this.infoWindowList)
        {
            if (infoWindow.map != null)
            {
                infoWindow.close();
            }
        }
    }
    
    CloseAllTransmitterMarkers()
    {
        for (let txData of this.txDataList)
        {
            txData.marker.setVisible(false);
        }
    }
    
    CloseAllReporterPaths()
    {
        for (let txData of this.txDataList)
        {
            for (let reporterLine of txData.reporterLineList)
            {
                if (reporterLine.getMap() != null)
                {
                    reporterLine.setMap(null);
                }
            }
        }
    }
    
    OpenReporterPaths(txData)
    {
        for (let reporterLine of txData.reporterLineList)
        {
            reporterLine.setMap(this.map);
        }
    }
    
    
    
    
    
    
    ///////////////////////////////////
    // New Data
    ///////////////////////////////////
    
    AddSpotList(spotList)
    {
        for (let spot of spotList)
        {
            this.AddSpot(spot);
        }
        this.UpdateMapInfo();
    }
    
    AddSpot(spot)
    {
        this.spotList.push(spot);

        let reporterName = spot.GetReporter();
        
        // Maintain reporter data
        if (!(this.reporterName__data.has(reporterName)))
        {
            let rxLocation = spot.GetLocationReporter();
            
            let marker = new google.maps.Marker({
                position : rxLocation,
                icon     : '/wspr/img/tower.png',
            });
            this.TrackMapElement(marker);
            
            this.GiveMarkerReporterPopup(marker, reporterName);

            let data = {
                marker: marker,
            };
            
            this.reporterName__data.set(reporterName, data);
            this.markerListRx.push(marker);
            
            marker.setMap(this.map);
        }
        
        
        
        // Maintain transmitter data
        // (assumes data comes in chronologically)
        let txLocation = spot.GetLocationTransmitter();
        let txTime     = spot.GetTime();
        let found      = false;
        
        
        let txData;
        for (let txDataTmp of this.txDataList)
        {
            if (txDataTmp.txLocation.x == txLocation.x &&
                txDataTmp.txLocation.y == txLocation.y &&
                txDataTmp.txTime == txTime)
            {
                found = true;
                
                txData = txDataTmp;
            }
        }
        
        if (!found)
        {
            txData = {};
            
            // Decide if you want a line connecting prior position to here
            // (yes if there was a prior position)
            let line = null;
            
            if (this.txDataList.length)
            {
                let txLocationPrev = this.txDataList[this.txDataList.length - 1].txLocation;
                
                line = new google.maps.Polyline({
                    path          : [txLocationPrev, txLocation],
                    geodesic      : true,
                    strokeColor   : 'blue',
                    strokeOpacity : 1.0,
                    strokeWeight  : 4,
                });
                this.TrackMapElement(line);
                
                line.setMap(this.map);
            }
            
            // Do remaining UI work for this spot regardless of prior spots
            
            // Marker
            let marker = new google.maps.Marker({
                position : txLocation,
                icon     : '/wspr/img/balloon.png',
            });
            this.TrackMapElement(marker);
            
            let infoWindow = this.GiveMarkerTransmitterPopup(marker, spot);
            this.CloseAllTransmitterMarkers();
            marker.setMap(this.map);
            
            // Dot
            let dot = new google.maps.Polyline({
                path          : [txLocation, txLocation],
                geodesic      : true,
                strokeColor   : 'red',
                strokeOpacity : 1.0,
                strokeWeight  : 6,
                zIndex        : 10,
            });
            this.TrackMapElement(dot);
            
            dot.addListener('click', () => {
                this.CloseAllInfoWindows();
                
                infoWindow.open(this.map, marker);
                
                // if you click this marker, show the paths
                this.CloseAllReporterPaths();
                this.OpenReporterPaths(txData);
            });
            dot.setMap(this.map);
            
            
            
            
            // Retain state about transmitter UI
            txData.txTime               = txTime;
            txData.txLocation           = txLocation;
            txData.marker               = marker;
            txData.infoWindow           = infoWindow;
            txData.line                 = line;
            txData.dot                  = dot;
            txData.reporterMarkerList   = [];
            txData.reporterLineList     = [];
            txData.spotList             = [];
            
            this.txDataList.push(txData);
            
            if (this.tracking)
            {
                new google.maps.event.trigger(marker, 'click');
                
                this.CloseAllReporterPaths();
                
                this.map.panTo(txLocation);
            }
        }
        
        txData.spotList.push(spot);
        
        // have txData now, either from finding, or creating
        // have a spot
        // each spot is a unique reporter
        let reporterMarker = this.reporterName__data.get(reporterName).marker;
        txData.reporterMarkerList.push(reporterMarker);
        
        let reporterLine = new google.maps.Polyline({
            path          : [txData.txLocation, reporterMarker.position],
            geodesic      : true,
            strokeColor   : 'red',
            strokeOpacity : 1.0,
            strokeWeight  : 0.75,
        });
        this.TrackMapElement(reporterLine);
        txData.reporterLineList.push(reporterLine);
        
        if (this.tracking)
        {
            reporterLine.setMap(this.map);
        }
        
        this.SetInfoWindow(txData);
    }

    // Triggered from UI, request to delete spot
    OnDeleteSpot(rowId)
    {
        Log(`Map OnDeleteSpot(${rowId})`);

        this.cbOnDeleteSpot(rowId);
    }

    // Command from external JS caller
    DeleteSpot(rowId)
    {
        Log(`Map DeleteSpot(${rowId})`);

        // remove that rowid
        let spotList = this.spotList.filter((spot, idx, arr) => {
            return spot.GetRowId() != rowId;
        });

        // Reset and re-draw
        this.Reset();

        this.AddSpotList(spotList);
    }


    SetInfoWindow(txData)
    {
        let status = "";
        
        let spotFirst = txData.spotList[0];
        
        status += "<div>";
        status += txData.txTime + "<br/>";
        status += `${spotFirst.GetSpeedMph()} MPH, ${Commas(spotFirst.GetAltitudeFt())} ft`;
        status += `, ${spotFirst.GetTemperatureF()} F, ${spotFirst.GetVoltage()/1000} V<br/>`;
        status += `${txData.spotList.length} reports<br/>`;
        status += "<hr>";
        
        
        // sorted table of reporter, distance, snr, freq, drift, 
        let spotList = txData.spotList;
        spotList.sort((a, b) => {
            return this.CalcDistMilesBetween(b.GetLocationTransmitter(), b.GetLocationReporter()) -
                   this.CalcDistMilesBetween(a.GetLocationTransmitter(), a.GetLocationReporter());
        });
        
        
        status += `<div class='spotListContainer'
                        onwheel='CaptureOverScrollOnWheel(this, event);'
                   >`;
        status += "<table>";
        status += "<style>";
        status += `
        
        .spotListContainer {
            
            /* I want to show the header plus 5 rows */
            /* upper/lower padding on each is equal to 1px */
            /* em = current font size, ex = the x-height of the current font */
            /* the fact the header is bolded seems to throw off my calc, so
               throw in another few px for the hell of it */
            
            max-height: calc((4 * (2px + 1em)) + 2px);
            
            overflow-y: scroll;
        }
        
        /* no scrollbar */
        .spotListContainer::-webkit-scrollbar { 
            display: none;
        }
        
        table {
            border-collapse: collapse;
        }
        
        th, td {
            padding-left: 10px;
            padding-right: 10px;
        }
        
        tr th:first-child, td:first-child {
            padding-left: 0px;
        }
        
        tr th:last-child, td:last-child {
            padding-right: 0px;
        }
        
        
                  `;
        status += "</style>";

        
        status += "<tr><th>Reporter</th><th>DistanceMI</th><th>SNR</th><th>Freq</th><th>Drift</th><th>Del</th></tr>";
        for (let spot of spotList)
        {
            let distanceMiles = Math.round(this.CalcDistMilesBetween(spot.GetLocationTransmitter(), spot.GetLocationReporter()));
            
            status += "<tr>"
            
            status += `<td>${spot.GetReporter()}</td>`;
            status += `<td style='text-align: right;'>${Commas(distanceMiles)}</td>`;
            status += `<td style='text-align: right;'>${spot.GetSNR()}</td>`;
            status += `<td style='text-align: right;'>${spot.GetFrequency()}</td>`;
            status += `<td style='text-align: right;'>${spot.GetDrift()}</td>`;
            status += `<td style='text-align: right;'><a href='#' data-rowid='${spot.GetRowId()}'>x</a></td>`;
            
            status += "</tr>";
        }
        status += "</table>";
        status += "</div>";
        status += "</div>";
        
        let statusDom = ToDOM(status);

        // Add click handlers to delete spots
        let linkList = statusDom.getElementsByTagName('a');
        for (let link of linkList)
        {
            link.addEventListener('click', (e) => {
                let linkDom = e.currentTarget;

                let rowId = parseInt(linkDom.getAttribute('data-rowid'));

                this.OnDeleteSpot(rowId)
            });
        }

        txData.infoWindow.setContent(statusDom);
    }

    // takes { lat: lat, lng: lng }
    CalcDistMilesBetween(point1, point2)
    {
        let pointFromLatLng = new google.maps.LatLng(point1.lat, point1.lng);
        let pointToLatLng = new google.maps.LatLng(point2.lat, point2.lng);
        
        let distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(pointFromLatLng, pointToLatLng);
        let distanceMiles  = distanceMeters / 1609.344;

        return distanceMiles;
    }
    
    UpdateMapInfo()
    {
        return;
        // Update map info
        let distanceTraveledMilesTotal = 0;
        
        for (let i = 1; i < this.txDataList.length; ++i)
        {
            let pointFrom = this.txDataList[i - 1].txLocation;
            let pointTo   = this.txDataList[i].txLocation;
            
            let distanceTraveledMiles = this.CalcDistMilesBetween(pointFrom, pointTo);
            distanceTraveledMilesTotal += distanceTraveledMiles;
        }
        
        distanceTraveledMilesTotal = Math.round(distanceTraveledMilesTotal);
        
        let mapStatus = "";
        mapStatus += `Traveled ${Commas(distanceTraveledMilesTotal)} miles, `;
        mapStatus += `${this.txDataList.length} transmissions, `;
        mapStatus += `${this.markerListRx.length} unique reporters`;
        
        this.domMapStatus.innerHTML = mapStatus;
    }
    
    
    GiveMarkerTransmitterPopup(marker, spot)
    {
        let time = spot.GetTime();
        
        let contentString = `${time}`;
        
        let infoWindow = new google.maps.InfoWindow({
            content: contentString
        });
        this.TrackMapElement(infoWindow);
        
        marker.addListener('click', () => {
            this.CloseAllInfoWindows();
            infoWindow.open(this.map, marker);
            
            this.tracking = true;
            
            // if you click this marker, show the paths
            this.CloseAllReporterPaths();
            this.OpenReporterPaths(this.txDataList[this.txDataList.length - 1]);
        });
        
        this.infoWindowList.push(infoWindow);
        
        return infoWindow;
    }
    
    GiveMarkerReporterPopup(marker, reporterName)
    {
        let contentString = `${reporterName}`;
        
        let infoWindow = new google.maps.InfoWindow({
            content: contentString
        });
        this.TrackMapElement(infoWindow);
        
        marker.addListener('click', () => {
            this.CloseAllInfoWindows();
            infoWindow.open(this.map, marker);
        });
        
        this.infoWindowList.push(infoWindow);
        
        return infoWindow;
    }
 }
 
 
 
