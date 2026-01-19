export interface TypeNameRegistry {
  /**
   * Register a type name for a specific JSON pointer
   */
  register(pointer: string, name: string): string;

  /**
   * Get the registered type name for a pointer
   */
  get(pointer: string): string | undefined;

  /**
   * Get the original base name requested for a pointer
   */
  getBaseName(pointer: string): string | undefined;

  /**
   * Get all registered pointers and their names
   */
  getAll(): Map<string, string>;

  /**
   * Remove a registration (used for cleanup/optimization)
   */
  delete(pointer: string): void;
}

type CreateTypeNameRegistry = () => TypeNameRegistry;
type GetUniqueTypeName = (baseName: string) => string;

interface RegistryEntry {
  name: string;
  baseName: string;
}

export const createTypeNameRegistry: CreateTypeNameRegistry = () => {
  const jsonPointerToEntryMap = new Map<string, RegistryEntry>();
  const typeNameCount = new Map<string, number>();

  const getUniqueTypeName: GetUniqueTypeName = (baseName) => {
    const count = typeNameCount.get(baseName) || 0;
    typeNameCount.set(baseName, count + 1);

    if (count === 0) {
      return baseName;
    }

    return `${baseName}_${count}`;
  };

  return {
    register(pointer, name) {
      if (jsonPointerToEntryMap.has(pointer)) {
        return jsonPointerToEntryMap.get(pointer)!.name;
      }

      const uniqueName = getUniqueTypeName(name);
      jsonPointerToEntryMap.set(pointer, { name: uniqueName, baseName: name });
      return uniqueName;
    },

    get(pointer) {
      return jsonPointerToEntryMap.get(pointer)?.name;
    },

    getBaseName(pointer) {
      return jsonPointerToEntryMap.get(pointer)?.baseName;
    },

    getAll() {
      // Convert internal map to Map<pointer, name> for compatibility
      const result = new Map<string, string>();
      for (const [pointer, entry] of jsonPointerToEntryMap) {
        result.set(pointer, entry.name);
      }
      return result;
    },

    delete(pointer) {
      jsonPointerToEntryMap.delete(pointer);
    }
  };
};
