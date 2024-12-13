import { CandidateFilterBase } from './CandidateFilterBase.js';
import { CandidateOnlyFilter } from './WsprMessageCandidate.js';


///////////////////////////////////////////////////////////////////////////
// Candidate Filter - Fingerprinting
//
// Identify messages that appear to be yours by matching frequencies
// to data you believe in. Reject everything else.
///////////////////////////////////////////////////////////////////////////

export class CandidateFilterByFingerprinting
extends CandidateFilterBase
{
    constructor(t)
    {
        super("ByFingerprinting", t);
    }

    OnFilterStart()
    {
        this.t.Event(`CandidateFilterByFingerprinting Start`);
    }

    OnFilterEnd()
    {
        this.t.Event(`CandidateFilterByFingerprinting End`);
    }

    FilterWindowAlgorithm(msgListList)
    {
        this.FingerprintAlgorithm_AnchorBySlot0(msgListList);
    }


// private


    ///////////////////////////////////////////////////////////////////////////
    // AnchorBySlot0 Algorithm
    //
    // If you can find a message in Slot 0 you believe to be yours, match up
    // messages in subsequent slots by frequency to that Slot0 frequency, then
    // reject all others.
    ///////////////////////////////////////////////////////////////////////////

    FingerprintAlgorithm_AnchorBySlot0(msgListList)
    {
        // Get Slot 0 candidates
        let msgSlot0List = msgListList[0];
        let msgSlot0CandidateList = CandidateOnlyFilter(msgSlot0List);

        let ok = false;

        if (msgSlot0CandidateList.length == 0)
        {
            // No reference frequency

            // reject all messages in this window, there is no anchor frequency to tie to
            for (let msgList of msgListList)
            {
                let msgListCandidate = CandidateOnlyFilter(msgList);
                this.RejectAllInList(msgListCandidate, `No anchor frequency message in slot 0.`);
            }
        }
        else if (msgSlot0CandidateList.length == 1)
        {
            // One reference frequency, use this
            ok = true;
        }
        else
        {
            // Multiple candidates
            
            // take no action
        }

        // match up subsequent slots
        if (ok)
        {
            let msgSlot0 = msgSlot0CandidateList[0];

            // work through each slot, hopefully disqualifying messages
            for (let slot = 1; slot < 5; ++slot)
            {
                let msgCandidateList = CandidateOnlyFilter(msgListList[slot]);

                let msgMatchList = [];
                let freqHzDiffMatch = 0;
                const FREQ_HZ_PLUS_MINUS_THRESHOLD = 5;   // it's +/- this number, so 10Hz
                if (msgCandidateList.length)
                {
                    // start by looking for a single match at exactly-equal frequency.
                    // if that doesn't work, widen the window to match.
                    for (freqHzDiffMatch = 0; freqHzDiffMatch <= FREQ_HZ_PLUS_MINUS_THRESHOLD; ++freqHzDiffMatch)
                    {
                        msgMatchList = this.GetWithinThresholdList(msgSlot0, msgCandidateList, freqHzDiffMatch);

                        if (msgMatchList.length != 0)
                        {
                            break;
                        }
                    }
                }

                // check outcome
                if (msgMatchList.length == 0)
                {
                    // no match

                    // reject every message in this slot
                    this.RejectAllInList(msgCandidateList, `Fingerprint match fail, exceeded ${FREQ_HZ_PLUS_MINUS_THRESHOLD} threshold.`);
                }
                else if (msgMatchList.length == 1)
                {
                    // one match

                    // reject every message in this slot except the match
                    this.RejectAllInListExcept(msgCandidateList, msgMatchList[0], `Fingerprint matched other message`);
                }
                else
                {
                    // multiple matches

                    // take no action
                }
            }
        }
    }

    // Return the set of msgBList elements which fall within the threshold difference
    // of frequency when compared to msgA.
    GetWithinThresholdList(msgA, msgBList, threshold)
    {
        let msgListWithinThreshold = [];

        // calculate minimum frequency diff between msgA and this
        // message of this slot
        let msg__minFreqDiff = new Map();
        for (let msgB of msgBList)
        {
            msg__minFreqDiff.set(msgB, this.GetMinFreqDiff(msgA, msgB));
        }

        // find out which messages fall within tolerance
        for (let [msgB, freqDiff] of msg__minFreqDiff)
        {
            if (freqDiff <= threshold)
            {
                msgListWithinThreshold.push(msgB);
            }
        }

        return msgListWithinThreshold;
    }

    MakeRxCallToRxRecordListMap(msg, limitBySet)
    {
        limitBySet = limitBySet ?? null;

        let rxCall__recordMap = new Map();

        for (let rxRecord of msg.rxRecordList)
        {
            let rxCall = rxRecord.rxCallsign;

            if (limitBySet == null || limitBySet.has(rxCall))
            {
                if (rxCall__recordMap.has(rxCall) == false)
                {
                    rxCall__recordMap.set(rxCall, []);
                }

                rxCall__recordMap.get(rxCall).push(rxRecord);
            }
        }

        return rxCall__recordMap;
    }

    // Find min diff of entries in B compared to looked up in A.
    // Only compare equal rxCallsigns.
    // So, we're looking at:
    // - for any common rxCallsign
    //   - across all frequencies reported by that rxCallsign
    //     - what is the minimum difference in frequency seen?
    GetMinFreqDiff(msgA, msgB)
    {
        let rxCall__rxRecordListA = this.MakeRxCallToRxRecordListMap(msgA);
        let rxCall__rxRecordListB = this.MakeRxCallToRxRecordListMap(msgB, rxCall__rxRecordListA);

        let minDiff = null;
        for (let [rxCall, rxRecordListB] of rxCall__rxRecordListB)
        {
            // pull up data from 
            let rxRecordListA = rxCall__rxRecordListA.get(rxCall);
            
            // unavoidable(?) M*N operation here, hopefully M and N are small
            let diff = this.GetMinFreqDiffRxRecordList(rxRecordListA, rxRecordListB);

            if (minDiff == null || diff < minDiff)
            {
                minDiff = diff;
            }
        }

        return minDiff;
    }

    // Returns the smallest absolute difference between frequencies found in the two
    // supplied record lists. This is an M*N operation.
    //
    // This function has no knowledge or assumptions about the contents of the
    // two lists (ie whether the callsigns are the same).
    //
    // This is simply a function broken out to keep calling code simpler.
    GetMinFreqDiffRxRecordList(rxRecordListA, rxRecordListB)
    {
        let minDiff = null;

        for (let rxRecordA of rxRecordListA)
        {
            for (let rxRecordB of rxRecordListB)
            {
                let diff = Math.abs(rxRecordA.frequency - rxRecordB.frequency);
                
                if (minDiff == null || diff < minDiff)
                {
                    minDiff = diff;
                }
            }
        }

        return minDiff;
    }
}


