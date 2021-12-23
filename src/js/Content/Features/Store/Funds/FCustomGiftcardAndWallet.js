import {HTML, Localization} from "../../../../modulesCore";
import {CurrencyManager, Feature, Price} from "../../../modulesContent";

export default class FCustomGiftcardAndWallet extends Feature {

    apply() {

        const giftcard = window.location.pathname.startsWith("/digitalgiftcards/");

        // Format a price value to send to Steam servers
        function formatValue(value) {
            return Number(value).toFixed(2)
                .replace(/[,.]/g, "");
        }

        const minAmountNode = document.querySelector(giftcard ? ".giftcard_selection" : ".addfunds_area_purchase_game");
        const newel = minAmountNode.cloneNode(true);
        newel.classList.add("es_custom_money");

        const priceel = newel.querySelector(giftcard ? ".giftcard_text" : ".price");
        const price = priceel.textContent.trim();

        const currency = CurrencyManager.fromType(CurrencyManager.storeCurrency);
        const minValue = currency.valueOf(price);

        const submitel = newel.querySelector("a");
        submitel.removeAttribute("href");
        submitel.removeAttribute("onclick");
        submitel.dataset.amount = formatValue(minValue);

        const step = 10 ** -currency.format.decimalPlaces;
        let input = `<input type="number" id="es_custom_money_input" min="${minValue}" step="${step}" value="${minValue}">`;

        // add currency symbol
        if (currency.format.postfix) {
            input += currency.format.symbol;
        } else {
            input = currency.format.symbol + input;
        }

        if (giftcard) {
            const styleel = newel.querySelector(".giftcard_style");
            HTML.inner(styleel, Localization.str.wallet.custom_giftcard.replace("__input__", `<span>${input}</span>`));
            newel.querySelector("#es_custom_money_input").dataset.tooltipText
                = Localization.str.wallet.custom_amount_text.replace("__minamount__", price);

            styleel.addEventListener("click", e => {
                e.stopPropagation();
            });
        } else {
            HTML.inner(priceel, input);
            newel.querySelector("h1").textContent = `${Localization.str.wallet.custom_amount} ${price}`;
            newel.querySelector("p").textContent = Localization.str.wallet.custom_amount_text.replace("__minamount__", price);
        }

        minAmountNode.insertAdjacentElement("afterend", newel);

        newel.querySelector("#es_custom_money_input").addEventListener("input", e => {
            let value = e.target.value;
            if (value < minValue) {
                value = minValue; // prevent purchase error
            }

            submitel.dataset.amount = formatValue(value);

            if (giftcard) {
                priceel.textContent = new Price(value);
                priceel.classList.toggle("small", priceel.textContent.length > 8);
            } else {
                newel.querySelector("h1").textContent = `${Localization.str.wallet.custom_amount} ${new Price(value)}`;
            }
        });

        // Submit the form to Steam servers, see page scripts `submitSelectGiftCard` or `submitAddFunds`
        submitel.addEventListener("click", () => {
            if (!giftcard) {
                document.querySelector("#input_currency").value = submitel.dataset.currency;
            }
            document.querySelector("#input_amount").value = submitel.dataset.amount;
            document.querySelector("#form_addfunds").submit();
        });
    }
}
