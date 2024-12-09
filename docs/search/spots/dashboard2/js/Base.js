import { Timeline } from '/js/Timeline.js';

export class Base
{
    constructor(t)
    {
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

    Debug(str)
    {
        if (this.debug)
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
}