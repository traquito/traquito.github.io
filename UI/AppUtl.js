
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

