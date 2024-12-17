import { Base } from './Base.js';

import { WsprSearch } from './WsprSearch.js';

import { WsprSearchUiChartsController } from './WsprSearchUiChartsController.js';
import { WsprSearchUiInputController } from './WsprSearchUiInputController.js';
import { WsprSearchUiDataTableController } from './WsprSearchUiDataTableController.js';
import { WsprSearchUiMapController } from './WsprSearchUiMapController.js';
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
        
        // ui map
        this.uiMap = new WsprSearchUiMapController({
            container: this.cfg.map,
        });
        
        // ui charts
        this.uiCharts = new WsprSearchUiChartsController({
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
    }

    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.t.SetCcGlobal(tf);

        this.wsprSearch.SetDebug(tf);

        this.uiInput.SetDebug(tf);
        this.uiMap.SetDebug(tf);
        this.uiCharts.SetDebug(tf);
        this.uiDataTable.SetDebug(tf);
        this.uiStatsSearch.SetDebug(tf);
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "SEARCH_REQUESTED": this.OnSearchRequest(evt); break;
        }
    }

    OnSearchRequest(evt)
    {
        this.t.Global().Reset();
        this.t.Reset();
        this.t.Event("WsprSearchUi::OnSearchRequest Callback Start");

        if (evt.fieldDefinitionList)
        {
            this.wsprSearch.SetFieldDefinitionList(evt.fieldDefinitionList);
            this.uiDataTable.SetFieldDefinitionList(evt.fieldDefinitionList);
        }

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
        
        let td = this.wsprSearch.GetDataTable();
        this.Emit({
            type: "DATA_TABLE_RAW_READY",
            tabularDataReadOnly: td,
        });

        this.t.Event("WsprSearchUi::OnSearchComplete Callback End");

        // this.t.Global().Report(`WsprSearchUi Global`)
    }
}