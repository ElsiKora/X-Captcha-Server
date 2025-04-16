<p align="center">
  <!-- You can update the logo URL when available -->
  <img src="https://via.placeholder.com/500x150.png?text=NestJS-CRUD-Config" width="500" alt="project-logo">
</p>

<h1 align="center">🚀 NestJS CRUD Config</h1>
<p align="center"><em>Database-backed configuration management for NestJS applications with full CRUD capabilities</em></p>

<p align="center">
    <a aria-label="ElsiKora logo" href="https://elsikora.com">
  <img src="https://img.shields.io/badge/MADE%20BY%20ElsiKora-333333.svg?style=for-the-badge" alt="ElsiKora">
</a> <img src="https://img.shields.io/badge/npm-blue.svg?style=for-the-badge&logo=npm&logoColor=white" alt="npm"> <img src="https://img.shields.io/badge/version-green.svg?style=for-the-badge&logo=npm&logoColor=white" alt="version"> <img src="https://img.shields.io/badge/license-yellow.svg?style=for-the-badge&logo=license&logoColor=white" alt="license"> <img src="https://img.shields.io/badge/typescript-blue.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript"> <img src="https://img.shields.io/badge/nestjs-red.svg?style=for-the-badge&logo=nestjs&logoColor=white" alt="nestjs"> <img src="https://img.shields.io/badge/database-orange.svg?style=for-the-badge&logo=database&logoColor=white" alt="database">
</p>


## 📚 Table of Contents
- [Description](#-description)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [FAQ](#-faq)
- [License](#-license)


## 📖 Description
NestJS CRUD Config is a powerful configuration management module for NestJS applications that uses a database for storage. It provides a clean, type-safe interface for creating, reading, updating, and deleting configuration values, enabling centralized configuration management across multiple services and environments. This library is particularly valuable for microservice architectures or any system where configuration management needs to be secure, scalable, and maintainable. With built-in support for hierarchical configuration paths, environment separation, optional encryption, and full CRUD operations, it offers a complete solution for managing application configurations.

## 🚀 Features
- ✨ **🔒 Secure storage of configuration in a database**
- ✨ **🌐 Hierarchical organization of parameters by application and environment**
- ✨ **✅ Full CRUD operations for configuration management**
- ✨ **🧩 Seamless integration with NestJS dependency injection system**
- ✨ **⚡ Supports both synchronous and asynchronous module initialization**
- ✨ **🔐 Optional encryption for sensitive configuration values**
- ✨ **📁 Structured path-based configuration access**
- ✨ **🔄 Comprehensive TypeScript support with interfaces**
- ✨ **📊 Verbose mode for debugging**
- ✨ **💾 Works with any database supported by TypeORM**
- ✨ **📚 Organized configuration with sections and data**
- ✨ **🎛️ Highly customizable entity options (table names, field lengths, etc.)**

## 🛠 Installation
```bash
# Using npm
npm install @elsikora/nestjs-crud-config

# Using yarn
yarn add @elsikora/nestjs-crud-config

# Using pnpm
pnpm add @elsikora/nestjs-crud-config
```

This package has peer dependencies on `@nestjs/common`, `@nestjs/typeorm`, and `typeorm`, so make sure they are installed in your project:

```bash
npm install @nestjs/common @nestjs/typeorm typeorm
```

## 💡 Usage
### Basic Setup

First, set up your TypeORM module with your database connection and include the `ConfigEntity` in your entity list:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudConfigModule } from '@elsikora/nestjs-crud-config';
import { YourAppEntity } from './entities/your-app.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'app.db',
      entities: [YourAppEntity], // Your app entities - Config entities are registered by the CrudConfigModule
      synchronize: true,
    }),
    CrudConfigModule.register({
      application: 'my-app',
      environment: 'development',
      isVerbose: true,
      // Optional entity customization
      entityOptions: {
        tablePrefix: 'app_', // Adds prefix to table names
        configData: {
          maxValueLength: 16384, // Increase max value length
          tableName: 'configuration_data' // Custom table name
        },
        configSection: {
          maxNameLength: 256 // Customize field length
        }
      }
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Using the Config Service

Once the module is registered, you can inject the `CrudConfigService` in your services or controllers to access and manage configuration values:

```typescript
// my.service.ts
import { Injectable } from '@nestjs/common';
import { CrudConfigService } from '@elsikora/nestjs-crud-config';

@Injectable()
export class MyService {
  constructor(private readonly configService: CrudConfigService) {}

  async configureApp() {
    // Get a config value by path
    const apiKey = await this.configService.get('/my-app/development/api/key');
    
    // Or use structured approach
    const dbUrl = await this.configService.get({
      application: 'my-app',
      environment: 'development',
      path: ['database', 'url'],
    });
    
    // Set a new config value
    await this.configService.set(
      '/my-app/development/api/timeout',
      '30000',
      'API request timeout in milliseconds'
    );
    
    // Set using structured path
    await this.configService.set(
      {
        application: 'my-app',
        environment: 'development',
        path: ['email', 'sender'],
      },
      'noreply@example.com',
      'Default email sender address'
    );
    
    // Delete a config
    await this.configService.delete('/my-app/development/api/deprecated-setting');
    
    // List all configs for an application
    const appConfigs = await this.configService.list({ application: 'my-app' });
    
    // Use the configurations
    // ...
  }
}
```

### Async Module Registration

You can also register the module asynchronously, which is useful when you need to load configuration data from other sources:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudConfigModule, ConfigEntity } from '@elsikora/nestjs-crud-config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YourAppEntity } from './entities/your-app.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get('DB_TYPE'),
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        entities: [YourAppEntity], // Only include your application entities
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    CrudConfigModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        application: configService.get('APP_NAME'),
        environment: configService.get('NODE_ENV'),
        isVerbose: configService.get('DEBUG') === 'true',
        shouldEncryptValues: configService.get('ENCRYPT_CONFIG') === 'true',
        encryptionKey: configService.get('ENCRYPTION_KEY'),
        entityOptions: {
          tablePrefix: configService.get('CONFIG_TABLE_PREFIX') || '',
        },
      }),
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Using Environment Variables

The config service can automatically detect application and environment from environment variables:

```typescript
// Set these environment variables in your deployment
// APPLICATION=my-app
// ENVIRONMENT=production

// In your code, you can omit application and environment
const logoUrl = await this.configService.get({
  // application and environment will be auto-detected
  path: ['ui', 'logo', 'url'],
});
```

## ⚙️ Configuration

The `CrudConfigModule` accepts the following configuration options:

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| application | string | Default application name for config paths | No |
| environment | string | Default environment for config paths | No |
| isVerbose | boolean | Enable verbose logging | No |
| shouldEncryptValues | boolean | Whether to encrypt sensitive values | No |
| encryptionKey | string | Key for encryption/decryption (required if encryption is enabled) | No |
| entityOptions | object | Customization options for entities | No |
| entityOptions.tablePrefix | string | Prefix to add to all table names | No |
| entityOptions.configData | object | Options for ConfigData entity | No |
| entityOptions.configData.maxValueLength | number | Maximum length for value field (default: 8192) | No |
| entityOptions.configData.maxNameLength | number | Maximum length for name field (default: 128) | No |
| entityOptions.configData.maxEnvironmentLength | number | Maximum length for environment field (default: 64) | No |
| entityOptions.configData.maxDescriptionLength | number | Maximum length for description field (default: 512) | No |
| entityOptions.configData.tableName | string | Custom table name for ConfigData (default: "config_data") | No |
| entityOptions.configSection | object | Options for ConfigSection entity | No |
| entityOptions.configSection.maxNameLength | number | Maximum length for name field (default: 128) | No |
| entityOptions.configSection.maxDescriptionLength | number | Maximum length for description field (default: 512) | No |
| entityOptions.configSection.tableName | string | Custom table name for ConfigSection (default: "config_section") | No |

**Note:** The module reuses the database connection from the parent application but registers its own entities. You don't need to include the config entities in your TypeORM configuration.

**Important Note about Table Names:** The `tableName` customization in `entityOptions` only applies at application startup due to how TypeORM processes entity decorators. For scenarios requiring fully dynamic table names, you'll need to use TypeORM's `EntitySchema` approach instead.

## 📘 API Reference

### Core API (Two Approaches)

The module provides two ways to manage configuration:

1. **Section/Data API (Recommended)**: Organize configuration in logical sections with key-value pairs
2. **Legacy Path-based API**: Use hierarchical paths (still supported for backward compatibility)

### 1. Section/Data API (Recommended)

#### ConfigSectionService

Manages configuration sections.

- `create(data: any): Promise<ConfigSection>` - Create a new configuration section
- `findOne(options: any): Promise<ConfigSection>` - Find a section by criteria
- `findAll(options?: any): Promise<ConfigSection[]>` - List all sections
- `update(id: string, data: any): Promise<ConfigSection>` - Update a section
- `delete(id: string): Promise<void>` - Delete a section

#### ConfigDataService

Manages configuration data within sections.

- `create(data: any): Promise<ConfigData>` - Create a new configuration data entry
- `findOne(options: any): Promise<ConfigData>` - Find data by criteria
- `findAll(options?: any): Promise<ConfigData[]>` - List all data matching criteria
- `update(id: string, data: any): Promise<ConfigData>` - Update a data entry
- `delete(id: string): Promise<void>` - Delete a data entry

### 2. Legacy Path-based API

#### CrudConfigService

Compatible with previous versions, using paths to manage configuration.

#### `get(properties: IConfigGetProperties | string): Promise<string | null>`
Retrieves a configuration value by path or properties.

#### `set(path: string | IConfigGetProperties, value: string, description?: string): Promise<ILegacyConfigData>`
Sets a configuration value.

#### `delete(path: string | IConfigGetProperties): Promise<boolean>`
Deletes a configuration by path.

#### `list(filter: Partial<IConfigGetProperties> = {}): Promise<Array<ILegacyConfigData>>`
Lists configurations with optional filtering.

### Entity Structure

The module includes the following entities:

#### ConfigSection
Use sections to group related configuration values. Each section has:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (UUID) |
| name | string | Name of the section |
| description | string \| null | Optional description |
| createdAt | Date | When the section was created |
| updatedAt | Date | When the section was last updated |

#### ConfigData
Actual configuration values that belong to sections:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (UUID) |
| name | string | Name of the configuration |
| value | string | The configuration value |
| description | string \| null | Optional description about this configuration |
| isEncrypted | boolean | Whether the value is encrypted |
| environment | string | The environment this applies to |
| sectionId | string | ID of the section this belongs to |
| section | ConfigSection | Relation to parent section |
| createdAt | Date | When the entry was created |
| updatedAt | Date | When the entry was last updated |

Usage:
```typescript
// Get references to the services
@Injectable()
export class MyService {
  constructor(
    private readonly configService: CrudConfigService,
    private readonly sectionService: ConfigSectionService,
    private readonly dataService: ConfigDataService
  ) {}

  async setupConfiguration() {
    // Create a configuration section
    const apiSection = await this.sectionService.create({
      name: 'api-settings',
      description: 'API-related configuration'
    });

    // Add configuration data to the section
    await this.dataService.create({
      name: 'API_KEY',
      value: 'your-api-key',
      description: 'API Key for external service authentication',
      environment: 'development',
      sectionId: apiSection.id,
      isEncrypted: true
    });

    // Later, retrieve the data
    const apiConfigs = await this.dataService.findAll({
      where: { sectionId: apiSection.id }
    });
  }
}
```

### Legacy Path API Format

The legacy path API returns data in this format for backward compatibility:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (UUID) |
| path | string | The full path of the configuration entry |
| value | string | The configuration value |
| description | string \| null | Optional description of the config |
| isEncrypted | boolean | Whether the value is encrypted |
| createdAt | Date | When the entry was created |
| updatedAt | Date | When the entry was last updated |
| environment | string \| null | The environment this config applies to |
| application | string \| null | The application this config belongs to |

Note: Internally, this data is still stored using the Section/Data approach, but converted to the above format for API compatibility.

## ❓ FAQ

### What databases are supported?

Any database supported by TypeORM can be used, including:
- MySQL/MariaDB
- PostgreSQL
- SQLite
- Microsoft SQL Server
- Oracle
- MongoDB
- and more

### How are sensitive configuration values protected?

The module provides optional encryption for sensitive values. When enabled, values are encrypted before storage and decrypted when retrieved. The actual encryption implementation can be customized based on your security requirements.

### Can I migrate from environment variables to this module?

Yes, the module is designed to make this transition easy. You can programmatically set configuration values from your existing environment variables during application startup.

### How does this compare to AWS Parameter Store or other configuration services?

This module provides similar hierarchical configuration capabilities but stores the data in your own database. This gives you more control and flexibility, especially for self-hosted applications or scenarios where cloud services aren't available.

### Can I use this with NestJS microservices?

Yes, the module works well with NestJS microservices. Each service can have its own configuration database, or they can share a central configuration database.

### How can I handle configuration for multiple environments?

The module supports environment-specific configurations through the environment parameter. You can structure your configurations to support different environments (dev, staging, prod) within the same database.

### What happened to the ConfigEntity used in earlier versions?

In version 2.0, we removed the original ConfigEntity in favor of the more structured Section/Data approach. The CrudConfigService still supports the same API for backward compatibility, but it now stores configuration using ConfigSection and ConfigData entities internally. This provides better organization, more powerful querying, and a cleaner architecture, while maintaining compatibility with existing code.

### How do I set up migrations for the config entities?

You can create migrations for the config entities just like any other entity in your application. Here's an example of how to create a migration for both section and data entities:

```typescript
// migrations/1711585678123-CreateConfigTables.ts
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateConfigTables1711585678123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create config_section table
    await queryRunner.createTable(
      new Table({
        name: 'config_section',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'path',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isEncrypted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'environment',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'application',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create index for better query performance
    await queryRunner.createIndex(
      'config',
      new TableIndex({
        name: 'idx_config_app_env',
        columnNames: ['application', 'environment'],
      }),
    );

    // Create config_section table
    await queryRunner.createTable(
      new Table({
        name: 'config_section',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '512',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create config_data table
    await queryRunner.createTable(
      new Table({
        name: 'config_data',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '8192',
            isNullable: false,
          },
          {
            name: 'isEncrypted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'environment',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'sectionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create unique constraint for name + environment
    await queryRunner.createIndex(
      'config_data',
      new TableIndex({
        name: 'idx_config_data_name_env',
        columnNames: ['name', 'environment'],
        isUnique: true,
      }),
    );

    // Create foreign key to section
    await queryRunner.createForeignKey(
      'config_data',
      new TableForeignKey({
        name: 'fk_config_data_section',
        columnNames: ['sectionId'],
        referencedTableName: 'config_section',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order
    await queryRunner.dropForeignKey('config_data', 'fk_config_data_section');
    await queryRunner.dropIndex('config_data', 'idx_config_data_name_env');
    await queryRunner.dropTable('config_data');
    await queryRunner.dropTable('config_section');
  }
}

## 🔒 License

This project is licensed under the MIT License

Copyright (c) 2025 ElsiKora

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
