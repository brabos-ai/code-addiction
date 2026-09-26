### Install Shadcn/ui Aspect Ratio Component

Source: https://ui.shadcn.com/docs/components/aspect-ratio

These commands detail how to install the `AspectRatio` component. The first method uses the `shadcn/ui` CLI for a quick setup, while the second shows the manual installation of the underlying Radix UI dependency.

```bash
npx shadcn@latest add aspect-ratio
```

```bash
npm install @radix-ui/react-aspect-ratio
```

--------------------------------

### Quick Registry Configuration Setup

Source: https://ui.shadcn.com/docs/registry/namespace

Minimal configuration example for setting up two namespaced registries (v0 and acme) in components.json. This provides a foundation for multi-source resource installation.

```json
{
  "registries": {
    "@v0": "https://v0.dev/chat/b/{name}",
    "@acme": "https://registry.acme.com/resources/{name}.json"
  }
}
```

--------------------------------

### Serve shadcn Registry with Next.js Development Server

Source: https://ui.shadcn.com/docs/registry/getting-started

This command starts the Next.js development server, which will serve your shadcn registry files if your project is configured with Next.js. The registry items will be accessible via specific URLs under `/r/` after the build process.

```bash
npm run dev
```

--------------------------------

### Install shadcn CLI via npm

Source: https://ui.shadcn.com/docs/registry/getting-started

This command installs the latest version of the shadcn command-line interface (CLI) globally or as a dev dependency in your project. The CLI is essential for building and managing shadcn component registries and components.

```bash
npm install shadcn@latest
```

--------------------------------

### Create New Laravel Project with React

Source: https://ui.shadcn.com/docs/installation/laravel

Initialize a new Laravel project with Inertia and React using the Laravel installer. This command creates a fresh Laravel application with React pre-configured for use with Inertia.js.

```bash
laravel new my-app --react
```

--------------------------------

### Create TanStack Start project with shadcn/ui using npm

Source: https://ui.shadcn.com/docs/installation/tanstack

This command initializes a new TanStack Start project. It automatically configures Tailwind CSS and integrates shadcn/ui as an add-on, streamlining the initial setup process.

```bash
npm create @tanstack/start@latest --tailwind --add-ons shadcn
```

--------------------------------

### Install Input OTP Dependency with npm (Bash)

Source: https://ui.shadcn.com/docs/components/input-otp

Instructs on how to manually install the core `input-otp` dependency using npm. This is a prerequisite for manual setup before copying the component source code into your project.

```bash
npm install input-otp
```

--------------------------------

### Add all shadcn/ui components using npx

Source: https://ui.shadcn.com/docs/installation/tanstack

This command provides a convenient way to install all available shadcn/ui components into your project. It's useful for quickly setting up a comprehensive UI library without adding each component individually.

```bash
npx shadcn@latest add --all
```

--------------------------------

### Install Menubar Component via CLI - Bash

Source: https://ui.shadcn.com/docs/components/menubar

Uses the shadcn CLI tool to automatically install the Menubar component and its dependencies into your project. This is the quickest installation method and handles all necessary setup.

```bash
npx shadcn@latest add menubar
```

--------------------------------

### Install shadcn components from various sources

Source: https://ui.shadcn.com/docs/registry/namespace

Demonstrates how to install shadcn components using the 'add' command. This includes installing from a specific registry, installing multiple resources, installing directly from a URL, and installing from a local file path.

```bash
npx shadcn@latest add @v0/dashboard
```

```bash
npx shadcn@latest add @acme/button @lib/utils @ai/prompt
```

```bash
npx shadcn@latest add https://registry.example.com/button.json
```

```bash
npx shadcn@latest add ./local-registry/button.json
```

--------------------------------

### Define Universal Registry Item for Multi-File Template (shadcn/ui)

Source: https://ui.shadcn.com/docs/registry/examples

This JSON configuration defines a shadcn/ui registry item named 'my-custom-start-template' that installs multiple files. It includes two files, each with an explicit target path, demonstrating how to create a universal starter template that can be installed without framework detection or components.json.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "my-custom-start-template",
  "type": "registry:item",
  "dependencies": ["better-auth"],
  "files": [
    {
      "path": "/path/to/file-01.json",
      "type": "registry:file",
      "target": "~/file-01.json",
      "content": "..."
    },
    {
      "path": "/path/to/file-02.vue",
      "type": "registry:file",
      "target": "~/pages/file-02.vue",
      "content": "..."
    }
  ]
}
```

--------------------------------

### Install Form Component via Shadcn CLI

Source: https://ui.shadcn.com/docs/components/form

This command provides the recommended method for installing the Shadcn UI form component using its command-line interface. Executing this command automates the addition of the form component and its dependencies to your project, simplifying the setup process.

```bash
npx shadcn@latest add form
```

--------------------------------

### Example Interactive Prompts for `shadcn@latest init` Command

Source: https://ui.shadcn.com/docs/changelog

This text snippet illustrates the questions asked when running the `npx shadcn@latest init` command, guiding the user through configuring their `components.json` file. It covers choices for styling, color, CSS location, CSS variables, Tailwind config, import aliases, and React Server Components.

```txt
Which style would you like to use? › Default
Which color would you like to use as base color? › Slate
Where is your global CSS file? › › app/globals.css
Do you want to use CSS variables for colors? › no / yes
Where is your tailwind.config.js located? › tailwind.config.js
Configure the import alias for components: › @/components
Configure the import alias for utils: › @/lib/utils
Are you using React Server Components? › no / yes
```

--------------------------------

### Add Component Definition to shadcn registry.json

Source: https://ui.shadcn.com/docs/registry/getting-started

This JSON snippet shows how to register a component, like `hello-world`, within the `registry.json` file. It includes metadata such as name, type, title, description, and defines the component's file path and type, ensuring it conforms to the registry item schema.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "homepage": "https://acme.com",
  "items": [
    {
      "name": "hello-world",
      "type": "registry:block",
      "title": "Hello World",
      "description": "A simple hello world component.",
      "files": [
        {
          "path": "registry/new-york/hello-world/hello-world.tsx",
          "type": "registry:component"
        }
      ]
    }
  ]
}
```

--------------------------------

### Multiple Registry Setup with Mixed Authentication

Source: https://ui.shadcn.com/docs/components-json

Complete example showing how to configure multiple registries with different authentication methods and parameters. Demonstrates public registries, private registries with bearer tokens, and team registries with versioning and environment variables.

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@company-ui": {
      "url": "https://registry.company.com/ui/{name}.json",
      "headers": {
        "Authorization": "Bearer ${COMPANY_TOKEN}"
      }
    },
    "@team": {
      "url": "https://team.company.com/{name}.json",
      "params": {
        "team": "frontend",
        "version": "${REGISTRY_VERSION}"
      }
    }
  }
}
```

--------------------------------

### Manually Install Sonner and Next-Themes Dependencies

Source: https://ui.shadcn.com/docs/components/sonner

This `npm install` command is used for the manual setup of the Sonner component. It installs both `sonner` and `next-themes`, which are required dependencies for the toast functionality and theme integration, respectively.

```bash
npm install sonner next-themes
```

--------------------------------

### Install Dependencies with pnpm

Source: https://ui.shadcn.com/docs/blocks

Installs project dependencies using pnpm package manager. Required before starting development on the block.

```bash
pnpm install
```

--------------------------------

### Install Project Dependencies using npm

Source: https://ui.shadcn.com/docs/installation/manual

This bash command installs a set of essential npm packages for the project. These dependencies include utilities for styling (`class-variance-authority`, `clsx`, `tailwind-merge`), icon library (`lucide-react`), and animation effects (`tw-animate-css`).

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
```

--------------------------------

### Install shadcn/ui Pagination Component via CLI (Bash)

Source: https://ui.shadcn.com/docs/components/pagination

This snippet shows the command-line interface (CLI) method to add the shadcn/ui pagination component to your project. It uses `npx` to execute the `@latest` version of the shadcn tool, which automates the component setup. This command requires Node.js and npm/yarn to be installed.

```bash
npx shadcn@latest add pagination
```

--------------------------------

### Install Shadcn UI Dropdown Menu via CLI

Source: https://ui.shadcn.com/docs/components/dropdown-menu

This command demonstrates how to easily add the `dropdown-menu` component to your project using the Shadcn UI command-line interface. It automates the setup and integration of the component into your development environment.

```bash
npx shadcn@latest add dropdown-menu
```

--------------------------------

### View Registry Item Before Installation

Source: https://ui.shadcn.com/docs/changelog

Preview a component from a registry before installing it. This command displays the component code, configuration, and all dependencies, allowing users to verify the component matches their requirements.

```bash
npx shadcn view @acme/auth-system
```

--------------------------------

### Install Shadcn UI Command Component via CLI (Bash)

Source: https://ui.shadcn.com/docs/components/command

This command facilitates the automated installation of the Shadcn UI `Command` component using the provided CLI utility. It streamlines the process of adding the component files and their required dependencies directly into your project. This method is recommended for a quick and integrated setup.

```bash
npx shadcn@latest add command
```

--------------------------------

### Install Vaul Dependency for Manual Setup

Source: https://ui.shadcn.com/docs/components/drawer

Manually install the Vaul package as a dependency when setting up the Drawer component without the CLI. Vaul is the underlying library that powers the Drawer functionality.

```bash
npm install vaul
```

--------------------------------

### Install Block and Override Primitives in shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Configure a registry item to install a block from shadcn/ui and override default primitives with custom implementations from remote registries. This enables centralized dependency management for component hierarchies.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-login",
  "type": "registry:block",
  "registryDependencies": [
    "login-01",
    "https://example.com/r/button.json",
    "https://example.com/r/input.json",
    "https://example.com/r/label.json"
  ]
}
```

--------------------------------

### Install Resizable Component via CLI

Source: https://ui.shadcn.com/docs/components/resizable

Installs the resizable component and its dependencies using the shadcn CLI tool. This is the recommended installation method for projects using shadcn/ui.

```bash
npx shadcn@latest add resizable
```

--------------------------------

### Install Radix UI Popover core dependency via npm

Source: https://ui.shadcn.com/docs/components/popover

For manual setup of the Shadcn UI Popover, this command installs the foundational `@radix-ui/react-popover` library from Radix UI. This primitive provides the unstyled, accessible component logic that Shadcn UI builds upon.

```bash
npm install @radix-ui/react-popover
```

--------------------------------

### Create Remix Project with create-remix

Source: https://ui.shadcn.com/docs/installation/remix

Initialize a new Remix project using the create-remix command-line tool. This sets up the basic Remix application structure and dependencies.

```bash
npx create-remix@latest my-app
```

--------------------------------

### Install Radio Group Component - Bash CLI

Source: https://ui.shadcn.com/docs/components/radio-group

Command-line installation of the shadcn radio-group component. Simplest installation method using the shadcn CLI tool. Automatically handles dependency installation and component setup.

```bash
npx shadcn@latest add radio-group
```

--------------------------------

### Install Select Component via CLI

Source: https://ui.shadcn.com/docs/components/select

Command-line installation method for the Select component using shadcn package manager. This is the quickest way to add the component to an existing shadcn/ui project.

```bash
npx shadcn@latest add select
```

--------------------------------

### Install shadcn/ui Chart Component using CLI (Bash)

Source: https://ui.shadcn.com/docs/components/chart

This command installs the `chart` component into your shadcn/ui project using the `npx shadcn` CLI tool. It automatically adds the necessary files and dependencies for the chart component, simplifying the setup process. This is the recommended method for quick integration.

```bash
npx shadcn@latest add chart
```

--------------------------------

### Define Initial shadcn registry.json Structure

Source: https://ui.shadcn.com/docs/registry/getting-started

This JSON snippet illustrates the basic structure for a `registry.json` file, which serves as the entry point for a shadcn component registry. It includes the schema reference, registry name, homepage URL, and an empty array for registry items, conforming to the specified registry schema.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "homepage": "https://acme.com",
  "items": [
    // ...
  ]
}
```

--------------------------------

### Install Scroll Area Dependencies Manually

Source: https://ui.shadcn.com/docs/components/scroll-area

Manual installation of the Radix UI scroll-area dependency. Used when CLI installation is not preferred or when customizing component setup.

```bash
npm install @radix-ui/react-scroll-area
```

--------------------------------

### Example Secure Custom Registry Configuration (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This snippet provides an example of a comprehensive secure custom registry setup in `components.json`. It includes a URL, authorization using an environment variable, and a custom header, adhering to best practices for registry operators.

```json
{
  "@company": {
    "url": "https://registry.company.com/v1/{name}.json",
    "headers": {
      "Authorization": "Bearer ${COMPANY_TOKEN}",
      "X-Registry-Version": "1.0"
    }
  }
}
```

--------------------------------

### Create React Router Project

Source: https://ui.shadcn.com/docs/installation/react-router

Initialize a new React Router project using the create-react-router CLI tool. This sets up the basic project structure with React Router pre-configured.

```bash
npx create-react-router@latest my-app
```

--------------------------------

### Install Shadcn UI Avatar component using CLI

Source: https://ui.shadcn.com/docs/components/avatar

Installs the Shadcn UI Avatar component into your project using the `npx shadcn@latest add avatar` command. This method automates the setup, including necessary dependencies and copying component files, simplifying the installation process for Shadcn UI components.

```bash
npx shadcn@latest add avatar
```

--------------------------------

### Manually install Radix UI Dropdown Menu dependency

Source: https://ui.shadcn.com/docs/components/dropdown-menu

This `npm` command installs the `@radix-ui/react-dropdown-menu` package, which is the foundational primitive for the Shadcn UI dropdown menu component. It's a necessary step for manual setup if not using the Shadcn CLI.

```bash
npm install @radix-ui/react-dropdown-menu
```

--------------------------------

### Install Components from Namespaced Registries

Source: https://ui.shadcn.com/docs/changelog

Install components from multiple namespaced registries using the command line. Components are specified with their namespace prefix and installed automatically with all dependencies resolved from their respective registries.

```bash
npx shadcn add @acme/button @internal/auth-system
```

--------------------------------

### Execute shadcn Registry Build Script

Source: https://ui.shadcn.com/docs/registry/getting-started

This command runs the `registry:build` script defined in `package.json`. Executing this script triggers the shadcn CLI to generate the registry JSON files, typically placed in a `public/r` directory by default.

```bash
npm run registry:build
```

--------------------------------

### Install Shadcn UI Skeleton Component via CLI

Source: https://ui.shadcn.com/docs/components/skeleton

This command demonstrates how to easily integrate the Shadcn UI Skeleton component into your project using the `npx shadcn@latest add` CLI tool. Executing this command automatically adds the necessary files and dependencies. It streamlines the setup process for new UI components.

```bash
npx shadcn@latest add skeleton
```

--------------------------------

### Configure shadcn Build Script in package.json

Source: https://ui.shadcn.com/docs/registry/getting-started

This JSON snippet updates the `package.json` file by adding a `registry:build` script. This script executes the `shadcn build` command, which is used to generate the necessary JSON files for the component registry.

```json
{
  "scripts": {
    "registry:build": "shadcn build"
  }
}
```

--------------------------------

### Install Sonner Component via Shadcn UI CLI

Source: https://ui.shadcn.com/docs/components/sonner

This `npx` command facilitates the quick and automated installation of the Sonner component into your project using the Shadcn UI command-line interface. It streamlines the setup process for UI components.

```bash
npx shadcn@latest add sonner
```

--------------------------------

### Install Kbd Component via CLI

Source: https://ui.shadcn.com/docs/components/kbd

Command to install the Kbd component using shadcn's CLI tool. This is the recommended installation method for adding the component to your project.

```bash
npx shadcn@latest add kbd
```

--------------------------------

### Install CMD K Dependency for Command Menu (Bash)

Source: https://ui.shadcn.com/docs/components/command

This command installs the core `cmdk` package, which serves as the foundational dependency for the Shadcn UI `Command` component. This step is crucial for the manual installation process, ensuring that the underlying command menu functionality is available. Make sure this dependency is installed before proceeding with copying the component's source code.

```bash
npm install cmdk
```

--------------------------------

### Install Shadcn UI Popover component using CLI

Source: https://ui.shadcn.com/docs/components/popover

This command provides the simplest way to add the Popover component to your project using the Shadcn UI command-line interface. It automates the installation of necessary files and dependencies, streamlining the setup process.

```bash
npx shadcn@latest add popover
```

--------------------------------

### Install Resources from Namespaced Registries

Source: https://ui.shadcn.com/docs/components-json

Install components and resources using the namespace syntax after configuring registries. Supports installing from public registries, private authenticated registries, and multiple resources in a single command.

```bash
# Install from a configured registry
npx shadcn@latest add @v0/dashboard

# Install from private registry
npx shadcn@latest add @private/button

# Install multiple resources
npx shadcn@latest add @acme/header @internal/auth-utils
```

--------------------------------

### Handle `shadcn/ui` Initialization with React 19 Peer Dependency Prompt (npm)

Source: https://ui.shadcn.com/docs/react-19

This `bash` snippet illustrates the interactive prompt from the `shadcn/ui` CLI when initializing a project (`npx shadcn@latest init -d`) while using React 19 with `npm`. It guides users to select a resolution strategy, either `--force` or `--legacy-peer-deps`, to address potential peer dependency conflicts during the shadcn/ui installation process.

```bash
It looks like you are using React 19.
Some packages may fail to install due to peer dependency issues (see https://ui.shadcn.com/react-19).

? How would you like to proceed? › - Use arrow-keys. Return to submit.
❯   Use --force
    Use --legacy-peer-deps
```

--------------------------------

### Add Components to Monorepo Workspace

Source: https://ui.shadcn.com/docs/monorepo

Add shadcn/ui components to your monorepo application by navigating to the app directory and running the add command. The CLI automatically determines component type and installs files to correct paths with proper import handling.

```bash
cd apps/web
npx shadcn@latest add [COMPONENT]
```

--------------------------------

### Install Scroll Area Component via CLI

Source: https://ui.shadcn.com/docs/components/scroll-area

Installs the scroll-area component using the shadcn CLI tool. This is the quickest installation method that automatically handles dependency setup and file placement.

```bash
npx shadcn@latest add scroll-area
```

--------------------------------

### Install Shadcn UI Spinner Component via CLI (Bash)

Source: https://ui.shadcn.com/docs/components/spinner

Provides the command-line interface (CLI) instruction to add the Shadcn UI Spinner component to your project. This command automates the setup, including creating the component file and configuring necessary dependencies. Ensure you have the Shadcn UI CLI installed globally or locally before running this command.

```bash
npx shadcn@latest add spinner
```

--------------------------------

### Install Toggle Component Dependencies Manually

Source: https://ui.shadcn.com/docs/components/toggle

Manual installation of the required Radix UI toggle dependency. Use this approach if you prefer to install dependencies separately or cannot use the CLI.

```bash
npm install @radix-ui/react-toggle
```

--------------------------------

### Install Drawer Component via CLI

Source: https://ui.shadcn.com/docs/components/drawer

Install the shadcn Drawer component using the CLI tool. This is the recommended installation method that automatically sets up all dependencies and copies necessary files to your project.

```bash
npx shadcn@latest add drawer
```

--------------------------------

### Install Radix UI Slider Dependency Manually (npm)

Source: https://ui.shadcn.com/docs/components/slider

This npm command installs `@radix-ui/react-slider`, which is the underlying primitive library for the Shadcn UI Slider. This step is required for manual setup of the component, alongside copying the component source.

```bash
npm install @radix-ui/react-slider
```

--------------------------------

### View shadcn component details

Source: https://ui.shadcn.com/docs/registry/namespace

Explains how to inspect registry items before installation using the 'view' command. This allows users to see resource metadata, dependencies, file contents, and configuration details for single or multiple resources, or from a URL.

```bash
npx shadcn@latest view @acme/button
```

```bash
npx shadcn@latest view @v0/dashboard @shadcn/card
```

```bash
npx shadcn@latest view https://registry.example.com/button.json
```

--------------------------------

### Install Carousel Component via CLI

Source: https://ui.shadcn.com/docs/components/carousel

shadcn/ui CLI command to automatically install and configure the carousel component with all dependencies and file setup. Simplest method for adding the carousel to your project.

```bash
npx shadcn@latest add carousel
```

--------------------------------

### Install Input OTP Component using Shadcn CLI (Bash)

Source: https://ui.shadcn.com/docs/components/input-otp

Provides the command to add the Input OTP component to your project using the shadcn/ui CLI. This automates the installation and configuration of the component and its dependencies.

```bash
npx shadcn@latest add input-otp
```

--------------------------------

### Install Textarea Component via CLI in Bash

Source: https://ui.shadcn.com/docs/components/textarea

Installs the Textarea component from shadcn/ui using the command-line interface. This is the recommended installation method as it automatically handles file placement and dependencies.

```bash
npx shadcn@latest add textarea
```

--------------------------------

### Define reusable registry block with components

Source: https://ui.shadcn.com/docs/registry/examples

Create a registry block item that bundles multiple related files (pages and components) with their dependencies. This block specifies registry dependencies on other components and defines file paths with content references for installation into target locations in the project structure.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "login-01",
  "type": "registry:block",
  "description": "A simple login form.",
  "registryDependencies": ["button", "card", "input", "label"],
  "files": [
    {
      "path": "blocks/login-01/page.tsx",
      "content": "import { LoginForm } ...",
      "type": "registry:page",
      "target": "app/login/page.tsx"
    },
    {
      "path": "blocks/login-01/components/login-form.tsx",
      "content": "...",
      "type": "registry:component"
    }
  ]
}
```

--------------------------------

### Install Shadcn UI Slider Component via CLI (Bash)

Source: https://ui.shadcn.com/docs/components/slider

This command uses the Shadcn UI CLI to quickly add the Slider component to your project. It automates the installation of dependencies and component files, streamlining the setup process.

```bash
npx shadcn@latest add slider
```

--------------------------------

### Install Progress Dependencies Manually

Source: https://ui.shadcn.com/docs/components/progress

Manual installation of the Radix UI React Progress dependency required for the Progress component. Use this method when CLI installation is not available or preferred.

```bash
npm install @radix-ui/react-progress
```

--------------------------------

### Manually install Radix UI React Hover Card npm package

Source: https://ui.shadcn.com/docs/components/hover-card

This command installs the core `@radix-ui/react-hover-card` package, which is the foundational primitive for the Shadcn UI Hover Card. It's used for manual setup when not relying on the Shadcn CLI. Ensure this dependency is added to your project for the component to function.

```bash
npm install @radix-ui/react-hover-card
```

--------------------------------

### Install Native Select component via CLI

Source: https://ui.shadcn.com/docs/components/native-select

Use the shadcn CLI to easily add the Native Select component to your project. This command will scaffold the necessary files and update dependencies automatically, streamlining the setup process.

```bash
npx shadcn@latest add native-select
```

--------------------------------

### CLI npx shadcn@latest add

Source: https://ui.shadcn.com/docs/registry/namespace

Installs components or resources from a specified registry, URL, or local file path into your project. It supports installing single or multiple items simultaneously.

```APIDOC
## CLI npx shadcn@latest add

### Description
Installs components or resources from a specified registry, URL, or local file path into your project. It supports installing single or multiple items simultaneously.

### Method
CLI

### Endpoint
`npx shadcn@latest add [resource_identifier...]`

### Parameters
#### Path Parameters
- **resource_identifier** (string) - Required - One or more identifiers for the resource(s) to install. This can be a registry-prefixed name (e.g., `@v0/dashboard`), a direct URL to a `.json` file, or a local file path.

#### Query Parameters
(None)

#### Request Body
(Not applicable for CLI command)

### Request Example
```bash
npx shadcn@latest add @v0/dashboard
npx shadcn@latest add @acme/button @lib/utils @ai/prompt
npx shadcn@latest add https://registry.example.com/button.json
npx shadcn@latest add ./local-registry/button.json
```

### Response
#### Success Response (CLI Output)
The command typically outputs success messages indicating that the components have been added and any necessary configurations updated.

#### Response Example
```txt
✔ Files generated.
```
```

--------------------------------

### Install Shadcn UI Accordion component via CLI

Source: https://ui.shadcn.com/docs/components/accordion

This command uses the Shadcn UI command-line interface to automatically add the Accordion component and its required dependencies to your project, simplifying the setup process for new components.

```bash
npx shadcn@latest add accordion
```

--------------------------------

### Install Empty Component via CLI

Source: https://ui.shadcn.com/docs/components/empty

Command to install the Empty component using the shadcn package manager. Automatically adds the component and its dependencies to the project.

```bash
npx shadcn@latest add empty
```

--------------------------------

### Create Astro Project with TailwindCSS and React

Source: https://ui.shadcn.com/docs/installation/astro

Initialize a new Astro project with TailwindCSS and React templates pre-installed. This command scaffolds the project structure and installs necessary dependencies for shadcn/ui integration.

```bash
npx create-astro@latest astro-app  --template with-tailwindcss --install --add react --git
```

--------------------------------

### Create components.json Configuration File for shadcn/ui

Source: https://ui.shadcn.com/docs/installation/manual

This JSON configuration file sets up the shadcn/ui component library with New York style, TypeScript/TSX support, Tailwind CSS styling with CSS variables, and path aliases for easier imports. Place this file in the root of your project directory to enable component scaffolding and configuration.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

--------------------------------

### Start Development Server with pnpm

Source: https://ui.shadcn.com/docs/blocks

Starts the development server for the www application at http://localhost:3333. Enables live preview of blocks during development.

```bash
pnpm www:dev
```

--------------------------------

### Initialize shadcn Project with init Command

Source: https://ui.shadcn.com/docs/cli

The init command sets up a new shadcn project by installing dependencies, adding the cn utility, and configuring CSS variables. It supports template selection, base color configuration, and directory structure options.

```bash
npx shadcn@latest init
```

```bash
Usage: shadcn init [options] [components...]

initialize your project and install dependencies

Arguments:
  components         name, url or local path to component

Options:
  -t, --template <template>      the template to use. (next, next-monorepo)
  -b, --base-color <base-color>  the base color to use. (neutral, gray, zinc, stone, slate)
  -y, --yes                      skip confirmation prompt. (default: true)
  -f, --force                    force overwrite of existing configuration. (default: false)
  -c, --cwd <cwd>                the working directory. defaults to the current directory.
  -s, --silent                   mute output. (default: false)
  --src-dir                      use the src directory when creating a new project. (default: false)
  --no-src-dir                   do not use the src directory when creating a new project.
  --css-variables                use css variables for theming. (default: true)
  --no-css-variables             do not use css variables for theming.
  --no-base-style                do not install the base shadcn style
  -h, --help                     display help for command
```

--------------------------------

### Item Component Installation - Bash

Source: https://ui.shadcn.com/docs/components/item

CLI command to install the Item component from shadcn. Requires Node.js and npm/pnpm package manager.

```bash
npx shadcn@latest add item
```

--------------------------------

### Install Tailwind CSS and Autoprefixer

Source: https://ui.shadcn.com/docs/installation/remix

Install Tailwind CSS and Autoprefixer as development dependencies to enable styling support for shadcn/ui components in your Remix project.

```bash
npm install -D tailwindcss@latest autoprefixer@latest
```

--------------------------------

### Install Input Component - Bash CLI

Source: https://ui.shadcn.com/docs/components/input

Install the Input component using the shadcn CLI. This command adds the Input component to your project automatically.

```bash
npx shadcn@latest add input
```

--------------------------------

### Install Tooltip Dependencies via npm

Source: https://ui.shadcn.com/docs/components/tooltip

Manual installation of the Radix UI tooltip dependency. Required when not using the shadcn CLI installation method. Install this package before copying the tooltip component source.

```bash
npm install @radix-ui/react-tooltip
```

--------------------------------

### Initialize shadcn/ui with CLI

Source: https://ui.shadcn.com/docs/installation/react-router

Run the shadcn initialization command to configure shadcn/ui components in your React Router project. This sets up the necessary configuration files and component directories.

```bash
npx shadcn@latest init
```

--------------------------------

### Basic Empty State Demo with Project Icon

Source: https://ui.shadcn.com/docs/components/empty

Complete example demonstrating a basic empty state with header containing icon media, title, and description, plus action buttons in the content area. Uses Tabler and Lucide icons for visual elements.

```tsx
import { IconFolderCode } from "@tabler/icons-react"
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating
          your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Create Project</Button>
          <Button variant="outline">Import Project</Button>
        </div>
      </EmptyContent>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <a href="#">
          Learn More <ArrowUpRightIcon />
        </a>
      </Button>
    </Empty>
  )
}
```

--------------------------------

### Install Sheet Component via CLI

Source: https://ui.shadcn.com/docs/components/sheet

Command to install the Sheet component and its dependencies using the shadcn CLI. This is the recommended installation method for projects using shadcn/ui.

```bash
npx shadcn@latest add sheet
```

--------------------------------

### Install Progress Component via CLI

Source: https://ui.shadcn.com/docs/components/progress

Command-line installation method for adding the shadcn Progress component to your project. Uses the shadcn CLI tool to automatically install dependencies and generate component files.

```bash
npx shadcn@latest add progress
```

--------------------------------

### Implement Resizable Handle with Visibility Toggle in Shadcn UI React

Source: https://ui.shadcn.com/docs/components/resizable

These examples demonstrate how to use the `ResizablePanelGroup`, `ResizablePanel`, and `ResizableHandle` components from `shadcn/ui` in a React application. They specifically showcase how to make the resize handle visible by applying the `withHandle` prop to `ResizableHandle`, enabling users to interactively adjust panel sizes. The first example provides a more elaborate layout with a sidebar and content, while the second offers a simpler, minimalist setup.

```tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function ResizableHandleDemo() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-[200px] max-w-md rounded-lg border md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

```tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function Example() {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>One</ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>Two</ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

--------------------------------

### Install Shadcn UI Dialog component using CLI or npm

Source: https://ui.shadcn.com/docs/components/dialog

Instructions for installing the Shadcn UI Dialog component. Provides options for using the Shadcn CLI to add the component or manually installing the underlying Radix UI dependency.

```bash
npx shadcn@latest add dialog
```

```bash
npm install @radix-ui/react-dialog
```

--------------------------------

### Inspect Registry Item Payload Before Installation (Bash)

Source: https://ui.shadcn.com/docs/registry/namespace

This command demonstrates how to use the `shadcn` CLI to view the raw payload of a registry item (e.g., `@acme/button`) before installing it. This feature provides transparency, allowing developers to inspect the content being installed.

```bash
npx shadcn@latest view @acme/button
```

--------------------------------

### Environment Variables Setup

Source: https://ui.shadcn.com/docs/registry/authentication

Set registry authentication token in .env.local file. This stores the secret token that will be used for Bearer authentication when accessing private component registries.

```bash
REGISTRY_TOKEN=your_secret_token_here
```

--------------------------------

### Theme Select Dropdown Example with TSX

Source: https://ui.shadcn.com/docs/components/select

A practical example of a Select component configured for theme selection with light, dark, and system options. Demonstrates basic Select usage with three simple SelectItem options and a placeholder.

```tsx
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Theme" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
    <SelectItem value="system">System</SelectItem>
  </SelectContent>
</Select>
```

--------------------------------

### Import and Use Button Component in Next.js

Source: https://ui.shadcn.com/docs/installation/next

Demonstrates how to import the Button component from the components/ui directory and use it in a Next.js page component. This example shows a basic usage within a home page component that displays a clickable button.

```tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  )
}
```

--------------------------------

### Install Single Resource via Namespace

Source: https://ui.shadcn.com/docs/registry/namespace

Install a single resource from a namespaced registry using the CLI. The command references the namespace prefix and resource name, which are resolved to the configured registry URL.

```bash
npx shadcn@latest add @v0/dashboard
```

--------------------------------

### Install Table Component via CLI

Source: https://ui.shadcn.com/docs/components/table

CLI command to install the shadcn/ui Table component using npx. This automatically adds the component to your project.

```bash
npx shadcn@latest add table
```

--------------------------------

### Install Tooltip via shadcn CLI

Source: https://ui.shadcn.com/docs/components/tooltip

Command-line installation method for adding the Tooltip component to a shadcn/ui project. This is the recommended approach for quickly adding pre-configured component files.

```bash
npx shadcn@latest add tooltip
```

--------------------------------

### Install Alert Component - CLI

Source: https://ui.shadcn.com/docs/components/alert

Command-line interface command to install the Alert component and its dependencies into a shadcn/ui project. This automated installation handles dependency management and file placement.

```bash
npx shadcn@latest add alert
```

--------------------------------

### Complete registry.json Schema Structure

Source: https://ui.shadcn.com/docs/registry/registry-json

Full example of a registry.json file showing all main properties including schema reference, registry metadata, and component items with dependencies and file definitions. This demonstrates the complete structure needed to set up a custom component registry.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "shadcn",
  "homepage": "https://ui.shadcn.com",
  "items": [
    {
      "name": "hello-world",
      "type": "registry:block",
      "title": "Hello World",
      "description": "A simple hello world component.",
      "registryDependencies": [
        "button",
        "@acme/input-form",
        "https://example.com/r/foo"
      ],
      "dependencies": ["is-even@3.0.0", "motion"],
      "files": [
        {
          "path": "registry/new-york/hello-world/hello-world.tsx",
          "type": "registry:component"
        }
      ]
    }
  ]
}
```

--------------------------------

### Install Context Menu Component via CLI

Source: https://ui.shadcn.com/docs/components/context-menu

Installs the Context Menu component and its dependencies using the shadcn CLI tool. Requires Node.js and npm to be installed on your system.

```bash
npx shadcn@latest add context-menu
```

--------------------------------

### Create a Basic shadcn Component in TSX

Source: https://ui.shadcn.com/docs/registry/getting-started

This TypeScript React (TSX) code defines a simple `HelloWorld` component that renders a button with 'Hello World' text. It imports the `Button` component from a local UI library, demonstrating how to structure a component intended for the shadcn registry.

```tsx
import { Button } from "@/components/ui/button"

export function HelloWorld() {
  return <Button>Hello World</Button>
}
```

--------------------------------

### Create custom style extending shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Define a custom registry style that extends shadcn/ui by installing dependencies, adding registry dependencies (components and remote blocks), and configuring CSS variables for fonts and brand colors in light and dark modes. This configuration is applied when running `npx shadcn init`.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "example-style",
  "type": "registry:style",
  "dependencies": ["@tabler/icons-react"],
  "registryDependencies": [
    "login-01",
    "calendar",
    "https://example.com/r/editor.json"
  ],
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "brand": "20 14.3% 4.1%"
    },
    "dark": {
      "brand": "20 14.3% 4.1%"
    }
  }
}
```

--------------------------------

### shadcn CLI: Initialize and Add Components from Local Files

Source: https://ui.shadcn.com/docs/changelog

The shadcn CLI now supports initializing projects and adding components, themes, hooks, or utils directly from local JSON files. This enables zero-setup workflows, faster local testing, and enhanced capabilities for agents and private components.

```bash
npx shadcn init ./template.json
```

```bash
npx shadcn add ./block.json
```

--------------------------------

### Install Radix UI Select Dependency

Source: https://ui.shadcn.com/docs/components/select

NPM installation command for the Radix UI React Select primitive package. This dependency is required when manually installing the Select component.

```bash
npm install @radix-ui/react-select
```

--------------------------------

### Example Shadcn UI Registry Configuration (JSON)

Source: https://ui.shadcn.com/docs/registry/registry-index

This JSON configuration demonstrates a valid structure for a Shadcn UI registry. It includes a schema reference, the registry's name and homepage, and an array of items, each representing a component or example with its type, title, description, and associated file paths. This structure adheres to the specified registry schema requirements.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "homepage": "https://acme.com",
  "items": [
    {
      "name": "login-form",
      "type": "registry:component",
      "title": "Login Form",
      "description": "A login form component.",
      "files": [
        {
          "path": "registry/new-york/auth/login-form.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "example-login-form",
      "type": "registry:component",
      "title": "Example Login Form",
      "description": "An example showing how to use the login form component.",
      "files": [
        {
          "path": "registry/new-york/examples/example-login-form.tsx",
          "type": "registry:component"
        }
      ]
    }
  ]
}
```

--------------------------------

### Install Shadcn Button Component (CLI)

Source: https://ui.shadcn.com/docs/components/button

Provides instructions for installing the Shadcn UI button component using the command-line interface. This command automatically adds the component files and dependencies to your project.

```bash
npx shadcn@latest add button
```

--------------------------------

### Install Toggle Component via CLI

Source: https://ui.shadcn.com/docs/components/toggle

Quick installation of the Toggle component using the shadcn CLI. This command automatically adds the component to your project with all necessary dependencies configured.

```bash
npx shadcn@latest add toggle
```

--------------------------------

### Install Radix UI Switch dependency manually

Source: https://ui.shadcn.com/docs/components/switch

This command installs the core `@radix-ui/react-switch` package, which is a foundational dependency for the Shadcn UI Switch component when performing a manual installation.

```bash
npm install @radix-ui/react-switch
```

--------------------------------

### Install Context Menu Dependencies Manually

Source: https://ui.shadcn.com/docs/components/context-menu

Manually installs the required Radix UI context menu dependency for projects not using the shadcn CLI. This is the first step when manually setting up the component.

```bash
npm install @radix-ui/react-context-menu
```

--------------------------------

### Define Universal Registry Item for ESLint Configuration (shadcn/ui)

Source: https://ui.shadcn.com/docs/registry/examples

This JSON configuration defines a shadcn/ui registry item named 'my-eslint-config' for a custom ESLint configuration. It specifies a single file with an explicit target path (~/.eslintrc.json), enabling universal installation of the ESLint config file without framework dependencies.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "my-eslint-config",
  "type": "registry:item",
  "files": [
    {
      "path": "/path/to/your/registry/default/custom-eslint.json",
      "type": "registry:file",
      "target": "~/.eslintrc.json",
      "content": "..."
    }
  ]
}
```

--------------------------------

### Configure Plugin with NPM Dependencies in shadcn UI

Source: https://ui.shadcn.com/docs/registry/examples

Shows how to include external npm packages as dependencies when using Tailwind CSS plugins. The `dependencies` array declares required packages, while the `css` object configures both the plugin and custom CSS layers. This pattern ensures all required packages are installed before the component is used.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "typography-component",
  "type": "registry:item",
  "dependencies": ["@tailwindcss/typography"],
  "css": {
    "@plugin \"@tailwindcss/typography\"": {},
    "@layer components": {
      ".prose": {
        "max-width": "65ch"
      }
    }
  }
}
```

--------------------------------

### Install shadcn/ui Calendar via CLI

Source: https://ui.shadcn.com/docs/components/calendar

Installs the shadcn/ui Calendar component and its dependencies into your project using the shadcn CLI command. This is the recommended and easiest way to add the component.

```bash
npx shadcn@latest add calendar
```

--------------------------------

### Installing Shadcn UI Badge Component (CLI)

Source: https://ui.shadcn.com/docs/components/badge

Provides instructions for adding the `Badge` component to a project using the `shadcn/ui` CLI. This command automatically sets up the component's files and dependencies.

```bash
npx shadcn@latest add badge
```

--------------------------------

### Add Components with add Command

Source: https://ui.shadcn.com/docs/cli

The add command installs specific components and their dependencies into your project. It supports single or multiple component installation, file overwriting, and path customization.

```bash
npx shadcn@latest add [component]
```

```bash
Usage: shadcn add [options] [components...]

add a component to your project

Arguments:
  components         name, url or local path to component

Options:
  -y, --yes           skip confirmation prompt. (default: false)
  -o, --overwrite     overwrite existing files. (default: false)
  -c, --cwd <cwd>     the working directory. defaults to the current directory.
  -a, --all           add all available components (default: false)
  -p, --path <path>   the path to add the component to.
  -s, --silent        mute output. (default: false)
  --src-dir           use the src directory when creating a new project. (default: false)
  --no-src-dir        do not use the src directory when creating a new project.
  --css-variables     use css variables for theming. (default: true)
  --no-css-variables  do not use css variables for theming.
  -h, --help          display help for command
```

--------------------------------

### Create new React project with Vite

Source: https://ui.shadcn.com/docs/installation/vite

Initializes a new React project using Vite. This command uses the latest version of Vite and allows selecting the 'React + TypeScript' template during the interactive setup process.

```bash
npm create vite@latest
```

--------------------------------

### Install next-themes dependency

Source: https://ui.shadcn.com/docs/dark-mode/next

Installs the `next-themes` library, a dependency required for implementing dark mode functionality in Next.js applications.

```bash
npm install next-themes
```

--------------------------------

### Install Shadcn UI Card Component via CLI (Bash)

Source: https://ui.shadcn.com/docs/components/card

This command line snippet demonstrates how to add the Shadcn UI Card component to your project using the official CLI tool. It automates the installation and configuration of the component. Ensure the Shadcn UI CLI is installed and configured in your development environment.

```bash
npx shadcn@latest add card
```

--------------------------------

### Install react-resizable-panels Dependency

Source: https://ui.shadcn.com/docs/components/resizable

Installs the core react-resizable-panels library required by the Resizable component. This package provides the underlying resizable panel functionality.

```bash
npm install react-resizable-panels
```

--------------------------------

### Add Environment Variables to Registry Item JSON

Source: https://ui.shadcn.com/docs/registry/registry-item-json

This JSON configuration specifies environment variables to be added to a project's `.env.local` or `.env` file upon installation. It's intended for development or example variables, and existing variables are not overwritten. Users are cautioned against using this for production environment variables.

```json
{
  "envVars": {
    "NEXT_PUBLIC_APP_URL": "http://localhost:4000",
    "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/postgres",
    "OPENAI_API_KEY": ""
  }
}
```

--------------------------------

### Import and Use shadcn/ui Switch Component in React

Source: https://ui.shadcn.com/docs/installation/laravel

Import and render the Switch component in a React page component within a Laravel Inertia application. The component is imported from the generated ui directory and can be used like any other React component.

```typescript
import { Switch } from "@/components/ui/switch"

const MyPage = () => {
  return (
    <div>
      <Switch />
    </div>
  )
}

export default MyPage
```

--------------------------------

### Install Multiple Resources from Different Namespaces

Source: https://ui.shadcn.com/docs/registry/namespace

Install multiple resources from different namespaced registries in a single command. This allows combining resources from various sources (v0, acme, lib, ai) in one operation.

```bash
npx shadcn@latest add @acme/header @lib/auth-utils @ai/chatbot-rules
```

--------------------------------

### Configure components.json for shadcn/ui Project Setup

Source: https://ui.shadcn.com/docs/changelog

Configuration file for shadcn/ui project setup that defines styling preferences, Tailwind CSS configuration paths, and component/utility aliases. This file should be placed at the project root and customized to match your specific project structure and paths.

```json
{
  "style": "default",
  "rsc": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

--------------------------------

### Install Tabs Component via CLI

Source: https://ui.shadcn.com/docs/components/tabs

Install the Tabs component using the shadcn CLI tool. This command downloads and sets up the Tabs component in your project with all required dependencies.

```bash
npx shadcn@latest add tabs
```

--------------------------------

### Example Output for `npx shadcn diff` Listing Available Updates

Source: https://ui.shadcn.com/docs/changelog

This text output shows the result of running the `npx shadcn diff` command, indicating which components have updates pending. It lists the component name and the paths to its associated files, such as `button` and `toast` components.

```txt
The following components have updates available:
- button
  - /path/to/my-app/components/ui/button.tsx
- toast
  - /path/to/my-app/components/ui/use-toast.ts
  - /path/to/my-app/components/ui/toaster.tsx
```

--------------------------------

### Install Alert Dialog Dependencies - Bash

Source: https://ui.shadcn.com/docs/components/alert-dialog

Installs the Radix UI alert dialog dependency required for the shadcn Alert Dialog component. Run this when manually installing the component instead of using the CLI method.

```bash
npm install @radix-ui/react-alert-dialog
```

--------------------------------

### Install Latest input-otp Package - Bash

Source: https://ui.shadcn.com/docs/components/input-otp

Updates the input-otp package to the latest version to support the new composition pattern and additional features. Run this command in your project directory.

```bash
npm install input-otp@latest
```

--------------------------------

### Define Universal Registry Item for Python Cursor Rules (shadcn/ui)

Source: https://ui.shadcn.com/docs/registry/examples

This JSON configuration defines a shadcn/ui registry item named 'python-rules' for custom Cursor rules. It specifies a single file with an explicit target path (~/.cursor/rules/custom-python.mdc), allowing the rule file to be installed universally without framework detection.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "python-rules",
  "type": "registry:item",
  "files": [
    {
      "path": "/path/to/your/registry/default/custom-python.mdc",
      "type": "registry:file",
      "target": "~/.cursor/rules/custom-python.mdc",
      "content": "..."
    }
  ]
}
```

--------------------------------

### Install Separator Component via CLI

Source: https://ui.shadcn.com/docs/components/separator

Command-line installation method for adding the Separator component to a shadcn/ui project. Uses the shadcn CLI tool to automatically download and configure the component with all dependencies.

```bash
npx shadcn@latest add separator
```

--------------------------------

### List All Items from a Registry

Source: https://ui.shadcn.com/docs/changelog

Display all available components from a specified registry. This command provides a complete inventory of components available in a particular namespace, helping users discover all options.

```bash
npx shadcn list @acme
```

--------------------------------

### Install Radix UI Tabs Dependency

Source: https://ui.shadcn.com/docs/components/tabs

Install the @radix-ui/react-tabs package manually as a dependency for the Tabs component. This is required when not using the CLI installation method.

```bash
npm install @radix-ui/react-tabs
```

--------------------------------

### Install Shadcn Button Component Dependencies Manually (NPM)

Source: https://ui.shadcn.com/docs/components/button

Installs the required `@radix-ui/react-slot` dependency for the Shadcn button component manually. This is the initial step when performing a manual installation, followed by copying the component's source code.

```bash
npm install @radix-ui/react-slot
```

--------------------------------

### Install Radix UI Separator Dependency

Source: https://ui.shadcn.com/docs/components/separator

NPM installation command for the Radix UI separator primitive dependency. Required when manually setting up the Separator component without using the shadcn CLI tool.

```bash
npm install @radix-ui/react-separator
```

--------------------------------

### Install Breadcrumb Component via CLI

Source: https://ui.shadcn.com/docs/components/breadcrumb

Command to install the breadcrumb component and its dependencies using the shadcn/ui CLI tool. This is the recommended installation method.

```bash
npx shadcn@latest add breadcrumb
```

--------------------------------

### Install Menubar Dependencies via npm - Bash

Source: https://ui.shadcn.com/docs/components/menubar

Manually installs the Radix UI React Menubar package, required for the Menubar component to function. Used when manually setting up the component instead of using the CLI.

```bash
npm install @radix-ui/react-menubar
```

--------------------------------

### CLI npx shadcn@latest view

Source: https://ui.shadcn.com/docs/registry/namespace

Inspects the details of registry items before installation. This command provides comprehensive information including metadata, dependencies, file contents, CSS variables, Tailwind configuration, and required environment variables.

```APIDOC
## CLI npx shadcn@latest view

### Description
Inspects the details of registry items before installation. This command provides comprehensive information including metadata, dependencies, file contents, CSS variables, Tailwind configuration, and required environment variables.

### Method
CLI

### Endpoint
`npx shadcn@latest view [resource_identifier...]`

### Parameters
#### Path Parameters
- **resource_identifier** (string) - Required - One or more identifiers for the resource(s) to view. This can be a registry-prefixed name (e.g., `@acme/button`), or a direct URL to a `.json` file.

#### Query Parameters
(None)

#### Request Body
(Not applicable for CLI command)

### Request Example
```bash
npx shadcn@latest view @acme/button
npx shadcn@latest view @v0/dashboard @shadcn/card
npx shadcn@latest view https://registry.example.com/button.json
```

### Response
#### Success Response (CLI Output)
The command outputs detailed information about the requested resource(s) to the console.

#### Response Example
```txt
--- Resource Metadata ---
Name: button
Type: registry:ui
Description: A customizable button component.

--- Dependencies ---
- @shadcn/ui/utils

--- File Contents ---
// components/ui/button.tsx
// ... (file content)

--- Tailwind Configuration ---
// tailwind.config.js
// ... (tailwind config)

--- Environment Variables ---
(None)
```
```

--------------------------------

### Install Radix UI Label Dependency

Source: https://ui.shadcn.com/docs/components/label

Installs the @radix-ui/react-label package required for manual installation of the Label component. This is the first step when manually setting up the component instead of using the CLI.

```bash
npm install @radix-ui/react-label
```

--------------------------------

### Manually install Radix UI Accordion dependency

Source: https://ui.shadcn.com/docs/components/accordion

This `npm install` command adds the core `@radix-ui/react-accordion` package to your project. This dependency is fundamental for the Shadcn UI Accordion component when performing a manual installation.

```bash
npm install @radix-ui/react-accordion
```

--------------------------------

### Install Label Component via CLI

Source: https://ui.shadcn.com/docs/components/label

Installs the Label component using the shadcn CLI tool. This is the quickest method to add the component to a project with all dependencies automatically configured.

```bash
npx shadcn@latest add label
```

--------------------------------

### Install Shadcn UI Hover Card component using CLI

Source: https://ui.shadcn.com/docs/components/hover-card

This command demonstrates how to easily add the Shadcn UI `hover-card` component to your project using the `shadcn` CLI tool. It streamlines the installation process for Shadcn UI components. Run this in your terminal to quickly integrate the component.

```bash
npx shadcn@latest add hover-card
```

--------------------------------

### Render Shadcn UI Avatar components in React

Source: https://ui.shadcn.com/docs/components/avatar

Demonstrates how to import and use the `Avatar`, `AvatarFallback`, and `AvatarImage` components from `@/components/ui/avatar` to display user avatars, including fallbacks and grouped avatars. This example showcases single avatars with square and rounded styles, and a stacked group of avatars. It requires Shadcn UI setup in a React/TypeScript project.

```tsx
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export function AvatarDemo() {
  return (
    <div className="flex flex-row flex-wrap items-center gap-12">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="rounded-lg">
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
      <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src="https://github.com/maxleiter.png"
            alt="@maxleiter"
          />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src="https://github.com/evilrabbit.png"
            alt="@evilrabbit"
          />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
```

--------------------------------

### Install Checkbox Component via CLI

Source: https://ui.shadcn.com/docs/components/checkbox

Command to install the Checkbox component using the shadcn CLI tool. This automatically downloads and sets up the component in your project with all required dependencies.

```bash
npx shadcn@latest add checkbox
```

--------------------------------

### Adding Custom Tailwind Colors

Source: https://ui.shadcn.com/docs/registry/faq

JSON configuration showing how to add custom Tailwind color variables for both light and dark themes using the cssVars property.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "hello-world",
  "title": "Hello World",
  "type": "registry:block",
  "description": "A complex hello world component",
  "files": [
    // ...
  ],
  "cssVars": {
    "light": {
      "brand-background": "20 14.3% 4.1%",
      "brand-accent": "20 14.3% 4.1%"
    },
    "dark": {
      "brand-background": "20 14.3% 4.1%",
      "brand-accent": "20 14.3% 4.1%"
    }
  }
}
```

--------------------------------

### Install Shadcn UI Switch component via CLI

Source: https://ui.shadcn.com/docs/components/switch

This command line interface (CLI) command installs the Shadcn UI Switch component into your project, automating the process of adding the component files and dependencies.

```bash
npx shadcn@latest add switch
```

--------------------------------

### Install Shadcn Collapsible Component via CLI

Source: https://ui.shadcn.com/docs/components/collapsible

This command-line interface instruction shows how to quickly add the Shadcn UI Collapsible component to your project using the `shadcn` CLI tool. It streamlines the installation process by fetching and configuring the component automatically, including its dependencies and boilerplate code.

```bash
npx shadcn@latest add collapsible
```

--------------------------------

### Basic ToggleGroup usage with single selection in TypeScript/React

Source: https://ui.shadcn.com/docs/components/toggle-group

This code provides a minimal example of a `ToggleGroup` configured for single selection. It showcases the `type="single"`, `variant="outline"`, and `size="sm"` props. This basic setup is useful for understanding the core structure and common properties of the component.

```tsx
<ToggleGroup type="single" variant="outline" size="sm">
  <ToggleGroupItem value="a">A</ToggleGroupItem>
  <ToggleGroupItem value="b">B</ToggleGroupItem>
</ToggleGroup>
```

--------------------------------

### Install Radix UI Collapsible Dependency Manually

Source: https://ui.shadcn.com/docs/components/collapsible

This command installs the core `@radix-ui/react-collapsible` package, which is a prerequisite for manually setting up the Collapsible component in a React project. It ensures that the fundamental primitive is available for use, allowing for custom implementation.

```bash
npm install @radix-ui/react-collapsible
```

--------------------------------

### Install Radix UI Toggle Group dependency manually (Bash)

Source: https://ui.shadcn.com/docs/components/toggle-group

This command installs the underlying Radix UI primitive for the toggle group, which is a required dependency for the Shadcn UI component when performing a manual installation. It ensures the core functionality is available.

```bash
npm install @radix-ui/react-toggle-group
```

--------------------------------

### Install Shadcn UI Field Component via CLI

Source: https://ui.shadcn.com/docs/components/field

Installs the Shadcn UI Field component using the command-line interface. This command automatically adds the necessary files and dependencies to your project.

```bash
npx shadcn@latest add field
```

--------------------------------

### Install Radix UI Dialog Dependency

Source: https://ui.shadcn.com/docs/components/sheet

NPM installation command for the @radix-ui/react-dialog package, which is the underlying dependency for the Sheet component.

```bash
npm install @radix-ui/react-dialog
```

--------------------------------

### Scoped and File-Based Plugin Configuration

Source: https://ui.shadcn.com/docs/registry/examples

Demonstrates how to configure scoped npm packages, Tailwind plugin utilities, and local file-based plugins in a single registry item. Supports npm scoped packages like `@headlessui/tailwindcss`, core Tailwind plugin utilities, and relative file paths for custom plugins.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "scoped-plugins",
  "type": "registry:component",
  "css": {
    "@plugin \"@headlessui/tailwindcss\"": {},
    "@plugin \"tailwindcss/plugin\"": {},
    "@plugin \"./custom-plugin.js\"": {}
  }
}
```

--------------------------------

### Install Input Group - CLI (bash)

Source: https://ui.shadcn.com/docs/components/input-group

Command to scaffold the input-group component using the shadcn CLI. Dependencies: Node.js and network access to install and run the npx package; Input: runs in project root; Output: adds component files to your project. Limitation: requires shadcn CLI and may need manual path adjustments after scaffolding.

```bash
npx shadcn@latest add input-group

```

--------------------------------

### shadcn: radix-ui Migration Import Change Example

Source: https://ui.shadcn.com/docs/changelog

This `diff` example illustrates the effect of the `radix-ui` migration command on component imports. It shows how `@radix-ui/react-dialog` is replaced with an import from `radix-ui`, specifically aliasing `AlertDialog` as `AlertDialogPrimitive`.

```diff
- import * as AlertDialogPrimitive from "@radix-ui/react-dialog"
+ import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
```

--------------------------------

### Configure Initial CSS Variables with @theme Directive

Source: https://ui.shadcn.com/docs/tailwind-v4

This CSS snippet demonstrates the initial setup of CSS variables within a `@layer base` block, and their referencing under the `@theme` directive. It shows how `hsl` wrappers are directly applied to the theme variables.

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
  }
}

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
}
```

--------------------------------

### Get Carousel API Instance and Track State

Source: https://ui.shadcn.com/docs/components/carousel

Initialize carousel state management using setApi prop to obtain a CarouselApi instance. This allows tracking the current slide position and total slide count through React state and useEffect hooks. The example renders a carousel with numbered items and displays the current slide information.

```tsx
"use client"

import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

export function CarouselDApiDemo() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <div className="mx-auto max-w-xs">
      <Carousel setApi={setApi} className="w-full max-w-xs">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="text-muted-foreground py-2 text-center text-sm">
        Slide {current} of {count}
      </div>
    </div>
  )
}
```

--------------------------------

### Install Radix UI Avatar dependencies manually

Source: https://ui.shadcn.com/docs/components/avatar

Installs the `@radix-ui/react-avatar` package, which is a core dependency for the Shadcn UI Avatar component. This command is executed as part of the manual installation process, ensuring the foundational avatar primitives are available in your project.

```bash
npm install @radix-ui/react-avatar
```

--------------------------------

### Add Component from Shadcn Registry CLI

Source: https://ui.shadcn.com/docs/changelog

This command demonstrates how to use the Shadcn CLI to add a component from a registered registry. It automatically installs the specified component, `@ai-elements/prompt-input`, and updates the project's `components.json` file, simplifying component integration.

```bash
npx shadcn add @ai-elements/prompt-input
```

--------------------------------

### Install Custom Button Component via shadcn CLI

Source: https://ui.shadcn.com/docs/registry/namespace

Command to install a custom component version from a namespaced registry using the shadcn CLI. This overrides the original vendor version with custom configurations.

```bash
npx shadcn@latest add @my-company/custom-button
```

--------------------------------

### Basic Table Structure Usage

Source: https://ui.shadcn.com/docs/components/table

Minimal example showing how to structure a Table with header, body, and a single row of data. Demonstrates the basic layout without data mapping.

```tsx
<Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Method</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>Credit Card</TableCell>
      <TableCell className="text-right">$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

--------------------------------

### Configure PostCSS for Remix

Source: https://ui.shadcn.com/docs/installation/remix

Create a postcss.config.js file that configures Tailwind CSS and Autoprefixer plugins for processing CSS in your Remix application.

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

--------------------------------

### Install Alert Dialog via CLI - Bash

Source: https://ui.shadcn.com/docs/components/alert-dialog

Installs the Alert Dialog component from shadcn using the CLI tool. This command automatically adds the component and its dependencies to your project, handling file placement and configuration.

```bash
npx shadcn@latest add alert-dialog
```

--------------------------------

### Install Calendar Dependencies Manually

Source: https://ui.shadcn.com/docs/components/calendar

Manually installs the core third-party dependencies required for the shadcn/ui Calendar component, specifically react-day-picker and date-fns, using npm.

```bash
npm install react-day-picker date-fns
```

--------------------------------

### Create Gatsby Project

Source: https://ui.shadcn.com/docs/installation/gatsby

Initialize a new Gatsby project using the create-gatsby command. This sets up the basic project structure and dependencies required for a Gatsby application.

```bash
npm init gatsby
```

--------------------------------

### Complete Collapsible Sidebar Example with Inset Header (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/sidebar

This comprehensive example presents a fully functional collapsible sidebar, integrating `SidebarProvider`, `Sidebar`, `SidebarContent`, and navigation menus. It also includes `SidebarInset` to define a distinct header area within the layout, which houses the `SidebarTrigger` for toggling the sidebar's visibility.

```tsx
"use client"

import {
  CalendarIcon,
  HomeIcon,
  InboxIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: HomeIcon,
  },
  {
    title: "Inbox",
    url: "#",
    icon: InboxIcon,
  },
  {
    title: "Calendar",
    url: "#",
    icon: CalendarIcon,
  },
  {
    title: "Search",
    url: "#",
    icon: SearchIcon,
  },
  {
    title: "Settings",
    url: "#",
    icon: SettingsIcon,
  },
]

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center justify-between px-4">
          <SidebarTrigger />
        </header>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

--------------------------------

### Default Email Input Example - TypeScript React

Source: https://ui.shadcn.com/docs/components/input

A complete example showing an email input field with a placeholder. This is the default usage pattern for form inputs.

```typescript
import { Input } from "@/components/ui/input"

export function InputDemo() {
  return <Input type="email" placeholder="Email" />
}
```

--------------------------------

### Add Complex Utility with Pseudo-selectors in shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Create advanced utility classes with pseudo-selectors and nested rules to handle complex styling patterns like custom scrollbar hiding across different browsers.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-component",
  "type": "registry:component",
  "css": {
    "@utility scrollbar-hidden": {
      "scrollbar-hidden": {
        "&::-webkit-scrollbar": {
          "display": "none"
        }
      }
    }
  }
}
```

--------------------------------

### Import UI Components from Monorepo Package

Source: https://ui.shadcn.com/docs/monorepo

Import shadcn/ui components from the @workspace/ui package using the configured aliases. Components are accessed through the ui alias pointing to the shared components directory.

```typescript
import { Button } from "@workspace/ui/components/button"
```

--------------------------------

### Render Dynamic SidebarMenu with Projects in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This example demonstrates how to construct a complete sidebar menu using `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, and `SidebarMenuButton`. It dynamically renders a list of project items with icons and links, showcasing a full implementation of the sidebar structure.

```tsx
"use client"\n\nimport {\n  FrameIcon,\n  LifeBuoyIcon,\n  MapIcon,\n  PieChartIcon,\n  SendIcon,\n} from "lucide-react"\n\nimport {\n  Sidebar,\n  SidebarContent,\n  SidebarGroup,\n  SidebarGroupContent,\n  SidebarGroupLabel,\n  SidebarMenu,\n  SidebarMenuButton,\n  SidebarMenuItem,\n  SidebarProvider,\n} from "@/components/ui/sidebar"\n\nconst projects = [\n  {\n    name: "Design Engineering",\n    url: "#",\n    icon: FrameIcon,\n  },\n  {\n    name: "Sales & Marketing",\n    url: "#",\n    icon: PieChartIcon,\n  },\n  {\n    name: "Travel",\n    url: "#",\n    icon: MapIcon,\n  },\n  {\n    name: "Support",\n    url: "#",\n    icon: LifeBuoyIcon,\n  },\n  {\n    name: "Feedback",\n    url: "#",\n    icon: SendIcon,\n  },\n]\n\nexport function AppSidebar() {\n  return (\n    <SidebarProvider>\n      <Sidebar>\n        <SidebarContent>\n          <SidebarGroup>\n            <SidebarGroupLabel>Projects</SidebarGroupLabel>\n            <SidebarGroupContent>\n              <SidebarMenu>\n                {projects.map((project) => (\n                  <SidebarMenuItem key={project.name}>\n                    <SidebarMenuButton asChild>\n                      <a href={project.url}>\n                        <project.icon />\n                        <span>{project.name}</span>\n                      </a>\n                    </SidebarMenuButton>\n                  </SidebarMenuItem>\n                ))}\n              </SidebarMenu>\n            </SidebarGroupContent>\n          </SidebarGroup>\n        </SidebarContent>\n      </Sidebar>\n    </SidebarProvider>\n  )\n}\n
```

--------------------------------

### Import and use shadcn/ui Button component in TanStack Start

Source: https://ui.shadcn.com/docs/installation/tanstack

This TypeScript JSX (TSX) code demonstrates how to import and render the `Button` component from shadcn/ui within a TanStack Start application. It shows a basic functional component `App` that returns a `div` containing the `Button`.

```tsx
import { Button } from "@/components/ui/button"

function App() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  )
}
```

--------------------------------

### Add Media Query CSS Imports in shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Conditionally import stylesheets using media query syntax to load styles based on device type and screen dimensions, enabling responsive stylesheet management.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "responsive-import",
  "type": "registry:item",
  "css": {
    "@import \"print-styles.css\" print": {},
    "@import url(\"mobile.css\") screen and (max-width: 768px)": {}
  }
}
```

--------------------------------

### CLI Installation for Button Group

Source: https://ui.shadcn.com/docs/components/button-group

Provides the command-line interface (CLI) instruction to add the Button Group component to a project using shadcn/ui. This simplifies component integration by automating dependency management.

```bash
npx shadcn@latest add button-group
```

--------------------------------

### Install Radix UI Radio Group Dependency - Bash npm

Source: https://ui.shadcn.com/docs/components/radio-group

Manual npm installation of the required Radix UI radio-group dependency. Used when manually setting up the component instead of using the CLI installation method.

```bash
npm install @radix-ui/react-radio-group
```

--------------------------------

### Define Registry URL with Style Placeholder (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This example demonstrates the optional `{style}` placeholder in a registry URL. This placeholder is replaced with the currently configured style, enabling the registry to serve different versions of resources based on the user's styling preferences. It's useful for providing style-specific component variations.

```json
{
  "@themes": "https://registry.example.com/{style}/{name}.json"
}
```

--------------------------------

### Install TanStack Table and shadcn Table Component

Source: https://ui.shadcn.com/docs/components/data-table

Installation commands to add the shadcn Table component and TanStack React Table dependency to your project. These commands set up the necessary libraries for building data tables.

```bash
npx shadcn@latest add table
```

```bash
npm install @tanstack/react-table
```

--------------------------------

### Manually Install Form Dependencies

Source: https://ui.shadcn.com/docs/components/form

This command lists the essential npm packages required for manually installing the form component. These dependencies include `@radix-ui/react-label`, `@radix-ui/react-slot`, `react-hook-form`, `@hookform/resolvers`, and `zod`, which are crucial for the component's functionality and validation capabilities.

```bash
npm install @radix-ui/react-label @radix-ui/react-slot react-hook-form @hookform/resolvers zod
```

--------------------------------

### Install Shadcn UI Calendar Blocks with `shadcn@latest` CLI

Source: https://ui.shadcn.com/docs/components/calendar

After updating the main Calendar component, use this `npx` command to install specific new or updated calendar blocks, such as `calendar-02`. This command utilizes the `shadcn@latest` CLI to add additional UI components or features related to the calendar to your project. Ensure the core Calendar component is up-to-date before running this.

```bash
npx shadcn@latest add calendar-02
```

--------------------------------

### Provide Documentation Message for Registry Item in JSON

Source: https://ui.shadcn.com/docs/registry/registry-item-json

This JSON snippet allows for a custom documentation message to be displayed when a registry item is installed via the CLI. It's useful for providing specific instructions or important notes to the user, enhancing the installation experience.

```json
{
  "docs": "To get an OPENAI_API_KEY, sign up for an account at https://platform.openai.com."
}
```

--------------------------------

### Vertical Direction Example Component

Source: https://ui.shadcn.com/docs/components/resizable

Minimal example export component using vertical direction for ResizablePanelGroup. Demonstrates the simplest way to structure a vertical resizable layout with line number highlighting.

```tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function Example() {
  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel>One</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>Two</ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

--------------------------------

### Overriding Tailwind Theme Variables

Source: https://ui.shadcn.com/docs/registry/faq

JSON configuration demonstrating how to add or override Tailwind theme variables including text size, easing functions, and font families.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "hello-world",
  "title": "Hello World",
  "type": "registry:block",
  "description": "A complex hello world component",
  "files": [
    // ...
  ],
  "cssVars": {
    "theme": {
      "text-base": "3rem",
      "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      "font-heading": "Poppins, sans-serif"
    }
  }
}
```

--------------------------------

### Install Radix UI Checkbox Dependency

Source: https://ui.shadcn.com/docs/components/checkbox

npm command to install the Radix UI Checkbox primitive package, which is the underlying dependency required for the shadcn Checkbox component.

```bash
npm install @radix-ui/react-checkbox
```

--------------------------------

### Configure components.json for Web App Workspace

Source: https://ui.shadcn.com/docs/monorepo

Configure the components.json file for the web app workspace with shadcn/ui schema, style settings, Tailwind CSS configuration, and path aliases for component imports. Maps local paths and external @workspace/ui package paths for seamless component resolution.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../packages/ui/src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "utils": "@workspace/ui/lib/utils",
    "ui": "@workspace/ui/components"
  }
}
```

--------------------------------

### Basic Context Menu Implementation

Source: https://ui.shadcn.com/docs/components/context-menu

Renders a simple context menu with four menu items triggered on right-click. Demonstrates the minimal setup required for a functional context menu.

```tsx
<ContextMenu>
  <ContextMenuTrigger>Right click</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Profile</ContextMenuItem>
    <ContextMenuItem>Billing</ContextMenuItem>
    <ContextMenuItem>Team</ContextMenuItem>
    <ContextMenuItem>Subscription</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

--------------------------------

### Import Hooks and Utilities from Monorepo

Source: https://ui.shadcn.com/docs/monorepo

Import custom hooks and utility functions from the @workspace/ui package using configured aliases. Provides access to theme hooks and utility functions like cn for className composition.

```typescript
import { useTheme } from "@workspace/ui/hooks/use-theme"
import { cn } from "@workspace/ui/lib/utils"
```

--------------------------------

### Install Tailwind CSS dependencies

Source: https://ui.shadcn.com/docs/installation/vite

Installs Tailwind CSS and its Vite plugin as project dependencies. This step is necessary to integrate Tailwind CSS into the Vite build process, enabling utility-first styling.

```bash
npm install tailwindcss @tailwindcss/vite
```

--------------------------------

### Basic Sheet Usage Example in TSX

Source: https://ui.shadcn.com/docs/components/sheet

Minimal Sheet implementation with trigger button, content area, header with title and description. Demonstrates the basic structure for creating a confirmation dialog.

```tsx
<Sheet>
  <SheetTrigger>Open</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Are you absolutely sure?</SheetTitle>
      <SheetDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>
```

--------------------------------

### Define Custom Primary CSS Variables

Source: https://ui.shadcn.com/docs/theming

Provides an example of defining `--primary` and `--primary-foreground` CSS variables using the Oklch color format, adhering to the convention for background and foreground colors.

```css
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
```

--------------------------------

### View Registry Items with view Command

Source: https://ui.shadcn.com/docs/cli

The view command allows you to preview components and items from the registry before installation. Supports viewing single or multiple items, including namespaced registry items.

```bash
npx shadcn@latest view [item]
```

```bash
npx shadcn@latest view button card dialog
```

```bash
npx shadcn@latest view @acme/auth @v0/dashboard
```

```bash
Usage: shadcn view [options] <items...>

view items from the registry

Arguments:
  items            the item names or URLs to view

Options:
  -c, --cwd <cwd>  the working directory. defaults to the current directory.
  -h, --help       display help for command
```

--------------------------------

### shadcn Build Command Usage and Options

Source: https://ui.shadcn.com/docs/cli

Complete usage documentation showing all available command-line options for the build command, including arguments for registry path and options for output directory, working directory, and help.

```bash
Usage: shadcn build [options] [registry]

build components for a shadcn registry

Arguments:
  registry             path to registry.json file (default: "./registry.json")

Options:
  -o, --output <path>  destination directory for json files (default: "./public/r")
  -c, --cwd <cwd>      the working directory. defaults to the current directory.
  -h, --help           display help for command
```

--------------------------------

### Basic Registry Configuration with URL Templates

Source: https://ui.shadcn.com/docs/components-json

Configure multiple registries with simple URL template syntax. The {name} placeholder is automatically replaced with the resource name during installation. Supports multiple registry namespaces (@v0, @acme, @internal) for organizing component sources.

```json
{
  "registries": {
    "@v0": "https://v0.dev/chat/b/{name}",
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": "https://internal.company.com/{name}.json"
  }
}
```

--------------------------------

### Install Node.js types for Vite configuration

Source: https://ui.shadcn.com/docs/installation/vite

Installs type definitions for Node.js as a development dependency. This is required for TypeScript to correctly type Node.js-specific modules like `path` which are often used in configuration files like `vite.config.ts`.

```bash
npm install -D @types/node
```

--------------------------------

### Configure components.json for UI Package Workspace

Source: https://ui.shadcn.com/docs/monorepo

Configure the components.json file for the shared ui package workspace with shadcn/ui schema and @workspace/ui aliases. Defines how components, utilities, hooks, and libraries are resolved within the ui package.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@workspace/ui/components",
    "utils": "@workspace/ui/lib/utils",
    "hooks": "@workspace/ui/hooks",
    "lib": "@workspace/ui/lib",
    "ui": "@workspace/ui/components"
  }
}
```

--------------------------------

### Import and Use Button Component in Remix Route

Source: https://ui.shadcn.com/docs/installation/remix

Import the Button component from the ui folder and use it in a Remix route component. Demonstrates basic component usage in a Remix application.

```typescript
import { Button } from "~/components/ui/button"

export default function Home() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  )
}
```

--------------------------------

### Install Recharts Dependency Manually (npm)

Source: https://ui.shadcn.com/docs/components/chart

This command installs the `recharts` library, which is a required peer dependency for the `shadcn/ui` chart components. It should be run in your project's terminal to add `recharts` to your `node_modules` and `package.json`, enabling chart functionality.

```bash
npm install recharts
```

--------------------------------

### Add Functional Utilities with Variants in shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Define functional utility classes with wildcard variants that accept dynamic values, enabling flexible utilities like tab-size that adapt to theme variables.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-component",
  "type": "registry:component",
  "css": {
    "@utility tab-*": {
      "tab-size": "var(--tab-size-*)"
    }
  }
}
```

--------------------------------

### Install Embla Carousel Dependencies

Source: https://ui.shadcn.com/docs/components/carousel

NPM installation command for the Embla Carousel React library, required for the carousel component functionality. Run this command to add the necessary dependencies to your project.

```bash
npm install embla-carousel-react
```

--------------------------------

### GET /chat/api/open

Source: https://ui.shadcn.com/docs/registry/open-in-v0

Integrate your registry with Open in v0. This endpoint allows you to open a publicly accessible registry item in v0 by providing its URL.

```APIDOC
## GET /chat/api/open

### Description
This endpoint allows you to open a publicly accessible registry item in v0 by providing its URL. It redirects to or initiates an action within the v0 application.

### Method
GET

### Endpoint
/chat/api/open

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **url** (string) - Required - The publicly accessible URL of the registry item to open in v0.

#### Request Body
(None)

### Request Example
(N/A for GET request with query parameters)

### Response
#### Success Response (302 Redirect)
This endpoint typically performs a redirect or initiates an action within the v0 application, rather than returning a direct JSON response.

#### Response Example
(N/A)
```

--------------------------------

### Configure Global CSS Variables with Tailwind Theme

Source: https://ui.shadcn.com/docs/installation/manual

Set up root and dark mode CSS variables using oklch color model for light and dark themes. Imports Tailwind CSS and custom animations, defines custom dark variant, and establishes theme configuration including colors for UI elements, charts, and sidebar components. Uses @theme inline to map CSS variables to Tailwind color utilities.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

--------------------------------

### Add URL-based CSS Imports in shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Import external stylesheets and web fonts using url() syntax for CDN resources and local files, enabling integration of Google Fonts and remote style libraries.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "font-import",
  "type": "registry:item",
  "css": {
    "@import url(\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap\")": {},
    "@import url('./local-styles.css')": {}
  }
}
```

--------------------------------

### Basic Resizable Panel Group Usage

Source: https://ui.shadcn.com/docs/components/resizable

Demonstrates minimal setup of a ResizablePanelGroup with horizontal direction containing two panels and a handle between them. Shows the basic structure without additional styling.

```tsx
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel>One</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>Two</ResizablePanel>
</ResizablePanelGroup>
```

--------------------------------

### Configure import alias for UI components

Source: https://ui.shadcn.com/docs/components-json

Sets the import path alias specifically for UI components, allowing customization of the installation directory. Overrides the default location if needed.

```json
{
  "aliases": {
    "ui": "@/app/ui"
  }
}
```

--------------------------------

### Initialize shadcn MCP Server for AI Development Clients

Source: https://ui.shadcn.com/docs/registry/mcp

These `npx` commands initialize the shadcn Multi-Client Protocol (MCP) server, integrating it with specific AI development environments. Execute the relevant command in your project's root to enable your chosen AI client (e.g., Claude Code, Cursor, VS Code) to interact with your shadcn registry. Each command targets a different client via the `--client` flag, streamlining registry access for AI-driven component generation.

```bash
npx shadcn@latest mcp init --client claude
```

```bash
npx shadcn@latest mcp init --client cursor
```

```bash
npx shadcn@latest mcp init --client vscode
```

--------------------------------

### Add Environment Variables to shadcn UI Registry Item

Source: https://ui.shadcn.com/docs/registry/examples

Shows how to declare environment variables using the `envVars` field in a registry item. Variables are added to `.env.local` or `.env` files without overwriting existing values. Best practice is to use this for development and example variables only, never production secrets.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-item",
  "type": "registry:item",
  "envVars": {
    "NEXT_PUBLIC_APP_URL": "http://localhost:4000",
    "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/postgres",
    "OPENAI_API_KEY": ""
  }
}
```

--------------------------------

### React Button Group Usage Example

Source: https://ui.shadcn.com/docs/components/button-group

Demonstrates the basic usage of ButtonGroup component and its associated components for layout and styling buttons together.  It showcases ButtonGroupSeparator and ButtonGroupText usage.

```tsx
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group"

```

```tsx
<ButtonGroup>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</ButtonGroup>

```

--------------------------------

### Empty State with Gradient Background

Source: https://ui.shadcn.com/docs/components/empty

Advanced empty state example using gradient background utilities (bg-gradient-to-b) and muted colors for a polished appearance. Includes notification bell icon and refresh button for notification context.

```tsx
import { IconBell } from "@tabler/icons-react"
import { RefreshCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyMuted() {
  return (
    <Empty className="from-muted/50 to-background h-full bg-gradient-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBell />
        </EmptyMedia>
        <EmptyTitle>No Notifications</EmptyTitle>
        <EmptyDescription>
          You&apos;re all caught up. New notifications will appear here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          <RefreshCcwIcon />
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  )
}
```

--------------------------------

### Import and Use Button Component in Astro

Source: https://ui.shadcn.com/docs/installation/astro

Demonstrates how to import and render the shadcn/ui Button component in an Astro page. The component is imported from the configured path alias and used within standard HTML markup.

```astro
---
import { Button } from "@/components/ui/button"
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="generator" content={Astro.generator} />
		<title>Astro + TailwindCSS</title>
	</head>

	<body>
		<div className="grid place-items-center h-screen content-center">
			<Button>Button</Button>
		</div>
	</body>
</html>
```

--------------------------------

### Force Install `npm` Packages to Resolve Peer Dependency Conflicts

Source: https://ui.shadcn.com/docs/react-19

These `npm` commands provide two methods to bypass strict peer dependency checks when installing packages. `--force` ignores and overrides any dependency conflicts, while `--legacy-peer-deps` skips strict peer dependency checks, allowing installation of packages with unmet dependencies. Use these when packages haven't updated their peer dependency declarations for React 19.

```bash
npm i <package> --force

npm i <package> --legacy-peer-deps
```

--------------------------------

### Dropdown Menu with Items

Source: https://ui.shadcn.com/docs/components/item

Complete example demonstrating how to integrate Item components within a DropdownMenu. Shows rendering a list of people with avatars, usernames, and emails.

```APIDOC
## Dropdown Menu Integration Example

### Description
Complete example showing how to use Item components within a DropdownMenu to display a list of selectable people with avatars and details.

### Implementation
```tsx
"use client"

import { ChevronDownIcon } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

const people = [
  {
    username: "shadcn",
    avatar: "https://github.com/shadcn.png",
    email: "shadcn@vercel.com",
  },
  {
    username: "maxleiter",
    avatar: "https://github.com/maxleiter.png",
    email: "maxleiter@vercel.com",
  },
  {
    username: "evilrabbit",
    avatar: "https://github.com/evilrabbit.png",
    email: "evilrabbit@vercel.com",
  },
]

export function ItemDropdown() {
  return (
    <div className="flex min-h-64 w-full max-w-md flex-col items-center gap-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit">
            Select <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 [--radius:0.65rem]" align="end">
          {people.map((person) => (
            <DropdownMenuItem key={person.username} className="p-0">
              <Item size="sm" className="w-full p-2">
                <ItemMedia>
                  <Avatar className="size-8">
                    <AvatarImage src={person.avatar} className="grayscale" />
                    <AvatarFallback>{person.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="gap-0.5">
                  <ItemTitle>{person.username}</ItemTitle>
                  <ItemDescription>{person.email}</ItemDescription>
                </ItemContent>
              </Item>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```
```

--------------------------------

### Kbd Component Inside Tooltip

Source: https://ui.shadcn.com/docs/components/kbd

Demonstrates using Kbd and KbdGroup components within Tooltip components to display keyboard shortcuts in tooltips. Includes examples with Button and ButtonGroup components.

```tsx
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function KbdTooltip() {
  return (
    <div className="flex flex-wrap gap-4">
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              Save Changes <Kbd>S</Kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              Print
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              Print Document{" "}
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>P</Kbd>
              </KbdGroup>
            </div>
          </TooltipContent>
        </Tooltip>
      </ButtonGroup>
    </div>
  )
}
```

--------------------------------

### Implement a basic Shadcn UI Dialog in React

Source: https://ui.shadcn.com/docs/components/dialog

Shows the fundamental structure for a Shadcn UI Dialog, including a trigger button and content with a header, title, and description. This basic setup allows users to open a dialog to display information or ask for confirmation.

```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

--------------------------------

### Implement Basic Pagination Component (TypeScript React)

Source: https://ui.shadcn.com/docs/components/pagination

This TypeScript React example demonstrates how to set up a basic pagination component using shadcn/ui components. It includes previous/next links, page numbers, and an ellipsis for omitted pages. This component requires the imported Pagination components to be available.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function PaginationDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

--------------------------------

### Define Custom Animations with Keyframes and CSS Variables

Source: https://ui.shadcn.com/docs/registry/examples

Demonstrates how to create custom animations by defining both `@keyframes` in the css object and corresponding theme variables in `cssVars`. This pattern requires matching keyframe definitions and theme configuration to properly use animations in Tailwind classes.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-component",
  "type": "registry:component",
  "cssVars": {
    "theme": {
      "--animate-wiggle": "wiggle 1s ease-in-out infinite"
    }
  },
  "css": {
    "@keyframes wiggle": {
      "0%, 100%": {
        "transform": "rotate(-3deg)"
      },
      "50%": {
        "transform": "rotate(3deg)"
      }
    }
  }
}
```

--------------------------------

### Install Shadcn UI Sidebar Component via CLI

Source: https://ui.shadcn.com/docs/components/sidebar

This command uses npx to add the Shadcn UI Sidebar component to your project. It fetches the latest version and integrates `sidebar.tsx` into your components directory. Run this command in your project's terminal.

```bash
npx shadcn@latest add sidebar
```

--------------------------------

### Menu Action Active State Styling

Source: https://ui.shadcn.com/docs/components/sidebar

TSX example showing how to make a menu action visible when its associated menu button is in an active state using peer data attributes.

```tsx
<SidebarMenuItem>
  <SidebarMenuButton />
  <SidebarMenuAction className="peer-data-[active=true]/menu-button:opacity-100" />
</SidebarMenuItem>
```

--------------------------------

### Basic Usage of Shadcn/ui Aspect Ratio Component

Source: https://ui.shadcn.com/docs/components/aspect-ratio

This example demonstrates how to wrap an `Image` component within `AspectRatio` to enforce a `16/9` ratio, ensuring consistent display. The `Image` is styled to cover the allocated area and maintain rounded corners, adapting to the aspect ratio container.

```tsx
<AspectRatio ratio={16 / 9}>
  <Image src="..." alt="Image" className="rounded-md object-cover" />
</AspectRatio>
```

--------------------------------

### Create custom style from scratch without shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Define a standalone registry style that does not extend shadcn/ui (using `extends: none`) by specifying npm dependencies, registry dependencies for components, and custom CSS variables for theme colors. This enables creating entirely custom component systems independent of shadcn/ui defaults.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "extends": "none",
  "name": "new-style",
  "type": "registry:style",
  "dependencies": ["tailwind-merge", "clsx"],
  "registryDependencies": [
    "utils",
    "https://example.com/r/button.json",
    "https://example.com/r/input.json",
    "https://example.com/r/label.json",
    "https://example.com/r/select.json"
  ],
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "main": "#88aaee",
      "bg": "#dfe5f2",
      "border": "#000",
      "text": "#000",
      "ring": "#000"
    },
    "dark": {
      "main": "#88aaee",
      "bg": "#272933",
      "border": "#000",
      "text": "#e6e6e6",
      "ring": "#fff"
    }
  }
}
```

--------------------------------

### Empty State with Dashed Border Outline

Source: https://ui.shadcn.com/docs/components/empty

Example demonstrating an outlined empty state using the border utility class with dashed style. Includes cloud icon and upload files action button for file storage context.

```tsx
import { IconCloud } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyOutline() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconCloud />
        </EmptyMedia>
        <EmptyTitle>Cloud Storage Empty</EmptyTitle>
        <EmptyDescription>
          Upload files to your cloud storage to access them anywhere.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Upload Files
        </Button>
      </EmptyContent>
    </Empty>
  )
}
```

--------------------------------

### Import Progress Component

Source: https://ui.shadcn.com/docs/components/progress

Standard import statement for using the Progress component in your application. Import from the local UI components directory after installation.

```tsx
import { Progress } from "@/components/ui/progress"
```

--------------------------------

### Basic Tabs Usage with Two Panels

Source: https://ui.shadcn.com/docs/components/tabs

A simple example demonstrating how to create a tabbed interface with two tabs (Account and Password) using the Tabs component. Includes TabsList for tab navigation and TabsContent for panel content.

```tsx
<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Make changes to your account here.</TabsContent>
  <TabsContent value="password">Change your password here.</TabsContent>
</Tabs>
```

--------------------------------

### Configure TypeScript Path Aliases in tsconfig.json

Source: https://ui.shadcn.com/docs/installation/manual

This JSON configuration snippet updates the `tsconfig.json` file to define a base URL and path aliases for easier module imports. It maps the `@/*` alias to the project's root directory (`./*`), allowing for absolute imports.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

--------------------------------

### Multiple Plugins with Automatic Deduplication

Source: https://ui.shadcn.com/docs/registry/examples

Illustrates how to declare multiple Tailwind CSS plugins with npm dependencies. The system automatically groups plugins together and removes duplicates. Multiple dependencies are declared in an array and corresponding plugins are referenced in the css object.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "multiple-plugins",
  "type": "registry:item",
  "dependencies": [
    "@tailwindcss/typography",
    "@tailwindcss/forms",
    "tw-animate-css"
  ],
  "css": {
    "@plugin \"@tailwindcss/typography\"": {},
    "@plugin \"@tailwindcss/forms\"": {},
    "@plugin \"tw-animate-css\"": {}
  }
}
```

--------------------------------

### Configure custom shadcn registry in components.json

Source: https://ui.shadcn.com/docs/registry/namespace

Provides an example of how to configure a custom registry in the `components.json` file. This allows the shadcn CLI to resolve components from a specified URL pattern using a custom namespace.

```json
{
  "registries": {
    "@your-registry": "https://your-domain.com/r/{name}.json"
  }
}
```

--------------------------------

### Create Basic AppSidebar Component in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This snippet demonstrates a simple React component, `AppSidebar`, that wraps the `Sidebar` component. It serves as an example of how to integrate the main `Sidebar` component into an application.

```tsx
import { Sidebar } from "@/components/ui/sidebar"

export function AppSidebar() {
  return <Sidebar />
}
```

--------------------------------

### Complex Component Registry Configuration

Source: https://ui.shadcn.com/docs/registry/faq

A complete JSON schema defining a complex shadcn/ui registry item that includes a page, multiple components, a hook, utilities, and a config file with specified targets.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "hello-world",
  "title": "Hello World",
  "type": "registry:block",
  "description": "A complex hello world component",
  "files": [
    {
      "path": "registry/new-york/hello-world/page.tsx",
      "type": "registry:page",
      "target": "app/hello/page.tsx"
    },
    {
      "path": "registry/new-york/hello-world/components/hello-world.tsx",
      "type": "registry:component"
    },
    {
      "path": "registry/new-york/hello-world/components/formatted-message.tsx",
      "type": "registry:component"
    },
    {
      "path": "registry/new-york/hello-world/hooks/use-hello.ts",
      "type": "registry:hook"
    },
    {
      "path": "registry/new-york/hello-world/lib/format-date.ts",
      "type": "registry:utils"
    },
    {
      "path": "registry/new-york/hello-world/hello.config.ts",
      "type": "registry:file",
      "target": "~/hello.config.ts"
    }
  ]
}
```

--------------------------------

### Configure Tailwind and PostCSS in remix.config.js

Source: https://ui.shadcn.com/docs/installation/remix

Update the remix.config.js file to enable Tailwind CSS and PostCSS processing. This allows Remix to handle CSS compilation during development and build.

```javascript
/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ...
  tailwind: true,
  postcss: true,
  ...
};
```

--------------------------------

### Add Simple Utility Class in shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Create a simple custom utility class using @utility directive to add single CSS property utilities to Tailwind's utility layer for common styling needs.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-component",
  "type": "registry:component",
  "css": {
    "@utility content-auto": {
      "content-visibility": "auto"
    }
  }
}
```

--------------------------------

### Configure Tailwind CSS import path

Source: https://ui.shadcn.com/docs/components-json

Defines the path to the CSS file that imports Tailwind CSS into the project. This helps the CLI locate and understand the Tailwind setup.

```json
{
  "tailwind": {
    "css": "styles/global.css"
  }
}
```

--------------------------------

### shadcn CLI: Custom Error for Unknown Registry

Source: https://ui.shadcn.com/docs/changelog

The shadcn CLI now provides helpful error messages for unknown registries, instructing users to define them in their `components.json` file. This guides both users and LLMs on how to resolve configuration issues.

```txt
Unknown registry "@acme". Make sure it is defined in components.json as follows:
{
  "registries": {
    "@acme": "[URL_TO_REGISTRY]"
  }
}
```

--------------------------------

### Query Parameter Authentication Configuration

Source: https://ui.shadcn.com/docs/registry/authentication

Configure query parameter-based authentication for simpler registry setups. Appends authentication token as query parameter to the registry URL, resulting in URLs like https://registry.company.com/button.json?token=your_token.

```json
{
  "registries": {
    "@internal": {
      "url": "https://registry.company.com/{name}.json",
      "params": {
        "token": "${ACCESS_TOKEN}"
      }
    }
  }
}
```

--------------------------------

### Render Basic SidebarGroup Structure with Labels and Actions (TypeScript)

Source: https://ui.shadcn.com/docs/components/sidebar

This example demonstrates creating a fundamental `SidebarGroup` in a Shadcn UI sidebar. It showcases how to use `SidebarGroupLabel` for titles and `SidebarGroupContent` for nested menu items, along with an optional `SidebarGroupAction` to add interactive elements to the group header.

```tsx
"use client"

import { LifeBuoyIcon, SendIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Help</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <LifeBuoyIcon />
                    Support
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <SendIcon />
                    Feedback
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
```

```tsx
import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupAction>
            <Plus /> <span className="sr-only">Add Project</span>
          </SidebarGroupAction>
          <SidebarGroupContent></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

--------------------------------

### Install Shadcn UI Toggle Group component via CLI (Bash)

Source: https://ui.shadcn.com/docs/components/toggle-group

This command provides a quick way to add the ToggleGroup component to a project using the Shadcn UI CLI utility. It automatically fetches and integrates the component's files and dependencies.

```bash
npx shadcn@latest add toggle-group
```

--------------------------------

### Basic implementation of Shadcn UI Hover Card in React/TypeScript

Source: https://ui.shadcn.com/docs/components/hover-card

This code provides a minimal example of how to structure a `HoverCard` component using Shadcn UI. It wraps a trigger element with `HoverCardTrigger` and defines the content to be displayed in `HoverCardContent`. This serves as a foundational example for creating custom hover cards.

```tsx
<HoverCard>
  <HoverCardTrigger>Hover</HoverCardTrigger>
  <HoverCardContent>
    The React Framework – created and maintained by @vercel.
  </HoverCardContent>
</HoverCard>
```

--------------------------------

### React Router Home Route with Button Component

Source: https://ui.shadcn.com/docs/installation/react-router

Implements a React Router home page route that imports and uses the shadcn/ui Button component. Includes meta tags configuration and a centered layout using Tailwind CSS classes.

```typescript
import { Button } from "~/components/ui/button"

import type { Route } from "./+types/home"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ]
}

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button>Click me</Button>
    </div>
  )
}
```

--------------------------------

### Example `components.json` Configuration File

Source: https://ui.shadcn.com/docs/changelog

This JSON configuration file defines the structure and styling preferences for shadcn/ui components within a project. It specifies the default style, Tailwind CSS configuration (config path, CSS file, base color, CSS variable usage), React Server Components (RSC) setting, and import aliases for utilities and components.

```json
{
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "rsc": false,
  "aliases": {
    "utils": "~/lib/utils",
    "components": "~/components"
  }
}
```

--------------------------------

### Handle unknown shadcn registry errors

Source: https://ui.shadcn.com/docs/registry/namespace

Shows the error message encountered when attempting to install a component from a registry that is not configured in `components.json`. It also provides the JSON snippet for defining a new registry to resolve this error.

```bash
npx shadcn@latest add @non-existent/component
```

```txt
Unknown registry "@non-existent". Make sure it is defined in components.json as follows:
{
  "registries": {
    "@non-existent": "[URL_TO_REGISTRY]"
  }
}
```

--------------------------------

### Render Shadcn UI Navigation Menu with Diverse Content

Source: https://ui.shadcn.com/docs/components/navigation-menu

This example demonstrates how to construct a Shadcn UI Navigation Menu using `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, and `NavigationMenuContent`. It showcases various item types, including detailed links with descriptions, simple text links, and links augmented with icons, all wrapped in a functional React component.

```tsx
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"; // Adjust import path as necessary
import { CircleHelpIcon, CircleIcon, CircleCheckIcon } from "lucide-react";
```

--------------------------------

### Basic Toggle Component

Source: https://ui.shadcn.com/docs/components/toggle

Simple Toggle component with default styling and behavior. Provides the minimal setup needed to render a functional two-state button.

```tsx
<Toggle>Toggle</Toggle>
```

--------------------------------

### Combined Imports and Plugins with Ordered CSS Processing

Source: https://ui.shadcn.com/docs/registry/examples

Shows the proper ordering of CSS directives in shadcn UI: imports first, then plugins, followed by layer and utility declarations. This pattern ensures correct CSS cascade and specificity when using both `@import` and `@plugin` directives with custom layers and utilities.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "combined-example",
  "type": "registry:item",
  "dependencies": ["@tailwindcss/typography", "tw-animate-css"],
  "css": {
    "@import \"tailwindcss\"": {},
    "@import url(\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap\")": {},
    "@plugin \"@tailwindcss/typography\"": {},
    "@plugin \"tw-animate-css\"": {},
    "@layer base": {
      "body": {
        "font-family": "Inter, sans-serif"
      }
    },
    "@utility content-auto": {
      "content-visibility": "auto"
    }
  }
}
```

--------------------------------

### Comprehensive Form Example with shadcn UI Field Components in TypeScript React

Source: https://ui.shadcn.com/docs/changelog

This extensive example presents a payment method form demonstrating the versatility of shadcn UI's `Field` component and its sub-components. It showcases a structured layout using `FieldLegend`, `FieldDescription`, and `FieldGroup`, integrating various UI controls like `Input` and `Select` for collecting payment details.

```tsx
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function FieldDemo() {
  return (
    <div className="w-full max-w-md">
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Payment Method</FieldLegend>
            <FieldDescription>
              All transactions are secure and encrypted
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                  Name on Card
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-name-43j"
                  placeholder="Evil Rabbit"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  Card Number
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-number-uw1"
                  placeholder="1234 5678 9012 3456"
                  required
                />
                <FieldDescription>
                  Enter your 16-digit card number
                </FieldDescription>
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="checkout-exp-month-ts6">
                    Month
                  </FieldLabel>
                  <Select defaultValue="">
                    <SelectTrigger id="checkout-exp-month-ts6">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01</SelectItem>
                      <SelectItem value="02">02</SelectItem>
                      <SelectItem value="03">03</SelectItem>
                      <SelectItem value="04">04</SelectItem>
                      <SelectItem value="05">05</SelectItem>
                      <SelectItem value="06">06</SelectItem>
                      <SelectItem value="07">07</SelectItem>
                      <SelectItem value="08">08</SelectItem>
                      <SelectItem value="09">09</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkout-7j9-exp-year-f59">
                    Year
                  </FieldLabel>
                  <Select defaultValue="">
                    <SelectTrigger id="checkout-7j9-exp-year-f59">
                      <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent>

```

--------------------------------

### Implement a Nested Sidebar Menu with `SidebarMenuSub` in TypeScript/React

Source: https://ui.shadcn.com/docs/components/sidebar

This example demonstrates how to integrate `SidebarMenuSub` components to create a multi-level sidebar navigation. It uses a predefined `items` array to dynamically render main menu items with nested sub-items, utilizing `SidebarProvider`, `Sidebar`, and other related components for a complete menu structure.

```tsx
"use client"\n\nimport {\n  Sidebar,\n  SidebarContent,\n  SidebarGroup,\n  SidebarGroupContent,\n  SidebarMenu,\n  SidebarMenuButton,\n  SidebarMenuItem,\n  SidebarMenuSub,\n  SidebarMenuSubButton,\n  SidebarMenuSubItem,\n  SidebarProvider,\n} from \"@/components/ui/sidebar\"\n\nconst items = [\n  {\n    title: \"Getting Started\",\n    url: \"#\",\n    items: [\n      {\n        title: \"Installation\",\n        url: \"#\",\n      },\n      {\n        title: \"Project Structure\",\n        url: \"#\",\n      },\n    ],\n  },\n  {\n    title: \"Building Your Application\",\n    url: \"#\",\n    items: [\n      {\n        title: \"Routing\",\n        url: \"#\",\n      },\n      {\n        title: \"Data Fetching\",\n        url: \"#\",\n        isActive: true,\n      },\n      {\n        title: \"Rendering\",\n        url: \"#\",\n      },\n      {\n        title: \"Caching\",\n        url: \"#\",\n      },\n      {\n        title: \"Styling\",\n        url: \"#\",\n      },\n      {\n        title: \"Optimizing\",\n        url: \"#\",\n      },\n      {\n        title: \"Configuring\",\n        url: \"#\",\n      },\n      {\n        title: \"Testing\",\n        url: \"#\",\n      },\n      {\n        title: \"Authentication\",\n        url: \"#\",\n      },\n      {\n        title: \"Deploying\",\n        url: \"#\",\n      },\n      {\n        title: \"Upgrading\",\n        url: \"#\",\n      },\n      {\n        title: \"Examples\",\n        url: \"#\",\n      },\n    ],\n  },\n  {\n    title: \"API Reference\",\n    url: \"#\",\n    items: [\n      {\n        title: \"Components\",\n        url: \"#\",\n      },\n      {\n        title: \"File Conventions\",\n        url: \"#\",\n      },\n      {\n        title: \"Functions\",\n        url: \"#\",\n      },\n      {\n        title: \"next.config.js Options\",\n        url: \"#\",\n      },\n      {\n        title: \"CLI\",\n        url: \"#\",\n      },\n      {\n        title: \"Edge Runtime\",\n        url: \"#\",\n      },\n    ],\n  },\n  {\n    title: \"Architecture\",\n    url: \"#\",\n    items: [\n      {\n        title: \"Accessibility\",\n        url: \"#\",\n      },\n      {\n        title: \"Fast Refresh\",\n        url: \"#\",\n      },\n      {\n        title: \"Next.js Compiler\",\n        url: \"#\",\n      },\n      {\n        title: \"Supported Browsers\",\n        url: \"#\",\n      },\n      {\n        title: \"Turbopack\",\n        url: \"#\",\n      },\n    ],\n  },\n]\n\nexport function AppSidebar() {\n  return (\n    <SidebarProvider>\n      <Sidebar>\n        <SidebarContent>\n          <SidebarGroup>\n            <SidebarGroupContent>\n              <SidebarMenu>\n                {items.map((item, index) => (\n                  <SidebarMenuItem key={index}>\n                    <SidebarMenuButton asChild>\n                      <a href={item.url}>\n                        <span>{item.title}</span>\n                      </a>\n                    </SidebarMenuButton>\n                    <SidebarMenuSub>\n                      {item.items.map((subItem, subIndex) => (\n                        <SidebarMenuSubItem key={subIndex}>\n                          <SidebarMenuSubButton asChild>\n                            <a href={subItem.url}>\n                              <span>{subItem.title}</span>\n                            </a>\n                          </SidebarMenuSubButton>\n                        </SidebarMenuSubItem>\n                      ))}\n                    </SidebarMenuSub>\n                  </SidebarMenuItem>\n                ))}\n              </SidebarMenu>\n            </SidebarGroupContent>\n          </SidebarGroup>\n        </SidebarContent>\n      </Sidebar>\n    </SidebarProvider>\n  )\n}
```

--------------------------------

### Import Tailwind CSS in Remix Root Component

Source: https://ui.shadcn.com/docs/installation/remix

Import the tailwind.css stylesheet in your app/root.tsx file and add it to the links function to ensure global styles are applied throughout the application.

```typescript
import styles from "./tailwind.css?url"

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
]
```

--------------------------------

### Add Basic CSS Imports in shadcn/ui Registry

Source: https://ui.shadcn.com/docs/registry/examples

Include CSS imports in registry items using @import directives to load external stylesheets and frameworks. Imports are automatically placed at the top of generated CSS files.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-import",
  "type": "registry:component",
  "css": {
    "@import \"tailwindcss\"": {},
    "@import \"./styles/base.css\"": {}
  }
}
```

--------------------------------

### Integrate Select with ButtonGroup (Shadcn UI, React)

Source: https://ui.shadcn.com/docs/components/button-group

This example demonstrates how to combine a `Select` component with a `ButtonGroup` to create an interactive currency selection input. It showcases state management using `useState` for the selected currency and maps through a predefined list of currencies to populate the select options.

```tsx
"use client"\n\nimport * as React from \"react\"\nimport { ArrowRightIcon } from \"lucide-react\"\n\nimport { Button } from \"@/components/ui/button\"\nimport { ButtonGroup } from \"@/components/ui/button-group\"\nimport { Input } from \"@/components/ui/input\"\nimport {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n} from \"@/components/ui/select\"\n\nconst CURRENCIES = [\n  {\n    value: \"$\",\n    label: \"US Dollar\",\n  },\n  {\n    value: \"€\",\n    label: \"Euro\",\n  },\n  {\n    value: \"£\",\n    label: \"British Pound\",\n  },\n]\n\nexport function ButtonGroupSelect() {\n  const [currency, setCurrency] = React.useState("$")\n\n  return (\n    <ButtonGroup>\n      <ButtonGroup>\n        <Select value={currency} onValueChange={setCurrency}>\n          <SelectTrigger className=\"font-mono\">{currency}</SelectTrigger>\n          <SelectContent className=\"min-w-24\">\n            {CURRENCIES.map((currency) => (\n              <SelectItem key={currency.value} value={currency.value}>\n                {currency.value}{\" \"}\n                <span className=\"text-muted-foreground\">{currency.label}</span>\n              </SelectItem>\n            ))}\n          </SelectContent>\n        </Select>\n        <Input placeholder=\"10.00\" pattern=\"[0-9]*\" />\n      </ButtonGroup>\n      <ButtonGroup>\n        <Button aria-label=\"Send\" size=\"icon\" variant=\"outline\">\n          <ArrowRightIcon />\n        </Button>\n      </ButtonGroup>\n    </ButtonGroup>\n  )\n}
```

--------------------------------

### Migrate React Component from `forwardRef` to Props

Source: https://ui.shadcn.com/docs/tailwind-v4

This example demonstrates how to refactor a React component to remove `React.forwardRef`. It shows the transformation from using `forwardRef` and `displayName` to a simpler named functional component that accepts props directly and includes a `data-slot` attribute.

```tsx
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b last:border-b-0", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"
```

```tsx
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}
```

--------------------------------

### Render Basic Shadcn UI Slider Component (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/slider

This example shows the fundamental usage of the `Slider` component with essential props like `defaultValue`, `max`, and `step`. It provides a ready-to-use instance for rendering a slider in your application.

```tsx
<Slider defaultValue={[33]} max={100} step={1} />
```

--------------------------------

### EmptyMedia Component with Avatar

Source: https://ui.shadcn.com/docs/components/empty

Display an avatar in the empty state using EmptyMedia with default variant. This example demonstrates nesting AvatarImage and AvatarFallback components within EmptyMedia for a complete avatar display in empty state UI.

```tsx
<EmptyMedia>
  <Avatar>
    <AvatarImage src="..." />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
</EmptyMedia>
```

--------------------------------

### EmptyContent Component with Button Action

Source: https://ui.shadcn.com/docs/components/empty

Display interactive content like buttons, inputs, or links in an empty state using EmptyContent component. This example shows a button for user action and supports className prop for styling customization.

```tsx
<EmptyContent>
  <Button>Add Project</Button>
</EmptyContent>
```

--------------------------------

### Registry Authentication for Open in v0

Source: https://ui.shadcn.com/docs/registry/open-in-v0

This section describes the recommended authentication mechanism for registry servers to integrate with Open in v0. Registry items can be accessed with a `token` query parameter for authentication.

```APIDOC
## GET /r/{item}.json (Registry Server Authentication)

### Description
This describes how a registry server should implement authentication for its items when accessed by `Open in v0`. It uses a `token` query parameter for authentication.

### Method
GET

### Endpoint
/r/{item}.json

### Parameters
#### Path Parameters
- **item** (string) - Required - The path to the specific registry item, typically ending with `.json`.

#### Query Parameters
- **token** (string) - Optional - A secure token used to authenticate access to the registry item. If provided, the server should validate it.

#### Request Body
(None)

### Request Example
(N/A for GET request with query parameters)

### Response
#### Success Response (200)
- Returns the content of the registry item (e.g., JSON).

#### Response Example
```json
{
  "name": "login-01",
  "description": "A login form with email and password fields.",
  "component": "<Login01 />"
}
```

#### Error Response (401 Unauthorized)
- **error** (string) - The error type, typically "Unauthorized".
- **message** (string) - A descriptive message about the authorization failure.

#### Response Example
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```
```

--------------------------------

### Example JSX with CSS Variables for Theming

Source: https://ui.shadcn.com/docs/changelog

This JSX snippet demonstrates applying styling using CSS variables like `bg-background` and `text-foreground`. These variables abstract color values, allowing for easier theme switching and consistency across components when CSS variables are enabled in the configuration.

```tsx
<div className="bg-background text-foreground" />
```

--------------------------------

### Basic Breadcrumb Usage

Source: https://ui.shadcn.com/docs/components/breadcrumb

A simple breadcrumb navigation example showing home, components, and current breadcrumb page. Demonstrates the standard structure with items, separators, and the current page indicator.

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/components">Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

--------------------------------

### Import Toggle Component

Source: https://ui.shadcn.com/docs/components/toggle

Basic import statement to use the Toggle component in your React application. This is the standard way to access the component after installation.

```tsx
import { Toggle } from "@/components/ui/toggle"
```

--------------------------------

### Full App Sidebar Implementation with SidebarGroupAction (TSX)

Source: https://ui.shadcn.com/docs/components/sidebar

This comprehensive example demonstrates how to construct an `AppSidebar` component using Shadcn UI. It showcases the integration of `SidebarGroupAction` within a `SidebarGroup` to add an 'Add Project' button, utilizing `lucide-react` icons and `sonner` toasts for interactive feedback. The component provides a structured navigation for various project categories.

```tsx
"use client"

import { FrameIcon, MapIcon, PieChartIcon, PlusIcon } from "lucide-react"
import { toast, Toaster } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Toaster
        position="bottom-left"
        toastOptions={{
          className: "ml-[160px]",
        }}
      />
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupAction
              title="Add Project"
              onClick={() => toast("You clicked the group action!")}
            >
              <PlusIcon /> <span className="sr-only">Add Project</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      <FrameIcon />
                      <span>Design Engineering</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      <PieChartIcon />
                      <span>Sales & Marketing</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      <MapIcon />
                      <span>Travel</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
```

--------------------------------

### InputGroupTextarea with Button

Source: https://ui.shadcn.com/docs/components/input-group

Example of using InputGroupTextarea with a block-end aligned button addon for message inputs.

```tsx
<InputGroup>
  <InputGroupTextarea placeholder="Enter message..." />
  <InputGroupAddon align="block-end">
    <InputGroupButton>Send</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

--------------------------------

### Add Custom Theme Variables to shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Define custom CSS variables in the theme object to extend shadcn/ui's design system with project-specific values for typography, shadows, and other design tokens.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-theme",
  "type": "registry:theme",
  "cssVars": {
    "theme": {
      "font-heading": "Inter, sans-serif",
      "shadow-card": "0 0 0 1px rgba(0, 0, 0, 0.1)"
    }
  }
}
```

--------------------------------

### Generate Tokens with Expiration

Source: https://ui.shadcn.com/docs/registry/authentication

Create secure authentication tokens with automatic expiration dates for enhanced security. Tokens expire after a specified period (30 days in this example) to limit exposure from compromised credentials.

```typescript
function generateToken() {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return { token, expiresAt }
}
```

--------------------------------

### Configure shadcn MCP Server for VS Code

Source: https://ui.shadcn.com/docs/mcp

This snippet illustrates how to configure the shadcn MCP server for VS Code and GitHub Copilot by adding a 'shadcn' server definition to the '.vscode/mcp.json' file. The configuration uses 'npx shadcn@latest mcp' to start the server, enabling component interaction within VS Code.

```json
{
  "servers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

--------------------------------

### Initialize shadcn MCP Server for AI Clients

Source: https://ui.shadcn.com/docs/mcp

These commands initialize the shadcn MCP server for integration with various AI development environments. Each command specifies a target client (Claude Code, Cursor, VS Code, Codex), setting up the necessary configuration to enable AI assistants to browse, search, and install components. For Codex, an additional TOML configuration is required.

```bash
npx shadcn@latest mcp init --client claude
```

```bash
npx shadcn@latest mcp init --client cursor
```

```bash
npx shadcn@latest mcp init --client vscode
```

```bash
npx shadcn@latest mcp init --client codex
```

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

--------------------------------

### Add Component CSS Layer in shadcn/ui

Source: https://ui.shadcn.com/docs/registry/examples

Define component-level styles using Tailwind's @layer components directive to create reusable styled components like cards with consistent design properties.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-card",
  "type": "registry:component",
  "css": {
    "@layer components": {
      "card": {
        "background-color": "var(--color-white)",
        "border-radius": "var(--rounded-lg)",
        "padding": "var(--spacing-6)",
        "box-shadow": "var(--shadow-xl)"
      }
    }
  }
}
```

--------------------------------

### Configure TypeScript Path Aliases in tsconfig.json

Source: https://ui.shadcn.com/docs/installation/astro

Add path aliases to the TypeScript configuration to enable cleaner imports using the @ symbol. This resolves @/* to ./src/* for better code organization and maintainability.

```typescript
{
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
    // ...
  }
}
```

--------------------------------

### Kbd Component Demo with Multiple Keys

Source: https://ui.shadcn.com/docs/components/kbd

Shows a complete demo component displaying multiple keyboard keys and key combinations using both Kbd and KbdGroup components. Illustrates Mac modifier keys and Windows keyboard shortcuts.

```tsx
import { Kbd, KbdGroup } from "@/components/ui/kbd"

export function KbdDemo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>⌥</Kbd>
        <Kbd>⌃</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>B</Kbd>
      </KbdGroup>
    </div>
  )
}
```

--------------------------------

### Render a basic Shadcn UI Avatar with image and fallback

Source: https://ui.shadcn.com/docs/components/avatar

Shows a basic example of how to render an `Avatar` component with an `AvatarImage` for the source and an `AvatarFallback` for when the image fails to load. The `src` and `alt` attributes are provided for the image, and fallback text is given for `AvatarFallback` to ensure content is always displayed.

```tsx
<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

--------------------------------

### Authenticate registry requests - Next.js (TypeScript)

Source: https://ui.shadcn.com/docs/registry/open-in-v0

Example Next.js API route that validates a `token` query parameter and returns a 401 JSON error for invalid or missing tokens. Dependencies: NextRequest, NextResponse, and an `isValidToken` function plus a `registryItem` to return on success. Limitation: `isValidToken` and `registryItem` are placeholders and must be implemented according to your auth and data models.

```typescript
// Next.js API route example
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!isValidToken(token)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid or missing token",
      },
      { status: 401 }
    )
  }

  // Return the registry item
  return NextResponse.json(registryItem)
}

```

--------------------------------

### Define Registry Dependencies in Registry Item (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This JSON snippet from a `registry-item.json` shows how components declare their `registryDependencies`. It illustrates how dependencies from various registries are listed, enabling the CLI to automatically resolve and install them.

```json
{
  "name": "dashboard",
  "type": "registry:block",
  "registryDependencies": [
    "@shadcn/card",
    "@v0/chart",
    "@acme/data-table",
    "@lib/data-fetcher",
    "@ai/analytics-prompt"
  ]
}
```

--------------------------------

### Basic Collapsible Component Usage in TypeScript React

Source: https://ui.shadcn.com/docs/components/collapsible

This example illustrates the fundamental structure for implementing a collapsible component using Shadcn UI. It shows how to wrap content with `Collapsible`, define a `CollapsibleTrigger` to toggle visibility, and place the expandable content within `CollapsibleContent` to create a basic interactive section.

```tsx
<Collapsible>
  <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
  <CollapsibleContent>
    Yes. Free to use for personal and commercial projects. No attribution
    required.
  </CollapsibleContent>
</Collapsible>
```

--------------------------------

### shadcn CLI: Migrate Imports to New radix-ui Package

Source: https://ui.shadcn.com/docs/changelog

The shadcn CLI introduces a new command to migrate existing projects from `@radix-ui/react-*` imports to the new `radix-ui` package. This command automatically updates imports in `ui` components and installs the necessary dependency, streamlining the upgrade process.

```bash
npx shadcn@latest migrate radix
```

--------------------------------

### Empty State with Header and Multiple Actions in Shadcn UI

Source: https://ui.shadcn.com/docs/changelog

This snippet showcases a more complex `Empty` component setup using `EmptyHeader` to group the media, title, and description. It includes multiple action buttons and a link, demonstrating how to provide richer user interactions for empty states, such as creating or importing projects.

```tsx
import { IconFolderCode } from "@tabler/icons-react"
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"

export function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating
          your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Create Project</Button>
          <Button variant="outline">Import Project</Button>
        </div>
      </EmptyContent>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <a href="#">
          Learn More <ArrowUpRightIcon />
        </a>
      </Button>
    </Empty>
  )
}
```

--------------------------------

### Spinner Component Basic Usage - React/TypeScript

Source: https://ui.shadcn.com/docs/changelog

Shows how to implement a basic Spinner component within a flex container. This example wraps the Spinner in a centered layout using Tailwind CSS classes for demonstration purposes.

```tsx
import { Spinner } from "@/components/ui/spinner"

export function SpinnerBasic() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <Spinner />
    </div>
  )
}
```

--------------------------------

### Create Menubar Component with File, Edit, View, and Profiles Menus - TypeScript React

Source: https://ui.shadcn.com/docs/components/menubar

Implements a full-featured menubar component demonstrating multiple menu sections with nested submenus, checkbox items, radio groups, keyboard shortcuts, and disabled states. This example shows how to structure a desktop-style application menu with File, Edit, View, and Profiles menus using shadcn/ui Menubar components.

```tsx
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"

export function MenubarDemo() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            New Window <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>New Incognito Window</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Email link</MenubarItem>
              <MenubarItem>Messages</MenubarItem>
              <MenubarItem>Notes</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>
            Print... <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Find</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Search the web</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Find...</MenubarItem>
              <MenubarItem>Find Next</MenubarItem>
              <MenubarItem>Find Previous</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>Cut</MenubarItem>
          <MenubarItem>Copy</MenubarItem>
          <MenubarItem>Paste</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
          <MenubarCheckboxItem checked>
            Always Show Full URLs
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarItem inset>
            Reload <MenubarShortcut>⌘R</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled inset>
            Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem inset>Toggle Fullscreen</MenubarItem>
          <MenubarSeparator />
          <MenubarItem inset>Hide Sidebar</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Profiles</MenubarTrigger>
        <MenubarContent>
          <MenubarRadioGroup value="benoit">
            <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
            <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
            <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
          </MenubarRadioGroup>
          <MenubarSeparator />
          <MenubarItem inset>Edit...</MenubarItem>
          <MenubarSeparator />
          <MenubarItem inset>Add Profile...</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
```

--------------------------------

### Define custom theme with OKLCH color values

Source: https://ui.shadcn.com/docs/registry/examples

Create a custom registry theme using OKLCH color space for light and dark modes, defining colors for background, foreground, primary, ring, and sidebar-specific variables. OKLCH provides perceptually uniform color values for better color consistency across themes.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-theme",
  "type": "registry:theme",
  "cssVars": {
    "light": {
      "background": "oklch(1 0 0)",
      "foreground": "oklch(0.141 0.005 285.823)",
      "primary": "oklch(0.546 0.245 262.881)",
      "primary-foreground": "oklch(0.97 0.014 254.604)",
      "ring": "oklch(0.746 0.16 232.661)",
      "sidebar-primary": "oklch(0.546 0.245 262.881)",
      "sidebar-primary-foreground": "oklch(0.97 0.014 254.604)",
      "sidebar-ring": "oklch(0.746 0.16 232.661)"
    },
    "dark": {
      "background": "oklch(1 0 0)",
      "foreground": "oklch(0.141 0.005 285.823)",
      "primary": "oklch(0.707 0.165 254.624)",
      "primary-foreground": "oklch(0.97 0.014 254.604)",
      "ring": "oklch(0.707 0.165 254.624)",
      "sidebar-primary": "oklch(0.707 0.165 254.624)",
      "sidebar-primary-foreground": "oklch(0.97 0.014 254.604)",
      "sidebar-ring": "oklch(0.707 0.165 254.624)"
    }
  }
}
```

--------------------------------

### Create a New TanStack Router Project with shadcn/ui

Source: https://ui.shadcn.com/docs/installation/tanstack-router

This command initializes a new TanStack Router project, pre-configured with a file-based router, Tailwind CSS, and integrated support for shadcn/ui components, setting up the foundational development environment.

```bash
npx create-tsrouter-app@latest my-app --template file-router --tailwind --add-ons shadcn
```

--------------------------------

### Separator Component Basic Usage - TSX

Source: https://ui.shadcn.com/docs/components/separator

Minimal example showing how to render a basic horizontal Separator component. Can be customized with className prop to adjust spacing and styling.

```typescript
<Separator />
```

--------------------------------

### Configure Namespaced Registries in components.json

Source: https://ui.shadcn.com/docs/changelog

Configure multiple namespaced registries with URLs and optional authentication headers. This enables component installation from different sources using the @registry/name format. Registries can be public URLs or include Bearer token authentication via environment variables.

```json
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json",
    "@internal": {
      "url": "https://registry.company.com/{name}",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

--------------------------------

### Build Next.js Form with Field Component

Source: https://ui.shadcn.com/docs/forms/next

This example demonstrates the basic structure of a form in Next.js using the `<Form />` and `<Field />` components, integrated with `useActionState` for managing form state and errors. It shows how to bind form elements, display errors, and handle disabled states to create an accessible form.

```tsx
<Form action={formAction}>
  <FieldGroup>
    <Field data-invalid={!!formState.errors?.title?.length}>
      <FieldLabel htmlFor="title">Bug Title</FieldLabel>
      <Input
        id="title"
        name="title"
        defaultValue={formState.values.title}
        disabled={pending}
        aria-invalid={!!formState.errors?.title?.length}
        placeholder="Login button not working on mobile"
        autoComplete="off"
      />
      <FieldDescription>
        Provide a concise title for your bug report.
      </FieldDescription>
      {formState.errors?.title && (
        <FieldError>{formState.errors.title[0]}</FieldError>
      )}
    </Field>
  </FieldGroup>
  <Button type="submit">Submit</Button>
</Form>
```

--------------------------------

### Configure TypeScript Path Resolution in tsconfig.json

Source: https://ui.shadcn.com/docs/installation/gatsby

Configure the TypeScript compiler to resolve path aliases starting with '@/' to the './src/' directory. This enables cleaner import statements throughout your project.

```typescript
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  }
}
```

--------------------------------

### Configure Shadcn Registries with URL Templates (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This configuration demonstrates how to define multiple namespaced registries using simple URL template strings in the `components.json` file. Each registry maps a namespace (e.g., `@v0`, `@acme`) to a base URL where resources can be fetched. The `{name}` placeholder in the URL is automatically replaced with the requested resource name during installation.

```json
{
  "registries": {
    "@v0": "https://v0.dev/chat/b/{name}",
    "@acme": "https://registry.acme.com/resources/{name}.json",
    "@lib": "https://lib.company.com/utilities/{name}",
    "@ai": "https://ai-resources.com/r/{name}.json"
  }
}
```

--------------------------------

### Add custom brand color to shadcn/ui style

Source: https://ui.shadcn.com/docs/registry/examples

Extend the default shadcn/ui style by adding a custom `brand` color variable with OKLCH values for both light and dark modes. This approach maintains shadcn/ui defaults while introducing brand-specific color customization.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-style",
  "type": "registry:style",
  "cssVars": {
    "light": {
      "brand": "oklch(0.99 0.00 0)"
    },
    "dark": {
      "brand": "oklch(0.14 0.00 286)"
    }
  }
}
```

--------------------------------

### Basic Empty State Usage Pattern

Source: https://ui.shadcn.com/docs/components/empty

Minimal implementation pattern showing the structure of an Empty component with header, media icon, title, description, and content with an action button.

```tsx
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <Icon />
    </EmptyMedia>
    <EmptyTitle>No data</EmptyTitle>
    <EmptyDescription>No data found</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button>Add data</Button>
  </EmptyContent>
</Empty>
```

--------------------------------

### Search shadcn registries for resources

Source: https://ui.shadcn.com/docs/registry/namespace

Illustrates how to search for available resources across different registries using the 'search' command. This includes searching specific registries, querying results, searching multiple registries, limiting results, and listing all items.

```bash
npx shadcn@latest search @v0
```

```bash
npx shadcn@latest search @acme --query "auth"
```

```bash
npx shadcn@latest search @v0 @acme @lib
```

```bash
npx shadcn@latest search @v0 --limit 10 --offset 20
```

```bash
npx shadcn@latest list @acme
```

--------------------------------

### Implement Sidebar Footer with Dropdown Menu (Shadcn UI, TSX)

Source: https://ui.shadcn.com/docs/components/sidebar

This TypeScript React example demonstrates how to integrate a `DropdownMenu` component into the `SidebarFooter`. It uses several Shadcn UI components including `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuItem`, and `SidebarMenuButton` to create a functional sidebar with an interactive footer for user actions.

```tsx
"use client"

import { ChevronUpIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    Username
                    <ChevronUpIcon className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-(--radix-popper-anchor-width)"
                >
                  <DropdownMenuItem>
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center justify-between px-4">
          <SidebarTrigger />
        </header>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

```tsx
export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> Username
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
```

--------------------------------

### Add Base Styles Layer in shadcn/ui CSS

Source: https://ui.shadcn.com/docs/registry/examples

Define global base styles using Tailwind's @layer directive to style HTML elements like headings with theme variables, ensuring consistent typography across the application.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-style",
  "type": "registry:style",
  "css": {
    "@layer base": {
      "h1": {
        "font-size": "var(--text-2xl)"
      },
      "h2": {
        "font-size": "var(--text-xl)"
      }
    }
  }
}
```

--------------------------------

### Configure TypeScript path aliases in tsconfig.json

Source: https://ui.shadcn.com/docs/installation/vite

Adds `baseUrl` and `paths` properties to the `compilerOptions` section of `tsconfig.json`. This configuration helps resolve module imports starting with `@/` to the `./src` directory, improving code organization and developer experience.

```typescript
{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.node.json"
    }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

--------------------------------

### Create Nested ButtonGroups for Complex Layouts (Shadcn UI, React)

Source: https://ui.shadcn.com/docs/components/button-group

This example shows how to achieve more intricate layouts and manage spacing by nesting multiple `ButtonGroup` components. It illustrates a common pattern for organizing related sets of buttons or components within a larger group.

```tsx
<ButtonGroup>\n  <ButtonGroup />\n  <ButtonGroup />\n</ButtonGroup>
```

--------------------------------

### Define Basic Shadcn UI Card Structure (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/card

This example demonstrates the fundamental JSX structure for a Shadcn UI Card, showcasing how to nest its main sections: CardHeader, CardContent, and CardFooter. It also illustrates the placement of CardTitle, CardDescription, and CardAction within the header. This provides a foundational template for building more complex UI cards.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
    <CardAction>Card Action</CardAction>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
```

--------------------------------

### Display DropdownMenu for SidebarMenuItem Action in TypeScript/React

Source: https://ui.shadcn.com/docs/components/sidebar

This concise TypeScript/React example focuses on embedding a Shadcn `DropdownMenu` directly within a `SidebarMenuItem`'s `SidebarMenuAction`. It shows the minimal structure required to display contextual options, such as 'Edit Project' and 'Delete Project', when an action icon is clicked. This snippet assumes the necessary Shadcn `DropdownMenu` and `Sidebar` components are imported and available.

```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <a href="#">
      <Home />
      <span>Home</span>
    </a>
  </SidebarMenuButton>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <SidebarMenuAction>
        <MoreHorizontal />
      </SidebarMenuAction>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="right" align="start">
      <DropdownMenuItem>
        <span>Edit Project</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <span>Delete Project</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</SidebarMenuItem>
```

--------------------------------

### Add Labels and Tooltips to Input Groups (Shadcn UI, TSX)

Source: https://ui.shadcn.com/docs/components/input-group

This example demonstrates how to incorporate `Label` components within `InputGroupAddon` for improved accessibility and clarity of input fields. It also shows the integration of a `Tooltip` with an `InfoIcon` to provide additional context or help information, enhancing the user's understanding of the input's purpose.

```tsx
import { InfoIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function InputGroupLabel() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupInput id="email" placeholder="shadcn" />
        <InputGroupAddon>
          <Label htmlFor="email">@</Label>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput id="email-2" placeholder="shadcn@vercel.com" />
        <InputGroupAddon align="block-start">
          <Label htmlFor="email-2" className="text-foreground">
            Email
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton
                variant="ghost"
                aria-label="Help"
                className="ml-auto rounded-full"
                size="icon-xs"
              >
                <InfoIcon />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>We&apos;ll use this to send you notifications</p>
            </TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Integrate ChartTooltip with Default Content Component

Source: https://ui.shadcn.com/docs/components/chart

This example illustrates how to utilize the `ChartTooltip` component in a React application by passing `ChartTooltipContent` as its `content` prop. This configuration creates a basic, functional chart tooltip that displays default information, providing a quick way to add tooltip interactivity to charts.

```tsx
<ChartTooltip content={<ChartTooltipContent />} />
```

--------------------------------

### Define Registry URL with Name Placeholder (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This configuration snippet illustrates the use of the required `{name}` placeholder in a registry URL. The placeholder is dynamically replaced with the resource's name when a component is installed, allowing a single URL pattern to fetch various resources from a namespace.

```json
{
  "@acme": "https://registry.acme.com/{name}.json"
}
```

--------------------------------

### React Button Group Demo

Source: https://ui.shadcn.com/docs/components/button-group

Demonstrates the usage of ButtonGroup component, including different button styles and dropdown menu integration. It utilizes various icons and components for a practical example.  The component handles state for dropdown menus and labels.

```tsx
"use client"

import * as React from "react"
import {
  ArchiveIcon,
  ArrowLeftIcon,
  CalendarPlusIcon,
  ClockIcon,
  ListFilterIcon,
  MailCheckIcon,
  MoreHorizontalIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ButtonGroupDemo() {
  const [label, setLabel] = React.useState("personal")

  return (
    <ButtonGroup>
      <ButtonGroup className="hidden sm:flex">
        <Button variant="outline" size="icon" aria-label="Go Back">
          <ArrowLeftIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Snooze</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More Options">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <MailCheckIcon />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArchiveIcon />
                Archive
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <ClockIcon />
                Snooze
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarPlusIcon />
                Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ListFilterIcon />
                Add to List
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TagIcon />
                  Label As...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={label}
                    onValueChange={setLabel}
                  >
                    <DropdownMenuRadioItem value="personal">
                      Personal
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="work">
                      Work
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="other">
                      Other
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <Trash2Icon />
                Trash
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </ButtonGroup>
  )
}

```

--------------------------------

### Item Component Variants Example - TSX

Source: https://ui.shadcn.com/docs/components/item

Demonstrates three Item variants: default (subtle styling), outline (clear borders), and muted (subdued colors). Each includes content with title, description, and action button.

```tsx
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"

export function ItemVariant() {
  return (
    <div className="flex flex-col gap-6">
      <Item>
        <ItemContent>
          <ItemTitle>Default Variant</ItemTitle>
          <ItemDescription>
            Standard styling with subtle background and borders.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Outline Variant</ItemTitle>
          <ItemDescription>
            Outlined style with clear borders and transparent background.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </ItemActions>
      </Item>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted Variant</ItemTitle>
          <ItemDescription>
            Subdued appearance with muted colors for secondary content.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
```

--------------------------------

### Initialize Form with React Hook Form and Zod Resolver

Source: https://ui.shadcn.com/docs/components/form

This code demonstrates the complete setup of a form using the `useForm` hook from `react-hook-form`, integrating `zodResolver` for robust validation based on a predefined Zod `formSchema`. It includes defining a submit handler (`onSubmit`) for processing form values, ensuring both type-safety and validation before submission, and setting default values for form fields.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

export function ProfileForm() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }
}
```

--------------------------------

### Use Environment Variables for Dynamic Version Selection

Source: https://ui.shadcn.com/docs/registry/namespace

Implements version control through environment variables, enabling different versions across environments (dev, staging, production). Allows centralized version management without hardcoding values.

```json
{
  "@stable": {
    "url": "https://registry.company.com/{name}",
    "params": {
      "version": "${REGISTRY_VERSION}"
    }
  }
}
```

--------------------------------

### Empty State with Avatar Media in Shadcn UI

Source: https://ui.shadcn.com/docs/changelog

This example illustrates how to integrate an `Avatar` component within the `EmptyMedia` section of a Shadcn UI `Empty` component. It's suitable for scenarios like displaying an 'User Offline' state, offering a personalized visual cue along with a message and an action button.

```tsx
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"

export function EmptyAvatar() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <Avatar className="size-12">
            <AvatarImage
              src="https://github.com/shadcn.png"
              className="grayscale"
            />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
        </EmptyMedia>
        <EmptyTitle>User Offline</EmptyTitle>
        <EmptyDescription>
          This user is currently offline. You can leave a message to notify them
          or try again later.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Leave Message</Button>
      </EmptyContent>
    </Empty>
  )
}
```

--------------------------------

### Input Group with Multiple Icons in TypeScript React

Source: https://ui.shadcn.com/docs/changelog

Demonstrates a complete example component showing multiple input groups with various icon addons from lucide-react. Includes email input with mail icon, credit card input with card and check icons, and a favorite/info icon combination, all organized in a responsive grid layout.

```typescript
import {
  CheckIcon,
  CreditCardIcon,
  InfoIcon,
  MailIcon,
  SearchIcon,
  StarIcon,
} from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export function InputGroupIcon() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput type="email" placeholder="Enter your email" />
        <InputGroupAddon>
          <MailIcon />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Card number" />
        <InputGroupAddon>
          <CreditCardIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <CheckIcon />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Card number" />
        <InputGroupAddon align="inline-end">
          <StarIcon />
          <InfoIcon />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Basic ButtonGroup structure with a DropdownMenu in TypeScript React

Source: https://ui.shadcn.com/docs/components/button

This snippet illustrates the basic structure of a `ButtonGroup` component, showing how to group `Button` components and include a `DropdownMenu` trigger. It provides a simple layout example without fully populating the `DropdownMenuContent`.

```tsx
<ButtonGroup>\n  <ButtonGroup>\n    <Button variant=\"outline\" size=\"icon\" aria-label=\"Go Back\">\n      <ArrowLeftIcon />\n    </Button>\n  </ButtonGroup>\n  <ButtonGroup>\n    <Button variant=\"outline\">Archive</Button>\n    <Button variant=\"outline\">Report</Button>\n  </ButtonGroup>\n  <ButtonGroup>\n    <Button variant=\"outline\">Snooze</Button>\n    <DropdownMenu>\n      <DropdownMenuTrigger asChild>\n        <Button variant=\"outline\" size=\"icon\" aria-label=\"More Options\">\n          <MoreHorizontalIcon />\n        </Button>\n      </DropdownMenuTrigger>\n      <DropdownMenuContent />\n    </DropdownMenu>\n  </ButtonGroup>\n</ButtonGroup>
```

--------------------------------

### Define NativeSelectOption Components (tsx)

Source: https://ui.shadcn.com/docs/components/native-select

This example demonstrates how to use the `NativeSelectOption` component to define individual selectable items within a `NativeSelect`. It also includes an instance of a disabled option, showing how to prevent user selection for specific choices. These options map directly to HTML `<option>` elements.

```tsx
<NativeSelectOption value="apple">Apple</NativeSelectOption>
<NativeSelectOption value="banana" disabled>
  Banana
</NativeSelectOption>
```

--------------------------------

### Breadcrumb with Custom Separator Icon

Source: https://ui.shadcn.com/docs/components/breadcrumb

Demonstrates how to replace the default breadcrumb separator with a custom icon component from lucide-react. Shows both the full component example and the specific code for implementing custom separators.

```tsx
import Link from "next/link"
import { SlashIcon } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function BreadcrumbWithCustomSeparator() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/components">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

--------------------------------

### Implement Responsive Dialog and Drawer with React and Shadcn UI

Source: https://ui.shadcn.com/docs/components/drawer

This TypeScript React component demonstrates how to create a responsive modal experience. It uses `useState` to manage the open state and `useMediaQuery` to determine if the user is on a desktop or mobile device. Based on the screen size, it conditionally renders either a Shadcn UI `Dialog` (for desktop) or a `Drawer` (for mobile) to display a profile editing form. Dependencies include `@/lib/utils` for `cn`, `@/hooks/use-media-query`, and various Shadcn UI components.

```tsx
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DrawerDialogDemo() {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <ProfileForm />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DrawerDescription>
        </DrawerHeader>
        <ProfileForm className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function ProfileForm({ className }: React.ComponentProps<"form">) {
  return (
    <form className={cn("grid items-start gap-6", className)}>
      <div className="grid gap-3">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" defaultValue="shadcn@example.com" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="username">Username</Label>
        <Input id="username" defaultValue="@shadcn" />
      </div>
      <Button type="submit">Save changes</Button>
    </form>
  )
}
```

--------------------------------

### Example Shadcn UI FieldSet with Multiple Fields

Source: https://ui.shadcn.com/docs/components/field

Demonstrates the usage of a FieldSet to group related input fields like full name, username, and a newsletter switch. Includes FieldLegend, FieldDescription, FieldLabel, Input, and Switch components for a structured form section.

```tsx
<FieldSet>
  <FieldLegend>Profile</FieldLegend>
  <FieldDescription>This appears on invoices and emails.</FieldDescription>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="name">Full name</FieldLabel>
      <Input id="name" autoComplete="off" placeholder="Evil Rabbit" />
      <FieldDescription>This appears on invoices and emails.</FieldDescription>
    </Field>
    <Field>
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" autoComplete="off" aria-invalid />
      <FieldError>Choose another username.</FieldError>
    </Field>
    <Field orientation="horizontal">
      <Switch id="newsletter" />
      <FieldLabel htmlFor="newsletter">Subscribe to the newsletter</FieldLabel>
    </Field>
  </FieldGroup>
</FieldSet>
```

--------------------------------

### Example Shadcn UI Form Section with Comments and Buttons

Source: https://ui.shadcn.com/docs/components/field

A partial JSX snippet demonstrating a form section with a `Textarea` for comments and `Button` components for submission and cancellation. Utilizes `FieldLabel` and `Field` components for accessibility and structure within a `FieldGroup`.

```tsx
                <FieldLabel htmlFor="checkout-7j9-optional-comments">
                  Comments
                </FieldLabel>
                <Textarea
                  id="checkout-7j9-optional-comments"
                  placeholder="Add any additional comments"
                  className="resize-none"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
```

--------------------------------

### Refactor CSS Variables for @theme inline and HSL Wrappers

Source: https://ui.shadcn.com/docs/tailwind-v4

This CSS example refactors variable definitions for improved usability. It moves `hsl` wrappers to `:root` and `.dark` selectors and utilizes `@theme inline` to simplify variable access by directly referencing `--background` and `--foreground`.

```css
:root {
  --background: hsl(0 0% 100%); // <-- Wrap in hsl
  --foreground: hsl(0 0% 3.9%);
}

.dark {
  --background: hsl(0 0% 3.9%); // <-- Wrap in hsl
  --foreground: hsl(0 0% 98%);
}

@theme inline {
  --color-background: var(--background); // <-- Remove hsl
  --color-foreground: var(--foreground);
}
```

--------------------------------

### Example JSX with Tailwind Utility Classes for Theming

Source: https://ui.shadcn.com/docs/changelog

This JSX snippet demonstrates how to apply styling using Tailwind CSS utility classes directly within components for theming. It shows classes like `bg-zinc-950` and `dark:bg-white` to handle light and dark mode backgrounds respectively.

```tsx
<div className="bg-zinc-950 dark:bg-white" />
```

--------------------------------

### Basic Kbd Component Usage

Source: https://ui.shadcn.com/docs/components/kbd

Demonstrates how to import and use the Kbd component to display a single keyboard key. The component accepts children content (text or symbols) and optional className prop for styling.

```tsx
import { Kbd } from "@/components/ui/kbd"

<Kbd>Ctrl</Kbd>
```

--------------------------------

### Shadcn UI Field with Textarea Component

Source: https://ui.shadcn.com/docs/components/field

Presents an example of using the Shadcn UI Field component with a Textarea for collecting user feedback. Includes FieldSet, FieldGroup, FieldLabel, Textarea, and FieldDescription for a well-structured input area.

```tsx
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function FieldTextarea() {
  return (
    <div className="w-full max-w-md">
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="feedback">Feedback</FieldLabel>
            <Textarea
              id="feedback"
              placeholder="Your feedback helps us improve..."
              rows={4}
            />
            <FieldDescription>
              Share your thoughts about our service.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
```

--------------------------------

### Implement a complete Accordion component in React/TypeScript

Source: https://ui.shadcn.com/docs/components/accordion

This example demonstrates how to create a multi-item collapsible accordion using Shadcn UI's `Accordion`, `AccordionItem`, `AccordionTrigger`, and `AccordionContent` components. It showcases a `single` type accordion with pre-defined content for product information, shipping details, and return policy.

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AccordionDemo() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Product Information</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            Our flagship product combines cutting-edge technology with sleek
            design. Built with premium materials, it offers unparalleled
            performance and reliability.
          </p>
          <p>
            Key features include advanced processing capabilities, and an
            intuitive user interface designed for both beginners and experts.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Shipping Details</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            We offer worldwide shipping through trusted courier partners.
            Standard delivery takes 3-5 business days, while express shipping
            ensures delivery within 1-2 business days.
          </p>
          <p>
            All orders are carefully packaged and fully insured. Track your
            shipment in real-time through our dedicated tracking portal.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Return Policy</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            We stand behind our products with a comprehensive 30-day return
            policy. If you&apos;re not completely satisfied, simply return the
            item in its original condition.
          </p>
          <p>
            Our hassle-free return process includes free return shipping and
            full refunds processed within 48 hours of receiving the returned
            item.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

--------------------------------

### Implement Input OTP with Custom Pattern (TypeScript React)

Source: https://ui.shadcn.com/docs/components/input-otp

Demonstrates how to apply a custom validation pattern to the Input OTP component using `REGEXP_ONLY_DIGITS_AND_CHARS` from `input-otp`. This example ensures the input accepts only digits and characters, providing enhanced input validation.

```tsx
"use client"

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function InputOTPPattern() {
  return (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
```

--------------------------------

### Create Resizable Panel Groups - React TypeScript

Source: https://ui.shadcn.com/docs/changelog

Build resizable horizontal and vertical panel layouts using ResizablePanel, ResizableHandle, and ResizablePanelGroup components. This example demonstrates nesting panels with custom sizes and keyboard/touch support via the underlying react-resizable-panels library.

```typescript
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function ResizableDemo() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="max-w-md rounded-lg border md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-[200px] items-center justify-center p-6">
          <span className="font-semibold">One</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={25}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Two</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Three</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

--------------------------------

### Basic Plugin Usage in shadcn UI Registry

Source: https://ui.shadcn.com/docs/registry/examples

Demonstrates how to declare Tailwind CSS plugins in a shadcn UI registry item configuration. The `css` object contains plugin directives that reference Tailwind CSS packages and custom plugins. This is the foundational pattern for extending Tailwind functionality in shadcn components.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-plugin",
  "type": "registry:item",
  "css": {
    "@plugin \"@tailwindcss/typography\"": {},
    "@plugin \"foo\"": {}
  }
}
```

--------------------------------

### Render a Simple Skeleton Placeholder in TSX

Source: https://ui.shadcn.com/docs/components/skeleton

This snippet illustrates the direct usage of the `Skeleton` component to display a basic placeholder. It applies Tailwind CSS classes to control the height, width, and border-radius of the skeleton element. This example is suitable for creating generic loading indicators.

```tsx
<Skeleton className="h-[20px] w-[100px] rounded-full" />
```

--------------------------------

### SidebarMenuBadge Basic Usage - React TSX

Source: https://ui.shadcn.com/docs/components/sidebar

Minimal example showing how to add a badge to a sidebar menu item. The badge component is placed as a sibling to SidebarMenuButton within a SidebarMenuItem, displaying a numeric value.

```typescript
<SidebarMenuItem>
  <SidebarMenuButton />
  <SidebarMenuBadge>24</SidebarMenuBadge>
</SidebarMenuItem>
```

--------------------------------

### Implement Dropdown Menu triggering multiple Dialogs (TSX)

Source: https://ui.shadcn.com/docs/components/dropdown-menu

This full example demonstrates a React component that utilizes a Shadcn UI `DropdownMenu` to present options, each of which can open a distinct `Dialog` component. It employs `useState` hooks to manage the visibility of the "New File" and "Share" dialogs, showcasing a complete flow for user interaction including form inputs and action buttons within the dialogs. The `DropdownMenu` is configured with `modal={false}` to ensure proper dialog functionality.

```tsx
"use client"\n\nimport { useState } from "react"\nimport { MoreHorizontalIcon } from "lucide-react"\n\nimport { Button } from "@/components/ui/button"\nimport {\n  Dialog,\n  DialogClose,\n  DialogContent,\n  DialogDescription,\n  DialogFooter,\n  DialogHeader,\n  DialogTitle,\n} from "@/components/ui/dialog"\nimport {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuGroup,\n  DropdownMenuItem,\n  DropdownMenuLabel,\n  DropdownMenuTrigger,\n} from "@/components/ui/dropdown-menu"\nimport { Field, FieldGroup, FieldLabel } from "@/components/ui/field"\nimport { Input } from "@/components/ui/input"\nimport { Label } from "@/components/ui/label"\nimport { Textarea } from "@/components/ui/textarea"\n\nexport function DropdownMenuDialog() {\n  const [showNewDialog, setShowNewDialog] = useState(false)\n  const [showShareDialog, setShowShareDialog] = useState(false)\n\n  return (\n    <>\n      <DropdownMenu modal={false}>\n        <DropdownMenuTrigger asChild>\n          <Button variant="outline" aria-label="Open menu" size="icon-sm">\n            <MoreHorizontalIcon />\n          </Button>\n        </DropdownMenuTrigger>\n        <DropdownMenuContent className="w-40" align="end">\n          <DropdownMenuLabel>File Actions</DropdownMenuLabel>\n          <DropdownMenuGroup>\n            <DropdownMenuItem onSelect={() => setShowNewDialog(true)}>\n              New File...\n            </DropdownMenuItem>\n            <DropdownMenuItem onSelect={() => setShowShareDialog(true)}>\n              Share...\n            </DropdownMenuItem>\n            <DropdownMenuItem disabled>Download</DropdownMenuItem>\n          </DropdownMenuGroup>\n        </DropdownMenuContent>\n      </DropdownMenu>\n      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>\n        <DialogContent className="sm:max-w-[425px]">\n          <DialogHeader>\n            <DialogTitle>Create New File</DialogTitle>\n            <DialogDescription>\n              Provide a name for your new file. Click create when you&apos;re\n              done.\n            </DialogDescription>\n          </DialogHeader>\n          <FieldGroup className="pb-3">\n            <Field>\n              <FieldLabel htmlFor="filename">File Name</FieldLabel>\n              <Input id="filename" name="filename" placeholder="document.txt" />\n            </Field>\n          </FieldGroup>\n          <DialogFooter>\n            <DialogClose asChild>\n              <Button variant="outline">Cancel</Button>\n            </DialogClose>\n            <Button type="submit">Create</Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>\n        <DialogContent className="sm:max-w-[425px]">\n          <DialogHeader>\n            <DialogTitle>Share File</DialogTitle>\n            <DialogDescription>\n              Anyone with the link will be able to view this file.\n            </DialogDescription>\n          </DialogHeader>\n          <FieldGroup className="py-3">\n            <Field>\n              <Label htmlFor="email">Email Address</Label>\n              <Input\n                id="email"\n                name="email"\n                type="email"\n                placeholder="shadcn@vercel.com"\n                autoComplete="off"\n              />\n            </Field>\n            <Field>\n              <FieldLabel htmlFor="message">Message (Optional)</FieldLabel>\n              <Textarea\n                id="message"\n                name="message"\n                placeholder="Check out this file"\n              />\n            </Field>\n          </FieldGroup>\n          <DialogFooter>\n            <DialogClose asChild>\n              <Button variant="outline">Cancel</Button>\n            </DialogClose>\n            <Button type="submit">Send Invite</Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n    </>\n  )\n}
```

--------------------------------

### Declare npm package dependencies for registry item

Source: https://ui.shadcn.com/docs/registry/registry-item-json

The `dependencies` property lists external npm packages that the registry item relies on for its functionality. It supports specifying exact versions using the `@version` syntax, ensuring compatibility and proper installation.

```json
{
  "dependencies": [
    "@radix-ui/react-accordion",
    "zod",
    "lucide-react",
    "name@1.0.2"
  ]
}
```

--------------------------------

### Utilize Shadcn UI useSidebar Hook for Control (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/sidebar

This example illustrates how to use the `useSidebar` hook to programmatically control the state and behavior of the Shadcn UI sidebar. It destructures various properties and functions for managing sidebar visibility and responsiveness, such as `state`, `open`, `setOpen`, and `toggleSidebar`.

```tsx
import { useSidebar } from "@/components/ui/sidebar"

export function AppSidebar() {
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar()
}
```

--------------------------------

### Render a Basic Shadcn Button with Icon (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/button

Demonstrates how to render a basic button and an icon button using the Shadcn UI `Button` component in a React application. It uses `variant="outline"` and `size="icon"` for the icon button, requiring `lucide-react` for the icon. This example shows both the full component and a simplified JSX snippet.

```tsx
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}
```

```tsx
<Button variant="outline">Button</Button>
<Button variant="outline" size="icon" aria-label="Submit">
  <ArrowUpIcon />
</Button>
```

--------------------------------

### Render a basic single-item Accordion in React/TypeScript

Source: https://ui.shadcn.com/docs/components/accordion

This example demonstrates the minimal JSX structure required to render a single collapsible Accordion item. It uses `type="single"` and `collapsible` props, along with an `AccordionTrigger` and `AccordionContent` for basic functionality.

```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

--------------------------------

### Input Group with Text Addons in TypeScript React

Source: https://ui.shadcn.com/docs/changelog

Demonstrates using InputGroupText component to add text labels or currency symbols around input fields. Includes examples with currency formatting ($ and USD) and URL prefix (https://), showing how to combine text addons with input fields for better contextual information.

```typescript
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function InputGroupTextExample() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="0.00" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Set Sidebar Position with `side` Prop in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This example shows how to use the `side` prop to control whether the sidebar appears on the `left` or `right` side of the screen. This prop modifies the visual placement of the sidebar.

```tsx
import { Sidebar } from "@/components/ui/sidebar"

export function AppSidebar() {
  return <Sidebar side="left | right" />
}
```

--------------------------------

### Configure Registry URLs for HTTPS Enforcement (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This configuration snippet illustrates the importance of using HTTPS for registry URLs in `components.json`. It shows a recommended secure HTTPS URL and an example of an insecure HTTP URL to avoid, emphasizing encrypted transport and credential protection.

```json
{
  "registries": {
    "@secure": "https://registry.example.com/{name}.json",
    "@insecure": "http://registry.example.com/{name}.json"
  }
}
```

--------------------------------

### Update Tooltip Color Styling

Source: https://ui.shadcn.com/docs/components/tooltip

Migration guide for updating tooltip color scheme. Replace the old color classes (bg-primary text-primary-foreground) with new foreground/background colors for both TooltipContent and TooltipArrow components to match the 2025-09-22 update.

```tsx
bg-foreground text-background
```

--------------------------------

### Render a Bar Chart with shadcn/ui Chart Components (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/chart

This example demonstrates how to create a bar chart using the `shadcn/ui` `ChartContainer` and `ChartTooltip` components in conjunction with `Recharts` `BarChart` and `Bar`. It shows the basic structure for composing a chart, where `data` is expected to be provided. The chart uses custom tooltip content provided by `ChartTooltipContent`.

```tsx
import { Bar, BarChart } from "recharts"

import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

export function MyChart() {
  return (
    <ChartContainer>
      <BarChart data={data}>
        <Bar dataKey="value" />
        <ChartTooltip content={<ChartTooltipContent />} />
      </BarChart>
    </ChartContainer>
  )
}
```

--------------------------------

### Configure Vite for path aliases and Tailwind CSS

Source: https://ui.shadcn.com/docs/installation/vite

Updates `vite.config.ts` to include path aliases and the Tailwind CSS plugin. This configuration allows resolving imports starting with `@/` to `./src` and integrates Tailwind CSS into the build process, ensuring all modules are correctly bundled.

```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

--------------------------------

### Initialize MCP Server for Registry Integration

Source: https://ui.shadcn.com/docs/changelog

Initialize the MCP (Model Context Protocol) server for all configured registries with zero configuration required. This command adds the MCP server to favorite MCP clients, enabling better integration with CLI and multiple registries in the same project.

```bash
npx shadcn@latest mcp init
```

--------------------------------

### Display Text within ButtonGroup (Shadcn UI, React)

Source: https://ui.shadcn.com/docs/components/button-group

This example illustrates the basic usage of the `ButtonGroupText` component. It allows you to embed static text content directly within a `ButtonGroup` alongside interactive elements like buttons.

```tsx
<ButtonGroup>\n  <ButtonGroupText>Text</ButtonGroupText>\n  <Button>Button</Button>\n</ButtonGroup>
```

--------------------------------

### Use Popover with ButtonGroup for AI Assistant (Shadcn UI, React)

Source: https://ui.shadcn.com/docs/components/button-group

This example illustrates how to integrate a `Popover` component within a `ButtonGroup` to create an interactive element, such as an AI assistant interface. It includes a trigger button that opens a popover containing a `Textarea` for user input and descriptive text, all styled within the Shadcn UI system.

```tsx
import { BotIcon, ChevronDownIcon } from \"lucide-react\"\n\nimport { Button } from \"@/components/ui/button\"\nimport { ButtonGroup } from \"@/components/ui/button-group\"\nimport {\n  Popover,\n  PopoverContent,\n  PopoverTrigger,\n} from \"@/components/ui/popover\"\nimport { Separator } from \"@/components/ui/separator\"\nimport { Textarea } from \"@/components/ui/textarea\"\n\nexport function ButtonGroupPopover() {\n  return (\n    <ButtonGroup>\n      <Button variant=\"outline\">\n        <BotIcon /> Copilot\n      </Button>\n      <Popover>\n        <PopoverTrigger asChild>\n          <Button variant=\"outline\" size=\"icon\" aria-label=\"Open Popover\">\n            <ChevronDownIcon />\n          </Button>\n        </PopoverTrigger>\n        <PopoverContent align=\"end\" className=\"rounded-xl p-0 text-sm\">\n          <div className=\"px-4 py-3\">\n            <div className=\"text-sm font-medium\">Agent Tasks</div>\n          </div>\n          <Separator />\n          <div className=\"p-4 text-sm *:[p:not(:last-child)]:mb-2\">\n            <Textarea\n              placeholder=\"Describe your task in natural language.\"\n              className=\"mb-4 resize-none\"\n            />\n            <p className=\"font-medium\">Start a new task with Copilot</p>\n            <p className=\"text-muted-foreground\">\n              Describe your task in natural language. Copilot will work in the\n              background and open a pull request for your review.\n            </p>\n          </div>\n        </PopoverContent>\n      </Popover>\n    </ButtonGroup>\n  )\n}
```

--------------------------------

### Build Registry with pnpm

Source: https://ui.shadcn.com/docs/blocks

Runs the build script to process block definitions and generate registry data. Execute this after updating block definitions before viewing or publishing.

```bash
pnpm registry:build
```

--------------------------------

### Basic shadcn UI Field with Input in TypeScript React

Source: https://ui.shadcn.com/docs/changelog

This example showcases a fundamental usage of the `Field` component to wrap an `Input` element. It incorporates `FieldLabel` for proper labeling and accessibility, along with `FieldDescription` to provide supplementary information to the user regarding the input field.

```tsx
<Field>
  <FieldLabel htmlFor="username">Username</FieldLabel>
  <Input id="username" placeholder="Max Leiter" />
  <FieldDescription>
    Choose a unique username for your account.
  </FieldDescription>
</Field>
```

--------------------------------

### Downgrade React to Version 18 with `npm`

Source: https://ui.shadcn.com/docs/react-19

This `npm` command allows users to explicitly install `react` and `react-dom` at version 18. This can serve as a temporary solution to resolve peer dependency issues with third-party packages not yet compatible with React 19, ensuring project stability until updates are available.

```bash
npm i react@18 react-dom@18
```

--------------------------------

### Override Tailwind CSS Variables in shadcn/ui Theme

Source: https://ui.shadcn.com/docs/registry/examples

Override Tailwind CSS variables including spacing and breakpoints within shadcn/ui theme configuration to customize responsive design behavior across the component library.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "custom-theme",
  "type": "registry:theme",
  "cssVars": {
    "theme": {
      "spacing": "0.2rem",
      "breakpoint-sm": "640px",
      "breakpoint-md": "768px",
      "breakpoint-lg": "1024px",
      "breakpoint-xl": "1280px",
      "breakpoint-2xl": "1536px"
    }
  }
}
```

--------------------------------

### Create a disabled ToggleGroup component in TypeScript/React

Source: https://ui.shadcn.com/docs/components/toggle-group

This example shows how to render a ToggleGroup in a disabled state, preventing user interaction. It uses the `disabled` prop on the `ToggleGroup` component. Icons are imported from `lucide-react` for visual representation, and the component itself is imported from `@/components/ui/toggle-group`.

```tsx
import { Bold, Italic, Underline } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export function ToggleGroupDemo() {
  return (
    <ToggleGroup type="multiple" disabled>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

--------------------------------

### Specify type of registry item

Source: https://ui.shadcn.com/docs/registry/registry-item-json

The `type` property categorizes the registry item, influencing how it's handled and resolved within a project. Examples include `registry:block` for complex components, `registry:component` for simple ones, or `registry:hook` for custom hooks.

```json
{
  "type": "registry:block"
}
```

--------------------------------

### Basic Empty State Display with Shadcn UI

Source: https://ui.shadcn.com/docs/changelog

This example shows a basic implementation of the Shadcn UI `Empty` component. It displays a 'No messages' state with an icon, title, description, and a call-to-action button, providing a clear visual for empty content areas in an application.

```tsx
<Empty>
  <EmptyMedia variant="icon">
    <InboxIcon />
  </EmptyMedia>
  <EmptyTitle>No messages</EmptyTitle>
  <EmptyDescription>You don't have any messages yet.</EmptyDescription>
  <EmptyContent>
    <Button>Send a message</Button>
  </EmptyContent>
</Empty>
```

--------------------------------

### Set Custom Sidebar Width with Style Prop in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This example demonstrates how to dynamically set custom sidebar widths using CSS variables via the `style` prop on the `SidebarProvider` component. This approach allows for individual sidebar width configuration when multiple sidebars are present.

```tsx
<SidebarProvider
  style={{
    "--sidebar-width": "20rem",
    "--sidebar-width-mobile": "20rem"
  }}
>
  <Sidebar />
</SidebarProvider>
```

--------------------------------

### Implement a Basic Form Field with React Hook Form

Source: https://ui.shadcn.com/docs/components/form

This example demonstrates how to create a single input field (e.g., 'username') within a form using the `FormField` component from React Hook Form. It shows how to link the field to the form's control, apply a label, an input component, a description, and a message for validation feedback, integrating seamlessly with Radix UI components.

```tsx
const form = useForm()

<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input placeholder="shadcn" {...field} />
      </FormControl>
      <FormDescription>This is your public display name.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

--------------------------------

### Example Diff Output for `npx shadcn diff alert`

Source: https://ui.shadcn.com/docs/changelog

This `diff` output illustrates a change in the `alertVariants` definition, specifically modifying the `cva` function call. It shows a change from `relative w-full rounded-lg border` to `relative w-full pl-12 rounded-lg border`, indicating an added `pl-12` class for padding.

```diff
const alertVariants = cva(
- "relative w-full rounded-lg border",
+ "relative w-full pl-12 rounded-lg border"
)
```

--------------------------------

### Build Command Menu with Keyboard Handler

Source: https://ui.shadcn.com/docs/components/command

Creates a reusable CommandMenu component that responds to Cmd/Ctrl + K keyboard shortcut. Includes a search input field and displays command suggestions grouped by category with empty state handling. Automatically cleans up event listeners on component unmount.

```tsx
export function CommandMenu() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

--------------------------------

### Basic Scroll Area Usage with Text Content

Source: https://ui.shadcn.com/docs/components/scroll-area

Simple usage example showing a scroll area with fixed dimensions containing long text content. Demonstrates className styling with Tailwind CSS for height, width, border, and padding.

```typescript
<ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
  Jokester began sneaking into the castle in the middle of the night and leaving
  jokes all over the place: under the king's pillow, in his soup, even in the
  royal toilet. The king was furious, but he couldn't seem to stop Jokester. And
  then, one day, the people of the kingdom discovered that the jokes left by
  Jokester were so funny that they couldn't help but laugh. And once they
  started laughing, they couldn't stop.
</ScrollArea>
```

--------------------------------

### Structure Sidebar Content with Groups (Shadcn UI, TSX)

Source: https://ui.shadcn.com/docs/components/sidebar

This TypeScript React example illustrates the basic usage of the `SidebarContent` component to wrap and organize content within a sidebar. It demonstrates how to place multiple `SidebarGroup` components inside the scrollable content area of a Shadcn UI sidebar, providing a structured layout for navigation or information.

```tsx
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
    </Sidebar>
  )
}
```

--------------------------------

### Display Spinner in Empty State Component (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/spinner

This example shows how to use the `Spinner` component within an `Empty` state component to signify an ongoing process. The spinner is placed inside `EmptyMedia` to visually represent a task like 'Processing your request' alongside a descriptive message.

```tsx
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

export function SpinnerEmpty() {
  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>Processing your request</EmptyTitle>
        <EmptyDescription>
          Please wait while we process your request. Do not refresh the page.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
      </EmptyContent>
    </Empty>
  )
}
```

--------------------------------

### Configure Semantic Versioning with Prerelease Support

Source: https://ui.shadcn.com/docs/registry/namespace

Implements semantic versioning ranges with optional prerelease channel control. Allows specifying version constraints like caret ranges (^2.0.0) and conditionally enabling prerelease versions.

```json
{
  "@npm-style": {
    "url": "https://registry.example.com/{name}",
    "params": {
      "semver": "^2.0.0",
      "prerelease": "${ALLOW_PRERELEASE}"
    }
  }
}
```

--------------------------------

### Implement Collapsible Component with React and Shadcn UI

Source: https://ui.shadcn.com/docs/components/collapsible

This TypeScript React example demonstrates how to create a functional collapsible component using Shadcn UI's `Collapsible` primitive. It manages its open/closed state with React's `useState` hook and includes a button with an icon to toggle the content visibility, showcasing a common UI pattern for hiding and showing information.

```tsx
"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex w-[350px] flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-4 px-4">
        <h4 className="text-sm font-semibold">
          @peduarte starred 3 repositories
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <ChevronsUpDown />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-2 font-mono text-sm">
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="flex flex-col gap-2">
        <div className="rounded-md border px-4 py-2 font-mono text-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

--------------------------------

### Create Input Group with Textarea and Addons (Shadcn UI, TSX)

Source: https://ui.shadcn.com/docs/components/input-group

This example demonstrates how to integrate a `Textarea` component within an `InputGroup`. It utilizes `InputGroupAddon` with `block-start` and `block-end` alignment to display icons, text, and buttons, providing a rich, interactive textarea experience for code or multi-line input.

```tsx
import {
  IconBrandJavascript,
  IconCopy,
  IconCornerDownLeft,
  IconRefresh,
} from "@tabler/icons-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function InputGroupTextareaExample() {
  return (
    <div className="grid w-full max-w-md gap-4">
      <InputGroup>
        <InputGroupTextarea
          id="textarea-code-32"
          placeholder="console.log('Hello, world!');"
          className="min-h-[200px]"
        />
        <InputGroupAddon align="block-end" className="border-t">
          <InputGroupText>Line 1, Column 1</InputGroupText>
          <InputGroupButton size="sm" className="ml-auto" variant="default">
            Run <IconCornerDownLeft />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon align="block-start" className="border-b">
          <InputGroupText className="font-mono font-medium">
            <IconBrandJavascript />
            script.js
          </InputGroupText>
          <InputGroupButton className="ml-auto" size="icon-xs">
            <IconRefresh />
          </InputGroupButton>
          <InputGroupButton variant="ghost" size="icon-xs">
            <IconCopy />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Display Field-Specific Validation Errors in React/Next.js Forms

Source: https://ui.shadcn.com/docs/forms/next

This example shows how to display server-side validation errors next to their respective form fields. It utilizes `data-invalid` and `aria-invalid` props for accessibility and conditional rendering of `FieldError` components based on `formState.errors`.

```tsx
<Field data-invalid={!!formState.errors?.email?.length}>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input
    id="email"
    name="email"
    type="email"
    aria-invalid={!!formState.errors?.email?.length}
  />
  {formState.errors?.email && (
    <FieldError>{formState.errors.email[0]}</FieldError>
  )}
</Field>
```

--------------------------------

### Create Class Name Merge Utility Function

Source: https://ui.shadcn.com/docs/installation/manual

Export a cn utility function that combines clsx and tailwind-merge to intelligently merge Tailwind CSS class names while resolving conflicts. Takes ClassValue inputs and returns merged class string, useful for conditionally applying styles in component prop patterns.

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

--------------------------------

### Set Up React Hook Form Instance with Zod Resolver

Source: https://ui.shadcn.com/docs/forms/react-hook-form

Demonstrates the setup of a React Hook Form instance within a functional component (`BugReportForm`). It initializes the form using `useForm`, connects it to a Zod schema via `zodResolver` for validation, sets default values, and defines an `onSubmit` function to handle validated form data.

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
})

export function BugReportForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    // Do something with the form values.
    console.log(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... */}
      {/* Build the form here */}
      {/* ... */}
    </form>
  )
}
```

--------------------------------

### Implement Collapsible SidebarGroup with Shadcn UI (TypeScript)

Source: https://ui.shadcn.com/docs/components/sidebar

This example illustrates how to make a `SidebarGroup` collapsible using Shadcn UI's `Collapsible` component. It shows wrapping the group with `Collapsible` and placing the `CollapsibleTrigger` inside `SidebarGroupLabel` to control the visibility of `SidebarGroupContent`.

```tsx
"use client"

import { ChevronDownIcon, LifeBuoyIcon, SendIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  Help
                  <ChevronDownIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <LifeBuoyIcon />
                        Support
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <SendIcon />
                        Feedback
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
```

```tsx
export function AppSidebar() {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger>
            Help
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent />
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
```

--------------------------------

### Implement Responsive Form Layout with Shadcn UI Fields (TSX)

Source: https://ui.shadcn.com/docs/components/field

This TypeScript/TSX example demonstrates how to construct a responsive form using Shadcn UI's Field components. It utilizes `orientation="responsive"` on individual `Field` elements within a `FieldGroup` to achieve automatic column layouts for various screen sizes, leveraging components like `Input`, `Textarea`, and `Button`.

```tsx
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function FieldResponsive() {
  return (
    <div className="w-full max-w-4xl">
      <form>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldDescription>Fill in your profile information.</FieldDescription>
          <FieldSeparator />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  Provide your full name for identification
                </FieldDescription>
              </FieldContent>
              <Input id="name" placeholder="Evil Rabbit" required />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="lastName">Message</FieldLabel>
                <FieldDescription>
                  You can write your message here. Keep it short, preferably
                  under 100 characters.
                </FieldDescription>
              </FieldContent>
              <Textarea
                id="message"
                placeholder="Hello, world!"
                required
                className="min-h-[100px] resize-none sm:min-w-[300px]"
              />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  )
}
```

--------------------------------

### Create Selectable Field Groups with Radio Buttons in React

Source: https://ui.shadcn.com/docs/components/field

This example demonstrates how to construct a 'Choice Card' using `FieldGroup`, `FieldSet`, and `FieldLabel` to wrap `RadioGroup` components. It showcases horizontal orientation for field content and integrates `FieldTitle` and `FieldDescription` for rich selection options, allowing users to choose between compute environments.

```tsx
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

export function FieldChoiceCard() {
  return (
    <div className="w-full max-w-md">
      <FieldGroup>
        <FieldSet>
          <FieldLabel htmlFor="compute-environment-p8w">
            Compute Environment
          </FieldLabel>
          <FieldDescription>
            Select the compute environment for your cluster.
          </FieldDescription>
          <RadioGroup defaultValue="kubernetes">
            <FieldLabel htmlFor="kubernetes-r2h">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Kubernetes</FieldTitle>
                  <FieldDescription>
                    Run GPU workloads on a K8s configured cluster.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="kubernetes" id="kubernetes-r2h" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="vm-z4k">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Virtual Machine</FieldTitle>
                  <FieldDescription>
                    Access a VM configured cluster to run GPU workloads.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="vm" id="vm-z4k" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  )
}
```

--------------------------------

### Implement a Radio Group Field with Shadcn UI and React

Source: https://ui.shadcn.com/docs/components/field

This example shows how to create a radio button group for selecting a subscription plan using Shadcn UI components in a React application. It organizes radio items horizontally within a fieldset, complete with a label and description.

```tsx
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

export function FieldRadio() {
  return (
    <div className="w-full max-w-md">
      <FieldSet>
        <FieldLabel>Subscription Plan</FieldLabel>
        <FieldDescription>
          Yearly and lifetime plans offer significant savings.
        </FieldDescription>
        <RadioGroup defaultValue="monthly">
          <Field orientation="horizontal">
            <RadioGroupItem value="monthly" id="plan-monthly" />
            <FieldLabel htmlFor="plan-monthly" className="font-normal">
              Monthly ($9.99/month)
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="yearly" id="plan-yearly" />
            <FieldLabel htmlFor="plan-yearly" className="font-normal">
              Yearly ($99.99/year)
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="lifetime" id="plan-lifetime" />
            <FieldLabel htmlFor="plan-lifetime" className="font-normal">
              Lifetime ($299.99)
            </FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
    </div>
  )
}
```

--------------------------------

### Autoplay Plugin with Stop on Interaction

Source: https://ui.shadcn.com/docs/components/carousel

Implement Autoplay plugin with stopOnInteraction option and mouse event handlers to pause/resume autoplay. This example stores the plugin in a useRef to persist across renders and adds mouse enter/leave handlers to control the autoplay behavior for better user experience.

```tsx
"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function CarouselPlugin() {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-xs"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

--------------------------------

### Integrate SidebarMenuAction with Button and Link in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This example demonstrates how to combine `SidebarMenuButton` (acting as a clickable link) and `SidebarMenuAction` (an independent action button) within a single `SidebarMenuItem`. The action button can contain an icon and a screen-reader-only label, allowing for multiple interactive elements per menu item, enhancing functionality.

```tsx
<SidebarMenuItem>\n  <SidebarMenuButton asChild>\n    <a href="#">\n      <Home />\n      <span>Home</span>\n    </a>\n  </SidebarMenuButton>\n  <SidebarMenuAction>\n    <Plus /> <span className="sr-only">Add Project</span>\n  </SidebarMenuAction>\n</SidebarMenuItem>
```

--------------------------------

### Build a Carousel Component in shadcn/ui (TypeScript/React)

Source: https://ui.shadcn.com/docs/changelog

This example shows how to integrate a Carousel component from shadcn/ui with motion, swipe gestures, and keyboard support. It dynamically generates carousel items using Card components and includes navigation buttons (CarouselPrevious, CarouselNext), built on Embla Carousel.

```tsx
import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function CarouselDemo() {
  return (
    <Carousel className="w-full max-w-xs">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

--------------------------------

### Listen to Carousel Select Events

Source: https://ui.shadcn.com/docs/components/carousel

Attach event listeners to the carousel API instance using the on() method. This example demonstrates listening to the 'select' event, which fires whenever the carousel slide changes. The event handler can be used to trigger custom logic or state updates.

```tsx
import { type CarouselApi } from "@/components/ui/carousel"

export function Example() {
  const [api, setApi] = React.useState<CarouselApi>()

  React.useEffect(() => {
    if (!api) {
      return
    }

    api.on("select", () => {
      // Do something on select.
    })
  }, [api])

  return (
    <Carousel setApi={setApi}>
      <CarouselContent>
        <CarouselItem>...</CarouselItem>
        <CarouselItem>...</CarouselItem>
        <CarouselItem>...</CarouselItem>
      </CarouselContent>
    </Carousel>
  )
}
```

--------------------------------

### Fetch Projects with React Query - React TypeScript

Source: https://ui.shadcn.com/docs/components/sidebar

Fetches project data using React Query useQuery hook with identical loading state and skeleton UI patterns. Provides the same sidebar menu rendering with project links and icons as the SWR implementation.

```typescript
function NavProjects() {
  const { data, isLoading } = useQuery()

  if (isLoading) {
    return (
      <SidebarMenu>
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  if (!data) {
    return ...
  }

  return (
    <SidebarMenu>
      {data.map((project) => (
        <SidebarMenuItem key={project.name}>
          <SidebarMenuButton asChild>
            <a href={project.url}>
              <project.icon />
              <span>{project.name}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
```

--------------------------------

### Persist Sidebar State in Next.js App Router

Source: https://ui.shadcn.com/docs/components/sidebar

This Next.js `app/layout.tsx` example shows how to persist the sidebar's open/closed state across page reloads using cookies. It reads the `sidebar_state` cookie to set the initial `defaultOpen` prop for the `SidebarProvider`.

```tsx
import { cookies } from "next/headers"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
```

--------------------------------

### Configure ChartLegend with Custom Name Key

Source: https://ui.shadcn.com/docs/components/chart

Set up a chart legend using the nameKey prop to map a custom data field for legend item names. This example maps the 'browser' field to display Chrome and Safari as legend names, with colors automatically referenced from the chart config.

```tsx
const chartData = [
  { browser: "chrome", visitors: 187, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
]

const chartConfig = {
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

<ChartLegend content={<ChartLegendContent nameKey="browser" />} />
```

--------------------------------

### Item with Actions Button Component in TSX

Source: https://ui.shadcn.com/docs/changelog

Extended Item component demonstrating ItemActions sub-component with an action button. Shows two examples: a basic outline item with title, description, and action button, and a smaller item variant wrapped in an anchor tag with icon and chevron action.

```tsx
import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

export function ItemDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Basic Item</ItemTitle>
          <ItemDescription>
            A simple item with title and description.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Action
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline" size="sm" asChild>
        <a href="#">
          <ItemMedia>
            <BadgeCheckIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Your profile has been verified.</ItemTitle>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </a>
      </Item>
    </div>
  )
}
```

--------------------------------

### Demonstrate Various Sonner Toast Types in React

Source: https://ui.shadcn.com/docs/components/sonner

This React component provides examples for triggering different types of Sonner toasts, including default, success, info, warning, error, and an asynchronous promise-based toast. Each toast type is activated by a corresponding Shadcn UI Button.

```tsx
"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function SonnerTypes() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast("Event has been created")}>
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.success("Event has been created")}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Be at the area 10 minutes before the event time")
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Event start time cannot be earlier than 8am")
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error("Event has not been created")}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast.promise<{ name: string }>(
            () =>
              new Promise((resolve) =>
                setTimeout(() => resolve({ name: "Event" }), 2000)
              ),
            {
              loading: "Loading...",
              success: (data) => `${data.name} has been created`,
              error: "Error",
            }
          )
        }}
      >
        Promise
      </Button>
    </div>
  )
}
```

--------------------------------

### Implement a rich Popover with form elements in React/TypeScript

Source: https://ui.shadcn.com/docs/components/popover

This example showcases a complete Popover component built with Shadcn UI, utilizing Radix UI primitives. It features a trigger button that reveals a popover containing input fields and labels, ideal for settings forms or detailed information displays. The implementation relies on `Button`, `Input`, `Label`, and `Popover` components from `@/components/ui`.

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Dimensions</h4>
            <p className="text-muted-foreground text-sm">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

--------------------------------

### Create Native Select with grouped department options in React

Source: https://ui.shadcn.com/docs/components/native-select

This React component demonstrates how to organize `NativeSelectOption` elements into logical categories using `NativeSelectOptGroup`. It shows an example of selecting departments (Engineering, Sales, Operations), enhancing usability for longer lists by grouping related options.

```tsx
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select"

export function NativeSelectGroups() {
  return (
    <NativeSelect>
      <NativeSelectOption value="">Select department</NativeSelectOption>
      <NativeSelectOptGroup label="Engineering">
        <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
        <NativeSelectOption value="backend">Backend</NativeSelectOption>
        <NativeSelectOption value="devops">DevOps</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Sales">
        <NativeSelectOption value="sales-rep">Sales Rep</NativeSelectOption>
        <NativeSelectOption value="account-manager">
          Account Manager
        </NativeSelectOption>
        <NativeSelectOption value="sales-director">
          Sales Director
        </NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Operations">
        <NativeSelectOption value="support">
          Customer Support
        </NativeSelectOption>
        <NativeSelectOption value="product-manager">
          Product Manager
        </NativeSelectOption>
        <NativeSelectOption value="ops-manager">
          Operations Manager
        </NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  )
}
```

--------------------------------

### Disable Form Field and Apply Styling Based on Pending State in React/Next.js

Source: https://ui.shadcn.com/docs/forms/next

This example illustrates how to disable an individual form field and apply data attributes for styling when the form is in a pending state. It uses the `data-disabled` prop on the `<Field />` component and the `disabled` prop on the `<Input />`.

```tsx
<Field data-disabled={pending}>
  <FieldLabel htmlFor="name">Name</FieldLabel>
  <Input id="name" name="name" disabled={pending} />
</Field>
```

--------------------------------

### Define a Complete Shadcn UI Bar Chart Component with Legend (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/chart

This comprehensive example provides a full React component (`Component`) demonstrating a `BarChart` using Shadcn UI components. It includes data definition (`chartData`), chart configuration (`chartConfig`), and integrates `ChartLegend` and `ChartTooltip` for enhanced user interaction.

```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export function Component() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

--------------------------------

### Input Group with Buttons and Interactive Features in TypeScript React

Source: https://ui.shadcn.com/docs/changelog

Advanced example showing input groups with interactive button addons, including copy-to-clipboard functionality, favorite toggle with state management, popover integration for security warnings, and search button. Uses Tabler icons and custom hooks for clipboard operations.

```typescript
"use client"

import * as React from "react"
import {
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconStar,
} from "@tabler/icons-react"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function InputGroupButtonExample() {
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const [isFavorite, setIsFavorite] = React.useState(false)

  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupInput placeholder="https://x.com/shadcn" readOnly />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Copy"
            title="Copy"
            size="icon-xs"
            onClick={() => {
              copyToClipboard("https://x.com/shadcn")
            }}
          >
            {isCopied ? <IconCheck /> : <IconCopy />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="[--radius:9999px]">
        <Popover>
          <PopoverTrigger asChild>
            <InputGroupAddon>
              <InputGroupButton variant="secondary" size="icon-xs">
                <IconInfoCircle />
              </InputGroupButton>
            </InputGroupAddon>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="flex flex-col gap-1 rounded-xl text-sm"
          >
            <p className="font-medium">Your connection is not secure.</p>
            <p>You should not enter any sensitive information on this site.</p>
          </PopoverContent>
        </Popover>
        <InputGroupAddon className="text-muted-foreground pl-1.5">
          https://
        </InputGroupAddon>
        <InputGroupInput id="input-secure-19" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            onClick={() => setIsFavorite(!isFavorite)}
            size="icon-xs"
          >
            <IconStar
              data-favorite={isFavorite}
              className="data-[favorite=true]:fill-blue-600 data-[favorite=true]:stroke-blue-600"
            />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Type to search..." />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary">Search</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Implement a Breadcrumb Component in shadcn/ui (TypeScript/React)

Source: https://ui.shadcn.com/docs/changelog

This example demonstrates how to create an accessible and flexible Breadcrumb component using shadcn/ui, including support for collapsed items with a DropdownMenu, custom separators, and integration with Next.js Link for routing. It showcases the use of BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbEllipsis, and BreadcrumbPage components.

```tsx
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BreadcrumbDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              <BreadcrumbEllipsis className="size-4" />
              <span className="sr-only">Toggle menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Documentation</DropdownMenuItem>
              <DropdownMenuItem>Themes</DropdownMenuItem>
              <DropdownMenuItem>GitHub</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/docs/components">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

--------------------------------

### Add Multiple Resources with shadcn CLI (Bash)

Source: https://ui.shadcn.com/docs/registry/namespace

This command demonstrates how to add multiple resources (`@acme/auth` and `@custom/login-form`) using the `shadcn` CLI. It highlights the dependency resolution behavior where, in case of file path conflicts, the last specified resource wins.

```bash
npx shadcn@latest add @acme/auth @custom/login-form
```

--------------------------------

### Render SidebarMenuButton as Link Element in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This example shows how to use the `asChild` prop with `SidebarMenuButton` to render an `<a>` tag, effectively turning the menu button into a navigable link. This allows for custom child elements to inherit the button's styling and functionality, making it flexible for various navigation needs.

```tsx
<SidebarMenuButton asChild>\n  <a href="#">Home</a>\n</SidebarMenuButton>
```

--------------------------------

### Configure Carousel Autoplay Plugin

Source: https://ui.shadcn.com/docs/components/carousel

Add the Autoplay plugin to the Carousel component using the plugins prop. The Autoplay plugin automatically cycles through carousel items at a specified delay interval. This example shows basic configuration with a 2-second delay between slides.

```ts
import Autoplay from "embla-carousel-autoplay"

export function Example() {
  return (
    <Carousel
      plugins={[
        Autoplay({
          delay: 2000,
        }),
      ]}
    >
      // ...
    </Carousel>
  )
}
```

--------------------------------

### Display Loading Spinners in Input Groups (Shadcn UI, TSX)

Source: https://ui.shadcn.com/docs/components/input-group

This example illustrates how to embed loading indicators, such as the `Spinner` component or `LoaderIcon`, within `InputGroup` addons. It showcases various configurations for providing visual feedback during processing or searching operations, typically with disabled input fields, to improve user experience during asynchronous tasks.

```tsx
import { LoaderIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

export function InputGroupSpinner() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup data-disabled>
        <InputGroupInput placeholder="Searching..." disabled />
        <InputGroupAddon align="inline-end">
          <Spinner />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup data-disabled>
        <InputGroupInput placeholder="Processing..." disabled />
        <InputGroupAddon>
          <Spinner />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup data-disabled>
        <InputGroupInput placeholder="Saving changes..." disabled />
        <InputGroupAddon align="inline-end">
          <InputGroupText>Saving...</InputGroupText>
          <Spinner />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup data-disabled>
        <InputGroupInput placeholder="Refreshing data..." disabled />
        <InputGroupAddon>
          <LoaderIcon className="animate-spin" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText className="text-muted-foreground">
            Please wait...
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Configure ChartTooltip with Custom Label and Name Keys

Source: https://ui.shadcn.com/docs/components/chart

Set up a chart tooltip component using labelKey and nameKey props to map custom data fields for tooltip display. The example shows mapping 'visitors' field as label and 'browser' field as name. Uses ChartTooltipContent component which automatically references colors from the chart config.

```tsx
const chartData = [
  { browser: "chrome", visitors: 187, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
]

const chartConfig = {
  visitors: {
    label: "Total Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

<ChartTooltip
  content={<ChartTooltipContent labelKey="visitors" nameKey="browser" />}
/>
```

--------------------------------

### Display Spinner in an Item Component (TypeScript)

Source: https://ui.shadcn.com/docs/components/spinner

Demonstrates how to integrate the Spinner component within an Item component to show a loading state, such as during payment processing. It utilizes Shadcn UI components like Item, ItemContent, ItemMedia, and ItemTitle to build a structured display. This example sets up a flex container with specific styling for visual presentation.

```tsx
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"

export function SpinnerDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
      <Item variant="muted">
        <ItemMedia>
          <Spinner />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">Processing payment...</ItemTitle>
        </ItemContent>
        <ItemContent className="flex-none justify-end">
          <span className="text-sm tabular-nums">$100.00</span>
        </ItemContent>
      </Item>
    </div>
  )
}
```

--------------------------------

### Spinner Component in Button with Loading States - React/TypeScript

Source: https://ui.shadcn.com/docs/changelog

Demonstrates how to use the Spinner component inside Button components to show loading states. This example shows three different button variants (default, outline, secondary) all with disabled state and loading spinner indicator.

```tsx
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function SpinnerButton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button disabled size="sm">
        <Spinner />
        Loading...
      </Button>
      <Button variant="outline" disabled size="sm">
        <Spinner />
        Please wait
      </Button>
      <Button variant="secondary" disabled size="sm">
        <Spinner />
        Processing
      </Button>
    </div>
  )
}
```

--------------------------------

### Full Recharts Bar Chart with XAxis, Data, and Configuration (TypeScript)

Source: https://ui.shadcn.com/docs/components/chart

This comprehensive example provides a complete React functional component (`Component`) that renders a `BarChart` with an integrated `XAxis`. It includes full data (`chartData`) and configuration (`chartConfig`) definitions, demonstrating a ready-to-use chart with basic styling and an accessible x-axis.

```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export function Component() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

--------------------------------

### Input Group with Text Addons (TSX)

Source: https://ui.shadcn.com/docs/components/input-group

Displays input fields with text addons for currency symbols, URL prefixes, suffixes, and metadata. Supports InputGroupInput and InputGroupTextarea with inline-start, inline-end, and block-end addon positioning. Includes character counter example.

```tsx
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function InputGroupTextExample() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="0.00" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" className="!pl-0.5" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Enter your username" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>@company.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Enter your message" />
        <InputGroupAddon align="block-end">
          <InputGroupText className="text-muted-foreground text-xs">
            120 characters left
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Full Recharts Bar Chart with XAxis, Tooltip, Data, and Config (TypeScript)

Source: https://ui.shadcn.com/docs/components/chart

This comprehensive example presents a full React component that renders a `BarChart` featuring both a configured `XAxis` and an interactive `ChartTooltip`. It includes all necessary imports, data (`chartData`), and chart configuration (`chartConfig`), offering a complete and functional chart with enhanced user interaction.

```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export function Component() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

--------------------------------

### Organize Fields for Responsive Layouts with Shadcn UI FieldGroup (TSX)

Source: https://ui.shadcn.com/docs/components/field

This TSX example showcases the `FieldGroup` component, a layout wrapper designed to stack `Field` components and enable responsive orientations. It supports container queries, allowing for dynamic layout adjustments using utility classes like `@container/field-group`.

```tsx
<FieldGroup className="@container/field-group flex flex-col gap-6">
  <Field>{/* ... */}</Field>
  <Field>{/* ... */}</Field>
</FieldGroup>
```

--------------------------------

### Fetch Projects with SWR - React TypeScript

Source: https://ui.shadcn.com/docs/components/sidebar

Fetches project data using SWR hook with loading state management and skeleton UI fallback. Displays a sidebar menu with project links and icons. Handles loading and empty data states before rendering the project list.

```typescript
function NavProjects() {
  const { data, isLoading } = useSWR("/api/projects", fetcher)

  if (isLoading) {
    return (
      <SidebarMenu>
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  if (!data) {
    return ...
  }

  return (
    <SidebarMenu>
      {data.map((project) => (
        <SidebarMenuItem key={project.name}>
          <SidebarMenuButton asChild>
            <a href={project.url}>
              <project.icon />
              <span>{project.name}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
```

--------------------------------

### Basic Collapsible SidebarMenu Item Structure in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This code provides a simplified structural example of how to implement a single collapsible item within a `SidebarMenu` using Shadcn UI's `Collapsible` component. It illustrates the nesting of `CollapsibleTrigger` and `CollapsibleContent` within `SidebarMenuItem` and `SidebarMenuSub` to enable basic expand/collapse functionality for menu sub-items.

```tsx
<SidebarMenu>\n  <Collapsible defaultOpen className="group/collapsible">\n    <SidebarMenuItem>\n      <CollapsibleTrigger asChild>\n        <SidebarMenuButton />\n      </CollapsibleTrigger>\n      <CollapsibleContent>\n        <SidebarMenuSub>\n          <SidebarMenuSubItem />\n        </SidebarMenuSub>\n      </CollapsibleContent>\n    </SidebarMenuItem>\n  </Collapsible>\n</SidebarMenu>
```

--------------------------------

### Implement Split Button Group with Shadcn DropdownMenu (TSX)

Source: https://ui.shadcn.com/docs/components/button-group

This example demonstrates creating a split button group by combining Shadcn's ButtonGroup with a DropdownMenu. A primary 'Follow' button is paired with a dropdown trigger button, which reveals a menu of actions like 'Mute Conversation', 'Mark as Read', and 'Delete Conversation'. The dropdown utilizes various `DropdownMenu` components such as `DropdownMenuContent`, `DropdownMenuGroup`, and `DropdownMenuItem`, along with `lucide-react` icons to visually represent each action.

```tsx
"use client"\n\nimport {\n  AlertTriangleIcon,\n  CheckIcon,\n  ChevronDownIcon,\n  CopyIcon,\n  ShareIcon,\n  TrashIcon,\n  UserRoundXIcon,\n  VolumeOffIcon,\n} from \"lucide-react\"\n\nimport { Button } from \"@/components/ui/button\"\nimport { ButtonGroup } from \"@/components/ui/button-group\"\nimport {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuGroup,\n  DropdownMenuItem,\n  DropdownMenuSeparator,\n  DropdownMenuTrigger,\n} from \"@/components/ui/dropdown-menu\"\n\nexport function ButtonGroupDropdown() {\n  return (\n    <ButtonGroup>\n      <Button variant=\"outline\">Follow</Button>\n      <DropdownMenu>\n        <DropdownMenuTrigger asChild>\n          <Button variant=\"outline\" className=\"\!pl-2\">\n            <ChevronDownIcon />\n          </Button>\n        </DropdownMenuTrigger>\n        <DropdownMenuContent align=\"end\" className=\"[--radius:1rem]\">\n          <DropdownMenuGroup>\n            <DropdownMenuItem>\n              <VolumeOffIcon />\n              Mute Conversation\n            </DropdownMenuItem>\n            <DropdownMenuItem>\n              <CheckIcon />\n              Mark as Read\n            </DropdownMenuItem>\n            <DropdownMenuItem>\n              <AlertTriangleIcon />\n              Report Conversation\n            </DropdownMenuItem>\n            <DropdownMenuItem>\n              <UserRoundXIcon />\n              Block User\n            </DropdownMenuItem>\n            <DropdownMenuItem>\n              <ShareIcon />\n              Share Conversation\n            </DropdownMenuItem>\n            <DropdownMenuItem>\n              <CopyIcon />\n              Copy Conversation\n            </DropdownMenuItem>\n          </DropdownMenuGroup>\n          <DropdownMenuSeparator />\n          <DropdownMenuGroup>\n            <DropdownMenuItem variant=\"destructive\">\n              <TrashIcon />\n              Delete Conversation\n            </DropdownMenuItem>\n          </DropdownMenuGroup>\n        </DropdownMenuContent>\n      </DropdownMenu>\n    </ButtonGroup>\n  )\n}
```

--------------------------------

### Set Fixed Cell Dimensions for Shadcn UI Calendar with CSS `rem` Units

Source: https://ui.shadcn.com/docs/components/calendar

This example illustrates setting a consistent, fixed cell size for the Shadcn UI Calendar using direct `rem` values within the `--cell-size` CSS variable. While fixed, it also demonstrates how to provide breakpoint-specific overrides for different screen sizes (e.g., `md:[--cell-size:3rem]`). This approach ensures precise control over the calendar's visual layout.

```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-lg border [--cell-size:2.75rem] md:[--cell-size:3rem]"
/>
```

--------------------------------

### Group Form Controls with Shadcn UI FieldSet (TSX)

Source: https://ui.shadcn.com/docs/components/field

This TSX example illustrates the use of the `FieldSet` component to semantically group related form controls, enhancing both structure and accessibility. It typically includes a `FieldLegend` for the group's title and `FieldGroup` to organize the contained fields.

```tsx
<FieldSet>
  <FieldLegend>Delivery</FieldLegend>
  <FieldGroup>{/* Fields */}</FieldGroup>
</FieldSet>
```

--------------------------------

### Create Complex Input Layouts with Shadcn InputGroup (TSX)

Source: https://ui.shadcn.com/docs/components/button-group

This snippet illustrates how to construct a sophisticated input field using Shadcn's InputGroup, integrated within a ButtonGroup. It features an InputGroupInput for text entry, an InputGroupAddon with an InputGroupButton for a toggleable voice mode, and a Tooltip for enhanced user feedback. The example utilizes `lucide-react` for icons and manages state with React's `useState` for the voice-enabled functionality.

```tsx
"use client"\n\nimport * as React from "react"\nimport { AudioLinesIcon, PlusIcon } from "lucide-react"\n\nimport { Button } from "@/components/ui/button"\nimport { ButtonGroup } from "@/components/ui/button-group"\nimport {\n  InputGroup,\n  InputGroupAddon,\n  InputGroupButton,\n  InputGroupInput,\n} from "@/components/ui/input-group"\nimport {\n  Tooltip,\n  TooltipContent,\n  TooltipTrigger,\n} from "@/components/ui/tooltip"\n\nexport function ButtonGroupInputGroup() {\n  const [voiceEnabled, setVoiceEnabled] = React.useState(false)\n\n  return (\n    <ButtonGroup className=\"[--radius:9999rem]\">\n      <ButtonGroup>\n        <Button variant=\"outline\" size=\"icon\">\n          <PlusIcon />\n        </Button>\n      </ButtonGroup>\n      <ButtonGroup>\n        <InputGroup>\n          <InputGroupInput\n            placeholder={\n              voiceEnabled ? \"Record and send audio...\" : \"Send a message...\"\n            }\n            disabled={voiceEnabled}\n          />\n          <InputGroupAddon align=\"inline-end\">\n            <Tooltip>\n              <TooltipTrigger asChild>\n                <InputGroupButton\n                  onClick={() => setVoiceEnabled(!voiceEnabled)}\n                  size=\"icon-xs\"\n                  data-active={voiceEnabled}\n                  className=\"data-[active=true]:bg-orange-100 data-[active=true]:text-orange-700 dark:data-[active=true]:bg-orange-800 dark:data-[active=true]:text-orange-100\"\n                  aria-pressed={voiceEnabled}\n                >\n                  <AudioLinesIcon />\n                </InputGroupButton>\n              </TooltipTrigger>\n              <TooltipContent>Voice Mode</TooltipContent>\n            </Tooltip>\n          </InputGroupAddon>\n        </InputGroup>\n      </ButtonGroup>\n    </ButtonGroup>\n  )\n}
```

--------------------------------

### Configure Field Component Orientation in TSX

Source: https://ui.shadcn.com/docs/components/field

The Field component acts as a core wrapper for form fields, providing control over orientation (vertical, horizontal, responsive), invalid state styling, and spacing. This example demonstrates setting the orientation to horizontal for a label and a switch component.

```tsx
<Field orientation="horizontal">
  <FieldLabel htmlFor="remember">Remember me</FieldLabel>
  <Switch id="remember" />
</Field>
```

--------------------------------

### Implement a multi-section form layout with Shadcn UI components

Source: https://ui.shadcn.com/docs/changelog

This snippet demonstrates how to structure a complex form using Shadcn UI's Field, FieldGroup, FieldSet, and FieldSeparator components. It includes examples of Select, Input, Checkbox, Textarea, and Button components, illustrating common form elements and their associated labels and descriptions. Dependencies include various Shadcn UI form and input components, and it's intended to be used within a React/Next.js application.

```tsx
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                      <SelectItem value="2029">2029</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkout-7j9-cvv">CVV</FieldLabel>
                  <Input id="checkout-7j9-cvv" placeholder="123" required />
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <FieldSet>
            <FieldLegend>Billing Address</FieldLegend>
            <FieldDescription>
              The billing address associated with your payment method
            </FieldDescription>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  id="checkout-7j9-same-as-shipping-wgm"
                  defaultChecked
                />
                <FieldLabel
                  htmlFor="checkout-7j9-same-as-shipping-wgm"
                  className="font-normal"
                >
                  Same as shipping address
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-optional-comments">
                  Comments
                </FieldLabel>
                <Textarea
                  id="checkout-7j9-optional-comments"
                  placeholder="Add any additional comments"
                  className="resize-none"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
```

--------------------------------

### Render Custom Component with ButtonGroupText asChild (Shadcn UI, React)

Source: https://ui.shadcn.com/docs/components/button-group

This advanced example demonstrates using the `asChild` prop with `ButtonGroupText` to render a custom component, specifically a `Label`, within the button group. This provides flexibility to integrate other UI elements while maintaining the `ButtonGroup`'s styling and layout properties.

```tsx
import { ButtonGroupText } from \"@/components/ui/button-group\"\nimport { Label } from \"@/components/ui/label\"\n\nexport function ButtonGroupTextDemo() {\n  return (\n    <ButtonGroup>\n      <ButtonGroupText asChild>\n        <Label htmlFor=\"name\">Text</Label>\n      </ButtonGroupText>\n      <Input placeholder=\"Type something here...\" id=\"name\" />\n    </ButtonGroup>\n  )\n}
```

--------------------------------

### shadcn Registry: Custom Unauthorized Access Error Message

Source: https://ui.shadcn.com/docs/changelog

Registry authors can provide custom, actionable error messages in their API responses. This example shows an 'Unauthorized' error, detailing that an API key has expired and providing a renewal link, aiding users and AI agents in quick problem resolution.

```txt
Error:
You are not authorized to access the item at http://example.com/r/component.

Message:
[Unauthorized] Your API key has expired. Renew it at https://example.com/api/renew-key.
```

--------------------------------

### Configure Basic Version Parameter for Registry Resources

Source: https://ui.shadcn.com/docs/registry/namespace

Sets up a versioned registry using query parameters to control which version of resources are resolved. Allows pinning specific versions across the registry.

```json
{
  "@versioned": {
    "url": "https://registry.example.com/{name}",
    "params": {
      "version": "v2"
    }
  }
}
```

--------------------------------

### Reference Themed Colors in Shadcn UI Chart Components (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/chart

This snippet demonstrates how to apply defined theme colors to chart components using the `fill` prop with a CSS variable reference, for example, `var(--color-desktop)`. This ensures consistency with the chart's overall theme configuration.

```tsx
<Bar dataKey="desktop" fill="var(--color-desktop)" />
```

--------------------------------

### Apply Custom Spinner Colors with Utility Classes (TypeScript)

Source: https://ui.shadcn.com/docs/components/spinner

Demonstrates how to customize the color of the Spinner component using Tailwind CSS `text-*` utility classes. This example displays several spinners, each with a different color applied, such as red, green, blue, yellow, and purple. It highlights the flexibility in styling the spinner to match specific brand guidelines or UI themes.

```tsx
import { Spinner } from "@/components/ui/spinner"

export function SpinnerColor() {
  return (
    <div className="flex items-center gap-6">
      <Spinner className="size-6 text-red-500" />
      <Spinner className="size-6 text-green-500" />
      <Spinner className="size-6 text-blue-500" />
      <Spinner className="size-6 text-yellow-500" />
      <Spinner className="size-6 text-purple-500" />
    </div>
  )
}
```

--------------------------------

### Add Accessibility Label to NativeSelect Component (tsx)

Source: https://ui.shadcn.com/docs/components/native-select

This example demonstrates enhancing accessibility for the `NativeSelect` component by using the `aria-label` attribute. The label provides a descriptive text for screen readers, ensuring users understand the purpose of the select input. It contains options for different languages.

```tsx
<NativeSelect aria-label="Choose your preferred language">
  <NativeSelectOption value="en">English</NativeSelectOption>
  <NativeSelectOption value="es">Spanish</NativeSelectOption>
  <NativeSelectOption value="fr">French</NativeSelectOption>
</NativeSelect>
```

--------------------------------

### Implement a Login Form using Shadcn Card Component (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/card

This snippet demonstrates how to create a complete login form UI using the Shadcn Card component in a React application. It integrates CardHeader, CardContent, and CardFooter, along with Button, Input, and Label components for user interaction. This example relies on Shadcn UI components and a React environment.

```tsx
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button variant="link">Sign Up</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Login
        </Button>
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  )
}
```

--------------------------------

### Configure Files for a Registry Item in JSON

Source: https://ui.shadcn.com/docs/registry/registry-item-json

This JSON snippet demonstrates how to define files for a registry item, specifying their paths, types (e.g., page, component, hook, file), and optional target locations within a project. The `target` property is crucial for `registry:page` and `registry:file` types to dictate where the file should be placed, with `~` referring to the project root.

```json
{
  "files": [
    {
      "path": "registry/new-york/hello-world/page.tsx",
      "type": "registry:page",
      "target": "app/hello/page.tsx"
    },
    {
      "path": "registry/new-york/hello-world/hello-world.tsx",
      "type": "registry:component"
    },
    {
      "path": "registry/new-york/hello-world/use-hello-world.ts",
      "type": "registry:hook"
    },
    {
      "path": "registry/new-york/hello-world/.env",
      "type": "registry:file",
      "target": "~/.env"
    }
  ]
}
```

--------------------------------

### Implement a Shadcn UI Hover Card with Avatar and Button in React/TypeScript

Source: https://ui.shadcn.com/docs/components/hover-card

This snippet provides a full example of a `HoverCardDemo` component using Shadcn UI. It integrates an `Avatar` and `Button` within the `HoverCardContent` to display user information on hover. This component showcases a rich, interactive hover card experience.

```tsx
import { CalendarIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

export function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="text-muted-foreground text-xs">
              Joined December 2021
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
```

--------------------------------

### Define Array Field Structure with Shadcn Components

Source: https://ui.shadcn.com/docs/forms/react-hook-form

This JSX snippet illustrates how to structure an array field using Shadcn's `FieldSet`, `FieldLegend`, and `FieldDescription` components. This setup provides semantic grouping and a clear description for a collection of dynamic array items.

```tsx
<FieldSet className="gap-4">
  <FieldLegend variant="label">Email Addresses</FieldLegend>
  <FieldDescription>
    Add up to 5 email addresses where we can contact you.
  </FieldDescription>
  <FieldGroup className="gap-4">{/* Array items go here */}</FieldGroup>
</FieldSet>
```

--------------------------------

### Build an Accessible Form with Shadcn UI Field Components (TSX)

Source: https://ui.shadcn.com/docs/components/field

This TypeScript React example demonstrates how to construct a complex, accessible form using various Shadcn UI components. It combines Field, FieldGroup, FieldSet, FieldLabel, FieldDescription, Input, Select, and Checkbox to create a payment and billing information form with proper semantic structure and accessibility attributes.

```tsx
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function FieldDemo() {
  return (
    <div className="w-full max-w-md">
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Payment Method</FieldLegend>
            <FieldDescription>
              All transactions are secure and encrypted
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                  Name on Card
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-name-43j"
                  placeholder="Evil Rabbit"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  Card Number
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-number-uw1"
                  placeholder="1234 5678 9012 3456"
                  required
                />
                <FieldDescription>
                  Enter your 16-digit card number
                </FieldDescription>
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="checkout-exp-month-ts6">
                    Month
                  </FieldLabel>
                  <Select defaultValue="">
                    <SelectTrigger id="checkout-exp-month-ts6">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01</SelectItem>
                      <SelectItem value="02">02</SelectItem>
                      <SelectItem value="03">03</SelectItem>
                      <SelectItem value="04">04</SelectItem>
                      <SelectItem value="05">05</SelectItem>
                      <SelectItem value="06">06</SelectItem>
                      <SelectItem value="07">07</SelectItem>
                      <SelectItem value="08">08</SelectItem>
                      <SelectItem value="09">09</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkout-7j9-exp-year-f59">
                    Year
                  </FieldLabel>
                  <Select defaultValue="">
                    <SelectTrigger id="checkout-7j9-exp-year-f59">
                      <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                      <SelectItem value="2029">2029</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkout-7j9-cvv">CVV</FieldLabel>
                  <Input id="checkout-7j9-cvv" placeholder="123" required />
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <FieldSet>
            <FieldLegend>Billing Address</FieldLegend>
            <FieldDescription>
              The billing address associated with your payment method
            </FieldDescription>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  id="checkout-7j9-same-as-shipping-wgm"
                  defaultChecked
                />
                <FieldLabel
                  htmlFor="checkout-7j9-same-as-shipping-wgm"
                  className="font-normal"
                >
                  Same as shipping address
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldGroup>
              <Field>

```

--------------------------------

### Integrate Spinner into a Button for Loading State (TypeScript)

Source: https://ui.shadcn.com/docs/components/spinner

Shows how to embed a Spinner component within a button to visually indicate a loading or processing state. This example includes multiple buttons with different variants (default, outline, secondary) and disabled states, each displaying a spinner alongside descriptive text. The Button component automatically handles the appropriate spacing between the spinner and its content.

```tsx
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function SpinnerButton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button disabled size="sm">
        <Spinner />
        Loading...
      </Button>
      <Button variant="outline" disabled size="sm">
        <Spinner />
        Please wait
      </Button>
      <Button variant="secondary" disabled size="sm">
        <Spinner />
        Processing
      </Button>
    </div>
  )
}
```

--------------------------------

### Embed Spinner within a Badge for Status Indication (TypeScript)

Source: https://ui.shadcn.com/docs/components/spinner

Illustrates the usage of a Spinner component inside a Badge to signify an ongoing process or status. This example displays several badges with different variants (default, secondary, outline), each containing a spinner and relevant text like 'Syncing' or 'Updating'. It demonstrates how to visually enhance status indicators with an animated element.

```tsx
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

export function SpinnerBadge() {
  return (
    <div className="flex items-center gap-4 [--radius:1.2rem]">
      <Badge>
        <Spinner />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Spinner />
        Updating
      </Badge>
      <Badge variant="outline">
        <Spinner />
        Processing
      </Badge>
    </div>
  )
}
```

--------------------------------

### Implement and Customize Shadcn UI Tooltip Component in React (TSX)

Source: https://ui.shadcn.com/docs/components/chart

This React component demonstrates how to use and customize the `TooltipDemo` component from Shadcn UI. It shows examples of setting labels, defining data payloads with names, values, and fill colors, and specifying different indicator types (default, dashed, line, dot). The component uses utility functions for class name concatenation and integrates SVG elements for visual context.

```tsx
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function Component() {
  return (
    <div className="text-foreground grid aspect-video w-full max-w-md justify-center md:grid-cols-2 [&>div]:relative [&>div]:flex [&>div]:h-[137px] [&>div]:w-[224px] [&>div]:items-center [&>div]:justify-center [&>div]:p-4">
      <div>
        <div className="absolute top-[45px] left-[-35px] z-10 text-sm font-medium">
          Label
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 193 40"
          width="50"
          height="12"
          fill="none"
          className="absolute top-[50px] left-[5px] z-10"
        >
          <g clipPath="url(#a)">
            <path
              fill="currentColor"
              d="M173.928 21.13C115.811 44.938 58.751 45.773 0 26.141c4.227-4.386 7.82-2.715 10.567-1.88 21.133 5.64 42.9 6.266 64.457 7.101 31.066 1.253 60.441-5.848 89.183-17.335 1.268-.418 2.325-1.253 4.861-2.924-14.582-2.924-29.165 2.089-41.845-3.76.212-.835.212-1.879.423-2.714 9.51-.627 19.231-1.253 28.742-2.089 9.51-.835 18.808-1.88 28.318-2.506 6.974-.418 9.933 2.924 7.397 9.19-3.17 8.145-7.608 15.664-11.623 23.391-.423.836-1.057 1.88-1.902 2.298-2.325.835-4.65 1.044-7.186 1.67-.422-2.088-1.479-4.386-1.268-6.265.423-2.506 1.902-4.595 3.804-9.19Z"
            />
          </g>
          <defs>
            <clipPath id="a">
              <path fill="currentColor" d="M0 0h193v40H0z" />
            </clipPath>
          </defs>
        </svg>
        <TooltipDemo
          label="Page Views"
          payload={[
            { name: "Desktop", value: 186, fill: "hsl(var(--chart-1))" },
            { name: "Mobile", value: 80, fill: "hsl(var(--chart-2))" },
          ]}
          className="w-[8rem]"
        />
      </div>
      <div className="items-end">
        <div className="absolute top-[0px] left-[122px] z-10 text-sm font-medium">
          Name
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="35"
          height="42"
          fill="none"
          viewBox="0 0 122 148"
          className="absolute top-[10px] left-[85px] z-10 -scale-x-100"
        >
          <g clipPath="url(#ab)">
            <path
              fill="currentColor"
              d="M0 2.65c6.15-4.024 12.299-2.753 17.812-.847a115.56 115.56 0 0 1 21.84 10.59C70.4 32.727 88.849 61.744 96.483 97.54c1.908 9.108 2.544 18.639 3.817 29.017 8.481-4.871 12.934-14.402 21.416-19.909 1.061 4.236-1.06 6.989-2.756 9.319-6.998 9.531-14.207 19.062-21.63 28.382-3.604 4.448-6.36 4.871-10.177 1.059-8.058-7.837-12.935-17.368-14.42-28.382 0-.424.636-1.059 1.485-2.118 9.118 2.33 6.997 13.979 14.843 18.215 3.393-14.614.848-28.593-2.969-42.149-4.029-14.19-9.33-27.746-17.812-39.82-8.27-11.86-18.66-21.392-30.11-30.287C26.93 11.758 14.207 6.039 0 2.65Z"
            />
          </g>
          <defs>
            <clipPath id="ab">
              <path fill="currentColor" d="M0 0h122v148H0z" />
            </clipPath>
          </defs>
        </svg>
        <TooltipDemo
          label="Browser"
          hideLabel
          payload={[
            { name: "Chrome", value: 1286, fill: "hsl(var(--chart-3))" },
            { name: "Firefox", value: 1000, fill: "hsl(var(--chart-4))" },
          ]}
          indicator="dashed"
          className="w-[8rem]"
        />
      </div>
      <div className="!hidden md:!flex">
        <TooltipDemo
          label="Page Views"
          payload={[
            { name: "Desktop", value: 12486, fill: "hsl(var(--chart-3))" },
          ]}
          className="w-[9rem]"
          indicator="line"
        />
      </div>
      <div className="!items-start !justify-start">
        <div className="absolute top-[60px] left-[50px] z-10 text-sm font-medium">
          Indicator
        </div>
        <TooltipDemo
          label="Browser"
          hideLabel
          payload={[
            { name: "Chrome", value: 1286, fill: "hsl(var(--chart-1))" },
          ]}
          indicator="dot"
          className="w-[8rem]"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="34"
          fill="none"
          viewBox="0 0 75 175"
          className="absolute top-[38px] left-[30px] z-10 rotate-[-40deg]"
        >
          <g clipPath="url(#abc)">
            <path
              fill="currentColor"
```

--------------------------------

### Adjust Spinner Size with Utility Classes (TypeScript)

Source: https://ui.shadcn.com/docs/components/spinner

Illustrates how to change the visual size of the Spinner component using Tailwind CSS `size-*` utility classes directly via the `className` prop. This example renders multiple spinners with different predefined sizes, including `size-3`, `size-4`, `size-6`, and `size-8`. It provides a clear demonstration of how to apply various size variations to the spinner.

```tsx
import { Spinner } from "@/components/ui/spinner"

export function SpinnerSize() {
  return (
    <div className="flex items-center gap-6">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  )
}
```

--------------------------------

### Implement Textarea with TanStack React Form and Zod Validation

Source: https://ui.shadcn.com/docs/forms/tanstack-form

This example demonstrates a complete React component (`FormTanstackTextarea`) that integrates a Shadcn UI `Textarea` with `@tanstack/react-form` for state management and Zod for validation. It showcases form submission with `sonner` toasts, dynamic error display, and reset functionality.

```tsx
/* eslint-disable react/no-children-prop */
"use client"

import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  about: z
    .string()
    .min(10, "Please provide at least 10 characters.")
    .max(200, "Please keep it under 200 characters."),
})

export function FormTanstackTextarea() {
  const form = useForm({
    defaultValues: {
      about: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast("You submitted the following values:", {
        description: (
          <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
        position: "bottom-right",
        classNames: {
          content: "flex flex-col gap-2",
        },
        style: {
          "--border-radius": "calc(var(--radius)  + 4px)",
        } as React.CSSProperties,
      })
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Personalization</CardTitle>
        <CardDescription>
          Customize your experience by telling us more about yourself.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-textarea"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="about"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="form-tanstack-textarea-about">
                      More about you
                    </FieldLabel>
                    <Textarea
                      id="form-tanstack-textarea-about"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="I'm a software engineer..."
                      className="min-h-[120px]"
                    />
                    <FieldDescription>
                      Tell us more about yourself. This will be used to help us
                      personalize your experience.
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-textarea">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

--------------------------------

### Complete Table Demo with Sample Data

Source: https://ui.shadcn.com/docs/components/table

A full implementation of the Table component displaying invoice data with headers, body, and footer. Includes sample data structure and demonstrates mapping over data to create table rows.

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
]

export function TableDemo() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
```

--------------------------------

### Create Label Component with Checkbox - TypeScript React

Source: https://ui.shadcn.com/docs/components/label

Demonstrates creating an accessible label paired with a checkbox control. The Label component uses the htmlFor attribute to associate with the checkbox's id, ensuring proper accessibility. This example shows a common pattern for form controls with label associations.

```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function LabelDemo() {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    </div>
  )
}
```

--------------------------------

### Radio Group with Two Options Usage - TypeScript/React

Source: https://ui.shadcn.com/docs/components/radio-group

Example usage of RadioGroup with two mutually exclusive options (Option One and Option Two). Features default value selection, individual option items with IDs, and associated labels. Uses flex layout with space-x-2 for consistent spacing.

```typescript
<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <Label htmlFor="option-one">Option One</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <Label htmlFor="option-two">Option Two</Label>
  </div>
</RadioGroup>
```

--------------------------------

### Understand `npm` Peer Dependency Error for React 19

Source: https://ui.shadcn.com/docs/react-19

This `npm` error output demonstrates a common `ERESOLVE` issue encountered when a package's peer dependencies do not explicitly list React 19. It indicates a conflict where the root project uses React 19 but a dependency expects an older version, leading to installation failure.

```bash
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error
npm error While resolving: my-app@0.1.0
npm error Found: react@19.0.0-rc-69d4b800-20241021
npm error node_modules/react
npm error   react@"19.0.0-rc-69d4b800-20241021" from the root project
```

--------------------------------

### Implement React Hook Form Radio Group with Zod and Shadcn UI

Source: https://ui.shadcn.com/docs/forms/react-hook-form

This comprehensive example showcases how to build a subscription plan selection form using Shadcn UI's RadioGroup, managed by React Hook Form, and validated with Zod. It includes state management for radio inputs, error display using `FieldError`, and form submission handling with `sonner` toasts.

```tsx
"use client"\n\nimport * as React from \"react\"\nimport { zodResolver } from \"@hookform/resolvers/zod\"\nimport { Controller, useForm } from \"react-hook-form\"\nimport { toast } from \"sonner\"\nimport * as z from \"zod\"\n\nimport { Button } from \"@/components/ui/button\"\nimport {\n  Card,\n  CardContent,\n  CardDescription,\n  CardFooter,\n  CardHeader,\n  CardTitle,\n} from \"@/components/ui/card\"\nimport {\n  Field,\n  FieldContent,\n  FieldDescription,\n  FieldError,\n  FieldGroup,\n  FieldLabel,\n  FieldLegend,\n  FieldSet,\n  FieldTitle,\n} from \"@/components/ui/field\"\nimport {\n  RadioGroup,\n  RadioGroupItem,\n} from \"@/components/ui/radio-group\"\n\nconst plans = [\n  {\n    id: \"starter\",\n    title: \"Starter (100K tokens/month)\",\n    description: \"For everyday use with basic features.\",\n  },\n  {\n    id: \"pro\",\n    title: \"Pro (1M tokens/month)\",\n    description: \"For advanced AI usage with more features.\",\n  },\n  {\n    id: \"enterprise\",\n    title: \"Enterprise (Unlimited tokens)\",\n    description: \"For large teams and heavy usage.\",\n  },\n] as const\n\nconst formSchema = z.object({\n  plan: z.string().min(1, \"You must select a subscription plan to continue.\"),\n})\n\nexport function FormRhfRadioGroup() {\n  const form = useForm<z.infer<typeof formSchema>>({\n    resolver: zodResolver(formSchema),\n    defaultValues: {\n      plan: \"\",\n    },\n  })\n\n  function onSubmit(data: z.infer<typeof formSchema>) {\n    toast(\"You submitted the following values:\", {\n      description: (\n        <pre className=\"bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4\">\n          <code>{JSON.stringify(data, null, 2)}</code>\n        </pre>\n      ),\n      position: \"bottom-right\",\n      classNames: {\n        content: \"flex flex-col gap-2\",\n      },\n      style: {\n        \"--border-radius\": \"calc(var(--radius)  + 4px)\",\n      } as React.CSSProperties,\n    })\n  }\n\n  return (\n    <Card className=\"w-full sm:max-w-md\">\n      <CardHeader>\n        <CardTitle>Subscription Plan</CardTitle>\n        <CardDescription>\n          See pricing and features for each plan.\n        </CardDescription>\n      </CardHeader>\n      <CardContent>\n        <form id=\"form-rhf-radiogroup\" onSubmit={form.handleSubmit(onSubmit)}>\n          <FieldGroup>\n            <Controller\n              name=\"plan\"\n              control={form.control}\n              render={({ field, fieldState }) => (\n                <FieldSet data-invalid={fieldState.invalid}>\n                  <FieldLegend>Plan</FieldLegend>\n                  <FieldDescription>\n                    You can upgrade or downgrade your plan at any time.\n                  </FieldDescription>\n                  <RadioGroup\n                    name={field.name}\n                    value={field.value}\n                    onValueChange={field.onChange}\n                    aria-invalid={fieldState.invalid}\n                  >\n                    {plans.map((plan) => (\n                      <FieldLabel\n                        key={plan.id}\n                        htmlFor={`form-rhf-radiogroup-${plan.id}`}\n                      >\n                        <Field\n                          orientation=\"horizontal\"\n                          data-invalid={fieldState.invalid}\n                        >\n                          <FieldContent>\n                            <FieldTitle>{plan.title}</FieldTitle>\n                            <FieldDescription>\n                              {plan.description}\n                            </FieldDescription>\n                          </FieldContent>\n                          <RadioGroupItem\n                            value={plan.id}\n                            id={`form-rhf-radiogroup-${plan.id}`}\n                            aria-invalid={fieldState.invalid}\n                          />\n                        </Field>\n                      </FieldLabel>\n                    ))}\n                  </RadioGroup>\n                  {fieldState.invalid && (\n                    <FieldError errors={[fieldState.error]} />\n                  )}\n                </FieldSet>\n              )}\n            />\n          </FieldGroup>\n        </form>\n      </CardContent>\n      <CardFooter>\n        <Field orientation=\"horizontal\">\n          <Button type=\"button\" variant=\"outline\" onClick={() => form.reset()}>\n            Reset\n          </Button>\n          <Button type=\"submit\" form=\"form-rhf-radiogroup\">\n            Save\n          </Button>\n        </Field>\n      </CardFooter>\n    </Card>\n  )\n}
```

--------------------------------

### Render a Submit Button for React Hook Form

Source: https://ui.shadcn.com/docs/forms/react-hook-form

Demonstrates rendering a submit button within a Shadcn UI CardFooter component. The button is explicitly linked to a form via its `form` attribute for submission, indicating its role in a larger React Hook Form setup.

```tsx
<Button type="submit" form="form-rhf-demo">
  Submit
</Button>
```

--------------------------------

### Configure CSS Variables for Shadcn UI Sidebar

Source: https://ui.shadcn.com/docs/components/sidebar

This CSS block defines custom properties (variables) for the Shadcn UI Sidebar component, including its background, foreground, primary, accent, border, and ring colors for both light and dark themes. These variables are typically placed in `app/globals.css` and can be overridden for custom theming, applying to both CLI and manual installations.

```css
@layer base {
  :root {
    --sidebar: oklch(0.985 0 0);
    --sidebar-foreground: oklch(0.145 0 0);
    --sidebar-primary: oklch(0.205 0 0);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.97 0 0);
    --sidebar-accent-foreground: oklch(0.205 0 0);
    --sidebar-border: oklch(0.922 0 0);
    --sidebar-ring: oklch(0.708 0 0);
  }

  .dark {
    --sidebar: oklch(0.205 0 0);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.269 0 0);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.439 0 0);
  }
}
```

--------------------------------

### Add Pagination Controls to Shadcn UI Table (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/data-table

Integrate previous and next page buttons into a Shadcn UI DataTable component. This example uses `@tanstack/react-table`'s `table.previousPage()` and `table.nextPage()` methods, along with `Button` components from Shadcn UI, disabling them when navigation is not possible via `getCanPreviousPage()` and `getCanNextPage()`.

```tsx
import { Button } from "@/components/ui/button"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          { // .... }
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

--------------------------------

### Configure Dependency Resolution Order for Dashboard Component

Source: https://ui.shadcn.com/docs/registry/namespace

Shows how multiple dependencies are resolved in order, with later dependencies potentially overriding earlier ones if they target the same file path. Useful for understanding resolution precedence in complex component hierarchies.

```json
{
  "name": "dashboard",
  "registryDependencies": [
    "@shadcn/card",
    "@vendor/chart",
    "@custom/card"
  ]
}
```

--------------------------------

### Manage Select Component with React Hook Form

Source: https://ui.shadcn.com/docs/forms/react-hook-form

This example demonstrates how to connect a Shadcn UI `Select` component, used for choosing a billing period, to React Hook Form's `Controller`. It ensures the selected value is reflected in the form state and handles invalid states for styling.

```tsx
            <Controller
              name="billingPeriod"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-complex-billingPeriod">
                    Billing Period
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="form-rhf-complex-billingPeriod"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Choose how often you want to be billed.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
```

--------------------------------

### Commit Pending Changes Before Component Updates

Source: https://ui.shadcn.com/docs/tailwind-v4

This `bash` command sequence is recommended before running CLI tools that might overwrite components. It stages all changes and commits them, ensuring a recoverable state.

```bash
git add .
git commit -m "..."
```

--------------------------------

### Group Keyboard Keys with KbdGroup

Source: https://ui.shadcn.com/docs/components/kbd

Demonstrates how to use the KbdGroup component to group multiple Kbd components together. Useful for displaying keyboard shortcuts and combinations in a visually grouped manner.

```tsx
import { Kbd, KbdGroup } from "@/components/ui/kbd"

export function KbdGroupExample() {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-foreground text-sm">
        Use{" "}
        <KbdGroup>
          <Kbd>Ctrl + B</Kbd>
          <Kbd>Ctrl + K</Kbd>
        </KbdGroup>{" "}
        to open the command palette
      </p>
    </div>
  )
}
```

--------------------------------

### Configure TanStack Form Validation Modes (TSX)

Source: https://ui.shadcn.com/docs/forms/tanstack-form

This example illustrates how to configure multiple validation modes within TanStack Form's `validators` option. By specifying `onSubmit`, `onChange`, and `onBlur`, validation can be triggered at different interaction points, providing flexible user feedback.

```tsx
const form = useForm({
  defaultValues: {
    title: "",
    description: "",
  },
  validators: {
    onSubmit: formSchema,
    onChange: formSchema,
    onBlur: formSchema,
  },
})
```

--------------------------------

### React Suspense Integration with Server Components

Source: https://ui.shadcn.com/docs/components/sidebar

Demonstrates proper integration of React.Suspense with server components to handle asynchronous data fetching. The Suspense boundary wraps the NavProjects server component and displays NavProjectsSkeleton as a fallback UI. This pattern enables progressive rendering and improved user experience.

```tsx
function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <React.Suspense fallback={<NavProjectsSkeleton />}>
              <NavProjects />
            </React.Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

--------------------------------

### Configure Shadcn Registry with Query Parameter Authentication (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This configuration illustrates authenticating a shadcn registry by including credentials as query parameters. The `params` object defines keys like `api_key`, `client_id`, and `signature`, which are dynamically populated from respective environment variables for secure access.

```json
{
  "@secure": {
    "url": "https://registry.example.com/{name}.json",
    "params": {
      "api_key": "${API_KEY}",
      "client_id": "${CLIENT_ID}",
      "signature": "${REQUEST_SIGNATURE}"
    }
  }
}
```

--------------------------------

### Update All Shadcn UI Components via CLI

Source: https://ui.shadcn.com/docs/tailwind-v4

This `bash` command uses the Shadcn CLI to add or update all components, with the `--overwrite` flag indicating that existing component files will be replaced. It's crucial for applying new component versions or dark mode changes.

```bash
npx shadcn@latest add --all --overwrite
```

--------------------------------

### Make Shadcn UI Table Header Cell Sortable (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/data-table

Modify a specific `ColumnDef` to render a sortable header cell for a Shadcn UI table. This example shows how to add a `Button` with an `ArrowUpDown` icon to the 'email' column header, allowing users to toggle sorting direction using `column.toggleSorting()`.

```tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
]
```

--------------------------------

### Implement Shadcn UI Select with TanStack Form and Zod Validation in React

Source: https://ui.shadcn.com/docs/forms/tanstack-form

This example demonstrates how to build a form with a Select input using `@tanstack/react-form` for form state management and `zod` for schema validation. It integrates Shadcn UI's `Select` component, utilizing `SelectTrigger`, `SelectValue`, `SelectContent`, and `SelectItem` to construct the user interface. The snippet also illustrates how to handle and display validation errors by conditionally setting `aria-invalid` on the `SelectTrigger` and `data-invalid` on the `Field` component.

```tsx
/* eslint-disable react/no-children-prop */
"use client"

import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const spokenLanguages = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Italian", value: "it" },
  { label: "Chinese", value: "zh" },
  { label: "Japanese", value: "ja" },
] as const

const formSchema = z.object({
  language: z
    .string()
    .min(1, "Please select your spoken language.")
    .refine((val) => val !== "auto", {
      message:
        "Auto-detection is not allowed. Please select a specific language.",
    }),
})

export function FormTanstackSelect() {
  const form = useForm({
    defaultValues: {
      language: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast("You submitted the following values:", {
        description: (
          <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
        position: "bottom-right",
        classNames: {
          content: "flex flex-col gap-2",
        },
        style: {
          "--border-radius": "calc(var(--radius)  + 4px)",
        } as React.CSSProperties,
      })
    },
  })

  return (
    <Card className="w-full sm:max-w-lg">
      <CardHeader>
        <CardTitle>Language Preferences</CardTitle>
        <CardDescription>
          Select your preferred spoken language.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-select"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="language"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field orientation="responsive" data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-tanstack-select-language">
                        Spoken Language
                      </FieldLabel>
                      <FieldDescription>
                        For best results, select the language you speak.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </FieldContent>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger
                        id="form-tanstack-select-language"
                        aria-invalid={isInvalid}
                        className="min-w-[120px]"
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectSeparator />
                        {spokenLanguages.map((language) => (
                          <SelectItem
                            key={language.value}
                            value={language.value}
                          >
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-select">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

--------------------------------

### Item Link Component with asChild Prop in TSX

Source: https://ui.shadcn.com/docs/components/item

Renders Item components as anchor links with hover and focus states applied to the anchor element using the asChild prop. Includes examples of internal links with chevron icons and external links with security attributes and external link icons from lucide-react.

```tsx
import { ChevronRightIcon, ExternalLinkIcon } from "lucide-react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"

export function ItemLink() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Item asChild>
        <a href="#">
          <ItemContent>
            <ItemTitle>Visit our documentation</ItemTitle>
            <ItemDescription>
              Learn how to get started with our components.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </a>
      </Item>
      <Item variant="outline" asChild>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <ItemContent>
            <ItemTitle>External resource</ItemTitle>
            <ItemDescription>
              Opens in a new tab with security attributes.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ExternalLinkIcon className="size-4" />
          </ItemActions>
        </a>
      </Item>
    </div>
  )
}
```

--------------------------------

### Implement a React Select Field with Form Validation

Source: https://ui.shadcn.com/docs/forms/tanstack-form

This example showcases a `form.Field` component that renders a dropdown `Select` for choosing a billing period. It integrates with the form's state (`field.state.value`, `field.handleChange`) and displays validation errors using `FieldError` based on the `isInvalid` status, providing clear user feedback.

```tsx
<form.Field
  name="billingPeriod"
  children={(field) => {
    const isInvalid =
      field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Billing Period</FieldLabel>
        <Select
          name={field.name}
          value={field.state.value}
          onValueChange={field.handleChange}
          aria-invalid={isInvalid}
        >
          <SelectTrigger id={field.name}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          Choose how often you want to be billed.
        </FieldDescription>
        {isInvalid && (
          <FieldError errors={field.state.meta.errors} />
        )}
      </Field>
    )
  }}
/>
```

--------------------------------

### Render a Basic Command Menu Structure in React (TypeScript)

Source: https://ui.shadcn.com/docs/components/command

This code demonstrates the fundamental JSX structure required to render a basic `Command` menu component. It includes a search input, a list of items organized under 'Suggestions' and 'Settings' headings, and a visual separator. This provides a functional yet minimal command palette capable of basic user interaction and navigation.

```tsx
<Command>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>Calendar</CommandItem>
      <CommandItem>Search Emoji</CommandItem>
      <CommandItem>Calculator</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Settings">
      <CommandItem>Profile</CommandItem>
      <CommandItem>Billing</CommandItem>
      <CommandItem>Settings</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

--------------------------------

### Implement a Full Command Menu Demo in React (TypeScript)

Source: https://ui.shadcn.com/docs/components/command

This code showcases a complete implementation of the `Command` menu component in React using Shadcn UI. It integrates various sub-components like `CommandInput`, `CommandList`, `CommandGroup`, and `CommandItem` to create a functional command palette with search, grouped suggestions, and settings, incorporating icons from `lucide-react` for enhanced visuals.

```tsx
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandDemo() {
  return (
    <Command className="rounded-lg border shadow-md md:min-w-[450px]">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Smile />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem disabled>
            <Calculator />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
```

--------------------------------

### Set Environment Variables for Registry Authentication

Source: https://ui.shadcn.com/docs/mcp

This Bash snippet illustrates how to define environment variables like 'REGISTRY_TOKEN' and 'API_KEY' in a '.env.local' file. These variables are crucial for authenticating with private registries and ensuring secure access to component libraries without hardcoding sensitive credentials.

```bash
REGISTRY_TOKEN=your_token_here
API_KEY=your_api_key_here
```

--------------------------------

### Apply Invalid State to NativeSelect Component (tsx)

Source: https://ui.shadcn.com/docs/components/native-select

This snippet shows a direct example of applying the `aria-invalid="true"` attribute to a `NativeSelect` component. This attribute signals to assistive technologies and styling systems that the input currently holds an invalid value. It includes several `NativeSelectOption` elements for various countries.

```tsx
<NativeSelect aria-invalid="true">
  <NativeSelectOption value="">Select a country</NativeSelectOption>
  <NativeSelectOption value="us">United States</NativeSelectOption>
  <NativeSelectOption value="uk">United Kingdom</NativeSelectOption>
  <NativeSelectOption value="ca">Canada</NativeSelectOption>
</NativeSelect>
```

--------------------------------

### Server Component for Fetching and Rendering Projects

Source: https://ui.shadcn.com/docs/components/sidebar

An async server component that fetches project data and renders a menu list. The component awaits the fetchProjects() function and dynamically generates menu items with project icons and names. Each project item is wrapped with SidebarMenuButton for interactive behavior.

```tsx
async function NavProjects() {
  const projects = await fetchProjects()

  return (
    <SidebarMenu>
      {projects.map((project) => (
        <SidebarMenuItem key={project.name}>
          <SidebarMenuButton asChild>
            <a href={project.url}>
              <project.icon />
              <span>{project.name}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
```

--------------------------------

### Display React Hook Form validation errors with FieldError and ARIA attributes (TypeScript)

Source: https://ui.shadcn.com/docs/forms/react-hook-form

This example shows how to display validation errors for a form field using React Hook Form's `Controller`. It demonstrates conditionally rendering `FieldError` and applying `data-invalid` and `aria-invalid` attributes for styling and improved accessibility.

```tsx
<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
      <Input
        {...field}
        id={field.name}
        type="email"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

--------------------------------

### Implement Checkboxes with TanStack Form and shadcn/ui

Source: https://ui.shadcn.com/docs/forms/tanstack-form

This TypeScript/TSX example demonstrates how to integrate single and array checkboxes into a form using TanStack React Form and shadcn/ui components. It covers form initialization with `useForm`, Zod validation for both boolean and array checkboxes, handling `onCheckedChange` for state updates, displaying errors with `aria-invalid` and `data-invalid` props, and managing checkbox arrays with `mode="array"` and `tasks.map`.

```tsx
/* eslint-disable react/no-children-prop */
"use client"

import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"

const tasks = [
  {
    id: "push",
    label: "Push notifications",
  },
  {
    id: "email",
    label: "Email notifications",
  },
] as const

const formSchema = z.object({
  responses: z.boolean(),
  tasks: z
    .array(z.string())
    .min(1, "Please select at least one notification type.")
    .refine(
      (value) => value.every((task) => tasks.some((t) => t.id === task)),
      {
        message: "Invalid notification type selected.",
      }
    ),
})

export function FormTanstackCheckbox() {
  const form = useForm({
    defaultValues: {
      responses: true,
      tasks: [] as string[],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast("You submitted the following values:", {
        description: (
          <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
        position: "bottom-right",
        classNames: {
          content: "flex flex-col gap-2",
        },
        style: {
          "--border-radius": "calc(var(--radius)  + 4px)",
        } as React.CSSProperties,
      })
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-checkbox"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="responses"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <FieldSet>
                    <FieldLegend variant="label">Responses</FieldLegend>
                    <FieldDescription>
                      Get notified for requests that take time, like research or
                      image generation.
                    </FieldDescription>
                    <FieldGroup data-slot="checkbox-group">
                      <Field orientation="horizontal" data-invalid={isInvalid}>
                        <Checkbox
                          id="form-tanstack-checkbox-responses"
                          name={field.name}
                          checked={field.state.value}
                          onCheckedChange={(checked) =>
                            field.handleChange(checked === true)
                          }
                          disabled
                        />
                        <FieldLabel
                          htmlFor="form-tanstack-checkbox-responses"
                          className="font-normal"
                        >
                          Push notifications
                        </FieldLabel>
                      </Field>
                    </FieldGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldSet>
                )
              }}
            />
            <FieldSeparator />
            <form.Field
              name="tasks"
              mode="array"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <FieldSet>
                    <FieldLegend variant="label">Tasks</FieldLegend>
                    <FieldDescription>
                      Get notified when tasks you&apos;ve created have updates.
                    </FieldDescription>
                    <FieldGroup data-slot="checkbox-group">
                      {tasks.map((task) => (
                        <Field
                          key={task.id}
```

--------------------------------

### Integrate shadcn/ui Switch with React Hook Form Controller in TypeScript

Source: https://ui.shadcn.com/docs/forms/react-hook-form

This focused TypeScript snippet demonstrates the specific setup for connecting a `shadcn/ui` Switch component to `react-hook-form` using the `Controller` component. It illustrates how to bind `field.value` to `checked`, `field.onChange` to `onCheckedChange`, and propagate validation state using `aria-invalid` and `data-invalid` props for error visualization.

```tsx
<Controller
  name="twoFactor"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field orientation="horizontal" data-invalid={fieldState.invalid}>
      <FieldContent>
        <FieldLabel htmlFor="form-rhf-switch-twoFactor">
          Multi-factor authentication
        </FieldLabel>
        <FieldDescription>
          Enable multi-factor authentication to secure your account.
        </FieldDescription>
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </FieldContent>
      <Switch
        id="form-rhf-switch-twoFactor"
        name={field.name}
        checked={field.value}
        onCheckedChange={field.onChange}
        aria-invalid={fieldState.invalid}
      />
    </Field>
  )}
/>
```

--------------------------------

### Carousel with Spacing Configuration in React TSX

Source: https://ui.shadcn.com/docs/components/carousel

Implements a carousel component with configurable spacing using Tailwind CSS utilities. Uses `pl-[VALUE]` on CarouselItem and `-ml-[VALUE]` on CarouselContent to control item spacing. The example creates a responsive carousel with 5 items that displays 1 item on mobile, 2 on tablet, and 3 on desktop.

```tsx
import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function CarouselSpacing() {
  return (
    <Carousel className="w-full max-w-sm">
      <CarouselContent className="-ml-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-2xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

--------------------------------

### Configure Import Aliases with jsconfig.json

Source: https://ui.shadcn.com/docs/changelog

Set up path aliases for JavaScript projects to enable cleaner imports using @ prefix. This configuration allows importing from project root using @/* pattern without TypeScript.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

--------------------------------

### Test Authenticated Registry with shadcn CLI

Source: https://ui.shadcn.com/docs/registry/authentication

Verify registry authentication using the shadcn CLI tool by setting the REGISTRY_TOKEN environment variable. Tests end-to-end authentication workflow with private namespaced registries.

```bash
REGISTRY_TOKEN=your_token npx shadcn@latest add @private/button
```

--------------------------------

### Group Shadcn UI Checkbox fields in a React component

Source: https://ui.shadcn.com/docs/changelog

This React component showcases the organization of multiple `Checkbox` elements within `FieldGroup` and `FieldSet` components from Shadcn UI. It uses `FieldLegend` and `FieldDescription` to provide context for the checkbox groups, along with individual `FieldLabel` components for each checkbox. This setup is ideal for creating structured preference or settings forms where related options are presented together.

```tsx
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet
} from "@/components/ui/field"

export function FieldCheckbox() {
  return (
    <div className="w-full max-w-md">
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">
            Show these items on the desktop
          </FieldLegend>
          <FieldDescription>
            Select the items you want to show on the desktop.
          </FieldDescription>
          <FieldGroup className="gap-3">
            <Field orientation="horizontal">
              <Checkbox id="finder-pref-9k2-hard-disks-ljj" />
              <FieldLabel
                htmlFor="finder-pref-9k2-hard-disks-ljj"
                className="font-normal"
                defaultChecked
              >
                Hard disks
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="finder-pref-9k2-external-disks-1yg" />
              <FieldLabel
                htmlFor="finder-pref-9k2-external-disks-1yg"
                className="font-normal"
              >
                External disks
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="finder-pref-9k2-cds-dvds-fzt" />
              <FieldLabel
                htmlFor="finder-pref-9k2-cds-dvds-fzt"
                className="font-normal"
              >
                CDs, DVDs, and iPods
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="finder-pref-9k2-connected-servers-6l2" />
              <FieldLabel
                htmlFor="finder-pref-9k2-connected-servers-6l2"
                className="font-normal"
              >
                Connected servers
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <Field orientation="horizontal">
          <Checkbox id="finder-pref-9k2-sync-folders-nep" defaultChecked />
          <FieldContent>
            <FieldLabel htmlFor="finder-pref-9k2-sync-folders-nep">
              Sync Desktop & Documents folders
            </FieldLabel>
            <FieldDescription>
              Your Desktop & Documents folders are being synced with iCloud
              Drive. You can access them from other devices.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </div>
  )
}
```

--------------------------------

### Partial Override of Multi-File Component Resources

Source: https://ui.shadcn.com/docs/registry/namespace

Demonstrates overriding specific files from complex multi-file components. This approach allows selective file replacement while maintaining dependency on the original resource.

```json
{
  "name": "custom-auth",
  "registryDependencies": [
    "@vendor/auth"
  ],
  "files": [
    {
      "path": "lib/auth-server.ts",
      "type": "registry:lib",
      "content": "// Your custom auth server"
    }
  ]
}
```

--------------------------------

### Error Handling Overview

Source: https://ui.shadcn.com/docs/registry/namespace

Common error messages and their resolutions encountered when interacting with the Shadcn component registry CLI.

```APIDOC
## Error Handling Overview

### Description
This section details common error messages you might encounter when using the `npx shadcn@latest` commands, along with their probable causes and suggested solutions.

### Method
(Not applicable - general information)

### Endpoint
(Not applicable - general information)

### Parameters
(None)

#### Request Body
(Not applicable)

### Request Example
(Not applicable)

### Response
#### Error Responses
- **Registry Not Configured**:
  ```txt
  Unknown registry "@non-existent". Make sure it is defined in components.json as follows:
  {
    "registries": {
      "@non-existent": "[URL_TO_REGISTRY]"
    }
  }
  ```
  *Cause*: Attempting to use a registry namespace that is not defined in your `components.json` file.
  *Solution*: Configure the registry in `components.json` with its corresponding URL.

- **Missing Environment Variables**:
  ```txt
  Registry "@private" requires the following environment variables:

    • REGISTRY_TOKEN

  Set the required environment variables to your .env or .env.local file.
  ```
  *Cause*: The registry you are trying to access requires specific environment variables (e.g., for authentication) that are not set in your project's environment.
  *Solution*: Define the required environment variables (e.g., `REGISTRY_TOKEN`) in your `.env` or `.env.local` file.

- **Resource Not Found (404)**:
  ```txt
  The item at https://registry.company.com/button.json was not found. It may not exist at the registry.
  ```
  *Cause*: The requested resource (component, library) could not be found at the specified registry or URL. This might be due to a typo in the resource name, the resource not existing, or an incorrect registry URL pattern.
  *Solution*: Verify the resource name and registry URL. Confirm the resource exists in the registry.

- **Authentication Failures (401 Unauthorized)**:
  ```txt
  You are not authorized to access the item at https://api.company.com/button.json
  Check your authentication credentials and environment variables.
  ```
  *Cause*: Your request lacks valid authentication credentials for the registry.
  *Solution*: Ensure your authentication tokens/credentials are correctly configured and provided (e.g., via environment variables).

- **Authentication Failures (403 Forbidden)**:
  ```txt
  Access forbidden for https://api.company.com/button.json
  Verify your API key has the necessary permissions.
  ```
  *Cause*: Your authentication credentials are valid but do not have the necessary permissions to access the requested resource.
  *Solution*: Check the permissions associated with your API key or authentication token and ensure they grant access to the resource.
```

--------------------------------

### Complete AppSidebar with React Server Components

Source: https://ui.shadcn.com/docs/components/sidebar

A full implementation of a sidebar component using React Server Components that fetches project data asynchronously. The component wraps the NavProjects server component with React.Suspense to display a skeleton loader while data is being fetched. Includes project data structure with icons from lucide-react and badge counts.

```tsx
import * as React from "react"
import {
  FrameIcon,
  LifeBuoyIcon,
  MapIcon,
  PieChartIcon,
  SendIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
} from "@/components/ui/sidebar"

const projects = [
  {
    name: "Design Engineering",
    url: "#",
    icon: FrameIcon,
    badge: "24",
  },
  {
    name: "Sales & Marketing",
    url: "#",
    icon: PieChartIcon,
    badge: "12",
  },
  {
    name: "Travel",
    url: "#",
    icon: MapIcon,
    badge: "3",
  },
  {
    name: "Support",
    url: "#",
    icon: LifeBuoyIcon,
    badge: "21",
  },
  {
    name: "Feedback",
    url: "#",
    icon: SendIcon,
    badge: "8",
  },
]

// Dummy fetch function
async function fetchProjects() {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return projects
}

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <React.Suspense fallback={<NavProjectsSkeleton />}>
                <NavProjects />
              </React.Suspense>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

function NavProjectsSkeleton() {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

async function NavProjects() {
  const projects = await fetchProjects()

  return (
    <SidebarMenu>
      {projects.map((project) => (
        <SidebarMenuItem key={project.name}>
          <SidebarMenuButton asChild>
            <a href={project.url}>
              <project.icon />
              <span>{project.name}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
```

--------------------------------

### Import Kbd and KbdGroup Components

Source: https://ui.shadcn.com/docs/changelog

Import the Kbd and KbdGroup components from the ui/kbd module. Kbd renders individual keyboard keys, while KbdGroup groups multiple keys together for display purposes.

```tsx
import { Kbd, KbdGroup } from "@/components/ui/kbd"
```

--------------------------------

### CLI npx shadcn@latest search/list

Source: https://ui.shadcn.com/docs/registry/namespace

Searches for available resources within configured registries. It allows filtering results by registry, query string, and pagination options (limit, offset). The `list` command is an alias for `search` to display all items from a specific registry.

```APIDOC
## CLI npx shadcn@latest search/list

### Description
Searches for available resources within configured registries. It allows filtering results by registry, query string, and pagination options (limit, offset). The `list` command is an alias for `search` to display all items from a specific registry.

### Method
CLI

### Endpoint
`npx shadcn@latest search [registry_namespace...]`
`npx shadcn@latest list [registry_namespace...]`

### Parameters
#### Path Parameters
- **registry_namespace** (string) - Optional - One or more registry namespaces to search within (e.g., `@v0`, `@acme`). If omitted, all configured registries might be searched depending on the command.

#### Query Parameters
- **--query** (string) - Optional - A search string to filter resource names or descriptions.
- **--limit** (number) - Optional - Maximum number of results to return.
- **--offset** (number) - Optional - Number of results to skip from the beginning.

#### Request Body
(Not applicable for CLI command)

### Request Example
```bash
npx shadcn@latest search @v0
npx shadcn@latest search @acme --query "auth"
npx shadcn@latest search @v0 @acme @lib
npx shadcn@latest search @v0 --limit 10 --offset 20
npx shadcn@latest list @acme
```

### Response
#### Success Response (CLI Output)
The command outputs a list of matching resources, including their name, type, and description.

#### Response Example
```txt
Searching "@v0"...

- @v0/dashboard (registry:ui) - A dashboard layout component.
- @v0/card (registry:ui) - A flexible card container.
- @v0/button (registry:ui) - A highly customizable button.
```
```

--------------------------------

### Configure components.json to Enable CSS Variable Theming

Source: https://ui.shadcn.com/docs/theming

Shows the configuration in `components.json` required to enable CSS variable-based theming in a project, specifically setting `tailwind.cssVariables` to `true`.

```json
{
  "style": "new-york",
  "rsc": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

--------------------------------

### Progress Component Demo with React Hooks

Source: https://ui.shadcn.com/docs/components/progress

Interactive progress demo component that initializes with 13% progress and updates to 66% after 500ms using React useState and useEffect hooks. Demonstrates dynamic progress updates and custom styling with Tailwind CSS width class.

```tsx
"use client"

import * as React from "react"

import { Progress } from "@/components/ui/progress"

export function ProgressDemo() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return <Progress value={progress} className="w-[60%]" />
}
```

--------------------------------

### Create Theme Provider Context Component - React TypeScript

Source: https://ui.shadcn.com/docs/dark-mode/vite

Creates a React context-based theme provider that manages dark/light/system theme states. It persists theme preference to localStorage, detects system color scheme preferences using matchMedia API, and applies theme classes to the document root. The component exports a useTheme hook for consuming theme state throughout the application.

```typescript
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
```

--------------------------------

### Search Components Across Registries

Source: https://ui.shadcn.com/docs/changelog

Search for components in a specific registry using query keywords. This command filters registry items based on search terms, making it easy to find components with specific functionality across multiple registries.

```bash
npx shadcn search @tweakcn -q "dark"
```

--------------------------------

### Store Registry Tokens in Environment Variables

Source: https://ui.shadcn.com/docs/registry/authentication

Use environment variables to securely store authentication tokens and API keys without committing them to version control. Environment variables are referenced using template syntax in registry configuration.

```bash
REGISTRY_TOKEN=your_secret_token_here
API_KEY=your_api_key_here
```

--------------------------------

### Import Shadcn/ui Aspect Ratio Component

Source: https://ui.shadcn.com/docs/components/aspect-ratio

This import statement makes the `AspectRatio` component available for use in your React or Next.js files. It specifies the path to the component within your project's `components/ui` directory.

```tsx
import { AspectRatio } from "@/components/ui/aspect-ratio"
```

--------------------------------

### Configure Multi-Registry with Different Authentication Methods

Source: https://ui.shadcn.com/docs/registry/authentication

Set up multiple component registries with different authentication strategies using namespaced registry configuration. Supports bearer tokens, API keys, and custom headers for different access levels (public, internal, premium).

```json
{
  "registries": {
    "@public": "https://public.company.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${INTERNAL_TOKEN}"
      }
    },
    "@premium": {
      "url": "https://premium.company.com/{name}.json",
      "headers": {
        "X-License-Key": "${LICENSE_KEY}"
      }
    }
  }
}
```

--------------------------------

### Render Basic Input OTP Component (TypeScript React)

Source: https://ui.shadcn.com/docs/components/input-otp

Demonstrates how to render a basic Input OTP component with six slots, visually grouped into two sets of three. It utilizes shadcn/ui components like InputOTP, InputOTPGroup, InputOTPSeparator, and InputOTPSlot.

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function InputOTPDemo() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
```

--------------------------------

### Add shadcn/ui Components with `npx shadcn@latest add`

Source: https://ui.shadcn.com/docs/changelog

This command adds UI components to your project, automatically resolving dependencies and formatting them based on your custom configuration in `components.json`. It streamlines the process of incorporating pre-built shadcn/ui elements into your application.

```bash
npx shadcn@latest add
```

--------------------------------

### Build Menu Bar with File Menu - React TypeScript

Source: https://ui.shadcn.com/docs/components/menubar

Creates a functional menu bar with a File menu containing multiple menu items, keyboard shortcuts, and separators. The component structure demonstrates how to organize menu content with visual separators and display keyboard shortcut indicators (⌘T, etc.).

```tsx
<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>
        New Tab <MenubarShortcut>⌘T</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>New Window</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Share</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Print</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

--------------------------------

### View Specific Component Changes with `npx shadcn diff [component]`

Source: https://ui.shadcn.com/docs/changelog

This command is used to inspect the detailed changes for a specific shadcn/ui component, such as 'alert'. It provides a diff output highlighting the modifications between your local version and the upstream repository, aiding in manual updates or understanding changes.

```bash
npx shadcn diff alert
```

--------------------------------

### Import Empty Component and Subcomponents

Source: https://ui.shadcn.com/docs/components/empty

Import the Empty component and its subcomponents (EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle) from the UI components library. These form the building blocks for constructing empty state layouts.

```tsx
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
```

--------------------------------

### Configure Multiple Registries in components.json

Source: https://ui.shadcn.com/docs/mcp

This JSON configuration demonstrates how to define multiple registries in the 'components.json' file, including third-party and private registries. It shows how to specify a URL for a registry and how to include headers for authentication, using environment variables for sensitive data.

```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

--------------------------------

### Organize Registries by Stability Level

Source: https://ui.shadcn.com/docs/registry/namespace

Set up registries for different release channels (stable, beta, experimental). This configuration enables teams to test experimental features while maintaining stable production resources, supporting different deployment strategies.

```json
{
  "@stable": "https://registry.company.com/stable/{name}.json",
  "@latest": "https://registry.company.com/beta/{name}.json",
  "@experimental": "https://registry.company.com/experimental/{name}.json"
}
```

--------------------------------

### Basic Drawer Component Usage in React

Source: https://ui.shadcn.com/docs/components/drawer

Create a basic drawer with trigger, header, description, and footer sections. The drawer slides in from the side and displays a confirmation message with submit and cancel actions.

```tsx
<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Are you absolutely sure?</DrawerTitle>
      <DrawerDescription>This action cannot be undone.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button>Submit</Button>
      <DrawerClose>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

--------------------------------

### Clone shadcn/ui Repository with Git

Source: https://ui.shadcn.com/docs/blocks

Clones the shadcn/ui repository to local workspace. This is the first step in setting up the development environment for contributing blocks.

```bash
git clone https://github.com/shadcn-ui/ui.git
```

--------------------------------

### Alert Component Demo - React/TypeScript

Source: https://ui.shadcn.com/docs/components/alert

Demonstrates multiple Alert component implementations including success, informational, and destructive variants with icons, titles, and descriptions. Uses lucide-react icons and Tailwind CSS for styling. Shows various content configurations from simple icon+title combinations to complex descriptions with nested lists.

```tsx
import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export function AlertDemo() {
  return (
    <div className="grid w-full max-w-xl items-start gap-4">
      <Alert>
        <CheckCircle2Icon />
        <AlertTitle>Success! Your changes have been saved</AlertTitle>
        <AlertDescription>
          This is an alert with icon, title and description.
        </AlertDescription>
      </Alert>
      <Alert>
        <PopcornIcon />
        <AlertTitle>
          This Alert has a title and an icon. No description.
        </AlertTitle>
      </Alert>
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Unable to process your payment.</AlertTitle>
        <AlertDescription>
          <p>Please verify your billing information and try again.</p>
          <ul className="list-inside list-disc text-sm">
            <li>Check your card details</li>
            <li>Ensure sufficient funds</li>
            <li>Verify billing address</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
```

--------------------------------

### Full List of Global Theming CSS Variables in app/globals.css

Source: https://ui.shadcn.com/docs/theming

Comprehensive list of predefined CSS variables for a theming system, including `root` and `dark` mode definitions for various UI elements and chart colors, using the Oklch color format for consistent styling.

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.269 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.371 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.439 0 0);
}
```

--------------------------------

### Configure Multiple Team Registries in components.json

Source: https://ui.shadcn.com/docs/changelog

Set up multiple namespaced registries organized by team or function (design, engineering, marketing). Each namespace points to different URLs within the same registry server, allowing team-specific component organization.

```json
{
  "registries": {
    "@design": "https://registry.company.com/create/{name}.json",
    "@engineering": "https://registry.company.com/eng/{name}.json",
    "@marketing": "https://registry.company.com/marketing/{name}.json"
  }
}
```

--------------------------------

### Implement Input OTP with Multiple Separators (TypeScript React)

Source: https://ui.shadcn.com/docs/components/input-otp

Shows how to use `InputOTPSeparator` to visually divide OTP slots into multiple groups within the `InputOTP` component. This enhances readability for longer OTPs by breaking them into smaller, manageable segments.

```tsx
import React from "react"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function InputOTPWithSeparator() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
```

--------------------------------

### Import and Basic Usage of Checkbox Component

Source: https://ui.shadcn.com/docs/components/checkbox

Demonstrates how to import the Checkbox component from the UI components directory and render a basic checkbox element in your application.

```tsx
import { Checkbox } from "@/components/ui/checkbox"

<Checkbox />
```

--------------------------------

### Define Form Structure with Radix UI

Source: https://ui.shadcn.com/docs/components/form

This snippet illustrates the basic structural components of a form using the Shadcn UI `<Form>` and `<FormField>`, integrating Radix UI components like `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage`. It outlines how to render custom form fields within the `render` prop for flexible UI construction.

```tsx
<Form>
  <FormField
    control={...}
    name="..."
    render={() => (
      <FormItem>
        <FormLabel />
        <FormControl>
          { /* Your form field */}
        </FormControl>
        <FormDescription />
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

--------------------------------

### Basic Sheet Component Demo in TSX

Source: https://ui.shadcn.com/docs/components/sheet

Demonstrates a complete Sheet implementation with header, form inputs, and footer actions. Includes edit profile form with name and username fields, along with save and close buttons using shadcn UI components.

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-username">Username</Label>
            <Input id="sheet-demo-username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

--------------------------------

### Provide detailed description for registry item

Source: https://ui.shadcn.com/docs/registry/registry-item-json

The `description` property offers a more extensive explanation of the registry item's purpose and functionality. It allows for detailed context that complements the concise title, helping users understand what the item does.

```json
{
  "description": "A simple hello world component."
}
```

--------------------------------

### Define Global CSS Variables for Light and Dark Themes (CSS)

Source: https://ui.shadcn.com/docs/theming

This CSS snippet defines a comprehensive set of custom properties (CSS variables) for various UI elements, including colors for background, foreground, cards, popovers, primary/secondary/accent elements, and charts. It includes distinct definitions for both light (default) and dark themes, allowing for easy theme switching by applying the `.dark` class. These variables are typically used in a `globals.css` file to provide a consistent styling foundation across a web application, often in conjunction with UI libraries like shadcn.

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.147 0.004 49.25);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.147 0.004 49.25);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.147 0.004 49.25);
  --primary: oklch(0.216 0.006 56.043);
  --primary-foreground: oklch(0.985 0.001 106.423);
  --secondary: oklch(0.97 0.001 106.424);
  --secondary-foreground: oklch(0.216 0.006 56.043);
  --muted: oklch(0.97 0.001 106.424);
  --muted-foreground: oklch(0.553 0.013 58.071);
  --accent: oklch(0.97 0.001 106.424);
  --accent-foreground: oklch(0.216 0.006 56.043);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.923 0.003 48.717);
  --input: oklch(0.923 0.003 48.717);
  --ring: oklch(0.709 0.01 56.259);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0.001 106.423);
  --sidebar-foreground: oklch(0.147 0.004 49.25);
  --sidebar-primary: oklch(0.216 0.006 56.043);
  --sidebar-primary-foreground: oklch(0.985 0.001 106.423);
  --sidebar-accent: oklch(0.97 0.001 106.424);
  --sidebar-accent-foreground: oklch(0.216 0.006 56.043);
  --sidebar-border: oklch(0.923 0.003 48.717);
  --sidebar-ring: oklch(0.709 0.01 56.259);
}

.dark {
  --background: oklch(0.147 0.004 49.25);
  --foreground: oklch(0.985 0.001 106.423);
  --card: oklch(0.216 0.006 56.043);
  --card-foreground: oklch(0.985 0.001 106.423);
  --popover: oklch(0.216 0.006 56.043);
  --popover-foreground: oklch(0.985 0.001 106.423);
  --primary: oklch(0.923 0.003 48.717);
  --primary-foreground: oklch(0.216 0.006 56.043);
  --secondary: oklch(0.268 0.007 34.298);
  --secondary-foreground: oklch(0.985 0.001 106.423);
  --muted: oklch(0.268 0.007 34.298);
  --muted-foreground: oklch(0.709 0.01 56.259);
  --accent: oklch(0.268 0.007 34.298);
  --accent-foreground: oklch(0.985 0.001 106.423);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.553 0.013 58.071);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.216 0.006 56.043);
  --sidebar-foreground: oklch(0.985 0.001 106.423);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0.001 106.423);
  --sidebar-accent: oklch(0.268 0.007 34.298);
  --sidebar-accent-foreground: oklch(0.985 0.001 106.423);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.553 0.013 58.071);
}
```

--------------------------------

### Check for shadcn/ui Component Updates with `npx shadcn diff`

Source: https://ui.shadcn.com/docs/changelog

This experimental command allows users to track upstream updates for shadcn/ui components. Running it lists components with available updates, helping maintain consistency and leverage the latest features and bug fixes.

```bash
npx shadcn diff
```

--------------------------------

### ButtonGroup Wrapping Input Component

Source: https://ui.shadcn.com/docs/components/button-group

Demonstrates how to wrap an Input component with buttons using ButtonGroup. Useful for creating search bars and input controls with associated action buttons.

```tsx
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"

export function ButtonGroupInput() {
  return (
    <ButtonGroup>
      <Input placeholder="Search..." />
      <Button variant="outline" aria-label="Search">
        <SearchIcon />
      </Button>
    </ButtonGroup>
  )
}
```

--------------------------------

### Kbd Component Inside InputGroup

Source: https://ui.shadcn.com/docs/components/kbd

Shows how to use Kbd components within an InputGroup component to display keyboard shortcuts next to input fields. Demonstrates search input with keyboard shortcut indicator.

```tsx
import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

export function KbdInputGroup() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-6">
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Advanced Registry Configuration with Authentication

Source: https://ui.shadcn.com/docs/components-json

Configure private registries with authentication headers and query parameters. Supports environment variable expansion using ${VAR_NAME} syntax for secure credential management. Headers like Authorization and X-API-Key can be configured per registry.

```json
{
  "registries": {
    "@private": {
      "url": "https://api.company.com/registry/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}",
        "X-API-Key": "${API_KEY}"
      },
      "params": {
        "version": "latest"
      }
    }
  }
}
```

--------------------------------

### Execute shadcn Build Command

Source: https://ui.shadcn.com/docs/cli

Basic command to build and generate registry JSON files. This command reads the default registry.json file and outputs the generated files to the public/r directory.

```bash
npx shadcn@latest build
```

--------------------------------

### Import Input OTP Components (TypeScript React)

Source: https://ui.shadcn.com/docs/components/input-otp

Illustrates the necessary import statements for using the Input OTP components within a TypeScript React file. It imports key components like InputOTP, InputOTPGroup, InputOTPSeparator, and InputOTPSlot from the local shadcn/ui path.

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
```

--------------------------------

### Basic Item with Icon and Description in TSX

Source: https://ui.shadcn.com/docs/changelog

Simple Item component displaying an icon, title, and description. The ItemMedia component wraps the HomeIcon with a variant prop, while ItemContent contains the title and description text. This demonstrates the basic structure of an Item.

```tsx
<Item>
  <ItemMedia variant="icon">
    <HomeIcon />
  </ItemMedia>
  <ItemContent>
    <ItemTitle>Dashboard</ItemTitle>
    <ItemDescription>Overview of your account and activity.</ItemDescription>
  </ItemContent>
</Item>
```

--------------------------------

### Creating a Link with Badge Styling using asChild (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/badge

Explains how to use the `asChild` prop with the `Badge` component to render another component, such as a `Link` from Next.js, with the styling of a badge. This allows for semantic HTML while maintaining the desired visual appearance.

```tsx
import Link from "next/link"

import { Badge } from "@/components/ui/badge"

export function LinkAsBadge() {
  return (
    <Badge asChild>
      <Link href="/">Badge</Link>
    </Badge>
  )
}
```

--------------------------------

### Import Tooltip Components

Source: https://ui.shadcn.com/docs/components/tooltip

Standard import statement for using Tooltip, TooltipContent, and TooltipTrigger components from the ui components directory. Must be placed at the top of component files using the tooltip.

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
```

--------------------------------

### Create Command Dialog with Keyboard Shortcut

Source: https://ui.shadcn.com/docs/components/command

Implements a CommandDialog component that opens/closes with a keyboard shortcut (Cmd/Ctrl + J). Displays command groups with icons from lucide-react and keyboard shortcuts. The dialog listens for keyboard events and prevents default browser behavior when the shortcut is triggered.

```tsx
"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Press{" "}
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <Calendar />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem>
              <Smile />
              <span>Search Emoji</span>
            </CommandItem>
            <CommandItem>
              <Calculator />
              <span>Calculator</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              <User />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CreditCard />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Settings />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
```

--------------------------------

### Create Basic AppSidebar Component (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/sidebar

This code defines a basic `AppSidebar` component using `Sidebar` and `SidebarContent` from the Shadcn/UI library. It establishes the initial structure for a collapsible sidebar, ready to be populated with navigation elements.

```tsx
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent />
    </Sidebar>
  )
}
```

--------------------------------

### Configure Shadcn Registry with Basic Authentication (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This configuration sets up basic authentication for a shadcn registry. The `Authorization` header contains a `Basic` token derived from base64-encoded credentials, which are loaded from the `${BASE64_CREDENTIALS}` environment variable for secure access to the internal registry.

```json
{
  "@internal": {
    "url": "https://registry.company.com/{name}.json",
    "headers": {
      "Authorization": "Basic ${BASE64_CREDENTIALS}"
    }
  }
}
```

--------------------------------

### Import Command Component Sub-components in React (TypeScript)

Source: https://ui.shadcn.com/docs/components/command

This snippet illustrates the essential import statements for all sub-components that comprise the Shadcn UI `Command` component. These imports are necessary to build a comprehensive command menu, including dialogs, input fields, and various list elements. Ensure that the import path is correctly configured to match your project's file structure.

```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
```

--------------------------------

### Import Context Menu Components

Source: https://ui.shadcn.com/docs/components/context-menu

Imports the necessary Context Menu components from the local UI components library. Provides the base components needed to build context menu functionality.

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
```

--------------------------------

### Import Menubar Components - React TypeScript

Source: https://ui.shadcn.com/docs/components/menubar

Imports all necessary Menubar sub-components from the shadcn/ui component library. This establishes the foundation for building a menu bar interface with menu items, separators, and keyboard shortcuts.

```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
```

--------------------------------

### items Array with Registry Item Definitions

Source: https://ui.shadcn.com/docs/registry/registry-json

Contains an array of registry items, each implementing the registry-item schema specification. Each item defines a component with its name, type, dependencies, and file references for the registry catalog.

```json
{
  "items": [
    {
      "name": "hello-world",
      "type": "registry:block",
      "title": "Hello World",
      "description": "A simple hello world component.",
      "registryDependencies": [
        "button",
        "@acme/input-form",
        "https://example.com/r/foo"
      ],
      "dependencies": ["is-even@3.0.0", "motion"],
      "files": [
        {
          "path": "registry/new-york/hello-world/hello-world.tsx",
          "type": "registry:component"
        }
      ]
    }
  ]
}
```

--------------------------------

### NavigationMenuDemo Component - React/TypeScript

Source: https://ui.shadcn.com/docs/components/navigation-menu

A complete navigation menu component that displays home links, component documentation, and responsive menu items. It uses the useIsMobile hook to adapt the viewport and includes static component data with descriptions. The component features nested NavigationMenuContent with grid layouts and dynamic mapping of menu items.

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"

import { useIsMobile } from "@/components/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]

export function NavigationMenuDemo() {
  const isMobile = useIsMobile()

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className="flex-wrap">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Home</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-4 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6"
                    href="/"
                  >
                    <div className="mb-2 text-lg font-medium sm:mt-4">
                      shadcn/ui
                    </div>
                    <p className="text-muted-foreground text-sm leading-tight">
                      Beautifully designed components built with Tailwind CSS.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/docs" title="Introduction">
                Re-usable components built using Radix UI and Tailwind CSS.
              </ListItem>
              <ListItem href="/docs/installation" title="Installation">
                How to install dependencies and structure your app.
              </ListItem>
              <ListItem href="/docs/primitives/typography" title="Typography">
                Styles for headings, paragraphs, lists...etc
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/docs">Docs</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuTrigger>List</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="#">
                    <div className="font-medium">Components</div>
                    <div className="text-muted-foreground">
                      Browse all components in the library.
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

--------------------------------

### Create Lead/Intro Text Component with React and Tailwind CSS

Source: https://ui.shadcn.com/docs/components/typography

Exports a reusable lead paragraph component with larger text size (text-xl), muted foreground color, and semantic emphasis. Used for introductory or summary text sections.

```tsx
export function TypographyLead() {
  return (
    <p className="text-muted-foreground text-xl">
      A modal dialog that interrupts the user with important content and expects
      a response.
    </p>
  )
}
```

--------------------------------

### Set Environment Variable for Registry Authentication (Bash)

Source: https://ui.shadcn.com/docs/registry/namespace

This bash command shows how to set an environment variable, `REGISTRY_TOKEN`, typically in a `.env.local` file. This variable is then automatically expanded and used by shadcn's registry configuration for secure authentication, preventing sensitive credentials from being hardcoded.

```bash
REGISTRY_TOKEN=your_secret_token_here
```

--------------------------------

### Render Shadcn Buttons with Various Sizes (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/button

Illustrates how to render Shadcn UI `Button` components with different predefined sizes, including `sm`, `lg`, `icon-sm`, and `icon-lg`. It demonstrates both text and icon-only buttons for each size variant. Requires `lucide-react` for the icon.

```tsx
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ButtonSize() {
  return (
    <div className="flex flex-col items-start gap-8 sm:flex-row">
      <div className="flex items-start gap-2">
        <Button size="sm" variant="outline">
          Small
        </Button>
        <Button size="icon-sm" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button variant="outline">Default</Button>
        <Button size="icon" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button size="icon-lg" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
    </div>
  )
}
```

```tsx
// Small
<Button size="sm" variant="outline">Small</Button>
<Button size="icon-sm" aria-label="Submit" variant="outline">
  <ArrowUpRightIcon />
</Button>

// Medium
<Button variant="outline">Default</Button>
<Button size="icon" aria-label="Submit" variant="outline">
  <ArrowUpRightIcon />
</Button>

// Large
<Button size="lg" variant="outline">Large</Button>
<Button size="icon-lg" aria-label="Submit" variant="outline">
  <ArrowUpRightIcon />
</Button>
```

--------------------------------

### Import Resizable Component

Source: https://ui.shadcn.com/docs/components/resizable

Imports the three main components from the resizable UI module: ResizableHandle for the draggable separator, ResizablePanel for individual panels, and ResizablePanelGroup as the container.

```tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
```

--------------------------------

### Implement Inset Sidebar Variant with `SidebarInset` in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This code demonstrates the usage of the `inset` sidebar variant, which requires wrapping the main content within a `SidebarInset` component. This ensures proper layout and spacing when the sidebar is rendered in an 'inset' style.

```tsx
<SidebarProvider>
  <Sidebar variant="inset" />
  <SidebarInset>
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

--------------------------------

### Capture Block Screenshots with pnpm

Source: https://ui.shadcn.com/docs/blocks

Captures screenshots of blocks in both light and dark modes for the registry. Required before submitting pull requests for publication.

```bash
pnpm registry:capture
```

--------------------------------

### Configure jsconfig.json for import aliases

Source: https://ui.shadcn.com/docs/javascript

Set up the jsconfig.json file to configure path aliases for module imports. This enables using @ as an alias for the root directory, allowing cleaner import statements throughout the JavaScript project.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

--------------------------------

### InputGroupAddon with Icon

Source: https://ui.shadcn.com/docs/components/input-group

Shows how to use InputGroupAddon to display icons alongside input elements with inline-end alignment.

```tsx
<InputGroupAddon align="inline-end">
  <SearchIcon />
</InputGroupAddon>
```

--------------------------------

### Enable or disable CSS variables for theming

Source: https://ui.shadcn.com/docs/components-json

Determines whether components use CSS variables (true) or Tailwind utility classes (false) for theming. This cannot be changed after initialization; components must be reinstalled to switch methods.

```json
{
  "tailwind": {
    "cssVariables": true | false
  }
}
```

--------------------------------

### API Key Authentication Configuration

Source: https://ui.shadcn.com/docs/registry/authentication

Configure API key authentication with custom headers for registry access. Supports multiple custom headers like X-API-Key and X-Workspace-Id for more granular access control and workspace isolation.

```json
{
  "registries": {
    "@company": {
      "url": "https://api.company.com/registry/{name}.json",
      "headers": {
        "X-API-Key": "${API_KEY}",
        "X-Workspace-Id": "${WORKSPACE_ID}"
      }
    }
  }
}
```

--------------------------------

### Configure Shadcn Registry with API Key in Headers (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This configuration demonstrates how to authenticate a shadcn registry using an API key passed in the request headers. The `X-API-Key` header, populated by the `${API_KEY}` environment variable, is used to secure access to the specified private registry URL.

```json
{
  "@private": {
    "url": "https://api.company.com/registry/{name}",
    "headers": {
      "X-API-Key": "${API_KEY}"
    }
  }
}
```

--------------------------------

### Loading Skeleton Component for Sidebar Menu

Source: https://ui.shadcn.com/docs/components/sidebar

A skeleton component that displays placeholder loaders while async data is being fetched. It renders 5 skeleton menu items with icon placeholders to provide visual feedback during loading. Used as a Suspense fallback to improve perceived performance.

```tsx
function NavProjectsSkeleton() {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
```

--------------------------------

### Interactive Drawer with State Management and Chart in React

Source: https://ui.shadcn.com/docs/components/drawer

Demonstrates an advanced Drawer component with React state management, interactive buttons for adjusting values, and a Recharts BarChart visualization. The component manages a goal value between 200-400 and displays real-time updates with increase/decrease buttons and visual feedback via a bar chart.

```tsx
"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const data = [
  { goal: 400 },
  { goal: 300 },
  { goal: 200 },
  { goal: 300 },
  { goal: 200 },
  { goal: 278 },
  { goal: 189 },
  { goal: 239 },
  { goal: 300 },
  { goal: 200 },
  { goal: 278 },
  { goal: 189 },
  { goal: 349 },
]

export function DrawerDemo() {
  const [goal, setGoal] = React.useState(350)

  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Move Goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(-10)}
                disabled={goal <= 200}
              >
                <Minus />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex-1 text-center">
                <div className="text-7xl font-bold tracking-tighter">
                  {goal}
                </div>
                <div className="text-muted-foreground text-[0.70rem] uppercase">
                  Calories/day
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(10)}
                disabled={goal >= 400}
              >
                <Plus />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <div className="mt-3 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <Bar
                    dataKey="goal"
                    style={
                      {
                        fill: "hsl(var(--foreground))",
                        opacity: 0.9,
                      } as React.CSSProperties
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
```

--------------------------------

### Extend Third-Party Component Without Replacing

Source: https://ui.shadcn.com/docs/registry/namespace

Pattern for extending vendor components by keeping the original and adding custom extensions. Uses registryDependencies to import the base component and adds new functionality in a separate file.

```json
{
  "name": "extended-table",
  "registryDependencies": ["@vendor/table"],
  "files": [
    {
      "path": "components/ui/table-extended.tsx",
      "content": "import { Table } from '@vendor/table'\n// Add your extensions\nexport function ExtendedTable() { ... }"
    }
  ]
}
```

--------------------------------

### Create Responsive Field Layout with Orientation Switching

Source: https://ui.shadcn.com/docs/changelog

Implements responsive field layouts using the orientation="responsive" prop to automatically switch between vertical and horizontal arrangements based on container width. Combines Fields with Input, Textarea, Button components and FieldSeparator for visual organization.

```tsx
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function FieldResponsive() {
  return (
    <div className="w-full max-w-4xl">
      <form>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldDescription>Fill in your profile information.</FieldDescription>
          <FieldSeparator />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  Provide your full name for identification
                </FieldDescription>
              </FieldContent>
              <Input id="name" placeholder="Evil Rabbit" required />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="lastName">Message</FieldLabel>
                <FieldDescription>
                  You can write your message here. Keep it short, preferably
                  under 100 characters.
                </FieldDescription>
              </FieldContent>
              <Textarea
                id="message"
                placeholder="Hello, world!"
                required
                className="min-h-[100px] resize-none sm:min-w-[300px]"
              />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  )
}
```

--------------------------------

### Define a full shadcn/ui registry item configuration

Source: https://ui.shadcn.com/docs/registry/registry-item-json

This JSON configuration defines a complete shadcn/ui registry item, including its unique name, type, human-readable title, and descriptive text. It specifies both npm package dependencies and references to other registry items, along with the file paths for its components and custom CSS variables for thematic styling.

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "hello-world",
  "type": "registry:block",
  "title": "Hello World",
  "description": "A simple hello world component.",
  "registryDependencies": [
    "button",
    "@acme/input-form",
    "https://example.com/r/foo"
  ],
  "dependencies": ["is-even@3.0.0", "motion"],
  "files": [
    {
      "path": "registry/new-york/hello-world/hello-world.tsx",
      "type": "registry:component"
    },
    {
      "path": "registry/new-york/hello-world/use-hello-world.ts",
      "type": "registry:hook"
    }
  ],
  "cssVars": {
    "theme": {
      "font-heading": "Poppins, sans-serif"
    },
    "light": {
      "brand": "20 14.3% 4.1%"
    },
    "dark": {
      "brand": "20 14.3% 4.1%"
    }
  }
}
```

--------------------------------

### Item Component Structure with Media, Content, and Actions in TypeScript/React

Source: https://ui.shadcn.com/docs/components/item

Shows the basic structure of the Item component with optional ItemMedia, ItemContent containing ItemTitle and ItemDescription, and ItemActions. Demonstrates the component's composition pattern for building list items with consistent styling and layout.

```typescript
<Item size="" variant="">
  <ItemMedia />
  <ItemContent>
    <ItemTitle>Item</ItemTitle>
    <ItemDescription>Item</ItemDescription>
  </ItemContent>
  <ItemActions />
</Item>
```

--------------------------------

### Importing and Basic Usage of Shadcn UI Badge Component (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/badge

Shows the standard import statement required to use the `Badge` component from the `shadcn/ui` library and illustrates the basic JSX structure for rendering a `Badge` with different visual styles using the `variant` prop.

```tsx
import { Badge } from "@/components/ui/badge"
```

```tsx
<Badge variant="default | outline | secondary | destructive">Badge</Badge>
```

--------------------------------

### Test Authenticated Registry with curl

Source: https://ui.shadcn.com/docs/registry/authentication

Verify authenticated registry connectivity using curl command-line tool with bearer token authentication. Tests that the registry endpoint is accessible and properly configured.

```bash
curl -H "Authorization: Bearer your_token" \
  https://registry.company.com/button.json
```

--------------------------------

### shadcn CLI: Custom Error for Missing Environment Variables

Source: https://ui.shadcn.com/docs/changelog

When a registry requires specific environment variables, the shadcn CLI now explicitly lists them in an error message. Users are directed to set these variables in `.env` or `.env.local` files to resolve the issue.

```txt
Registry "@private" requires the following environment variables:
  • REGISTRY_TOKEN

Set the required environment variables to your .env or .env.local file.
```

--------------------------------

### List Registry Items with list Command

Source: https://ui.shadcn.com/docs/cli

The list command displays all available items from specified registries. It supports multiple registry sources and serves as an alias for the search command.

```bash
npx shadcn@latest list @acme
```

```bash
Usage: shadcn list [options] <registries...>

list items from registries

Arguments:
  registries             the registry names or urls to list items from. Names
                         must be prefixed with @.
```

--------------------------------

### Advanced Context Menu with Submenus and Checkboxes

Source: https://ui.shadcn.com/docs/components/context-menu

Demonstrates a feature-rich context menu with submenus, keyboard shortcuts, checkbox items, radio groups, separators, and disabled states. Includes styling for layout and component customization.

```tsx
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export function ContextMenuDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem inset>
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>Save Page...</ContextMenuItem>
            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
            <ContextMenuItem>Name Window...</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Developer Tools</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>
          Show Bookmarks
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value="pedro">
          <ContextMenuLabel inset>People</ContextMenuLabel>
          <ContextMenuRadioItem value="pedro">
            Pedro Duarte
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
```

--------------------------------

### Organize Registries by Resource Type

Source: https://ui.shadcn.com/docs/registry/namespace

Structure multiple registries separated by resource category (components, hooks, utilities, AI prompts). Each registry points to a specific resource type endpoint, enabling logical organization and easy maintenance of different resource categories.

```json
{
  "@components": "https://cdn.company.com/components/{name}.json",
  "@hooks": "https://cdn.company.com/hooks/{name}.json",
  "@utils": "https://cdn.company.com/utils/{name}.json",
  "@prompts": "https://cdn.company.com/ai-prompts/{name}.json"
}
```

--------------------------------

### Import Empty Component for Shadcn UI

Source: https://ui.shadcn.com/docs/changelog

This snippet demonstrates how to import the essential components of the Shadcn UI Empty component, including the base `Empty` and its sub-components like `EmptyContent`, `EmptyDescription`, `EmptyMedia`, and `EmptyTitle`, for use in a React/TypeScript application.

```tsx
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"
```

--------------------------------

### Render a Basic Shadcn Button (React/TypeScript)

Source: https://ui.shadcn.com/docs/components/button

Demonstrates how to render a simple button component using the Shadcn UI `Button` component with an `outline` variant. This is a common way to display a button in a React application.

```tsx
<Button variant="outline">Button</Button>
```

--------------------------------

### Configure Shadcn Registry with Multiple Authentication Methods (JSON)

Source: https://ui.shadcn.com/docs/registry/namespace

This advanced configuration demonstrates combining multiple authentication methods for a shadcn registry. It includes various headers like `Authorization` (Bearer token), `X-API-Key`, and `X-Workspace-Id`, along with a `version` parameter, all securely managed via environment variables for access to an enterprise registry.

```json
{
  "@enterprise": {
    "url": "https://api.enterprise.com/v2/registry/{name}",
    "headers": {
      "Authorization": "Bearer ${ACCESS_TOKEN}",
      "X-API-Key": "${API_KEY}",
      "X-Workspace-Id": "${WORKSPACE_ID}"
    },
    "params": {
      "version": "latest"
    }
  }
}
```

--------------------------------

### Render InputGroup Demo - React TypeScript (TSX)

Source: https://ui.shadcn.com/docs/components/input-group

A demo React component showcasing multiple InputGroup configurations with addons, buttons, tooltips, dropdowns, icons, and separators. Dependencies: React, @tabler/icons-react, lucide-react, and local UI components under "@/components/ui/*". Input: none (self-contained component); Output: JSX UI; Limitations: requires project styling and the referenced UI component implementations.

```tsx
import { IconCheck, IconInfoCircle, IconPlus } from "@tabler/icons-react"
import { ArrowUpIcon, Search } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function InputGroupDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="example.com" className="!pl-1" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton className="rounded-full" size="icon-xs">
                <IconInfoCircle />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>This is content in a tooltip.</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Ask, Search or Chat..." />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            variant="outline"
            className="rounded-full"
            size="icon-xs"
          >
            <IconPlus />
          </InputGroupButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton variant="ghost">Auto</InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="[--radius:0.95rem]"
            >
              <DropdownMenuItem>Auto</DropdownMenuItem>
              <DropdownMenuItem>Agent</DropdownMenuItem>
              <DropdownMenuItem>Manual</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <InputGroupText className="ml-auto">52% used</InputGroupText>
          <Separator orientation="vertical" className="!h-4" />
          <InputGroupButton
            variant="default"
            className="rounded-full"
            size="icon-xs"
            disabled
          >
            <ArrowUpIcon />
            <span className="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="@shadcn" />
        <InputGroupAddon align="inline-end">
          <div className="bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full">
            <IconCheck className="size-3" />
          </div>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

```

```tsx
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

```

```tsx
<InputGroup>
  <InputGroupInput placeholder="Search..." />
  <InputGroupAddon>
    <SearchIcon />
  </InputGroupAddon>
  <InputGroupAddon align="inline-end">
    <InputGroupButton>Search</InputGroupButton>
  </InputGroupAddon>
</InputGroup>

```

--------------------------------

### Create Input Group with Text Addons - TypeScript React

Source: https://ui.shadcn.com/docs/changelog

Builds multiple input groups with text addons positioned inline or at block end. Includes domain suffix input, email suffix input, and character counter textarea. Uses className customization for padding and text styling.

```typescript
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function InputGroupExample() {
  return (
    <div>
      <InputGroup>
        <InputGroupAddon />
        <InputGroupInput placeholder="example.com" className="!pl-0.5" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Enter your username" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>@company.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Enter your message" />
        <InputGroupAddon align="block-end">
          <InputGroupText className="text-muted-foreground text-xs">
            120 characters left
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
```

--------------------------------

### Carousel Options Configuration with Embla Carousel

Source: https://ui.shadcn.com/docs/components/carousel

Demonstrates passing configuration options to the Carousel component via the `opts` prop. Includes `align` and `loop` properties from Embla Carousel library. Refer to Embla Carousel documentation for additional available options.

```tsx
<Carousel
  opts={{
    align: "start",
    loop: true,
  }}
>
  <CarouselContent>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
  </CarouselContent>
</Carousel>
```

--------------------------------

### Configure shadcn/ui import aliases in components.json

Source: https://ui.shadcn.com/docs/changelog

This JSON configuration updates the `components.json` file to define import aliases for shadcn/ui components, utilities, UI elements, libraries, and hooks. It's essential for projects using the new CLI to correctly resolve module paths, allowing customization of the alias prefix if needed.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "tailwind": {
    // ...
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

--------------------------------

### Search Registry with search Command

Source: https://ui.shadcn.com/docs/cli

The search command queries component registries with optional filtering. Supports searching single or multiple registries with query strings, pagination controls, and registry aliases.

```bash
npx shadcn@latest search [registry]
```

```bash
npx shadcn@latest search @shadcn -q "button"
```

```bash
npx shadcn@latest search @shadcn @v0 @acme
```

```bash
npx shadcn@latest list @acme
```

```bash
Usage: shadcn search|list [options] <registries...>

search items from registries

Arguments:
  registries             the registry names or urls to search items from. Names
                         must be prefixed with @.

Options:
  -c, --cwd <cwd>        the working directory. defaults to the current directory.
  -q, --query <query>    query string
  -l, --limit <number>   maximum number of items to display per registry (default: "100")
  -o, --offset <number>  number of items to skip (default: "0")
  -h, --help             display help for command
```

--------------------------------

### shadcn Build Command with Custom Output Directory

Source: https://ui.shadcn.com/docs/cli

Build command with the --output option to specify a custom destination directory for generated JSON files. This allows flexibility in where registry files are written.

```bash
npx shadcn@latest build --output ./public/registry
```

--------------------------------

### Basic Progress Component Usage

Source: https://ui.shadcn.com/docs/components/progress

Minimal Progress component implementation with a fixed value of 33%. Demonstrates the basic usage pattern with the required value prop.

```tsx
<Progress value={33} />
```

--------------------------------

### Migrate Tailwind CSS `w-* h-*` Utilities to `size-*`

Source: https://ui.shadcn.com/docs/tailwind-v4

This `diff` snippet shows the migration from using separate `w-*` (width) and `h-*` (height) Tailwind utility classes to the consolidated `size-*` utility. This update aligns with Tailwind v3.4 for more concise styling.

```diff
- w-4 h-4
+ size-4
```

--------------------------------

### Create Multiple Link Items with Icons - React/TSX

Source: https://ui.shadcn.com/docs/changelog

Demonstrates multiple Item components styled as links with different action icons and variants. Includes internal documentation link and external resource link with security attributes (noopener, noreferrer).

```tsx
import { ChevronRightIcon, ExternalLinkIcon } from "lucide-react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"

export function ItemLink() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Item asChild>
        <a href="#">
          <ItemContent>
            <ItemTitle>Visit our documentation</ItemTitle>
            <ItemDescription>
              Learn how to get started with our components.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </a>
      </Item>
      <Item variant="outline" asChild>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <ItemContent>
            <ItemTitle>External resource</ItemTitle>
            <ItemDescription>
              Opens in a new tab with security attributes.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ExternalLinkIcon className="size-4" />
          </ItemActions>
        </a>
      </Item>
    </div>
  )
}
```

--------------------------------

### Choose TypeScript or JavaScript for components

Source: https://ui.shadcn.com/docs/components-json

Controls the file format for generated components. Set to true for TypeScript (.tsx) or false for JavaScript (.jsx). Determines the language syntax used in all generated component files.

```json
{
  "tsx": true | false
}
```

--------------------------------

### Migrate CSS Plugin from `tailwindcss-animate` to `tw-animate-css`

Source: https://ui.shadcn.com/docs/tailwind-v4

This `diff` snippet illustrates the necessary change in a `globals.css` file when migrating animation libraries. It shows replacing the `@plugin 'tailwindcss-animate'` directive with an `@import "tw-animate-css"` statement.

```diff
- @plugin 'tailwindcss-animate';
+ @import "tw-animate-css";
```

--------------------------------

### Create a Full Collapsible SidebarMenu Component in TSX

Source: https://ui.shadcn.com/docs/components/sidebar

This TypeScript/TSX snippet demonstrates how to construct a complete, functional and collapsible `SidebarMenu` component using Shadcn UI. It includes defining the data structure for menu items, importing necessary components, and rendering the menu with `Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent` to manage expand/collapse states.

```tsx
"use client"\n\nimport { ChevronRightIcon } from "lucide-react"\n\nimport {\n  Collapsible,\n  CollapsibleContent,\n  CollapsibleTrigger,\n} from "@/components/ui/collapsible"\nimport {\n  Sidebar,\n  SidebarContent,\n  SidebarGroup,\n  SidebarGroupContent,\n  SidebarMenu,\n  SidebarMenuButton,\n  SidebarMenuItem,\n  SidebarMenuSub,\n  SidebarMenuSubButton,\n  SidebarMenuSubItem,\n  SidebarProvider,\n} from "@/components/ui/sidebar"\n\nconst items = [\n  {\n    title: "Getting Started",\n    url: "#",\n    items: [\n      {\n        title: "Installation",\n        url: "#",\n      },\n      {\n        title: "Project Structure",\n        url: "#",\n      },\n    ],\n  },\n  {\n    title: "Building Your Application",\n    url: "#",\n    items: [\n      {\n        title: "Routing",\n        url: "#",\n      },\n      {\n        title: "Data Fetching",\n        url: "#",\n        isActive: true,\n      },\n      {\n        title: "Rendering",\n        url: "#",\n      },\n      {\n        title: "Caching",\n        url: "#",\n      },\n      {\n        title: "Styling",\n        url: "#",\n      },\n      {\n        title: "Optimizing",\n        url: "#",\n      },\n      {\n        title: "Configuring",\n        url: "#",\n      },\n      {\n        title: "Testing",\n        url: "#",\n      },\n      {\n        title: "Authentication",\n        url: "#",\n      },\n      {\n        title: "Deploying",\n        url: "#",\n      },\n      {\n        title: "Upgrading",\n        url: "#",\n      },\n      {\n        title: "Examples",\n        url: "#",\n      },\n    ],\n  },\n  {\n    title: "API Reference",\n    url: "#",\n    items: [\n      {\n        title: "Components",\n        url: "#",\n      },\n      {\n        title: "File Conventions",\n        url: "#",\n      },\n      {\n        title: "Functions",\n        url: "#",\n      },\n      {\n        title: "next.config.js Options",\n        url: "#",\n      },\n      {\n        title: "CLI",\n        url: "#",\n      },\n      {\n        title: "Edge Runtime",\n        url: "#",\n      },\n    ],\n  },\n  {\n    title: "Architecture",\n    url: "#",\n    items: [\n      {\n        title: "Accessibility",\n        url: "#",\n      },\n      {\n        title: "Fast Refresh",\n        url: "#",\n      },\n      {\n        title: "Next.js Compiler",\n        url: "#",\n      },\n      {\n        title: "Supported Browsers",\n        url: "#",\n      },\n      {\n        title: "Turbopack",\n        url: "#",\n      },\n    ],\n  },\n]\n\nexport function AppSidebar() {\n  return (\n    <SidebarProvider>\n      <Sidebar>\n        <SidebarContent>\n          <SidebarGroup>\n            <SidebarGroupContent>\n              <SidebarMenu>\n                {items.map((item, index) => (\n                  <Collapsible\n                    key={index}\n                    className="group/collapsible"\n                    defaultOpen={index === 0}\n                  >\n                    <SidebarMenuItem>\n                      <CollapsibleTrigger asChild>\n                        <SidebarMenuButton>\n                          <span>{item.title}</span>\n                          <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />\n                        </SidebarMenuButton>\n                      </CollapsibleTrigger>\n                      <CollapsibleContent>\n                        <SidebarMenuSub>\n                          {item.items.map((subItem, subIndex) => (\n                            <SidebarMenuSubItem key={subIndex}>\n                              <SidebarMenuSubButton asChild>\n                                <a href={subItem.url}>\n                                  <span>{subItem.title}</span>\n                                </a>\n                              </SidebarMenuSubButton>\n                            </SidebarMenuSubItem>\n                          ))}\n                        </SidebarMenuSub>\n                      </CollapsibleContent>\n                    </SidebarMenuItem>\n                  </Collapsible>\n                ))}\n              </SidebarMenu>\n            </SidebarGroupContent>\n          </SidebarGroup>\n        </SidebarContent>\n      </Sidebar>\n    </SidebarProvider>\n  )\n}\n
```

--------------------------------

### Import Shadcn Button Component (TypeScript)

Source: https://ui.shadcn.com/docs/components/button

Shows the necessary import statement for using the Shadcn UI `Button` component in a TypeScript/React file. The import path `"@/components/ui/button"` should be adjusted based on the project's directory structure.

```tsx
import { Button } from "@/components/ui/button"
```

--------------------------------

### Create Project File Structure for Data Table

Source: https://ui.shadcn.com/docs/components/data-table

Recommended directory structure for organizing data table components in a Next.js or React project. Separates column definitions, table component, and page rendering into distinct files following client and server component patterns.

```text
app
└── payments
    ├── columns.tsx
    ├── data-table.tsx
    └── page.tsx
```

--------------------------------

### Configure TypeScript Components with components.json

Source: https://ui.shadcn.com/docs/changelog

Set up shadcn/ui component configuration including Tailwind paths, base colors, CSS variables, React Server Components, and import aliases. Use the tsx flag to control TypeScript/JavaScript output and configure your project structure.

```json
{
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "rsc": false,
  "tsx": false,
  "aliases": {
    "utils": "~/lib/utils",
    "components": "~/components"
  }
}
```

--------------------------------

### Import and use shadcn/ui Button component in React

Source: https://ui.shadcn.com/docs/installation/vite

Demonstrates how to import and use the `Button` component from shadcn/ui within a React application. The component is imported from the configured path alias and rendered inside a functional component for UI display.

```tsx
import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button>Click me</Button>
    </div>
  )
}

export default App
```

--------------------------------

### Add input-group tooltips (React TSX)

Source: https://ui.shadcn.com/docs/components/input-group

Shows how to attach tooltip triggers to InputGroup buttons to provide contextual help or instructions. Depends on project Tooltip primitives, InputGroup components, and lucide-react icons. Inputs are text/password/API-key input fields; outputs are tooltip overlays. Limitations: tooltips rely on library positioning and the project's Tooltip implementation.

```tsx
import { HelpCircle, InfoIcon } from "lucide-react"\n\nimport {\n  InputGroup,\n  InputGroupAddon,\n  InputGroupButton,\n  InputGroupInput,\n} from "@/components/ui/input-group"\nimport {\n  Tooltip,\n  TooltipContent,\n  TooltipTrigger,\n} from "@/components/ui/tooltip"\n\nexport function InputGroupTooltip() {\n  return (\n    <div className="grid w-full max-w-sm gap-4">\n      <InputGroup>\n        <InputGroupInput placeholder="Enter password" type="password" />\n        <InputGroupAddon align="inline-end">\n          <Tooltip>\n            <TooltipTrigger asChild>\n              <InputGroupButton\n                variant="ghost"\n                aria-label="Info"\n                size="icon-xs"\n              >\n                <InfoIcon />\n              </InputGroupButton>\n            </TooltipTrigger>\n            <TooltipContent>\n              <p>Password must be at least 8 characters</p>\n            </TooltipContent>\n          </Tooltip>\n        </InputGroupAddon>\n      </InputGroup>\n      <InputGroup>\n        <InputGroupInput placeholder="Your email address" />\n        <InputGroupAddon align="inline-end">\n          <Tooltip>\n            <TooltipTrigger asChild>\n              <InputGroupButton\n                variant="ghost"\n                aria-label="Help"\n                size="icon-xs"\n              >\n                <HelpCircle />\n              </InputGroupButton>\n            </TooltipTrigger>\n            <TooltipContent>\n              <p>We&apos;ll use this to send you notifications</p>\n            </TooltipContent>\n          </Tooltip>\n        </InputGroupAddon>\n      </InputGroup>\n      <InputGroup>\n        <InputGroupInput placeholder="Enter API key" />\n        <Tooltip>\n          <TooltipTrigger asChild>\n            <InputGroupAddon>\n              <InputGroupButton\n                variant="ghost"\n                aria-label="Help"\n                size="icon-xs"\n              >\n                <HelpCircle />\n              </InputGroupButton>\n            </InputGroupAddon>\n          </TooltipTrigger>\n          <TooltipContent side="left">\n            <p>Click for help with API keys</p>\n          </TooltipContent>\n        </Tooltip>\n      </InputGroup>\n    </div>\n  )\n}\n
```

--------------------------------

### Alert Dialog Basic Usage - TypeScript React

Source: https://ui.shadcn.com/docs/components/alert-dialog

Demonstrates basic Alert Dialog structure with trigger, header (title and description), and footer (cancel and continue buttons). Shows the minimal JSX structure needed to create a functional alert dialog interface.

```typescript
<AlertDialog>
  <AlertDialogTrigger>Open</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

--------------------------------

### ItemContent Component

Source: https://ui.shadcn.com/docs/components/item

Wraps the title and description of an item. Provides consistent spacing and layout for textual content.

```APIDOC
## ItemContent Component

### Description
Wraps the title and description of the item. Provides consistent spacing and layout for textual content. Can be omitted if only a title is needed.

### Props
- **className** (string) - Optional - Additional CSS classes

### Basic Usage
```tsx
<ItemContent>
  <ItemTitle>Item</ItemTitle>
  <ItemDescription>Item</ItemDescription>
</ItemContent>
```
```

--------------------------------

### Implement DropdownMenu within a full Sidebar component in TypeScript/React

Source: https://ui.shadcn.com/docs/components/sidebar

This TypeScript/React component demonstrates a complete integration of Shadcn's `DropdownMenu` within a custom `Sidebar` structure. It renders a list of projects, where each project entry includes a `SidebarMenuAction` that triggers a `DropdownMenu` with options like 'Edit Project' and 'Delete Project'. Dependencies include `lucide-react` for icons and various Shadcn UI components for both `DropdownMenu` and `Sidebar`.

```tsx
"use client"

import {
  FrameIcon,
  LifeBuoyIcon,
  MapIcon,
  MoreHorizontalIcon,
  PieChartIcon,
  SendIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

const projects = [
  {
    name: "Design Engineering",
    url: "#",
    icon: FrameIcon,
  },
  {
    name: "Sales & Marketing",
    url: "#",
    icon: PieChartIcon,
  },
  {
    name: "Travel",
    url: "#",
    icon: MapIcon,
  },
  {
    name: "Support",
    url: "#",
    icon: LifeBuoyIcon,
  },
  {
    name: "Feedback",
    url: "#",
    icon: SendIcon,
  },
]

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton
                      asChild
                      className="group-has-[[data-state=open]]/menu-item:bg-sidebar-accent"
                    >
                      <a href={project.url}>
                        <project.icon />
                        <span>{project.name}</span>
                      </a>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction>
                          <MoreHorizontalIcon />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem>
                          <span>Edit Project</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <span>Delete Project</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
```

--------------------------------

### Apply CSS Variables in TSX for Theming

Source: https://ui.shadcn.com/docs/theming

Demonstrates how to apply CSS variables like `bg-background` and `text-foreground` to a div element in a React/Next.js component for dynamic theming, assuming `tailwind.cssVariables` is enabled in the configuration.

```tsx
<div className="bg-background text-foreground" />
```

--------------------------------

### Configure Private Registry with Bearer Token Authentication

Source: https://ui.shadcn.com/docs/changelog

Set up a private registry with authentication using Bearer tokens via environment variables. This configuration keeps proprietary UI components secure within enterprise teams while supporting all major authentication methods including basic auth, API keys, and custom headers.

```json
{
  "registries": {
    "@private": {
      "url": "https://registry.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

--------------------------------

### Override Third-Party Button Component with Custom CSS Variables

Source: https://ui.shadcn.com/docs/registry/namespace

Demonstrates how to override a vendor button by importing the original dependency and customizing CSS variables. Uses registryDependencies to establish the dependency chain and override specific styling properties like button background color.

```json
{
  "name": "button",
  "type": "registry:ui",
  "files": [
    {
      "path": "components/ui/button.tsx",
      "type": "registry:ui",
      "content": "// Vendor's button implementation\nexport function Button() { ... }"
    }
  ],
  "cssVars": {
    "light": {
      "--button-bg": "blue"
    }
  }
}
```

```json
{
  "name": "custom-button",
  "type": "registry:ui",
  "registryDependencies": [
    "@vendor/button"
  ],
  "cssVars": {
    "light": {
      "--button-bg": "purple"
    }
  }
}
```

--------------------------------

### Configure import alias for components

Source: https://ui.shadcn.com/docs/components-json

Sets the import path alias for generated UI components. Determines where components are imported from in the application.

```json
{
  "aliases": {
    "components": "@/components"
  }
}
```

--------------------------------

### Configure `components.json` for CSS Variable Theming

Source: https://ui.shadcn.com/docs/changelog

This `components.json` configuration snippet sets the `cssVariables` property to `true` within the `tailwind` object. This instructs shadcn/ui to theme components using CSS variables, facilitating dynamic theme adjustments and centralized color management in the project's `globals.css` file.

```json
{
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

--------------------------------

### Import Drawer Components in React

Source: https://ui.shadcn.com/docs/components/drawer

Import all required Drawer subcomponents from the UI component library. These exports provide the building blocks for constructing complete drawer interfaces with headers, triggers, content, and footers.

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
```

--------------------------------

### Basic Popover structure in React/TypeScript

Source: https://ui.shadcn.com/docs/components/popover

This code demonstrates the minimal JSX structure needed to implement a functional Popover. It includes a `PopoverTrigger` to activate the popover and a `PopoverContent` to house the displayed information, serving as a basic template for integration.

```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>Place content for the popover here.</PopoverContent>
</Popover>
```

--------------------------------

### Update Project Dependencies Using PNPM

Source: https://ui.shadcn.com/docs/tailwind-v4

This `bash` command uses `pnpm` to update several specified project dependencies to their latest available versions. It targets `@radix-ui/*`, `cmdk`, `lucide-react`, `recharts`, `tailwind-merge`, and `clsx`.

```bash
pnpm up "@radix-ui/*" cmdk lucide-react recharts tailwind-merge clsx --latest
```

--------------------------------

### Display Image with Aspect Ratio using Shadcn/ui and Next.js

Source: https://ui.shadcn.com/docs/components/aspect-ratio

This Next.js component demonstrates how to use the `AspectRatio` component from `@/components/ui/aspect-ratio` to display an `Image` with a fixed `16/9` aspect ratio. It utilizes `next/image` for optimized image loading and applies styling for a muted background, rounded corners, and object cover behavior.

```tsx
import Image from "next/image"

import { AspectRatio } from "@/components/ui/aspect-ratio"

export function AspectRatioDemo() {
  return (
    <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
      <Image
        src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
        alt="Photo by Drew Beamer"
        fill
        className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </AspectRatio>
  )
}
```

--------------------------------

### Create Basic Tooltip with Button Trigger

Source: https://ui.shadcn.com/docs/components/tooltip

Demonstrates a simple tooltip implementation with a button trigger. The tooltip displays 'Add to library' text when the user hovers over or focuses on the button. Uses the TooltipDemo export component pattern with outline button variant.

```tsx
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

--------------------------------

### Implement Shadcn UI SidebarHeader with Dropdown Menu (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/sidebar

This snippet shows how to integrate a `SidebarHeader` component into the `Sidebar` to create a sticky header. It further demonstrates adding a `DropdownMenu` within the header for workspace selection, utilizing `DropdownMenuTrigger`, `DropdownMenuContent`, and `DropdownMenuItem` components for interactive functionality.

```tsx
"use client"

import { ChevronDownIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    Select Workspace
                    <ChevronDownIcon className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
                  <DropdownMenuItem>
                    <span>Acme Inc</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Acme Corp.</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center justify-between px-4">
          <SidebarTrigger />
        </header>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

```tsx
<Sidebar>
  <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              Select Workspace
              <ChevronDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
            <DropdownMenuItem>
              <span>Acme Inc</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Acme Corp.</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
</Sidebar>
```

--------------------------------

### Configure shadcn MCP Server for Claude Code

Source: https://ui.shadcn.com/docs/mcp

This configuration snippet shows how to integrate the shadcn MCP server with Claude Code by adding a 'shadcn' entry to the project's '.mcp.json' file. It specifies 'npx shadcn@latest mcp' as the command to run the server, enabling Claude Code to interact with shadcn components.

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

--------------------------------

### Integrate Theme Provider in Root Layout - React TypeScript

Source: https://ui.shadcn.com/docs/dark-mode/vite

Wraps the root application component with the ThemeProvider component, establishing the context for theme management throughout the app. Sets the default theme to dark mode and specifies the localStorage key for persistence.

```typescript
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
  )
}

export default App
```

--------------------------------

### EmptyDescription Component

Source: https://ui.shadcn.com/docs/components/empty

Display descriptive text in an empty state using EmptyDescription component. Provides context to users about why content is unavailable and supports className prop for custom styling.

```tsx
<EmptyDescription>You do not have any notifications.</EmptyDescription>
```

--------------------------------

### Create Next.js Theme Provider Component

Source: https://ui.shadcn.com/docs/dark-mode/next

Defines a reusable React component (`ThemeProvider`) that wraps `next-themes`'s `ThemeProvider`. This component enables theme context throughout the application, making theme state accessible to all child components.

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

--------------------------------

### Implement Sidebar Menu with Navigation Items (TypeScript/React)

Source: https://ui.shadcn.com/docs/components/sidebar

This snippet enhances the `AppSidebar` component by adding a `SidebarMenu` with dynamic navigation items. It utilizes `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuButton`, and `SidebarMenuItem` to structure the menu with icons and links, demonstrating a common pattern for application navigation.

```tsx
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

--------------------------------

### Import Tabs Components

Source: https://ui.shadcn.com/docs/components/tabs

Import the Tabs, TabsContent, TabsList, and TabsTrigger components from the UI components directory. These are the core building blocks for creating tabbed interfaces.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```