import * as utl from '/js/Utl.js';

import { Base } from './js/Base.js';
import { Timeline } from '/js/Timeline.js';
import { WsprSearch } from './js/WsprSearch.js';
import { WsprSearchInputUiController } from './js/WsprSearchInputUiController.js';


// Ties the particulars of this page to operating search libraries
export class Application
extends Base
{
    constructor(cfg)
    {
        super();

        // cache config
        this.cfg = cfg;

        // search interface
        this.search = new WsprSearch();

        // ui control
        this.uiCtl = new WsprSearchInputUiController();
        this.uiCtl.SetOnSearchEventHandler(() => {
            this.OnSearch();
        });

        this.uiCtl.SetBand("20m");
        this.uiCtl.SetChannel(248);
        this.uiCtl.SetCallsign("KD2KDD");
        this.uiCtl.SetGte("2023-11-16");
        this.uiCtl.SetLte("2023-11-16");

        // get handles for dom elements


        // debug
        this.SetDebug(true);
    }
    
    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.search.SetDebug(this.debug)
    }

    OnSearch()
    {
        this.t.Reset();
        this.t.Event("App::OnSearch Callback Start");

        this.search.SetOnSearchCompleteEventHandler(() => {
            this.OnSearchComplete();
        });

        this.search.Search(this.uiCtl.GetBand(),
                           this.uiCtl.GetChannel(),
                           this.uiCtl.GetCallsign(),
                           this.uiCtl.GetGte(),
                           this.uiCtl.GetLte());
        
        this.t.Event("App::OnSearch Callback End");
    }

    OnSearchComplete()
    {
        this.t.Event("App::OnSearchComplete Callback Start");
        
        
        this.t.Event("App::OnSearchComplete Callback End");
        this.t.Report("App")
    }

    Run()
    {
        document.body.appendChild(this.uiCtl.GetUI());
    }
}
