import { CandidateFilterBase } from './CandidateFilterBase.js';
import { CandidateOnlyFilter } from './WsprMessageCandidate.js';


///////////////////////////////////////////////////////////////////////////
// Candidate Filter - Bad Telemetry
//
// Reject any msg which is telemetry and had an error on decode.
///////////////////////////////////////////////////////////////////////////

export class CandidateFilterByBadTelemetry
extends CandidateFilterBase
{
    constructor(t)
    {
        super("ByBadTelemetry", t);
    }

    OnFilterStart()
    {
        this.t.Event(`CandidateFilterByBadTelemetry Start`);
    }

    OnFilterEnd()
    {
        this.t.Event(`CandidateFilterByBadTelemetry End`);
    }

    FilterWindowAlgorithm(msgListList)
    {
        // eliminate any bad decodes
        for (let msgList of msgListList)
        {
            for (let msg of CandidateOnlyFilter(msgList))
            {
                if (msg.IsTelemetry() &&
                    msg.decodeDetails.decodeOk == false)
                {
                    msg.Reject(this.type, `Bad Telemetry (${msg.decodeDetails.reasonDetails.reason})`);
                }
            }
        }

        // eliminate any extended telemetry marked as the wrong slot
        for (let slot = 0; slot < 5; ++slot)
        {
            for (let msg of CandidateOnlyFilter(msgListList[slot]))
            {
                if (msg.IsTelemetryExtended())
                {
                    // TODO
    
                    // pull codec
                    // check decoded slot
                    // reject if wrong slot
                }
            }
        }
    }
}


