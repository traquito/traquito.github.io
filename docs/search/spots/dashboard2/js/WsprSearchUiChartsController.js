import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import {
    ChartTimeSeries,
    ChartTimeSeriesTwoEqualSeriesOneLine,
    ChartTimeSeriesTwoEqualSeriesOneLinePlusOne,
} from './Chart.js';


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

        // add charts
        this.PlotTwoSeriesOneLine(td, ["AltM", "AltFt"]);
        this.PlotTwoEqualSeriesPlusOne(td, ["MPH", "KPH", "Knots"]);
        this.PlotTwoSeriesOneLine(td, ["TempC", "TempF"]);
        this.Plot(td, "Voltage");

        // update ui
        this.cfg.container.appendChild(this.ui);
    }

    MakeUI()
    {
        let ui = document.createElement("div");
        
        ui.style.boxSizing = "border-box";
        ui.style.width = "1210px";
        ui.style.display = "grid";
        ui.style.gridTemplateColumns = "1fr 1fr";   // two columns, equal spacing
        ui.style.gap = '0.5vw';

        ui.innerHTML = "ChartsBasic";
        
        return ui;
    }

    Plot(td, colName, min, max)
    {
        let chart = new ChartTimeSeries();
        chart.SetDebug(this.debug);
        this.ui.appendChild(chart.GetUI());

        // if caller doesn't specify, look up metadata (if any)
        let metaData = td.GetColMetaData(colName);
        if (min == undefined) { min = metaData.rangeMin; }
        if (max == undefined) { max = metaData.rangeMax; }

        chart.PlotData({
            td: td,

            xAxisDetail: {
                column: "DateTimeLocal",
            },

            yAxisMode: "one",

            yAxisDetailList: [
                {
                    column: colName,
                    min,
                    max,
                },
            ]
        });
    };

    PlotTwoSeriesOneLine(td, colNameList)
    {
        let chart = new ChartTimeSeriesTwoEqualSeriesOneLine();
        chart.SetDebug(this.debug);
        this.ui.appendChild(chart.GetUI());

        let yAxisDetailList = [];

        for (const colName of colNameList)
        {
            let metaData = td.GetColMetaData(colName);

            yAxisDetailList.push({
                column: colName,
                min: metaData.rangeMin,
                max: metaData.rangeMax,
            });
        }

        chart.PlotData({
            td: td,

            xAxisDetail: {
                column: "DateTimeLocal",
            },

            yAxisDetailList,
        });
    };

    PlotTwoEqualSeriesPlusOne(td, colNameList)
    {
        let chart = new ChartTimeSeriesTwoEqualSeriesOneLinePlusOne();
        chart.SetDebug(this.debug);
        this.ui.appendChild(chart.GetUI());

        let yAxisDetailList = [];

        for (const colName of colNameList)
        {
            let metaData = td.GetColMetaData(colName);

            yAxisDetailList.push({
                column: colName,
                min: metaData.rangeMin,
                max: metaData.rangeMax,
            });
        }

        chart.PlotData({
            td: td,

            xAxisDetail: {
                column: "DateTimeLocal",
            },

            yAxisDetailList,
        });
    };
}