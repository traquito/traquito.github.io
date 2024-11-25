
export class WorkAccumulator
{
    constructor(workLimit, durationMs)
    {
        this.queued = null;

        this.workLimit = workLimit;
        this.durationMs = durationMs;
        this.accumulated = 0;

        this.id = setInterval(() => {
            this.Timeout();
        }, this.durationMs);
    }

    Clear()
    {
        this.queued = null;
    }

    Queue(fnWork)
    {
        if (this.workDoneThisSlot < this.workLimit)
        {
            fnWork();

            this.workDoneThisSlot += 1;
        }
        else
        {
            this.accumulated += 1;
            this.queued = fnWork;
        }
    }

    Timeout()
    {
        if (this.queued)
        {
            this.queued();
        }
        
        this.workDoneThisSlot = 0;
        this.queued = null;
        this.accumulated = 0;
    }
}

