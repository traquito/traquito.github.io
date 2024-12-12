import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { CSSDynamic } from './CSSDynamic.js';
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
        
        // jazz up data content
        this.ModifyTableContentsForDisplay(tdNew);

        // duplicate and enrich
        let table = utl.MakeTable(tdNew.GetDataTable());

        // jazz up webpage presentation
        this.ModifyWebpageFormatting(table);

        // replace with new
        this.cfg.container.appendChild(this.ui);
        this.cfg.container.appendChild(table);
    }

    ModifyTableContentsForDisplay(td)
    {
        this.AddCommas(td);
        this.Linkify(td);
        this.PrioritizeColumnOrder(td);
    }

    AddCommas(td)
    {
        let colList = [
            "AltM",
            "DistKm",
            "AltFt",
            "DistMi",
        ];

        for (const col of colList)
        {
            if (td.Idx(col))
            {
                td.GenerateModifiedColumn([
                    col
                ], row => {
                    let val = td.Get(row, col);
        
                    let retVal = [val];
        
                    if (val != null)
                    {
                        retVal = [utl.Commas(val)];
                    }
        
                    return retVal;
                });
            }
        }
    }

    Linkify(td)
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
    }

    PrioritizeColumnOrder(td)
    {
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

    ModifyWebpageFormatting(table)
    {
        let cd = new CSSDynamic();

        let rule = cd.GetOrMakeCssClass("EncPower_col")


        // column header colors
        for (let ccName of ["RegCall", "RegGrid", "RegPower"])
        {
            cd.SetCssClassProperties(`${ccName}_hdr`, {
                backgroundColor: "lightgreen",
            });
        }

        for (let ccName of ["EncCall", "EncGrid", "EncPower"])
        {
            cd.SetCssClassProperties(`${ccName}_hdr`, {
                backgroundColor: "lightpink",
            });
        }

        for (let ccName of ["GpsValid", "Grid56", "AltMRaw", "Knots"])
        {
            cd.SetCssClassProperties(`${ccName}_hdr`, {
                backgroundColor: "lightpink",
            });
        }

        for (let ccName of ["Grid", "Voltage"])
        {
            cd.SetCssClassProperties(`${ccName}_hdr`, {
                backgroundColor: "khaki",
            });
        }

        for (let ccName of ["AltM", "TempC", "KPH", "DistKm", "GpsKPH"])
        {
            cd.SetCssClassProperties(`${ccName}_hdr`, {
                backgroundColor: "paleturquoise",
            });
        }

        for (let ccName of ["AltFt", "TempF", "MPH", "DistMi", "GpsMPH"])
        {
            cd.SetCssClassProperties(`${ccName}_hdr`, {
                backgroundColor: "thistle",
            });
        }

        // give table a border
        table.classList.add(`DataTable`);

        cd.SetCssClassProperties(`DataTable`, {
            border: "1px solid black",
            borderSpacing: 0,
            // using this breaks the nice sticky header
            // borderCollapse: "collapse",
            borderCollapse: "separate",
        });

        // make sticky header
        let trHeader = table.tHead.rows[0];
        trHeader.classList.add(`DataTableHeader`);

        cd.SetCssClassProperties(`DataTableHeader`, {
            border: "1px solid black",
            top: "0px",
            position: "sticky",
            background: "white",
        });

        // give minor styling to cells
        table.querySelectorAll('td, th').forEach((cell) => {
            cell.style.textAlign = "center";
            cell.style.padding = '2px';
        });

        // do column groupings
        let columnGroupLeftRightList = [
            ["DateTimeUtc",   "DateTimeUtc"  ],
            ["DateTimeLocal", "DateTimeLocal"],
            ["RegCall",       "RegPower"     ],
            ["EncCall",       "EncPower"     ],
            ["GpsValid",      "Knots"        ],
            ["Grid",          "Voltage"      ],
            ["AltM",          "DistKm"       ],
            ["AltFt",         "DistMi"       ],
        ];

        for (let columnGroupLeftRight of columnGroupLeftRightList)
        {
            let [colLeft, colRight] = columnGroupLeftRight;

            cd.SetCssClassProperties(`${colLeft}_col`, {
                borderLeft: "1px solid black",
                borderCollapse: "collapse",
            });

            cd.SetCssClassProperties(`${colRight}_col`, {
                borderRight: "1px solid black",
                borderCollapse: "collapse",
            });
        }
    }

    MakeUI()
    {
        let ui = document.createElement("div");

        ui.innerHTML = "DataTableUI";
        
        return ui;
    }
}

