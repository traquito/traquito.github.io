import * as utl from '/js/Utl.js';


export class Timeline
{
    constructor()
    {
        this.Reset();
    }

    Reset()
    {
        this.eventList = [];
        this.longestStr = 0;
    }

    Event(name)
    {
        this.eventList.push({
            name: name,
            time: performance.now(),
        });

        if (name.length > this.longestStr)
        {
            this.longestStr = name.length;
        }
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
            objList.push({
                from: this.eventList[i - 1].name,
                to  : this.eventList[i - 0].name,
                diffMs: utl.Commas(Math.round(this.eventList[i - 0].time - this.eventList[i - 1].time)),
            });

            totalMs += this.eventList[i - 0].time - this.eventList[i - 1].time;
        }

        totalMs = utl.Commas(Math.round(totalMs));

        console.table(objList);
        console.log(`total ms: ${totalMs}`);
    }
}

