import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { ChartTimeSeries } from './Chart.js';


export class WsprSearchUiChartsController
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

            ChartTimeSeries.PreLoadExternalResources();
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
        this.ui.innerHTML = "";

        // duplicate and enrich
        let td = evt.tabularDataReadOnly;

        // load as many charts as are necessary

        let colHeaderList = [
            "AltM",
            "Knots",
            "Voltage",
        ];

        let chart = new ChartTimeSeries();
        chart.SetDebug(this.debug);
        this.ui.appendChild(chart.GetUI());

        chart.PlotData({
            td: td,

            xAxisDetail: {
                column: "DateTimeLocal",
            },

            // yAxisMode: "one",
            yAxisMode: "two",

            yAxisDetailList: [
                {
                    column: "AltM",
                    min:     0,
                    max: 22000,
                },
                {
                    column: "Knots",
                    min: 0,
                    max: 90,
                },
                // {
                //     column: "Voltage",
                //     min: 3,
                //     max: 4.95,
                // },
            ]
        });

        let Plot = (colName, min, max) => {
            let chart = new ChartTimeSeries();
            chart.SetDebug(this.debug);
            this.ui.appendChild(chart.GetUI());
    
            chart.PlotData({
                td: td,
    
                xAxisDetail: {
                    column: "DateTimeLocal",
                },
    
                yAxisMode: "one",
    
                yAxisDetailList: [
                    {
                        column: colName,
                        min   : min,
                        max   : max,
                    },
                ]
            });
        };

        Plot("Voltage")
        Plot("AltFt");
        Plot("TempF");
        Plot("MPH");



        // replace with new
        this.cfg.container.appendChild(this.ui);
    }

    MakeUI()
    {
        let ui = document.createElement("div");
        
        ui.style.boxSizing = "border-box";
        ui.style.display = "grid";
        ui.style.gridTemplateColumns = "1fr 1fr";   // two columns, equal spacing
        ui.style.gap = '0.5vw';

        ui.innerHTML = "ChartsBasic";
        
        return ui;
    }
}