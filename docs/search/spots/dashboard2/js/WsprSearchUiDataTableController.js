import * as utl from '/js/Utl.js';

import { Base } from './Base.js';


export class WsprSearchUiDataTableController
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
        this.cfg.container.innerHTML = "";

        // duplicate and enrich
        let table = utl.MakeTable(evt.tabularDataReadOnly.GetDataTable());

        // replace with new
        this.cfg.container.appendChild(this.ui);
        this.cfg.container.appendChild(table);
    }

    MakeUI()
    {
        let ui = document.createElement("div");

        ui.innerHTML = "DataTableUI";
        
        return ui;
    }
}

