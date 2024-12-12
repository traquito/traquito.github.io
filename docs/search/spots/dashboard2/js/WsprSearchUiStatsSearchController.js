import { Base } from './Base.js';
import { StrAccumulator } from '/js/Utl.js';


export class WsprSearchUiStatsSearchController
extends Base
{
    constructor(cfg)
    {
        super();

        this.cfg = cfg;

        this.ok =
            this.cfg.container &&
            this.cfg.wsprSearch;

        if (this.ok)
        {
            this.ui = this.MakeUI();
            this.cfg.container.appendChild(this.ui);
        }
        else
        {
            this.Err(`WsprSearchUiStatsSearchController`, `Could not init`);
            console.log(this.cfg.container);
            console.log(this.cfg.wsprSearch);
        }
    }

    OnEvent(evt)
    {
        if (this.ok)
        {
            switch (evt.type) {
                case "SEARCH_COMPLETE": this.OnSearchComplete(); break;
            }
        }
    }

    OnSearchComplete()
    {
        let stats = this.cfg.wsprSearch.GetStats();

        let a = new StrAccumulator();

        a.A(`Querying`);
        a.A(`--------`);
        a.A(`  Slot 0 Regular   - ms: ${stats.query.slot0Regular.durationMs.toString().padStart(4)}, rows: ${stats.query.slot0Regular.rowCount.toString().padStart(5)}, msgs: ${stats.query.slot0Regular.uniqueMsgCount.toString().padStart(4)}`);
        a.A(`  Slot 0 Telemetry - ms: ${stats.query.slot0Telemetry.durationMs.toString().padStart(4)}, rows: ${stats.query.slot0Telemetry.rowCount.toString().padStart(5)}, msgs: ${stats.query.slot0Telemetry.uniqueMsgCount.toString().padStart(4)}`);
        a.A(`  Slot 1 Telemetry - ms: ${stats.query.slot1Telemetry.durationMs.toString().padStart(4)}, rows: ${stats.query.slot1Telemetry.rowCount.toString().padStart(5)}, msgs: ${stats.query.slot1Telemetry.uniqueMsgCount.toString().padStart(4)}`);
        a.A(`  Slot 2 Telemetry - ms: ${stats.query.slot2Telemetry.durationMs.toString().padStart(4)}, rows: ${stats.query.slot2Telemetry.rowCount.toString().padStart(5)}, msgs: ${stats.query.slot2Telemetry.uniqueMsgCount.toString().padStart(4)}`);
        a.A(`  Slot 3 Telemetry - ms: ${stats.query.slot3Telemetry.durationMs.toString().padStart(4)}, rows: ${stats.query.slot3Telemetry.rowCount.toString().padStart(5)}, msgs: ${stats.query.slot3Telemetry.uniqueMsgCount.toString().padStart(4)}`);
        a.A(`  Slot 4 Telemetry - ms: ${stats.query.slot4Telemetry.durationMs.toString().padStart(4)}, rows: ${stats.query.slot4Telemetry.rowCount.toString().padStart(5)}, msgs: ${stats.query.slot4Telemetry.uniqueMsgCount.toString().padStart(4)}`);
        a.A(``);
        a.A(`Processing`);
        a.A(`----------`);
        a.A(`SearchTotalMs  : ${stats.processing.searchTotalMs.toString().padStart(4)}`);
        a.A(`  DecodeMs     : ${stats.processing.decodeMs.toString().padStart(4)}`);
        a.A(`  FilterMs     : ${stats.processing.filterMs.toString().padStart(4)}`);
        a.A(`  StatsGatherMs: ${stats.processing.statsGatherMs.toString().padStart(4)}`);
        a.A(``);
        a.A(`Results`);
        a.A(`-------`);
        a.A(`  Total 10-min windows: ${stats.results.windowCount}`);
        a.A(`  Slot 0 - msgs: ${stats.results.slot0.haveAnyMsgsPct.toString().padStart(3)} %, 0 ok pct: ${stats.results.slot0.noCandidatePct.toString().padStart(3)} %, 1 ok pct: ${stats.results.slot0.oneCandidatePct.toString().padStart(3)} %, 2+ ok pct: ${stats.results.slot0.multiCandidatePct.toString().padStart(3)} %`);
        a.A(`  Slot 1 - msgs: ${stats.results.slot1.haveAnyMsgsPct.toString().padStart(3)} %, 0 ok pct: ${stats.results.slot1.noCandidatePct.toString().padStart(3)} %, 1 ok pct: ${stats.results.slot1.oneCandidatePct.toString().padStart(3)} %, 2+ ok pct: ${stats.results.slot1.multiCandidatePct.toString().padStart(3)} %`);
        a.A(`  Slot 2 - msgs: ${stats.results.slot2.haveAnyMsgsPct.toString().padStart(3)} %, 0 ok pct: ${stats.results.slot2.noCandidatePct.toString().padStart(3)} %, 1 ok pct: ${stats.results.slot2.oneCandidatePct.toString().padStart(3)} %, 2+ ok pct: ${stats.results.slot2.multiCandidatePct.toString().padStart(3)} %`);
        a.A(`  Slot 3 - msgs: ${stats.results.slot3.haveAnyMsgsPct.toString().padStart(3)} %, 0 ok pct: ${stats.results.slot3.noCandidatePct.toString().padStart(3)} %, 1 ok pct: ${stats.results.slot3.oneCandidatePct.toString().padStart(3)} %, 2+ ok pct: ${stats.results.slot3.multiCandidatePct.toString().padStart(3)} %`);
        a.A(`  Slot 4 - msgs: ${stats.results.slot4.haveAnyMsgsPct.toString().padStart(3)} %, 0 ok pct: ${stats.results.slot4.noCandidatePct.toString().padStart(3)} %, 1 ok pct: ${stats.results.slot4.oneCandidatePct.toString().padStart(3)} %, 2+ ok pct: ${stats.results.slot4.multiCandidatePct.toString().padStart(3)} %`);

        this.ta.value  = a.Get();
    }

    MakeUI()
    {
        let ui = document.createElement('div');

        let ta = document.createElement('textarea');
        ta.spellcheck   = "false";
        ta.readOnly     = true;
        ta.disabled     = true;
        ta.style.width  = "600px";
        ta.style.height = "400px";

        this.ta = ta;

        ui.appendChild(ta);

        return ui;
    }
}


