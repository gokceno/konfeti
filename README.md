# Konfeti 🎊

Type-safe YAML configuration loader for Node.js, Bun, and Deno with Zod validation and environment variable override support.

## Features

- 🔒 **Type-safe** - Built on top of Zod for runtime validation and TypeScript inference
- 📄 **YAML Support** - Load configuration from YAML files
- 🔄 **Environment Variable Override** - Seamlessly override config values with environment variables
- 🐫 **Case Conversion** - Automatic snake_case to camelCase conversion
- 🚀 **Runtime Agnostic** - Works with Node.js, Bun, and Deno
- 🎯 **Zero Config** - Simple API with sensible defaults

## Installation

```bash
npm install @gokceno/konfeti
```

## Quick Start

Create a configuration schema using Zod and load your YAML config file:

```typescript
import { create as createConfig } from "@gokceno/konfeti";
import type { CamelCaseConfig } from "@gokceno/konfeti/types";
import * as z from "zod";

// Define your configuration schema
const configSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
  }),
  api: z.object({
    base_url: z.string().url(),
    timeout: z.number().default(5000),
  }),
});

// Infer types from schema
export type RawConfig = z.infer<typeof configSchema>;
export type Config = CamelCaseConfig<RawConfig>;

// Create config parser
export const { parse, raw } = createConfig(configSchema);
```

## Usage

### Basic Configuration Loading

Create a `config.yml` file:

```yaml
database:
  host: localhost
  port: 5432
  username: admin
  password: secret

api:
  base_url: https://api.example.com
  timeout: 3000
```

Load and use the configuration:

```typescript
import { parse } from "./config";

// Load with camelCase conversion
const config = parse("config.yml");

console.log(config.database.host); // "localhost"
console.log(config.api.baseUrl);   // "https://api.example.com" (snake_case → camelCase)
console.log(config.api.timeout);   // 3000
```

### Raw Configuration (No Case Conversion)

If you prefer to keep the original key casing:

```typescript
import { raw } from "./config";

const config = raw("config.yml");

console.log(config.api.base_url); // "https://api.example.com" (original snake_case)
```

## Environment Variable Override

Konfeti automatically maps environment variables to configuration values, allowing you to override config file settings without modifying the YAML file.

### Naming Convention

Environment variables map to config paths using this pattern:

- Use double underscores (`__`) to denote nested properties
- Convert to lowercase to match YAML keys
- Example: `DATABASE__HOST` → `database.host`

### Example

Given this `config.yml`:

```yaml
database:
  host: localhost
  port: 5432

api:
  base_url: https://staging.example.com
  api_key: dev-key-123
```

Override values with environment variables:

```bash
# Override database host
export DATABASE__HOST=prod.database.com

# Override database port
export DATABASE__PORT=3306

# Override API settings
export API__BASE_URL=https://api.production.com
export API__API_KEY=prod-key-xyz
```

```typescript
import { parse } from "./config";

const config = parse("config.yml");

// Environment variables take precedence
console.log(config.database.host);  // "prod.database.com" (from env)
console.log(config.database.port);  // 3306 (from env)
console.log(config.api.baseUrl);    // "https://api.production.com" (from env)
console.log(config.api.apiKey);     // "prod-key-xyz" (from env)
```

### Using `.env` Files

Konfeti automatically loads `.env` files via `dotenv`:

Create a `.env` file:

```env
DATABASE__HOST=prod.database.com
DATABASE__PORT=3306
API__BASE_URL=https://api.production.com
API__API_KEY=prod-key-xyz
```

The values will be automatically applied when you load your config.

## API Reference

### `create(schema)`

Creates a configuration loader with the specified Zod schema.

**Parameters:**
- `schema`: A Zod schema object defining the structure and validation rules for your configuration

**Returns:**
An object with two methods:
- `parse(filename)`: Loads config with snake_case to camelCase conversion
- `raw(filename)`: Loads config preserving original key casing

**Example:**

```typescript
import * as z from "zod";
import { create as createConfig } from "@gokceno/konfeti";

const schema = z.object({
  app_name: z.string(),
  version: z.string(),
});

const { parse, raw } = createConfig(schema);
```

### `parse(filename)`

Loads and validates a YAML configuration file with automatic snake_case to camelCase conversion.

**Parameters:**
- `filename`: Path to the YAML configuration file

**Returns:**
Validated configuration object with camelCase keys

**Throws:**
- Error if file doesn't exist
- Error if YAML is invalid
- Error if configuration doesn't match schema

**Example:**

```typescript
const config = parse("config.yml");
// snake_case keys are converted to camelCase
console.log(config.apiKey); // from api_key in YAML
```

### `raw(filename)`

Loads and validates a YAML configuration file preserving original key casing.

**Parameters:**
- `filename`: Path to the YAML configuration file

**Returns:**
Validated configuration object with original key casing

**Example:**

```typescript
const config = raw("config.yml");
// Original casing preserved
console.log(config.api_key); // original snake_case
```

### Type Utilities

#### `CamelCaseConfig<T>`

Type utility that converts object keys from snake_case to camelCase.

**Example:**

```typescript
import type { CamelCaseConfig } from "@gokceno/konfeti/types";

type RawConfig = {
  api_key: string;
  base_url: string;
  max_retries: number;
};

type Config = CamelCaseConfig<RawConfig>;
// Resulting type:
// {
//   apiKey: string;
//   baseUrl: string;
//   maxRetries: number;
// }
```

## Advanced Examples

### Multiple Environment Configurations

```typescript
import { create as createConfig } from "@gokceno/konfeti";
import * as z from "zod";

const configSchema = z.object({
  environment: z.enum(["development", "staging", "production"]),
  database: z.object({
    host: z.string(),
    port: z.number(),
  }),
});

const { parse } = createConfig(configSchema);

// Load different configs based on NODE_ENV
const env = process.env.NODE_ENV || "development";
const config = parse(`config.${env}.yml`);
```

### Complex Nested Configurations

```typescript
const configSchema = z.object({
  server: z.object({
    host: z.string(),
    port: z.number(),
    ssl: z.object({
      enabled: z.boolean(),
      cert_path: z.string().optional(),
      key_path: z.string().optional(),
    }),
  }),
  features: z.object({
    rate_limiting: z.object({
      enabled: z.boolean(),
      max_requests: z.number(),
      window_ms: z.number(),
    }),
  }),
});

const { parse } = createConfig(configSchema);
const config = parse("config.yml");

// Access nested values with camelCase
console.log(config.server.ssl.certPath);
console.log(config.features.rateLimiting.maxRequests);
```

### With Default Values

```typescript
const configSchema = z.object({
  api: z.object({
    timeout: z.number().default(5000),
    retry_attempts: z.number().default(3),
    base_url: z.string(),
  }),
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    pretty_print: z.boolean().default(false),
  }),
});

const { parse } = createConfig(configSchema);
const config = parse("config.yml");

// Missing values in YAML will use schema defaults
console.log(config.api.timeout); // 5000 if not specified in YAML
```

## Error Handling

Konfeti throws descriptive errors for common issues:

```typescript
try {
  const config = parse("config.yml");
} catch (error) {
  if (error.message.includes("Config file not found")) {
    console.error("Configuration file missing!");
  } else if (error.message.includes("Invalid config")) {
    console.error("Configuration validation failed:", error.message);
  }
}
```

## License

MIT

## Repository

[https://github.com/gokceno/konfeti](https://github.com/gokceno/konfeti)
