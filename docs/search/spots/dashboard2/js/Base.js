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