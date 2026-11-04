import self_ from "./FCustomWallet.svelte";
import Feature from "@Content/Modules/Context/Feature";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import Price from "@Content/Modules/Currency/Price";
import type Context from "@Content/Modules/Context/Context";
import {mount} from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";
import type {TCurrency} from "@Core/Currencies";

export default class FCustomWallet extends Feature<Context> {

    public override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        const minAmountNode = document.querySelector<HTMLElement>(".addfunds_area_purchase_game");
        if (!minAmountNode) {
            throw new MountTargetError();
        }

        const minAmount = minAmountNode.querySelector(".price")?.textContent?.trim();
        if (!minAmount) {
            throw new MountTargetError();
        }

        const currency: TCurrency = CurrencyManager.getCurrencyInfo(CurrencyManager.storeCurrency);
        const minValue = Price.parseFromString(minAmount, currency.abbr)?.value;
        if (!minValue) {
            return "Could not find min price";
        }

        const inputAmountNode = document.querySelector<HTMLInputElement>("#input_amount");
        const inputForm = document.querySelector<HTMLFormElement>("#form_addfunds");

        if (!inputAmountNode || !inputForm) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: minAmountNode.parentElement!,
            props: {
                currency,
                minValue,
                onsubmit: (price: Price) => {
                    inputAmountNode.value = Number(price.value).toFixed(2).replace(/[,.]/g, "");
                    inputForm.submit();
                }
            }
        });
        return null;
    }
}
