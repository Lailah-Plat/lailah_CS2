import { PaymentProvider } from "./PaymentProvider.js";
import { MoyasarProvider } from "./MoyasarService.js";
import { PayTabsProvider } from "./PayTabsService.js";
import { HyperPayProvider } from "./HyperPayService.js";
import { GeideaProvider } from "./GeideaService.js";
import { TabbyProvider } from "./TabbyService.js";
import { TamaraProvider } from "./TamaraService.js";

export class PaymentProviderFactory {
  static getProvider(providerName: string): PaymentProvider {
    switch (providerName.toLowerCase()) {
      case "moyasar":
        return new MoyasarProvider();
      case "paytabs":
        return new PayTabsProvider();
      case "hyperpay":
        return new HyperPayProvider();
      case "geidea":
        return new GeideaProvider();
      case "tabby":
      case "tabby_api":
        return new TabbyProvider();
      case "tamara":
      case "tamara_api":
        return new TamaraProvider();
      default:
        throw new Error(`Unsupported payment provider: ${providerName}`);
    }
  }
}
