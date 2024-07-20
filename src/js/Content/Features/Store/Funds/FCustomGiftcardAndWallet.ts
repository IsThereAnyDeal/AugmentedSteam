import {L} from "@Core/Localization/Localization";
import {__wallet_customAmount, __wallet_customAmountText, __wallet_customGiftcard} from "@Strings/_strings";
import type CFunds from "@Content/Features/Store/Funds/CFunds";
import Feature from "@Content/Modules/Context/Feature";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import HTML from "@Core/Html/Html";
import Price from "@Content/Modules/Currency/Price";

export default class FCustomGiftcardAndWallet extends Feature<CFunds> {

    // Format a price value to send to Steam servers
    private formatValue(value: number): string {
        return Number(value).toFixed(2)
            .replace(/[,.]/g, "");
    }

    override apply(): void {
        const giftcard = window.location.pathname.startsWith("/digitalgiftcards/");

        const minAmountNode = document.querySelector<HTMLElement>(giftcard
            ? ".giftcard_selection"
            : ".addfunds_area_purchase_game"
        )!;
        const newel = minAmountNode.cloneNode(true) as HTMLElement;
        newel.classList.add("es_custom_money");

        const priceel = newel.querySelector(giftcard ? ".giftcard_text" : ".price")!;
        const price = priceel.textContent!.trim();

        const currency = CurrencyManager.getCurrencyInfo(CurrencyManager.storeCurrency);
        const minValue = Price.parseFromString(price, currency.abbr)?.value;
        if (minValue === undefined) {
            return;
        }

        const submitel = newel.querySelector("a")!;
        submitel.removeAttribute("href");
        submitel.removeAttribute("onclick");
        submitel.dataset.amount = this.formatValue(minValue);

        const step = 10 ** -currency.format.places;
        let input = `<input type="number" id="es_custom_money_input" min="${minValue}" step="${step}" value="${minValue}">`;

        // add currency symbol
        if (currency.format.right) {
            input += currency.format.symbolFormat;
        } else {
            input = currency.format.symbolFormat + input;
        }

        if (giftcard) {
            const styleel = newel.querySelector(".giftcard_style")!;
            HTML.inner(styleel, L(__wallet_customGiftcard, {"input": `<span>${input}</span>`}));
            newel.querySelector<HTMLElement>("#es_custom_money_input")!.dataset.tooltipText
                = L(__wallet_customAmountText, {"minamount": price});

            styleel.addEventListener("click", e => {
                e.stopPropagation();
            });
        } else {
            HTML.inner(priceel, input);
            newel.querySelector("h1")!.textContent = `${L(__wallet_customAmount)} ${price}`;
            newel.querySelector("p")!.textContent = L(__wallet_customAmountText, {"minamount": price});
        }

        minAmountNode.insertAdjacentElement("afterend", newel);

        newel.querySelector("#es_custom_money_input")!.addEventListener("input", e => {
            let value = Number((<HTMLInputElement>e.target).value);
            if (value < minValue) {
                value = minValue; // prevent purchase error
            }

            submitel.dataset.amount = this.formatValue(value);

            if (giftcard) {
                priceel.textContent = (new Price(value)).toString();
                priceel.classList.toggle("small", priceel.textContent.length > 8);
            } else {
                newel.querySelector("h1")!.textContent = `${L(__wallet_customAmount)} ${new Price(value)}`;
            }
        });

        // Submit the form to Steam servers, see page scripts `submitSelectGiftCard` or `submitAddFunds`
        submitel.addEventListener("click", () => {
            if (!giftcard) {
                document.querySelector<HTMLInputElement>("#input_currency")!.value = submitel.dataset.currency!;
            }
            document.querySelector<HTMLInputElement>("#input_amount")!.value = submitel.dataset.amount!;
            document.querySelector<HTMLFormElement>("#form_addfunds")!.submit();
        });
    }
}
