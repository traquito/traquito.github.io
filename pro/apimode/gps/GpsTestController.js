import * as utl from '/js/Utl.js';
import { Event } from '/trackergui/js/Event.js';
import * as autl from '/trackergui/js/AppUtl.js';


class RadioCheckbox
{
    Configure(cfg)
    {
        this.cfg = cfg;

        this.elList = document.getElementsByName(cfg.name);
    }

    GetValue()
    {
        let val = null;

        for (let el of this.elList)
        {
            if (el.checked)
            {
                val = el.value;
            }
        }

        return val;
    }

    Disable()
    {
        for (let el of this.elList)
        {
            el.disabled = true;
        }
    }
    
    Enable()
    {
        for (let el of this.elList)
        {
            el.disabled = false;
        }
    }
}

export class GpsTestController
{
    Configure(cfg)
    {
        this.dbg  = cfg.dbg;
        this.conn = cfg.conn;

        Event.AddHandler(this);

        this.dom = {};
        this.dom.startButton = document.getElementById(cfg.idStartButton);
        this.dom.stopButton = document.getElementById(cfg.idStopButton);
        this.dom.resetButton = document.getElementById(cfg.idResetButton);
        this.dom.gpsTestSummary = document.getElementById(cfg.idGpsTestSummary);
        this.dom.gpsOutput = document.getElementById(cfg.idGpsOutput);
        this.dom.gpsTestStatus = document.getElementById(cfg.idGpsTestStatus);
        this.dom.dataTableContainer = document.getElementById(cfg.idDataTableContainer);

        this.radioSelect = new RadioCheckbox();
        this.radioSelect.Configure({name: cfg.nameStartAction});

        this.timerId = null;

        this.lockDurationList = [];

        this.running = false;

        this.dom.startButton.onclick = e => {
            this.OnStartClicked();
        };
        this.dom.stopButton.onclick = e => {
            this.OnStopClicked();
        };
        this.dom.resetButton.onclick = e => {
            this.OnResetClicked();
        };

        this.OnDisconnected();
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "msg":
                switch (evt.msg.type) {
                    case "GPS_LINE": this.OnMsgGpsLine(evt.msg); break;
                    case "GPS_FIX_TIME": this.OnMsgGpsFixTime(evt.msg); break;
                    case "GPS_FIX_2D": this.OnMsgGpsFix2D(evt.msg); break;
                    case "GPS_FIX_3D": this.OnMsgGpsFix3D(evt.msg); break;
                }
        }
    }

    OnConnected()
    {
        this.SetButtonStatusNotRunning();
        this.dom.resetButton.disabled = false;
        this.dom.gpsOutput.disabled = false;
        this.radioSelect.Enable();
    }
    
    OnDisconnected()
    {
        this.OnStopClicked();

        this.dom.startButton.disabled = true;
        this.dom.stopButton.disabled = true;
        this.dom.resetButton.disabled = true;
        this.dom.gpsOutput.disabled = true;
        this.radioSelect.Disable();
    }

    SetStatus(str)
    {
        this.dom.gpsTestStatus.innerHTML = str;
    }

    SetButtonStatusRunning()
    {
        this.dom.startButton.disabled = true;
        this.dom.stopButton.disabled = false;
        this.radioSelect.Disable();
    }

    SetButtonStatusNotRunning()
    {
        this.dom.startButton.disabled = false;
        this.dom.stopButton.disabled = true;
        this.radioSelect.Enable();
    }

    OnStartClicked()
    {
        this.running = true;

        this.SetButtonStatusRunning();

        this.StartNextTest();
    }
    
    OnStopClicked()
    {
        this.running = false;

        this.SetButtonStatusNotRunning();

        this.SetStatus("Stopped");

        this.ClearTimer();
    }

    OnResetClicked()
    {
        this.lockDurationList = [];

        this.UpdateResults();
    }

    ClearTimer()
    {
        if (this.timerId != null)
        {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    StartNextTest()
    {
        let startAction = this.radioSelect.GetValue();

        switch (startAction)
        {
            case "cold_reset": this.StartNextTest_Reset("cold"); break;
            case "warm_reset": this.StartNextTest_Reset("warm"); break;
            case "hot_reset": this.StartNextTest_Reset("hot"); break;
            case "power_off_batt_on": this.StartNextTest_Power(true); break;
            case "power_off_batt_off": this.StartNextTest_Power(false); break;
            default: break; // shouldn't happen
        }
    }

    StartActionDisplay(startAction)
    {
        let display = "Unknown";
        switch (startAction)
        {
            case "cold_reset": display = "Cold Reset"; break;
            case "warm_reset": display = "Warm Reset"; break;
            case "hot_reset": display = "Hot Reset"; break;
            case "power_off_batt_on": display = "Power Off, Battery On"; break;
            case "power_off_batt_off": display = "Power Off, Battery Off"; break;
            default: break; // shouldn't happen
        }

        return display;
    }

    StartNextTest_Reset(temp)
    {
        this.ClearTimer();

        // tell the GPS to start in case it was off from a partially completed power test
        this.conn.Send({
            type: "REQ_GPS_POWER_ON",
        });

        // tell the GPS to power on (automatically gets lock)
        this.conn.Send({
            type: "REQ_GPS_RESET",
            temp: temp,
        });

        this.SetStatus("GPS reset, waiting for lock");

        let count = 0;
        this.timerId = setInterval(() => {
            ++count;

            this.SetStatus(`GPS reset, waiting for lock (${count} secs so far)`);
        }, 1000);
    }

    StartNextTest_Power(battOn)
    {
        this.ClearTimer();

        // tell the GPS to power off
        if (battOn)
        {
            this.conn.Send({
                type: "REQ_GPS_POWER_OFF_BATT_ON",
            });
        }
        else
        {
            this.conn.Send({
                type: "REQ_GPS_POWER_OFF",
            });
        }

        let secDelay = 5;
        this.SetStatus(`GPS powered off, waiting ${secDelay} sec to power on`);
        
        let remaining = secDelay;
        this.timerId = setInterval(() => {
            --remaining

            if (remaining)
            {
                this.SetStatus(`GPS powered off, waiting ${secDelay} sec to power on (${remaining} sec remaining)`);
            }
            else
            {
                this.ClearTimer();

                // tell the GPS to power on (automatically gets lock)
                this.conn.Send({
                    type: "REQ_GPS_POWER_ON",
                });
        
                this.SetStatus("GPS powered on, waiting for lock");
        
                let count = 0;
                this.timerId = setInterval(() => {
                    ++count;
        
                    this.SetStatus(`GPS powered on, waiting for lock (${count} secs so far)`);
                }, 1000);
            }
        }, 1000);
    }

    OnMsgGpsLine(msg)
    {
        autl.StickyScrollAdd(
            this.dom.gpsOutput, 
            this.dom.gpsOutput.value == "" ? msg.line : "\n" + msg.line
        );

        autl.TruncateTo(this.dom.gpsOutput, 9);
    }

    OnMsgGpsFixTime(msg)
    {
        if (this.running && msg.firstLockDuration)
        {
            // create structure used to fill in each lock time
            this.lockList = [this.StartActionDisplay(this.radioSelect.GetValue()), null, null, null];
            this.lockDurationList.push(this.lockList);
            
            let secs = Math.round(msg.firstLockDuration / 1000);

            this.lockList[1] = secs;
    
            this.UpdateResults();
        }
    }

    OnMsgGpsFix2D(msg)
    {
        if (this.running && msg.firstLockDuration)
        {
            let secs = Math.round(msg.firstLockDuration / 1000);

            this.lockList[2] = secs;

            this.UpdateResults();
        }
    }

    OnMsgGpsFix3D(msg)
    {
        if (this.running && msg.firstLockDuration)
        {
            let secs = Math.round(msg.firstLockDuration / 1000);

            this.SetStatus(`Locked in ${secs} secs`);

            this.lockList[3] = secs;
    
            this.UpdateResults();

            this.StartNextTest();
        }
    }

    UpdateResults()
    {
        this.dom.gpsTestSummary.innerHTML = "";
        this.dom.dataTableContainer.innerHTML = "";

        if (this.lockDurationList.length)
        {
            // show summary of results
            let min = null;
            let max = null;
            let sum = 0;
    
            let count = 0;
            for (let i = 0; i < this.lockDurationList.length; ++i)
            {
                let lockDuration = this.lockDurationList[i][3];
    
                if (lockDuration != null)
                {
                    if (lockDuration < min || min == null) { min = lockDuration; }
                    if (lockDuration > max || max == null) { max = lockDuration; }
        
                    sum += lockDuration;

                    ++count;
                }
            }
    
            if (count != 0)
            {
                let avg = Math.round(sum / count);

                this.dom.gpsTestSummary.innerHTML = `Min: ${min}, Max: ${max}, Avg: ${avg}`;
            }
    
            // construct data table for display
            let dataTable = [
                ["Run #", "Start Action", "GPS Time Lock (secs)", "GPS 2D Lock (secs)", "GPS 3D Lock (secs)"],
            ];
    
            for (let i = 0; i < this.lockDurationList.length; ++i)
            {
                let row = [];
                row.push(i + 1);
                for (let duration of this.lockDurationList[i])
                {
                    row.push(duration);
                }
                dataTable.push(row);
            }
    
            let domTable = utl.MakeTable(dataTable);
            
            this.dom.dataTableContainer.appendChild(domTable);
        }
    }
}
