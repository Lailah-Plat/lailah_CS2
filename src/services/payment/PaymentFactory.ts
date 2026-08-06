import { PaymentGateway } from "./PaymentGateway";
import { MoyasarService } from "./MoyasarService";
import { PayTabsService } from "./PayTabsService";
import { HyperPayService } from "./HyperPayService";
import { GeideaService } from "./GeideaService";
import { TabbyService } from "./TabbyService";
import { TamaraService } from "./TamaraService";

export class PaymentFactory {
  static getGateway(providerName: string, customKeys?: any): PaymentGateway {
    const gateway = (() => {
      switch (providerName.toLowerCase()) {
        case "moyasar":
          return new MoyasarService();
        case "paytabs":
          return new PayTabsService();
        case "hyperpay":
          return new HyperPayService();
        case "geidea":
          return new GeideaService();
        case "tabby":
        case "tabby_api":
          return new TabbyService();
        case "tamara":
        case "tamara_api":
          return new TamaraService();
        default:
          throw new Error(`Unsupported payment gateway: ${providerName}`);
      }
    })();

    // Ignore customKeys passed from client to ensure we only use the securely loaded server-side keys
    return gateway;
  }
}
