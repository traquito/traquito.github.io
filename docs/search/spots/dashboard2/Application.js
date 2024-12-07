import * as utl from '/js/Utl.js';

import { Timeline } from '/js/Timeline.js';
import { WsprSearch } from './js/WsprSearch.js';
import { WsprSearchUiController } from './js/WsprSearchUiController.js';


// Ties the particulars of this page to operating search libraries
export class Application
{
    constructor(cfg)
    {
        this.cfg = cfg;

        this.t = new Timeline();
        this.t.SetLogOnEvent(true);

        this.domTestButton = document.getElementById(cfg.idTestButton);

        this.search = new WsprSearch();

        this.uiCtl = new WsprSearchUiController();
        this.uiCtl.SetOnSearchEventHandler(() => {
            this.OnSearch();
        });

        // for testing
        this.uiCtl.SetBand("20m");
        this.uiCtl.SetChannel(248);
        this.uiCtl.SetCallsign("KD2KDD");
        this.uiCtl.SetGte("2023-11-16");
        this.uiCtl.SetLte("2023-11-16");
    }

    OnSearch()
    {
        this.t.Event("App OnSearch callback start");

        this.search.SetOnSearchCompleteEventHandler(() => {
            this.OnSearchComplete();
        });

        this.search.Search(this.uiCtl.GetBand(),
                           this.uiCtl.GetChannel(),
                           this.uiCtl.GetCallsign(),
                           this.uiCtl.GetGte(),
                           this.ConvertLte(this.uiCtl.GetLte()));
        
        this.t.Event("App OnSearch callback start");
    }

    OnSearchComplete()
    {
        this.t.Event("App OnSearchComplete callback start");

        // this.t.Report("Application");
    }

    Run()
    {
        document.body.appendChild(this.uiCtl.GetUI());
    }


    ConvertLte(lte)
    {
        // let the end time (date) be inclusive
        // so if you have 2023-04-28 as the end date, everything for the entire
        // day should be considered.
        // since the querying system wants a cutoff date (lte datetime), we
        // just shift the date of today forward by an entire day, changing it from
        // a cutoff of today at morning midnight to tomorrow at morning midnight.
        // throw in an extra hour for daylight savings time scenarios

        let retVal = lte;
        if (lte != "")
        {
            let ms = utl.ParseTimeToMs(lte);
            ms += (25 * 60 * 60 * 1000);
    
            retVal = utl.MakeDateFromMs(ms);
        }

        return retVal;
    }

}
