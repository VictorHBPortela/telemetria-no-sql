import { alertaInputSchema } from "../contracts/alerta.contract.ts";
import type { AlertaService } from "../services/alerta.service.ts";
import type { ApiContext } from "../shared/http.ts";
import { routeParam } from "../shared/http.ts";

export class AlertaController {
  public constructor(private readonly service: AlertaService) {}

  public create = async (context: ApiContext): Promise<void> => {
    const input = alertaInputSchema.parse(context.request.body);
    context.status = 201;
    context.body = await this.service.create(input);
  };

  public findAll = async (context: ApiContext): Promise<void> => {
    context.body = await this.service.findAll();
  };

  public findById = async (context: ApiContext): Promise<void> => {
    context.body = await this.service.findById(routeParam(context, "id"));
  };

  public findByMedidorId = async (context: ApiContext): Promise<void> => {
    context.body = await this.service.findByMedidorId(routeParam(context, "medidorId"));
  };

  public findNaoResolvidos = async (context: ApiContext): Promise<void> => {
    context.body = await this.service.findNaoResolvidos();
  };

  public update = async (context: ApiContext): Promise<void> => {
    const input = alertaInputSchema.parse(context.request.body);
    context.body = await this.service.update(routeParam(context, "id"), input);
  };

  public resolve = async (context: ApiContext): Promise<void> => {
    context.body = await this.service.resolve(routeParam(context, "id"));
  };

  public delete = async (context: ApiContext): Promise<void> => {
    await this.service.delete(routeParam(context, "id"));
    context.status = 204;
  };
}
