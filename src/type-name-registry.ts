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
   * Get all registered pointers and their names
   */
  getAll(): Map<string, string>;
}

type CreateTypeNameRegistry = () => TypeNameRegistry;
type GetUniqueTypeName = (baseName: string) => string;

export const createTypeNameRegistry: CreateTypeNameRegistry = () => {
  const jsonPointerToTypeNameMap = new Map<string, string>();
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
      if (jsonPointerToTypeNameMap.has(pointer)) {
        return jsonPointerToTypeNameMap.get(pointer)!;
      }

      const uniqueName = getUniqueTypeName(name);
      jsonPointerToTypeNameMap.set(pointer, uniqueName);
      return uniqueName;
    },

    get(pointer) {
      return jsonPointerToTypeNameMap.get(pointer);
    },

    getAll() {
      return jsonPointerToTypeNameMap;
    },
  };
};
