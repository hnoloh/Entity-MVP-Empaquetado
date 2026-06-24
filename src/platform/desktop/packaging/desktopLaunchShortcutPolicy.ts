export interface DesktopLaunchShortcutPolicy {
  createsDesktopShortcut: boolean;
  createsStartMenuShortcut: boolean;
  execName: string;
}

export const validateLaunchShortcutPolicy = (policy: DesktopLaunchShortcutPolicy): boolean => {
  return policy.execName.length > 0 && (policy.createsDesktopShortcut || policy.createsStartMenuShortcut);
};
