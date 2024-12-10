import * as utl from '/js/Utl.js';

import { Base } from './js/Base.js';
import { Timeline } from '/js/Timeline.js';

import { WsprSearchUi } from './js/WsprSearchUi.js';


export class Application
extends Base
{
    constructor(cfg)
    {
        super();

        // whoops, forgot about need to debug init code also, so turn this on
        this.SetGlobalDebug(true);

        // cache config
        this.cfg = cfg;

        // get handles for dom elements
        // ...

        // UI
        this.wsprSearchUi = new WsprSearchUi({
            searchInput: document.getElementById(cfg.searchInputId),
            searchStats: document.getElementById(cfg.searchStatsId),
        });

        // debug
        this.SetDebug(true);
    }
    
    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.wsprSearchUi.SetDebug(this.debug);
    }

    Run()
    {
    }
}
