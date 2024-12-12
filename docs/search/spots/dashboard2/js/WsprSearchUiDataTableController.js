import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { WSPREncoded } from '/js/WSPREncoded.js';
import { TabularData } from '../../../../js/TabularData.js';



export class WsprSearchUiDataTableController
extends Base
{
    constructor(cfg)
    {
        super();

        this.cfg = cfg;

        this.ok = this.cfg.container;

        if (this.ok)
        {
            this.ui = this.MakeUI();
            this.cfg.container.appendChild(this.ui);
        }
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
        // clear existing child nodes
        this.cfg.container.innerHTML = "";

        let tdNew = new TabularData(evt.tabularDataReadOnly.GetDataTable());
        
        // jazz up
        this.ModifyTableContentsForDisplay(tdNew);

        // duplicate and enrich
        let table = utl.MakeTable(tdNew.GetDataTable());

        // replace with new
        this.cfg.container.appendChild(this.ui);
        this.cfg.container.appendChild(table);
    }

    ModifyTableContentsForDisplay(td)
    {
        if (td.Idx("Grid"))
        {
            // linkify grid
            td.GenerateModifiedColumn([
                "Grid"
            ], row => {
                let grid = td.Get(row, "Grid");
    
                let retVal = [""];
    
                if (grid)
                {
                    let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid);
    
                    let gmUrl = WSPREncoded.MakeGoogleMapsLink(lat, lng);
                    let gridLink = `<a href="${gmUrl}" target="_blank">${grid}</a>`;
    
                    retVal = [gridLink];
                }
    
                return retVal;
            });
        }

        if (td.Idx("RegGrid"))
        {
            // linkify grid4
            td.GenerateModifiedColumn([
                "RegGrid"
            ], row => {
                let grid4 = td.Get(row, "RegGrid");
    
                let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid4);
    
                let gmUrl = WSPREncoded.MakeGoogleMapsLink(lat, lng);
                let grid4Link = `<a href="${gmUrl}" target="_blank">${grid4}</a>`;
    
                let retVal = [grid4Link];
    
                return retVal;
            });
        }

        // set column order
        td.PrioritizeColumnOrder([
            "DateTimeUtc", "DateTimeLocal",
            "RegSeen", "EncSeen",
            "RegCall", "RegGrid", "RegPower",
            "EncCall", "EncGrid", "EncPower",
            "GpsValid", "Grid56", "AltMRaw", "Knots",
            "Grid", "Voltage",
            "AltM",  "TempC", "KPH", "GpsKPH", "DistKm",
            "AltFt", "TempF", "MPH", "GpsMPH", "DistMi",
        ]);
    }

    MakeUI()
    {
        let ui = document.createElement("div");

        ui.innerHTML = "DataTableUI";
        
        return ui;
    }
}

