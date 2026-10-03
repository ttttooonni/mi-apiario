import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routerBasepath } from "@/lib/asset";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const basepath = routerBasepath();
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    ...(basepath ? { basepath } : {}),
  });
}
