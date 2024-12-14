import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { SpotMapAsyncLoader } from './SpotMapAsyncLoader.js';
import { TabularData } from '../../../../js/TabularData.js';
import { WSPREncoded } from '/js/WSPREncoded.js';


export class WsprSearchUiMapController
extends Base
{
    constructor(cfg)
    {
        super();

        this.cfg = cfg;
        this.td = null;

        this.ok = this.cfg.container;

        // map gets async loaded
        this.mapModule = null;
        this.map = null;
        SpotMapAsyncLoader.SetOnLoadCallback((module) => {
            this.mapModule = module;
            
            this.map = new this.mapModule.SpotMap({
                container: this.ui,
            });

            this.map.SetDebug(this.debug);

            // check if cached data from prior call to map
            if (this.td)
            {
                this.MapData();
            }
        });

        if (this.ok)
        {
            this.ui = this.MakeUI();
            this.cfg.container.appendChild(this.ui);
        }
    }

    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.t.SetCcGlobal(tf);
    }

    OnEvent(evt)
    {
        if (this.ok)
        {
            switch (evt.type) {
                case "DATA_TABLE_RAW_READY": this.OnDataTableRawReady(evt); break;
            }
        }
    }

    OnDataTableRawReady(evt)
    {
        // cache data
        this.td = evt.tabularDataReadOnly;

        // check if we can map immediately
        if (this.mapModule != null)
        {
            this.MapData();
        }
    }

    MapData()
    {
        this.t.Reset();
        this.t.Event(`WsprSearchUiMapController::MapData Start`);

        // Prioritize spots from Grid, then RegGrid.
        // Return early if neither are available.
        let gridColName = "Grid";
        if (this.td.Idx(gridColName) == undefined)
        {
            gridColName = "RegGrid";
        }

        if (this.td.Idx(gridColName) != undefined)
        {
            let spotList = [];

            this.td.ForEach(row => {
                let grid = this.td.Get(row, gridColName);
                if (grid)
                {
                    // get a list of all the reporting stations
                    let seenDataList = [];
                    let metaData = this.td.GetRowMetaData(row);
                    for (let msg of metaData.slotMsgList)
                    {
                        if (msg)
                        {
                            for (let rxRecord of msg.rxRecordList)
                            {
                                let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(rxRecord.rxGrid);
            
                                let seenData = {
                                    sign: rxRecord.callsign,
                                    lat,
                                    lng,
                                    grid: rxRecord.rxGrid,
                                };
                
                                seenDataList.push(seenData);
                            }
                        }
                    }

                    // send along a cut-down version of the data available
                    let tdSpot = new TabularData(this.td.MakeDataTableFromRow(row));
                    tdSpot.DeleteEmptyColumns();
                    tdSpot.DeleteColumnList([
                        "Map", "DateTimeUtc",
                        "EncCall", "EncGrid", "EncPower", "Grid56",
                        "AltMRaw", "Knots", "GpsValid",
                        "RegCall", "RegGrid", "RegPower",
                        "RegSeen", "EncSeen", "SeenList",
                    ]);
        
                    let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid);
                    let spot = new this.mapModule.Spot({
                        lat: lat,
                        lng: lng,
                        grid: grid,
                        accuracy: grid.length == 6 ? "high" : "low",
                        dtLocal: tdSpot.Get(0, "DateTimeLocal"),
                        td: tdSpot,
                        seenDataList: seenDataList,
                    });
        
                    spotList.push(spot);
                }
            }, true);
        
            if (spotList.length)
            {
                this.map.SetSpotList(spotList);
            }
        }

        this.t.Event(`WsprSearchUiMapController::MapData End`);
    }

    MakeUI()
    {
        let ui = document.createElement("div");

        ui.style.boxSizing = "border-box";
        ui.style.border = "1px solid black";
        ui.style.width = "1210px";
        ui.style.height = "550px";

        ui.style.resize = "both";
        ui.style.overflow = "hidden";

        return ui;
    }
}