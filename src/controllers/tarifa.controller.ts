import { tarifaInputSchema } from "../contracts/tarifa.contract.ts";
import type { TarifaService } from "../services/tarifa.service.ts";
import type { ApiContext } from "../shared/http.ts";
import { routeParam } from "../shared/http.ts";

export class TarifaController {
  public constructor(private readonly service: TarifaService) {}

  public create = async (context: ApiContext): Promise<void> => {
    const input = tarifaInputSchema.parse(context.request.body);
    context.status = 201;
    context.body = await this.service.create(input);
  };

  public findAll = async (context: ApiContext): Promise<void> => {
    context.body = await this.service.findAll();
  };

  public findById = async (context: ApiContext): Promise<void> => {
    context.body = await this.service.findById(routeParam(context, "id"));
  };

  public update = async (context: ApiContext): Promise<void> => {
    const input = tarifaInputSchema.parse(context.request.body);
    context.body = await this.service.update(routeParam(context, "id"), input);
  };

  public delete = async (context: ApiContext): Promise<void> => {
    await this.service.delete(routeParam(context, "id"));
    context.status = 204;
  };
}
