import { Timeline } from '/js/Timeline.js';
import { WsprMessageCandidate } from './WsprMessageCandidate.js';


///////////////////////////////////////////////////////////////////////////////
// CandidateFilterBase
//
// Designed to be inherited from by a series of different Filter types
// which should conform to the same behavior.
//
// Class supplies:
// - public interface for users
// - boilerplate to for inherited classes to use
// - convenience functions for inherited classes to use
///////////////////////////////////////////////////////////////////////////////

export class CandidateFilterBase
{
    constructor(type, t)
    {
        // inherited class identifies themselves
        this.type = type;

        // timeline
        this.t = t;

        // debug
        this.debug = false;
    }

// public interface
    
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

    // main entry point for using the filter
    Filter(forEachAble)
    {
        // fire event
        this.OnFilterStart();

        // foreach
        forEachAble.ForEach((msgListList) => {
            this.FilterWindowAlgorithm(msgListList)
        });

        // fire event
        this.OnFilterEnd();
    }


// "virtual" functions

    OnFilterStart()
    {
        this.t.Event(`CandidateFilterBase::OnFilterStart`);

        // do nothing, placeholder in case inherited class does not implement
    }

    FilterWindowAlgorithm(msgListList)
    {
        this.t.Event(`CandidateFilterBase::FilterWindowAlgorithm`);

        // do nothing, placeholder in case inherited class does not implement
    }

    OnFilterEnd()
    {
        this.t.Event(`CandidateFilterBase::OnFilterEnd`);

        // do nothing, placeholder in case inherited class does not implement
    }


// convenience functions

    // return the subset of msgs within a list that are still Candidate status
    CandidateOnlyFilter(msgList)
    {
        let msgListIsCandidate = [];

        for (let msg of msgList)
        {
            if (msg.IsCandidate())
            {
                msgListIsCandidate.push(msg);
            }
        }

        return msgListIsCandidate;
    };
}


