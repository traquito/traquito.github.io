import { Base } from './Base.js';

// return the subset of msgs within a list that are still Candidate status
export function CandidateOnlyFilter(msgList)
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

export class WsprMessageCandidate
extends Base
{
    constructor()
    {
        super();
        
        // The type of message, regular or telemetry
        // (the specific type of telemetry is not specified here)
        this.type = "regular";
    
        // The fields of the wspr message
        this.fields = {
            callsign: "",
            grid4   : "",
            powerDbm: "",
        };
    
        // All the rx reports with the same wspr fields, but different rx freq, rx call, etc
        //
        // Regular rxRecord:
        // {
        //     "time"      : "2024-10-22 15:04:00",
        //     "min"       : 4,
        //     "callsign"  : "KD2KDD",
        //     "grid4"     : "FN20",
        //     "gridRaw"   : "FN20",
        //     "powerDbm"  : 13,
        //     "rxCallsign": "AC0G",
        //     "rxGrid"    : "EM38ww",
        //     "frequency" : 14097036
        // }
        //
        // Telemetry rxRecord:
        // {
        //     "time"      : "2024-10-22 15:06:00",
        //     "id1"       : "1",
        //     "id3"       : "2",
        //     "min"       : 6,
        //     "callsign"  : "1Y2QQJ",
        //     "grid4"     : "OC04",
        //     "powerDbm"  : 37,
        //     "rxCallsign": "AB4EJ",
        //     "rxGrid"    : "EM63fj",
        //     "frequency" : 14097036
        // }
        //
        this.rxRecordList = [];
    
        // Details about Decode attempt and results.
        // Only has useful information when type = telemetry
        this.decodeDetails = {
            type: "basic",  // basic or extended
    
            decodeOk: true, // true or false
            decodeAudit: {
                note: "", // useful-to-human explanation of decodeOk
            },
    
            // actual decoded data, by type
            basic: {},      // the fields of a decoded basic message
            extended: {},   // the codec for the extended type(?)
        };
    
        // States:
        // - candidate - possibly your message
        // - rejected  - no longer considered possible to be your message, or
        //               so ambiguous as to need to be rejected as a possible
        //               certainty that it is yours
        this.candidateState = "candidate";
        
        // Details of the filters applied that ultimately looked at,
        // and perhaps changed, the status of candidateState.
        // Structure defined in the CandidateFilterBase implementation.
        //
        // Meant to be an audit.
        this.candidateFilterAuditList = [
        ];
    }
    
    IsCandidate()
    {
        return this.candidateState == "candidate";
    }

    IsType(type)
    {
        return this.type == type;
    }

    IsRegular()
    {
        return this.IsType("regular");
    }

    IsTelemetry()
    {
        return this.IsType("telemetry");
    }

    IsTelemetryType(type)
    {
        return this.IsTelemetry() && this.decodeDetails.type == type;
    }

    IsTelemetryBasic()
    {
        return this.IsTelemetryType("basic");
    }
    
    IsTelemetryExtended()
    {
        return this.IsTelemetryType("extended");
    }

    CreateAuditRecord(type, note)
    {
        return {
            // Enumerated type of the audit.
            // Tells you how to interpret the object.
            type: type,

            // Note, in human terms, of anything the filter wanted to note about
            // this message in the course of its processing.
            note: note,

            // Any other structure is type-dependent.
            // ...
        };
    }

    AddAuditRecord(type, note)
    {
        let audit = this.CreateAuditRecord(type, note);

        // add audit record
        this.candidateFilterAuditList.push(audit);

        return audit;
    }

    Reject(type, note)
    {
        // change the message state
        this.candidateState = "rejected";

        let audit = this.AddAuditRecord(type, note);

        // return audit record for any additional details to be added
        return audit;
    }
}