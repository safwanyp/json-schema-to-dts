export interface SchemaRegistry {
  /**
   * Register a type name for a specific JSON pointer
   */
  register(pointer: string, name: string): string;

  /**
   * Get the registered type name for a pointer
   */
  get(pointer: string): string | undefined;

  /**
   * Get all registered pointers and their names
   */
  getAll(): Map<string, string>;
}

type CreateSchemaRegistry = () => SchemaRegistry;
type GetUniqueName = (baseName: string) => string;

export const createSchemaRegistry: CreateSchemaRegistry = () => {
  const pointerToNameMap = new Map<string, string>();
  const nameCount = new Map<string, number>();

  const getUniqueName: GetUniqueName = (baseName) => {
    const count = nameCount.get(baseName) || 0;
    nameCount.set(baseName, count + 1);

    if (count === 0) {
      return baseName;
    }

    return `${baseName}_${count}`;
  }

  return {
    register(pointer, name) {
      if (pointerToNameMap.has(pointer)) {
        return pointerToNameMap.get(pointer)!;
      }

      const uniqueName = getUniqueName(name);
      pointerToNameMap.set(pointer, uniqueName);
      return uniqueName;
    },

    get(pointer) {
      return pointerToNameMap.get(pointer);
    },

    getAll() {
      return pointerToNameMap;
    }
  };
}
