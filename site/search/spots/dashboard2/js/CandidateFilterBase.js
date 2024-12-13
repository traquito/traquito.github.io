import { Base } from './Base.js';


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
extends Base
{
    constructor(type, t)
    {
        super(t);

        // inherited class identifies themselves
        this.type = type;
    }

// public interface

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

    RejectAllInListExcept(msgList, msgExcept, reason)
    {
        for (let msg of msgList)
        {
            if (msg != msgExcept)
            {
                msg.Reject(this.type, reason);
            }
        }
    };

    RejectAllInList(msgList, reason)
    {
        this.RejectAllInListExcept(msgList, null, reason);
    }
}


