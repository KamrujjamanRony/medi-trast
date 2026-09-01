import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

/**
 * Blocks the guarded /mte12 child routes until the panel has been unlocked, so
 * deep-linking to e.g. /#/mte12/products/new cannot construct the component or
 * fire its data requests. Also refreshes the idle timeout on each navigation.
 *
 * Applied per child route, never as the parent's canActivateChild: the redirect
 * target below is /mte12 itself, so guarding that route would redirect to itself
 * in an infinite loop and hang the browser tab.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  // checkUnlocked, not the cached signal: the idle deadline must be evaluated
  // against the real clock at the moment of navigation.
  if (auth.checkUnlocked()) {
    auth.touch();
    return true;
  }
  return router.createUrlTree(['/mte12']);
};
