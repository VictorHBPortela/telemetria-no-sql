import { TarifaRepository } from "./repositories/tarifa.repository.ts";
import { LojaRepository } from "./repositories/loja.repository.ts";
import { MedidorRepository } from "./repositories/medidor.repository.ts";
import { LeituraRepository } from "./repositories/leitura.repository.ts";
import { AlertaRepository } from "./repositories/alerta.repository.ts";
import { TarifaService } from "./services/tarifa.service.ts";
import { LojaService } from "./services/loja.service.ts";
import { MedidorService } from "./services/medidor.service.ts";
import { LeituraService } from "./services/leitura.service.ts";
import { AlertaService } from "./services/alerta.service.ts";
import { TarifaController } from "./controllers/tarifa.controller.ts";
import { LojaController } from "./controllers/loja.controller.ts";
import { MedidorController } from "./controllers/medidor.controller.ts";
import { LeituraController } from "./controllers/leitura.controller.ts";
import { AlertaController } from "./controllers/alerta.controller.ts";
import type { Controllers } from "./routes.ts";

export const createControllers = (): Controllers => {
  const tarifaRepository = new TarifaRepository();
  const lojaRepository = new LojaRepository();
  const medidorRepository = new MedidorRepository();
  const leituraRepository = new LeituraRepository();
  const alertaRepository = new AlertaRepository();

  return {
    tarifa: new TarifaController(new TarifaService(tarifaRepository, lojaRepository)),
    loja: new LojaController(
      new LojaService(lojaRepository, tarifaRepository, medidorRepository),
    ),
    medidor: new MedidorController(
      new MedidorService(
        medidorRepository,
        lojaRepository,
        leituraRepository,
        alertaRepository,
      ),
    ),
    leitura: new LeituraController(
      new LeituraService(leituraRepository, medidorRepository),
    ),
    alerta: new AlertaController(new AlertaService(alertaRepository, medidorRepository)),
  };
};
