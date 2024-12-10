import * as utl from '/js/Utl.js';


export class Timeline
{
    static global = new Timeline();

    constructor()
    {
        this.logOnEvent = false;
        this.ccGlobal = false;

        this.Reset();
    }

    Global()
    {
        return Timeline.global;
    }

    SetCcGlobal(tf)
    {
        this.ccGlobal = tf;
    }

    SetLogOnEvent(tf)
    {
        this.logOnEvent = tf;
    }

    Reset()
    {
        this.eventList = [];
        this.longestStr = 0;
    }

    Event(name)
    {
        if (this.ccGlobal && this != Timeline.global)
        {
            this.Global().Event(name);
        }

        let time = performance.now();

        this.eventList.push({
            name: name,
            time: time,
        });

        if (name.length > this.longestStr)
        {
            this.longestStr = name.length;
        }

        if (this.logOnEvent)
        {
            console.log(name);
        }

        return time;
    }

    Report(msg)
    {
        if (msg)
        {
            console.log(`Timeline report (${msg}):`);
        }
        else
        {
            console.log("Timeline report:");
        }

        // build table to output
        let objList = [];
        let totalMs = 0;
        for (let i = 1; i < this.eventList.length; ++i)
        {
            totalMs += this.eventList[i - 0].time - this.eventList[i - 1].time;

            objList.push({
                from: this.eventList[i - 1].name,
                to  : this.eventList[i - 0].name,
                diffMs: utl.Commas(Math.round(this.eventList[i - 0].time - this.eventList[i - 1].time)),
                fromStartMs: utl.Commas(Math.round(totalMs)),
            });
        }

        totalMs = utl.Commas(Math.round(totalMs));

        console.table(objList);
        console.log(`total ms: ${totalMs}`);
    }
}

