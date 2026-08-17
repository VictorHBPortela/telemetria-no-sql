import { leituraInputSchema } from "../contracts/leitura.contract.ts";
import type { LeituraService } from "../services/leitura.service.ts";
import type { ApiContext } from "../shared/http.ts";
import { routeParam } from "../shared/http.ts";

export class LeituraController {
  public constructor(private readonly service: LeituraService) {}

  public create = async (context: ApiContext): Promise<void> => {
    const input = leituraInputSchema.parse(context.request.body);
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

  public update = async (context: ApiContext): Promise<void> => {
    const input = leituraInputSchema.parse(context.request.body);
    context.body = await this.service.update(routeParam(context, "id"), input);
  };

  public delete = async (context: ApiContext): Promise<void> => {
    await this.service.delete(routeParam(context, "id"));
    context.status = 204;
  };
}
