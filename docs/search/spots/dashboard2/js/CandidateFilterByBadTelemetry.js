import { CandidateFilterBase } from './CandidateFilterBase.js';
import { CandidateOnlyFilter } from './WsprMessageCandidate.js';


///////////////////////////////////////////////////////////////////////////
// Candidate Filter - Bad Telemetry
//
// Reject any msg which is detected as invalid
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
        // eliminate any extended telemetry marked as the wrong slot
        for (let slot = 0; slot < 5; ++slot)
        {
            for (let msg of CandidateOnlyFilter(msgListList[slot]))
            {
                if (msg.IsTelemetryExtended())
                {
                    let codec = msg.GetCodec();

                    let hdrRESERVED = codec.GetHdrRESERVEDEnum();
                    let hdrSlot     = codec.GetHdrSlotEnum();
                    let hdrType     = codec.GetHdrTypeEnum();

                    if (hdrRESERVED != 0)
                    {
                        msg.Reject(this.type, `Bad Telemetry - HdrRESERVED is non-zero (${hdrRESERVED})`);
                    }
                    else if (hdrSlot != slot)
                    {
                        msg.Reject(this.type, `Bad Telemetry - HdrSlot (${hdrSlot}) set incorrectly, found in slot ${slot}`);
                    }
                    else if (hdrType != 0)
                    {
                        msg.Reject(this.type, `Bad Telemetry - HdrType (${hdrType}) set to unsupported value`);
                    }
                }
            }
        }
    }
}


