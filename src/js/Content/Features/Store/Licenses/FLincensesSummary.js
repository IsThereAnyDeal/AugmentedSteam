import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FLincensesSummary extends Feature {

    apply() {

        const all = document.querySelectorAll(".account_table tbody tr[data-panel]");
        const list = {};
        const types = {};
        for ( const item of all ) {
            const date_str = item.querySelector( ".license_date_col" ).innerHTML;
            const year =
                   /\d{4}$/.exec(date_str)?.[0] // "24 May, 2022" -> "2022"
                || /^\d{4}/.exec(date_str)?.[0] // "2023. aug. 2." -> "2023"
                || "";
            const typ = item.querySelector( ".license_acquisition_col" ).innerHTML.trim();
            (list[year] ||= {})[typ] = (list[year][typ] || 0) + 1;
            types[typ] = (types[typ] || 0) + 1;
        }

        const list_entries = Object.entries(list).reverse()
        const totals = [];
        list_entries.forEach(([,row], i, arr) => {
            totals[i] = Object.entries(row)
                .map(([,count]) => count)
                .reduce((a,b) => a+b, 0);
        })
        const total_global = totals.reduce((a,b) => a+b, 0);

        const types_entries = Object.entries(types);

        HTML.beforeBegin(
            document.querySelector('.youraccount_page > .block'),
            `<div class="block" style="margin-bottom: 20px">
                <div class="block_content">
                    <table class="account_table">
                        <tbody>
                            <tr>
                                <th>${Localization.str.year}</th>
                                ${types_entries
                                    .map(([name]) => `<th>${name}</th>` )
                                    .join('')
                                }
                                <th>${Localization.str.all}</th>
                            </tr>
                            ${list_entries
                                .map(([year, row], i) =>
                            `<tr>
                                <td>${year}</td>
                                ${types_entries
                                    .map(([name]) => `<td>${row[name] || '0'}</td>`)
                                    .join('')
                                }
                                <td>${totals[i] || '0'}</td>
                            </tr>`)
                                .join('')}
                            <tr>
                                <td>${Localization.str.all}</td>
                                ${types_entries
                                    .map(([,value]) => `<td>${value || '0'}</td>`)
                                    .join('')
                                }
                                <td>${total_global}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`
        );
    }
}
