import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { PrescriptionStore } from './prescription.service';

/** Telas de exercício só com prescrição ativa; sem ela, volta ao convite em /exercicios. */
export const prescriptionGuard: CanMatchFn = async () => {
  const store = inject(PrescriptionStore);
  const router = inject(Router);
  await store.ready;
  return store.active() || router.parseUrl('/exercicios');
};
