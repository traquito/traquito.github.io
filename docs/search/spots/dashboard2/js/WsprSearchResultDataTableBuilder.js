import { Base } from './Base.js';
import { TabularData } from '../../../../js/TabularData.js';


// Adapter to the WsprSearch results.
// Extracts data from the results where unambiguous.
// 
export class WsprSearchResultDataTableBuilder
extends Base
{
    constructor(wsprSearch)
    {
        super();

        this.wsprSearch = wsprSearch;
    }

    GetDataTable()
    {



        
        
        let td = new TabularData();

        return td;
    }
}

