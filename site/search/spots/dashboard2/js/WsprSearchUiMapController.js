import * as utl from '/js/Utl.js';


import { Base } from './Base.js';




// import { SpotMap } from '../../dashboard/SpotMap.js';




// map class relies on external libraries to load, so we want to do the work of loading
// asynchronously and immediately as soon as the library is imported.
let mapLoadPromise = mapLoadPromise = import('./SpotMap.js');
let module = null;

// be the first to register for result, which is the loaded module
mapLoadPromise.then((result) => {
    module = result;
})

// any other caller will use this function, which will only fire after
// our registered-first 'then', so we know the spot map will be loaded.
export async function SetOnLoadCallback(fnOnLoad)
{
    mapLoadPromise.then(() => {
        console.log("map loaded, calling callback with module result")
        fnOnLoad(module);
    });
}





export class WsprSearchUiMapController
extends Base
{
    constructor(cfg)
    {
        super();

        this.cfg = cfg;

        this.ok = this.cfg.container;

        // map gets async loaded
        this.mapModule = null;
        this.map = null;
        SetOnLoadCallback((module) => {
            this.mapModule = module;
            
            this.map = new SpotMap({
                container: this.ui,
            });
        });

        if (WsprSearchUiMapController.mapLoadPromise == null)
        {
            console.log("SPOT NOT READY YET")
        }
        else
        {
            console.log("SPOT READY ON INIT")
        }

        if (this.ok)
        {
            this.ui = this.MakeUI();
            this.cfg.container.appendChild(this.ui);
        }
    }

    // map class relies on external libraries to load, so we want 
    static async LoadMap(fnOnLoad)
    {
        console.log("LoadMap")
        if (WsprSearchUiMapController.mapLoadPromise == null)
        {
            console.log("Promise created")
            WsprSearchUiMapController.mapLoadPromise = import('./SpotMap.js');

            const { Spot, SpotMap } = await WsprSearchUiMapController.mapLoadPromise;
            
            WsprSearchUiMapController.Spot = Spot;
            WsprSearchUiMapController.SpotMap = SpotMap;

            // await WsprSearchUiMapController.mapLoadPromise;
            console.log("await finished")
        }

        WsprSearchUiMapController.mapLoadPromise.then(() => {
            fnOnLoad();
        });
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
        if (WsprSearchUiMapController.mapLoadPromise == null)
        {
            console.log("SPOT NOT READY ON DATA TABLE")

        }
        else
        {
            console.log("SPOT READY ON DATA TABLE")

            // console.log(SpotMap);

            // let map = new SpotMap({
            //     container: this.ui,
            // });
        }


        // clear existing child nodes
        // this.ui.innerHTML = "Map with data table";

        // duplicate and enrich
        let td = evt.tabularDataReadOnly;

        // add charts
        if (td.Idx("AltM") && td.Idx("AltFt"))
        {
        }

        // update ui
        this.cfg.container.appendChild(this.ui);
    }

    MakeUI()
    {
        let ui = document.createElement("div");

        ui.style.boxSizing = "border-box";
        ui.style.border = "1px solid black";
        ui.style.width = "1210px";
        ui.style.height = "550px";

        ui.style.resize = "both";
        ui.style.overflow = "hidden";

        return ui;
    }
}