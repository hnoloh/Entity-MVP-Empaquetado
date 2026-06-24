export interface DesktopAppIconPolicy {
  hasOfficialIcon: boolean;
  iconPaths: {
    png32?: string;
    png128?: string;
    png256?: string;
    png512?: string;
    ico?: string;
    icns?: string;
  };
  sourceImage: string;
}

export const validateAppIconPolicy = (policy: DesktopAppIconPolicy): boolean => {
  if (!policy.hasOfficialIcon) return false;
  return Object.values(policy.iconPaths).some(path => path !== undefined && path.length > 0);
};
