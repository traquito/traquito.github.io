import { Base } from './Base.js';

import { WsprSearch } from './WsprSearch.js';
import { WsprSearchResultDataTableBuilder } from './WsprSearchResultDataTableBuilder.js';

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
            container: cfg.searchInput,
        });
        
        this.uiInput.SetBand("20m");
        this.uiInput.SetChannel(248);
        this.uiInput.SetCallsign("KD2KDD");
        this.uiInput.SetGte("2023-11-16");
        this.uiInput.SetLte("2023-11-16");
        
        // ui results
        this.uiDataTable = new WsprSearchUiDataTableController(this.wsprSearch);

        // ui stats
        this.uiStatsSearch = new WsprSearchUiStatsSearchController({
            container: cfg.searchStats,
            wsprSearch: this.wsprSearch,
        });
    }

    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.uiInput.SetDebug(tf);
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

        this.t.Event("WsprSearchUi::OnSearchComplete Callback End");
        this.t.Report();
    }
}