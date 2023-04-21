export class Event
{
    static handlerList = [];

    static AddHandler(handler)
    {
        this.handlerList.push(handler);
    }

    static OnEvent(evt)
    {
        for (const evtHandler of this.handlerList)
        {
            if (evtHandler.OnEvent)
            {
                evtHandler.OnEvent(evt);
            }
        }
    }
}