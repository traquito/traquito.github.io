export function ce(type)
{
    return document.createElement(type);
}

export function span(content)
{
    let dom = ce("span");

    dom.innerHTML = content;

    return dom;
}