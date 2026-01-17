import "dotenv/config";
import fs from "node:fs";
import YAML from "yaml";
import * as z from "zod";
import { setProperty, hasProperty } from "dot-prop";
import type { KeysToCamelCase } from "./types.ts";

const open = (filename: string): string => {
  if (!filename) {
    throw new Error("File name not specified");
  }
  if (!fs.existsSync(filename)) {
    throw new Error("Config file not found");
  }
  return fs.readFileSync(filename, "utf8");
};

const coerceValue = (value: string): string | number | boolean => {
  // Try to parse as boolean
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "") return num;

  // Return as string
  return value;
};

const ensureNestedObject = (obj: any, path: string): void => {
  const parts = path.split(".");
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (
      !current[part] ||
      typeof current[part] !== "object" ||
      Array.isArray(current[part])
    ) {
      current[part] = {};
    }
    current = current[part];
  }
};

const map = (config: object, startsWith: string = ""): object => {
  if (!process.env) {
    throw new Error("Cannot access environment variables.");
  }
  // TODO: Would not replace if source value is not all lower case letters.
  const result = JSON.parse(JSON.stringify(config)); // Deep clone to avoid mutation
  Object.entries(process.env)
    .filter(([key, value]) => key.startsWith(startsWith) && value !== undefined)
    .forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      // Convert camelCase segments to snake_case for matching YAML structure
      const path = lowerKey
        .replaceAll("__", ".")
        .split(".")
        .map((segment) =>
          segment.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase(),
        )
        .join(".");
      // Ensure nested objects exist before setting the property
      ensureNestedObject(result, path);
      setProperty(result, path, coerceValue(value!));
    });
  return result;
};

const raw = <
  T extends {
    safeParse: (data: any) => { success: boolean; data?: any; error?: any };
  },
>(
  filename: string,
  schema: T,
): T extends z.ZodType<infer U, any, any> ? U : any => {
  const file = open(filename);
  const config: object = YAML.parse(file);
  const mappedConfig: object = map(config);
  const validatedConfig = schema.safeParse(mappedConfig);
  if (!validatedConfig.success) {
    throw new Error(`Invalid config: ${validatedConfig.error}`);
  }
  return validatedConfig.data as T extends z.ZodType<infer U, any, any>
    ? U
    : any;
};

const parse = <
  T extends {
    safeParse: (data: any) => { success: boolean; data?: any; error?: any };
  },
>(
  filename: string,
  schema: T,
): KeysToCamelCase<T extends z.ZodType<infer U, any, any> ? U : any> => {
  const file = open(filename);
  const snakeToCamelCase = (str: string): string =>
    str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

  const convertKeysToCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map((item) => convertKeysToCamelCase(item));
    }
    if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          snakeToCamelCase(key),
          convertKeysToCamelCase(value),
        ]),
      );
    }
    return obj;
  };

  const config: object = YAML.parse(file);
  const mappedConfig: object = map(config);
  const validatedConfig = schema.safeParse(mappedConfig);
  if (!validatedConfig.success) {
    throw new Error(`Invalid config: ${validatedConfig.error}`);
  }
  return convertKeysToCamelCase(validatedConfig.data) as KeysToCamelCase<
    T extends z.ZodType<infer U, any, any> ? U : any
  >;
};

const create = <
  T extends {
    safeParse: (data: any) => { success: boolean; data?: any; error?: any };
  },
>(
  configSchema: T,
) => {
  return {
    parse: (
      filename: string,
    ): KeysToCamelCase<T extends z.ZodType<infer U, any, any> ? U : any> =>
      parse(filename, configSchema),
    raw: (filename: string): T extends z.ZodType<infer U, any, any> ? U : any =>
      raw(filename, configSchema),
  };
};

export { create };
