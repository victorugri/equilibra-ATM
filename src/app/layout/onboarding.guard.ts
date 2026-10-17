import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { ProfileStore } from '../core/data/profile.service';

/** No primeiro acesso, leva para a entrada no app (privacidade e boas-vindas). */
export const onboardingGuard: CanActivateChildFn = async () => {
  const profile = inject(ProfileStore);
  const router = inject(Router);
  await profile.ready;
  return profile.onboardingDone() || router.parseUrl('/boas-vindas');
};
