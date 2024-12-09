import * as utl from '/js/Utl.js';

import { Base } from './Base.js';


///////////////////////////////////////////////////////////////////////////////
// Cached Loader
//
// Cache subsequent loads for the same resource, which all takes their own
// load time, even when the url is the same.
///////////////////////////////////////////////////////////////////////////////

export class CachedLoader
{
    static url__scriptPromise = new Map();
    static AsyncLoadScript(url)
    {
        if (this.url__scriptPromise.has(url) == false)
        {
            let p = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.async = true;
                
                script.onload = () => {
                    resolve();
                };

                script.onerror = (message) => {
                    reject(new Error(message));
                }
    
                document.body.appendChild(script);
            });

            this.url__scriptPromise.set(url, p);
        }

        let p = this.url__scriptPromise.get(url);

        return p;
    }

    static url__stylesheetPromise = new Map();
    static AsyncLoadStylesheet(url)
    {
        if (this.url__stylesheetPromise.has(url) == false)
            {
            let p = new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = "stylesheet";
                link.href = url;
                link.async = true;
        
                link.onload = () => {
                    resolve();
                };

                link.onerror = (message) => {
                    reject(new Error(message));
                };
    
                document.body.appendChild(link);
            });

            this.url__stylesheetPromise.set(url, p);
        }

        let p = this.url__stylesheetPromise.get(url);

        return p;
    }
}
















///////////////////////////////////////////////////////////////////////////////
// Chart Base
///////////////////////////////////////////////////////////////////////////////

class ChartBase
extends Base
{
    static urlEchartsScript = `https://fastly.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min.js`;
    
    static urlDatGuiScript = `https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.min.js`;
    static urlDatGuiCss    = `https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.min.css`;

    constructor()
    {
        super();

        this.ui = this.MakeUI();
        this.data = null;

        this.chart = echarts.init(this.ui);

        this.HandleResizing();

        this.resourcesOutstanding = 0;
        this.LoadResources();
    }

    Ok()
    {
        return this.resourcesOutstanding == 0;
    }

    HandleResizing()
    {
        // This is very smooth, except when the resizing causes other page
        // elements to move (especially big ones).
        let isResizing = false;
        const resizeObserver = new ResizeObserver(() => {
            if (!isResizing)
            {
                isResizing = true;
                
                window.requestAnimationFrame(() => {
                    this.chart.resize();
                    isResizing = false;
                });
            }
        });
        resizeObserver.observe(this.ui);
    }

    static GetExternalScriptResourceUrlList()
    {
        return [
            ChartBase.urlEchartsScript,
            ChartBase.urlDatGuiScript,
        ];
    }

    static GetExternalStylesheetResourceUrlList()
    {
        return [
            ChartBase.urlDatGuiCss,
        ];
    }
    
    // This loads external resources on page load instead of when the chart is activated.
    // ECharts took 150ms+ to load.
    static PreLoadExternalResources()
    {
        let urlScriptList = [];
        urlScriptList.push(... ChartBase.GetExternalScriptResourceUrlList());
        for (const url of urlScriptList)
        {
            CachedLoader.AsyncLoadScript(url);
        }

        let urlStylesheetList = [];
        urlStylesheetList.push(... ChartBase.GetExternalStylesheetResourceUrlList());
        for (const url of urlStylesheetList)
        {
            CachedLoader.AsyncLoadStylesheet(url);
        }
    }

    GetUI()
    {
        return this.ui;
    }

    PlotData(data)
    {
        // This can happen before, during, or after all external resources are loaded.
        // In the event not all resources loaded, cache the data.
        this.data = data;

        if (this.resourcesOutstanding == 0)
        {
            this.PlotDataNow(this.data);
        }
    }


// private

    MakeUI()
    {
        this.ui = document.createElement('div');

        this.ui.innerHTML = "Chart"
        this.ui.style.boxSizing = "border-box";
        this.ui.style.border = "1px solid black";
        // this.ui.style.height = "300px";
        this.ui.style.height = "30vh";
        this.ui.style.minHeight = "250px";

        this.ui.style.resize = "both";
        this.ui.style.overflow = "hidden";  // tooltips do this

        return this.ui;
    }

    PlotDataNow(data)
    {
        // placeholder for inheriting classes to implement
    }

    LoadResources()
    {
        // script is critical, must wait for it to load
        for (const url of ChartBase.GetExternalScriptResourceUrlList())
        {
            this.AsyncLoadScriptAndPlotIfAllComplete(url);
        }
    
        // css is not critical, load (or not), but we continue
        for (const url of ChartBase.GetExternalStylesheetResourceUrlList())
        {
            CachedLoader.AsyncLoadStylesheet(url);
        }
    }

    async AsyncLoadScriptAndPlotIfAllComplete(url)
    {
        try
        {
            ++this.resourcesOutstanding;

            await CachedLoader.AsyncLoadScript(url);
            
            --this.resourcesOutstanding;
        }
        catch (e)
        {
            this.Err(`Chart`, `Could not load ${url} - ${e}.`)
        }

        // check if cached data to plot
        if (this.data && this.resourcesOutstanding == 0)
        {
            this.PlotDataNow(this.data);
        }
    }
}












///////////////////////////////////////////////////////////////////////////////
// ECharts Utils - just factoring out some common functionality
///////////////////////////////////////////////////////////////////////////////

class EChartsUtils
{
    static XAxisFormatter(params)
    {
        // convert the ms time value into human-readable
        let ts = utl.MakeDateTimeFromMs(params.value);
    
        // last char is could be an odd minute, let's eliminate that
        let lastChar = ts.charAt(ts.length - 1);
        if ("02468".indexOf(lastChar) == -1)
        {
            let lastCharNew = String.fromCharCode(lastChar.charCodeAt(0) - 1);
    
            ts = ts.substring(0, ts.length - 1) + lastCharNew;
        }
    
        return ts;
    };

    static Pointer(params)
    {
        return EChartsUtils.RoundCommas(params.value);
    };
    
    static RoundCommas(val)
    {
        return utl.Commas(Math.round(val));
    }

    static OnZoomShowPoints(chart)
    {
        // Get the current data window
        const axisInfo = chart.getModel().getComponent('xAxis').axis;
        const [startValue, endValue] = axisInfo.scale.getExtent();

        let MS_IN_24_HOURS = 24 * 60 * 60 * 1000;
        let MS_IN_5_DAYS = MS_IN_24_HOURS * 5;

        let useSymbol = ((endValue - startValue) <= MS_IN_5_DAYS);

        let seriesCfgList = [];
        for (let series in chart.getOption().series)
        {
            seriesCfgList.push({
                symbol: useSymbol ? "circle" : "none",
                symbolSize: 6,
            });
        }
        // apply updated value
        chart.setOption({
            series: seriesCfgList,
        });
    };
}






///////////////////////////////////////////////////////////////////////////////
// ChartTimeSeries
//
// https://echarts.apache.org/en/option.html
///////////////////////////////////////////////////////////////////////////////

export class ChartTimeSeries
extends ChartBase
{
    constructor()
    {
        super();
    }

    OnEvent(evt)
    {
        if (this.Ok())
        {
            switch (evt.type) {
                case "TIME_SERIES_SET_ZOOM": this.OnSetZoom(evt); break;
            }
        }
    }

    OnSetZoom(evt)
    {
        if (evt.origin != this)
        {
            this.chart.setOption({
                dataZoom: [
                    {
                        startValue: evt.startValue,
                        endValue: evt.endValue,
                    },
                ],
            });
        }
    }



    // Plot any number of series in a single chart.
    //
    // Expects data to have the format:
    // {
    //     td: TabularData,
    //
    //     xAxisDetail: {
    //         column: "DateTimeLocal",
    //     },
    //
    //     // put all series on two axes, or one
    //     yAxisMode: "two",
    //
    //     yAxisDetailList: [
    //         {
    //             column: "Voltage",
    //             min   : 3
    //             max   : 4.95
    //         },
    //         ...
    //     ],
    // }
    PlotDataNow(data)
    {
        let td = data.td;

        // cache
        let timeCol = data.xAxisDetail.column;
        
        // get series data
        let seriesDataList = [];
        for (const yAxisDetail of data.yAxisDetailList)
        {
            let seriesData = td.ExtractDataOnly([timeCol, yAxisDetail.column]);

            seriesDataList.push(seriesData);
        }

        // create chart options
        let option = {};

        // x-axis options
        option.xAxis = {
            type: "time",
            axisPointer: {
                show: true,
                label: {
                    formatter: EChartsUtils.XAxisFormatter,
                },
            },
            axisLabel: {
                formatter: {
                    day: "{MMM} {d}",
                },
            },
        };

        // zoom options
        option.dataZoom = [
            {
                type: 'inside',
                filterMode: "none",
            },
        ];

        // y-axis options
        let yAxisObjList = [];
        for (let i = 0; i < data.yAxisDetailList.length; ++i)
        {
            let obj = {
                type: "value",
                name: data.yAxisDetailList[i].column,

                // this was only on the first object, so, do that dynamically? something else?
                // splitLine: {
                //     show: false,
                // },

                axisPointer: {
                    show: true,
                    label: {
                        formatter: EChartsUtils.Pointer,
                    },
                },
                axisLabel: {
                    // formatter: EChartsUtils.RoundCommas,
                },
            };

            let min = data.yAxisDetailList[i].min;
            let max = data.yAxisDetailList[i].max;
            if (i == 0)
            {
                // first series always on the left-axis

                if (min != undefined) { obj.min = min; }
                if (max != undefined) { obj.max = max; }
            }
            else
            {
                if (data.yAxisMode == "one")
                {
                    // can also assign the right-side y-axis to be the same values as left
                    // if that looks nicer
                    // obj.min = data.yAxisDetailList[0].min;
                    // obj.max = data.yAxisDetailList[0].max;
                }
                else
                {
                    // use the specified min/max for this series
                    if (min != undefined) { obj.min = min; }
                    if (max != undefined) { obj.max = max; }
                }
            }

            yAxisObjList.push(obj);
        }
        option.yAxis = yAxisObjList;

        // series options
        let seriesObjList = [];
        for (let i = 0; i < data.yAxisDetailList.length; ++i)
        {
            let obj = {
                name: data.yAxisDetailList[i].column,
                type: "line",

                yAxisIndex: data.yAxisMode == "one" ? 0 : i,

                data: seriesDataList[i],
                connectNulls: true,
            };

            if (seriesDataList[i].length >= 1)
            {
                obj.symbol = "none";
            }

            seriesObjList.push(obj);
        }
        option.series = seriesObjList;

        // tooltip options
        option.tooltip = {
            show: true,
            trigger: "axis",
            confine: true,
            formatter: params => {
                let retVal = undefined;

                let idx = params[0].dataIndex;

                let msg = ``;

                let sep = ``;
                let countWithVal = 0;
                for (let i = 0; i < data.yAxisDetailList.length; ++i)
                {
                    let col = data.yAxisDetailList[i].column;
                    let val = seriesDataList[i][idx][1];

                    if (val == undefined)
                    {
                        val = "";
                    }
                    else
                    {
                        ++countWithVal;
                    }

                    msg += sep;
                    msg += `${col}: ${val}`;

                    sep = `<br/>`;
                }

                if (countWithVal)
                {
                    retVal = msg;
                }

                return retVal;
            },
        };

        // animation options
        option.animation = false;

        // grid options
        option.grid = {
            top: "40px",
            left: "50px",
            bottom: "30px",
        };

        // legend options
        option.legend = {
            show: true,
        };

        // plot
        this.chart.setOption(option, true);
        
        // handle zoom
        this.chart.on('dataZoom', () => {
            EChartsUtils.OnZoomShowPoints(this.chart);
        });
        EChartsUtils.OnZoomShowPoints(this.chart);

        // let others join in on the zoom fun
        this.chart.on('dataZoom', () => {
            const axisInfo = this.chart.getModel().getComponent('xAxis').axis;
            const [startValue, endValue] = axisInfo.scale.getExtent();

            this.Emit({
                type: "TIME_SERIES_SET_ZOOM",
                origin: this,
                startValue,
                endValue,
            });
        });
    }
}






