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

        this.dt__data = new Map();
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
                `RegCallsign`,
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

        this.dt__data = new Map();
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

        this.dt__data = new Map();
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
                `RegCallsign`,
                `RegGrid`, `RegPower`,
                `EncTime`,
                `EncCallsign`, `EncGrid`, `EncPower`,
                `Grid56`, `AltM`,
                `TempC`, `Voltage`, `SpeedKnots`, `GpsValid`,
            ]
        ];

        for (const dt of dtList)
        {
            const data = this.dt__data.get(dt);

            let row = [];

            row.push(dt);                       // reg.datetime
            row.push(utl.ConvertUtcToLocal(dt));
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