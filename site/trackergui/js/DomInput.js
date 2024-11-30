

export class DomInput
{
    constructor(cfg)
    {
        this.cfg = cfg;

        this.dom = cfg.dom;

        // default value
        this.propDefaultValue = "defaultValue";
        if (this.dom.type == "select-one") { this.propDefaultValue = "value"; }
        if (this.dom.type == "checkbox") { this.propDefaultValue = "checked"; }
        if (this.dom.type == undefined) { this.propDefaultValue = "innerHTML"; }
        if (this.cfg.propDefaultValue) { this.propDefaultValue = this.cfg.propDefaultValue; }
        this.defaultValue = this.dom[this.propDefaultValue];

        // value
        this.propValue = "value";
        if (this.dom.type == "checkbox") { this.propValue = "checked"; }
        if (this.dom.type == undefined ) { this.propValue = "innerHTML"; }
        if (this.cfg.propValue) { this.propValue = this.cfg.propValue; }

        // other
        this.baseline = this.SaveValueBaseline();

        this.error   = false;   // higher precidence over changed
        this.changed = false;

        // prevent spaces
        this.dom.addEventListener("keydown", (e) => {
            let retVal = true;

            if (e.which === 32)
            {
                e.preventDefault();
                retVal = false;
            }

            return retVal;
        });

        let event = "input";
        if (this.dom.type == "checkbox")
        {
            event = "change";
        }

        this.dom.addEventListener(event, () => {
            this.OnChangeHandler();
        });
    }
    
    OnChangeHandler()
    {
        this.OnBaselineChangeCheck();
        this.OnChange();
    }

    OnBaselineChangeCheck()
    {
        if (this.GetBaselineValue() != this.GetValue())
        {
            this.SetChangedState();
        }
        else
        {
            this.UnsetChangedState();
        }
    }

    OnChange()
    {
        let val = this.GetValue();

        if (this.cfg.logOnChange)
        {
            console.log(`change to ${val}`);
        }

        if (this.cfg.fnOnChange)
        {
            this.cfg.fnOnChange(val);
        } 
    }

    GetValue()
    {
        return this.dom[this.propValue];
    }

    SetValue(val)
    {
        this.dom[this.propValue] = val;
    }

    SetValueAndTrigger(val)
    {
        this.SetValue(val);

        this.OnChange();
    }

    SetValueAndTriggerIfChanged(val)
    {
        let valNow = this.GetValue();

        this.SetValue(val);

        if (valNow != val)
        {
            this.OnChange();
        }
    }

    Trigger()
    {
        this.OnChange();
    }

    SetValueAsBaseline(val)
    {
        this.SetValue(val);

        this.SaveValueBaseline();
    }

    SaveValueBaseline()
    {
        this.baseline = this.GetValue();

        this.UnsetErrorState();
        this.UnsetChangedState();

        return this.baseline;
    }

    GetBaselineValue()
    {
        return this.baseline;
    }

    SetValueToDefault()
    {
        this.UnsetErrorState();
        this.UnsetChangedState();
        this.SetValue(this.defaultValue);
    }

    SetErrorState()
    {
        this.error = true;

        this.dom.style.background = "#FFAAAA";
    }

    UnsetErrorState()
    {
        this.error = false;

        if (this.changed == false)
        {
            this.dom.style.background = "";
        }
        else
        {
            this.SetChangedState();
        }
    }

    SetChangedState()
    {
        this.changed = true;

        if (this.error == false)
        {
            this.dom.style.background = "yellow";
        }
    }

    UnsetChangedState()
    {
        if (this.error == false)
        {
            this.dom.style.background = "";
        }
    }

    GetDefaultValue()
    {
        return this.defaultValue;
    }

    Disable()
    {
        this.dom.disabled = true;
    }
    
    Enable()
    {
        this.dom.disabled = false;
    }
}


export class DomInputGroup
{
    constructor(domList, fnOnChange)
    {
        this.domList = domList;
        this.fnOnChange = fnOnChange;

        this.diList = [];
        for (const dom of this.domList)
        {
            let di = new DomInput({
                dom: dom,
                fnOnChange: val => {
                    this.OnChange(val);
                },
            })

            this.diList.push(di);
        }
    }

    OnChange(val)
    {
        this.diList.forEach(di => {
            di.SetValue(val);
            di.OnBaselineChangeCheck();
        });

        this.fnOnChange(val);
    }

    SetErrorState()
    {
        this.diList.forEach(di => { di.SetErrorState(); });
    }

    SaveValueBaseline()
    {
        this.diList.forEach(di => { di.SaveValueBaseline(); });
    }
    
    SetValueAsBaseline(val)
    {
        this.diList.forEach(di => { di.SetValueAsBaseline(val); });
    }

    OnBaselineChangeCheck()
    {
        this.diList.forEach(di => { di.OnBaselineChangeCheck(); });
    }

    SetValueToDefault()
    {
        this.diList.forEach(di => { di.SetValueToDefault(); });
    }

    GetValue()
    {
        return this.diList[0].GetValue();
    }

    Enable()
    {
        this.diList.forEach(di => { di.Enable(); });
    }
    
    Disable()
    {
        this.diList.forEach(di => { di.Disable(); });
    }
}
