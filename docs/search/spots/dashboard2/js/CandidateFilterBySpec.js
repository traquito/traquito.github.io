import { CandidateFilterBase } from './CandidateFilterBase.js';


///////////////////////////////////////////////////////////////////////////
// Candidate Filter - Spec
//
// Reject any messages which, by Extended Telemetry specification,
// do not belong.
///////////////////////////////////////////////////////////////////////////

export class CandidateFilterBySpec
extends CandidateFilterBase
{
    constructor(t)
    {
        super("BySpec", t);
    }

    OnFilterStart()
    {
        this.t.Event(`CandidateFilterBySpec Start`);
    }

    OnFilterEnd()
    {
        this.t.Event(`CandidateFilterBySpec End`);
    }

    FilterWindowAlgorithm(msgListList)
    {
        this.FilterSlot0(msgListList[0]);
        this.FilterSlot1(msgListList[1]);
        this.FilterSlot2(msgListList[2]);
        this.FilterSlot3(msgListList[3]);
        this.FilterSlot4(msgListList[4]);
    }


// private

    /////////////////////////////////////////////////////////////
    // Slot 0 Filter
    // - Can have Regular Type 1 or Extended Telemetry
    // - If there is Regular, prefer it over Extended
    // - No Basic Telemetry allowed
    /////////////////////////////////////////////////////////////
    FilterSlot0(msgList)
    {
        // First, reject any Basic Telemetry, if any
        this.RejectCandidateBasicTelemetry(msgList, `Basic Telemetry not supported in Slot 0.`);

        // Collect what we see remaining
        let msgRegularList = [];
        let msgTelemetryList = [];
        for (let msg of this.CandidateOnlyFilter(msgList))
        {
            if (msg.IsRegular())
            {
                msgRegularList.push(msg);
            }
            else if (msg.IsTelemetry())
            {
                msgTelemetryList.push(msg);
            }
        }

        // Check what we found
        if (msgRegularList.length == 0)
        {
            // no regular, that's fine, maybe extended telemetry is being used

            if (msgTelemetryList.length == 0)
            {
                // no extended telemetry found either.

                // that also means the contents of this slot are:
                // - disqualified basic telemetry, if any
                // - disqualified extended telemetry (eg being wrong slot, bad headers, etc)
                // - nothing else

                // nothing to do here
            }
            else if (msgTelemetryList.length == 1)
            {
                // this is our guy

                // nothing to do, there are no other candidates to reject
            }
            else
            {
                // multiple candidates

                // nothing to do, no criteria by which to reject any of them
            }
        }
        else if (msgRegularList.length == 1)
        {
            // this is our guy

            // mark any telemetry in this slot as rejected
            let msgExcept = msgRegularList[0];
            this.RejectAllCandidatesByTypeExcept(msgList,
                                                 "telemetry",
                                                 msgExcept,
                                                 `Regular Type1 found in Slot 0, taking precedence.`);
        }
        else
        {
            // multiple Regular Type1 candidates -- that's bad for filtering
            //     could mean someone is transmitting from more than one location and the
            //     messages are all being received

            // no good way to reject any of the Regular Type1 messages in
            // preference to any other, so they all remain candidates

            // mark any telemetry in this slot as rejected
            let msgExcept = msgRegularList[0];
            this.RejectAllCandidatesByTypeExcept(msgList,
                                                 "telemetry",
                                                 msgExcept,
                                                 `Regular Type1 (multiple) found in Slot 0, taking precedence.`);
        }
    }

    /////////////////////////////////////////////////////////////
    // Slot 1 Filter
    // - Can have Extended Telemetry or Basic Telemetry
    //   - If both, prefer Extended
    /////////////////////////////////////////////////////////////
    FilterSlot1(msgList)
    {
        // Collect what we see remaining
        let msgTelemetryExtendedList = [];
        let msgTelemetryBasicList = [];
        for (let msg of this.CandidateOnlyFilter(msgList))
        {
            if (msg.IsTelemetryExtended())
            {
                msgTelemetryExtendedList.push(msg);
            }
            else if (msg.IsTelemetryBasic())
            {
                msgTelemetryBasicList.push(msg);
            }
        }

        // Check what we found
        if (msgTelemetryExtendedList.length == 0)
        {
            // no extended, that's fine, maybe basic telemetry is being used

            if (msgTelemetryBasicList.length == 0)
            {
                // no basic telemetry found either.

                // nothing to do here
            }
            else if (msgTelemetryBasicList.length == 1)
            {
                // this is our guy

                // nothing to do, there are no other candidates to reject
            }
            else
            {
                // multiple candidates

                // nothing to do, no criteria by which to reject any of them
            }
        }
        else if (msgTelemetryExtendedList.length == 1)
        {
            // this is our guy

            // mark any basic telemetry in this slot as rejected
            let msgExcept = msgTelemetryExtendedList[0];
            this.RejectAllTelemetryCandidatesByTypeExcept(msgList,
                                                          "basic",
                                                          msgExcept,
                                                          `Extended Telemetry found in Slot 1, taking precedence.`);
        }
        else
        {
            // multiple Extended Telemetry candidates

            // no good way to reject any of the Regular Type1 messages in
            // preference to any other, so they all remain candidates

            // mark any telemetry in this slot as rejected
            let msgExcept = msgTelemetryExtendedList[0];
            this.RejectAllTelemetryCandidatesByTypeExcept(msgList,
                                                          "basic",
                                                          msgExcept,
                                                          `Extended Telemetry (multiple) found in Slot 1, taking precedence.`);
        }
    }

    /////////////////////////////////////////////////////////////
    // Slot 2 Filter
    // - Can only have Extended Telemetry
    /////////////////////////////////////////////////////////////
    FilterSlot2(msgList)
    {
        this.RejectCandidateBasicTelemetry(msgList, `Basic Telemetry not supported in Slot 2.`);
    }

    /////////////////////////////////////////////////////////////
    // Slot 3 Filter
    // - Can only have Extended Telemetry
    /////////////////////////////////////////////////////////////
    FilterSlot3(msgList)
    {
        this.RejectCandidateBasicTelemetry(msgList, `Basic Telemetry not supported in Slot 3.`);
    }

    /////////////////////////////////////////////////////////////
    // Slot 4 Filter
    // - Can only have Extended Telemetry
    /////////////////////////////////////////////////////////////
    FilterSlot4(msgList)
    {
        this.RejectCandidateBasicTelemetry(msgList, `Basic Telemetry not supported in Slot 4.`);
    }


    /////////////////////////////////////////////////////////////
    // Helper utilities
    /////////////////////////////////////////////////////////////

    RejectCandidateBasicTelemetry(msgList, reason)
    {
        for (let msg of this.CandidateOnlyFilter(msgList))
        {
            if (msg.IsTelemetryBasic())
            {
                msg.Reject(this.type, reason);
            }
        }
    };

    RejectAllCandidatesByTypeExcept(msgList, type, msgExcept, reason)
    {
        for (let msg of this.CandidateOnlyFilter(msgList))
        {
            if (msg.IsType(type) && msg != msgExcept)
            {
                msg.Reject(this.type, reason);
            }
        }
    };

    RejectAllTelemetryCandidatesByTypeExcept(msgList, type, msgExcept, reason)
    {
        for (let msg of this.CandidateOnlyFilter(msgList))
        {
            if (msg.IsTelemetryType(type) && msg != msgExcept)
            {
                msg.Reject(this.type, reason);
            }
        }
    };
}