

export class CSSDynamic
{
    // Find the CSSStyleRule for the class
    GetCssRule(className)
    {
        let retVal = null;

        for (const sheet of document.styleSheets)
        {
            if (sheet.href == null)
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
                    console.warn(`Cannot access stylesheet: ${sheet.href}: ${e}`);
                }
            }
        }

        return retVal;
    }

    MakeCssRule(ruleName)
    {
        let sheet = null;
        for (let ss of document.styleSheets)
        {
            if (ss.href == null)
            {
                sheet = ss;
                break;
            }
        }

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

    // Create the CSS rule for the (eg) :after pseudo-element
    // if you want .ClassName::after, pass in "ClassName", "after"
    SetCssClassDynamicProperties(className, pseudoElement, content, styles) {
        const afterRule = `.${className}::${pseudoElement} { content: '${content}'; ${styles} }`;
    
        let styleSheet = document.querySelector('style[data-dynamic]');
        if (!styleSheet)
        {
            styleSheet = document.createElement('style');
            styleSheet.setAttribute('data-dynamic', '');
            document.head.appendChild(styleSheet);
        }
    
        styleSheet.sheet.insertRule(afterRule, styleSheet.sheet.cssRules.length);
    }
}

