
/////////////////////////////////////////////////////////////////////
// Misc
/////////////////////////////////////////////////////////////////////

export function ToastOk(str)
{
    Toastify({
        text: str ? str : "OK",
        duration: 1500,
        position: "center",
        style: {
            background: "green",
        },
        offset: {
            y: 50,
        },
    }).showToast();
}

export function ToastWarn(str)
{
    Toastify({
        text: str ? str : "Warning",
        duration: 1500,
        position: "center",
        style: {
            background: "blue",
        },
        offset: {
            y: 50,
        },
    }).showToast();
}

export function ToastErr(str)
{
    Toastify({
        text: str ? str : "Error",
        duration: 1500,
        position: "center",
        style: {
            background: "red",
        },
        offset: {
            y: 50,
        },
    }).showToast();
}

export function ToastDialog(str)
{
    Toastify({
        text: str ? str : "Err",
        duration: -1,
        close: true,
        position: "center",
        style: {
            background: "green",
        },
        offset: {
            y: 200,
        },
    }).showToast();
}

export function ScrollableNumber(dom)
{
    let wheelevt =
        (/Firefox/i.test(navigator.userAgent)) ?
            "DOMMouseScroll"                   :
            "mousewheel";

    let fnOnMouseOver = e => {
        dom.addEventListener(wheelevt, fnOnScroll);
    };

    let fnOnMouseOut = e => {
        dom.removeEventListener(wheelevt, fnOnScroll);
    };

    let fnOnScroll = e => {
        e.preventDefault();

        let value = parseInt(dom.value);
        let step  = parseInt(dom.step);

        if (e.wheelDelta < 0) { dom.value = value + step; }
        else                  { dom.value = value - step; }
        
        dom.dispatchEvent(new Event('input'))
        
        return false;
    };

    dom.addEventListener("mouseover", fnOnMouseOver);
    dom.addEventListener("mouseout", fnOnMouseOut);
}

let domGreyout = null;
export function GreyoutEnable()
{
    if (domGreyout == null)
    {
        domGreyout = document.createElement("div");
    
        domGreyout.style.position = "fixed";
        domGreyout.style.left = "0px";
        domGreyout.style.top = "0px";
        domGreyout.style.height = "100%";
        domGreyout.style.width = "100%";
        domGreyout.style.backgroundColor = "black";
        domGreyout.style.opacity = "0.4";
        domGreyout.style.zIndex = "9999";
    
        document.body.appendChild(domGreyout);
    }
}

export function GreyoutDisable()
{
    if (domGreyout != null)
    {
        document.body.removeChild(domGreyout);
    
        domGreyout = null;
    }
}

let domModal = null;
export function ModalShow(str)
{
    ModalClose();

    domModal = document.createElement("dialog");
    domModal.innerHTML = str;

    domModal.addEventListener('cancel', (event) => {
        event.preventDefault();
    });

    document.body.appendChild(domModal);

    domModal.showModal();

    return domModal;
}

export function ModalClose()
{
    if (domModal != null)
    {
        domModal.close();
        document.body.removeChild(domModal);
        domModal.innerHTML = "";

        domModal = null;
    }
}


export function ProgressInc(domProgress, step, stepMs)
{
    step   = parseInt(step);
    stepMs = parseInt(stepMs);

    let id = null;

    id = setInterval(() => {
        let val = parseInt(domProgress.value);
        let max = parseInt(domProgress.max);

        if (val < max)
        {
            let rem = max - val;
            
            val = val + Math.min(rem, step);

            domProgress.value = val;
        }

        if (val >= max)
        {
            clearInterval(id);
        }
    }, stepMs);

    return id;
}

export function StickyScrollAdd(dom, contentToAdd)
{
    // observe current state of scrollbar in relationship to content
    let topBefore = dom.scrollTop;
    dom.scrollTop = dom.scrollHeight;
    let topAfter = dom.scrollTop;

    // add new data
    dom.value += contentToAdd;

    if (topBefore == topAfter)
    {
        // the scroll bar was all the way down before, keep it there
        dom.scrollTop = dom.scrollHeight;
    }
    else
    {
        // the scroll bar was looking elsewhere, keep it there
        dom.scrollTop = topBefore;
    }
}

export function TruncateTo(dom, lineCountMax)
{
    let lineList = dom.value.split("\n");

    if (lineList.length > lineCountMax)
    {
        let lineListNew = [];

        for (let i = lineList.length - lineCountMax; i < lineList.length; ++i)
        {
            lineListNew.push(lineList[i]);
        }

        dom.value = lineListNew.join("\n");
    }
}