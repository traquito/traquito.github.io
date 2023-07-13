import * as utl from '/js/Utl.js';
import { Event } from '/trackergui/js/Event.js';


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
        this.dom.gpsTestStatus = document.getElementById(cfg.idGpsTestStatus);
        this.dom.dataTableContainer = document.getElementById(cfg.idDataTableContainer);

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
                    case "GPS_FIX_3D": this.OnMsgGpsFix3D(evt.msg); break;
                }
        }
    }

    OnConnected()
    {
        this.SetButtonStatusNotRunning();
        this.dom.resetButton.disabled = false;
    }
    
    OnDisconnected()
    {
        this.OnStopClicked();

        this.dom.startButton.disabled = true;
        this.dom.stopButton.disabled = true;
        this.dom.resetButton.disabled = true;
    }

    SetStatus(str)
    {
        this.dom.gpsTestStatus.innerHTML = str;
    }

    SetButtonStatusRunning()
    {
        this.dom.startButton.disabled = true;
        this.dom.stopButton.disabled = false;
    }

    SetButtonStatusNotRunning()
    {
        this.dom.startButton.disabled = false;
        this.dom.stopButton.disabled = true;
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
        this.ClearTimer();

        // tell the GPS to power on (automatically gets lock)
        this.conn.Send({
            type: "REQ_GPS_RESET",
            temp: "cold",
        });

        this.SetStatus("GPS reset, waiting for lock");

        let count = 0;
        this.timerId = setInterval(() => {
            ++count;

            this.SetStatus(`GPS reset, waiting for lock (${count} secs so far)`);
        }, 1000);
    }

    StartNextTest_PowerOffOn()
    {
        this.ClearTimer();

        // tell the GPS to power off
        this.conn.Send({
            type: "REQ_GPS_POWER_OFF",
        });

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

    OnMsgGpsFix3D(msg)
    {
        if (this.running)
        {
            if (msg.firstLockDuration)
            {
                let secs = Math.round(msg.firstLockDuration / 1000);
    
                this.OnFix3D(secs);
            }
        }
    }

    OnFix3D(secs)
    {
        this.SetStatus(`Locked in ${secs} secs`);

        this.lockDurationList.push(secs);

        this.UpdateResults();

        this.StartNextTest();
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
    
            for (let i = 0; i < this.lockDurationList.length; ++i)
            {
                let lockDuration = this.lockDurationList[i];
    
                if (lockDuration < min || min == null) { min = lockDuration; }
                if (lockDuration > max || max == null) { max = lockDuration; }
    
                sum += lockDuration;
            }
    
            let avg = Math.round(sum / this.lockDurationList.length);
    
            this.dom.gpsTestSummary.innerHTML = `min: ${min}, max: ${max}, avg: ${avg}`;
    
    
            // construct data table for display
            let dataTable = [
                ["Run", "Duration (secs)"],
            ];
    
            for (let i = 0; i < this.lockDurationList.length; ++i)
            {
                dataTable.push([i + 1, this.lockDurationList[i]]);
            }
    
            let domTable = utl.MakeTable(dataTable);
            
            this.dom.dataTableContainer.appendChild(domTable);
        }
    }
}
