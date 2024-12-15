import * as utl from '/js/Utl.js';

import { Timeline } from '/js/Timeline.js';


// fold this functionality back into the original Event.js later
class Event
{
    static handlerList = [];

    AddHandler(handler)
    {
        Event.handlerList.push(handler);
    }

    Emit(evt)
    {
        if (typeof(evt) == "string")
        {
            evt = {
                type: evt
            };
        }

        for (const evtHandler of Event.handlerList)
        {
            if (evtHandler.OnEvent)
            {
                evtHandler.OnEvent(evt);
            }
        }
    }
}


export class Base
extends Event
{
    static globalDebugAnyway = false;

    constructor(t)
    {
        super();

        this.AddHandler(this);

        // timeline
        this.t = t ?? new Timeline();


        //
        // logging levels
        //

        // debug
        this.debug = false;

        // info
        this.info = true;
    }

    // only to be called once, from main application, when everything is
    // constructed and ready to go
    Run()
    {
        urlStateProxy.OnPageLoad();
    }

    SetDebug(tf)
    {
        this.debug = tf;
    }

    SetGlobalDebug(tf)
    {
        Base.globalDebugAnyway = tf;
    }

    Debug(str)
    {
        if (this.debug || Base.globalDebugAnyway)
        {
            console.log(str);
        }
    }

    DebugTable(val)
    {
        if (this.debug || Base.globalDebugAnyway)
        {
            console.table(val);
        }
    }

    SetInfo(tf)
    {
        this.info = tf;
    }

    Info(str)
    {
        if (this.info)
        {
            console.log(str);
        }
    }

    Err(from, str)
    {
        console.log(`ERR: ${from} - ${str}`);
    }
}



// A class that does the work of helping components interact with the URL
// and the variables captured within the URL.
//
// Also manages browser history and gives the typical user experience of
// how history works, without page reloads.
class UrlStateProxy
extends Base
{
    constructor()
    {
        super();

        this.urlPrior = "";

        window.addEventListener("popstate", (event) => {
            console.log(event);
            this.DoUrlSet();
        });
    }

    OnPageLoad()
    {
        this.DoUrlSet();
        this.DoUrlGet();
    }

    DoUrlSet()
    {
        // capture current url and its search params, and parse
        const url    = new URL(window.location);
        const params = new URLSearchParams(url.search);
        
        // console.log(`window.location: ${window.location}`)
        // console.log(`urlIn.origin: ${url.origin}`)
        // console.log(`urlIn.pathname: ${url.pathname}`)
        // console.log(`urlIn.search: ${url.search}`)
        // console.log(`paramsIn : ${params.toString()}`);

        // synchronously send to interested listeners
        this.Emit({
            type: "ON_URL_SET",

            Get: (param, defaultValue) => {
                return utl.GetSearchParam(param, defaultValue);
            },
        });
    }

    DoUrlGet()
    {
        // synchronously send to interested listeners
        let paramsOut = new URLSearchParams(``);
        this.Emit({
            type: "ON_URL_GET",

            Set: (param, value) => {
                paramsOut.set(param, value);
            },
        });

        const urlIn = new URL(window.location);
        let paramsIn = new URLSearchParams(urlIn.search);

        // filter out blank parameters
        for (let [key, value] of Array.from(paramsOut.entries()))
        {
            if (value === "")
            {
                paramsOut.delete(key);
            }
        }
        
        const urlOut = new URL(`${urlIn.origin}${urlIn.pathname}?${paramsOut.toString()}`);

        // console.log("")
        // console.log("")
        // console.log(`old    : ${urlIn.href}`);
        // console.log(`params : ${paramsOut.toString()}`);
        // console.log(`new    : ${urlOut.href}`);

        let paramsInSorted = new URLSearchParams(paramsIn.toString());
        paramsInSorted.sort();
        let pIn = paramsInSorted.toString();
        
        let paramsOutSorted = new URLSearchParams(paramsOut.toString());
        paramsOutSorted.sort();
        let pOut = paramsOutSorted.toString();

        let didNewHistoryEntry = false;
        if (pIn != pOut)
        {
            // console.log("params are different, updating url and history")
            // console.log(pIn)
            // console.log(pOut)

            history.pushState({}, "", urlOut.href);

            didNewHistoryEntry = true;
        }

        return didNewHistoryEntry;
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "REQ_URL_GET": this.OnReqUrlGet(); break;
        }
    }

    OnReqUrlGet()
    {
        // the purpose of this is to blow away the forward history when (say)
        // a user clicks search, which triggers a URL re-evaluation.
        let didNewHistoryEntry = this.DoUrlGet();

        if (didNewHistoryEntry == false)
        {
            // force new history, request came in to re-evaluate, clearly
            // a change has occurred.
            history.pushState({}, "", window.location);
        }
    }
}

// global single instance
let urlStateProxy = new UrlStateProxy();


