import { TabularData } from '/js/TabularData.js';
import * as utl from '/js/Utl.js';
import { QuerierWsprLive } from '/js/QuerierWsprLive.js';
import { WSPR } from '/js/WSPR.js';
import { WSPREncoded } from '/js/WSPREncoded.js';


export class SpotSearchRegular
{
    constructor()
    {
        this.wspr = new QuerierWsprLive();

        this.Reset();
    }

    Reset()
    {
        this.dt__data = new Map();
    }

    Quiet()
    {
        this.wspr.Quiet();
    }

    async Search(band, callsign, channel, timeStart, timeEnd, limit)
    {
        let cd = WSPR.GetChannelDetails(band, channel);

        let promise = this.wspr.GetRegularTelemetry(band, callsign, cd.min, cd.lane, timeStart, timeEnd, limit);
    
        promise.then((dataTable) => {
            this.OnDataTable(dataTable);
        });
    
        return promise;
    }

    OnDataTable(dataTable)
    {
        for (let i = 1; i < dataTable.length; ++i)
        {
            let [dateTime, min, lane, callsign, grid, gridRaw, power] = dataTable[i];

            let spot = {
                dateTime: dateTime,
                grid    : grid,
                gridRaw : gridRaw,
                power   : power,
            };

            if (this.dt__data.has(dateTime) == false)
            {
                this.dt__data.set(dateTime, {});
            }

            let data = this.dt__data.get(dateTime);
            data.spot = spot;
        }
    }

    async SearchNew(band, callsign, channel, timeStart, timeEnd, limit)
    {
        let cd = WSPR.GetChannelDetails(band, channel);

        let promise = this.wspr.GetRegularTelemetryNoLane(band, callsign, cd.min, timeStart, timeEnd, limit * 10);
    
        promise.then((dataTable) => {
            this.OnDataTableNew(dataTable);
        });
    
        return promise;
    }

    async SearchNew2(band, callsign, channel, timeStart, timeEnd, limit)
    {
        let cd = WSPR.GetChannelDetails(band, channel);

        // calculate frequency range.
        // the lane should be our range, but we know that sometimes there are values
        // that dip lower due to skew observed in asia.
        // so we want to cover our entire lane, plus half the lane below.

        let freqLow = cd.freqLow - (cd.freqHigh - cd.freq);
        let freqHigh = cd.freqHigh;

        let promise =
            this.wspr.GetRegularTelemetryFreqRange(
                band,
                callsign,
                cd.min,
                freqLow,
                freqHigh,
                timeStart,
                timeEnd,
                limit
            );
    
        promise.then((dataTable) => {
            this.OnDataTableNew(dataTable);
        });
    
        return promise;
    }

    OnDataTableNew(dataTable)
    {
        for (let i = 1; i < dataTable.length; ++i)
        {
            let [dateTime, min, callsign, grid, gridRaw, power, rxSign, freq] = dataTable[i];

            let spot = {
                dateTime: dateTime,
                grid    : grid,
                gridRaw : gridRaw,
                power   : power,
            };

            let rxDetails = {
                rxSign: rxSign,
                freq: freq,
            }

            if (this.dt__data.has(dateTime) == false)
            {
                this.dt__data.set(dateTime, {
                    rxDetailsList: [],
                });
            }

            let data = this.dt__data.get(dateTime);
            data.spot = spot;
            data.rxDetailsList.push(rxDetails);
        }
    }

    async SearchPlain(band, callsign, timeStart, timeEnd, limit)
    {
        let promise = this.wspr.GetRegularTelemetryPlain(band, callsign, timeStart, timeEnd, limit);
    
        promise.then((dataTable) => {
            this.OnDataTablePlain(dataTable);
        });
    
        return promise;
    }

    OnDataTablePlain(dataTable)
    {
        for (let i = 1; i < dataTable.length; ++i)
        {
            let [dateTime, callsign, grid, gridRaw, power] = dataTable[i];

            let spot = {
                dateTime: dateTime,
                grid    : grid,
                gridRaw : gridRaw,
                power   : power,
            };

            if (this.dt__data.has(dateTime) == false)
            {
                this.dt__data.set(dateTime, {});
            }

            let data = this.dt__data.get(dateTime);
            data.spot = spot;
        }
    }

    GetDtMap()
    {
        return this.dt__data;
    }

    GetDataTable()
    {
        // build time-aligned structure
        this.GetDtMap().forEach((value, key) => {
            this.dt__data.set(key, {
                regSpot: value.spot,
            });
        });

        let dtList = [... this.dt__data.keys()];
        dtList.sort();
        dtList.reverse();
        // build data table
        let dataTable = [
            [
                `DateTimeUtc`, `DateTimeLocal`,
                `RegCall`,
                `RegGrid`, `RegPower`,
            ]
        ];

        for (const dt of dtList)
        {
            const data = this.dt__data.get(dt);

            let row = [];

            row.push(dt);
            row.push(utl.ConvertUtcToLocal(dt));
            row.push(callsign.value);

            let grid4 = "";
            if (Object.hasOwn(data, "regSpot"))
            {
                let reg = data.regSpot;

                row.push(reg.grid);
                row.push(reg.power);

                grid4 = reg.grid;
            }
            else
            {
                row.push(... Array(2).fill(null));
            }

            dataTable.push(row);
        }

        return dataTable;
    }
}


export class SpotSearchEncoded
{
    constructor()
    {
        this.wspr = new QuerierWsprLive();

        this.Reset();
    }

    Reset()
    {
        this.dt__data = new Map();
    }

    Quiet()
    {
        this.wspr.Quiet();
    }

    async Search(band, id1, id3, min, lane, timeStart, timeEnd, limit)
    {
        let promise = this.wspr.GetEncodedTelemetry(band, id1, id3, min, lane, timeStart, timeEnd, limit);

        promise.then((dataTable) => {
            this.OnDataTable(dataTable);
        });

        return promise;
    }

    OnDataTable(dataTable)
    {
        for (let i = 1; i < dataTable.length; ++i)
        {
            let [dateTime, freq, id1, id3, min, lane, callsign, grid, power] = dataTable[i];

            // set up data to capture
            let spot = {
                dateTime: dateTime,
                callsign: callsign,
                grid    : grid,
                power   : power,
            };

            if (this.dt__data.has(dateTime) == false)
            {
                this.dt__data.set(dateTime, {});
            }

            let data = this.dt__data.get(dateTime);
            data.spot = spot;

            // attempt decode
            // only supporting standard
            let ret = WSPREncoded.DecodeU4BGridPower(grid, power);
            if (ret.msgType == "standard")
            {
                let [grid56, altM] = WSPREncoded.DecodeU4BCall(callsign);
                let [tempC, voltage, speedKnots, gpsValid] = ret.data;

                let decSpot = {
                    grid56    : grid56,
                    altM      : altM,
                    tempC     : tempC,
                    voltage   : voltage,
                    speedKnots: speedKnots,
                    gpsValid  : gpsValid,
                };

                data.decSpot = decSpot;
            }
        }
    }

    async SearchNew(band, id1, id3, min, timeStart, timeEnd, limit)
    {
        let promise = this.wspr.GetEncodedTelemetryNoLane(band, id1, id3, min, timeStart, timeEnd, limit * 10);

        promise.then((dataTable) => {
            this.OnDataTableNew(dataTable);
        });

        return promise;
    }

    async SearchNew2(band, id1, id3, min, freqLow, freqHigh, timeStart, timeEnd, limit)
    {
        let promise = this.wspr.GetEncodedTelemetryFreqRange(band, id1, id3, min, freqLow, freqHigh, timeStart, timeEnd, limit * 10);

        promise.then((dataTable) => {
            this.OnDataTableNew(dataTable);
        });

        return promise;
    }

    OnDataTableNew(dataTable)
    {
        for (let i = 1; i < dataTable.length; ++i)
        {
            let [dateTime, id1, id3, min, callsign, grid, power, rxSign, freq] = dataTable[i];

            // set up data to capture
            let spot = {
                dateTime: dateTime,
                callsign: callsign,
                grid    : grid,
                power   : power,
            };

            let rxDetails = {
                rxSign: rxSign,
                freq: freq,
            }

            let key = `${dateTime},${callsign},${grid},${power}`;

            if (this.dt__data.has(key) == false)
            {
                this.dt__data.set(key, {
                    rxDetailsList: [],
                });
            }

            let data = this.dt__data.get(key);
            data.rxDetailsList.push(rxDetails);

            if (data.spot == undefined)
            {
                data.spot = spot;
    
                // attempt decode
                // only supporting standard
                let ret = WSPREncoded.DecodeU4BGridPower(grid, power);
                if (ret.msgType == "standard")
                {
                    let [grid56, altM] = WSPREncoded.DecodeU4BCall(callsign);
                    let [tempC, voltage, speedKnots, gpsValid] = ret.data;
    
                    let decSpot = {
                        grid56    : grid56,
                        altM      : altM,
                        tempC     : tempC,
                        voltage   : voltage,
                        speedKnots: speedKnots,
                        gpsValid  : gpsValid,
                    };
    
                    data.decSpot = decSpot;
                }
            }
        }
    }

    GetDtMap()
    {
        return this.dt__data;
    }
}


export class SpotSearchCombined
{
    constructor()
    {
        this.ssReg = new SpotSearchRegular();
        this.ssEnc = new SpotSearchEncoded();

        this.Reset()

        this.debugEnabled = false;
    }

    Reset()
    {
        this.ssReg.Reset()
        this.ssEnc.Reset();
        this.dt__data = new Map();
    }

    Quiet()
    {
        this.ssReg.Quiet();
        this.ssEnc.Quiet();
    }

    EnableDebug()
    {
        this.debugEnabled = true;
    }

    GetDebug()
    {
        return this.debugEnabled;
    }

    async Search(band, channel, callsign, timeStart, timeEnd, limit)
    {
        let p1 = this.ssReg.Search(band, callsign, channel, timeStart, timeEnd, limit);
        
        let cd = WSPR.GetChannelDetails(band, channel);
        let encMin = (cd.min + 2) % 10;
        let p2 = this.ssEnc.Search(band, cd.id1, cd.id3, encMin, cd.lane, timeStart, timeEnd, limit);

        return Promise.all([p1, p2]).then(() => {
            this.Combine();
            this.MakeDataTable(callsign);
        });
    }

    Combine()
    {
        // build time-aligned structure
        this.ssReg.GetDtMap().forEach((value, key) => {
            this.dt__data.set(key, {
                regSpot: value.spot,
            });
        });

        this.ssEnc.GetDtMap().forEach((value, key) => {
            // pull the encoded spot, we want its time
            let encSpot = value.spot;

            // the time of the encoded spot
            // the time of the regular spot that preceded it (2 min prior)
            // calculate it, and look to see if we have a regular spot at that time
            let msThis = utl.ParseTimeToMs(encSpot.dateTime);
            let msThen = (msThis - (2 * 60 * 1000));
            let dtThen = utl.MakeDateTimeFromMs(msThen);

            // only update an entry, don't create
            if (this.dt__data.has(dtThen))
            {
                // store the encoded data
                let data = this.dt__data.get(dtThen);
                data.encSpot = encSpot;
    
                // store the decoded data if there is any
                if (Object.hasOwn(value, "decSpot"))
                {
                    data.decSpot = value.decSpot;
                }
            }
        });
    }

    async SearchNew(band, channel, callsign, timeStart, timeEnd, limit)
    {
        let p1 = this.ssReg.SearchNew(band, callsign, channel, timeStart, timeEnd, limit);
        
        let cd = WSPR.GetChannelDetails(band, channel);
        let encMin = (cd.min + 2) % 10;
        let p2 = this.ssEnc.SearchNew(band, cd.id1, cd.id3, encMin, timeStart, timeEnd, limit);

        return Promise.all([p1, p2]).then(() => {
            this.CombineNew();
            this.MakeDataTable(callsign);
        });
    }

    async SearchNew2(band, channel, callsign, timeStart, timeEnd, limit)
    {
        let p1 = this.ssReg.SearchNew2(band, callsign, channel, timeStart, timeEnd, limit);
        
        // calculate frequency range.
        // the lane should be our range, but we know that sometimes there are values
        // that dip lower due to skew observed in asia.
        // so we want to cover our entire lane, plus half the lane below.
        let cd = WSPR.GetChannelDetails(band, channel);
        let freqLow = cd.freqLow - (cd.freqHigh - cd.freq);
        let freqHigh = cd.freqHigh;

        let encMin = (cd.min + 2) % 10;
        let p2 = this.ssEnc.SearchNew2(band, cd.id1, cd.id3, encMin, freqLow, freqHigh, timeStart, timeEnd, limit);

        return Promise.all([p1, p2]).then(() => {
            this.CombineNew();
            this.MakeDataTable(callsign);
        });
    }

    CombineNew()
    {
        // build time-aligned structure
        this.ssReg.GetDtMap().forEach((value, key) => {
            this.dt__data.set(key, {
                regSpot: value.spot,
                regRxDetailsList: value.rxDetailsList,
                encCandidateList: [],
            });
        });
        
        // find candidate datasets
        this.ssEnc.GetDtMap().forEach((value, key) => {
            // pull the encoded spot, we want its time
            let encSpot = value.spot;

            // the time of the encoded spot
            // the time of the regular spot that preceded it (2 min prior)
            // calculate it, and look to see if we have a regular spot at that time
            let msThis = utl.ParseTimeToMs(encSpot.dateTime);
            let msThen = (msThis - (2 * 60 * 1000));
            let dtThen = utl.MakeDateTimeFromMs(msThen);

            // only look at encoded data for which we have regular data
            if (this.dt__data.has(dtThen))
            {
                // pull up regular data record to consider adding encoded data to
                let data = this.dt__data.get(dtThen);

                // evaluate whether this encoded data follows details found
                // in the regular record
                let addEnc = false;

                let regRxDetailsList = data.regRxDetailsList;
                let encRxDetailsList = value.rxDetailsList;

                // let's do some N^2 searching
                for (let encRxDetails of encRxDetailsList)
                {
                    for (let regRxDetails of regRxDetailsList)
                    {
                        if (encRxDetails.rxSign == regRxDetails.rxSign)
                        {
                            let FREQ_DIFF_LIMIT = 5;
                            let freqDiff = Math.abs(encRxDetails.freq - regRxDetails.freq);
                            if (freqDiff < FREQ_DIFF_LIMIT)
                            {
                                addEnc = true;

                                if (this.GetDebug())
                                {
                                    console.log(`Adding because ${regRxDetails.rxSign} freq diff of ${freqDiff} for ${dtThen}`);
                                }

                                break;
                            }
                            else
                            {
                                if (this.GetDebug())
                                {
                                    console.log(`Diff of ${freqDiff} prevented match with ${regRxDetails.rxSign} for ${dtThen}`);
                                }
                            }
                        }
                    }

                    if (addEnc)
                    {
                        break;
                    }
                }

                if (addEnc)
                {
                    data.encCandidateList.push(value);
                }
            }
        });

        // go through candidate list and extract encoded data
        this.dt__data.forEach((value, key) => {
            if (value.encCandidateList.length == 1)
            {
                let regSpot = value.regSpot;
                let encData = value.encCandidateList[0];
                let encSpot = encData.spot;

                let regRxDetailsList = value.regRxDetailsList;
                let encRxDetailsList = encData.rxDetailsList;

                // store the encoded data
                value.encSpot = encSpot;
    
                // store the decoded data if there is any
                if (Object.hasOwn(encData, "decSpot"))
                {
                    value.decSpot = encData.decSpot;
                }

                if (this.GetDebug())
                {
                    // console.log("Associating encoded data with regular data - due to one candidate");
                    // console.log(regSpot.dateTime);
                    // console.log(value);
                    // console.table(regRxDetailsList);
                    // console.table(encRxDetailsList);
                }
            }
            else if (value.encCandidateList.length > 0)
            {
                if (this.GetDebug())
                {
                    console.log(`Eliminated encoded data due to too many candidates: ${value.encCandidateList.length}`);
                    console.log(value.encCandidateList);
                }
            }
        });
    }

    MakeDataTable(callsign)
    {
        // get sorted list of dt values
        let dtList = [... this.dt__data.keys()];
        dtList.sort();
        dtList.reverse();

        // build data table
        let dataTable = [
            [
                `DateTimeUtc`, `DateTimeLocal`,
                `RegCall`,
                `RegGrid`, `RegPower`,
                `EncTime`,
                `EncCall`, `EncGrid`, `EncPower`,
                `Grid56`, `AltM`,
                `TempC`, `Voltage`, `Knots`, `GpsValid`,
            ]
        ];

        for (const dt of dtList)
        {
            const data = this.dt__data.get(dt);

            let row = [];

            let dtNoSec = dt.substring(0, dt.length - 3)
            let dtLocalNoSec = utl.ConvertUtcToLocal(dt);
            dtLocalNoSec = dtLocalNoSec.substring(0, dtLocalNoSec.length - 3);

            row.push(dtNoSec);                       // reg.datetime
            row.push(dtLocalNoSec);
            row.push(callsign);                 // reg.call

            let grid4 = "";
            if (Object.hasOwn(data, "regSpot"))
            {
                let reg = data.regSpot;

                row.push(reg.grid);
                row.push(reg.power);

                grid4 = reg.grid;
            }
            else
            {
                row.push(... Array(2).fill(null));
            }

            if (Object.hasOwn(data, "encSpot"))
            {
                const enc = data.encSpot;

                row.push(enc.dateTime.substring(11, 16));
                row.push(enc.callsign);
                row.push(enc.grid);
                row.push(enc.power);

                if (Object.hasOwn(data, "decSpot"))
                {
                    let dec = data.decSpot;

                    row.push(dec.grid56);
                    row.push(dec.altM);
                    row.push(dec.tempC);
                    row.push(dec.voltage);
                    row.push(dec.speedKnots);
                    row.push(dec.gpsValid);
                }
                else
                {
                    row.push(... Array(6).fill(null));
                }
            }
            else
            {
                row.push(... Array(10).fill(null));
            }
            
            dataTable.push(row);
        }

        this.dataTable = dataTable;
    }

    GetDataTable()
    {
        return this.dataTable;
    }
}