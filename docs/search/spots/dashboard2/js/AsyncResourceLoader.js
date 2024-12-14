
///////////////////////////////////////////////////////////////////////////////
// Cache subsequent loads for the same resource, which all takes their own
// load time, even when the url is the same.
///////////////////////////////////////////////////////////////////////////////

export class AsyncResourceLoader
{
    static url__scriptPromise = new Map();
    static AsyncLoadScript(url)
    {
        if (this.url__scriptPromise.has(url) == false)
        {
            let p = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.async = true;
                
                script.onload = () => {
                    resolve();
                };

                script.onerror = (message) => {
                    reject(new Error(message));
                }
    
                document.body.appendChild(script);
            });

            this.url__scriptPromise.set(url, p);
        }

        let p = this.url__scriptPromise.get(url);

        return p;
    }

    static url__stylesheetPromise = new Map();
    static AsyncLoadStylesheet(url)
    {
        if (this.url__stylesheetPromise.has(url) == false)
        {
            let p = new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = "stylesheet";
                link.href = url;
                link.async = true;
        
                link.onload = () => {
                    resolve();
                };

                link.onerror = (message) => {
                    reject(new Error(message));
                };
    
                document.body.appendChild(link);
            });

            this.url__stylesheetPromise.set(url, p);
        }

        let p = this.url__stylesheetPromise.get(url);

        return p;
    }
}
