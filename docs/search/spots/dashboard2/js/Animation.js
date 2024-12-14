


export class Animation
{
    // assumes you're starting at 0 opacity, to get to 1
    static FadeOpacityUp(dom)
    {
        if (dom)
        {
            let Step;
            
            Step = () => {
                dom.style.opacity = parseFloat(dom.style.opacity) + 0.05;
                
                if (dom.style.opacity >= 1)
                {
                    dom.style.opacity = 1;
                }
                else
                {
                    window.requestAnimationFrame(() => { Step() });
                }
            };

            window.requestAnimationFrame(() => { Step() });
        }
    }
}


