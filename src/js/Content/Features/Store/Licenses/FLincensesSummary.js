import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FLincensesSummary extends Feature {

    apply() {
        const all = document.querySelectorAll(".account_table tr[data-panel]");
        const list = {};
        const types = {};

        for (const item of all) {
            const dateStr = item.querySelector(".license_date_col").innerHTML;
            const year = /\d{4}/.exec(dateStr)?.[0] ?? "";
            const typ = item.querySelector(".license_acquisition_col").innerHTML.trim();

            (list[year] ??= {})[typ] = (list[year][typ] ?? 0) + 1;
            types[typ] = (types[typ] ?? 0) + 1;
        }

        const listEntries = Object.entries(list).reverse();
        const totals = listEntries.map(
            ([, row]) => Object.entries(row)
                .map(([, count]) => count)
                .reduce((a, b) => a + b, 0)
        );

        const totalGlobal = totals.reduce((a, b) => a + b, 0);
        const typesEntries = Object.entries(types);

        const tableHeader = typesEntries
            .map(([name]) => `<th>${name}</th>`)
            .join("");

        const tableFooter = typesEntries
            .map(([, value]) => `<td>${value || "0"}</td>`)
            .join("");

        const rows = listEntries
            .map(([year, row], i) => `<tr>
                <td>${year}</td>
                ${typesEntries
        .map(([name]) => `<td>${row[name] || "0"}</td>`)
        .join("")
}
                <td>${totals[i] || "0"}</td>
            </tr>`)
            .join("");

        HTML.beforeBegin(
            document.querySelector(".youraccount_page > .block"),
            `<div class="block" style="margin-bottom: 20px">
                <div class="block_content">
                    <table class="account_table">
                        <tbody>
                            <tr>
                                <th>${Localization.str.year}</th>
                                ${tableHeader}
                                <th>${Localization.str.all}</th>
                            </tr>
                            ${rows}
                            <tr>
                                <td>${Localization.str.all}</td>
                                ${tableFooter}
                                <td>${totalGlobal}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`
        );
    }
}
