import Router from "@koa/router";
import { databaseIsReady } from "./config/database.ts";
import type { TarifaController } from "./controllers/tarifa.controller.ts";
import type { LojaController } from "./controllers/loja.controller.ts";
import type { MedidorController } from "./controllers/medidor.controller.ts";
import type { LeituraController } from "./controllers/leitura.controller.ts";
import type { AlertaController } from "./controllers/alerta.controller.ts";

export interface Controllers {
  tarifa: TarifaController;
  loja: LojaController;
  medidor: MedidorController;
  leitura: LeituraController;
  alerta: AlertaController;
}

export const createRouter = (controllers: Controllers): Router => {
  const router = new Router({ prefix: "/api" });

  router.get("/tarifas", controllers.tarifa.findAll);
  router.post("/tarifas", controllers.tarifa.create);
  router.get("/tarifas/:id", controllers.tarifa.findById);
  router.put("/tarifas/:id", controllers.tarifa.update);
  router.delete("/tarifas/:id", controllers.tarifa.delete);

  router.get("/lojas", controllers.loja.findAll);
  router.post("/lojas", controllers.loja.create);
  router.get("/lojas/:id", controllers.loja.findById);
  router.put("/lojas/:id", controllers.loja.update);
  router.delete("/lojas/:id", controllers.loja.delete);

  router.get("/medidores", controllers.medidor.findAll);
  router.post("/medidores", controllers.medidor.create);
  router.get("/medidores/loja/:lojaId", controllers.medidor.findByLojaId);
  router.get("/medidores/:id", controllers.medidor.findById);
  router.put("/medidores/:id", controllers.medidor.update);
  router.delete("/medidores/:id", controllers.medidor.delete);

  router.get("/leituras", controllers.leitura.findAll);
  router.post("/leituras", controllers.leitura.create);
  router.get("/leituras/medidor/:medidorId", controllers.leitura.findByMedidorId);
  router.get("/leituras/:id", controllers.leitura.findById);
  router.put("/leituras/:id", controllers.leitura.update);
  router.delete("/leituras/:id", controllers.leitura.delete);

  router.get("/alertas", controllers.alerta.findAll);
  router.post("/alertas", controllers.alerta.create);
  router.get("/alertas/nao-resolvidos", controllers.alerta.findNaoResolvidos);
  router.get("/alertas/medidor/:medidorId", controllers.alerta.findByMedidorId);
  router.patch("/alertas/:id/resolver", controllers.alerta.resolve);
  router.get("/alertas/:id", controllers.alerta.findById);
  router.put("/alertas/:id", controllers.alerta.update);
  router.delete("/alertas/:id", controllers.alerta.delete);

  return router;
};

export const createHealthRouter = (): Router => {
  const router = new Router();
  router.get("/health", (context) => {
    const connected = databaseIsReady();
    context.status = connected ? 200 : 503;
    context.body = { status: connected ? "UP" : "DOWN", mongodb: connected ? "UP" : "DOWN" };
  });
  return router;
};
