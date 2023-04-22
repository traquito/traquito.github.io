export class Event
{
    static handlerList = [];

    static AddHandler(handler)
    {
        this.handlerList.push(handler);
    }

    static Emit(evt)
    {
        if (typeof(evt) == "string")
        {
            evt = {
                type: evt
            };
        }

        for (const evtHandler of this.handlerList)
        {
            if (evtHandler.OnEvent)
            {
                evtHandler.OnEvent(evt);
            }
        }
    }
}