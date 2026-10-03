import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { importBackup } from "./backup";
import { commitAction, commitHealth, commitHealthMany, removeAction, removeHealth } from "./commands";
import {
  deleteApiaryCascade,
  deleteColonyCascade,
  deleteRecord,
  getPersistStatus,
  loadState,
  putRecord,
  replaceAll,
} from "./idb";
import { loadSampleData } from "./sample";
import { EMPTY_STATE, type AppState, type Colony, type HealthRecord, type Queen, type YearClose } from "./types";

export const APP_QUERY_KEY = ["app"] as const;

export function useAppState() {
  return useQuery({
    queryKey: APP_QUERY_KEY,
    queryFn: loadState,
    staleTime: Infinity,
    retry: false,
    placeholderData: EMPTY_STATE,
  });
}

/** Always returns a notebook, even while storage is still opening. */
export function useNotebook() {
  const query = useAppState();
  return {
    data: query.data ?? EMPTY_STATE,
    error: query.error,
    isFetching: query.isFetching,
  };
}

function reportPersist(): void {
  const status = getPersistStatus();
  if (status.failed) {
    toast.error("No se pudo guardar en este dispositivo. Descarga una copia JSON.");
    return;
  }
  if (status.nearLimit) {
    toast.message("El cuaderno está llenando el espacio del navegador. Descarga una copia.");
  }
}

function useInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: APP_QUERY_KEY });
    reportPersist();
  };
}

export function useAppMutations() {
  const invalidate = useInvalidate();

  const saveApiary = useMutation({
    mutationFn: (row: AppState["apiaries"][number]) => putRecord("apiaries", row),
    onSuccess: invalidate,
  });

  const saveColony = useMutation({
    mutationFn: (row: Colony) => putRecord("colonies", row),
    onSuccess: invalidate,
  });

  const saveQueen = useMutation({
    mutationFn: (row: Queen) => putRecord("queens", row),
    onSuccess: invalidate,
  });

  const saveAction = useMutation({
    mutationFn: (row: AppState["actions"][number]) => commitAction(row),
    onSuccess: invalidate,
  });

  const saveProduction = useMutation({
    mutationFn: (row: AppState["production"][number]) => putRecord("production", row),
    onSuccess: invalidate,
  });

  const saveYearClose = useMutation({
    mutationFn: (row: YearClose) => putRecord("yearCloses", row),
    onSuccess: invalidate,
  });

  const saveHealth = useMutation({
    mutationFn: (row: HealthRecord) => commitHealth(row),
    onSuccess: invalidate,
  });

  const saveHealthMany = useMutation({
    mutationFn: (rows: HealthRecord[]) => commitHealthMany(rows),
    onSuccess: invalidate,
  });

  const removeHealthRecord = useMutation({
    mutationFn: (id: string) => removeHealth(id),
    onSuccess: invalidate,
  });

  const removeApiary = useMutation({
    mutationFn: async (id: string) => {
      const current = await loadState();
      await deleteApiaryCascade(current, id);
    },
    onSuccess: invalidate,
  });

  const removeColony = useMutation({
    mutationFn: async (id: string) => {
      const current = await loadState();
      await deleteColonyCascade(current, id);
    },
    onSuccess: invalidate,
  });

  const removeProduction = useMutation({
    mutationFn: (id: string) => deleteRecord("production", id),
    onSuccess: invalidate,
  });

  const removeActionRecord = useMutation({
    mutationFn: (id: string) => removeAction(id),
    onSuccess: invalidate,
  });

  const loadSample = useMutation({
    mutationFn: loadSampleData,
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: importBackup,
    onSuccess: invalidate,
  });

  const resetAll = useMutation({
    mutationFn: () => replaceAll(EMPTY_STATE),
    onSuccess: invalidate,
  });

  return {
    saveApiary,
    saveColony,
    saveQueen,
    saveAction,
    saveProduction,
    saveYearClose,
    saveHealth,
    saveHealthMany,
    removeHealthRecord,
    removeApiary,
    removeColony,
    removeProduction,
    removeAction: removeActionRecord,
    loadSample,
    restore,
    resetAll,
  };
}
