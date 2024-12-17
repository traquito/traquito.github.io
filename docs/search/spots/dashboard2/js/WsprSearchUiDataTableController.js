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

        this.fieldDefinitionList = new Array(5).fill("");

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
        this.t.Reset();
        this.t.Event(`WsprSearchUiDataTableController::OnDataTableRawReady Start`);

        // clear existing child nodes
        this.cfg.container.innerHTML = "";

        // copy data so it can be modified without affecting other holders
        let tdNew = evt.tabularDataReadOnly.Clone();
        
        // jazz up data content
        this.ModifyTableContentsForDisplay(tdNew);

        // duplicate and enrich
        let table = utl.MakeTable(tdNew.GetDataTable());

        // jazz up webpage presentation
        this.ModifyWebpageFormatting(table);

        // replace with new
        this.cfg.container.appendChild(this.ui);
        this.cfg.container.appendChild(table);

        this.t.Event(`WsprSearchUiDataTableController::OnDataTableRawReady End`);
    }

    SetFieldDefinitionList(fieldDefinitionList)
    {
        this.fieldDefinitionList = fieldDefinitionList;
    }

    ModifyTableContentsForDisplay(td)
    {
        this.AddCommas(td);
        this.Linkify(td);
        this.LinkifyUserDefined(td);
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
    
                let retVal = [grid];
    
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

                let retVal = [grid4];

                if (grid4)
                {
                    let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid4);
        
                    let gmUrl = WSPREncoded.MakeGoogleMapsLink(lat, lng);
                    let grid4Link = `<a href="${gmUrl}" target="_blank">${grid4}</a>`;
        
                    retVal = [grid4Link];
                }
    
                return retVal;
            });
        }
    }

    LinkifyUserDefined(td)
    {
        for (let slot = 0; slot < 5; ++slot)
        {
            let colName = `slot${slot}.EncMsg`;

            if (td.Idx(colName))
            {
                td.GenerateModifiedColumn([
                    colName
                ], row => {
                    let val = td.Get(row, colName);
    
                    let retVal = [val];
    
                    if (val)
                    {
                        let link = ``;
                        link += `/pro/codec/`;
                        link += `?codec=${encodeURIComponent(this.fieldDefinitionList[slot])}`;
                        link += `&decode=${val}`;

                        let a = `<a href='${link}' target='_blank'>${val}</a>`;
            
                        retVal = [a];
                    }
        
                    return retVal;
                });
            }
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
        this.ModifyWebpageFormattingBasic(table);
        this.ModifyWebpageFormattingExtendedUserDefined(table);
    }

    ModifyWebpageFormattingBasic(table)
    {
        let cd = new CSSDynamic();

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

        // make data rows highlight when you mouse over them
        cd.SetCssClassProperties(`DataTable tr:hover`, {
            backgroundColor: "rgb(215, 237, 255)",
        });

        // look for every column header class name that applies to the column.
        // ie column classes that end with _col.
        let colClassList = [];

        const colGroupList = table.querySelectorAll('colgroup');    // should just be the one
        console.log(colGroupList)

        for (let colGroup of colGroupList)
        {
            for (let childNode of colGroup.childNodes)
            {
                for (let className of childNode.classList)
                {
                    let suffix = className.slice(-4);

                    if (suffix == "_col")
                    {
                        colClassList.push(className);
                    }
                }
            }
        }

        // give minor styling to all cells in the table, by column property.
        // this allows more nuanced control by other css properties to affect
        // cells beyond this.
        for (let colClass of colClassList)
        {
            cd.SetCssClassProperties(colClass, {
                textAlign: "center",
                padding: "2px",
            });
        }


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

    ModifyWebpageFormattingExtendedUserDefined(table)
    {
        let cd = new CSSDynamic();

        for (let slot = 0; slot < 5; ++slot)
        {
            cd.SetCssClassProperties(utl.StrToCssClassName(`slot${slot}.EncMsg_data`), {
                textAlign: "left",
            });
        }
    }

    MakeUI()
    {
        let ui = document.createElement("div");

        return ui;
    }
}

