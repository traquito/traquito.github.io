import { Base } from './Base.js';

import { WsprSearch } from './WsprSearch.js';
import { WsprSearchResultDataTableBuilder } from './WsprSearchResultDataTableBuilder.js';

import { WsprSearchUiChartsController } from './WsprSearchUiChartsController.js';
import { WsprSearchUiInputController } from './WsprSearchUiInputController.js';
import { WsprSearchUiDataTableController } from './WsprSearchUiDataTableController.js';
import { WsprSearchUiStatsSearchController } from './WsprSearchUiStatsSearchController.js';


export class WsprSearchUi
extends Base
{
    constructor(cfg)
    {
        super();

        this.cfg = cfg;

        // search
        this.wsprSearch = new WsprSearch();

        this.wsprSearch.AddOnSearchCompleteEventHandler(() => {
            this.OnSearchComplete();
        })

        // ui input
        this.uiInput = new WsprSearchUiInputController({
            container: this.cfg.searchInput,
        });
        
        this.uiInput.SetBand("20m");
        this.uiInput.SetChannel(248);
        this.uiInput.SetCallsign("KD2KDD");
        // this.uiInput.SetGte("2023-11-16");
        // this.uiInput.SetLte("2023-11-16");
        this.uiInput.SetGte("2024-11-16");
        this.uiInput.SetLte("2024-12-16");

        // data table builder
        this.dataTableBuilder = new WsprSearchResultDataTableBuilder();
        
        // ui charts
        this.charts = new WsprSearchUiChartsController({
            container: this.cfg.charts,
        });

        // ui data table
        this.uiDataTable = new WsprSearchUiDataTableController({
            container: this.cfg.dataTable,
        });

        // ui stats
        this.uiStatsSearch = new WsprSearchUiStatsSearchController({
            container: this.cfg.searchStats,
            wsprSearch: this.wsprSearch,
        });

        setTimeout(() => {
            this.OnEvent({ type: "SEARCH_REQUESTED" });
        }, 10);
    }

    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.uiInput.SetDebug(tf);
        this.dataTableBuilder.SetDebug(tf);
        this.charts.SetDebug(tf);
        this.uiDataTable.SetDebug(tf);
        this.uiStatsSearch.SetDebug(tf);
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "SEARCH_REQUESTED": this.OnSearchRequest(); break;
        }
    }

    OnSearchRequest()
    {
        this.t.Reset();
        this.t.Event("WsprSearchUi::OnSearchRequest Callback Start");

        this.wsprSearch.Search(this.uiInput.GetBand(),
                               this.uiInput.GetChannel(),
                               this.uiInput.GetCallsign(),
                               this.uiInput.GetGte(),
                               this.uiInput.GetLte());
        
        this.t.Event("WsprSearchUi::OnSearchRequest Callback End");
    }

    OnSearchComplete()
    {
        this.t.Event("WsprSearchUi::OnSearchComplete Callback Start");

        this.Emit("SEARCH_COMPLETE");
        
        // have data table maker make data table
        // emit event saying data table ready (carry table with it)
        //   - UI charts/graphs/etc take this for raw data
        //   - should the map be driven off of this? maybe?
        //   - UI data table grabs it, copies, enriches, displays

        let td = this.dataTableBuilder.BuildDataTable(this.wsprSearch);

        this.Emit({
            type: "DATA_TABLE_RAW_READY",
            tabularDataReadOnly: td,
        });

        this.t.Event("WsprSearchUi::OnSearchComplete Callback End");
        // this.t.Report();
    }
}