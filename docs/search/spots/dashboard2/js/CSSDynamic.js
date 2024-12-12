

export class CSSDynamic
{
    // Find the CSSStyleRule for the class
    GetCssRule(className)
    {
        let retVal = null;

        for (const sheet of document.styleSheets)
        {
            try
            {
                for (const rule of sheet.cssRules)
                {
                    if (rule.selectorText === className)
                    {
                        retVal = rule;
                        break;
                    }
                }
            }
            catch (e)
            {
                // Catch and ignore CORS-related issues
                // console.warn('Cannot access stylesheet:', sheet.href);
            }
        }

        return retVal;
    }

    MakeCssRule(ruleName)
    {
        const sheet = document.styleSheets[0]; // Use the first stylesheet
        const ruleIndex = sheet.cssRules.length;
        
        // Add a new rule if it doesn't exist
        sheet.insertRule(`${ruleName} {}`, ruleIndex);
    }

    // don't include the '.' before class name, handled automatically
    GetOrMakeCssClass(ccName)
    {
        let rule = this.GetCssRule(`.${ccName}`);

        if (rule == null)
        {
            this.MakeCssRule(`.${ccName}`);
        }

        rule = this.GetCssRule(`.${ccName}`);

        return rule;
    }

    // eg ("MyClass", { color: 'red', border: '1 px solid black', })
    SetCssClassProperties(ccName, styles)
    {
        let rule = this.GetOrMakeCssClass(ccName);

        Object.entries(styles).forEach(([key, value]) => {
            rule.style[key] = value;
        });
    }
}

