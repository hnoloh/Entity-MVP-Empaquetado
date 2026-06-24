import type { LocalStarterModelDescriptor } from './localStarterModelDescriptor';

export interface StarterModelIntegrityPolicy {
  validate(descriptor: LocalStarterModelDescriptor, sizeOnDisk: number): boolean;
}

export const createSizeIntegrityPolicy = (toleranceBytes: number = 5000000): StarterModelIntegrityPolicy => {
  return {
    validate: (descriptor, sizeOnDisk) => {
      // Validate that the size on disk is within tolerance of the expected size.
      // This protects against corrupt downloads.
      return Math.abs(descriptor.expectedSize - sizeOnDisk) <= toleranceBytes;
    }
  };
};
