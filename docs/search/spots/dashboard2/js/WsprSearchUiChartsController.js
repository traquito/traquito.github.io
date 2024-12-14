import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import {
    ChartTimeSeries,
    ChartTimeSeriesTwoEqualSeriesOneLine,
    ChartTimeSeriesTwoEqualSeriesOneLinePlus,
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
        if (td.Idx("AltM") && td.Idx("AltFt"))
        {
            this.PlotTwoSeriesOneLine(td, ["AltM", "AltFt"]);
        }

        if (td.Idx("MPH")    && td.Idx("KPH") &&
            td.Idx("GpsMPH") && td.Idx("GpsKPH"))
        {
            this.PlotTwoEqualSeriesPlus(td, ["KPH", "MPH", "GpsKPH", "GpsMPH"], 0, 290, 0, 180);
        }

        if (td.Idx("TempC") && td.Idx("TempF"))
        {
            this.PlotTwoSeriesOneLine(td, ["TempC", "TempF"]);
        }

        if (td.Idx("Voltage"))
        {
            this.Plot(td, "Voltage");
        }

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
        
        return ui;
    }

    Plot(td, colName, min, max)
    {
        let chart = new ChartTimeSeries();
        chart.SetDebug(this.debug);
        this.ui.appendChild(chart.GetUI());

        // if caller doesn't specify, look up metadata (if any)
        let metaData = td.GetColMetaData(colName);
        if (metaData)
        {
            if (min == undefined) { min = metaData.rangeMin; }
            if (max == undefined) { max = metaData.rangeMax; }
        }

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

    PlotMulti(td, colNameList)
    {
        let chart = new ChartTimeSeries();
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

    PlotTwoEqualSeriesPlus(td, colNameList, minExtra0, maxExtra0, minExtra1, maxExtra1)
    {
        let chart = new ChartTimeSeriesTwoEqualSeriesOneLinePlus();
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

        // force the min/max of the 2 additional series
        yAxisDetailList[2].min = minExtra0;
        yAxisDetailList[2].max = maxExtra0;

        yAxisDetailList[3].min = minExtra1;
        yAxisDetailList[3].max = maxExtra1;

        chart.PlotData({
            td: td,

            xAxisDetail: {
                column: "DateTimeLocal",
            },

            yAxisDetailList,
        });
    };
}