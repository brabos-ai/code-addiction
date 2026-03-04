### Create Vite React Project

Source: https://v3.tailwindcss.com/docs/guides/vite

Initialize a new Vite project with React template. This command creates a new project directory and sets up the React development environment with Vite as the build tool.

```bash
npm create vite@latest my-project -- --template react
cd my-project
```

--------------------------------

### Install Tailwind CSS CLI and initialize project via npm

Source: https://v3.tailwindcss.com/docs/index

This command installs the `tailwindcss` package as a development dependency using npm. Following the installation, it initializes a `tailwind.config.js` file, providing a starting point for project-specific Tailwind CSS configurations.

```Terminal
npm install -D tailwindcss@3npx tailwindcss init
```

--------------------------------

### Start the Angular development server

Source: https://v3.tailwindcss.com/docs/guides/angular

Runs the Angular development server, which compiles your application and serves it locally. This command also processes Tailwind CSS, making the utility classes available for use in your project.

```Terminal
ng serve
```

--------------------------------

### Use Tailwind utility classes in HTML markup

Source: https://v3.tailwindcss.com/docs/installation/using-postcss

Link the compiled Tailwind CSS file in the HTML head and apply Tailwind utility classes to style elements. This example demonstrates basic text styling with text-3xl, font-bold, and underline utilities.

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="/dist/main.css" rel="stylesheet">
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Integrate Compiled Tailwind CSS in HTML

Source: https://v3.tailwindcss.com/docs/installation

Demonstrates how to link the generated `output.css` file into an HTML document's `<head>` section. This makes Tailwind's utility classes available for styling elements within the HTML body, such as the example `<h1>` tag.

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="./output.css" rel="stylesheet">
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Start Tailwind CSS CLI Build Process with Watch Mode

Source: https://v3.tailwindcss.com/docs/installation

Executes the Tailwind CSS CLI to scan template files, process the input CSS, and generate an output CSS file. The `--watch` flag continuously monitors for changes and automatically rebuilds the CSS.

```terminal
npx tailwindcss -i ./src/input.css -o ./src/output.css --watch
```

--------------------------------

### Start the React development server

Source: https://v3.tailwindcss.com/docs/guides/create-react-app

Execute this command in your terminal to start the development server for your React application. This process watches for file changes, rebuilds your application, and serves it, allowing you to see your Tailwind-styled components in action.

```shell
npm run start
```

--------------------------------

### Create SvelteKit Project with npx

Source: https://v3.tailwindcss.com/docs/guides/sveltekit

Initializes a new SvelteKit project using `npx sv create` and navigates into the project directory. This command is typically the first step when starting a new SvelteKit application.

```bash
npx sv create my-project
cd my-project
```

--------------------------------

### Initialize a new Astro project

Source: https://v3.tailwindcss.com/docs/guides/astro

This command creates a new Astro project directory with a specified name and then navigates into it, preparing your environment for further setup. It uses the `create astro` utility to scaffold the project.

```shell
npm create astro@latest my-project
cd my-project
```

--------------------------------

### Start Phoenix build process with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Executes the `mix phx.server` command in the terminal. This command starts the Phoenix server and triggers the configured asset build processes, including Tailwind CSS compilation, making your application with integrated styles accessible.

```shell
mix phx.server
```

--------------------------------

### Create a new Angular project

Source: https://v3.tailwindcss.com/docs/guides/angular

This command uses the Angular CLI to initialize a new Angular project named 'my-project' and then navigates into the newly created directory. It's the prerequisite step before adding Tailwind CSS.

```Terminal
ng new my-project
cd my-project
```

--------------------------------

### Start the Astro development server

Source: https://v3.tailwindcss.com/docs/guides/astro

Execute this command to launch your Astro project's local development server. This allows you to preview your changes in real-time as you develop, often with hot-reloading capabilities.

```shell
npm run dev
```

--------------------------------

### Configure Tailwind template paths in config

Source: https://v3.tailwindcss.com/docs/installation/using-postcss

Specify the paths to all template files in tailwind.config.js so Tailwind can scan them for class names and generate the appropriate CSS. This configuration includes content path patterns and theme extensions.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Install Tailwind CSS and Astro integration

Source: https://v3.tailwindcss.com/docs/guides/astro

Run this command to install both the `tailwindcss` package and the `@astrojs/tailwind` integration. It also automatically generates a `tailwind.config.cjs` file, streamlining the setup process.

```shell
npx astro add tailwind
```

--------------------------------

### Install Tailwind CSS and dependencies with npm

Source: https://v3.tailwindcss.com/docs/guides/angular

Installs Tailwind CSS, PostCSS, and Autoprefixer as development dependencies using npm. Afterward, it runs the `init` command to generate a `tailwind.config.js` file, which is crucial for configuring Tailwind.

```Terminal
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init
```

--------------------------------

### Start Tailwind CSS Build Process

Source: https://v3.tailwindcss.com/docs/guides/ruby-on-rails

This command initiates the build process for your Rails application, including Tailwind CSS. It typically watches for changes and recompiles assets as needed for development.

```Terminal
./bin/dev
```

--------------------------------

### Create a new Qwik project

Source: https://v3.tailwindcss.com/docs/guides/qwik

Start a new Qwik application by using the `npm create qwik` command, which scaffolds a fresh project structure. After creation, navigate into the new project directory.

```Terminal
npm create qwik@latest my-project
cd my-project
```

--------------------------------

### HTML Example with Various Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/content-configuration

This HTML snippet demonstrates a layout styled with multiple Tailwind CSS utility classes. Tailwind scans such attributes to identify class names for inclusion in the final CSS bundle.

```html
<div class="md:flex">
  <div class="md:flex-shrink-0">
    <img class="rounded-lg md:w-56" src="/img/shopping.jpg" alt="Woman paying for a purchase">
  </div>
  <div class="mt-4 md:mt-0 md:ml-6">
    <div class="uppercase tracking-wide text-sm text-indigo-600 font-bold">
      Marketing
    </div>
    <a href="/get-started" class="block mt-1 text-lg leading-tight font-semibold text-gray-900 hover:underline">
      Finding customers for your new business
    </a>
    <p class="mt-2 text-gray-600">
      Getting a new business off the ground is a lot of hard work.
      Here are five ideas you can use to find your first customers.
    </p>
  </div>
</div>
```

--------------------------------

### Create a new Symfony web application project

Source: https://v3.tailwindcss.com/docs/guides/symfony

This command initializes a new Symfony web application using the Symfony Installer. It also navigates into the newly created project directory, 'my-project'.

```bash
symfony new --webapp my-project
cd my-project
```

--------------------------------

### Configure Tailwind Template Paths

Source: https://v3.tailwindcss.com/docs/guides/vite

Define content paths in tailwind.config.js to specify which template files Tailwind should scan for class names. This configuration ensures Tailwind CSS purges unused styles and includes all necessary classes from your project files.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Apply Tailwind CSS utility classes in an Angular template

Source: https://v3.tailwindcss.com/docs/guides/angular

Demonstrates how to use Tailwind CSS utility classes directly within an Angular component's HTML template. This example applies styles for text size, font weight, and an underline to an `<h1>` element.

```HTML
<h1 class="text-3xl font-bold underline">
  Hello world!
</h1>
```

--------------------------------

### Install Tailwind CSS v3.0 with Official Plugins

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Install Tailwind CSS v3.0 along with all first-party plugins (@tailwindcss/typography, @tailwindcss/forms, @tailwindcss/aspect-ratio, @tailwindcss/line-clamp) and required dependencies. All plugins must be updated to the latest version simultaneously to avoid version constraint errors.

```bash
npm install -D tailwindcss@latest \
  @tailwindcss/typography@latest \
  @tailwindcss/forms@latest \
  @tailwindcss/aspect-ratio@latest \
  @tailwindcss/line-clamp@latest \
  postcss@latest \
  autoprefixer@latest
```

--------------------------------

### Start the Webpack build process for development

Source: https://v3.tailwindcss.com/docs/guides/symfony

This command initiates the asset compilation process managed by Webpack Encore, typically in watch mode for development. It compiles your CSS and JavaScript, applying Tailwind CSS transformations.

```bash
npm run watch
```

--------------------------------

### Create Nuxt Project with CLI

Source: https://v3.tailwindcss.com/docs/guides/nuxtjs

Initialize a new Nuxt project using the Nuxt Command Line Interface. This creates the base project structure needed before installing Tailwind CSS dependencies.

```bash
npx nuxi init my-project
cd my-project
```

--------------------------------

### Add Play CDN Script to HTML

Source: https://v3.tailwindcss.com/docs/installation/play-cdn

Load Tailwind CSS directly in the browser using the Play CDN script tag. This minimal setup enables immediate use of Tailwind utility classes for styling without any build process. Ideal for quick prototyping and development-only usage.

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Create SolidJS Project with Vite Template

Source: https://v3.tailwindcss.com/docs/guides/solidjs

Initialize a new SolidJS project using the official Vite template. This command creates a project directory and installs necessary dependencies for SolidJS development.

```bash
npx degit solidjs/templates/js my-project
cd my-project
```

--------------------------------

### Create Remix Project with create-remix

Source: https://v3.tailwindcss.com/docs/guides/remix

Initialize a new Remix project using the create-remix scaffolding tool. This command creates a new directory and sets up the basic Remix project structure with all necessary dependencies.

```bash
npx create-remix@latest my-project
cd my-project
```

--------------------------------

### Configure Tailwind CSS Template Paths

Source: https://v3.tailwindcss.com/docs/installation

Updates the `tailwind.config.js` file to specify the paths to all template files (e.g., HTML, JavaScript) that Tailwind CSS should scan for utility classes. This ensures Tailwind knows where to find and process classes.

```javascript
/** @type {import('tailwindcss').Config} */
 export default {
>   content: ["./src/**/*.{html,js}"],
    theme: {
      extend: {},
    },
    plugins: [],
  }
```

--------------------------------

### Create a new React project with Create React App

Source: https://v3.tailwindcss.com/docs/guides/create-react-app

This command initializes a new React application named 'my-project' using Create React App v5.0+ and then navigates into the newly created project directory. Ensure you have Node.js and npm/npx installed to execute this.

```shell
npx create-react-app my-project
cd my-project
```

--------------------------------

### Customize Tailwind Configuration with Theme Extension

Source: https://v3.tailwindcss.com/docs/installation/play-cdn

Extend the default Tailwind theme by modifying the `tailwind.config` object to add custom design tokens such as colors. This example demonstrates adding a custom color palette that can be applied via utility classes throughout the HTML.

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            clifford: '#da373d',
          }
        }
      }
    }
  </script>
</head>
<body>
  <h1 class="text-3xl font-bold underline text-clifford">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Configure Tailwind plugin in config.exs

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Configures the Tailwind plugin in the `config.exs` file, specifying the desired Tailwind CSS version, the path to the `tailwind.config.js` file, and custom asset input/output paths. This setup dictates how Tailwind CSS processes and bundles the project's styles.

```elixir
config :tailwind, version: "3.4.17", default: [
  args: ~w(
    --config=tailwind.config.js
    --input=css/app.css
    --output=../priv/static/assets/app.css
  ),
  cd: Path.expand("../assets", __DIR__)
]
```

--------------------------------

### Create New Laravel Project with Composer

Source: https://v3.tailwindcss.com/docs/guides/laravel

Initialize a new Laravel project using Composer's create-project command. This sets up the basic Laravel application structure and installs core dependencies.

```bash
composer create-project laravel/laravel my-project
cd my-project
```

--------------------------------

### Start Parcel Build Process with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/guides/parcel

This command initiates Parcel's development server and build process by specifying the entry HTML file. Parcel will automatically compile the 'index.html' file and process any linked CSS, including the Tailwind CSS directives, for development.

```bash
npx parcel src/index.html
```

--------------------------------

### Starting and Ending Grid Lines with col-start and col-end in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/grid-column

Shows how to use col-start-* and col-end-* utilities to position grid items at specific grid lines. The example demonstrates a 6-column grid where items are placed using line numbers (starting at 1). These utilities can be combined with col-span-* for precise control over element positioning.

```html
<div class="grid grid-cols-6 gap-4">
  <div class="col-start-2 col-span-4 ...">01</div>
  <div class="col-start-1 col-end-3 ...">02</div>
  <div class="col-end-7 col-span-2 ...">03</div>
  <div class="col-start-1 col-end-7 ...">04</div>
</div>
```

--------------------------------

### Install postcss-nesting for Standard CSS Nesting

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Use this npm command to install `postcss-nesting` if you prefer to use the standard CSS Nesting specification instead of the default `postcss-nested` plugin bundled with `tailwindcss/nesting`.

```shell
npm install -D postcss-nesting
```

--------------------------------

### Enable First-Party Tailwind Plugins via CDN

Source: https://v3.tailwindcss.com/docs/installation/play-cdn

Load official Tailwind plugins directly from the CDN by appending the `plugins` query parameter to the script URL. Supported plugins include forms, typography, aspect-ratio, line-clamp, and container-queries for extended functionality.

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp,container-queries"></script>
</head>
<body>
  <div class="prose">
    <!-- ... -->
  </div>
</body>
</html>
```

--------------------------------

### Install Tailwind CSS v3.0 with npm

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Update Tailwind CSS, PostCSS, and autoprefixer to their latest versions using npm. Note that Tailwind CSS v3.0 requires PostCSS 8 and no longer supports PostCSS 7.

```bash
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
```

--------------------------------

### Minify Tailwind CSS Output with CLI

Source: https://v3.tailwindcss.com/docs/optimizing-for-production

This command line interface example demonstrates how to minify the final CSS output generated by the Tailwind CSS CLI. By adding the `--minify` flag, the CSS build process automatically applies minification, reducing the file size for production deployments.

```shell
npx tailwindcss -o build.css --minify
```

--------------------------------

### Create New Rails Project

Source: https://v3.tailwindcss.com/docs/guides/ruby-on-rails

This command initializes a new Ruby on Rails project named 'my-project' and navigates into its directory, providing a clean slate for development.

```Terminal
rails new my-project
cd my-project
```

--------------------------------

### Install postcss-import Plugin

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Install the postcss-import npm package as a dependency for handling @import statements at build time. This plugin processes CSS imports before browser execution, enabling organized stylesheet structure.

```bash
npm install -D postcss-import
```

--------------------------------

### Create Meteor Project

Source: https://v3.tailwindcss.com/docs/guides/meteor

Initialize a new Meteor project using the Meteor CLI. This creates the project directory structure and sets up the basic Meteor application framework.

```bash
meteor create my-project
cd my-project
```

--------------------------------

### Create a new Phoenix project in Terminal

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Initializes a new Phoenix project using the `mix phx.new` command and then navigates into the newly created project directory. This is the foundational step required before integrating Tailwind CSS into the application.

```shell
mix phx.new myproject
cd myproject
```

--------------------------------

### Tailwind CSS Snap Start - Horizontal Scrolling Image Gallery

Source: https://v3.tailwindcss.com/docs/scroll-snap-align

Implements a horizontally scrollable image gallery using Tailwind's snap-x and snap-start utilities. Elements snap to the start edge of the viewport when scrolling. This example uses unsplash image URLs and requires Tailwind CSS to be properly configured in the project.

```HTML
<div class="snap-x ...">
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1559333086-b0a56225a93c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
</div>
```

--------------------------------

### Create new Rspack project with CLI

Source: https://v3.tailwindcss.com/docs/guides/rspack

Initialize a new Rspack project using the official Rspack CLI tool. This command creates a basic project structure with all necessary configuration files.

```bash
npm create rspack@latest
```

--------------------------------

### Install Tailwind CSS and generate config file via npm

Source: https://v3.tailwindcss.com/docs/guides/create-react-app

This step installs Tailwind CSS as a development dependency in your project using npm. After installation, the 'npx tailwindcss init' command generates a basic 'tailwind.config.js' file in your project root, which is essential for Tailwind's configuration.

```shell
npm install -D tailwindcss@3
npx tailwindcss init
```

--------------------------------

### Install Autoprefixer via npm

Source: https://v3.tailwindcss.com/docs/browser-support

Command to install Autoprefixer as a development dependency. Autoprefixer is a PostCSS plugin that automatically adds vendor prefixes to CSS properties based on target browser specifications.

```bash
npm install -D autoprefixer
```

--------------------------------

### Reference Custom Keyframes in Animation Utilities

Source: https://v3.tailwindcss.com/docs/animation

Maps custom keyframes to animation utilities in the Tailwind theme. This example references the previously defined 'wiggle' keyframes and creates an animation utility with a 1-second duration and ease-in-out timing. The animation repeats infinitely.

```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
      }
    }
  }
}
```

--------------------------------

### Safelisting Tailwind CSS Core Plugins

Source: https://v3.tailwindcss.com/docs/configuration

This example shows how to explicitly enable a specific subset of core plugins by providing an array of plugin names to the `corePlugins` property. Only the plugins listed in the array will be generated, which is beneficial for projects with strict utility requirements or when building highly customized Tailwind setups.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: [
    'margin',
    'padding',
    'backgroundColor',
    // ...
  ]
}
```

--------------------------------

### Correct Dynamic Tailwind Class Generation in HTML

Source: https://v3.tailwindcss.com/docs/content-configuration

This HTML example shows the recommended approach for dynamic Tailwind CSS classes by ensuring complete class names are conditionally rendered as full, unbroken strings. This allows Tailwind to correctly detect and generate all necessary styles.

```html
<div class="{{ error ? 'text-red-600' : 'text-green-600' }}"></div>
```

--------------------------------

### Tailwind CSS content-start Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Packs grid rows against the start of the cross axis using the content-start utility class. Creates a grid container with 3 columns, gap spacing, and rows aligned to the top. Equivalent to CSS align-content: flex-start property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-start ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Install Tailwind CSS CLI in Phoenix project

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Runs the `mix tailwind.install` command in the terminal. This command downloads the standalone Tailwind CLI executable and generates a `tailwind.config.js` file in the `./assets` directory, which is necessary for configuring Tailwind CSS.

```shell
mix tailwind.install
```

--------------------------------

### Initialize a New Parcel Project

Source: https://v3.tailwindcss.com/docs/guides/parcel

This command sequence creates a new directory, initializes an npm project, installs Parcel as a development dependency, and sets up a basic 'src' directory with an 'index.html' file to begin development.

```bash
mkdir my-project
cd my-project
npm init -y
npm install -D parcel
mkdir src
touch src/index.html
```

--------------------------------

### Create AdonisJS Project using npm

Source: https://v3.tailwindcss.com/docs/guides/adonisjs

This command initializes a new AdonisJS project named 'my-project' using the latest version of `@adonisjs/cli`. It sets up a web application kit. This is the foundational step before proceeding with Tailwind CSS integration.

```bash
npm init adonisjs@latest my-project -- --kit=webcd my-project
```

--------------------------------

### Create Ember.js Project with Ember CLI

Source: https://v3.tailwindcss.com/docs/guides/emberjs

Initialize a new Ember.js project with Embroider enabled for modern build tooling support. This command creates the project directory structure and configures the necessary dependencies.

```bash
npx ember-cli new my-project --embroider --no-welcome
cd my-project
```

--------------------------------

### Install Tailwind CSS and Dependencies via npm

Source: https://v3.tailwindcss.com/docs/guides/remix

Install Tailwind CSS v3 along with PostCSS and Autoprefixer as dev dependencies, then generate the required configuration files. The init command with --ts flag creates a TypeScript config and -p flag generates the PostCSS config.

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init --ts -p
```

--------------------------------

### Customize gridRowStart utilities in Tailwind theme

Source: https://v3.tailwindcss.com/docs/grid-row

Extend the gridRowStart section of your Tailwind theme to add custom row-start utilities. This example adds utilities for row start positions 8 through 13, enabling row-start-8, row-start-9, etc. classes in your HTML markup.

```javascript
module.exports = {
  theme: {
    extend: {
      gridRowStart: {
        '8': '8',
        '9': '9',
        '10': '10',
        '11': '11',
        '12': '12',
        '13': '13',
      }
    }
  }
}
```

--------------------------------

### Start Gatsby development server with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/guides/gatsby

Run the 'gatsby develop' command in your terminal. This command starts the Gatsby development server, compiles your project with Tailwind CSS integrated, and allows you to view your application in a web browser.

```Terminal
gatsby develop
```

--------------------------------

### Install Tailwind CSS and PostCSS Dependencies for AdonisJS

Source: https://v3.tailwindcss.com/docs/guides/adonisjs

This command installs `tailwindcss`, `postcss`, and `autoprefixer` as development dependencies. Following the installation, it initializes Tailwind CSS, generating the necessary `tailwind.config.js` and `postcss.config.js` configuration files with the `-p` flag.

```bash
npm install -D tailwindcss@3 postcss autoprefixernpx tailwindcss init -p
```

--------------------------------

### Add Tailwind CSS watcher for Phoenix development

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Enables a Tailwind CSS watcher in the `dev.exs` configuration file. This setup automatically rebuilds your CSS whenever changes are detected in your project, providing a seamless development experience without manual recompilation.

```elixir
watchers: [
  # Start the esbuild watcher by calling Esbuild.install_and_run(:default, args)
  esbuild: {Esbuild, :install_and_run, [:default, ~w(--sourcemap=inline --watch)]},
  tailwind: {Tailwind, :install_and_run, [:default, ~w(--watch)]}
]
```

--------------------------------

### Set Tailwind CSS Gradient Starting Color

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

Use the `from-*` utilities to define the initial color of a Tailwind CSS gradient. This example sets a gradient starting from `indigo-500`.

```html
<div class="bg-gradient-to-r from-indigo-500 ..."></div>
```

--------------------------------

### Configuring Official Tailwind CSS Plugins in JavaScript

Source: https://v3.tailwindcss.com/docs/plugins

This example illustrates how to integrate official Tailwind CSS plugins into your project. After installing them via npm, you can include them in your `tailwind.config.js` file by using `require()` within the `plugins` array.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ]
}
```

--------------------------------

### Use Tailwind CSS Classes and PostCSS in Svelte Components

Source: https://v3.tailwindcss.com/docs/guides/sveltekit

Demonstrates how to apply Tailwind utility classes to HTML elements within a Svelte component and how to use PostCSS within a `<style>` block. It shows an example of using `text-3xl`, `font-bold`, `underline`, and `theme()` function for background color.

```html
<h1 class="text-3xl font-bold underline">
  Hello world!
</h1>

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.gray.100);
  }
</style>
```

--------------------------------

### Install Tailwind CSS and Generate Configuration

Source: https://v3.tailwindcss.com/docs/guides/parcel

This command installs 'tailwindcss' and 'postcss' as development dependencies via npm. Afterwards, it initializes the Tailwind CSS configuration file ('tailwind.config.js') in your project root, which is essential for customizing Tailwind.

```bash
npm install -D tailwindcss@3 postcss
npx tailwindcss init
```

--------------------------------

### Install Tailwind CSS and Dependencies

Source: https://v3.tailwindcss.com/docs/guides/meteor

Install Tailwind CSS v3 and peer dependencies (postcss, autoprefixer) via npm. The init command generates required configuration files: tailwind.config.js and postcss.config.js.

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

--------------------------------

### Create Next.js project with TypeScript

Source: https://v3.tailwindcss.com/docs/guides/nextjs

Initialize a new Next.js project using Create Next App with TypeScript and ESLint support. This command generates a new project directory with necessary Next.js configuration files and development dependencies.

```bash
npx create-next-app@latest my-project --typescript --eslint
cd my-project
```

--------------------------------

### Tailwind CSS Place Content Start Grid Layout

Source: https://v3.tailwindcss.com/docs/place-content

Packs grid items against the start of the block axis using the place-content-start utility. Positions 4 items in a 2-column grid at the top of the container. Ideal for aligning content to the beginning of a grid container.

```html
<div class="grid grid-cols-2 gap-4 place-content-start h-48 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Import Global CSS into SvelteKit Layout

Source: https://v3.tailwindcss.com/docs/guides/sveltekit

Creates a `./src/routes/+layout.svelte` file and imports the `app.css` file. This ensures that the global Tailwind CSS styles are applied across all pages rendered by this layout.

```html
<script>
  import "../app.css";
</script>

<slot />
```

--------------------------------

### Integrate Tailwind CSS in HTML Structure

Source: https://v3.tailwindcss.com/docs/guides/parcel

This HTML snippet demonstrates how to link the compiled 'index.css' file to an HTML document within the '<head>' section. It also shows an example of applying Tailwind CSS utility classes (e.g., 'text-3xl', 'font-bold', 'underline') to an HTML element.

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="./index.css" type="text/css" rel="stylesheet">
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Add Tailwind CSS directives to global stylesheet

Source: https://v3.tailwindcss.com/docs/guides/angular

Inserts the `@tailwind` directives into your `src/styles.css` file. These directives are processed by Tailwind CSS during the build step, injecting its base styles, components, and utilities into your application.

```CSS
@tailwind base;
@tailwind components;
@tailwind utilities;
```

--------------------------------

### Apply break-before-column in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/break-before

This example demonstrates how to use the `break-before-column` utility to force a column break before a specific element within a multi-column layout. It ensures the content following the element starts in a new column.

```html
<div class="columns-2">
  <p>Well, let me tell you something, ...</p>
  <p class="break-before-column">Sure, go ahead, laugh...</p>
  <p>Maybe we can live without...</p>
  <p>Look. If you think this is...</p>
</div>
```

--------------------------------

### Define and Resolve Media Queries with Tailwind CSS screen() Function

Source: https://v3.tailwindcss.com/docs/functions-and-directives

This example demonstrates how to define a media query using the `screen()` function in Tailwind CSS, referencing a named breakpoint like 'sm'. It also illustrates how this concise syntax is resolved during the build process into a standard CSS media query with the corresponding pixel value, ensuring browser compatibility.

```css
@media screen(sm) {
  /* ... */
}
```

```css
@media (min-width: 640px) {
  /* ... */
}
```

--------------------------------

### Use Tailwind Utility Classes in SolidJS

Source: https://v3.tailwindcss.com/docs/guides/solidjs

Apply Tailwind CSS utility classes to JSX elements in your SolidJS components. This example demonstrates basic text styling using Tailwind's utility classes for font size, weight, and text decoration.

```javascript
export default function App() {
  return (
    <h1 class="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}
```

--------------------------------

### Set Background Origin with Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/background-origin

This example demonstrates the core `bg-origin-` utility classes in Tailwind CSS. It shows how `bg-origin-border`, `bg-origin-padding`, and `bg-origin-content` control the starting point of an element's background image rendering relative to its border, padding, or content box.

```html
<div class="bg-origin-border p-4 border-4 border-dashed ..." style="background-image: url(...)"></div>
<div class="bg-origin-padding p-4 border-4 border-dashed ..." style="background-image: url(...)"></div>
<div class="bg-origin-content p-4 border-4 border-dashed ..." style="background-image: url(...)"></div>
```

--------------------------------

### Install Tailwind CSS and PostCSS Dependencies

Source: https://v3.tailwindcss.com/docs/guides/emberjs

Install Tailwind CSS v3, PostCSS, PostCSS loader, and Autoprefixer as dev dependencies. The init command generates both tailwind.config.js and postcss.config.js configuration files automatically.

```bash
npm install -D tailwindcss@3 postcss postcss-loader autoprefixer
npx tailwindcss init -p
```

--------------------------------

### Configure Tailwind CSS to scan template paths

Source: https://v3.tailwindcss.com/docs/index

This configuration within `tailwind.config.js` specifies the files that Tailwind CSS should scan for utility classes. By defining these content paths, Tailwind ensures that only the CSS classes actually used in your project's HTML and JavaScript templates are included in the final compiled output, optimizing file size.

```javascript
/** @type {import('tailwindcss').Config} */
 export default {
   content: ["./src/**/*.{html,js}"],
    theme: {
      extend: {},
    },
    plugins: [],
  }
```

--------------------------------

### Install Tailwind CSS Typography Plugin via npm

Source: https://v3.tailwindcss.com/docs/typography-plugin

Installs the official Tailwind CSS Typography plugin from npm for adding prose classes to your project. Run this command in your project directory to add the plugin as a development dependency.

```bash
npm install -D @tailwindcss/typography
```

--------------------------------

### Align Grid Items to Start with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/place-items

Utilize the `place-items-start` utility class to align grid items to the beginning of their respective grid areas along both the row and column axes. This example demonstrates a basic grid container with three columns and uses `gap-4` for spacing between items.

```html
<div class="grid grid-cols-3 gap-4 place-items-start ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>
```

--------------------------------

### Configure Tailwind CSS template paths in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/guides/create-react-app

Update your 'tailwind.config.js' file by adding paths to all your template files in the 'content' array. This configuration tells Tailwind CSS where to scan for class names to generate only the necessary CSS, optimizing file size. The example covers JavaScript, JSX, TypeScript, and TSX files within the 'src' directory.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Apply Basic Linear Gradients with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-image

This example demonstrates how to create linear gradient backgrounds using Tailwind CSS `bg-gradient-to-*` utilities combined with color stop classes. These classes apply gradients from a starting color to an ending color across a specified direction, enhancing the visual design of HTML elements.

```html
<div class="h-14 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
<div class="h-14 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
<div class="h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
<div class="h-14 bg-gradient-to-r from-purple-500 to-pink-500"></div>
```

--------------------------------

### Configure PostCSS for Tailwind CSS Integration

Source: https://v3.tailwindcss.com/docs/guides/parcel

This snippet creates or modifies the '.postcssrc' file in your project root to include Tailwind CSS as a PostCSS plugin. This setup allows PostCSS to process Tailwind's directives and optimize your CSS during the build process.

```json
{
  "plugins": {
    "tailwindcss": {}
  }
}
```

--------------------------------

### Configure Tailwind CSS template paths in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/guides/angular

Modifies the `tailwind.config.js` file to include paths to all template files where Tailwind CSS utility classes will be used. This allows Tailwind to scan and generate only the necessary CSS.

```JavaScript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Use Tailwind Utility Classes in Vue Template

Source: https://v3.tailwindcss.com/docs/guides/nuxtjs

Apply Tailwind CSS utility classes directly to HTML elements in Vue templates. This example demonstrates text sizing, font weight, and text decoration utilities.

```vue
<template>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</template>
```

--------------------------------

### Install Tailwind CSS and PostCSS dependencies for Gatsby

Source: https://v3.tailwindcss.com/docs/guides/gatsby

Install necessary packages including 'tailwindcss', 'postcss', 'autoprefixer', and 'gatsby-plugin-postcss' as development dependencies using npm. Afterward, run the 'npx tailwindcss init -p' command to generate 'tailwind.config.js' and 'postcss.config.js' configuration files.

```Terminal
npm install -D tailwindcss@3 postcss autoprefixer gatsby-plugin-postcss
npx tailwindcss init -p
```

--------------------------------

### Example Output of Prefixed Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/configuration

This CSS output demonstrates how Tailwind CSS utility classes are generated with a `tw-` prefix after configuring the `prefix` option. It shows basic text alignment classes with the applied prefix.

```css
.tw-text-left {
  text-align: left;
}
.tw-text-center {
  text-align: center;
}
.tw-text-right {
  text-align: right;
}
/* etc. */
```

--------------------------------

### Install Tailwind CSS Rails Gem

Source: https://v3.tailwindcss.com/docs/guides/ruby-on-rails

These commands add the `tailwindcss-rails` gem to your Rails project and then run the installation script, which generates the necessary `tailwind.config.js` file for Tailwind CSS configuration.

```Terminal
./bin/bundle add tailwindcss-rails
./bin/rails tailwindcss:install
```

--------------------------------

### Add Tailwind plugin to Phoenix dependencies

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Adds the `tailwind` plugin to the `deps` function within the `mix.exs` file. The plugin is configured to be active only in the development environment. After adding the dependency, run `mix deps.get` to fetch and install it.

```elixir
defp deps do
  [
    {:tailwind, "~> 0.1", runtime: Mix.env() == :dev}
  ]
end
```

--------------------------------

### Create a new Gatsby project using Gatsby CLI

Source: https://v3.tailwindcss.com/docs/guides/gatsby

Initialize a new Gatsby project by running the 'gatsby new' command, which sets up a basic project structure, and then navigate into the new project directory to begin development.

```Terminal
gatsby new my-project
cd my-project
```

--------------------------------

### Use Tailwind Utility Classes in React Component

Source: https://v3.tailwindcss.com/docs/guides/meteor

Apply Tailwind CSS utility classes to React JSX elements via the className attribute. This example demonstrates text sizing, font weight, and text decoration utilities.

```javascript
export const App = () => (
  <h1 className="text-3xl font-bold underline">
    Hello world!
  </h1>
)
```

--------------------------------

### Set up Tailwind CSS v3.0 Play CDN

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Configure Tailwind CSS v3.0 using the Play CDN by adding a script tag to the HTML head. The Play CDN provides full access to the new engine in the browser without a build step, but is designed for development only and should not be used in production.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Example</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <!-- -->
  </body>
</html>
```

--------------------------------

### Apply row-span on Hover State

Source: https://v3.tailwindcss.com/docs/grid-row

Use hover variant modifiers to conditionally apply row-span utilities on user interaction. This example applies row-span-3 by default and increases to row-span-4 on hover.

```html
<div class="row-span-3 hover:row-span-4">
  <!-- ... -->
</div>
```

--------------------------------

### Refine Tailwind CSS Content Paths to Prevent Infinite Loops

Source: https://v3.tailwindcss.com/docs/content-configuration

To prevent infinite rebuild loops, this `tailwind.config.js` example shows how to use more specific content paths. By explicitly listing directories like `./src/pages` and `./src/components`, it ensures that only relevant template files are watched, avoiding accidental watching of CSS output files or other build artifacts.

```javascript
module.exports = {
  content: [
    './src/**/*.{html,js}',
    './src/pages/**/*.{html,js}',
    './src/components/**/*.{html,js}',
    './src/layouts/**/*.{html,js}',
    './src/index.html',
  ],
  // ...
}
```

--------------------------------

### Include compiled CSS and use Tailwind in a Symfony Twig template

Source: https://v3.tailwindcss.com/docs/guides/symfony

This HTML snippet demonstrates how to link the compiled CSS from Webpack Encore into a Symfony Twig template. It also shows a basic example of using Tailwind CSS utility classes to style an '<h1>' element.

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  {% block stylesheets %}
    {{ encore_entry_link_tags('app') }}
  {% endblock %}
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Apply Tailwind utility classes in React component

Source: https://v3.tailwindcss.com/docs/guides/nextjs

Use Tailwind CSS utility classes in a Next.js React component via the className attribute. This example demonstrates styling a heading with text size, font weight, and text decoration utilities.

```typescript
export default function Home() {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}
```

--------------------------------

### Pulse Animation for Skeleton Loaders

Source: https://v3.tailwindcss.com/docs/animation

Implements the animate-pulse utility to create a gentle fade in and out effect on placeholder elements. Demonstrates skeleton loader layouts for both light and dark themes using grid structures.

```html
<div class="border border-blue-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
  <div class="animate-pulse flex space-x-4">
    <div class="rounded-full bg-slate-200 h-10 w-10"></div>
    <div class="flex-1 space-y-6 py-1">
      <div class="h-2 bg-slate-200 rounded"></div>
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-4">
          <div class="h-2 bg-slate-200 rounded col-span-2"></div>
          <div class="h-2 bg-slate-200 rounded col-span-1"></div>
        </div>
        <div class="h-2 bg-slate-200 rounded"></div>
      </div>
    </div>
  </div>
</div>
```

--------------------------------

### Install Webpack Encore bundle in Symfony

Source: https://v3.tailwindcss.com/docs/guides/symfony

This command uses Composer to install the 'symfony/webpack-encore-bundle', which is essential for managing and building front-end assets in Symfony applications. It integrates Webpack for asset compilation.

```bash
composer require symfony/webpack-encore-bundle
```

--------------------------------

### Use Tailwind Utility Classes in React Component

Source: https://v3.tailwindcss.com/docs/guides/remix

Apply Tailwind CSS utility classes via the className attribute in JSX elements. This example demonstrates basic text styling utilities: text-3xl for font size, font-bold for weight, and underline for text decoration.

```typescript
export default function Index() {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}
```

--------------------------------

### Configure Tailwind CSS Content Paths for SvelteKit

Source: https://v3.tailwindcss.com/docs/guides/sveltekit

Updates the `tailwind.config.js` file to specify the paths of template files that Tailwind CSS should scan for utility classes. This ensures that unused CSS is purged and only necessary styles are included in the final build.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {}
  },
  plugins: []
};
```

--------------------------------

### Explicitly Fade Tailwind CSS Gradient to Transparent

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

This example shows how to explicitly fade a Tailwind CSS gradient to transparent using `to-transparent`. While generally not recommended, it defines a gradient starting from blue and ending transparently.

```html
<div class="bg-gradient-to-r from-blue-500 to-transparent">
  <!-- ... -->
</div>
```

--------------------------------

### Add Custom CSS with Tailwind Directives

Source: https://v3.tailwindcss.com/docs/installation/play-cdn

Define custom CSS utilities using the `@layer` directive within a `<style type="text/tailwindcss">` block. This approach allows creation of custom utility classes that integrate seamlessly with Tailwind's responsive and state modifiers.

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style type="text/tailwindcss">
    @layer utilities {
      .content-auto {
        content-visibility: auto;
      }
    }
  </style>
</head>
<body>
  <div class="lg:content-auto">
    <!-- ... -->
  </div>
</body>
</html>
```

--------------------------------

### Create dynamic utilities with matchUtilities and theme

Source: https://v3.tailwindcss.com/docs/plugins

Generates utilities that map to values from the user's theme configuration using matchUtilities. The example creates tab-size utilities that use theme values and support arbitrary values via square bracket notation (e.g., tab-[13]).

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  theme: {
    tabSize: {
      1: '1',
      2: '2',
      4: '4',
      8: '8',
    }
  },
  plugins: [
    plugin(function({ matchUtilities, theme }) {
      matchUtilities(
        {
          tab: (value) => ({
            tabSize: value
          }),
        },
        { values: theme('tabSize') }
      )
    })
  ]
}
```

--------------------------------

### Extend Animation with Custom Speed in Tailwind Config

Source: https://v3.tailwindcss.com/docs/animation

Adds a custom animation utility to the Tailwind theme by extending the animation property. This example creates a 'spin-slow' animation that applies the spin keyframes at a slower 3-second duration. The configuration is added to the extend section to preserve default animations while adding new ones.

```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    }
  }
}
```

--------------------------------

### Apply row-span at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/grid-row

Use breakpoint variant modifiers to apply different row-span values at specific screen sizes. This example applies row-span-3 by default and row-span-4 at medium screen sizes and above using the md: modifier.

```html
<div class="row-span-3 md:row-span-4">
  <!-- ... -->
</div>
```

--------------------------------

### Configure Tailwind CSS Global Color Palette

Source: https://v3.tailwindcss.com/docs/theme

This example shows how to customize the global color palette using the `colors` key in `tailwind.config.js`. It defines custom colors, including a nested gray scale, which can then be used by various color-related core plugins like `backgroundColor`, `borderColor`, and `textColor`.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors: {
      transparent: 'transparent',
      black: '#000',
      white: '#fff',
      gray: {
        100: '#f7fafc',
        // ...
        900: '#1a202c'
      }
    }
  }
}
```

--------------------------------

### Incorrect Dynamic Tailwind Class Generation in HTML

Source: https://v3.tailwindcss.com/docs/content-configuration

This HTML example demonstrates an incorrect method for generating dynamic Tailwind CSS classes using string interpolation. Tailwind will fail to detect the partial class names ('text-red-600' or 'text-green-600'), resulting in missing styles.

```html
<div class="text-{{ error ? 'red' : 'green' }}-600"></div>
```

--------------------------------

### Configure Phoenix deployment script for assets

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Modifies the `aliases` function in `mix.exs` to include `tailwind default --minify` as part of the `assets.deploy` alias. This ensures that Tailwind CSS is automatically built and minified during the deployment process, optimizing asset delivery for production.

```elixir
defp aliases do
  [
    setup: ["deps.get", "ecto.setup"],
    "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
    "ecto.reset": ["ecto.drop", "ecto.setup"],
    test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
    "assets.deploy": ["tailwind default --minify", "esbuild default --minify", "phx.digest"]
  ]
end
```

--------------------------------

### Responsive Animation with Media Query Breakpoints

Source: https://v3.tailwindcss.com/docs/animation

Demonstrates applying animations conditionally at specific responsive breakpoints using variant modifiers like md:animate-spin. The animation activates only at medium screen sizes and above.

```html
<div class="md:animate-spin">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS place-self-start Grid Alignment

Source: https://v3.tailwindcss.com/docs/place-self

Align a grid item to the start on both axes using the place-self-start utility class. Positions the element at the beginning of both row and column tracks.

```html
<div class="grid grid-cols-3 gap-4 ...">
  <div>01</div>
  <div class="place-self-start ...">02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>
```

--------------------------------

### Tailwind CSS Animation Utilities Reference

Source: https://v3.tailwindcss.com/docs/animation

Complete reference table of built-in Tailwind CSS animation utilities with their corresponding CSS properties and keyframe definitions. Includes animate-none, animate-spin, animate-ping, animate-pulse, and animate-bounce.

```css
/* animate-none */
animation: none;

/* animate-spin */
animation: spin 1s linear infinite;
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* animate-ping */
animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}

/* animate-pulse */
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

/* animate-bounce */
animation: bounce 1s infinite;
@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}
```

--------------------------------

### Import Global CSS in Nuxt Config

Source: https://v3.tailwindcss.com/docs/guides/nuxtjs

Add the main.css file to the css array in nuxt.config.js to globally import Tailwind styles across the entire application.

```javascript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
})
```

--------------------------------

### Configure Tailwind CSS Nesting with PostCSS (Default)

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

This configuration adds the bundled `tailwindcss/nesting` plugin to your PostCSS setup, enabling Sass-like nesting syntax. It should be placed before `tailwindcss` in the plugins list to ensure proper processing.

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

--------------------------------

### Specific Content Patterns for Better Performance

Source: https://v3.tailwindcss.com/docs/content-configuration

Use specific glob patterns to avoid scanning unnecessary files like node_modules. Include root-level files independently and be explicit with directory paths. This improves build performance and prevents false positives in CSS generation.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{html,js}',
    './pages/**/*.{html,js}',
    './index.html',
  ],
  // ...
}
```

--------------------------------

### Tailwind CSS Content Configuration Causing Infinite Rebuilds

Source: https://v3.tailwindcss.com/docs/content-configuration

This `tailwind.config.js` example demonstrates a broad content glob (`./src/**/*.{html,js}`) that can lead to infinite rebuild loops in some build tools (like webpack). If the CSS output is written into a watched directory (`src`), any CSS change triggers a rebuild, creating an endless cycle.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // With some build tools, your CSS will rebuild
    // any time *any* file in `src` changes.
    './src/**/*.{html,js}',
  ],
  // ...
}
```

--------------------------------

### Implementing Container Queries with Tailwind CSS Plugin in HTML

Source: https://v3.tailwindcss.com/docs/plugins

This example demonstrates the `@tailwindcss/container-queries` plugin, allowing elements to be styled based on a parent container's dimensions instead of the viewport. It shows how to mark a container with `@container` and use variants like `@lg:` for responsive styling.

```html
<div class="@container">
  <div class="@lg:text-sky-400">
    <!-- ... -->
  </div>
</div>
```

--------------------------------

### Extending Tailwind CSS with custom styles using the plugin system

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

This `tailwind.config.js` example demonstrates how to create a Tailwind CSS plugin to programmatically add custom base styles, components, and utilities. The `plugin` function provides helper methods like `addBase` for global styles, `addComponents` for reusable class sets, and `addUtilities` for single-purpose utility classes, along with access to the `theme` object for consistent values.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  // ...
  plugins: [
    plugin(function ({ addBase, addComponents, addUtilities, theme }) {
      addBase({
        'h1': {
          fontSize: theme('fontSize.2xl'),
        },
        'h2': {
          fontSize: theme('fontSize.xl'),
        },
      })
      addComponents({
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.xl'),
        }
      })
      addUtilities({
        '.content-auto': {
          contentVisibility: 'auto',
        }
      })
    })
  ]
}
```

--------------------------------

### Customize gridRowEnd utilities in Tailwind theme

Source: https://v3.tailwindcss.com/docs/grid-row

Extend the gridRowEnd section of your Tailwind theme to add custom row-end utilities. This example adds utilities for row end positions 8 through 13, enabling row-end-8, row-end-9, etc. classes in your HTML markup.

```javascript
module.exports = {
  theme: {
    extend: {
      gridRowEnd: {
        '8': '8',
        '9': '9',
        '10': '10',
        '11': '11',
        '12': '12',
        '13': '13',
      }
    }
  }
}
```

--------------------------------

### Configure Tailwind CSS Template Paths

Source: https://v3.tailwindcss.com/docs/guides/ruby-on-rails

This configuration snippet for `tailwind.config.js` specifies the file paths that Tailwind CSS should scan for utility classes. It ensures that styles are generated correctly for HTML, Ruby helpers, JavaScript, and Rails views.

```JavaScript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/*.html',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/views/**/*',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Align items to start with Tailwind CSS items-start

Source: https://v3.tailwindcss.com/docs/align-items

Use the items-start utility class to align flex items to the start of the container's cross axis. Items are positioned at the top of the flex container.

```html
<div class="flex items-start ...">
  <div class="py-4">01</div>
  <div class="py-12">02</div>
  <div class="py-8">03</div>
</div>
```

--------------------------------

### Configure PostCSS in Ember CLI Build

Source: https://v3.tailwindcss.com/docs/guides/emberjs

Set up PostCSS loader in ember-cli-build.js to process CSS files through Tailwind. Configure Webpack rules to handle .css files with PostCSS transformation using the postcss.config.js configuration.

```javascript
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    // Add options here
  });

  const { Webpack } = require('@embroider/webpack');
  return require('@embroider/compat').compatBuild(app, Webpack, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
    packagerOptions: {
      webpackConfig: {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: 'postcss-loader',
                  options: {
                    postcssOptions: {
                      config: 'postcss.config.js',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    },
  });
};
```

--------------------------------

### Configure PostCSS with Tailwind and postcss-import

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Set up PostCSS configuration file to include postcss-import as the first plugin, followed by Tailwind CSS and Autoprefixer. The order is critical as postcss-import must process imports before other plugins.

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

--------------------------------

### Apply Responsive Widths with Tailwind CSS Breakpoints

Source: https://v3.tailwindcss.com/docs/width

Explains how to use responsive prefixes, such as md:, to apply width utilities only at specific screen sizes and above. For example, md:w-full sets the width to full at medium screens and larger, enabling responsive design patterns.

```html
<div class="w-1/2 md:w-full">
  <!-- ... -->
</div>
```

--------------------------------

### Configure Tailwind CSS content paths in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Updates the `content` array within the `tailwind.config.js` file to include paths to all project template files. This configuration informs Tailwind CSS where to scan for utility classes to ensure all used styles are included in the final CSS output.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './js/**/*.js',
    '../lib/*_web.ex',
    '../lib/*_web/**/*.*ex',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Integrate Tailwind CSS CLI for Separate Compilation in npm Scripts

Source: https://v3.tailwindcss.com/docs/content-configuration

This `package.json` snippet illustrates how to integrate the Tailwind CSS CLI for separate compilation, particularly useful when existing build tools struggle with PostCSS dependency messages or exhibit general misbehavior. Using `concurrently` or `npm-run-all`, development and build scripts can run Tailwind CLI alongside other processes, ensuring proper CSS generation.

```json
{
  // ...
  "scripts": {
    "start": "concurrently \"npm run start:css\" \"react-scripts start\"",
    "start:css": "tailwindcss -o src/tailwind.css --watch",
    "build": "npm run build:css && react-scripts build",
    "build:css": "NODE_ENV=production tailwindcss -o src/tailwind.css -m"
  }
}
```

--------------------------------

### Define Custom Keyframes in Tailwind Theme Configuration

Source: https://v3.tailwindcss.com/docs/animation

Creates custom CSS keyframes in the Tailwind theme configuration. This example defines a 'wiggle' animation that rotates an element between -3 and 3 degrees. Custom keyframes must be defined in the keyframes section before they can be referenced in the animation utilities.

```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    }
  }
}
```

--------------------------------

### Spanning Multiple Rows with row-span Utility

Source: https://v3.tailwindcss.com/docs/grid-row

Use row-span-* utilities to make an element span multiple rows in a CSS Grid layout. This example demonstrates a 3-row grid with elements spanning different numbers of rows using row-span-3, row-span-2, and col-span utilities.

```html
<div class="grid grid-rows-3 grid-flow-col gap-4">
  <div class="row-span-3 ...">01</div>
  <div class="col-span-2 ...">02</div>
  <div class="row-span-2 col-span-2 ...">03</div>
</div>
```

--------------------------------

### Combine Extending and Overriding Tailwind CSS Theme Options

Source: https://v3.tailwindcss.com/docs/theme

Demonstrates the flexibility of Tailwind CSS configuration by showing how to simultaneously override certain default theme options (like `opacity`) and extend others (like `screens`) within the same `tailwind.config.js` file. This allows for precise control over the generated utility classes.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    opacity: {
      '0': '0',
      '20': '0.2',
      '40': '0.4',
      '60': '0.6',
      '80': '0.8',
      '100': '1'
    },
    extend: {
      screens: {
        '3xl': '1600px'
      }
    }
  }
}
```

--------------------------------

### Configure Tailwind template paths

Source: https://v3.tailwindcss.com/docs/guides/nextjs

Define content paths in tailwind.config.js to specify which files Tailwind should scan for utility class usage. The configuration includes app, pages, components directories and src directory as alternatives, enabling Tailwind to purge unused styles in production builds.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Configure Template Paths in Tailwind Config

Source: https://v3.tailwindcss.com/docs/guides/nuxtjs

Define content paths in tailwind.config.js to specify which template files Tailwind should scan for utility class usage. This optimizes the final CSS output by including only used classes.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Configure Tailwind Template Paths in TypeScript

Source: https://v3.tailwindcss.com/docs/guides/remix

Define content paths in tailwind.config.ts to scan template files for utility class usage. This configuration tells Tailwind which files to analyze for class names to include in the final CSS output.

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

--------------------------------

### Include HTML Entry Point in Tailwind Config

Source: https://v3.tailwindcss.com/docs/content-configuration

When using frameworks that place the main HTML entry point in a different location (e.g., public/index.html), explicitly include it in the content configuration. This ensures Tailwind scans the entry point for class names if you add Tailwind styles there.

```javascript
module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{html,js}',
  ],
  // ...
}
```

--------------------------------

### Configure Tailwind Content Paths

Source: https://v3.tailwindcss.com/docs/guides/meteor

Define template file paths in tailwind.config.js so Tailwind can scan and purge unused styles. Includes paths for imports/ui and client HTML files in a Meteor project structure.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./imports/ui/**/*.{js,jsx,ts,tsx}",
    "./client/*.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Configure SvelteKit to Process PostCSS in Style Blocks

Source: https://v3.tailwindcss.com/docs/guides/sveltekit

Modifies `svelte.config.js` to import `vitePreprocess` from `@sveltejs/vite-plugin-svelte` and enables it for preprocessing. This configuration allows SvelteKit to correctly process PostCSS directives within `<style>` blocks in `.svelte` components.

```javascript
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter()
  },
  preprocess: vitePreprocess()
};
export default config;
```

--------------------------------

### Configure Tailwind content paths

Source: https://v3.tailwindcss.com/docs/guides/rspack

Define template file paths in tailwind.config.js so Tailwind can scan and extract class names. Includes JavaScript, TypeScript, JSX, and TSX files from the src directory.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Apply Element Contrast with Tailwind CSS HTML Classes

Source: https://v3.tailwindcss.com/docs/contrast

This HTML example demonstrates how to apply various `contrast-*` utility classes directly to `div` elements to control their visual contrast. Each class adjusts the element's contrast level, providing different visual effects. Ensure Tailwind CSS is properly configured and included in your project for these classes to function.

```html
<div class="contrast-50 ...">
  <!-- ... -->
</div>
<div class="contrast-100 ...">
  <!-- ... -->
</div>
<div class="contrast-125 ...">
  <!-- ... -->
</div>
<div class="contrast-200 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Import Tailwind CSS in Remix Root Component

Source: https://v3.tailwindcss.com/docs/guides/remix

Import the compiled Tailwind stylesheet in the root.tsx file using Remix's links function. This ensures the Tailwind styles are loaded globally across the entire application by adding a stylesheet link to the document head.

```typescript
import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];
```

--------------------------------

### Resolve Content Paths in Monorepo with require.resolve

Source: https://v3.tailwindcss.com/docs/content-configuration

Use require.resolve() to properly resolve content file paths in monorepo workspaces, ensuring Tailwind can locate component files across workspace boundaries. This prevents path resolution issues when components are in separate packages.

```javascript
const path = require('path');

module.exports = {
  content: [
    './components/**/*.{html,js}',
    './pages/**/*.{html,js}',
    path.join(path.dirname(require.resolve('@my-company/tailwind-components')), '**/*.js'),
  ],
  // ...
}
```

--------------------------------

### Configure PostCSS Plugins in Nuxt

Source: https://v3.tailwindcss.com/docs/guides/nuxtjs

Add tailwindcss and autoprefixer to the PostCSS plugins configuration in nuxt.config.js. This enables Tailwind CSS processing during the build pipeline.

```javascript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
})
```

--------------------------------

### Use Regular Expressions for Pattern-Based Safelisting

Source: https://v3.tailwindcss.com/docs/content-configuration

Define pattern-based safelisting rules using regular expressions to generate multiple related Tailwind classes matching a pattern. Patterns match base utility names only and cannot include variant modifiers.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js}',
    './components/**/*.{html,js}',
  ],
  safelist: [
    'text-2xl',
    'text-3xl',
    {
      pattern: /bg-(red|green|blue)-(100|200|300)/,
    },
  ],
  // ...
}
```

--------------------------------

### Spanning Columns with col-span Utilities in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/grid-column

Demonstrates how to use col-span-* utilities to make grid elements span multiple columns. The example shows a 3-column grid where some items span 2 columns using the col-span-2 class. This is useful for creating varied layouts within a grid container.

```html
<div class="grid grid-cols-3 gap-4">
  <div class="...">01</div>
  <div class="...">02</div>
  <div class="...">03</div>
  <div class="col-span-2 ...">04</div>
  <div class="...">05</div>
  <div class="...">06</div>
  <div class="col-span-2 ...">07</div>
</div>
```

--------------------------------

### Justify Items Start - Tailwind CSS Grid

Source: https://v3.tailwindcss.com/docs/justify-items

Aligns grid items to the start of their inline axis using the justify-items-start class. This utility applies the CSS property justify-items: start to grid containers, pushing all child items to the left side of their grid cells.

```html
<div class="grid justify-items-start ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>
```

--------------------------------

### Define and Use Native CSS Variables

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

This CSS example demonstrates how to declare custom properties (CSS variables) in the `:root` pseudo-class and then use them throughout your stylesheets with the `var()` function. Native CSS variables have excellent browser support and eliminate the need for preprocessor-specific variables.

```css
:root {
  --theme-color: #52b3d0;
}

/* ... */

.btn {
  background-color: var(--theme-color);
  /* ... */
}
```

--------------------------------

### Applying Focus Rings with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/ring-width

This example shows how to create custom focus rings using Tailwind CSS by prepending the `focus:` variant to `ring-*` utilities. This ensures the ring appears only when the element is in focus, enhancing accessibility and user interaction feedback.

```html
<button class="... focus:ring-2">Save Changes</button>
```

--------------------------------

### Configure Font Feature and Variation Settings

Source: https://v3.tailwindcss.com/docs/font-family

Advanced configuration example for providing default font-feature-settings and font-variation-settings to custom fonts using tuple format in tailwind.config.js, enabling fine-grained font control.

```javascript
module.exports = {
  theme: {
    fontFamily: {
      sans: [
        '"Inter var", sans-serif',
        {
          fontFeatureSettings: '"cv11", "ss01"',
          fontVariationSettings: '"opsz" 32'
        },
      ],
    },
  },
}
```

--------------------------------

### Generate Minimal `tailwind.config.js` using Tailwind CLI

Source: https://v3.tailwindcss.com/docs/configuration

This command initializes a basic `tailwind.config.js` file at the root of your project. It's the standard way to set up Tailwind CSS for customization, providing a minimal structure that can be extended as needed.

```bash
npx tailwindcss init
```

--------------------------------

### Tailwind CSS Place Content Responsive Breakpoint

Source: https://v3.tailwindcss.com/docs/place-content

Applies place-content-center utility at medium breakpoint and above using the md: responsive modifier. Changes grid alignment from start to center on medium-sized screens and larger. Enables responsive grid layout adjustments.

```html
<div class="grid place-content-start md:place-content-center">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Transitions Conditionally at Specific Breakpoints in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/transition-property

This example illustrates applying the `transition-all` utility only at medium screen sizes and above using the `md:` responsive variant modifier, enabling media query-based conditional transitions.

```html
<div class="md:transition-all">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS align-self start utility

Source: https://v3.tailwindcss.com/docs/align-self

Use the self-start class to align a flex item to the start of the container's cross axis, overriding the container's align-items value. This forces the item to align at the beginning regardless of parent alignment settings.

```html
<div class="flex items-stretch ...">
  <div>01</div>
  <div class="self-start ...">02</div>
  <div>03</div>
</div>
```

--------------------------------

### Align Grid Item to Start with Tailwind CSS justify-self-start

Source: https://v3.tailwindcss.com/docs/justify-self

Applies `justify-self-start` to align a grid item to the beginning of its inline axis. This positions the item at the start of its grid area, regardless of the container's `justify-items`.

```html
<div class="grid justify-items-stretch ...">
  <!-- ... -->
  <div class="justify-self-start ...">02</div>
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
</div>
```

--------------------------------

### Sort Dynamic Variant CSS Output with sort Option

Source: https://v3.tailwindcss.com/docs/plugins

Demonstrates using the sort option in matchVariant to control CSS source order and avoid precedence issues. Example sorts min-width media queries numerically by parsing the value.

```javascript
matchVariant("min", (value) => `@media (min-width: ${value})`, {
  sort(a, z) {
    return parseInt(a.value) - parseInt(z.value);
  },
});
```

--------------------------------

### HTML - Responsive Flex Grow with Breakpoint Variant

Source: https://v3.tailwindcss.com/docs/flex-grow

Shows how to apply the `grow-0` utility conditionally at medium screen sizes and above using the `md:` responsive breakpoint variant. Adapts layout behavior based on screen width.

```html
<div class="grow md:grow-0">
  <!-- ... -->
</div>
```

--------------------------------

### Position Elements with row-start and row-end

Source: https://v3.tailwindcss.com/docs/grid-row

Use row-start-* and row-end-* utilities to define exact grid line positions for elements. CSS grid lines start at 1, so a full-height element in a 3-row grid starts at line 1 and ends at line 4. These can be combined with row-span utilities.

```html
<div class="grid grid-rows-3 grid-flow-col gap-4">
  <div class="row-start-2 row-span-2 ...">01</div>
  <div class="row-end-3 row-span-2 ...">02</div>
  <div class="row-start-1 row-end-4 ...">03</div>
</div>
```

--------------------------------

### Customize gridRow utilities in Tailwind theme

Source: https://v3.tailwindcss.com/docs/grid-row

Extend the gridRow section of your Tailwind theme configuration to add custom row span utilities. This example adds a 'span-16' utility that creates a grid row spanning 16 rows. The span keyword must be included in the value name as it's not automatically added to the class name.

```javascript
module.exports = {
  theme: {
    extend: {
      gridRow: {
        'span-16': 'span 16 / span 16',
      }
    }
  }
}
```

--------------------------------

### Create Block Formatting Contexts with Tailwind CSS `flow-root`

Source: https://v3.tailwindcss.com/docs/display

This HTML example illustrates the use of the Tailwind CSS `flow-root` utility. It creates a block-level element that establishes its own block formatting context, useful for containing floats or preventing margin collapse issues.

```html
<div class="p-4">
  <div class="flow-root ...">
    <div class="my-4 ...">Well, let me tell you something, ...</div>
  </div>
  <div class="flow-root ...">
    <div class="my-4 ...">Sure, go ahead, laugh if you want...</div>
  </div>
</div>
```

--------------------------------

### Build Responsive Layouts with Tailwind CSS Flexbox

Source: https://v3.tailwindcss.com/docs/responsive-design

This complex example shows a marketing page component that uses a stacked layout on small screens and a side-by-side flex layout on medium screens and larger. It utilizes utilities like md:flex, md:shrink-0, and responsive sizing to adapt the component's appearance based on the breakpoint.

```html
<div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
  <div class="md:flex">
    <div class="md:shrink-0">
      <img class="h-48 w-full object-cover md:h-full md:w-48" src="/img/building.jpg" alt="Modern building architecture">
    </div>
    <div class="p-8">
      <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Company retreats</div>
      <a href="#" class="block mt-1 text-lg leading-tight font-medium text-black hover:underline">Incredible accommodation for your team</a>
      <p class="mt-2 text-slate-500">Looking to take your team away on a retreat to enjoy awesome food and take in some sunshine? We have a list of places to do just that.</p>
    </div>
  </div>
</div>
```

--------------------------------

### Configure PostCSS loader in Rspack

Source: https://v3.tailwindcss.com/docs/guides/rspack

Enable PostCSS support in rspack.config.js by adding a CSS module rule that uses the postcss-loader. This processes CSS files through PostCSS before bundling.

```javascript
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["postcss-loader"],
        type: "css",
      },
    ]
  }
  // ...
```

--------------------------------

### Update content paths for new project directories

Source: https://v3.tailwindcss.com/docs/content-configuration

Add new directories to the content configuration when creating folders mid-project to ensure Tailwind scans them for class names. Forgetting to update the configuration is a common cause of missing generated classes.

```javascript
module.exports = {
  content: [
    './pages/**/*.{html,js}',
    './components/**/*.{html,js}',
    './util/**/*.{html,js}'
  ],
  // ...
}
```

--------------------------------

### Extend Tailwind CSS `gridColumnStart` to add custom start positions

Source: https://v3.tailwindcss.com/docs/grid-column

This configuration snippet shows how to extend the `gridColumnStart` section of your Tailwind CSS theme in `tailwind.config.js`. It adds new `col-start-*` utilities for positions 13 through 17, expanding the default grid column start options.

```javascript
module.exports = {
  theme: {
    extend: {
      gridColumnStart: {
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17'
      }
    }
  }
}
```

--------------------------------

### Configure Tailwind Template Paths in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/guides/laravel

Define content paths for Tailwind CSS to scan and purge unused styles. This configuration specifies all Blade templates, JavaScript, and Vue files in the resources directory.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.vue",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Use Arbitrary Contrast Values with Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/contrast

This HTML example demonstrates using Tailwind CSS's arbitrary value support to apply a custom contrast value (`.25`) directly in a utility class. The `contrast-[.25]` syntax allows for one-off contrast adjustments without modifying the `tailwind.config.js` file. This feature is useful for unique styling requirements that don't warrant a theme addition.

```html
<div class="contrast-[.25]">
  <!-- ... -->
</div>
```

--------------------------------

### Configure Tailwind Template Paths

Source: https://v3.tailwindcss.com/docs/guides/emberjs

Define content paths in tailwind.config.js to scan for Tailwind class names across all template and script files. Includes Ember template formats (.gjs, .gts, .hbs) and standard web files.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{gjs,gts,hbs,html,js,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

--------------------------------

### Apply responsive Tailwind CSS `order` at specific breakpoints

Source: https://v3.tailwindcss.com/docs/order

This example demonstrates how to apply `order` utilities responsively using breakpoint modifiers. By adding a prefix like `md:order-last`, the `order-last` utility will only take effect on medium screens and larger, enabling different layouts for various screen sizes. This is crucial for responsive web design.

```html
<div class="order-first md:order-last">
  <!-- ... -->
</div>
```

--------------------------------

### Define Tailwind CSS Theme with Custom Screens, Colors, and Fonts

Source: https://v3.tailwindcss.com/docs/theme

This configuration demonstrates how to define a custom theme in `tailwind.config.js`. It includes custom responsive breakpoints (`screens`), a color palette, font families, and extends existing spacing and border-radius utilities. This file serves as the primary entry point for customizing Tailwind's default theme.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    colors: {
      'blue': '#1fb6ff',
      'purple': '#7e5bef',
      'pink': '#ff49db',
      'orange': '#ff7849',
      'green': '#13ce66',
      'yellow': '#ffc82c',
      'gray-dark': '#273444',
      'gray': '#8492a6',
      'gray-light': '#d3dce6',
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  }
}
```

--------------------------------

### Inject Preflight Base Styles with @tailwind Directive

Source: https://v3.tailwindcss.com/docs/preflight

Demonstrates how to inject Tailwind CSS Preflight base styles automatically into your project. The @tailwind base directive triggers automatic inclusion of Preflight styles, followed by component and utility layers. This is the standard setup for initializing Tailwind CSS in any project.

```css
@tailwind base; /* Preflight will be injected here */

@tailwind components;

@tailwind utilities;
```

--------------------------------

### CSS Vendor Prefix for Background Clip

Source: https://v3.tailwindcss.com/docs/browser-support

Demonstrates the CSS syntax for applying vendor prefixes to the background-clip property, which requires the -webkit prefix for cross-browser compatibility. This shows the manual approach to vendor prefixing before tools like Autoprefixer process it.

```css
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
```

--------------------------------

### Tailwind CSS content-between Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Distributes grid rows with equal space between each row using the content-between utility class. Equivalent to CSS align-content: space-between property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-between ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Default Structure of a Minimal `tailwind.config.js`

Source: https://v3.tailwindcss.com/docs/configuration

This JavaScript code block shows the default content of a newly generated `tailwind.config.js` file. It includes placeholder sections for `content`, `theme.extend`, and `plugins`, serving as a starting point for configuration.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Import CSS File in Ember Application

Source: https://v3.tailwindcss.com/docs/guides/emberjs

Import the generated app.css file in the main app.js file to load Tailwind styles into the Ember application. This ensures styles are available throughout the application lifecycle.

```javascript
import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'my-project/config/environment';
import 'my-project/app.css';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
```

--------------------------------

### Basic Flex Shrink with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/flex-shrink

Demonstrates how to use the `shrink` class to allow a flex item to shrink when needed. This creates a flexible layout where one item can compress to accommodate others. The example shows three flex items where the middle one shrinks.

```html
<div class="flex ...">
  <div class="flex-none w-14 h-14 ...">
    01
  </div>
  <div class="shrink w-64 h-14 ...">
    02
  </div>
  <div class="flex-none w-14 h-14 ...">
    03
  </div>
</div>
```

--------------------------------

### Register static utilities with addUtilities

Source: https://v3.tailwindcss.com/docs/plugins

Creates simple static utility classes that don't accept user-provided values. The example registers content-visibility utilities (.content-auto, .content-hidden, .content-visible) using the addUtilities function in a Tailwind plugin configuration.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.content-auto': {
          'content-visibility': 'auto',
        },
        '.content-hidden': {
          'content-visibility': 'hidden',
        },
        '.content-visible': {
          'content-visibility': 'visible',
        },
      })
    })
  ]
}
```

--------------------------------

### Create Inline Grid Containers with Tailwind CSS `inline-grid`

Source: https://v3.tailwindcss.com/docs/display

This HTML example demonstrates the Tailwind CSS `inline-grid` utility. It creates an inline-level grid container that flows with text, allowing for grid-based layouts within a line of text or other inline content.

```html
<span class="inline-grid grid-cols-3 gap-4">
  <span>01</span>
  <span>02</span>
  <span>03</span>
  <span>04</span>
  <span>05</span>
  <span>06</span>
</span>
<span class="inline-grid grid-cols-3 gap-4">
  <span>01</span>
  <span>02</span>
  <span>03</span>
  <span>04</span>
  <span>05</span>
  <span>06</span>
</span>
```

--------------------------------

### Tailwind CSS Responsive Align Content with Media Queries

Source: https://v3.tailwindcss.com/docs/align-content

Applies content-around alignment only at medium screen sizes and above using the md: responsive breakpoint modifier. Default state uses content-start, changing to content-around on medium and larger screens. Supports all breakpoints and media query modifiers.

```html
<div class="grid content-start md:content-around">
  <!-- ... -->
</div>
```

--------------------------------

### Motion-Safe Animation for Accessibility

Source: https://v3.tailwindcss.com/docs/animation

Demonstrates conditional animation application using the motion-safe variant to respect user preferences for reduced motion. The animation only applies when the user has not specified a motion preference.

```html
<button type="button" class="bg-indigo-600 ..." disabled>
  <svg class="motion-safe:animate-spin h-5 w-5 mr-3 ..." viewBox="0 0 24 24">
    <!-- ... -->
  </svg>
  Processing
</button>
```

--------------------------------

### Example Output of `!important` Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/configuration

This CSS output shows how Tailwind CSS utility classes are generated with the `!important` flag when the `important` option is set to `true`. It illustrates several `leading-*` utilities with `!important` applied.

```css
.leading-none {
  line-height: 1 !important;
}
.leading-tight {
  line-height: 1.25 !important;
}
.leading-snug {
  line-height: 1.375 !important;
}
/* etc. */
```

--------------------------------

### Tailwind CSS place-self Responsive Breakpoint Modifier

Source: https://v3.tailwindcss.com/docs/place-self

Apply place-self utilities conditionally at specific breakpoints using media query variant modifiers. The example applies place-self-start by default and switches to place-self-end at medium screen sizes and above.

```html
<div class="place-self-start md:place-self-end">
  <!-- ... -->
</div>
```

--------------------------------

### Correctly Target Mobile Screens with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/responsive-design

This example demonstrates the correct mobile-first approach in Tailwind CSS for responsive styling. Unprefixed utilities, such as `text-center`, apply to all screen sizes by default, and can then be overridden for larger breakpoints (e.g., `sm:text-left`) to adjust alignment.

```html
<!-- This will center text on mobile, and left align it on screens 640px and wider -->
<div class="text-center sm:text-left"></div>
```

--------------------------------

### Set Inline Start Scroll Padding (scroll-ps-XX) in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/scroll-padding

This utility class sets the `scroll-padding-inline-start` CSS property, defining the padding at the start edge of the inline dimension. Its behavior respects the current writing mode and text direction (e.g., left in LTR, right in RTL).

```css
scroll-padding-inline-start: 11rem; /* 176px */
```

--------------------------------

### Configure Raw Content Scanning in Tailwind

Source: https://v3.tailwindcss.com/docs/content-configuration

Scan raw HTML content strings instead of files by using an object with a raw key and extension property in the content configuration. This approach is useful for dynamic content but should only be used when file scanning is impossible.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js}',
    './components/**/*.{html,js}',
    { raw: '<div class="font-bold">', extension: 'html' },
  ],
  // ...
}
```

--------------------------------

### Implement Responsive Tailwind CSS Container

Source: https://v3.tailwindcss.com/docs/container

Illustrates using responsive variants like `md:container` and `md:mx-auto` to make an element behave as a container only from a specific breakpoint upwards. This allows for fluid layout on smaller screens and contained layout on larger screens.

```html
<!-- Full-width fluid until the `md` breakpoint, then lock to container -->
<div class="md:container md:mx-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS caret color for different screen sizes

Source: https://v3.tailwindcss.com/docs/caret-color

Shows how to apply different caret colors based on responsive breakpoints. The example sets `caret-blue-500` by default and `md:caret-indigo-500` for medium screen sizes and above.

```html
<textarea class="caret-blue-500 md:caret-indigo-500"></textarea>
```

--------------------------------

### Responsive Snap Utility with Breakpoint Variant

Source: https://v3.tailwindcss.com/docs/scroll-snap-align

Demonstrates applying snap utilities conditionally based on screen size using Tailwind's breakpoint variant modifiers. The snap-center class is applied by default, but changes to snap-start at medium screen sizes and above (md breakpoint).

```html
<div class="snap-center md:snap-start">
  <!-- ... -->
</div>
```

--------------------------------

### Responsive Overflow with Breakpoint Modifier

Source: https://v3.tailwindcss.com/docs/overflow

Use responsive variant modifiers like md: to apply overflow utilities at specific breakpoints. This example applies overflow-scroll only at medium screen sizes and above.

```html
<div class="overflow-auto md:overflow-scroll">
  <!-- ... -->
</div>
```

--------------------------------

### Using Logical Properties with Clear Utilities in HTML

Source: https://v3.tailwindcss.com/docs/clear

Demonstrates applying clear-start and clear-end logical properties alongside float utilities in a right-to-left (RTL) article context. These properties automatically map to the appropriate side (left or right) based on text direction, providing better internationalization support.

```html
<article dir="rtl">
  <img class="float-start ..." src="path/to/image.jpg">
  <img class="float-end ..." src="path/to/image.jpg">
  <p class="clear-end ...">...ربما يمكننا العيش بدون مكتبات،</p>
</article>
```

--------------------------------

### Build Responsive User Card Component with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/utility-first

A fully responsive user profile card component built entirely with Tailwind CSS utility classes. Features responsive layout adjustments using sm: breakpoints, hover and focus states for the message button, and shadow effects. The component demonstrates how utility classes handle responsive design and interactive states that cannot be achieved with inline styles alone.

```html
<div class="py-8 px-8 max-w-sm mx-auto space-y-2 bg-white rounded-xl shadow-lg sm:py-4 sm:flex sm:items-center sm:space-y-0 sm:gap-x-6">
  <img class="block mx-auto h-24 rounded-full sm:mx-0 sm:shrink-0" src="/img/erin-lindford.jpg" alt="Woman's Face" />
  <div class="text-center space-y-2 sm:text-left">
    <div class="space-y-0.5">
      <p class="text-lg text-black font-semibold">
        Erin Lindford
      </p>
      <p class="text-slate-500 font-medium">
        Product Engineer
      </p>
    </div>
    <button class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">Message</button>
  </div>
</div>
```

--------------------------------

### Apply Backdrop Invert at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/backdrop-invert

Use the md: variant modifier to apply backdrop-invert utilities at specific breakpoints. This example applies backdrop-invert-0 at medium screen sizes and above, while using backdrop-invert on smaller screens.

```html
<div class="backdrop-invert md:backdrop-invert-0">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Tailwind CSS Spacing Scale

Source: https://v3.tailwindcss.com/docs/theme

This configuration demonstrates how to define a custom spacing and sizing scale for your project using the `spacing` key in `tailwind.config.js`. These custom values are inherited by a wide range of utility classes, including `padding`, `margin`, `width`, `height`, and more, providing consistent sizing across the design system.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    spacing: {
      px: '1px',
      0: '0',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      3.5: '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem'
    }
  }
}
```

--------------------------------

### Styling Form Elements with Tailwind CSS Forms Plugin in HTML

Source: https://v3.tailwindcss.com/docs/plugins

This example demonstrates how the `@tailwindcss/forms` plugin simplifies styling native form elements. It shows how standard Tailwind utility classes can be applied to a `select` element for padding and an `input type="checkbox"` for color customization.

```html
<!-- You can actually customize padding on a select element: -->
<select class="px-4 py-3 rounded-full">
  <!-- ... -->
</select>

<!-- Or change a checkbox color using text color utilities: -->
<input type="checkbox" class="rounded text-pink-500" />
```

--------------------------------

### Disable Core Plugins Using corePlugins Configuration

Source: https://v3.tailwindcss.com/docs/theme

Disable core plugins by setting them to false in the corePlugins configuration rather than providing an empty object in the theme configuration. This approach is more consistent and is the required method for plugins that expose no configuration options.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    opacity: false,
  }
}
```

--------------------------------

### Configure Tailwind Content Scanning for Reusable Components

Source: https://v3.tailwindcss.com/docs/content-configuration

Configure Tailwind to scan custom component libraries imported across multiple projects by adding their paths to the content configuration. This ensures Tailwind generates all necessary CSS for imported third-party components.

```javascript
module.exports = {
  content: [
    './components/**/*.{html,js}',
    './pages/**/*.{html,js}',
    './node_modules/@my-company/tailwind-components/**/*.js',
  ],
  // ...
}
```

--------------------------------

### Manage Dark Mode with localStorage and System Preference - JavaScript

Source: https://v3.tailwindcss.com/docs/dark-mode

Implements theme management that supports both manual selection and system preference detection. This script reads the theme from `localStorage`, falls back to system preference using `window.matchMedia()`, and applies the `dark` class to the root element. It handles three states: explicit light mode, explicit dark mode, and respecting OS preference. Best placed inline in the document `head` to prevent flash of unstyled content (FOUC).

```javascript
// On page load or when changing themes, best to add inline in `head` to avoid FOUC
document.documentElement.classList.toggle(
  'dark',
  localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
)

// Whenever the user explicitly chooses light mode
localStorage.theme = 'light'

// Whenever the user explicitly chooses dark mode
localStorage.theme = 'dark'

// Whenever the user explicitly chooses to respect the OS preference
localStorage.removeItem('theme')
```

--------------------------------

### Configure Content Sources in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Replace the `purge` option with `content` to specify template paths for content scanning. Since Tailwind v3.0 no longer uses PurgeCSS, this renamed option better reflects its purpose. Configuring content sources is crucial or compiled CSS will be empty.

```javascript
module.exports = {
  content: [
    './public/**/*.html',
    './src/**/*.{js,jsx,ts,tsx,vue}'
  ],
  theme: {
    // ...
  }
}
```

--------------------------------

### Conditionally Enable cssnano for PostCSS Minification

Source: https://v3.tailwindcss.com/docs/optimizing-for-production

This JavaScript configuration for PostCSS illustrates how to integrate `cssnano` to minify CSS, specifically enabling it only in production environments. The `process.env.NODE_ENV === 'production'` check ensures that `cssnano` is added as a PostCSS plugin for optimized production builds.

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
```

--------------------------------

### Hover State Animation Application

Source: https://v3.tailwindcss.com/docs/animation

Shows how to conditionally apply animation utilities using state variant modifiers. The hover:animate-spin class applies the spin animation only when the element is hovered.

```html
<div class="hover:animate-spin">
  <!-- ... -->
</div>
```

--------------------------------

### Incorrect Usage: Tailwind CSS theme() with Sass Functions

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

This example illustrates an incorrect attempt to combine Tailwind's `theme()` function with a preprocessor function like Sass's `darken()`. Preprocessors run *before* Tailwind processes the CSS, meaning `theme()` isn't evaluated at the time Sass runs, leading to an invalid output.

```css
.alert {
  background-color: darken(theme('colors.red.500'), 10%);
}
```

--------------------------------

### Tailwind CSS Stone Gradient From Colors

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

CSS custom properties for stone-colored gradient starting points in Tailwind CSS, spanning from stone-50 to stone-950. Each class defines gradient starting color, ending color with zero opacity, and combined gradient stops for seamless gradient backgrounds.

```css
.from-stone-50 {
  --tw-gradient-from: #fafaf9 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(250 250 249 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-100 {
  --tw-gradient-from: #f5f5f4 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(245 245 244 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-200 {
  --tw-gradient-from: #e7e5e4 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(231 229 228 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-300 {
  --tw-gradient-from: #d6d3d1 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(214 211 209 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-400 {
  --tw-gradient-from: #a8a29e var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(168 162 158 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-500 {
  --tw-gradient-from: #78716c var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(120 113 108 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-600 {
  --tw-gradient-from: #57534e var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(87 83 78 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-700 {
  --tw-gradient-from: #44403c var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(68 64 60 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-800 {
  --tw-gradient-from: #292524 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(41 37 36 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-900 {
  --tw-gradient-from: #1c1917 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(28 25 23 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-stone-950 {
  --tw-gradient-from: #0c0a09 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(12 10 9 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
```

--------------------------------

### Use Arbitrary Tailwind CSS Hue Rotate Values

Source: https://v3.tailwindcss.com/docs/hue-rotate

Apply one-off hue rotation values directly in your HTML using Tailwind CSS arbitrary value syntax. This allows for flexible styling without needing to extend your theme configuration. The example applies a specific `270deg` hue rotation.

```html
<div class="hue-rotate-[270deg]">
  <!-- ... -->
</div>
```

--------------------------------

### Configure Tailwind CSS corePlugins as an object for merging

Source: https://v3.tailwindcss.com/docs/presets

When `corePlugins` is configured as an object, it allows individual plugin settings to be merged across configurations. This example shows how a preset disables the `float` plugin, and the main configuration then merges by disabling the `cursor` plugin, resulting in both being disabled.

```javascript
module.exports = {
  // ...
  corePlugins: {
    float: false,
  },
}
```

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('./my-preset.js'),
  ],
  // This configuration will be merged
  corePlugins: {
    cursor: false
  }
}
```

--------------------------------

### Organize CSS Imports with Separate Entry Point

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Create a main CSS file dedicated to @import statements, keeping actual CSS rules in separate files. This structure adheres to CSS spec requirements that @import statements must appear at the top of files.

```css
/* components.css */
@import "./components/buttons.css";
@import "./components/card.css";
```

```css
/* components/buttons.css */
.btn {
  padding: theme('spacing.4') theme('spacing.2');
  /* ... */
}
```

```css
/* components/card.css */
.card {
  padding: theme('spacing.4');
  /* ... */
}
```

--------------------------------

### Align Flex Items to Start in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/justify-content

This snippet demonstrates how to use the `justify-start` utility class in Tailwind CSS to align flex items at the beginning of the container's main axis. This is useful for grouping items to the left in a row or top in a column.

```html
<div class="flex justify-start ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>
```

--------------------------------

### Apply Tailwind CSS `min-w` utilities for minimum width

Source: https://v3.tailwindcss.com/docs/min-width

This HTML example demonstrates how to apply various `min-w-*` utility classes to `div` elements to control their minimum width. It shows different `min-w` values like `min-w-80`, `min-w-64`, and `min-w-full` within a parent container.

```html
<div class="w-96 ...">
  <div class="min-w-80 ...">min-w-80</div>
  <div class="min-w-64 ...">min-w-64</div>
  <div class="min-w-48 ...">min-w-48</div>
  <div class="min-w-40 ...">min-w-40</div>
  <div class="min-w-32 ...">min-w-32</div>
  <div class="min-w-24 ...">min-w-24</div>
  <div class="min-w-full ...">min-w-full</div>
</div>
```

--------------------------------

### Tailwind CSS Scroll Padding Inline Utilities

Source: https://v3.tailwindcss.com/docs/scroll-padding

Control scroll-padding for inline start and end directions using scroll-ps-* and scroll-pe-* utilities. These classes support logical properties for bidirectional text and layout.

```css
.scroll-ps-12 { scroll-padding-inline-start: 3rem; /* 48px */ }
.scroll-pe-12 { scroll-padding-inline-end: 3rem; /* 48px */ }

.scroll-ps-14 { scroll-padding-inline-start: 3.5rem; /* 56px */ }
.scroll-pe-14 { scroll-padding-inline-end: 3.5rem; /* 56px */ }

.scroll-ps-16 { scroll-padding-inline-start: 4rem; /* 64px */ }
.scroll-pe-16 { scroll-padding-inline-end: 4rem; /* 64px */ }

.scroll-ps-20 { scroll-padding-inline-start: 5rem; /* 80px */ }
.scroll-pe-20 { scroll-padding-inline-end: 5rem; /* 80px */ }

.scroll-ps-24 { scroll-padding-inline-start: 6rem; /* 96px */ }
.scroll-pe-24 { scroll-padding-inline-end: 6rem; /* 96px */ }

.scroll-ps-28 { scroll-padding-inline-start: 7rem; /* 112px */ }
.scroll-pe-28 { scroll-padding-inline-end: 7rem; /* 112px */ }

.scroll-ps-32 { scroll-padding-inline-start: 8rem; /* 128px */ }
.scroll-pe-32 { scroll-padding-inline-end: 8rem; /* 128px */ }

.scroll-ps-36 { scroll-padding-inline-start: 9rem; /* 144px */ }
.scroll-pe-36 { scroll-padding-inline-end: 9rem; /* 144px */ }

.scroll-ps-40 { scroll-padding-inline-start: 10rem; /* 160px */ }
.scroll-pe-40 { scroll-padding-inline-end: 10rem; /* 160px */ }
```

--------------------------------

### Apply flex-1 Utility in Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/flex

This HTML example illustrates the `flex-1` utility class in Tailwind CSS. When applied to a flex item, it allows the item to grow and shrink as needed, effectively ignoring its initial size within the flex container.

```html
<div class="flex">
  <div class="flex-none w-14 ...">
    01
  </div>
  <div class="flex-1 w-64 ...">
    02
  </div>
  <div class="flex-1 w-32 ...">
    03
  </div>
</div>
```

--------------------------------

### Apply Tailwind CSS Background Origin at Specific Breakpoints

Source: https://v3.tailwindcss.com/docs/background-origin

This example demonstrates applying background origin utilities responsively using Tailwind CSS breakpoint modifiers. The `md:bg-origin-padding` class ensures the `bg-origin-padding` style is applied only on medium screen sizes and larger, allowing for adaptive designs.

```html
<div class="bg-origin-border md:bg-origin-padding">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS place-self Hover State Modifier

Source: https://v3.tailwindcss.com/docs/place-self

Apply place-self utilities conditionally on hover using state variant modifiers. The example applies place-self-start by default and switches to place-self-end on hover.

```html
<div class="place-self-start hover:place-self-end">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Responsive will-change with Media Queries

Source: https://v3.tailwindcss.com/docs/will-change

Use responsive breakpoint modifiers to apply will-change utilities at specific screen sizes. This example applies will-change-scroll only at medium screen sizes and above while using will-change-auto on smaller screens.

```HTML
<div class="will-change-auto md:will-change-scroll">
  <!-- ... -->
</div>
```

--------------------------------

### Remove JIT Mode Configuration in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Remove the `mode: 'jit'` property from tailwind.config.js as the new Just-in-Time engine is now the default in Tailwind CSS v3.0. This property is no longer necessary if you were using it in Tailwind CSS v2.x.

```javascript
module.exports = {
  mode: 'jit',
  // ...
}
```

--------------------------------

### Tailwind CSS content-normal Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Packs grid content items in their default position as if no align-content value was set using the content-normal utility class. Equivalent to CSS align-content: normal property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-normal ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### HTML Usage with Negative Prefixed Tailwind CSS Margins

Source: https://v3.tailwindcss.com/docs/configuration

This HTML example demonstrates the usage of a prefixed negative margin utility class, where the dash for negative values appears before the custom `tw-` prefix. This clarifies the structure for negative utility classes when a prefix is enabled.

```html
<div class="-tw-mt-8">
  <!-- -->
</div>
```

--------------------------------

### Extend Tailwind CSS Theme with Custom Responsive Screen Size

Source: https://v3.tailwindcss.com/docs/theme

Shows how to introduce a new custom responsive breakpoint, such as `3xl`, to the Tailwind CSS theme. By adding the screen size definition under `theme.extend.screens` in `tailwind.config.js`, a new variant (`3xl:`) becomes available for applying conditional styles in HTML.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      screens: {
        '3xl': '1600px' // Adds a new `3xl:` screen variant
      }
    }
  }
}
```

```html
<blockquote class="text-base md:text-md 3xl:text-lg">
  Oh I gotta get on that internet, I'm late on everything!
</blockquote>
```

--------------------------------

### Configure Tailwind CSS Content Paths in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/guides/adonisjs

This JavaScript configuration specifies the paths to all template and source files where Tailwind CSS should scan for utility classes. Including paths like `./resources/**/*.edge` and `./resources/**/*.{js,ts,jsx,tsx,vue}` ensures that only used Tailwind classes are bundled into the final CSS, optimizing file size.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.edge",
    "./resources/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: []
}
```

--------------------------------

### Set Flex Basis with Tailwind CSS Utilities

Source: https://v3.tailwindcss.com/docs/flex-basis

Use basis-* utility classes to define the initial size of flex items before free space is distributed. The example demonstrates a three-column layout where the first two items take 25% width each and the third takes 50%, using flex-basis CSS property.

```html
<div class="flex flex-row">
  <div class="basis-1/4">01</div>
  <div class="basis-1/4">02</div>
  <div class="basis-1/2">03</div>
</div>
```

--------------------------------

### Conditional Overflow with Hover State Modifier

Source: https://v3.tailwindcss.com/docs/overflow

Use state variant modifiers like hover: to conditionally apply overflow utilities. This example applies overflow-scroll only when the element is hovered.

```html
<div class="overflow-auto hover:overflow-scroll">
  <!-- ... -->
</div>
```

--------------------------------

### Spin Animation with Loading Indicator

Source: https://v3.tailwindcss.com/docs/animation

Demonstrates the animate-spin utility class applied to an SVG icon within a disabled button to indicate a loading or processing state. The utility applies a continuous linear rotation animation over 1 second.

```html
<button type="button" class="bg-indigo-500 ..." disabled>
  <svg class="animate-spin h-5 w-5 mr-3 ..." viewBox="0 0 24 24">
    <!-- ... -->
  </svg>
  Processing...
</button>
```

--------------------------------

### Configure PostCSS with Autoprefixer

Source: https://v3.tailwindcss.com/docs/browser-support

PostCSS configuration file (module.exports) that adds Autoprefixer to the plugin pipeline. Autoprefixer must be placed at the end of the plugin list to ensure it processes all CSS output from preceding plugins like Tailwind CSS.

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

--------------------------------

### Customize Tailwind CSS Theme for `content` Utility

Source: https://v3.tailwindcss.com/docs/content

This configuration example shows how to extend the `theme.content` property in `tailwind.config.js` to add custom `content` utilities. This allows developers to define reusable content values, such as URLs for SVG icons, within their project's theme.

```javascript
module.exports = {
  theme: {
    extend: {
      content: {
        'link': 'url("/icons/link.svg")'
      }
    }
  }
}
```

--------------------------------

### Configure Tailwind CSS content paths in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/guides/symfony

This configuration snippet in 'tailwind.config.js' specifies the file paths that Tailwind CSS should scan for class names. It includes JavaScript assets and Twig template files to ensure all used utility classes are included in the final CSS bundle.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./assets/**/*.js",
    "./templates/**/*.html.twig",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Implement subgrids using Tailwind CSS `grid-rows-subgrid`

Source: https://v3.tailwindcss.com/docs/grid-template-rows

This example illustrates how to use the `grid-rows-subgrid` utility in Tailwind CSS to make a nested grid item adopt the row tracks defined by its parent grid. It also demonstrates `row-span-3` to make the subgrid span multiple rows and `row-start-2` for precise positioning within the subgrid, showcasing advanced grid nesting capabilities.

```html
<div class="grid grid-rows-4 grid-flow-col gap-4">
  <div>01</div>
  <!-- ... -->
  <div>05</div>
  <div class="grid grid-rows-subgrid gap-4 row-span-3">
      <div class="row-start-2">06</div>
  </div>
  <div>07</div>
  <!-- ... -->
  <div>10</div>
</div>
```

--------------------------------

### Bounce Animation for Scroll Indicators

Source: https://v3.tailwindcss.com/docs/animation

Uses the animate-bounce utility to create a bouncing up and down motion effect. Commonly applied to SVG icons or elements to indicate that users should scroll down the page.

```html
<svg class="animate-bounce w-6 h-6 ...">
  <!-- ... -->
</svg>
```

--------------------------------

### Apply Tailwind CSS `min-w` utility at medium screen sizes

Source: https://v3.tailwindcss.com/docs/min-width

This HTML example demonstrates using a responsive variant modifier, `md:min-w-0`, to apply a `min-w-0` utility class specifically for medium screen sizes and above in Tailwind CSS.

```html
<div class="w-24 min-w-full md:min-w-0">
  <!-- ... -->
</div>
```

--------------------------------

### Customize will-change Theme in Tailwind Config

Source: https://v3.tailwindcss.com/docs/will-change

Extend the default will-change utilities by adding custom values to the theme configuration. This example adds a custom 'left-top' will-change value that can be used as will-change-left-top class in your HTML.

```JavaScript
module.exports = {
  theme: {
    extend: {
      willChange: {
        'left-top': 'left, top',
      }
    }
  }
}
```

--------------------------------

### Set Tailwind CSS Gradient Ending Color

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

Define the final color of a Tailwind CSS gradient using the `to-*` utilities. This example creates a gradient from `cyan-500` to `blue-500`.

```html
<div class="bg-gradient-to-r from-cyan-500 to-blue-500 ..."></div>
```

--------------------------------

### Configure Tailwind CSS Typography Plugin in CSS

Source: https://v3.tailwindcss.com/docs/typography-plugin

This snippet demonstrates how to import the Tailwind CSS typography plugin and reference a custom `tailwind.config.js` file using the `@config` directive within a CSS file. This setup allows for JavaScript-based theme customization.

```css
  @import "tailwindcss";
  @plugin "@tailwindcss/typography";
+ @config "./tailwind.config.js";
```

--------------------------------

### Apply Transform Origin Utilities in HTML

Source: https://v3.tailwindcss.com/docs/transform-origin

Use Tailwind CSS origin-* utility classes to set the transform origin of elements. The example demonstrates applying different origin values (center, top-left, bottom) combined with rotation transforms to images.

```html
<img class="origin-center rotate-45 ...">
<img class="origin-top-left rotate-12 ...">
<img class="origin-bottom -rotate-12 ...">
```

--------------------------------

### Customize Tailwind CSS Responsive Breakpoints (Screens)

Source: https://v3.tailwindcss.com/docs/theme

This snippet illustrates how to define custom responsive breakpoints using the `screens` key within the `theme` object of `tailwind.config.js`. These breakpoints determine when responsive utility classes are applied, allowing for precise control over layout changes at different screen sizes.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

--------------------------------

### Apply flex-none Utility in Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/flex

This HTML example demonstrates the `flex-none` utility class in Tailwind CSS. It prevents a flex item from growing or shrinking, maintaining its fixed size within the flex container.

```html
<div class="flex ...">
  <div class="flex-none w-14 ...">
    01
  </div>
  <div class="flex-none w-32 ...">
    02
  </div>
  <div class="flex-1 ...">
    03
  </div>
</div>
```

--------------------------------

### Update Tailwind CSS `decoration-clone` and `decoration-slice` classes

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS v3 has added `box-decoration-clone` and `box-decoration-slice` as aliases for `decoration-clone` and `decoration-slice`. This change aims to avoid confusion with new `text-decoration` utilities using the `decoration-` namespace. While old names are supported, aliases are recommended.

```html
<div class="decoration-clone"></div>
<div class="box-decoration-clone"></div>

<div class="decoration-slice"></div>
<div class="box-decoration-slice"></div>
```

--------------------------------

### Apply Tailwind CSS Backdrop Contrast at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/backdrop-contrast

Demonstrates applying `backdrop-contrast` utilities conditionally based on media queries like responsive breakpoints. The `md:backdrop-contrast-150` class sets a different contrast level for medium screen sizes and above.

```html
<div class="backdrop-contrast-125 md:backdrop-contrast-150">
  <!-- ... -->
</div>
```

--------------------------------

### Use Tailwind Utility Classes in Laravel Blade Template

Source: https://v3.tailwindcss.com/docs/guides/laravel

Apply Tailwind CSS utility classes in a Blade template with Vite asset inclusion. Demonstrates linking compiled CSS and styling HTML elements with Tailwind's responsive and styling utilities.

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  @vite('resources/css/app.css')
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Use arbitrary divide width values with square brackets

Source: https://v3.tailwindcss.com/docs/divide-width

Apply one-off divide width values using square bracket notation without needing to add them to the theme configuration. This example uses a custom 3px divide width.

```html
<div class="divide-x-[3px]">
  <!-- ... -->
</div>
```

--------------------------------

### Responsive Flex Shrink with Media Queries

Source: https://v3.tailwindcss.com/docs/flex-shrink

Shows how to use breakpoint modifiers to apply flex shrink utilities at specific screen sizes. The `md:shrink-0` variant applies only at medium breakpoints and above, enabling responsive layouts that adapt to different devices.

```html
<div class="shrink md:shrink-0">
  <!-- ... -->
</div>
```

--------------------------------

### Customize aspect ratio values in Tailwind config

Source: https://v3.tailwindcss.com/docs/aspect-ratio

Extend the default aspect-ratio theme values by adding custom ratios to the tailwind.config.js file. This example adds a 4/3 aspect ratio that can be used with the aspect-4/3 utility class.

```javascript
module.exports = {
  theme: {
    extend: {
      aspectRatio: {
        '4/3': '4 / 3',
      },
    }
  }
}
```

--------------------------------

### Ping Animation for Notification Badges

Source: https://v3.tailwindcss.com/docs/animation

Shows the animate-ping utility creating a radar ping or ripple effect by scaling and fading an element. Useful for notification badges or attention-grabbing indicators with layered span elements.

```html
<span class="relative flex h-3 w-3">
  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
  <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
</span>
```

--------------------------------

### Apply break-before-column at medium screen sizes in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/break-before

This example shows how to apply the `break-before-column` utility specifically at medium screen sizes and above. It utilizes Tailwind CSS responsive prefixes (e.g., `md:`) to control layout behavior based on media queries.

```html
<div class="md:break-before-column">
  <!-- ... -->
</div>
```

--------------------------------

### Apply bg-auto Background Size in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-size

Display a background image at its default size using the bg-auto utility class. This example combines bg-auto with bg-no-repeat and bg-center for positioning control. The style attribute contains the background-image URL reference.

```html
<div class="bg-auto bg-no-repeat bg-center ..." style="background-image: url(...)"></div>
```

--------------------------------

### Use complete class names instead of dynamic construction

Source: https://v3.tailwindcss.com/docs/content-configuration

Always use complete, static Tailwind class names in your code instead of dynamically constructing them. Tailwind cannot evaluate source code at build time, so it can only detect unbroken class strings that are fully written in the source.

```html
<!-- Incorrect - dynamic class construction won't work -->
<div class="text-{{ error ? 'red' : 'green' }}-600"></div>

<!-- Correct - use complete class names -->
<div class="{{ error ? 'text-red-600' : 'text-green-600' }}"></div>
```

--------------------------------

### Create Inline Flex Containers with Tailwind CSS `inline-flex`

Source: https://v3.tailwindcss.com/docs/display

This HTML example shows how to apply the Tailwind CSS `inline-flex` utility. It creates an inline-level flex container that allows its content to flow with surrounding text, maintaining its flex properties while behaving like an inline element.

```html
<p>
  Today I spent most of the day researching ways to ...
  <span class="inline-flex items-baseline">
    <img src="path/to/image.jpg" alt="" class="self-center w-5 h-5 rounded-full mx-1" />
    <span>Kramer</span>
  </span>
  keeps telling me there is no way to make it work, that ...
</p>
```

--------------------------------

### Correct Dynamic Tailwind Class Generation in React/JSX (Basic Mapping)

Source: https://v3.tailwindcss.com/docs/content-configuration

This React component demonstrates the correct method for applying dynamic Tailwind CSS classes by mapping props to complete, statically defined class strings. This ensures all classes are detectable by Tailwind's build process, even when values are dynamic.

```jsx
function Button({ color, children }) {
  const colorVariants = {
    blue: 'bg-blue-600 hover:bg-blue-500',
    red: 'bg-red-600 hover:bg-red-500',
  }

  return (
    <button className={`${colorVariants[color]} ...`}>
      {children}
    </button>
  )
}
```

--------------------------------

### Use Tailwind Utility Classes in Handlebars Template

Source: https://v3.tailwindcss.com/docs/guides/emberjs

Apply Tailwind utility classes directly to HTML elements in Ember Handlebars templates. Demonstrates basic text styling with responsive font sizes, font weight, and text decoration utilities.

```handlebars
{{page-title "MyProject"}}

<h1 class="text-3xl font-bold underline">
  Hello world!
</h1>

{{outlet}}
```

--------------------------------

### Remove Variants Configuration from tailwind.config.js

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Remove the `variants` section from tailwind.config.js entirely. In Tailwind CSS v3.0, every variant is automatically available for every utility by default, eliminating the need for manual variant configuration.

```javascript
module.exports = {
  variants: {
    extend: {
      padding: ['hover']
    }
  }
}
```

--------------------------------

### Enable PostCSS Loader in Symfony's webpack.config.js

Source: https://v3.tailwindcss.com/docs/guides/symfony

This JavaScript snippet within 'webpack.config.js' enables the PostCSS loader using Webpack Encore's API. It ensures that PostCSS can process CSS files, including Tailwind's directives, before final compilation.

```javascript
Encore
  // ...
  .enablePostCssLoader()
;
```

--------------------------------

### Use Arbitrary Backdrop Contrast Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/backdrop-contrast

Illustrates how to generate one-off `backdrop-contrast` values using arbitrary value syntax with square brackets. This is useful for applying unique, non-theme-defined contrast levels directly in your HTML.

```html
<div class="backdrop-contrast-[.25]">
  <!-- ... -->
</div>
```

--------------------------------

### Add Tailwind CSS Gradient Middle Color

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

Introduce an intermediate color into a Tailwind CSS gradient using the `via-*` utilities. This example demonstrates a three-color gradient from indigo, through purple, to pink.

```html
<div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 ..."></div>
```

--------------------------------

### Fix missing file extensions in content configuration

Source: https://v3.tailwindcss.com/docs/content-configuration

Ensure all file extensions used in your project are included in the content configuration. A common error is forgetting extensions like jsx for React components, which causes Tailwind to skip those files and not generate required classes.

```javascript
module.exports = {
  content: [
    './src/**/*.{html,js}',
    './src/**/*.{html,js,jsx}'
  ],
  // ...
}
```

--------------------------------

### Apply Tailwind CSS `bg-clip` utilities to elements

Source: https://v3.tailwindcss.com/docs/background-clip

This HTML example demonstrates how to use `bg-clip-border`, `bg-clip-padding`, and `bg-clip-content` utilities to control the bounding box of an element's background in Tailwind CSS. Each utility defines a different clipping area relative to the element's border, padding, or content box.

```html
<div class="bg-clip-border p-6 bg-violet-600 border-4 border-violet-300 border-dashed"></div>
<div class="bg-clip-padding p-6 bg-violet-600 border-4 border-violet-300 border-dashed"></div>
<div class="bg-clip-content p-6 bg-violet-600 border-4 border-violet-300 border-dashed"></div>
```

--------------------------------

### Apply Tailwind CSS `min-h-*` Conditionally on Hover

Source: https://v3.tailwindcss.com/docs/min-height

This example shows how to use Tailwind CSS variant modifiers to apply the `min-h-full` utility only when an element is hovered over. This allows for dynamic styling based on user interaction.

```html
<div class="h-24 min-h-0 hover:min-h-full">
  <!-- ... -->
</div>
```

--------------------------------

### Apply text decoration thickness at responsive breakpoints

Source: https://v3.tailwindcss.com/docs/text-decoration-thickness

Use responsive variant modifiers like md: to apply decoration utilities only at specific screen sizes. This example applies decoration-4 only at medium screen sizes and above using the md: prefix.

```html
<p class="underline md:decoration-4">
  <!-- ... -->
</p>
```

--------------------------------

### Setting gap between grid elements with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/gap

Apply uniform gap spacing to both rows and columns in a grid layout using gap-* utilities. This example creates a 2-column grid with 16px (gap-4) spacing between all child elements. The gap property is supported on both grid and flexbox containers.

```html
<div class="grid gap-4 grid-cols-2">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Apply Tailwind CSS saturate Utilities to HTML Elements

Source: https://v3.tailwindcss.com/docs/saturate

Demonstrates the basic application of Tailwind CSS `saturate-*` utility classes to control an element's color saturation. Examples show different predefined saturation levels affecting the visual output of div elements.

```HTML
<div class="saturate-50 ...">
  <!-- ... -->
</div>
<div class="saturate-100 ...">
  <!-- ... -->
</div>
<div class="saturate-150 ...">
  <!-- ... -->
</div>
<div class="saturate-200 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Apply List Style Image with Tailwind CSS Utility Classes

Source: https://v3.tailwindcss.com/docs/list-style-image

Use the list-image-* utility classes to set custom marker images for unordered or ordered lists. The example demonstrates applying a checkmark image using the square bracket notation for arbitrary values, allowing inline custom image URLs without theme configuration.

```html
<ul class="list-image-[url(checkmark.png)] ...">
  <li>5 cups chopped Porcini mushrooms</li>
  <!-- ... -->
</ul>
```

--------------------------------

### Remove default CSS import from app.js

Source: https://v3.tailwindcss.com/docs/guides/phoenix

Removes the default CSS import statement from `app.js`. Since Tailwind CSS is now responsible for handling the styling, this line becomes redundant. Removing it helps prevent potential conflicts and optimizes the asset pipeline.

```javascript
// Remove this line if you add your own CSS build pipeline (e.g postcss).
import "../css/app.css"
```

--------------------------------

### Generate PostCSS Config File with Tailwind CSS Initialization

Source: https://v3.tailwindcss.com/docs/configuration

This command generates a basic `postcss.config.js` file alongside the `tailwind.config.js` file. The `-p` flag is a convenience for quickly setting up a PostCSS environment that includes Tailwind CSS.

```bash
npx tailwindcss init -p
```

--------------------------------

### Include JavaScript Files that Manipulate HTML Classes

Source: https://v3.tailwindcss.com/docs/content-configuration

Add JavaScript files to the content configuration if they dynamically add or remove Tailwind classes. This ensures Tailwind generates CSS for all class names that might be applied at runtime through JavaScript.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ...
    './src/**/*.js',
  ],
  // ...
}
```

```javascript
// src/spaghetti.js
// ...
menuButton.addEventListener('click', function () {
  let classList = document.getElementById('nav').classList
  classList.toggle('hidden')
  classList.toggle('block')
})
// ...
```

--------------------------------

### Apply Arbitrary Fill Color using HTML with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/fill

This example shows how to apply a one-off fill color using Tailwind CSS's arbitrary value syntax directly within an HTML class attribute. The `fill-[#243c5a]` syntax allows for on-the-fly color definition without needing to extend the theme. This is suitable for unique styling requirements that don't warrant a global theme entry.

```html
<svg class="fill-[#243c5a]">
  <!-- ... -->
</svg>
```

--------------------------------

### Generate Variants for Safelisted Pattern-Matched Classes

Source: https://v3.tailwindcss.com/docs/content-configuration

Force Tailwind to generate specific variants (responsive, state, etc.) for classes matched by safelisting patterns using the variants option. This enables pattern matching while maintaining control over which variant modifiers are generated.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js}',
    './components/**/*.{html,js}',
  ],
  safelist: [
    'text-2xl',
    'text-3xl',
    {
      pattern: /bg-(red|green|blue)-(100|200|300)/,
      variants: ['lg', 'hover', 'focus', 'lg:hover'],
    },
  ],
  // ...
}
```

--------------------------------

### Apply Tailwind CSS Classes to HTML

Source: https://v3.tailwindcss.com/docs/guides/ruby-on-rails

This HTML snippet demonstrates how to apply Tailwind CSS utility classes directly to an element. It styles an `<h1>` tag with a large, bold, and underlined text using `text-3xl`, `font-bold`, and `underline` classes.

```HTML (ERB)
<h1 class="text-3xl font-bold underline">
    Hello world!
</h1>
```

--------------------------------

### Tailwind CSS HTML: Apply Arbitrary Line-Height Value

Source: https://v3.tailwindcss.com/docs/line-height

This HTML example demonstrates how to apply a one-off, arbitrary `line-height` value directly in your markup using Tailwind's square bracket notation. This is useful for values that are not part of your theme and are unlikely to be reused, such as `leading-[3rem]`.

```html
<p class="leading-[3rem]">
  <!-- ... -->
</p>
```

--------------------------------

### Configure custom data attribute shortcuts in Tailwind config

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Define shortcuts for common data attribute selectors in theme.data to create reusable data-* modifiers. This example creates a data-checked modifier for ui attributes.

```JavaScript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    data: {
      checked: 'ui~="checked"',
    },
  },
};
```

--------------------------------

### Apply divide styles at breakpoints with responsive modifiers

Source: https://v3.tailwindcss.com/docs/divide-width

Use breakpoint variant modifiers like md: to apply divide width utilities only at specific screen sizes. This example applies divide-y-8 only at medium screen sizes and above.

```html
<div class="divide-y divide-gray-400 md:divide-y-8">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Transform on Hover with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/translate

Use variant modifiers like `hover:` to apply utility classes conditionally based on interactive states. This example demonstrates applying a `translate-y-12` transform only when the element is hovered over.

```html
<div class="hover:translate-y-12">
  <!-- ... -->
</div>
```

--------------------------------

### HTML Usage of Prefixed Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/configuration

This HTML example illustrates the application of prefixed Tailwind CSS classes, including responsive (`md:tw-`) and state-based (`hover:tw-`) variants, and negative margins (`-tw-`). The prefix is added after variant modifiers but before negative value dashes.

```html
<div class="tw-text-lg md:tw-text-xl tw-bg-red-500 hover:tw-bg-blue-500">
  <!-- -->
</div>
```

--------------------------------

### Configure Tailwind with Presets in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/presets

Import and use a preset package in the main Tailwind configuration file. The preset acts as a base configuration that is merged with project-specific customizations. Multiple presets can be included and will be processed in order.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('@acmecorp/tailwind-base')
  ],
  // ...
}
```

--------------------------------

### Apply Conditional will-change with Hover State

Source: https://v3.tailwindcss.com/docs/will-change

Use hover variant modifiers to conditionally apply will-change utilities only when elements are in specific states. This example applies will-change-scroll only on hover while defaulting to will-change-auto in normal state.

```HTML
<div class="will-change-auto hover:will-change-scroll">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Font Family Values with Square Brackets

Source: https://v3.tailwindcss.com/docs/font-family

Example of using Tailwind's arbitrary value syntax with square brackets to apply a one-off font-family value (Open Sans) directly in markup without requiring theme configuration.

```html
<p class="font-['Open_Sans']">
  <!-- ... -->
</p>
```

--------------------------------

### Apply Font Family with Hover State Modifier

Source: https://v3.tailwindcss.com/docs/font-family

Example of using Tailwind's hover variant modifier to conditionally apply the font-serif utility class only when an element is hovered, demonstrating state-based conditional styling.

```html
<p class="font-sans hover:font-serif">
  <!-- ... -->
</p>
```

--------------------------------

### Customize Tailwind CSS Blur Values in Theme Config

Source: https://v3.tailwindcss.com/docs/blur

Explains how to extend the default Tailwind CSS theme to include custom blur values. This example adds an `xs` blur utility with a value of `2px` to the `theme.extend.blur` section in `tailwind.config.js`.

```javascript
module.exports = {
  theme: {
    extend: {
      blur: {
        xs: '2px'
      }
    }
  }
}
```

--------------------------------

### Apply prefix and important to plugin utilities

Source: https://v3.tailwindcss.com/docs/plugins

Demonstrates how plugin utilities automatically respect user configuration for prefix and important settings. When configured with prefix 'tw-' and important: true, generated utilities are scoped with the prefix and include !important flags.

```javascript
module.exports = {
  prefix: 'tw-',
  important: true,
}
```

--------------------------------

### Apply Tailwind CSS line-clamp at specific breakpoints

Source: https://v3.tailwindcss.com/docs/line-clamp

This example illustrates how to apply `line-clamp` utilities responsively using breakpoint modifiers. The `md:line-clamp-4` class ensures the text is truncated to 4 lines on medium screens and larger, while defaulting to 3 lines on smaller screens. This is essential for creating responsive UI layouts that adapt content presentation to various screen sizes.

```HTML
<p class="line-clamp-3 md:line-clamp-4">
  <!-- ... -->
</p>
```

--------------------------------

### Use Tailwind CSS `grow-*` and `shrink-*` aliases for flex properties

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS v3 introduces `grow-*` and `shrink-*` as shorter aliases for `flex-grow-*` and `flex-shrink-*` respectively. The old class names will continue to work, but updating to the new aliases is encouraged for consistency and brevity.

```html
<div class="flex-grow-0 flex-shrink">
<div class="grow-0 shrink">
```

--------------------------------

### Tailwind CSS content-end Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Packs grid rows against the end of the cross axis using the content-end utility class. Aligns rows to the bottom of the container. Equivalent to CSS align-content: flex-end property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-end ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Disable preflight in corePlugins configuration

Source: https://v3.tailwindcss.com/docs/upgrade-guide

To disable Tailwind's global base styles in v3.0 without breaking utilities that depend on base styles, set preflight to false in the corePlugins configuration object in your Tailwind config file.

```javascript
module.exports = {
  // ...
  corePlugins: {
    preflight: false,
  },
}
```

--------------------------------

### Apply responsive scale with breakpoint modifiers

Source: https://v3.tailwindcss.com/docs/scale

Use responsive variant modifiers to apply scale utilities at specific breakpoints. For example, md:scale-125 applies the scale only at medium screen sizes and above. Supports all Tailwind breakpoints.

```html
<div class="md:scale-125">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Responsive Tailwind CSS Gradients at Breakpoints

Source: https://v3.tailwindcss.com/docs/background-image

This example shows how to make background gradients responsive using Tailwind CSS variant modifiers for breakpoints. Applying `md:bg-gradient-to-r` ensures that the gradient direction changes only on medium screen sizes and above, adapting the design for different viewports.

```html
<div class="bg-gradient-to-l md:bg-gradient-to-r">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary `min-height` Values with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/min-height

This example demonstrates how to apply a one-off, arbitrary `min-height` value directly within your HTML using Tailwind CSS's square bracket notation. This is useful for values that are not part of your theme and don't warrant full customization.

```html
<div class="min-h-[220px]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Percentage-Based Widths with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/width

Shows how to use Tailwind CSS utility classes such as w-1/2, w-full, or w-2/5 to assign widths based on percentages of the parent element. This is useful for creating flexible, grid-like layouts that adapt to different screen sizes.

```html
<div class="flex ...">
  <div class="w-1/2 ... ">w-1/2</div>
  <div class="w-1/2 ... ">w-1/2</div>
</div>
<div class="flex ...">
  <div class="w-2/5 ...">w-2/5</div>
  <div class="w-3/5 ...">w-3/5</div>
</div>
<div class="flex ...">
  <div class="w-1/3 ...">w-1/3</div>
  <div class="w-2/3 ...">w-2/3</div>
</div>
<div class="flex ...">
  <div class="w-1/4 ...">w-1/4</div>
  <div class="w-3/4 ...">w-3/4</div>
</div>
<div class="flex ...">
  <div class="w-1/5 ...">w-1/5</div>
  <div class="w-4/5 ...">w-4/5</div>
</div>
<div class="flex ...">
  <div class="w-1/6 ...">w-1/6</div>
  <div class="w-5/6 ...">w-5/6</div>
</div>
<div class="w-full ...">w-full</div>
```

--------------------------------

### Use Arbitrary will-change Values

Source: https://v3.tailwindcss.com/docs/will-change

Generate custom will-change properties on-the-fly using square bracket notation for one-off values that don't warrant adding to the theme. This example applies will-change to top and left properties without requiring theme configuration.

```HTML
<div class="will-change-[top,left]">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS content-center Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Centers grid rows along the cross axis using the content-center utility class. Distributes rows in the middle of the container. Equivalent to CSS align-content: center property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-center ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Dark Mode Variant HTML Structure - Tailwind CSS

Source: https://v3.tailwindcss.com/docs/dark-mode

Demonstrates basic dark mode styling using Tailwind's `dark:` variant prefix. This example shows a card component that changes background color and text color based on dark mode state, using `bg-white dark:bg-slate-800` for backgrounds and `text-slate-900 dark:text-white` for text. The snippet includes SVG icons and responsive spacing utilities.

```html
<div class="bg-white dark:bg-slate-800 rounded-lg px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
  <div>
    <span class="inline-flex items-center justify-center p-2 bg-indigo-500 rounded-md shadow-lg">
      <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><!-- ... --></svg>
    </span>
  </div>
  <h3 class="text-slate-900 dark:text-white mt-5 text-base font-medium tracking-tight">Writes Upside-Down</h3>
  <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm">
    The Zero Gravity Pen can be used to write in any orientation, including upside-down. It even works in outer space.
  </p>
</div>
```

--------------------------------

### Map Tailwind CSS Border Inline Start Color Utilities to CSS

Source: https://v3.tailwindcss.com/docs/border-color

This snippet demonstrates how different Tailwind CSS `border-s-{color}-{shade}` utility classes translate into the standard `border-inline-start-color` CSS property. The generated CSS uses `rgb` color values and includes a `var(--tw-border-opacity, 1)` for dynamic opacity control, common in Tailwind.

```html
border-s-slate-500
```

```css
border-inline-start-color: rgb(100 116 139 / var(--tw-border-opacity, 1));
```

```html
border-s-gray-700
```

```css
border-inline-start-color: rgb(55 65 81 / var(--tw-border-opacity, 1));
```

```html
border-s-zinc-950
```

```css
border-inline-start-color: rgb(9 9 11 / var(--tw-border-opacity, 1));
```

--------------------------------

### Apply Text Selection on Hover with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/user-select

Use hover state variant modifiers to conditionally apply user-select utilities on hover. For example, hover:select-all applies the select-all utility only when users hover over the element.

```html
<div class="hover:select-all">
  <!-- ... -->
</div>
```

--------------------------------

### Configure custom ARIA modifiers in Tailwind config

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Extend the theme.aria configuration in tailwind.config.js to add custom ARIA attribute modifiers for your project. This example adds asc and desc modifiers for sort attributes.

```JavaScript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      aria: {
        asc: 'sort="ascending"',
        desc: 'sort="descending"',
      },
    },
  },
};
```

--------------------------------

### Tailwind CSS content-around Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Distributes grid rows with equal space around each row using the content-around utility class. Space appears on both sides of each row. Equivalent to CSS align-content: space-around property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-around ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Tailwind CSS content-stretch Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Stretches grid rows to fill available space along the container's cross axis using the content-stretch utility class. Equivalent to CSS align-content: stretch property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-stretch ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Apply Font Family with Responsive Breakpoint Modifier

Source: https://v3.tailwindcss.com/docs/font-family

Example of using Tailwind's md (medium) breakpoint variant modifier to apply the font-serif utility only at medium screen sizes and above, enabling responsive font family changes.

```html
<p class="font-sans md:font-serif">
  <!-- ... -->
</p>
```

--------------------------------

### Apply Fixed Widths with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/width

Demonstrates how to use Tailwind CSS utility classes like w-96, w-80, etc., to set elements to fixed pixel or rem-based widths. These utilities provide predefined sizing options for consistent layouts.

```html
<div class="w-96 ...">w-96</div>
<div class="w-80 ...">w-80</div>
<div class="w-64 ...">w-64</div>
<div class="w-48 ...">w-48</div>
<div class="w-40 ...">w-40</div>
<div class="w-32 ...">w-32</div>
<div class="w-24 ...">w-24</div>
```

--------------------------------

### Tailwind CSS content-evenly Grid Alignment

Source: https://v3.tailwindcss.com/docs/align-content

Distributes grid rows with equal space around each row, accounting for doubled space between items using the content-evenly utility class. Equivalent to CSS align-content: space-evenly property.

```html
<div class="h-56 grid grid-cols-3 gap-4 content-evenly ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Conditionally Apply Transitions Based on User Motion Preference in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/transition-property

This example shows how to use Tailwind CSS's `motion-reduce` variant to disable transitions and transformations for users who prefer reduced motion, while keeping them active otherwise.

```html
<button class="transition transform hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none ...">
  Hover me
</button>
```

--------------------------------

### Import Tailwind CSS Files with Custom Styles

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Import Tailwind CSS base, components, and utilities from node_modules alongside custom stylesheet imports. Separates @tailwind declarations into individual files to maintain CSS spec compliance for import positioning.

```css
@import "tailwindcss/base";
@import "./custom-base-styles.css";

@import "tailwindcss/components";
@import "./custom-components.css";

@import "tailwindcss/utilities";
@import "./custom-utilities.css";
```

--------------------------------

### Apply background position at responsive breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-position

Example demonstrating responsive variant modifier usage in Tailwind CSS. The md:bg-top class applies the bg-top utility only at medium screen sizes and above, enabling responsive background position changes across different device widths.

```html
<div class="bg-center md:bg-top ..." style="background-image: url(...)"></div>
```

--------------------------------

### Generate Full Default Tailwind CSS Configuration File

Source: https://v3.tailwindcss.com/docs/configuration

This command scaffolds a complete `tailwind.config.js` file that includes all of Tailwind's internal default configurations. While usually kept minimal, the `--full` option is useful for understanding all available options or for extensive modifications.

```bash
npx tailwindcss init --full
```

--------------------------------

### Apply Blur Effects to Elements with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/blur

Demonstrates how to apply different levels of blur to HTML elements using Tailwind CSS's `blur-*` utility classes. This snippet shows examples for `blur-none` (no blur), `blur-sm` (small blur), `blur-lg` (large blur), and `blur-2xl` (extra large blur).

```html
<div class="blur-none ...">
  <!-- ... -->
</div>
<div class="blur-sm ...">
  <!-- ... -->
</div>
<div class="blur-lg ...">
  <!-- ... -->
</div>
<div class="blur-2xl ...">
  <!-- ... -->
</div>
```

--------------------------------

### Specify Tailwind CSS Configuration File with @config Directive

Source: https://v3.tailwindcss.com/docs/functions-and-directives

The `@config` directive allows specifying a custom Tailwind CSS configuration file for a given CSS entry point. This is useful for projects requiring different configurations across various CSS bundles. Ensure `@import` statements precede `@config` due to PostCSS processing order.

```css
@config "./tailwind.site.config.js";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

```css
@import "tailwindcss/base";
@import "./custom-base.css";
@import "tailwindcss/components";
@import "./custom-components.css";
@import "tailwindcss/utilities";

@config "./tailwind.admin.config.js";
```

--------------------------------

### Import and Extend Default Theme Values

Source: https://v3.tailwindcss.com/docs/theme

Import the default theme from 'tailwindcss/defaultTheme' to reference and extend Tailwind's built-in theme values. This is useful for adding custom values to existing default stacks, such as adding a font family to the default sans-serif stack.

```javascript
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Lato',
          ...defaultTheme.fontFamily.sans,
        ]
      }
    }
  }
}
```

--------------------------------

### Extract utility classes to a custom button class using Tailwind's @apply

Source: https://v3.tailwindcss.com/docs/reusing-styles

This example illustrates how to refactor a button's verbose Tailwind utility classes into a single, semantic custom class (`.btn-primary`) using the `@apply` directive. It shows the HTML markup before and after extraction, alongside the CSS definition of the custom class, demonstrating a cleaner HTML structure while leveraging Tailwind's utilities.

```html
<!-- Before extracting a custom class -->
<button class="py-2 px-5 bg-violet-500 text-white font-semibold rounded-full shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75">
  Save changes
</button>

<!-- After extracting a custom class -->
<button class="btn-primary">
  Save changes
</button>
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply py-2 px-5 bg-violet-500 text-white font-semibold rounded-full shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75;
  }
}
```

--------------------------------

### Configure Relative Path Resolution in Tailwind Config

Source: https://v3.tailwindcss.com/docs/content-configuration

Enable relative path resolution in Tailwind by using object notation with the relative property set to true, ensuring content paths are resolved relative to the tailwind.config.js file regardless of the current working directory.

```javascript
module.exports = {
  content: {
    relative: true,
    files: [
      './pages/**/*.{html,js}',
      './components/**/*.{html,js}',
    ],
  },
  // ...
}
```

--------------------------------

### Correct Dynamic Tailwind Class Generation in React/JSX (Advanced Mapping)

Source: https://v3.tailwindcss.com/docs/content-configuration

This React component expands on the correct approach, showing how to map props to more complex, complete Tailwind CSS class strings, including different hover states and text colors. This provides flexibility for dynamic styling while maintaining static detectability for Tailwind's JIT compilation.

```jsx
function Button({ color, children }) {
  const colorVariants = {
    blue: 'bg-blue-600 hover:bg-blue-500 text-white',
    red: 'bg-red-500 hover:bg-red-400 text-white',
    yellow: 'bg-yellow-300 hover:bg-yellow-400 text-black',
  }

  return (
    <button className={`${colorVariants[color]} ...`}>
      {children}
    </button>
  )
}
```

--------------------------------

### Set Element Blend Mode with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/mix-blend-mode

Apply mix-blend-* utilities to control how an element's content blends with the background. This example demonstrates using mix-blend-multiply on overlapping colored divs to create a blending effect.

```html
<div class="flex justify-center -space-x-14">
  <div class="mix-blend-multiply bg-blue-400 ..."></div>
  <div class="mix-blend-multiply bg-pink-400 ..."></div>
</div>
```

--------------------------------

### Create Custom Tailwind Preset with Theme and Plugins

Source: https://v3.tailwindcss.com/docs/presets

Create a reusable preset configuration file containing theme customizations, font families, and Tailwind plugins. Presets can define colors, spacing, typography, and extend default utilities. This preset can then be required in other projects.

```javascript
// Example preset
module.exports = {
  theme: {
    colors: {
      blue: {
        light: '#85d7ff',
        DEFAULT: '#1fb6ff',
        dark: '#009eeb',
      },
      pink: {
        light: '#ff7ce5',
        DEFAULT: '#ff49db',
        dark: '#ff16d1',
      },
      gray: {
        darkest: '#1f2d3d',
        dark: '#3c4858',
        DEFAULT: '#c0ccda',
        light: '#e0e6ed',
        lightest: '#f9fafc',
      }
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
    },
    extend: {
      flexGrow: {
        2: '2',
        3: '3',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

--------------------------------

### Apply Responsive Box Shadow with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/box-shadow

Apply a box shadow based on responsive breakpoints using Tailwind CSS variant modifiers. For example, `md:shadow-lg` applies a large shadow only on medium screen sizes and above.

```html
<div class="shadow md:shadow-lg">
  <!-- ... -->
</div>
```

--------------------------------

### Transform compiled content files before class scanning

Source: https://v3.tailwindcss.com/docs/content-configuration

Use the content.transform option to convert content from formats like Markdown to HTML before Tailwind scans for class names. This allows Tailwind to accurately detect classes in compiled content. Requires using content.files instead of a top-level content array.

```javascript
const remark = require('remark')

module.exports = {
  content: {
    files: ['./src/**/*.{html,md}'],
    transform: {
      md: (content) => {
        return remark().process(content)
      }
    }
  },
  // ...
}
```

--------------------------------

### Integrate Compiled CSS and Use Tailwind Classes in AdonisJS Edge Template

Source: https://v3.tailwindcss.com/docs/guides/adonisjs

This HTML snippet, intended for an AdonisJS Edge template (e.g., `home.edge`), demonstrates how to include the compiled CSS and JavaScript assets using `@vite`. It also showcases the application of Tailwind CSS utility classes like `text-3xl`, `font-bold`, and `underline` to an `<h1>` element, confirming successful integration.

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
</body>
</html>
```

--------------------------------

### Apply Closures to Top-Level Theme Keys Only

Source: https://v3.tailwindcss.com/docs/theme

Closures with the theme() function must be applied to top-level theme keys, not to individual nested values. Attempting to use functions for individual values within a theme section will not work correctly.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    fill: ({ theme }) => ({
      gray: theme('colors.gray')
    })
  }
}
```

--------------------------------

### Tailwind CSS Logical Padding Utilities

Source: https://v3.tailwindcss.com/docs/padding

Tailwind CSS padding classes using logical properties for internationalization support. The ps- prefix applies padding-inline-start (left in LTR, right in RTL), while pe- applies padding-inline-end (right in LTR, left in RTL). Automatically adapts to document direction.

```css
/* Logical inline-start padding (respects text direction) */
.ps-0 { padding-inline-start: 0px; }
.ps-px { padding-inline-start: 1px; }
.ps-0.5 { padding-inline-start: 0.125rem; /* 2px */ }
.ps-1 { padding-inline-start: 0.25rem; /* 4px */ }
.ps-1.5 { padding-inline-start: 0.375rem; /* 6px */ }
.ps-2 { padding-inline-start: 0.5rem; /* 8px */ }
.ps-2.5 { padding-inline-start: 0.625rem; /* 10px */ }
.ps-3 { padding-inline-start: 0.75rem; /* 12px */ }
.ps-3.5 { padding-inline-start: 0.875rem; /* 14px */ }
.ps-4 { padding-inline-start: 1rem; /* 16px */ }
.ps-5 { padding-inline-start: 1.25rem; /* 20px */ }

/* Logical inline-end padding (respects text direction) */
.pe-0 { padding-inline-end: 0px; }
.pe-px { padding-inline-end: 1px; }
.pe-0.5 { padding-inline-end: 0.125rem; /* 2px */ }
.pe-1 { padding-inline-end: 0.25rem; /* 4px */ }
.pe-1.5 { padding-inline-end: 0.375rem; /* 6px */ }
.pe-2 { padding-inline-end: 0.5rem; /* 8px */ }
.pe-2.5 { padding-inline-end: 0.625rem; /* 10px */ }
.pe-3 { padding-inline-end: 0.75rem; /* 12px */ }
.pe-3.5 { padding-inline-end: 0.875rem; /* 14px */ }
.pe-4 { padding-inline-end: 1rem; /* 16px */ }
.pe-5 { padding-inline-end: 1.25rem; /* 20px */ }
```

--------------------------------

### Apply scroll margin on hover state in Tailwind

Source: https://v3.tailwindcss.com/docs/scroll-margin

Use state variant modifiers like hover: to conditionally apply scroll margin utilities. This example changes the scroll margin from 8 to 0 when the element is hovered.

```html
<div class="scroll-m-8 hover:scroll-m-0">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Transform Origin in Tailwind Config

Source: https://v3.tailwindcss.com/docs/transform-origin

Extend Tailwind CSS theme configuration to add custom transform-origin values. This example adds a custom origin value 'top-left-1/3-3/4' with coordinates '33% 75%' to the transformOrigin theme object.

```javascript
module.exports = {
  theme: {
    extend: {
      transformOrigin: {
        'top-left-1/3-3/4': '33% 75%',
      }
    }
  }
}
```

--------------------------------

### Configure Tailwind CSS corePlugins as an array to replace preset settings

Source: https://v3.tailwindcss.com/docs/presets

If `corePlugins` is configured as an array, it completely replaces any `corePlugins` settings from presets. This example demonstrates a preset disabling the `float` plugin, but the main configuration's array setting for `corePlugins` overrides it, enabling only 'float', 'padding', and 'margin'.

```javascript
module.exports = {
  // ...
  corePlugins: {
    float: false,
  },
}
```

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('./example-preset.js'),
  ],
  // This will replace the configuration in the preset
  corePlugins: ['float', 'padding', 'margin']
}
```

--------------------------------

### Apply negative scroll margin values in Tailwind

Source: https://v3.tailwindcss.com/docs/scroll-margin

Use negative scroll margin values by prefixing the class name with a dash. This example shows how to apply a negative left scroll margin using the -scroll-ml-6 utility class.

```html
<div class="-scroll-ml-6 snap-start ...">
  <!-- ... -->
</div>
```

--------------------------------

### Migrating Custom CSS Variants from @variants to @layer in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/upgrade-guide

With Tailwind CSS v3.0, the `@variants` and `@responsive` directives are no longer needed for custom CSS as variants are enabled by default. Instead, custom styles should be wrapped in an appropriate `@layer` directive (e.g., `utilities`) to automatically support variants.

```css
@variants hover, focus {
 @layer utilities {
   .content-auto {
     content-visibility: auto;
   }
 }

```

--------------------------------

### Use Arbitrary Backdrop Saturate Values

Source: https://v3.tailwindcss.com/docs/backdrop-saturate

Generate backdrop-saturate utilities on-the-fly using square bracket notation with arbitrary values. This is useful for one-off saturation values that don't warrant adding to the theme configuration.

```html
<div class="backdrop-saturate-[.25]">
  <!-- ... -->
</div>
```

--------------------------------

### Conditionally Apply Tailwind CSS break-after-column on Hover

Source: https://v3.tailwindcss.com/docs/break-after

This example illustrates how to conditionally apply the `break-after-column` utility using Tailwind CSS variant modifiers. Specifically, it uses `hover:break-after-column` to only apply the column break when the element is hovered over.

```html
<div class="hover:break-after-column">
  <!-- ... -->
</div>
```

--------------------------------

### Hover state margin variant in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/margin

Apply margin utilities conditionally on hover state using the hover: variant modifier. Example: hover:mt-8 applies mt-8 margin only when the element is hovered.

```html
<div class="mt-4 hover:mt-8">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Place Content Hover State Variant

Source: https://v3.tailwindcss.com/docs/place-content

Applies place-content-center utility on hover using the hover: state modifier. Changes grid alignment from start to center when the container is hovered. Demonstrates conditional utility application based on user interaction.

```html
<div class="grid place-content-start hover:place-content-center">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Width on Hover/Focus with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/width

Shows how to apply width utilities conditionally based on interactive states like hover. The hover:w-full class in this example makes an element expand to full width when the mouse hovers over it, adding dynamic behavior to UI components.

```html
<div class="w-1/2 hover:w-full">
  <!-- ... -->
</div>
```

--------------------------------

### Apply border-x color with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/border-color

Applies a specific color to left and right borders using the border-x-{color} utility class. This example uses rose-950 color which generates RGB values with opacity variable support.

```css
.border-x-rose-950 {
  border-left-color: rgb(76 5 25 / var(--tw-border-opacity, 1));
  border-right-color: rgb(76 5 25 / var(--tw-border-opacity, 1));
}
```

--------------------------------

### HTML - Basic Flex Grow Usage with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/flex-grow

Demonstrates the `grow` utility class applied to a flex container where the middle item expands to fill available space. The outer items use `flex-none` with fixed widths to maintain their size.

```html
<div class="flex ...">
  <div class="flex-none w-14 h-14 ...">
    01
  </div>
  <div class="grow h-14 ...">
    02
  </div>
  <div class="flex-none w-14 h-14 ...">
    03
  </div>
</div>
```

--------------------------------

### Apply scroll margin at responsive breakpoints in Tailwind

Source: https://v3.tailwindcss.com/docs/scroll-margin

Use breakpoint variant modifiers like md: to conditionally apply scroll margin utilities at specific screen sizes. This example applies scroll-m-0 only at medium screen sizes and above.

```html
<div class="scroll-m-8 md:scroll-m-0">
  <!-- ... -->
</div>
```

--------------------------------

### Basic Scroll Padding with Snap Container in HTML

Source: https://v3.tailwindcss.com/docs/scroll-padding

Demonstrates setting horizontal scroll padding using the scroll-pl-6 utility on a snap container with multiple image elements. This example shows how scroll padding affects the offset when scrolling through snapped items in a horizontal layout.

```html
<div class="scroll-pl-6 snap-x ...">
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-start ...">
    <img src="https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
</div>
```

--------------------------------

### Manage !important with @apply in CSS and Sass

Source: https://v3.tailwindcss.com/docs/functions-and-directives

The `@apply` directive by default removes `!important` from inlined utility classes to avoid specificity issues. If `!important` is required, it can be re-added to the declaration. For Sass/SCSS, interpolation is necessary to correctly apply `!important`.

```css
/* Input */
.foo {
  color: blue !important;
}

.bar {
  @apply foo;
}

/* Output */
.foo {
  color: blue !important;
}

.bar {
  color: blue;
}
```

```css
/* Input */
.btn {
  @apply font-bold py-2 px-4 rounded !important;
}

/* Output */
.btn {
  font-weight: 700 !important;
  padding-top: .5rem !important;
  padding-bottom: .5rem !important;
  padding-right: 1rem !important;
  padding-left: 1rem !important;
  border-radius: .25rem !important;
}
```

```scss
.btn {
  @apply font-bold py-2 px-4 rounded #{!important};
}
```

--------------------------------

### Apply Responsive Flex Utility with Breakpoints in Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/flex

This HTML example shows how to use responsive variant modifiers in Tailwind CSS to apply flex utilities based on screen size. The `md:flex-1` class makes the element `flex-1` only for medium screen sizes and above, adapting its layout responsively.

```html
<div class="flex-none md:flex-1">
  <!-- ... -->
</div>
```

--------------------------------

### Apply responsive breakpoint variant to isolation utilities in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/isolation

Use the md: variant modifier to apply isolation utilities at specific breakpoints and above. This example applies isolation-auto only at medium screen sizes and larger, allowing responsive stacking context control.

```html
<div class="isolate md:isolation-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Apply arbitrary column width in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/columns

This example shows how to use arbitrary values in Tailwind CSS to apply a one-off `columns` style, such as `columns-[10rem]`, without modifying the theme configuration. This is useful for unique cases that don't warrant a custom theme entry. This requires Tailwind CSS.

```html
<div class="columns-[10rem]">
  <!-- ... -->
</div>
```

--------------------------------

### Set static prefix in Tailwind CSS `tailwind.config.js`

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS v3 no longer supports defining the class prefix as a function in `tailwind.config.js` due to changes in the new engine. The prefix must now be a static string that applies uniformly to all generated Tailwind classes.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
  prefix(selector) {
    // ...
  },
}
```

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
  prefix: 'tw-',
}
```

--------------------------------

### Use custom data attribute modifiers in HTML

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Apply custom data-* modifiers defined in the Tailwind config. This example uses a data-checked modifier to apply underline styling when the data-ui attribute contains checked.

```HTML
<div data-ui="checked active" class="data-checked:underline">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS Logical Padding Properties (ps-*, pe-*)

Source: https://v3.tailwindcss.com/docs/padding

Use `ps-*` and `pe-*` utilities to apply logical inline-start and inline-end padding to HTML elements. These classes dynamically map to left or right padding based on the current text direction (LTR or RTL), ensuring adaptable layouts.

```html
<div dir="ltr">
  <div class="ps-8 ...">ps-8</div>
  <div class="pe-8 ...">pe-8</div>
<div>

<div dir="rtl">
  <div class="ps-8 ...">ps-8</div>
  <div class="pe-8 ...">pe-8</div>
<div>
```

--------------------------------

### Apply Fixed Table Layout at Medium Breakpoint with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/table-layout

This example shows how to use a responsive breakpoint modifier, `md:table-fixed`, to apply the fixed table layout only at medium screen sizes and above. This allows for adaptive table layouts based on the device's viewport.

```html
<table class="md:table-fixed">
  <!-- ... -->
</table>
```

--------------------------------

### Configure Tailwind CSS Content Paths

Source: https://v3.tailwindcss.com/docs/guides/parcel

This 'tailwind.config.js' snippet configures Tailwind CSS to scan specified files (e.g., HTML, JS, JSX, TS, TSX) within the 'src' directory for utility classes. This enables Tailwind to generate only the necessary CSS, optimizing file size.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Set Border Color with Tailwind CSS Utilities

Source: https://v3.tailwindcss.com/docs/border-color

Apply border colors to elements using Tailwind CSS border-* utility classes. This example demonstrates setting border colors on input elements using the border-rose color palette.

```html
<input class="border-2 border-rose-600 ...">
<input class="border-2 border-rose-500 ...">
```

--------------------------------

### Set inline start margin to 1px using Tailwind CSS `ms-px`

Source: https://v3.tailwindcss.com/docs/margin

The Tailwind CSS utility class `ms-px` sets the CSS `margin-inline-start` property to `1px` for an element. This class is part of Tailwind's spacing scale and requires Tailwind CSS to be configured.

```html
<div class="ms-px">...</div>
```

```css
margin-inline-start: 1px;
```

--------------------------------

### Negative margin values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/margin

Apply negative margin values by prefixing the class name with a dash. Useful for overlapping elements or creating compact layouts. Example: -mt-8 applies negative top margin.

```html
<div class="w-36 h-16 bg-sky-400 opacity-20 ..."></div>
<div class="-mt-8 bg-sky-300 ...">-mt-8</div>
```

--------------------------------

### Use Tailwind CSS utility classes in a React component

Source: https://v3.tailwindcss.com/docs/guides/create-react-app

This React functional component ('App.js') demonstrates how to apply Tailwind CSS utility classes directly within JSX for styling. It renders a heading with large text, bold font, and an underline, showcasing the immediate effect of Tailwind's class-based styling.

```jsx
export default function App() {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}
```

--------------------------------

### Clear all floated elements with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/clear

Use the clear-both utility class to position an element below all preceding floated elements, regardless of float direction. This is the most comprehensive clear option and ensures content starts on a fresh line below any floated content.

```html
<article>
  <img class="float-left ..." src="path/to/image.jpg">
  <img class="float-right ..." src="path/to/image.jpg">
  <p class="clear-both ...">Maybe we can live without libraries...</p>
</article>
```

--------------------------------

### Set basic caret color with Tailwind CSS utility

Source: https://v3.tailwindcss.com/docs/caret-color

Apply a default caret color to an input element using a Tailwind CSS utility class. This example sets the caret color to `pink-500` on a `<textarea>` element.

```html
<textarea class="caret-pink-500 ..."></textarea>
```

--------------------------------

### Inject Tailwind's Core Styles with @tailwind

Source: https://v3.tailwindcss.com/docs/functions-and-directives

The `@tailwind` directive is used in CSS to inject Tailwind's essential styles, including base, components, utilities, and variants. It allows developers to control the order and placement of these core stylesheets within their project.

```css
/**
 * This injects Tailwind's base styles and any base styles registered by
 * plugins.
 */
@tailwind base;

/**
 * This injects Tailwind's component classes and any component classes
 * registered by plugins.
 */
@tailwind components;

/**
 * This injects Tailwind's utility classes and any utility classes registered
 * by plugins.
 */
@tailwind utilities;

/**
 * Use this directive to control where Tailwind injects the hover, focus,
 * responsive, dark mode, and other variants of each class.
 *
 * If omitted, Tailwind will append these classes to the very end of
 * your stylesheet by default.
 */
@tailwind variants;
```

--------------------------------

### Distribute Flex Items with Space Between in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/justify-content

This snippet demonstrates how to use `justify-between` in Tailwind CSS to distribute flex items, placing equal space between each item along the main axis. The first item is at the start, and the last item is at the end.

```html
<div class="flex justify-between ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>
```

--------------------------------

### Apply Blend Mode at Responsive Breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/mix-blend-mode

Use breakpoint variant modifiers like md: to apply blend mode utilities conditionally at specific screen sizes. This example applies mix-blend-overlay only at medium screen sizes and above.

```html
<div class="mix-blend-multiply md:mix-blend-overlay">
  <!-- ... -->
</div>
```

--------------------------------

### Apply CSS Variables in Tailwind CSS Typography Customization

Source: https://v3.tailwindcss.com/docs/typography-plugin

This example illustrates how to integrate CSS variables within your `tailwind.config.js` to define typography styles. By using `var(--color-gray-800)`, you can dynamically pull values from your theme configuration, ensuring consistent styling across your project.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--color-gray-800)',
            // ...
          },
        },
      },
    },
  },
}
```

--------------------------------

### Generate ESM or TypeScript Tailwind CSS Config via CLI

Source: https://v3.tailwindcss.com/docs/configuration

These commands allow you to explicitly generate a Tailwind CSS configuration file using either ES Module (`--esm`) or TypeScript (`--ts`) syntax. This ensures compatibility with modern JavaScript project setups and type-safe configurations.

```bash
npx tailwindcss init --esm
```

```bash
npx tailwindcss init --ts
```

--------------------------------

### Apply negative rotation values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/rotate

To apply a negative rotation value, prefix the `rotate-*` utility class with a dash. This converts the positive rotation into its negative counterpart. For example, `-rotate-45` will rotate an element by -45 degrees.

```html
<img class="-rotate-45 ...">
```

--------------------------------

### Add Additional Shades to Existing Tailwind Color

Source: https://v3.tailwindcss.com/docs/colors

Extends an existing Tailwind color by adding additional shades. This example adds a new shade (950) to the blue color palette without removing or overriding existing default shades.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        blue: {
          950: '#17275c',
        },
      }
    },
  },
}
```

--------------------------------

### Apply flex-initial Utility in Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/flex

This HTML snippet demonstrates the use of the `flex-initial` utility class in Tailwind CSS. It allows a flex item to shrink but not grow, considering its initial size, within a flex container.

```html
<div class="flex">
  <div class="flex-none w-14 ...">
    01
  </div>
  <div class="flex-initial w-64 ...">
    02
  </div>
  <div class="flex-initial w-32 ...">
    03
  </div>
</div>
```

--------------------------------

### Escape Font Names with Invalid Identifiers

Source: https://v3.tailwindcss.com/docs/font-family

Examples demonstrating three methods to handle font names with invalid identifiers in Tailwind configuration: wrapping in quotes, escaping spaces with backslash, or using alternative approaches to prevent configuration errors.

```javascript
{
  // Won't work:
  'sans': ['Exo 2', ...],

  // Add quotes:
  'sans': ['"Exo 2"', ...],

  // ...or escape the space:
  'sans': ['Exo\\ 2', ...],
}
```

--------------------------------

### Configure Tailwind CSS separator in `tailwind.config.js`

Source: https://v3.tailwindcss.com/docs/upgrade-guide

In Tailwind CSS v3, the dash (`-`) character can no longer be used as a custom separator in `tailwind.config.js` due to a parsing ambiguity. Users must switch to an alternative character, such as an underscore (`_`), for custom separators.

```javascript
module.exports = {
  // ...
  separator: '-',
  separator: '_',
}
```

--------------------------------

### Override Tailwind CSS Default `opacity` Values

Source: https://v3.tailwindcss.com/docs/theme

Explains how to completely replace the default values for a specific theme option, such as `opacity`, by defining it directly under the `theme` section in `tailwind.config.js`. This action removes all default opacity utilities and generates only those explicitly defined.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    // Replaces all of the default `opacity` values
    opacity: {
      '0': '0',
      '20': '0.2',
      '40': '0.4',
      '60': '0.6',
      '80': '0.8',
      '100': '1'
    }
  }
}
```

--------------------------------

### Customize Font Families in Tailwind Config

Source: https://v3.tailwindcss.com/docs/font-family

Configuration example for customizing the default font family utilities in tailwind.config.js. Demonstrates how to define custom font stacks for sans, serif, mono, display, and body font families using array format.

```javascript
module.exports = {
  theme: {
    fontFamily: {
      'sans': ['ui-sans-serif', 'system-ui', ...],
      'serif': ['ui-serif', 'Georgia', ...],
      'mono': ['ui-monospace', 'SFMono-Regular', ...],
      'display': ['Oswald', ...],
      'body': ['"Open Sans"', ...],
    }
  }
}
```

--------------------------------

### Apply Tailwind CSS ring offset conditionally at breakpoints in HTML

Source: https://v3.tailwindcss.com/docs/ring-offset-width

This example demonstrates how to use responsive variant modifiers like `md:ring-offset-4` to apply a `ring-offset` width based on screen size, ensuring the design adapts to different device breakpoints.

```html
<button class="ring-2 ring-offset-2 md:ring-offset-4">
  <!-- ... -->
</button>
```

--------------------------------

### Reference Theme Values Using Closure and theme() Function

Source: https://v3.tailwindcss.com/docs/theme

Generate utilities by referencing other theme values using a closure that receives a theme() function. The theme() function uses dot notation to look up values in the merged theme object recursively. This approach works only for top-level theme keys, not nested values within sections.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    spacing: {
      // ...
    },
    backgroundSize: ({ theme }) => ({
      auto: 'auto',
      cover: 'cover',
      contain: 'contain',
      ...theme('spacing')
    })
  }
}
```

--------------------------------

### Configure Tailwind CSS content paths in Qwik

Source: https://v3.tailwindcss.com/docs/guides/qwik

Update your `tailwind.config.js` file to include all relevant template paths where Tailwind CSS should scan for utility classes. This ensures that unused CSS is purged in production builds and necessary styles are generated.

```JavaScript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Apply responsive cursor styles using Tailwind CSS breakpoint variants

Source: https://v3.tailwindcss.com/docs/cursor

This snippet demonstrates applying cursor styles conditionally based on screen size using Tailwind CSS responsive variants. For example, `md:cursor-auto` ensures the cursor changes to 'auto' only on medium screens and larger, adapting the UI for different devices.

```html
<div class="cursor-not-allowed md:cursor-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Remove Dark Mode Configuration from tailwind.config.js

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Remove the `darkMode` key from tailwind.config.js if it's set to 'media' or 'false', as the 'media' strategy is now enabled by default in Tailwind CSS v3.0. Only keep this configuration if you're using the 'class' strategy.

```javascript
module.exports = {
  darkMode: 'media',
  // ...
}
```

```javascript
module.exports = {
  darkMode: false,
  // ...
}
```

--------------------------------

### Configure Tailwind CSS `borderRadius` Core Plugin

Source: https://v3.tailwindcss.com/docs/theme

Demonstrates how to customize the `borderRadius` core plugin within the `theme` section of `tailwind.config.js`. This configuration maps keys (suffixes) to specific CSS values, allowing the generation of custom border radius utility classes. Using `DEFAULT` as a key creates a class without a suffix.

```javascript
module.exports = {
  theme: {
    borderRadius: {
      'none': '0',
      'sm': '.125rem',
      DEFAULT: '.25rem',
      'lg': '.5rem',
      'full': '9999px'
    }
  }
}
```

```css
.rounded-none { border-radius: 0 }
.rounded-sm   { border-radius: .125rem }
.rounded      { border-radius: .25rem }
.rounded-lg   { border-radius: .5rem }
.rounded-full { border-radius: 9999px }
```

--------------------------------

### Apply visibility at breakpoints with Tailwind CSS variant modifiers

Source: https://v3.tailwindcss.com/docs/visibility

Tailwind CSS enables responsive visibility control using variant modifiers for breakpoints. For example, `md:invisible` will hide an element only on medium screens and larger, allowing for adaptive layouts.

```html
<div class="visible md:invisible">
  <!-- ... -->
</div>
```

--------------------------------

### Stylus screen() function with interpolation and parentheses

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Stylus requires the Tailwind screen() function to be wrapped in both interpolation and parentheses within media queries. This prevents Stylus errors and allows the media query to function properly, resulting in extra parentheses around the media query.

```stylus
@media ({'screen(md)'}) {
  .foo {
    color: blue;
  }
}
```

--------------------------------

### Apply Tailwind CSS `content` Utility on Hover State

Source: https://v3.tailwindcss.com/docs/content

This example shows how to conditionally apply a `content` utility based on an element's hover state using Tailwind CSS variant modifiers. It sets different pseudo-element content when the element is hovered over.

```html
<div class="before:content-['Not_Hovering'] hover:before:content-['Hovering']">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS `bg-clip` on hover state

Source: https://v3.tailwindcss.com/docs/background-clip

This HTML example shows how to conditionally apply a `bg-clip` utility based on the hover state using Tailwind CSS variant modifiers. The element will default to `bg-clip-border` and switch to `bg-clip-padding` when hovered over.

```html
<div class="bg-clip-border hover:bg-clip-padding">
  <!-- ... -->
</div>
```

--------------------------------

### Create Configurable Tailwind Plugin with withOptions API

Source: https://v3.tailwindcss.com/docs/plugins

Define a plugin that accepts user configuration options using plugin.withOptions. This API allows plugins to be customizable without requiring theme configuration, useful for class name customization or other non-theme-related settings.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = plugin.withOptions(function (options = {}) {
  return function({ addComponents }) {
    const className = options.className ?? 'markdown'

    addComponents({
      [`.${className}`]: {
        // ...
      }
    })
  }
}, function (options) {
  return {
    theme: {
      markdown: {
        // ...
      }
    },
  }
})
```

--------------------------------

### Apply Grid Flow with Responsive Breakpoint Modifier

Source: https://v3.tailwindcss.com/docs/grid-auto-flow

Use responsive breakpoint modifiers like md: to apply grid-flow utilities at specific screen sizes. Example applies grid-flow-col by default and switches to grid-flow-row at medium breakpoints and above.

```html
<div class="grid grid-flow-col md:grid-flow-row">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Blend Mode on Hover with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/mix-blend-mode

Use state variant modifiers like hover: to conditionally apply blend mode utilities in different states. This example changes the blend mode from multiply to overlay on hover.

```html
<div class="mix-blend-multiply hover:mix-blend-overlay">
  <!-- ... -->
</div>
```

--------------------------------

### Arbitrary Transition Timing Function Values

Source: https://v3.tailwindcss.com/docs/transition-timing-function

Demonstrates using square bracket notation to apply one-off cubic-bezier timing function values directly in HTML without adding them to the theme configuration. Useful for unique easing curves that don't warrant permanent theme customization.

```html
<div class="ease-[cubic-bezier(0.95,0.05,0.795,0.035)]">
  <!-- ... -->
</div>
```

--------------------------------

### Use negative `order` values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/order

This example illustrates how to apply negative `order` values in Tailwind CSS. Prefixing an `order` utility with a dash, such as `-order-1`, converts it to a negative value. This can be used to explicitly move an item to the beginning of a flex or grid container.

```html
<div class="-order-1">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Backdrop Opacity Values in HTML

Source: https://v3.tailwindcss.com/docs/backdrop-opacity

Generate one-off backdrop-opacity utilities using square bracket notation with arbitrary values. Useful for specific opacity values not defined in the theme configuration without modifying config files.

```html
<div class="backdrop-opacity-[.15]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Text Selection at Breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/user-select

Use responsive breakpoint modifiers to apply user-select utilities at specific screen sizes. For example, md:select-all applies the select-all utility only at medium screen sizes and above, enabling responsive text selection behavior.

```html
<div class="md:select-all">
  <!-- ... -->
</div>
```

--------------------------------

### Apply backdrop sepia at responsive breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/backdrop-sepia

Use responsive variant modifiers like md: to apply backdrop sepia utilities only at specific screen sizes. This example applies sepia on mobile but removes it at medium breakpoints and above.

```html
<div class="backdrop-sepia md:backdrop-sepia-0">
  <!-- Sepia on mobile, no sepia at medium screens and above -->
</div>
```

--------------------------------

### Apply Conditional Contrast on Hover with Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/contrast

This HTML example demonstrates how to apply a contrast utility (`contrast-150`) conditionally when an element is hovered over, using Tailwind CSS's `hover:` variant modifier. This allows for interactive visual feedback based on user input. Ensure Tailwind CSS is configured with variant modifiers enabled for states.

```html
<div class="contrast-125 hover:contrast-150">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Contrast Values in Tailwind CSS Configuration

Source: https://v3.tailwindcss.com/docs/contrast

This JavaScript code snippet shows how to extend the default Tailwind CSS theme to include custom contrast values. By modifying the `tailwind.config.js` file, you can add new `contrast` levels, like `.25` in this example, making them available as utility classes (e.g., `contrast-25`). This requires editing your project's `tailwind.config.js`.

```javascript
module.exports = {
  theme: {
    extend: {
      contrast: {
        25: '.25'
      }
    }
  }
}
```

--------------------------------

### Apply arbitrary `min-w` value in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/min-width

This HTML example illustrates the use of arbitrary values in Tailwind CSS to apply a one-off `min-width` value, `min-w-[220px]`, directly within the class attribute without needing to modify the theme configuration.

```html
<div class="min-w-[220px]">
  <!-- ... -->
</div>
```

--------------------------------

### Setting independent row and column gaps with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/gap

Control row and column spacing independently using gap-x-* (column-gap) and gap-y-* (row-gap) utilities. This example creates a 3-column grid with 32px horizontal gap (gap-x-8) and 16px vertical gap (gap-y-4). Allows fine-grained spacing control for complex layouts.

```html
<div class="grid gap-x-8 gap-y-4 grid-cols-3">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>
```

--------------------------------

### Rename @tailwind screens to @tailwind variants

Source: https://v3.tailwindcss.com/docs/upgrade-guide

In Tailwind CSS v3.0, the @tailwind screens layer has been renamed to @tailwind variants. Update your CSS files to use the new directive name to ensure responsive and other variant utilities work correctly.

```css
/* ... */
@tailwind variants;
```

--------------------------------

### Apply arbitrary grid column values in HTML

Source: https://v3.tailwindcss.com/docs/grid-column

This HTML snippet demonstrates how to use arbitrary values for grid column properties directly in your markup. It applies a `col-[16_/_span_16]` class, allowing for one-off grid column configurations without modifying the theme configuration.

```html
<div class="col-[16_/_span_16]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply responsive border style with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/border-style

This example demonstrates how to apply a border style conditionally based on screen size using responsive breakpoints in Tailwind CSS. The `md:border-dotted` utility class changes the border to dotted only on medium screens and above.

```HTML
<div class="border-solid md:border-dotted">
  <!-- ... -->
</div>
```

--------------------------------

### Conditionally Apply Tailwind CSS Padding with Breakpoints

Source: https://v3.tailwindcss.com/docs/padding

Conditionally apply Tailwind CSS padding utilities based on responsive breakpoints. This example uses the `md:` variant modifier to apply specific vertical padding only when the screen size is medium or larger.

```html
<div class="py-4 md:py-8">
  <!-- ... -->
</div>
```

--------------------------------

### Alternative Spacing Solution Using Flow Root and Negative Margin

Source: https://v3.tailwindcss.com/docs/space

For complex layouts like grids or wrapping elements, use flow-root with negative margin on parent and positive margin on children instead of space utilities. This provides better control when children are in non-natural DOM order.

```html
<div class="flow-root">
  <div class="-m-2 flex flex-wrap">
    <div class="m-2 ..."></div>
    <div class="m-2 ..."></div>
    <div class="m-2 ..."></div>
  </div>
</div>
```

--------------------------------

### Use Arbitrary Background Size Value in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-size

Generate a one-off background-size property using square bracket notation with arbitrary values when a predefined utility doesn't exist. This example sets a custom background size of 200px width by 100px height using the bg-[length:200px_100px] syntax.

```html
<div class="bg-[length:200px_100px]">
  <!-- ... -->
</div>
```

--------------------------------

### Set inline start margin to 0px using Tailwind CSS `ms-0`

Source: https://v3.tailwindcss.com/docs/margin

The Tailwind CSS utility class `ms-0` sets the CSS `margin-inline-start` property to `0px` for an element. This class is part of Tailwind's spacing scale and requires Tailwind CSS to be configured.

```html
<div class="ms-0">...</div>
```

```css
margin-inline-start: 0px;
```

--------------------------------

### Configure Custom supports Rules in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Demonstrates configuring custom `@supports` shortcuts in the Tailwind CSS configuration file. Allows creating reusable support modifiers like `supports-grid` for cleaner class names in templates.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    supports: {
      grid: 'display: grid',
    },
  },
}
```

--------------------------------

### Stacking Tailwind CSS Modifiers for Complex Conditions (HTML)

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Demonstrates how to combine multiple Tailwind CSS modifiers to target highly specific conditions. This example applies a background color (`bg-fuchsia-600`) only when in dark mode, at the medium breakpoint, and on hover.

```html
<button class="dark:md:hover:bg-fuchsia-600 ...">
  Save changes
</button>
```

--------------------------------

### Apply Arbitrary Animation Values in HTML

Source: https://v3.tailwindcss.com/docs/animation

Uses Tailwind's arbitrary value syntax to apply a one-off animation directly in HTML without modifying the theme configuration. The square bracket notation allows inline specification of custom animation values, including the keyframe name, duration, timing function, and iteration count.

```html
<div class="animate-[wiggle_1s_ease-in-out_infinite]">
  <!-- ... -->
</div>
```

--------------------------------

### Arbitrary margin values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/margin

Generate custom margin values on-the-fly using square bracket notation without modifying your theme configuration. Example: m-[5px] applies a one-off 5px margin value when standard utilities don't fit your needs.

```html
<div class="m-[5px]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply hover state variant to isolation utilities in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/isolation

Use the hover: variant modifier to conditionally apply isolation utility classes only when the element is hovered. This example demonstrates applying isolation-auto on hover while maintaining isolate by default.

```html
<div class="isolate hover:isolation-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Tailwind CSS Theme with `tailwind.config.js`

Source: https://v3.tailwindcss.com/docs/configuration

This snippet demonstrates how to extend Tailwind CSS's default theme in `tailwind.config.js`. It shows examples of defining custom colors, font families, spacing, and border radius, allowing developers to tailor the UI framework to project-specific design systems.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js}'],
  theme: {
    colors: {
      'blue': '#1fb6ff',
      'purple': '#7e5bef',
      'pink': '#ff49db',
      'orange': '#ff7849',
      'green': '#13ce66',
      'yellow': '#ffc82c',
      'gray-dark': '#273444',
      'gray': '#8492a6',
      'gray-light': '#d3dce6',
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      spacing: {
        '8xl': '96rem',
        '9xl': '128rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
}
```

--------------------------------

### Tailwind CSS `border-s-stone-600` Utility Class

Source: https://v3.tailwindcss.com/docs/border-color

Sets the `border-inline-start-color` property to a stone-600 shade using the `border-s-stone-600` Tailwind CSS utility class. This applies the specified color to the logical start edge of an element, respecting writing direction modes.

```css
border-inline-start-color: rgb(87 83 78 / var(--tw-border-opacity, 1));
```

--------------------------------

### Set column gap in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/columns

This example demonstrates how to use Tailwind CSS `gap-x` utilities in conjunction with `columns-N` to control the horizontal spacing between columns within an element. This allows for precise control over the visual separation of content. This requires Tailwind CSS.

```html
<div class="gap-8 columns-3 ...">
  <img class="w-full aspect-video ..." src="..." />
  <img class="w-full aspect-square ..." src="..." />
  <!-- ... -->
</div>
```

--------------------------------

### Stylus theme() function as @apply alternative

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Instead of using @apply in Stylus, the theme() function can be used to access Tailwind configuration values and write CSS properties in long form. This approach works without @css blocks and allows Stylus features to be used.

```stylus
.card {
  border-radius: theme('borderRadius.lg');
  background-color: theme('colors.white');
  padding: theme('spacing.4');
}
```

--------------------------------

### Responsive Scroll Padding with Breakpoint Modifier in HTML

Source: https://v3.tailwindcss.com/docs/scroll-padding

Shows how to use media query variant modifiers to apply scroll padding conditionally at different breakpoints. This example applies scroll-p-8 by default and changes to scroll-p-0 at medium screen sizes and above using the md: modifier.

```html
<div class="scroll-p-8 md:scroll-p-0">
  <!-- ... -->
</div>
```

--------------------------------

### Reference HTML Attribute Values in Tailwind CSS `content`

Source: https://v3.tailwindcss.com/docs/content

This example illustrates how to dynamically set pseudo-element content by referencing an HTML attribute's value using CSS's `attr()` function within Tailwind's arbitrary value syntax. This allows for content to be derived directly from the element's data.

```html
<div before="Hello World" class="before:content-[attr(before)]">
  <!-- ... -->
</div>
```

--------------------------------

### Responsive Breakpoint Modifier for Space Utilities

Source: https://v3.tailwindcss.com/docs/space

Use breakpoint prefixes like md: to apply space utilities at specific screen sizes. This enables responsive spacing that adapts to different device widths.

```html
<div class="flex space-x-2 md:space-x-8">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Custom Presets in Tailwind CSS Configuration

Source: https://v3.tailwindcss.com/docs/configuration

This configuration shows how to include a custom base configuration using the `presets` array in `tailwind.config.js`. Presets allow developers to define and reuse a foundational set of Tailwind configurations across multiple projects, often followed by project-specific customizations.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
  presets: [
    require('@acmecorp/base-tailwind-config')
  ],

  // Project-specific customizations
  theme: {
    //...
  }
}
```

--------------------------------

### Add @font-face Rules for Custom Fonts in CSS

Source: https://v3.tailwindcss.com/docs/font-family

CSS example showing how to include @font-face rules within the @layer base directive in app.css to load custom fonts (e.g., Roboto) for use in Tailwind configuration, ensuring fonts are available to the browser.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(/fonts/Roboto.woff2) format('woff2');
  }
}
```

--------------------------------

### Add Manual !important to Component Declarations

Source: https://v3.tailwindcss.com/docs/plugins

Shows how to manually add !important flags to component styles when necessary by appending !important to individual CSS properties within the plugin's addComponents configuration.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addComponents }) {
      addComponents({
        '.btn': {
          padding: '.5rem 1rem !important',
          borderRadius: '.25rem !important',
          fontWeight: '600 !important',
        },
        // ...
      })
    })
  ]
}
```

--------------------------------

### Apply Backdrop Hue Rotate with HTML

Source: https://v3.tailwindcss.com/docs/backdrop-hue-rotate

Use backdrop-hue-rotate utility classes to rotate the hue of an element's backdrop. The example demonstrates applying different hue rotation values (90deg, 180deg, and -60deg) to elements with semi-transparent white backgrounds.

```html
<div class="backdrop-hue-rotate-90 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-hue-rotate-180 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="-backdrop-hue-rotate-60 bg-white/30 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Use arbitrary grid row values in HTML

Source: https://v3.tailwindcss.com/docs/grid-row

Apply one-off grid row values directly in HTML using square bracket notation without defining them in your theme configuration. This approach is useful for unique values that don't warrant adding to your theme, such as custom span configurations.

```html
<div class="row-[span_16_/_span_16]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply backdrop sepia on hover with Tailwind CSS variants

Source: https://v3.tailwindcss.com/docs/backdrop-sepia

Use state variant modifiers like hover: to conditionally apply backdrop sepia utilities only in specific states. This example applies backdrop-sepia by default and changes to backdrop-sepia-0 on hover.

```html
<div class="backdrop-sepia hover:backdrop-sepia-0">
  <!-- Sepia by default, no sepia on hover -->
</div>
```

--------------------------------

### Arbitrary Flex Shrink Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/flex-shrink

Illustrates using arbitrary values with square bracket notation to apply one-off flex-shrink values without modifying the theme configuration. The `shrink-[2]` syntax generates inline flex-shrink: 2 styles for unique use cases.

```html
<div class="shrink-[2]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Responsive Text Indent with Tailwind CSS Breakpoints

Source: https://v3.tailwindcss.com/docs/text-indent

This HTML example demonstrates applying responsive text indentation using Tailwind CSS breakpoint modifiers. The `indent-4` class sets a default indent, and `md:indent-8` overrides it with a larger indent for medium screen sizes and above, adapting the layout to different viewport widths.

```HTML
<div class="indent-4 md:indent-8">
  <!-- ... -->
</div>
```

--------------------------------

### Output of Unprefixed Custom Utility and Variants

Source: https://v3.tailwindcss.com/docs/configuration

This CSS output demonstrates the generated classes for a custom utility defined without a prefix. It shows that both the base utility and its variants (e.g., hover) will not have the Tailwind CSS prefix applied.

```css
.bg-brand-gradient { /* ... */ }
.hover\:bg-brand-gradient:hover { /* ... */ }
```

--------------------------------

### Inline Tailwind Utilities with @apply for Custom Styles

Source: https://v3.tailwindcss.com/docs/functions-and-directives

The `@apply` directive is used to inline existing Tailwind utility classes directly into custom CSS rules. This is particularly useful for extending or overriding styles for third-party libraries while maintaining consistency with Tailwind's design tokens.

```css
.select2-dropdown {
  @apply rounded-b-lg shadow-md;
}
.select2-search {
  @apply border border-gray-300 rounded;
}
.select2-results__group {
  @apply text-lg font-bold text-gray-900;
}
```

--------------------------------

### Tailwind CSS Hyphens with Responsive Breakpoint Modifier

Source: https://v3.tailwindcss.com/docs/hyphens

Uses responsive variant modifiers to apply different hyphens utilities at specific screen sizes. This example applies hyphens-none by default and switches to hyphens-auto at medium screen sizes and above, enabling adaptive text hyphenation for different viewport widths.

```html
<p class="hyphens-none md:hyphens-auto">
  <!-- ... -->
</p>
```

--------------------------------

### Conditionally apply Tailwind CSS `whitespace-pre` on hover state

Source: https://v3.tailwindcss.com/docs/whitespace

This example demonstrates how to use Tailwind CSS variant modifiers to apply a `whitespace` utility class conditionally. Here, `hover:whitespace-pre` applies the `whitespace-pre` behavior only when the element is hovered, reverting to `whitespace-normal` otherwise.

```html
<div class="whitespace-normal hover:whitespace-pre">
  <!-- ... -->
</div>
```

--------------------------------

### Extend Tailwind CSS with multiple presets

Source: https://v3.tailwindcss.com/docs/presets

The `presets` option accepts an array, enabling the inclusion of multiple reusable configuration chunks. This allows for modular organization of customizations like colors, fonts, and spacing, with the last configuration winning in case of overlaps.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('@acmecorp/tailwind-colors'),
    require('@acmecorp/tailwind-fonts'),
    require('@acmecorp/tailwind-spacing'),
  ]
}
```

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('@acmecorp/configuration-a'),
    require('@acmecorp/configuration-b'),
  ]
}
```

--------------------------------

### Apply Tailwind CSS utilities in a Gatsby React component

Source: https://v3.tailwindcss.com/docs/guides/gatsby

Demonstrates how to use Tailwind's utility classes directly within your React components in Gatsby. This example applies 'text-3xl', 'font-bold', and 'underline' classes to an `<h1>` element, showcasing how to style content efficiently.

```Javascript
export default function IndexPage() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold underline">
        Hello world!
      </h1>
    </Layout>
  )
}

```

--------------------------------

### Safelist Tailwind Classes in Configuration

Source: https://v3.tailwindcss.com/docs/content-configuration

Force Tailwind to generate specific class names that may not appear in scanned content files using the safelist option. This is a last-resort approach for user-generated content scenarios where certain Tailwind classes must always be available.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js}',
    './components/**/*.{html,js}',
  ],
  safelist: [
    'bg-red-500',
    'text-3xl',
    'lg:text-4xl',
  ],
  // ...
}
```

--------------------------------

### Conditionally apply Tailwind CSS object-scale-down on hover

Source: https://v3.tailwindcss.com/docs/object-fit

This example demonstrates applying `object-scale-down` conditionally using a variant modifier. The `object-contain` class is applied by default, and `hover:object-scale-down` takes effect only when the element is hovered over. This allows for interactive content resizing.

```html
<img class="object-contain hover:object-scale-down">
```

--------------------------------

### Compile CSS using a Custom Tailwind CSS Configuration File

Source: https://v3.tailwindcss.com/docs/configuration

When using a custom-named Tailwind CSS configuration file, this command demonstrates how to explicitly specify its path during CSS compilation. The `-c` flag points to your alternative config file, ensuring Tailwind processes the correct settings.

```bash
npx tailwindcss -c ./tailwindcss-config.js -i input.css -o output.css
```

--------------------------------

### Responsive Layout with portrait and landscape Modifiers

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Uses `portrait` and `landscape` modifiers to conditionally display different content based on device orientation. This example shows landscape-specific content and hides it in portrait mode, with a rotation prompt for portrait users.

```html
<div>
  <div class="portrait:hidden">
    <!-- ... -->
  </div>
  <div class="landscape:hidden">
    <p>
      This experience is designed to be viewed in landscape. Please rotate your
      device to view the site.
    </p>
  </div>
</div>
```

--------------------------------

### Apply Height Utilities at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/height

Use responsive breakpoint modifiers like md: to conditionally apply height utilities at specific screen sizes. For example, md:h-full applies the h-full utility only at medium screen sizes and above, enabling responsive design patterns.

```html
<div class="h-8 md:h-full">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Utility-First Chat Notification Component

Source: https://v3.tailwindcss.com/docs/utility-first

A chat notification component built using Tailwind CSS utility classes applied directly to HTML elements. Demonstrates the utility-first approach where styling is achieved by composing predefined utility classes for layout, spacing, typography, colors, and effects without writing custom CSS.

```html
<div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center gap-x-4">
  <div class="shrink-0">
    <img class="size-12" src="/img/logo.svg" alt="ChitChat Logo">
  </div>
  <div>
    <div class="text-xl font-medium text-black">ChitChat</div>
    <p class="text-slate-500">You have a new message!</p>
  </div>
</div>
```

--------------------------------

### Apply `auto-cols-max` for Grid Auto Columns in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/grid-auto-columns

Demonstrates the basic usage of Tailwind CSS `auto-cols-*` utilities to control the size of implicitly-created grid columns. This example sets the column size to `max-content` for all automatically generated columns within a grid.

```html
<div class="grid grid-flow-col auto-cols-max">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>
```

--------------------------------

### Change Tailwind CSS ring offset color in HTML

Source: https://v3.tailwindcss.com/docs/ring-offset-width

This example shows how to use `ring-offset-slate-50` and `dark:ring-offset-slate-900` utilities to customize the color of the ring offset, making it match the parent background, especially useful for dark mode compatibility.

```html
<button class="ring ring-pink-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 ...">
  Save Changes
</button>
```

--------------------------------

### Apply Tailwind CSS columns at specific breakpoints

Source: https://v3.tailwindcss.com/docs/columns

This example shows how to use responsive variant modifiers to apply Tailwind CSS column utilities based on screen sizes. The `md:columns-3` class will set 3 columns for medium screens and larger, adapting the layout for different devices. This requires Tailwind CSS.

```html
<div class="columns-2 md:columns-3">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Conditional Contrast at Breakpoints with Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/contrast

This HTML snippet illustrates applying a contrast utility (`contrast-150`) conditionally based on screen size, using Tailwind CSS's responsive `md:` breakpoint modifier. The `contrast-125` is applied by default, and `contrast-150` takes effect on medium screens and above. This enables responsive design for visual effects.

```html
<div class="contrast-125 md:contrast-150">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Hover Modifier to Background Color in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Basic example of using the hover modifier to change an element's background color on mouse hover. Changes background from black to white when the user hovers over the element.

```html
<div class="bg-black hover:bg-white ...">
  <!-- ... -->
</div>
```

--------------------------------

### Set Accent Color Opacity with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/accent-color

This HTML example shows how to set the opacity of an accent color using Tailwind CSS, specifically `accent-emerald-500/25`. Note that `rgba()` alpha values for accent colors are primarily supported in Firefox.

```html
<input type="checkbox" class="accent-emerald-500/25" checked> Emerald
```

--------------------------------

### Apply Backdrop Contrast to Elements in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/backdrop-contrast

Demonstrates the basic usage of `backdrop-contrast-*` utilities to control the contrast level of an element's backdrop. These classes apply CSS `backdrop-filter: contrast()` properties directly to the element.

```html
<div class="backdrop-contrast-50 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-contrast-125 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-contrast-200 bg-white/30 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Tailwind CSS ring offset width in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/ring-offset-width

This configuration example shows how to extend the default Tailwind CSS theme by adding custom `ringOffsetWidth` values in `tailwind.config.js`, allowing developers to define bespoke offset sizes beyond the default set.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      ringOffsetWidth: {
        '3': '3px',
        '6': '6px',
        '10': '10px'
      }
    }
  }
}
```

--------------------------------

### Apply Backdrop Hue Rotate at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/backdrop-hue-rotate

Use media query variant modifiers like md: to apply different backdrop-hue-rotate values at specific responsive breakpoints. This example applies one value by default and another at medium screen sizes and above.

```html
<div class="backdrop-hue-rotate-15 md:backdrop-hue-rotate-60">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS place-items Responsively at Breakpoints

Source: https://v3.tailwindcss.com/docs/place-items

Illustrates how to use responsive modifiers to apply `place-items` utilities at specific screen sizes. The `md:place-items-center` class ensures that grid items are centered only on medium screens and larger, providing a responsive layout.

```html
<div class="grid place-items-start md:place-items-center">
  <!-- ... -->
</div>
```

--------------------------------

### Conditionally style based on text direction using RTL and LTR modifiers

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Use rtl and ltr modifiers to apply different styles for right-to-left and left-to-right layouts. This example applies different margin directions based on the document direction.

```HTML
<div class="group flex items-center">
  <img class="shrink-0 h-12 w-12 rounded-full" src="..." alt="" />
  <div class="ltr:ml-3 rtl:mr-3">
    <p class="text-sm font-medium text-slate-700 group-hover:text-slate-900">...</p>
    <p class="text-sm font-medium text-slate-500 group-hover:text-slate-700">...</p>
  </div>
</div>
```

--------------------------------

### Apply Arbitrary Tailwind CSS `grid-auto-rows` Value

Source: https://v3.tailwindcss.com/docs/grid-auto-rows

This HTML example demonstrates using arbitrary values for Tailwind CSS `grid-auto-rows` utilities. The `auto-rows-[minmax(0,_2fr)]` syntax allows applying a custom `grid-auto-rows` value directly in the HTML, without modifying the theme configuration. This is ideal for one-off styles that don't warrant a new theme entry.

```html
<div class="grid grid-flow-row auto-rows-[minmax(0,_2fr)]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply ARIA styles to parent elements using group-aria modifier

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Use group-aria-* modifiers to style child elements based on ARIA attributes of their parent. This example rotates an SVG based on the parent's aria-sort attribute.

```HTML
<table>
  <thead>
    <tr>
    <th aria-sort="ascending" class="group">
      Invoice #
      <svg class="group-aria-[sort=ascending]:rotate-0 group-aria-[sort=descending]:rotate-180"><!-- ... --></svg>
    </th>
    <!-- ... -->
    </tr>
  </thead>
  <!-- ... -->
</table>
```

--------------------------------

### Apply Arbitrary Text Indent Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-indent

This HTML example illustrates the use of arbitrary values for text indentation in Tailwind CSS. By using square brackets (e.g., `indent-[50%]`), developers can apply any valid CSS `text-indent` value directly as a utility class, useful for one-off styles that don't fit the predefined theme.

```HTML
<div class="indent-[50%]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Arbitrary Transform Origin Value

Source: https://v3.tailwindcss.com/docs/transform-origin

Use Tailwind CSS arbitrary value syntax with square brackets to apply one-off transform-origin values that are not defined in the theme configuration. This example applies a custom origin of '33% 75%' using the origin-[33%_75%] class.

```html
<div class="origin-[33%_75%]">
  <!-- ... -->
</div>
```

--------------------------------

### Use Responsive Breakpoint Modifier for Border Width in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/border-width

Apply border-width utilities conditionally at specific responsive breakpoints using media query variant modifiers. This example uses the md: prefix to apply border-t-4 only at medium screen sizes and above.

```html
<div class="border-2 md:border-t-4">
  <!-- ... -->
</div>
```

--------------------------------

### Show Repeated Tailwind CSS Classes for Navigation in HTML

Source: https://v3.tailwindcss.com/docs/reusing-styles

This HTML code snippet illustrates a navigation component where multiple anchor elements share identical sets of Tailwind CSS utility classes for styling. It serves as an example where localized duplication occurs within a single file, suggesting that multi-cursor editing could be an efficient solution for bulk style updates.

```html
<nav class="flex justify-center space-x-4">
  <a href="/dashboard" class="font-medium px-3 py-2 text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900">Home</a>
  <a href="/team" class="font-medium px-3 py-2 text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900">Team</a>
  <a href="/projects" class="font-medium px-3 py-2 text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900">Projects</a>
  <a href="/reports" class="font-medium px-3 py-2 text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900">Reports</a>
</nav>
```

--------------------------------

### Use arbitrary background position values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-position

HTML example demonstrating Tailwind CSS arbitrary value syntax using square brackets to generate one-off background-position values not defined in the theme. The bg-[center_top_1rem] class applies a custom background position inline without requiring theme configuration.

```html
<div class="bg-[center_top_1rem]">
  <!-- ... -->
</div>
```

--------------------------------

### Style ::before pseudo-element with skew effect using Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Create a skewed background highlight effect behind text using the before modifier with absolute positioning, skew transformation, and background color. This example demonstrates using pseudo-elements for decorative backgrounds that should not be selectable.

```html
<blockquote class="text-2xl font-semibold italic text-center text-slate-900">
  When you look
  <span class="before:block before:absolute before:-inset-1 before:-skew-y-3 before:bg-pink-500 relative inline-block">
    <span class="relative text-white">annoyed</span>
  </span>
  all the time, people think that you're busy.
</blockquote>
```

--------------------------------

### Apply Responsive Width Classes with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/responsive-design

This example demonstrates how to apply different width utilities based on screen size using Tailwind CSS responsive prefixes. An image's width is set to 16 by default, then changes to 32 on medium screens, and 48 on large screens, illustrating conditional styling without leaving HTML.

```html
<!-- Width of 16 by default, 32 on medium screens, and 48 on large screens -->
<img class="w-16 md:w-32 lg:w-48" src="...">
```

--------------------------------

### Use arbitrary cursor values directly in Tailwind CSS classes

Source: https://v3.tailwindcss.com/docs/cursor

This example shows how to apply one-off, arbitrary cursor values directly within an HTML class using Tailwind CSS's square bracket syntax. This is useful for custom cursor styles that are not part of the theme and are only needed in a specific instance.

```html
<div class="cursor-[url(hand.cur),_pointer]">
  <!-- ... -->
</div>
```

--------------------------------

### Applying Conditional Ring Widths at Breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/ring-width

This example illustrates how to apply `ring-*` utilities conditionally based on screen size using Tailwind CSS responsive breakpoints. The `md:ring-4` class ensures the ring width is applied only at medium screen sizes and above, adapting to different device views.

```html
<div class="ring-2 md:ring-4">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Border Inline Start Color Utilities Reference

Source: https://v3.tailwindcss.com/docs/border-color

Collection of Tailwind CSS utility classes for setting the border-inline-start-color property with predefined color palettes. Each utility applies a specific RGB color value with CSS variable support for dynamic opacity adjustment via --tw-border-opacity. These utilities enable directional border styling that respects text direction and writing modes.

```css
.border-s-cyan-700 {
  border-inline-start-color: rgb(14 116 144 / var(--tw-border-opacity, 1));
}

.border-s-cyan-800 {
  border-inline-start-color: rgb(21 94 117 / var(--tw-border-opacity, 1));
}

.border-s-cyan-900 {
  border-inline-start-color: rgb(22 78 99 / var(--tw-border-opacity, 1));
}

.border-s-cyan-950 {
  border-inline-start-color: rgb(8 51 68 / var(--tw-border-opacity, 1));
}

.border-s-sky-50 {
  border-inline-start-color: rgb(240 249 255 / var(--tw-border-opacity, 1));
}

.border-s-sky-100 {
  border-inline-start-color: rgb(224 242 254 / var(--tw-border-opacity, 1));
}

.border-s-sky-200 {
  border-inline-start-color: rgb(186 230 253 / var(--tw-border-opacity, 1));
}

.border-s-sky-300 {
  border-inline-start-color: rgb(125 211 252 / var(--tw-border-opacity, 1));
}

.border-s-sky-400 {
  border-inline-start-color: rgb(56 189 248 / var(--tw-border-opacity, 1));
}

.border-s-sky-500 {
  border-inline-start-color: rgb(14 165 233 / var(--tw-border-opacity, 1));
}

.border-s-sky-600 {
  border-inline-start-color: rgb(2 132 199 / var(--tw-border-opacity, 1));
}

.border-s-sky-700 {
  border-inline-start-color: rgb(3 105 161 / var(--tw-border-opacity, 1));
}

.border-s-sky-800 {
  border-inline-start-color: rgb(7 89 133 / var(--tw-border-opacity, 1));
}

.border-s-sky-900 {
  border-inline-start-color: rgb(12 74 110 / var(--tw-border-opacity, 1));
}

.border-s-sky-950 {
  border-inline-start-color: rgb(8 47 73 / var(--tw-border-opacity, 1));
}

.border-s-blue-50 {
  border-inline-start-color: rgb(239 246 255 / var(--tw-border-opacity, 1));
}

.border-s-blue-100 {
  border-inline-start-color: rgb(219 234 254 / var(--tw-border-opacity, 1));
}

.border-s-blue-200 {
  border-inline-start-color: rgb(191 219 254 / var(--tw-border-opacity, 1));
}

.border-s-blue-300 {
  border-inline-start-color: rgb(147 197 253 / var(--tw-border-opacity, 1));
}

.border-s-blue-400 {
  border-inline-start-color: rgb(96 165 250 / var(--tw-border-opacity, 1));
}

.border-s-blue-500 {
  border-inline-start-color: rgb(59 130 246 / var(--tw-border-opacity, 1));
}

.border-s-blue-600 {
  border-inline-start-color: rgb(37 99 235 / var(--tw-border-opacity, 1));
}

.border-s-blue-700 {
  border-inline-start-color: rgb(29 78 216 / var(--tw-border-opacity, 1));
}

.border-s-blue-800 {
  border-inline-start-color: rgb(30 64 175 / var(--tw-border-opacity, 1));
}

.border-s-blue-900 {
  border-inline-start-color: rgb(30 58 138 / var(--tw-border-opacity, 1));
}

.border-s-blue-950 {
  border-inline-start-color: rgb(23 37 84 / var(--tw-border-opacity, 1));
}

.border-s-indigo-50 {
  border-inline-start-color: rgb(238 242 255 / var(--tw-border-opacity, 1));
}

.border-s-indigo-100 {
  border-inline-start-color: rgb(224 231 255 / var(--tw-border-opacity, 1));
}

.border-s-indigo-200 {
  border-inline-start-color: rgb(199 210 254 / var(--tw-border-opacity, 1));
}

.border-s-indigo-300 {
  border-inline-start-color: rgb(165 180 252 / var(--tw-border-opacity, 1));
}

.border-s-indigo-400 {
  border-inline-start-color: rgb(129 140 248 / var(--tw-border-opacity, 1));
}

.border-s-indigo-500 {
  border-inline-start-color: rgb(99 102 241 / var(--tw-border-opacity, 1));
}

.border-s-indigo-600 {
  border-inline-start-color: rgb(79 70 229 / var(--tw-border-opacity, 1));
}

.border-s-indigo-700 {
  border-inline-start-color: rgb(67 56 202 / var(--tw-border-opacity, 1));
}

.border-s-indigo-800 {
  border-inline-start-color: rgb(55 48 163 / var(--tw-border-opacity, 1));
}

.border-s-indigo-900 {
  border-inline-start-color: rgb(49 46 129 / var(--tw-border-opacity, 1));
}

.border-s-indigo-950 {
  border-inline-start-color: rgb(30 27 75 / var(--tw-border-opacity, 1));
}

.border-s-violet-50 {
  border-inline-start-color: rgb(245 243 255 / var(--tw-border-opacity, 1));
}

.border-s-violet-100 {
  border-inline-start-color: rgb(237 233 254 / var(--tw-border-opacity, 1));
}

.border-s-violet-200 {
  border-inline-start-color: rgb(221 214 254 / var(--tw-border-opacity, 1));
}

.border-s-violet-300 {
  border-inline-start-color: rgb(196 181 253 / var(--tw-border-opacity, 1));
}

.border-s-violet-400 {
  border-inline-start-color: rgb(167 139 250 / var(--tw-border-opacity, 1));
}

.border-s-violet-500 {
  border-inline-start-color: rgb(139 92 246 / var(--tw-border-opacity, 1));
}

.border-s-violet-600 {
  border-inline-start-color: rgb(124 58 237 / var(--tw-border-opacity, 1));
}

.border-s-violet-700 {
  border-inline-start-color: rgb(109 40 217 / var(--tw-border-opacity, 1));
}

.border-s-violet-800 {
  border-inline-start-color: rgb(91 33 182 / var(--tw-border-opacity, 1));
}

.border-s-violet-900 {
  border-inline-start-color: rgb(76 29 149 / var(--tw-border-opacity, 1));
}

.border-s-violet-950 {
  border-inline-start-color: rgb(46 16 101 / var(--tw-border-opacity, 1));
}

.border-s-purple-50 {
  border-inline-start-color: rgb(250 245 255 / var(--tw-border-opacity, 1));
}

.border-s-purple-100 {
  border-inline-start-color: rgb(243 232 255 / var(--tw-border-opacity, 1));
}
```

--------------------------------

### Apply transition delay utilities in HTML

Source: https://v3.tailwindcss.com/docs/transition-delay

Use the delay-* utility classes to control an element's transition-delay property. Combine with transition and duration utilities for complete transition control. Classes range from delay-0 (0s) to delay-1000 (1000ms).

```html
<button class="transition delay-150 duration-300 ease-in-out ...">Button A</button>
<button class="transition delay-300 duration-300 ease-in-out ...">Button B</button>
<button class="transition delay-700 duration-300 ease-in-out ...">Button C</button>
```

--------------------------------

### Use Arbitrary Brightness Values

Source: https://v3.tailwindcss.com/docs/brightness

Generate brightness utilities on-the-fly using square brackets notation with arbitrary values. Use brightness-[value] syntax to apply custom brightness values that are not defined in your theme configuration.

```html
<div class="brightness-[1.75]">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Border Spacing Scale in Tailwind Config

Source: https://v3.tailwindcss.com/docs/border-spacing

Customizes only the border spacing scale without affecting other spacing utilities. This allows fine-grained control over border spacing values specifically. The example adds a '13' border spacing unit set to 3.25rem.

```javascript
module.exports = {
  theme: {
    extend: {
      borderSpacing: {
        '13': '3.25rem'
      }
    }
  }
}
```

--------------------------------

### Apply Flex Basis on Hover State in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/flex-basis

Use hover variant modifier with basis utilities to conditionally apply flex basis changes on hover interaction. This example applies basis-1/2 only when the element is hovered, allowing dynamic responsive behavior.

```html
<div class="basis-1/3 hover:basis-1/2">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Backdrop Opacity with Responsive Breakpoint Modifier

Source: https://v3.tailwindcss.com/docs/backdrop-opacity

Use responsive variant modifiers like md: to apply backdrop-opacity utilities at specific screen sizes and above. Enables adaptive styling for different device sizes without media query syntax.

```html
<div class="backdrop-opacity-100 md:backdrop-opacity-60">
  <!-- ... -->
</div>
```

--------------------------------

### Adjust Tailwind CSS file modifier order for combined utilities

Source: https://v3.tailwindcss.com/docs/upgrade-guide

With the introduction of the `file` modifier in Tailwind CSS v3.0.0-alpha.2, its order when combined with other modifiers (like `hover` or `focus`) has been reversed. Ensure that `hover:file:` is used instead of `file:hover:` for correct application.

```html
<input class="file:hover:bg-blue-600 ...">
<input class="hover:file:bg-blue-600 ...">
```

--------------------------------

### Customize class name extraction logic for custom file types

Source: https://v3.tailwindcss.com/docs/content-configuration

Use the extract option to override Tailwind's default class detection logic for specific file extensions. This is an advanced feature for non-standard file formats where the default extraction doesn't work. Requires content.files instead of top-level content array.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    files: ['./src/**/*.{html,wtf}'],
    extract: {
      wtf: (content) => {
        return content.match(/[^<>"'`\s]*/g)
      }
    }
  },
  // ...
}
```

--------------------------------

### Apply Conditional Box Shadow on Hover with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/box-shadow

Conditionally apply a box shadow based on element states like hover using Tailwind CSS variant modifiers. For example, `hover:shadow-lg` applies a large shadow only on hover.

```html
<div class="shadow hover:shadow-lg">
  <!-- ... -->
</div>
```

--------------------------------

### Create Preset Without Default Configuration

Source: https://v3.tailwindcss.com/docs/presets

Create a preset that completely replaces Tailwind's default configuration instead of extending it. Include an empty presets array to prevent automatic merging with default configuration.

```javascript
// Example preset
module.exports = {
  presets: [],
  theme: {
    // ...
  },
  plugins: [
    // ...
  ],
}
```

--------------------------------

### Responsive Grid Column Utilities with Breakpoints in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/grid-column

Shows how to use Tailwind CSS breakpoint modifiers to apply different grid column utilities at different screen sizes. The md: prefix applies the col-span-6 utility only at medium screen sizes and above, enabling responsive grid layouts.

```html
<div class="col-span-2 md:col-span-6">
  <!-- ... -->
</div>
```

--------------------------------

### Responsive margin with media queries in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/margin

Apply margin utilities conditionally at specific breakpoints using responsive variant modifiers. Example: md:mt-8 applies mt-8 margin only at medium screen sizes and above. Supports all standard breakpoint sizes.

```html
<div class="mt-4 md:mt-8">
  <!-- ... -->
</div>
```

--------------------------------

### Applying Basic Rings with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/ring-width

This snippet demonstrates how to use the `ring-*` utilities in Tailwind CSS to apply a solid box-shadow of varying thickness to HTML elements. These utilities are often combined with `ring-offset-*` for visual separation and can compose gracefully with other shadow utilities.

```html
<button class="... ring-offset-2 ring-2">Button A</button>
<button class="... ring-offset-2 ring">Button B</button>
<button class="... ring-offset-2 ring-4">Button C</button>
```

--------------------------------

### Organize Custom CSS with @layer Directive

Source: https://v3.tailwindcss.com/docs/functions-and-directives

The `@layer` directive allows grouping custom CSS into specific Tailwind 'buckets' like `base`, `components`, or `utilities`. This ensures proper cascade order, enables the use of modifiers (e.g., `hover:`), and only includes the styles in the final build if they are used in the HTML.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  h1 {
    @apply text-2xl;
  }
  h2 {
    @apply text-xl;
  }
}

@layer components {
  .btn-blue {
    @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded;
  }
}

@layer utilities {
  .filter-none {
    filter: none;
  }
  .filter-grayscale {
    filter: grayscale(100%);
  }
}
```

--------------------------------

### Apply gradient with responsive breakpoint modifier in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

Illustrates using the md: variant modifier to apply different gradient colors at medium screen sizes and above. The example shows a purple-to-default gradient that changes to yellow-to-default on medium-sized screens and larger.

```html
<div class="bg-gradient-to-r from-purple-400 md:from-yellow-500">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Tailwind CSS Hue Rotate Theme Values

Source: https://v3.tailwindcss.com/docs/hue-rotate

Extend the default Tailwind CSS `hue-rotate` utilities by customizing values in your `tailwind.config.js` file. This allows you to define custom hue rotation degrees for use as utility classes. The example adds `-270deg` and `270deg` rotations to the theme.

```javascript
module.exports = {
  theme: {
    extend: {
      hueRotate: {
        '-270': '-270deg',
        270: '270deg'
      }
    }
  }
}
```

--------------------------------

### Add Base Layer Styles with addBase in Tailwind Plugin

Source: https://v3.tailwindcss.com/docs/plugins

Uses addBase to register new styles in Tailwind's base layer for typography elements. This example sets font sizes for h1, h2, and h3 tags using theme values, and base styles ignore prefix and important configurations.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addBase, theme }) {
      addBase({
        'h1': { fontSize: theme('fontSize.2xl') },
        'h2': { fontSize: theme('fontSize.xl') },
        'h3': { fontSize: theme('fontSize.lg') },
      })
    })
  ]
}
```

--------------------------------

### Snap to End with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/scroll-snap-align

Demonstrates the snap-end utility class applied to child elements within a snap-x container. Elements scroll horizontally and snap to their end position when scrolled. The example shows a grid of images that snap to the end of the scroll container.

```html
<div class="snap-x ...">
  <div class="snap-end ...">
    <img src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-end ...">
    <img src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-end ...">
    <img src="https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-end ...">
    <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-end ...">
    <img src="https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-end ...">
    <img src="https://images.unsplash.com/photo-1559333086-b0a56225a93c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
</div>
```

--------------------------------

### Using Custom Tailwind CSS Screen Names

Source: https://v3.tailwindcss.com/docs/screens

Shows how to define screens with custom, descriptive names (e.g., `tablet`, `laptop`, `desktop`) instead of the default `sm`/`md` conventions. These custom names are configured in `theme.screens` in `tailwind.config.js` and then applied as responsive modifiers directly within HTML classes.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    screens: {
      'tablet': '640px',
      // => @media (min-width: 640px) { ... }

      'laptop': '1024px',
      // => @media (min-width: 1024px) { ... }

      'desktop': '1280px',
      // => @media (min-width: 1280px) { ... }
    }
  }
}
```

```html
<div class="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4">
  <!-- ... -->
</div>
```

--------------------------------

### Adopting New Opacity Modifier Syntax for Tailwind CSS Color Utilities

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS v3.0 introduces a new, more concise syntax for modifying the opacity of color utilities, such as `bg-black/25`, replacing the older `bg-opacity-*` classes. This new syntax is recommended for all color utilities and offers broader applicability.

```html
<div class="bg-black bg-opacity-25">
<div class="bg-black/25">
```

--------------------------------

### Tailwind CSS Snap Center - Horizontal Scrolling Image Gallery

Source: https://v3.tailwindcss.com/docs/scroll-snap-align

Implements a horizontally scrollable image gallery using Tailwind's snap-x and snap-center utilities. Elements snap to the center of the viewport when scrolling. This example uses unsplash image URLs and requires Tailwind CSS to be properly configured in the project.

```HTML
<div class="snap-x ...">
  <div class="snap-center ...">
    <img src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-center ...">
    <img src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-center ...">
    <img src="https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-center ...">
    <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-center ...">
    <img src="https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-center ...">
    <img src="https://images.unsplash.com/photo-1559333086-b0a56225a93c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
</div>
```

--------------------------------

### Increase Contrast with contrast-more Modifier in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Uses the `contrast-more` modifier to conditionally apply higher contrast styles when users request increased contrast in their system preferences. This example applies to form inputs and helper text to improve readability.

```html
<form>
  <label class="block">
    <span class="block text-sm font-medium text-slate-700">Social Security Number</span>
    <input class="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500"/>
    <p class="mt-2 opacity-10 contrast-more:opacity-100 text-slate-600 text-sm">
      We need this to steal your identity.
    </p>
  </label>
</form>
```

--------------------------------

### Use Arbitrary Background Image Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-image

This example shows how to apply a one-off custom background image directly within an HTML element using Tailwind CSS's arbitrary value syntax. By enclosing the `url()` value in square brackets, you can specify any CSS `background-image` value without needing to extend your Tailwind configuration.

```html
<div class="bg-[url('/img/hero-pattern.svg')]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply text decoration at specific breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-decoration

Shows how to apply text decoration utilities, such as `underline`, only at specific screen sizes (breakpoints) using responsive variant modifiers in Tailwind CSS. For example, `md:underline` will apply an underline only on medium screens and larger.

```html
<p class="no-underline md:underline">
  <!-- ... -->
</p>
```

--------------------------------

### Use Dynamic Variants with Arbitrary Values in Tailwind

Source: https://v3.tailwindcss.com/docs/plugins

Shows how variants created with matchVariant support arbitrary values using square bracket notation, enabling flexible runtime values like nth-[3n+1]:bg-blue-500.

```html
<div class="nth-[3n+1]:bg-blue-500 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Background Size Theme Configuration in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-size

Extend or modify the default background size utilities by editing the theme.backgroundSize section in tailwind.config.js. This example adds custom values like '50%' and '16' (4rem) alongside the default auto, cover, and contain options for project-specific sizing needs.

```javascript
module.exports = {
  theme: {
    backgroundSize: {
      'auto': 'auto',
      'cover': 'cover',
      'contain': 'contain',
      '50%': '50%',
      '16': '4rem',
    }
  }
}
```

--------------------------------

### Apply Styles Based on Browser Feature Support with supports Modifier

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Uses the `supports-[...]` modifier to conditionally apply styles based on browser support for specific CSS features. This example checks for grid display support and backdrop-filter support, falling back to flexbox and opacity if unsupported.

```html
<div class="flex supports-[display:grid]:grid ...">
  <!-- ... -->
</div>

<div class="bg-black/75 supports-[backdrop-filter]:bg-black/25 supports-[backdrop-filter]:backdrop-blur ...">
  <!-- ... -->
</div>
```

--------------------------------

### Create Responsive Grid Layouts with Breakpoint Modifiers in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Use responsive modifiers like md and lg to apply different styles at specific breakpoints. This example creates a grid that displays 3 columns on mobile, 4 columns on medium screens, and 6 columns on large screens.

```html
<div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS Container with Auto Margins and Padding

Source: https://v3.tailwindcss.com/docs/container

Shows how to combine the `container` class with `mx-auto` for centering and `px-*` utilities for horizontal padding in HTML. This provides a centered container with specified padding.

```html
<div class="container mx-auto px-4">
  <!-- ... -->
</div>
```

--------------------------------

### Conditional Scroll Padding with Hover State in HTML

Source: https://v3.tailwindcss.com/docs/scroll-padding

Demonstrates using state variant modifiers to conditionally apply scroll padding utilities. In this example, the scroll-p-8 utility is applied by default and changes to scroll-p-0 on hover, showing how to use state modifiers like hover for dynamic styling.

```html
<div class="scroll-p-8 hover:scroll-p-0">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Height Utilities on Hover State

Source: https://v3.tailwindcss.com/docs/height

Use the hover: variant modifier to conditionally apply height utilities when an element is hovered. For example, hover:h-full applies the h-full class only on hover, allowing dynamic height changes based on user interaction.

```html
<div class="h-8 hover:h-full">
  <!-- ... -->
</div>
```

--------------------------------

### Style Unstyled List with Tailwind Utilities

Source: https://v3.tailwindcss.com/docs/preflight

Re-applies list styling to an unstyled list element using Tailwind CSS utility classes. The list-disc utility adds bullet points and list-inside positions bullets inside the content flow. This approach allows selective styling of lists throughout a project.

```html
<ul class="list-disc list-inside">
  <li>One</li>
  <li>Two</li>
  <li>Three</li>
</ul>
```

--------------------------------

### Apply Tailwind CSS `min-w` utility on hover state

Source: https://v3.tailwindcss.com/docs/min-width

This HTML example shows how to conditionally apply the `min-w-0` utility class when an element is hovered over, using Tailwind CSS's variant modifiers. The `hover:min-w-0` class ensures the minimum width changes only on interaction.

```html
<div class="w-24 min-w-full hover:min-w-0">
  <!-- ... -->
</div>
```

--------------------------------

### Use arbitrary ARIA selectors with square brackets

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Apply one-off ARIA modifiers using square bracket notation for complex ARIA attributes that take specific values. This example conditionally sets background images based on sort attribute values.

```HTML
<table>
  <thead>
    <tr>
      <th
        aria-sort="ascending"
        class="aria-[sort=ascending]:bg-[url('/img/down-arrow.svg')] aria-[sort=descending]:bg-[url('/img/up-arrow.svg')]"
      >
        Invoice #
      </th>
      <!-- ... -->
    </tr>
  </thead>
  <!-- ... -->
</table>
```

--------------------------------

### Use Arbitrary Opacity Values with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/opacity

Demonstrates using square bracket notation to apply one-off, arbitrary `opacity` values directly in HTML. This is useful for specific cases that don't warrant adding a custom value to the theme configuration, providing flexibility for unique styling needs.

```html
<div class="opacity-[.67]">
  <!-- ... -->
</div>
```

--------------------------------

### Set Table Border Spacing with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/border-spacing

Use the `border-spacing-*`, `border-spacing-x-*`, and `border-spacing-y-*` utilities to define the space between borders of table cells. This functionality requires the `border-separate` class on the table element. The example demonstrates setting a uniform border spacing for a simple HTML table.

```HTML
<table class="border-separate border-spacing-2 border border-slate-400 ...">
  <thead>
    <tr>
      <th class="border border-slate-300 ...">State</th>
      <th class="border border-slate-300 ...">City</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 ...">Indiana</td>
      <td class="border border-slate-300 ...">Indianapolis</td>
    </tr>
    <tr>
      <td class="border border-slate-300 ...">Ohio</td>
      <td class="border border-slate-300 ...">Columbus</td>
    </tr>
    <tr>
      <td class="border border-slate-300 ...">Michigan</td>
      <td class="border border-slate-300 ...">Detroit</td>
    </tr>
  </tbody>
</table><table class="border-separate border-spacing-2 border border-slate-500 ...">
  <thead>
    <tr>
      <th class="border border-slate-600 ...">State</th>
      <th class="border border-slate-600 ...">City</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-700 ...">Indiana</td>
      <td class="border border-slate-700 ...">Indianapolis</td>
    </tr>
    <tr>
      <td class="border border-slate-700 ...">Ohio</td>
      <td class="border border-slate-700 ...">Columbus</td>
    </tr>
    <tr>
      <td class="border border-slate-700 ...">Michigan</td>
      <td class="border border-slate-700 ...">Detroit</td>
    </tr>
  </tbody>
</table>
```

--------------------------------

### Override All Default Tailwind CSS Breakpoints

Source: https://v3.tailwindcss.com/docs/breakpoints

This example shows how to completely replace Tailwind CSS's default screen breakpoints. By defining a new `screens` object directly under `theme` in `tailwind.config.js`, any unlisted default breakpoints are removed, allowing for a fully custom set.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    screens: {
      'sm': '576px',
      // => @media (min-width: 576px) { ... }

      'md': '960px',
      // => @media (min-width: 960px) { ... }

      'lg': '1440px',
      // => @media (min-width: 1440px) { ... }
    }
  }
}
```

--------------------------------

### Apply Fixed Table Layout with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/table-layout

This example illustrates `table-fixed` which causes the table to ignore cell content and use fixed widths for columns. The widths are determined by the first row, and explicit widths can be set for some columns while the rest divide available space evenly.

```html
<table class="table-fixed">
  <thead>
    <tr>
      <th>Song</th>
      <th>Artist</th>
      <th>Year</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>The Sliding Mr. Bones (Next Stop, Pottersville)</td>
      <td>Malcolm Lockyer</td>
      <td>1961</td>
    </tr>
    <tr>
      <td>Witchy Woman</td>
      <td>The Eagles</td>
      <td>1972</td>
    </tr>
    <tr>
      <td>Shining Star</td>
      <td>Earth, Wind, and Fire</td>
      <td>1975</td>
    </tr>
  </tbody>
</table>
```

--------------------------------

### Extend Flex Basis Scale in Tailwind Config

Source: https://v3.tailwindcss.com/docs/flex-basis

Customize the flex basis scale specifically by editing theme.extend.flexBasis in tailwind.config.js. This approach allows you to define custom flex basis values using fractions or percentages without modifying the general spacing scale. The example defines seven custom flex basis values based on sevenths of a container.

```javascript
module.exports = {
  theme: {
    extend: {
      flexBasis: {
        '1/7': '14.2857143%',
        '2/7': '28.5714286%',
        '3/7': '42.8571429%',
        '4/7': '57.1428571%',
        '5/7': '71.4285714%',
        '6/7': '85.7142857%',
      }
    }
  }
}
```

--------------------------------

### Responsive Easing with Media Query Breakpoints

Source: https://v3.tailwindcss.com/docs/transition-timing-function

Demonstrates using Tailwind CSS breakpoint modifiers to apply different easing curves at different screen sizes. The ease-out utility applies by default, and switches to ease-in at medium screen sizes and above using the md: modifier.

```html
<div class="transition duration-150 ease-out md:ease-in">
  <!-- ... -->
</div>
```

--------------------------------

### Remove border style with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/border-style

This example shows how to remove an existing border style from an HTML button element using the `border-none` utility class in Tailwind CSS. This is commonly used to override default styles or styles applied at smaller breakpoints.

```HTML
<button class="border-none ...">Save Changes</button>
```

--------------------------------

### Apply Border Width with Border Style in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/border-width

When Preflight is disabled, border-width utilities require an explicit border-style utility to render. This example shows the correct syntax combining border-width with border-style to ensure borders display properly without Preflight's global reset.

```html
<div class="border-4 border-solid border-indigo-500 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Define Default and Custom Shades with Tailwind CSS Color Objects

Source: https://v3.tailwindcss.com/docs/colors

This example illustrates using the special `DEFAULT` key within a nested color object in `tailwind.config.js`. It enables defining a primary color value without a suffix (e.g., `bg-tahiti`), alongside named shades like `light` and `dark` (e.g., `bg-tahiti-light`), simplifying class naming for common color variations.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors: {
      // ...
      'tahiti': {
        light: '#67e8f9',
        DEFAULT: '#06b6d4',
        dark: '#0e7490',
      },
      // ...
    },
  },
}
```

--------------------------------

### Tailwind CSS: Resolving Ambiguity with CSS Variables

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Highlights a common ambiguity when using CSS variables as arbitrary values, where Tailwind cannot infer the intended CSS property. This example shows a `text-[var(--my-var)]` class that could represent either font-size or color.

```HTML
<div class="text-[var(--my-var)]">...</div>
```

--------------------------------

### Apply Conditional Backdrop Brightness on Hover in HTML (Tailwind CSS)

Source: https://v3.tailwindcss.com/docs/backdrop-brightness

Shows how to conditionally apply the `backdrop-brightness-*` utility based on an element's state using variant modifiers in Tailwind CSS. For example, `hover:backdrop-brightness-150` applies the brightness filter only on hover.

```html
<div class="backdrop-brightness-110 hover:backdrop-brightness-150">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Tailwind CSS Transition Timing Functions

Source: https://v3.tailwindcss.com/docs/transition-timing-function

Shows how to extend the default transition timing function values in Tailwind CSS configuration. Adds custom cubic-bezier easing functions (in-expo and out-expo) to the theme by editing the tailwind.config.js file. Enables use of custom-named ease utilities in templates.

```javascript
module.exports = {
  theme: {
    extend: {
      transitionTimingFunction: {
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      }
    }
  }
}
```

--------------------------------

### HTML structure demonstrating Tailwind CSS `important` ID selector application

Source: https://v3.tailwindcss.com/docs/configuration

This HTML example shows a `<body>` element with `id="app"`, which corresponds to the `important` selector configured in Tailwind CSS. It illustrates how Tailwind utilities like `text-red-500` will override other classes due to increased specificity, while still respecting inline styles because `!important` is not used.

```html
<html>
<!-- ... -->
<style>
  .high-specificity .nested .selector {
    color: blue;
  }
</style>
<body id="app">
  <div class="high-specificity">
    <div class="nested">
      <!-- Will be red-500 -->
      <div class="selector text-red-500"><!-- ... --></div>
    </div>
  </div>

  <!-- Will be #bada55 -->
  <div class="text-red-500" style="color: #bada55;"><!-- ... --></div>
</body>
</html>
```

--------------------------------

### Tailwind CSS Neutral Gradient From Colors

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

CSS custom properties for neutral-colored gradient starting points in Tailwind CSS, ranging from neutral-600 to neutral-950. Each utility sets the gradient-from color, gradient-to color with transparency, and gradient stops for use in gradient backgrounds.

```css
.from-neutral-600 {
  --tw-gradient-from: #525252 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(82 82 82 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-neutral-700 {
  --tw-gradient-from: #404040 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(64 64 64 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-neutral-800 {
  --tw-gradient-from: #262626 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(38 38 38 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-neutral-900 {
  --tw-gradient-from: #171717 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(23 23 23 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-neutral-950 {
  --tw-gradient-from: #0a0a0a var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(10 10 10 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
```

--------------------------------

### Skip Snap Position Stops with snap-normal in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/scroll-snap-stop

Creates a horizontally scrollable container that allows skipping snap points using the snap-normal utility. This example displays an image gallery where users can scroll freely without being forced to stop at each snap position.

```html
<div class="snap-x ...">
  <div class="snap-normal snap-center ...">
    <img src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-normal snap-center ...">
    <img src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-normal snap-center ...">
    <img src="https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-normal snap-center ...">
    <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-normal snap-center ...">
    <img src="https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-normal snap-center ...">
    <img src="https://images.unsplash.com/photo-1559333086-b0a56225a93c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
</div>
```

--------------------------------

### Tailwind CSS Conditional Align Content with Hover State

Source: https://v3.tailwindcss.com/docs/align-content

Applies content-around alignment only on hover using the hover: variant modifier. Default state uses content-start, switching to content-around when the element is hovered. Supports all state modifiers including focus, active, and others.

```html
<div class="grid content-start hover:content-around">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Spacing Scale in Tailwind CSS Configuration

Source: https://v3.tailwindcss.com/docs/height

This JavaScript code snippet demonstrates how to extend the default spacing scale in your Tailwind CSS configuration file (`tailwind.config.js`). By adding values to `theme.extend.spacing`, you can define custom spacing utilities like `spacing-128`, which translates to `32rem` in this example. This allows for consistent, reusable spacing throughout your project.

```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '128': '32rem'
      }
    }
  }
}
```

--------------------------------

### Incorrect Dynamic Tailwind Class Generation in React/JSX

Source: https://v3.tailwindcss.com/docs/content-configuration

This React component illustrates an anti-pattern where Tailwind CSS class names are constructed dynamically using string interpolation with props. Tailwind's build process will not detect these partial class names, leading to unstyled elements.

```jsx
function Button({ color, children }) {
  return (
    <button className={`bg-${color}-600 hover:bg-${color}-500 ...`}>
      {children}
    </button>
  )
}
```

--------------------------------

### Extend Spacing Scale in Tailwind Config

Source: https://v3.tailwindcss.com/docs/border-spacing

Extends the default spacing scale by adding custom spacing values to the theme configuration. This approach customizes the overall spacing scale which affects border spacing utilities. The example adds a '13' spacing unit equivalent to 3.25rem.

```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '13': '3.25rem'
      }
    }
  }
}
```

--------------------------------

### Extend Tailwind CSS Theme with Custom `fontFamily`

Source: https://v3.tailwindcss.com/docs/theme

Illustrates how to add new `fontFamily` values to the default Tailwind CSS theme without replacing existing ones. By placing custom font families under `theme.extend.fontFamily` in `tailwind.config.js`, a new utility class like `font-display` is created, which can then be used in HTML.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: 'Oswald, ui-serif' // Adds a new `font-display` class
      }
    }
  }
}
```

```html
<h1 class="font-display">
  This uses the Oswald font
</h1>
```

--------------------------------

### Apply Text Decoration Color - Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-decoration-color

Use the `decoration-*` utility classes to set the color of text decorations (underlines, overlines, line-through) on HTML elements. This example demonstrates applying different decoration colors to links within a paragraph using Tailwind's color palette utilities. The decoration color is applied independently of the text color using classes like `decoration-sky-500`, `decoration-pink-500`, and `decoration-indigo-500`.

```html
<div>
  <p>
    I'm Derek, an astro-engineer based in Tattooine. I like to build X-Wings at
    <a class="underline decoration-sky-500">My Company, Inc</a>.
    Outside of work, I like to <a class="underline decoration-pink-500">watch
    pod-racing</a> and have <a class="underline decoration-indigo-500">light-saber</a> fights.
  </p>
</div>
```

--------------------------------

### Apply Tailwind CSS Opacity Utilities to Elements

Source: https://v3.tailwindcss.com/docs/opacity

Demonstrates how to use `opacity-*` classes to set the transparency of HTML elements. These classes provide predefined opacity levels ranging from 0 to 100, impacting the element's visibility.

```html
<button class="bg-indigo-500 opacity-100 ..."></button>
<button class="bg-indigo-500 opacity-75 ..."></button>
<button class="bg-indigo-500 opacity-50 ..."></button>
<button class="bg-indigo-500 opacity-25 ..."></button>
```

--------------------------------

### Conditionally Apply Tailwind CSS Padding on Hover

Source: https://v3.tailwindcss.com/docs/padding

Conditionally apply Tailwind CSS padding utilities based on an element's hover state. This example demonstrates using the `hover:` variant modifier to change vertical padding when the mouse pointer is over the element.

```html
<div class="py-4 hover:py-8">
  <!-- ... -->
</div>
```

--------------------------------

### Apply responsive grid row styles with Tailwind CSS breakpoints

Source: https://v3.tailwindcss.com/docs/grid-template-rows

This example showcases how to apply Tailwind CSS `grid-rows-*` utilities responsively using breakpoint modifiers. The `md:grid-rows-6` class will configure the grid to have 6 rows on medium screens and above, while defaulting to 2 rows on smaller screens, enabling adaptive layouts.

```html
<div class="grid grid-rows-2 md:grid-rows-6">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Invert Filter at Responsive Breakpoint in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/invert

Use media query variant modifiers like md: to apply invert utilities at specific screen sizes. This example applies invert at all sizes but removes it (invert-0) at medium breakpoints and above, enabling responsive filter behavior.

```html
<div class="invert md:invert-0">
  <!-- ... -->
</div>
```

--------------------------------

### Hide Content from Print with print Modifier in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Uses the `print` modifier to conditionally hide or show content only when printing. This example hides the main article during print and displays a message instead, useful for protecting sensitive or redundant information.

```html
<div>
  <article class="print:hidden">
    <h1>My Secret Pizza Recipe</h1>
    <p>This recipe is a secret, and must not be shared with anyone</p>
    <!-- ... -->
  </article>
  <div class="hidden print:block">
    Are you seriously trying to print this? It's secret!
  </div>
</div>
```

--------------------------------

### Apply Flex Basis at Responsive Breakpoints in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/flex-basis

Use responsive variant modifiers like md: to apply different flex basis values at specific screen sizes. This example sets smaller basis values on mobile (basis-1/4 and basis-1/2) and adjusts them to basis-1/3 on medium screens and above.

```html
<div class="flex flex-row">
  <div class="basis-1/4 md:basis-1/3">01</div>
  <div class="basis-1/4 md:basis-1/3">02</div>
  <div class="basis-1/2 md:basis-1/3">03</div>
</div>
```

--------------------------------

### Conditionally apply Tailwind CSS object-scale-down at media breakpoints

Source: https://v3.tailwindcss.com/docs/object-fit

This example demonstrates applying `object-scale-down` conditionally based on screen size using a responsive breakpoint modifier. The `object-contain` class is applied by default, and `md:object-scale-down` takes effect only on medium screens and larger. This enables responsive content resizing across different devices.

```html
<img class="object-contain md:object-scale-down">
```

--------------------------------

### Conditionally Restore Forced Colors with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/forced-color-adjust

This example illustrates how to use `forced-color-adjust-none` and `lg:forced-color-adjust-auto` together to control forced color behavior based on screen size. It opts an element out of forced colors by default and re-enables them only for larger screens, providing flexibility for adaptive user interfaces.

```html
<form>
  <fieldset class="forced-color-adjust-none lg:forced-color-adjust-auto ...">
    <legend>Choose a color:</legend>
    <select class="hidden lg:block">
      <option value="White">White</option>
      <option value="Gray">Gray</option>
      <option value="Black">Black</option>
    </select>
    <div class="lg:hidden">
      <label>
        <input class="sr-only" type="radio" name="color-choice" value="White" />
        <!-- ... -->
      </label>
      <!-- ... -->
    </div>
  </fieldset>
</form>
```

--------------------------------

### Apply Responsive List Style with Media Query Modifiers

Source: https://v3.tailwindcss.com/docs/list-style-type

Demonstrates responsive design using Tailwind breakpoint modifiers. The list-disc utility applies only at medium screen sizes and above, enabling different list styles across device sizes.

```html
<ul class="list-none md:list-disc">
  <!-- ... -->
</ul>
```

--------------------------------

### Define Custom Color Palette in Tailwind CSS Config

Source: https://v3.tailwindcss.com/docs/colors

This configuration example demonstrates how to completely replace Tailwind CSS's default color palette with a custom set of colors. Colors are defined directly under `theme.colors` in `tailwind.config.js`, making them available for all color-related utilities like text, border, and background.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'white': '#ffffff',
      'purple': '#3f3cbb',
      'midnight': '#121063',
      'metal': '#565584',
      'tahiti': '#3ab7bf',
      'silver': '#ecebff',
      'bubble-gum': '#ff77e9',
      'bermuda': '#78dcca',
    },
  },
}
```

```html
<div class="bg-midnight text-tahiti">
  <!-- ... -->
</div>
```

--------------------------------

### Style Third-Party Libraries with Tailwind in CSS

Source: https://v3.tailwindcss.com/docs/content-configuration

Apply Tailwind utility classes to third-party library components (like Select2) without using @layer, ensuring consistent style inclusion in the final CSS output. This approach prevents the need to configure Tailwind to scan external library source code.

```css
@tailwind base;
@tailwind components;

.select2-dropdown {
  @apply rounded-b-lg shadow-md;
}
.select2-search {
  @apply border border-gray-300 rounded;
}
.select2-results__group {
  @apply text-lg font-bold text-gray-900;
}
/* ... */

@tailwind utilities;
```

--------------------------------

### Apply Text Underline Offset with Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/text-underline-offset

Demonstrates how to use Tailwind CSS underline-offset utility classes to adjust the spacing between text and its underline. The example shows four different offset values (1px, 2px, 4px, 8px) applied to paragraph elements with the underline class.

```html
<p class="underline underline-offset-1 ...">The quick brown fox...</p>
<p class="underline underline-offset-2 ...">The quick brown fox...</p>
<p class="underline underline-offset-4 ...">The quick brown fox...</p>
<p class="underline underline-offset-8 ...">The quick brown fox...</p>
```

--------------------------------

### Update Tailwind CSS `overflow-clip` and `overflow-ellipsis` classes

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS has renamed `overflow-clip` to `text-clip` and `overflow-ellipsis` to `text-ellipsis` to avoid naming conflicts with the native `overflow: clip` CSS property. While the old classes might still function, it's recommended to update to the new names.

```html
<div class="overflow-clip overflow-ellipsis">
<div class="text-clip text-ellipsis">
```

--------------------------------

### Apply Tailwind Border Spacing on Hover or Focus States

Source: https://v3.tailwindcss.com/docs/border-spacing

Conditionally apply border spacing utilities using state variant modifiers such as `hover:` or `focus:`. This allows the spacing to change only when the element is in a specific interactive state. The example demonstrates how to apply `border-spacing-2` on hover.

```HTML
<table class="hover:border-spacing-2">
  <!-- ... -->
</table>
```

--------------------------------

### Remove All Filters with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hue-rotate

Use the `filter-none` utility to remove all applied filters from an element. This is particularly useful for dynamically removing filters based on conditions like hover states or media queries. The example shows `filter-none` applied at a medium breakpoint.

```html
<div class="blur-md invert hue-rotate-180 md:filter-none">
  <!-- ... -->
</div>
```

--------------------------------

### Configure Tailwind CSS Nesting with PostCSS (Standard)

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

This PostCSS configuration explicitly tells `tailwindcss/nesting` to use `postcss-nesting` by passing it as an argument. This is useful for adhering to standard CSS nesting or overriding the bundled version.

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

--------------------------------

### Setting touch action with Tailwind CSS utilities

Source: https://v3.tailwindcss.com/docs/touch-action

Demonstrates how to use Tailwind CSS touch-* utility classes to control touch interactions on elements. The example shows four different touch action behaviors: touch-auto allows normal scrolling and zooming, touch-none disables all touch interactions, touch-pan-x restricts panning to horizontal axis, and touch-pan-y restricts panning to vertical axis. Each utility maps to the CSS touch-action property.

```html
<div class="w-full h-48 overflow-auto touch-auto ...">
  <img class="w-[150%] max-w-none h-auto" src="..." />
</div>
<div class="w-full h-48 overflow-auto touch-none ...">
  <img class="w-[150%] max-w-none h-auto" src="..." />
</div>
<div class="w-full h-48 overflow-auto touch-pan-x ...">
  <img class="w-[150%] max-w-none h-auto" src="..." />
</div>
<div class="w-full h-48 overflow-auto touch-pan-y ...">
  <img class="w-[150%] max-w-none h-auto" src="..." />
</div>
```

--------------------------------

### Conditionally Apply Tailwind CSS Hue Rotation at Breakpoints

Source: https://v3.tailwindcss.com/docs/hue-rotate

Apply hue rotation utilities conditionally based on responsive breakpoints or other media queries. Use variant modifiers like `md:` to apply styles only at specific screen sizes or conditions. This example applies a different hue rotation for medium screen sizes and above.

```html
<div class="hue-rotate-60 md:hue-rotate-0">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Clear Utilities at Responsive Breakpoints in HTML

Source: https://v3.tailwindcss.com/docs/clear

Demonstrates using Tailwind's responsive breakpoint modifier (md:) to apply clear utilities conditionally at different screen sizes. The md:clear-none class applies only at medium screen sizes and above, enabling layout adjustments for various device widths.

```html
<p class="clear-left md:clear-none">
  <!-- ... -->
</p>
```

--------------------------------

### Conditionally Apply Tailwind CSS Word Break on Hover

Source: https://v3.tailwindcss.com/docs/word-break

Tailwind CSS allows applying utilities conditionally using variant modifiers like `hover:`. This example shows how to change the word breaking behavior to `break-all` only when the element is hovered over, reverting to `break-normal` otherwise.

```html
<p class="break-normal hover:break-all">
  <!-- ... -->
</p>
```

--------------------------------

### Apply Forced Color Adjust on Breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/forced-color-adjust

This example shows how to use responsive breakpoints to conditionally apply `forced-color-adjust` utilities. The `md:forced-color-adjust-auto` class ensures that the element only respects forced colors on medium screen sizes and above, allowing for fine-grained control over styling and accessibility across different devices.

```html
<div class="forced-color-adjust-none md:forced-color-adjust-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Apply divide styles on hover with state modifiers

Source: https://v3.tailwindcss.com/docs/divide-width

Use state variant modifiers like hover: to conditionally apply divide width utilities in different interaction states. This example changes the divide width to 8px on hover while maintaining the base gray-400 color.

```html
<div class="divide-y divide-gray-400 hover:divide-y-8">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Horizontal Space Between Elements using Tailwind CSS `space-x`

Source: https://v3.tailwindcss.com/docs/space

This example demonstrates how to use the `space-x-*` utilities in Tailwind CSS to add horizontal spacing between child elements within a flex container. By applying `space-x-4` to the parent `div`, a `margin-left` of 1rem (16px) is automatically added to all children except the first, creating even horizontal gaps.

```html
<div class="flex space-x-4 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>
```

--------------------------------

### JavaScript for Toggling Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/content-configuration

This JavaScript code snippet illustrates how to dynamically toggle Tailwind CSS classes on an HTML element using `classList.toggle()`. Tailwind's class detection mechanism is robust enough to identify class names within JavaScript strings.

```javascript
<script>
  menuButton.addEventListener('click', function () {
    let classList = document.getElementById('nav').classList
    classList.toggle('hidden')
    classList.toggle('block')
  })
</script>
```

--------------------------------

### Arbitrary Variant with @supports At-Rule

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Demonstrates using at-rules like `@supports` in arbitrary variants to apply styles conditionally based on browser feature support. The `&` placeholder is not required with at-rules.

```html
<div class="flex [@supports(display:grid)]:grid">
  <!-- ... -->
</div>
```

--------------------------------

### Avoid Scanning CSS Files in Tailwind Content Config

Source: https://v3.tailwindcss.com/docs/content-configuration

Never include CSS files in the content configuration. Configure Tailwind to scan template files where class names are used, not the generated CSS output. Scanning CSS files leads to incorrect configuration and build issues.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.css',
  ],
  // ...
}
```

--------------------------------

### Apply Hover State Modifier to Background Size in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-size

Conditionally apply background size utilities on hover using the hover: variant modifier. This example changes from bg-auto to bg-contain when the user hovers over the element, enabling interactive background image sizing.

```html
<div class="bg-auto hover:bg-contain">
  <!-- ... -->
</div>
```

--------------------------------

### Use Tailwind CSS Logical Properties for Border Width

Source: https://v3.tailwindcss.com/docs/border-width

This snippet illustrates the application of Tailwind CSS logical property utilities `border-s-*` (inline start) and `border-e-*` (inline end) to set border widths. It demonstrates how these properties adapt to text direction (`ltr` vs. `rtl`), influencing whether the border appears on the left or right side based on the current writing mode.

```html
<div dir="ltr">
  <div class="border-s-4 ..."></div>
<div>

<div dir="rtl">
  <div class="border-s-4 ..."></div>
<div>
```

--------------------------------

### Apply Tailwind CSS Opacity for Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/opacity

Shows how to use responsive variant modifiers like `md:` with `opacity-*` classes to adjust element opacity based on screen size. This enables adaptive designs, allowing elements to have different transparencies at various breakpoints.

```html
<div class="opacity-50 md:opacity-100">
  <!-- ... -->
</div>
```

--------------------------------

### Mapping Renamed Tailwind CSS Gray Scales in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/upgrade-guide

With the unified color palette in Tailwind CSS v3.0, several extended gray scales have been renamed (e.g., `trueGray` to `neutral`). This JavaScript configuration demonstrates how to update references to these grays in `tailwind.config.js` to their new unified names.

```javascript
const colors = require('tailwindcss/colors')

module.exports = {
  theme: {
    extend: {
      colors: {
        gray: colors.trueGray,
        gray: colors.neutral,
      }
    },
  },
  // ...
}
```

--------------------------------

### Access Tailwind CSS Theme Values with theme() Function

Source: https://v3.tailwindcss.com/docs/functions-and-directives

The `theme()` function provides a way to access values from your Tailwind CSS configuration directly within your CSS. It supports dot notation for nested properties and square bracket notation for keys containing special characters. Additionally, it can adjust color opacity using a slash followed by a percentage.

```css
.content-area {
  height: calc(100vh - theme(spacing.12));
}
```

```css
.content-area {
  height: calc(100vh - theme(spacing[2.5]));
}
```

```css
.btn-blue {
  background-color: theme(colors.blue.500);
}
```

```css
.btn-blue {
  background-color: theme(colors.blue.500 / 75%);
}
```

--------------------------------

### Extend Spacing Scale in Tailwind Config

Source: https://v3.tailwindcss.com/docs/flex-basis

Customize the spacing scale by adding custom spacing values to the theme.extend.spacing object in tailwind.config.js. These values become available for use throughout your Tailwind CSS utilities. The example adds two new spacing sizes (112 and 128) mapped to rem-based measurements.

```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '112': '28rem',
        '128': '32rem',
      }
    }
  }
}
```

--------------------------------

### Apply responsive line height at breakpoints in HTML with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/line-height

Use Tailwind CSS responsive modifiers such as `md:` to apply line height utilities based on screen size breakpoints. An example like `md:leading-loose` ensures the `leading-loose` utility is applied only for medium screen sizes and larger, enabling adaptive designs.

```html
<p class="leading-none md:leading-loose">
  <!-- ... -->
</p>
```

--------------------------------

### Migrate Tailwind CSS negative values using `calc()` function

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS v3 treats negative prefixes (e.g., `-mx-4`) as a first-class feature, removing negative values from the default theme. If you were referencing negative values using `theme()`, this will now cause compilation errors. Update affected CSS by using the `calc()` function to derive negative values from positive theme values.

```css
.my-class {
  top: theme('top.-4')
  top: calc(theme('top.4') * -1)
}
```

--------------------------------

### Apply Responsive Text Alignment with Tailwind CSS Breakpoints

Source: https://v3.tailwindcss.com/docs/text-align

Illustrates how to apply text alignment based on screen size using responsive breakpoints in Tailwind CSS. The `md:` prefix is a variant modifier that applies the utility class only for medium screen sizes and above, enabling adaptive layouts.

```html
<p class="text-left md:text-center">
  <!-- ... -->
</p>
```

--------------------------------

### Resolve Tailwind CSS @apply Issues in Per-Component Styles (Vue/Svelte)

Source: https://v3.tailwindcss.com/docs/functions-and-directives

When using component frameworks like Vue or Svelte, `@apply` directives within `<style>` blocks fail because Tailwind processes styles in isolation. The solution involves defining custom classes using Tailwind's plugin system in `tailwind.config.js` to make them globally accessible. This ensures component styles can correctly apply custom utilities.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .card {
    background-color: theme(colors.white);
    border-radius: theme(borderRadius.lg);
    padding: theme(spacing.6);
    box-shadow: theme(boxShadow.xl);
  }
}
```

```svelte
<div>
  <slot></slot>
</div>

<style>
  div {
    /* Won't work because this file and main.css are processed separately */
    @apply card;
  }
</style>
```

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  // ...
  plugins: [
    plugin(function ({ addComponents, theme }) {
      addComponents({
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.xl'),
        }
      })
    })
  ]
}
```

--------------------------------

### Apply break-inside with hover state modifier in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/break-inside

Use the hover state variant modifier to conditionally apply break-inside utilities on hover. This example applies the break-inside-avoid-column utility only when the element is hovered, combining state modifiers with Tailwind CSS utilities.

```html
<div class="hover:break-inside-avoid-column">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS Border Width to All Sides

Source: https://v3.tailwindcss.com/docs/border-width

This snippet demonstrates how to use Tailwind CSS utility classes like `border`, `border-2`, `border-4`, and `border-8` to set the border width uniformly on all four sides of an HTML element. It provides examples with different border widths and colors for visual distinction.

```html
<div class="border border-indigo-600 ..."></div>
<div class="border-2 border-indigo-600 ..."></div>
<div class="border-4 border-indigo-600 ..."></div>
<div class="border-8 border-indigo-600 ..."></div><div class="border border-sky-500"></div>
<div class="border-2 border-sky-500"></div>
<div class="border-4 border-sky-500"></div>
<div class="border-8 border-sky-500"></div>
```

--------------------------------

### Use arbitrary text decoration thickness values

Source: https://v3.tailwindcss.com/docs/text-decoration-thickness

Apply custom one-off text-decoration-thickness values using square bracket notation without modifying the theme configuration. This allows dynamic CSS values to be generated on-the-fly for specific use cases.

```html
<p class="decoration-[3px]">
  <!-- ... -->
</p>
```

--------------------------------

### JSX Component with Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/content-configuration

This React JSX component defines and applies Tailwind CSS utility classes to style a button based on passed `color` and `size` props. Tailwind's regex-based scanning process effectively identifies classes used in JSX template literals.

```jsx
const sizes = {
  md: 'px-4 py-2 rounded-md text-base',
  lg: 'px-5 py-3 rounded-lg text-lg',
}

const colors = {
  indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white',
  cyan: 'bg-cyan-600 hover:bg-cyan-700 text-white',
}

export default function Button({ color, size, children }) {
  let colorClasses = colors[color]
  let sizeClasses = sizes[size]

  return (
    <button type="button" className={`font-bold ${sizeClasses} ${colorClasses}`}>
      {children}
    </button>
  )
}
```

--------------------------------

### Set scroll margin with Tailwind utilities

Source: https://v3.tailwindcss.com/docs/scroll-margin

Apply scroll margin utilities (scroll-mt, scroll-mr, scroll-mb, scroll-ml) to set scroll offset around items within a snap container. The example demonstrates a horizontally scrollable grid with left scroll margin applied to each image item.

```html
<div class="snap-x ...">
  <div class="scroll-ml-6 snap-start ...">
    <img src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="scroll-ml-6 snap-start ...">
    <img src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="scroll-ml-6 snap-start ...">
    <img src="https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="scroll-ml-6 snap-start ...">
    <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="scroll-ml-6 snap-start ...">
    <img src="https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
</div>
```

--------------------------------

### Apply Tailwind CSS Word Break at Medium Screens and Above

Source: https://v3.tailwindcss.com/docs/word-break

Use responsive variant modifiers to apply word break utilities based on screen size. This example demonstrates using `md:break-all` to make text break all characters only on medium screen sizes and larger, while defaulting to `break-normal` on smaller screens.

```html
<p class="break-normal md:break-all">
  <!-- ... -->
</p>
```

--------------------------------

### Apply Responsive Breakpoint Modifier to Background Size in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-size

Conditionally apply background size utilities at specific screen sizes using breakpoint variant modifiers like md:. This example uses bg-auto as default and switches to bg-contain at medium screen sizes and above for responsive design.

```html
<div class="bg-auto md:bg-contain">
  <!-- ... -->
</div>
```

--------------------------------

### Use Custom Preset in Project Configuration

Source: https://v3.tailwindcss.com/docs/presets

Import a local preset file into tailwind.config.js and add project-specific customizations. Project-level theme extensions merge with preset values, allowing you to override or extend preset configurations.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('./my-preset.js')
  ],
  // Customizations specific to this project would go here
  theme: {
    extend: {
      minHeight: {
        48: '12rem',
      }
    }
  },
}
```

--------------------------------

### Conditionally Apply `auto-cols-min` at Medium Breakpoint in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/grid-auto-columns

Shows how to use responsive breakpoints with Tailwind CSS utilities to apply styles based on screen size. This example uses `md:auto-cols-min` to set the grid auto column sizing to `min-content` for medium screen sizes and above, overriding the default `auto-cols-max`.

```html
<div class="grid grid-flow-col auto-cols-max md:auto-cols-min">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS Accent Color with Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/accent-color

This HTML example illustrates how to apply accent colors conditionally based on screen size using Tailwind CSS responsive utilities. The checkbox has `accent-pink-300` by default and `md:accent-pink-500` for medium screen sizes and above.

```html
<input type="checkbox" class="accent-pink-300 md:accent-pink-500" checked>
```

--------------------------------

### Apply Text Transform Classes with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-transform

Demonstrates basic text transformation using Tailwind CSS utility classes. The `uppercase`, `lowercase`, `capitalize`, and `normal-case` classes control text casing. Each class applies a corresponding CSS text-transform property value.

```html
<p class="normal-case ...">The quick brown fox ...</p>
<p class="uppercase ...">The quick brown fox ...</p>
<p class="lowercase ...">The quick brown fox ...</p>
<p class="capitalize ...">The quick brown fox ...</p>
```

--------------------------------

### Tailwind CSS Hyphens with Hover State Modifier

Source: https://v3.tailwindcss.com/docs/hyphens

Applies hyphens utility classes conditionally on hover using state variant modifiers. This example demonstrates changing hyphenation behavior from none to auto when the user hovers over the element, enabling dynamic text formatting.

```html
<p class="hyphens-none hover:hyphens-auto">
  <!-- ... -->
</p>
```

--------------------------------

### Disable All Tailwind CSS Core Plugins

Source: https://v3.tailwindcss.com/docs/configuration

To disable all default Tailwind CSS core plugins, configure the `corePlugins` property with an empty array. This setup is ideal for projects that intend to use Tailwind primarily as a PostCSS tool for processing their own custom plugins, without any of Tailwind's built-in utilities.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: []
}
```

--------------------------------

### Customize Tailwind CSS Backdrop Contrast Values in Configuration

Source: https://v3.tailwindcss.com/docs/backdrop-contrast

Explains how to extend or customize the default `backdropContrast` values in your `tailwind.config.js` file. This allows you to define custom contrast levels that can then be used as utility classes.

```javascript
module.exports = {
  theme: {
    extend: {
      backdropContrast: {
        25: '.25'
      }
    }
  }
}
```

--------------------------------

### Apply Negative Text Indent in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-indent

This HTML example shows how to apply a negative text indent using Tailwind CSS. By prefixing the `indent` utility class with a dash, such as `-indent-8`, the `text-indent` CSS property is set to a negative value, causing the first line of text to move outside the block's normal flow.

```HTML
<div class="-indent-8">
  So I started to walk into the water. I won't lie to...
</div>
```

--------------------------------

### Extend Tailwind CSS Default Spacing Scale

Source: https://v3.tailwindcss.com/docs/customizing-spacing

This example shows how to add new, custom values to Tailwind CSS's existing default spacing scale without removing any of the predefined utilities. By configuring `theme.extend.spacing` in `tailwind.config.js`, developers can introduce additional spacing options, such as `p-13` or `m-128`, alongside the standard Tailwind utilities.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '128': '32rem',
        '144': '36rem'
      }
    }
  }
}
```

--------------------------------

### Control Grid Element Placement with grid-flow Utilities

Source: https://v3.tailwindcss.com/docs/grid-auto-flow

Use grid-flow-* utilities to control the auto-placement algorithm behavior in CSS Grid layouts. Supports directional options (row/col) and dense packing variants. Example demonstrates a 3x3 grid with row-dense flow and varied column spans.

```html
<div class="grid grid-flow-row-dense grid-cols-3 grid-rows-3 ...">
  <div class="col-span-2">01</div>
  <div class="col-span-2">02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
```

--------------------------------

### Render Contributors List with Tailwind CSS and Svelte

Source: https://v3.tailwindcss.com/docs/reusing-styles

Creates a contributors display component using Svelte's each loop to render user avatars with negative margin overlap effect. Uses Tailwind utility classes for flexbox layout, spacing, rounded corners, and ring styling. Dependencies include user avatar URLs and handle data.

```svelte
<div>
  <div class="flex items-center space-x-2 text-base">
    <h4 class="font-semibold text-slate-900">Contributors</h4>
    <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">204</span>
  </div>
  <div class="mt-3 flex -space-x-2 overflow-hidden">
    {#each contributors as user}
      <img class="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="{user.avatarUrl}" alt="{user.handle}"/>
    {/each}
  </div>
  <div class="mt-3 text-sm font-medium">
    <a href="#" class="text-blue-500">+ 198 others</a>
  </div>
</div>
```

--------------------------------

### Use Array Syntax for Repeated Keys in CSS-in-JS

Source: https://v3.tailwindcss.com/docs/plugins

Pass an array of objects to addComponents when you need to repeat the same key (e.g., multiple @media queries), as object keys cannot be duplicated.

```javascript
addComponents([
  {
    '@media (min-width: 500px)': {
      // ...
    }
  },
  {
    '@media (min-width: 500px)': {
      // ...
    }
  },
  {
    '@media (min-width: 500px)': {
      // ...
    }
  },
])
```

--------------------------------

### Apply conditional cursor styles using Tailwind CSS state variants

Source: https://v3.tailwindcss.com/docs/cursor

This example illustrates how to apply cursor styles conditionally based on an element's state using Tailwind CSS variant modifiers. For instance, `focus:cursor-auto` will only change the cursor to 'auto' when the element is focused, providing dynamic feedback to the user.

```html
<div class="cursor-not-allowed focus:cursor-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS `pointer-events-auto` and `pointer-events-none` for interactive elements

Source: https://v3.tailwindcss.com/docs/pointer-events

This HTML snippet demonstrates how to control pointer event behavior on elements using Tailwind CSS. It shows an example where a search icon is clickable (`pointer-events-auto`) and another where it ignores pointer events (`pointer-events-none`), allowing interaction with underlying elements. This is useful for designing overlays or custom interactive components.

```html
<div class="relative ...">
  <div class="absolute pointer-events-auto ...">
    <svg class="absolute text-slate-400 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
    </svg>
  </div>
  <input type="text" placeholder="Search" class="...">
</div>

<div class="relative ...">
  <div class="absolute pointer-events-none ...">
    <svg class="absolute text-slate-400 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
    </svg>
  </div>
  <input type="text" placeholder="Search" class="...">
</div>
```

--------------------------------

### Apply background position on hover state with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-position

Example of using Tailwind CSS hover variant modifier to conditionally apply background position utilities. The hover:bg-top class applies the bg-top utility only when the element is hovered, allowing for interactive background position changes.

```html
<div class="bg-center hover:bg-top ..." style="background-image: url(...)"></div>
```

--------------------------------

### Access Tailwind CSS Theme Values with theme() Function

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Tailwind's `theme()` function allows you to directly access values defined in your `tailwind.config.js` file, such as colors, spacing, and other design tokens. This enables consistent styling by pulling values directly from your theme configuration.

```css
.btn {
  background-color: theme('colors.blue.500');
  padding: theme('spacing.2') theme('spacing.4');
  /* ... */
}
```

--------------------------------

### Truncate multi-line text with Tailwind CSS line-clamp

Source: https://v3.tailwindcss.com/docs/line-clamp

This example demonstrates how to use the `line-clamp-3` utility class in Tailwind CSS to truncate a block of text to a maximum of 3 lines. It leverages CSS properties like `overflow: hidden`, `display: -webkit-box`, and `-webkit-line-clamp` to achieve the effect, ensuring text is properly clipped and an ellipsis appears. This is a common pattern for displaying summaries or limited content.

```HTML
<article>
  <time>Mar 10, 2020</time>
  <h2>Boost your conversion rate</h2>
  <p class="line-clamp-3">Nulla dolor velit adipisicing duis excepteur esse in duis nostrud occaecat mollit incididunt deserunt sunt. Ut ut sunt laborum ex occaecat eu tempor labore enim adipisicing minim ad. Est in quis eu dolore occaecat excepteur fugiat dolore nisi aliqua fugiat enim ut cillum. Labore enim duis nostrud eu. Est ut eiusmod consequat irure quis deserunt ex. Enim laboris dolor magna pariatur. Dolor et ad sint voluptate sunt elit mollit officia ad enim sit consectetur enim.</p>
  <div>
    <img src="..." />
    Lindsay Walton
  </div>
</article>
```

--------------------------------

### Configure Default Tailwind CSS Breakpoints

Source: https://v3.tailwindcss.com/docs/breakpoints

This snippet displays the standard `screens` configuration in `tailwind.config.js`, which defines default responsive breakpoints like `sm` and `md`. It maps common `min-width` values to these modifiers, influencing how responsive utilities behave.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    }
  }
}
```

--------------------------------

### Tailwind CSS Space Utilities Properties Reference

Source: https://v3.tailwindcss.com/docs/space

This reference details the CSS properties generated by various Tailwind CSS `space-x-*` and `space-y-*` utility classes. It shows how these classes apply `margin-left` or `margin-top` to direct children, with pixel and rem equivalents, and introduces the `--tw-space-y-reverse` and `--tw-space-x-reverse` custom properties for reversing spacing direction.

```css
space-x-0 > * + * { margin-left: 0px; }
space-y-0 > * + * { margin-top: 0px; }
space-x-0.5 > * + * { margin-left: 0.125rem; /* 2px */ }
space-y-0.5 > * + * { margin-top: 0.125rem; /* 2px */ }
space-x-1 > * + * { margin-left: 0.25rem; /* 4px */ }
space-y-1 > * + * { margin-top: 0.25rem; /* 4px */ }
space-x-1.5 > * + * { margin-left: 0.375rem; /* 6px */ }
space-y-1.5 > * + * { margin-top: 0.375rem; /* 6px */ }
space-x-2 > * + * { margin-left: 0.5rem; /* 8px */ }
space-y-2 > * + * { margin-top: 0.5rem; /* 8px */ }
s
space-x-2.5 > * + * { margin-left: 0.625rem; /* 10px */ }
space-y-2.5 > * + * { margin-top: 0.625rem; /* 10px */ }
s
space-x-3 > * + * { margin-left: 0.75rem; /* 12px */ }
space-y-3 > * + * { margin-top: 0.75rem; /* 12px */ }
s
space-x-3.5 > * + * { margin-left: 0.875rem; /* 14px */ }
space-y-3.5 > * + * { margin-top: 0.875rem; /* 14px */ }
s
space-x-4 > * + * { margin-left: 1rem; /* 16px */ }
space-y-4 > * + * { margin-top: 1rem; /* 16px */ }
s
space-x-5 > * + * { margin-left: 1.25rem; /* 20px */ }
space-y-5 > * + * { margin-top: 1.25rem; /* 20px */ }
s
space-x-6 > * + * { margin-left: 1.5rem; /* 24px */ }
space-y-6 > * + * { margin-top: 1.5rem; /* 24px */ }
s
space-x-7 > * + * { margin-left: 1.75rem; /* 28px */ }
space-y-7 > * + * { margin-top: 1.75rem; /* 28px */ }
s
space-x-8 > * + * { margin-left: 2rem; /* 32px */ }
space-y-8 > * + * { margin-top: 2rem; /* 32px */ }
s
space-x-9 > * + * { margin-left: 2.25rem; /* 36px */ }
space-y-9 > * + * { margin-top: 2.25rem; /* 36px */ }
s
space-x-10 > * + * { margin-left: 2.5rem; /* 40px */ }
space-y-10 > * + * { margin-top: 2.5rem; /* 40px */ }
s
space-x-11 > * + * { margin-left: 2.75rem; /* 44px */ }
space-y-11 > * + * { margin-top: 2.75rem; /* 44px */ }
s
space-x-12 > * + * { margin-left: 3rem; /* 48px */ }
space-y-12 > * + * { margin-top: 3rem; /* 48px */ }
s
space-x-14 > * + * { margin-left: 3.5rem; /* 56px */ }
space-y-14 > * + * { margin-top: 3.5rem; /* 56px */ }
s
space-x-16 > * + * { margin-left: 4rem; /* 64px */ }
space-y-16 > * + * { margin-top: 4rem; /* 64px */ }
s
space-x-20 > * + * { margin-left: 5rem; /* 80px */ }
space-y-20 > * + * { margin-top: 5rem; /* 80px */ }
s
space-x-24 > * + * { margin-left: 6rem; /* 96px */ }
space-y-24 > * + * { margin-top: 6rem; /* 96px */ }
s
space-x-28 > * + * { margin-left: 7rem; /* 112px */ }
space-y-28 > * + * { margin-top: 7rem; /* 112px */ }
s
space-x-32 > * + * { margin-left: 8rem; /* 128px */ }
space-y-32 > * + * { margin-top: 8rem; /* 128px */ }
s
space-x-36 > * + * { margin-left: 9rem; /* 144px */ }
space-y-36 > * + * { margin-top: 9rem; /* 144px */ }
s
space-x-40 > * + * { margin-left: 10rem; /* 160px */ }
space-y-40 > * + * { margin-top: 10rem; /* 160px */ }
s
space-x-44 > * + * { margin-left: 11rem; /* 176px */ }
space-y-44 > * + * { margin-top: 11rem; /* 176px */ }
s
space-x-48 > * + * { margin-left: 12rem; /* 192px */ }
space-y-48 > * + * { margin-top: 12rem; /* 192px */ }
s
space-x-52 > * + * { margin-left: 13rem; /* 208px */ }
space-y-52 > * + * { margin-top: 13rem; /* 208px */ }
s
space-x-56 > * + * { margin-left: 14rem; /* 224px */ }
space-y-56 > * + * { margin-top: 14rem; /* 224px */ }
s
space-x-60 > * + * { margin-left: 15rem; /* 240px */ }
space-y-60 > * + * { margin-top: 15rem; /* 240px */ }
s
space-x-64 > * + * { margin-left: 16rem; /* 256px */ }
space-y-64 > * + * { margin-top: 16rem; /* 256px */ }
s
space-x-72 > * + * { margin-left: 18rem; /* 288px */ }
space-y-72 > * + * { margin-top: 18rem; /* 288px */ }
s
space-x-80 > * + * { margin-left: 20rem; /* 320px */ }
space-y-80 > * + * { margin-top: 20rem; /* 320px */ }
s
space-x-96 > * + * { margin-left: 24rem; /* 384px */ }
space-y-96 > * + * { margin-top: 24rem; /* 384px */ }
s
space-x-px > * + * { margin-left: 1px; }
s
space-y-px > * + * { margin-top: 1px; }
s
space-y-reverse > * + * { --tw-space-y-reverse: 1; }
s
space-x-reverse > * + * { --tw-space-x-reverse: 1; }
```

--------------------------------

### Extend Tailwind CSS `gridColumnEnd` to add custom end positions

Source: https://v3.tailwindcss.com/docs/grid-column

This configuration snippet illustrates how to extend the `gridColumnEnd` section of your Tailwind CSS theme in `tailwind.config.js`. It introduces new `col-end-*` utilities for positions 13 through 17, extending the default grid column end options.

```javascript
module.exports = {
  theme: {
    extend: {
      gridColumnEnd: {
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17'
      }
    }
  }
}
```

--------------------------------

### Force Snap Position Stops with snap-always in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/scroll-snap-stop

Creates a horizontally scrollable container that must stop on each snap point using snap-mandatory and snap-always utilities. This example displays a gallery of images where scrolling is constrained to predefined snap positions, preventing users from scrolling past them.

```html
<div class="snap-x snap-mandatory ...">
  <div class="snap-always snap-center ...">
    <img src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-always snap-center ...">
    <img src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-always snap-center ...">
    <img src="https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-always snap-center ...">
    <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-always snap-center ...">
    <img src="https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
  <div class="snap-always snap-center ...">
    <img src="https://images.unsplash.com/photo-1559333086-b0a56225a93c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80" />
  </div>
</div>
```

--------------------------------

### Recommended: Using Tailwind CSS utility classes directly in Svelte components

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

This is the recommended and most effective way to style components with Tailwind CSS. Instead of defining custom CSS in `<style>` blocks, apply Tailwind's utility classes directly to HTML elements. This approach aligns with Tailwind's core design philosophy, leveraging its global stylesheet for consistent styling, better performance, and easier maintainability.

```svelte
<div class="bg-white rounded-lg p-6 shadow-xl">
  <slot></slot>
</div>
```

--------------------------------

### Incorrectly using Tailwind @layer in Svelte component styles

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

This example illustrates an erroneous attempt to use Tailwind's `@layer` directive within a Svelte component's `<style>` block. Due to isolated processing of component styles by frameworks like Svelte, the PostCSS plugin chain cannot find a corresponding `@tailwind` directive, leading to an error. This approach prevents proper style layering and precedence control.

```svelte
<div>
  <slot></slot>
</div>

<style>
  /* Won't work because this file is processed in isolation */
  @layer components {
    div {
      background-color: theme('colors.white');
      border-radius: theme('borderRadius.lg');
      padding: theme('spacing.6');
      box-shadow: theme('boxShadow.xl');
    }
  }
</style>
```

--------------------------------

### Tailwind CSS: Apply Global Base Styles in HTML

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Illustrates how to apply global default styles, such as text color or background, by adding Tailwind classes directly to the `<html>` or `<body>` elements. This keeps base styling visible within the markup rather than hidden in separate CSS files.

```HTML
<!doctype html>
<html lang="en" class="text-gray-900 bg-gray-100 font-serif">
  <!-- ... -->
</html>
```

--------------------------------

### Apply Tailwind CSS Background Blend Mode on Hover State

Source: https://v3.tailwindcss.com/docs/background-blend-mode

This example shows how to conditionally apply a `background-blend-mode` utility based on an element's state using Tailwind CSS variant modifiers. Here, `hover:bg-blend-darken` ensures the `darken` blend mode is applied only when the element is hovered.

```html
<div class="bg-blend-lighten hover:bg-blend-darken">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Gradient From Color Classes

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

CSS custom property definitions for Tailwind gradient 'from' classes that set the starting color of gradients. Each class defines --tw-gradient-from, --tw-gradient-to, and --tw-gradient-stops variables used in gradient generation. Supports colors from inherit, currentColor, transparent, and the full Tailwind color palette.

```css
.from-inherit {
  --tw-gradient-from: inherit var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-current {
  --tw-gradient-from: currentColor var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-transparent {
  --tw-gradient-from: transparent var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(0 0 0 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-black {
  --tw-gradient-from: #000 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(0 0 0 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-white {
  --tw-gradient-from: #fff var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-slate-50 {
  --tw-gradient-from: #f8fafc var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(248 250 252 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-slate-100 {
  --tw-gradient-from: #f1f5f9 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(241 245 249 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-slate-500 {
  --tw-gradient-from: #64748b var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(100 116 139 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-gray-50 {
  --tw-gradient-from: #f9fafb var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(249 250 251 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-gray-500 {
  --tw-gradient-from: #6b7280 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(107 114 128 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
```

--------------------------------

### Conditional Styling with Tailwind CSS `peer-has-*` Modifier

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Explains how to use the `peer-has-*` modifier to style an element based on the descendants of a sibling element marked with the `peer` class. In this example, an `svg` element is hidden when the preceding `label` (marked as `peer`) contains a checked checkbox.

```html
<fieldset>
  <legend>Today</legend>

  <div>
    <label class="peer ...">
      <input type="checkbox" name="todo[1]" checked />
      Create a to do list
    </label>
    <svg class="peer-has-[:checked]:hidden ...">
      <!-- ... -->
    </svg>
  </div>

  <!-- ... -->
</fieldset>
```

--------------------------------

### Apply Tailwind Border Spacing with Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/border-spacing

Utilize responsive variant modifiers like `md:` or `lg:` to apply border spacing utilities only at specific screen sizes or media queries. This enables adaptive layouts where table border spacing adjusts based on the viewport. The example shows applying `border-spacing-4` from medium screen sizes upwards.

```HTML
<table class="md:border-spacing-4">
  <!-- ... -->
</table>
```

--------------------------------

### Apply Conditional Italic Styling on Hover with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/font-style

This example illustrates how to conditionally apply Tailwind CSS utilities based on user interaction states. The `hover:not-italic` variant ensures that the text becomes non-italic only when the element is hovered over, overriding the default `italic` style.

```html
<p class="italic hover:not-italic">
  <!-- ... -->
</p>
```

--------------------------------

### Exclude nested content from prose styles

Source: https://v3.tailwindcss.com/docs/typography-plugin

Apply the not-prose class to blocks of markup within prose content to prevent inheritance of prose styling. This is useful for sandboxing examples or demos that should not be styled as prose. Note: not-prose cannot be prefixed and new prose instances cannot be nested within not-prose blocks.

```html
<article class="prose">
  <h1>My Heading</h1>
  <p>...</p>

  <div class="not-prose">
    <!-- Some example or demo that needs to be prose-free -->
  </div>

  <p>...</p>
  <!-- ... -->
</article>
```

--------------------------------

### Register Tailwind CSS Plugins

Source: https://v3.tailwindcss.com/docs/configuration

This configuration demonstrates how to register various plugins within the `plugins` array in `tailwind.config.js`. Plugins extend Tailwind's functionality by generating additional utilities, components, base styles, or custom variants.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
    require('tailwindcss-children')
  ]
}
```

--------------------------------

### Customize gradient color stop positions in Tailwind CSS config

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

Demonstrates how to add custom gradient color stop positions to the Tailwind theme. The example adds a 33% stop position that can be used to position gradient color stops at custom intervals, configured in tailwind.config.js under theme.extend.gradientColorStopPositions.

```javascript
module.exports = {
  theme: {
    extend: {
      gradientColorStopPositions: {
        33: '33%',
      }
    }
  }
}
```

--------------------------------

### Understand Tailwind CSS `*` Modifier Specificity Limitations

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Illustrates that styles applied via the parent's `*` modifier will generally override styles applied directly to the child element due to selector specificity. In this example, `bg-red-50` on the `li` will not take precedence over `*:bg-sky-50` on the `ul`.

```html
<ul class="*:bg-sky-50 ...">
  <li class="bg-red-50 ...">Sales</li>
  <li>Marketing</li>
  <li>SEO</li>
  <!-- ... -->
</ul>
```

--------------------------------

### Apply Conditional Text Decoration Color on Hover with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-decoration-color

Illustrates how to conditionally apply a text decoration color utility based on an element's state in Tailwind CSS. This example uses the `hover` variant modifier to change the decoration color when the element is hovered.

```html
<p class="underline decoration-sky-600 hover:decoration-blue-400">
  <!-- ... -->
</p>
```

--------------------------------

### Tailwind CSS Red Gradient From Colors

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

CSS custom properties for red-colored gradient starting points in Tailwind CSS, ranging from red-50 to red-500. Each utility class sets gradient-from color, gradient-to color with full transparency, and combined gradient stops for red-tinted gradient backgrounds.

```css
.from-red-50 {
  --tw-gradient-from: #fef2f2 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(254 242 242 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-red-100 {
  --tw-gradient-from: #fee2e2 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(254 226 226 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-red-200 {
  --tw-gradient-from: #fecaca var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(254 202 202 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-red-300 {
  --tw-gradient-from: #fca5a5 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(252 165 165 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-red-400 {
  --tw-gradient-from: #f87171 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(248 113 113 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-red-500 {
  --tw-gradient-from: #ef4444 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(239 68 68 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
```

--------------------------------

### Apply basic cursor styles with Tailwind CSS utility classes

Source: https://v3.tailwindcss.com/docs/cursor

This snippet demonstrates applying basic cursor styles to elements using Tailwind CSS's `cursor-*` utility classes. When a user hovers over an element, the cursor will change to the specified style, such as a pointer for clickable buttons or a progress indicator for loading states.

```html
<button type="button" class="cursor-pointer ...">
  Submit
</button>
<button type="button" class="cursor-progress ...">
  Saving...
</button>
<button type="button" disabled class="cursor-not-allowed ...">
  Confirm
</button>
```

--------------------------------

### Apply text decoration styles at responsive breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-decoration-style

Use Tailwind CSS media query variant modifiers with decoration-* utilities to conditionally apply text decoration styles at specific responsive breakpoints. For example, md:decoration-dashed applies the dashed decoration style only at medium screen sizes and above.

```html
<p class="underline md:decoration-dashed">
  <!-- ... -->
</p>
```

--------------------------------

### Use custom utilities with modifiers

Source: https://v3.tailwindcss.com/docs/plugins

Shows how custom utilities registered with addUtilities automatically support Tailwind modifiers like lg:, hover:, focus:, etc. Enables responsive and state-based styling on plugin utilities.

```html
<div class="content-auto lg:content-visible">
  <!-- ... -->
</div>
```

--------------------------------

### Reset gradient with hover state maintaining end color in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

Illustrates the behavior of resetting the entire gradient when changing the 'from-*' color on hover. The example shows how to explicitly specify both 'from-*' and 'to-*' colors for hover state to maintain the desired ending color.

```html
<div class="from-teal-400 to-blue-500 hover:from-purple-500 hover:to-blue-500 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Arbitrary Text Underline Offset Value in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-underline-offset

Demonstrates the use of square bracket notation to generate an arbitrary underline-offset value on the fly. This allows applying a one-off 3px offset without modifying the theme configuration file.

```html
<p class="underline-offset-[3px]">
  <!-- ... -->
</p>
```

--------------------------------

### Apply Outline Styles with Tailwind CSS Utilities

Source: https://v3.tailwindcss.com/docs/outline-style

Demonstrates using Tailwind CSS outline utility classes to style button elements with different outline styles (solid, dashed, dotted, double). Each class controls the outline-style property while outline-2 and outline-offset-2 manage width and offset.

```html
<button class="outline outline-2 outline-offset-2 ...">Button A</button>
<button class="outline-dashed outline-2 outline-offset-2 ...">Button B</button>
<button class="outline-dotted outline-2 outline-offset-2 ...">Button C</button>
<button class="outline-double outline-3 outline-offset-2 ...">Button D</button>
```

--------------------------------

### Apply Grid Flow with Hover State Modifier

Source: https://v3.tailwindcss.com/docs/grid-auto-flow

Use state variant modifiers like hover: to conditionally apply grid-flow utilities. Example shows switching from column to row flow on hover. Tailwind supports various state modifiers for interactive user interfaces.

```html
<div class="grid grid-flow-col hover:grid-flow-row">
  <!-- ... -->
</div>
```

--------------------------------

### Undo Tailwind CSS line clamping with line-clamp-none

Source: https://v3.tailwindcss.com/docs/line-clamp

This snippet shows how to disable a previously applied `line-clamp` utility. By adding `line-clamp-none`, you can revert the text truncation, for example, at larger screen sizes using responsive modifiers like `lg:line-clamp-none`. This is useful for adapting text display across different breakpoints, allowing the full text to show when space permits.

```HTML
<p class="line-clamp-3 lg:line-clamp-none">
  <!-- ... -->
</p>
```

--------------------------------

### Define Custom Utility With Tailwind CSS Prefix

Source: https://v3.tailwindcss.com/docs/configuration

This CSS snippet illustrates how to manually include the desired prefix when defining a custom utility class using `@layer utilities`. This ensures that custom utilities adhere to the global prefixing convention.

```css
@layer utilities {
  .tw-bg-brand-gradient { /* ... */ }
}
```

--------------------------------

### Apply styles based on ARIA attributes in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Use aria-* modifiers to conditionally apply styles when ARIA attributes are set. The example applies bg-sky-700 when aria-checked is true. Supports common boolean ARIA attributes like aria-busy, aria-checked, aria-disabled, and others.

```HTML
<div aria-checked="true" class="bg-gray-600 aria-checked:bg-sky-700">
  <!-- ... -->
</div>
```

--------------------------------

### Traditional CSS Chat Notification Component

Source: https://v3.tailwindcss.com/docs/utility-first

A chat notification component built using traditional custom CSS with semantic class names and full style definitions. Demonstrates the traditional approach where custom designs require writing custom CSS for each component with explicit styling for layout, typography, spacing, and visual effects.

```html
<div class="chat-notification">
  <div class="chat-notification-logo-wrapper">
    <img class="chat-notification-logo" src="/img/logo.svg" alt="ChitChat Logo">
  </div>
  <div class="chat-notification-content">
    <h4 class="chat-notification-title">ChitChat</h4>
    <p class="chat-notification-message">You have a new message!</p>
  </div>
</div>

<style>
  .chat-notification {
    display: flex;
    align-items: center;
    max-width: 24rem;
    margin: 0 auto;
    padding: 1.5rem;
    border-radius: 0.5rem;
    background-color: #fff;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  .chat-notification-logo-wrapper {
    flex-shrink: 0;
  }
  .chat-notification-logo {
    height: 3rem;
    width: 3rem;
  }
  .chat-notification-content {
    margin-left: 1.5rem;
  }
  .chat-notification-title {
    color: #1a202c;
    font-size: 1.25rem;
    line-height: 1.25;
  }
  .chat-notification-message {
    color: #718096;
    font-size: 1rem;
    line-height: 1.5;
  }
</style>
```

--------------------------------

### Define Tailwind CSS Gradient From Color Variables

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

These CSS variable definitions are used internally by Tailwind CSS to set the starting color of a gradient. Each entry corresponds to a `from-{color}-{shade}` utility class, specifying the `--tw-gradient-from` and related `--tw-gradient-to` and `--tw-gradient-stops` variables to achieve the desired gradient effect. These are automatically generated by Tailwind's JIT compiler or included in a full build.

```css
--tw-gradient-from: #0891b2 var(--tw-gradient-from-position); --tw-gradient-to: rgb(8 145 178 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #0e7490 var(--tw-gradient-from-position); --tw-gradient-to: rgb(14 116 144 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #155e75 var(--tw-gradient-from-position); --tw-gradient-to: rgb(21 94 117 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #164e63 var(--tw-gradient-from-position); --tw-gradient-to: rgb(22 78 99 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #083344 var(--tw-gradient-from-position); --tw-gradient-to: rgb(8 51 68 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #f0f9ff var(--tw-gradient-from-position); --tw-gradient-to: rgb(240 249 255 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #e0f2fe var(--tw-gradient-from-position); --tw-gradient-to: rgb(224 242 254 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #bae6fd var(--tw-gradient-from-position); --tw-gradient-to: rgb(186 230 253 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #7dd3fc var(--tw-gradient-from-position); --tw-gradient-to: rgb(125 211 252 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #38bdf8 var(--tw-gradient-from-position); --tw-gradient-to: rgb(56 189 248 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #0ea5e9 var(--tw-gradient-from-position); --tw-gradient-to: rgb(14 165 233 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #0284c7 var(--tw-gradient-from-position); --tw-gradient-to: rgb(2 132 199 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #0369a1 var(--tw-gradient-from-position); --tw-gradient-to: rgb(3 105 161 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #075985 var(--tw-gradient-from-position); --tw-gradient-to: rgb(7 89 133 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #0c4a6e var(--tw-gradient-from-position); --tw-gradient-to: rgb(12 74 110 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #082f49 var(--tw-gradient-from-position); --tw-gradient-to: rgb(8 47 73 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #eff6ff var(--tw-gradient-from-position); --tw-gradient-to: rgb(239 246 255 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #dbeafe var(--tw-gradient-from-position); --tw-gradient-to: rgb(219 234 254 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #bfdbfe var(--tw-gradient-from-position); --tw-gradient-to: rgb(191 219 254 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #93c5fd var(--tw-gradient-from-position); --tw-gradient-to: rgb(147 197 253 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #60a5fa var(--tw-gradient-from-position); --tw-gradient-to: rgb(96 165 250 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

```css
--tw-gradient-from: #3b82f6 var(--tw-gradient-from-position); --tw-gradient-to: rgb(59 130 246 / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
```

--------------------------------

### Apply Tailwind CSS Text Utilities Conditionally on Hover

Source: https://v3.tailwindcss.com/docs/text-overflow

Tailwind CSS allows applying utility classes based on component states using variant modifiers. For example, `hover:text-clip` applies the `text-clip` utility only when the element is hovered, dynamically changing the text overflow behavior.

```html
<p class="truncate hover:text-clip">
  <!-- ... -->
</p>
```

--------------------------------

### Use Component Classes with Tailwind Modifiers

Source: https://v3.tailwindcss.com/docs/plugins

Shows how component classes added with addComponents automatically support Tailwind's responsive and state modifiers like md:btn-lg, allowing the same modifiers used for utility classes to work with components.

```html
<div class="btn md:btn-lg">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS classes in a Qwik component

Source: https://v3.tailwindcss.com/docs/guides/qwik

Demonstrates how to use Tailwind's utility classes directly within a Qwik component's JSX. Simply add the desired classes to the `class` attribute of your HTML elements to apply styles.

```TypeScript
import { component$ } from '@builder.io/qwik'

export default component$(() => {
  return (
    <h1 class="text-3xl font-bold underline">
      Hello World!
    </h1>
  )
})
```

--------------------------------

### Apply Styles to Direct Children with Tailwind CSS `*` Modifier

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Demonstrates the use of the `*` modifier to style all direct children of an element. This is useful when you cannot directly add classes to the child elements, such as with dynamically generated content. The example applies rounded corners, borders, and background colors to `li` elements within a `ul`.

```html
<div>
  <h2>Categories<h2>
  <ul class="*:rounded-full *:border *:border-sky-100 *:bg-sky-50 *:px-2 *:py-0.5 dark:text-sky-300 dark:*:border-sky-500/15 dark:*:bg-sky-500/10 ...">
    <li>Sales</li>
    <li>Marketing</li>
    <li>SEO</li>
    <!-- ... -->
  </ul>
</div>
```

--------------------------------

### Apply Brightness with Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/brightness

Use responsive variant modifiers to apply brightness utilities at specific breakpoints. Use md:brightness-* to apply the utility only at medium screen sizes and above. Supports all Tailwind breakpoints and media query modifiers.

```html
<div class="brightness-110 md:brightness-150">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS HTML: Explicitly Set Responsive Line-Height

Source: https://v3.tailwindcss.com/docs/line-height

To maintain a specific line-height at a responsive breakpoint when also changing font size, this HTML example shows that you must explicitly apply a breakpoint-specific line-height utility (e.g., `md:leading-loose`) alongside the responsive font size utility (e.g., `md:text-xl`). This ensures your desired line-height is not implicitly reset.

```html
<!-- The `leading-loose` class will be overridden at the `md` breakpoint -->
<p class="text-lg leading-loose md:text-xl md:leading-loose">
  Maybe we can live without libraries...
</p>
```

--------------------------------

### Alias Tailwind CSS Default Color Names in Config

Source: https://v3.tailwindcss.com/docs/colors

This `tailwind.config.js` example demonstrates aliasing default Tailwind CSS colors to custom, simpler names. By mapping default colors (e.g., `colors.slate` to `gray`), developers can use more intuitive class names like `bg-gray-300`, which is especially useful for consolidating multiple shades under a single, memorable alias.

```javascript
const colors = require('tailwindcss/colors')

module.exports = {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.slate,
      green: colors.emerald,
      purple: colors.violet,
      yellow: colors.amber,
      pink: colors.fuchsia,
    },
  },
}
```

--------------------------------

### Configure blocklist to prevent specific Tailwind classes

Source: https://v3.tailwindcss.com/docs/content-configuration

Use the blocklist option in tailwind.config.js to tell Tailwind to ignore specific classes detected in your content files. This prevents conflicting CSS classes from being generated without requiring a prefix on all Tailwind classes. The blocklist only affects Tailwind-generated CSS, not custom authored CSS.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js}',
    './components/**/*.{html,js}',
  ],
  blocklist: [
    'container',
    'collapse',
  ],
  // ...
}
```

--------------------------------

### Use Arbitrary Saturation Values with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/saturate

Illustrates how to apply one-off, arbitrary saturation values directly in HTML using Tailwind CSS's square bracket syntax, `saturate-[...]`. This method is suitable for values not defined in the theme configuration.

```HTML
<div class="saturate-[.25]">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Tailwind CSS `outline-black` and `outline-white` classes in v3

Source: https://v3.tailwindcss.com/docs/upgrade-guide

In Tailwind CSS v3, `outline-black` and `outline-white` utilities now only set the outline's color. Previously, in v2, they set color, width, style, and offset. To restore v2 behavior, custom CSS can be added using `@layer utilities`, or update HTML with explicit outline classes.

```css
@layer utilities {
  .outline-black {
    outline: 2px dotted black;
    outline-offset: 2px;
  }

  .outline-white {
    outline: 2px dotted white;
    outline-offset: 2px;
  }
}
```

```html
<div class="outline-black">
<div class="outline-black outline-2 outline-dotted outline-offset-2">

<div class="outline-white">
<div class="outline-white outline-2 outline-dotted outline-offset-2">
```

--------------------------------

### Extend Tailwind CSS `gridColumn` to add custom span utilities

Source: https://v3.tailwindcss.com/docs/grid-column

This configuration snippet demonstrates how to extend the `gridColumn` section of your Tailwind CSS theme in `tailwind.config.js`. It adds a new `span-16` utility, allowing elements to span 16 columns. The `span` keyword is included directly in the value definition.

```javascript
module.exports = {
  theme: {
    extend: {
      gridColumn: {
        'span-16': 'span 16 / span 16',
      }
    }
  }
}
```

--------------------------------

### Simplifying Transform and Filter Classes in Tailwind CSS v3.0 HTML

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS v3.0 automatically applies transforms and filters like `scale-50` and `grayscale` without requiring explicit `transform`, `filter`, or `backdrop-filter` utility classes. These classes can generally be removed from HTML, though `transform` might be needed for stacking context if not replaced with `relative` or `isolate`.

```html
<div class="transform scale-50 filter grayscale backdrop-filter backdrop-blur-sm">
<div class="scale-50 grayscale backdrop-blur-sm">
```

--------------------------------

### Set Pseudo-element Content with Tailwind CSS `content` Utility

Source: https://v3.tailwindcss.com/docs/content

This snippet demonstrates how to use Tailwind CSS `content-*` utilities with `before` and `after` variant modifiers to define the content of pseudo-elements. It showcases using arbitrary values with square bracket notation to insert specific text or symbols.

```html
<a class="text-blue-600 after:content-['_↗'] ..." href="https://www.apple.com/pro-display-xdr/" target="_blank">Pro Display XDR</a>
```

--------------------------------

### Tailwind CSS Indigo Gradient Color Utilities

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

CSS utility classes for indigo gradient colors (from-indigo-50 through from-indigo-950) that define gradient color stop variables across the full indigo color spectrum. Each class establishes the gradient start color, transparent end color, and combines both into gradient-stops for creating indigo-toned gradient backgrounds in web designs.

```CSS
.from-indigo-50 {
  --tw-gradient-from: #eef2ff var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(238 242 255 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-100 {
  --tw-gradient-from: #e0e7ff var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(224 231 255 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-200 {
  --tw-gradient-from: #c7d2fe var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(199 210 254 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-300 {
  --tw-gradient-from: #a5b4fc var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(165 180 252 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-400 {
  --tw-gradient-from: #818cf8 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(129 140 248 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-500 {
  --tw-gradient-from: #6366f1 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(99 102 241 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-600 {
  --tw-gradient-from: #4f46e5 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(79 70 229 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-700 {
  --tw-gradient-from: #4338ca var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(67 56 202 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-800 {
  --tw-gradient-from: #3730a3 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(55 48 163 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-900 {
  --tw-gradient-from: #312e81 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(49 46 129 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-indigo-950 {
  --tw-gradient-from: #1e1b4b var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(30 27 75 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
```

--------------------------------

### Generate Prefixed Component Classes in Tailwind Plugin

Source: https://v3.tailwindcss.com/docs/plugins

Demonstrates how addComponents generates CSS classes that automatically respect the prefix setting. Shows button component variations with different colors and hover states, all prefixed with 'tw-'.

```css
.tw-btn {
  padding: .5rem 1rem;
  border-radius: .25rem;
  font-weight: 600;
}
.tw-btn-blue {
  background-color: #3490dc;
  color: #fff;
}
.tw-btn-blue:hover {
  background-color: #2779bd;
}
.tw-btn-red {
  background-color: #e3342f;
  color: #fff;
}
.tw-btn-red:hover {
  background-color: #cc1f1a;
}
```

--------------------------------

### Single-side margin utilities in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/margin

Apply margin to individual sides of an element using mt-*, mr-*, mb-*, and ml-* utility classes. Each class applies a specific margin value to the top, right, bottom, or left side respectively. Example: mt-6 applies 1.5rem margin to the top.

```html
<div class="mt-6 ...">mt-6</div>
<div class="mr-4 ...">mr-4</div>
<div class="mb-8 ...">mb-8</div>
<div class="ml-2 ...">ml-2</div>
```

--------------------------------

### Conditionally Apply Tailwind CSS `auto-rows-min` on Hover

Source: https://v3.tailwindcss.com/docs/grid-auto-rows

This HTML example shows how to apply a Tailwind CSS utility conditionally using variant modifiers. The `hover:auto-rows-min` class ensures that grid rows are sized to their minimum content only when the element is hovered over. This pattern allows for dynamic styling based on user interaction.

```html
<div class="grid grid-flow-row auto-rows-max hover:auto-rows-min">
  <!-- ... -->
</div>
```

--------------------------------

### Conditionally Apply Tailwind CSS Outline Width on Hover/Focus

Source: https://v3.tailwindcss.com/docs/outline-width

Illustrates how to use Tailwind CSS variant modifiers to apply outline width utilities conditionally based on interactive states like hover or focus. This example shows `hover:outline-2` to change the outline width when the element is hovered over.

```html
<div class="outline hover:outline-2">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Place Content Space Evenly Grid Layout

Source: https://v3.tailwindcss.com/docs/place-content

Distributes grid items with even spacing using the place-content-evenly utility. Creates a 2-column grid where items are evenly spaced along the block axis. Ideal for uniform distribution of grid content.

```html
<div class="grid grid-cols-2 gap-4 place-content-evenly h-48 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Use `@config` Directive for Custom Tailwind CSS Configuration

Source: https://v3.tailwindcss.com/docs/configuration

This CSS snippet demonstrates an alternative way to specify a custom Tailwind CSS configuration file directly within your main CSS file. The `@config` directive allows you to point to a configuration path before importing Tailwind's base, components, and utilities.

```css
@config "./tailwindcss-config.js";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

--------------------------------

### Configure Multiple CSS Files with @config Directive

Source: https://v3.tailwindcss.com/docs/configuration

Use the @config directive to specify different Tailwind configuration files for separate CSS entry points. This allows projects to generate multiple CSS outputs with different configurations for different sections (e.g., site and admin).

```css
@config "./tailwind.site.config.js";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

--------------------------------

### Updating Border Opacity with New Syntax in Tailwind CSS v3.0

Source: https://v3.tailwindcss.com/docs/upgrade-guide

When using `border-opacity-*` with the default `border` class in Tailwind CSS v3.0, it's now necessary to explicitly specify the border color using the new opacity modifier syntax, like `border-gray-200/25`. The old `border border-opacity-25` approach no longer works in this specific scenario.

```html
<div class="border border-opacity-25">
<div class="border border-gray-200/25">
```

--------------------------------

### Apply Tailwind CSS not-sr-only at Medium Breakpoints

Source: https://v3.tailwindcss.com/docs/screen-readers

Use responsive variant modifiers to apply `not-sr-only` at specific screen sizes and above, controlling element visibility across different devices. For example, `md:not-sr-only` will make an `sr-only` element visible only on medium screens and larger. This enables flexible display strategies for content depending on the viewport.

```html
<div class="sr-only md:not-sr-only">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS: Automatic Type Inference for Arbitrary Values

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Demonstrates Tailwind's ability to automatically infer the correct CSS property (e.g., `font-size` or `color`) when using arbitrary values. This inference relies on the clear format of the provided value, simplifying class definitions.

```HTML
<!-- Will generate a font-size utility -->
<div class="text-[22px]">...</div>
```

```HTML
<!-- Will generate a color utility -->
<div class="text-[#bada55]">...</div>
```

--------------------------------

### Conditionally apply line height on hover/focus in HTML with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/line-height

Utilize Tailwind CSS state modifiers like `hover:` or `focus:` to apply line height utilities only when an element is in a specific state. For example, `hover:leading-loose` will change the line height to 'loose' on mouse hover, enhancing interactivity.

```html
<p class="leading-none hover:leading-loose">
  <!-- ... -->
</p>
```

--------------------------------

### Add `current` color to Tailwind CSS custom color palette

Source: https://v3.tailwindcss.com/docs/upgrade-guide

In Tailwind CSS v3, `fill-*` and `stroke-*` utilities now mirror `theme.colors` by default. If you have a custom color palette that doesn't include a 'current' entry, `fill-current` and `stroke-current` classes might break. To resolve this, explicitly add `current: 'currentColor'` to your `theme.colors` configuration.

```javascript
module.exports = {
  // ...
  theme: {
    colors: {
      current: 'currentColor',
      // ...
    }
  }
}
```

--------------------------------

### Conditionally Apply Tailwind CSS Hue Rotation on Hover

Source: https://v3.tailwindcss.com/docs/hue-rotate

Apply hue rotation utilities conditionally based on user interaction states, such as hover. Use the `hover:` variant modifier to change the hue rotation of an element when it is hovered over. This example sets a default hue rotation and changes it on hover.

```html
<div class="hue-rotate-60 hover:hue-rotate-0">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Blue Gradient Color Utilities

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

CSS utility classes for blue gradient colors (from-blue-600 through from-blue-950) that define gradient color stop variables. Each class sets the starting gradient color, transparent end color, and combines them into gradient-stops for use in gradient backgrounds. These utilities support responsive design and can be combined with other Tailwind classes.

```CSS
.from-blue-600 {
  --tw-gradient-from: #2563eb var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(37 99 235 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-blue-700 {
  --tw-gradient-from: #1d4ed8 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(29 78 216 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-blue-800 {
  --tw-gradient-from: #1e40af var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(30 64 175 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-blue-900 {
  --tw-gradient-from: #1e3a8a var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(30 58 138 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-blue-950 {
  --tw-gradient-from: #172554 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(23 37 84 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
```

--------------------------------

### Tailwind CSS Responsive Vertical Alignment with Breakpoints

Source: https://v3.tailwindcss.com/docs/vertical-align

Apply vertical alignment utilities conditionally at specific responsive breakpoints. Uses breakpoint variant modifiers (e.g., md:) to apply alignment only at medium screen sizes and above. Enables adaptive layouts across device sizes.

```HTML
<p class="align-middle md:align-top">
  <!-- ... -->
</p>
```

--------------------------------

### Apply max-h Utilities at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/max-height

Demonstrates responsive design using breakpoint variant modifiers. The md:max-h-screen utility applies the max-height constraint only at medium screen sizes and above. Works with all standard Tailwind breakpoints.

```html
<div class="h-48 max-h-full md:max-h-screen">
  <!-- ... -->
</div>
```

--------------------------------

### Conditional List Style Image with Hover State Variant

Source: https://v3.tailwindcss.com/docs/list-style-image

Apply list style image utilities conditionally using Tailwind CSS state variants. This example shows how to use the hover: variant modifier to apply the list-image utility only when the list element is hovered, enabling interactive styling without custom CSS.

```html
<ul class="list-image-none hover:list-image-[url(checkmark.png)]">
  <!-- ... -->
</ul>
```

--------------------------------

### Apply Drop Shadow at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/drop-shadow

Use media query variant modifiers to apply drop-shadow utilities at specific responsive breakpoints. The md: prefix applies the utility at medium screen sizes and above. Enables progressive enhancement of shadow effects based on screen size.

```HTML
<div class="drop-shadow-md md:drop-shadow-xl">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Blur Values with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/blur

Illustrates how to apply one-off blur values directly in HTML using Tailwind CSS's arbitrary value syntax. This allows for applying a specific `blur` value, such as `2px`, without needing to modify the `tailwind.config.js` theme file.

```html
<div class="blur-[2px]">
  <!-- ... -->
</div>
```

--------------------------------

### Configure PostCSS for Multiple CSS Files with Tailwind

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Use the postcss-import plugin to combine multiple CSS files into a single stylesheet before processing with Tailwind. This configuration prevents errors when using @layer directives across multiple files and ensures proper directive recognition.

```javascript
module.exports = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

--------------------------------

### Configure Responsive Horizontal Padding for Tailwind CSS Container

Source: https://v3.tailwindcss.com/docs/container

Explains how to specify different padding amounts for containers at various breakpoints by providing an object to the `padding` option in `tailwind.config.js`. This includes a `DEFAULT` value and breakpoint-specific overrides for granular control over spacing.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    container: {
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem'
      }
    }
  }
};
```

--------------------------------

### Applying Grid Column Utilities on Hover State in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/grid-column

Demonstrates conditional application of grid column utilities using Tailwind CSS state modifiers. The hover: variant modifier applies the col-span-6 utility only when the element is hovered, allowing dynamic layout changes based on user interaction.

```html
<div class="col-span-2 hover:col-span-6">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Violet Gradient Color Utilities

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

CSS utility classes for violet gradient colors (from-violet-50 through from-violet-500) that define gradient color stop variables for the violet color palette. Each class sets the gradient starting color, transparent ending color, and defines gradient-stops for creating violet-themed gradient backgrounds and visual effects in Tailwind CSS projects.

```CSS
.from-violet-50 {
  --tw-gradient-from: #f5f3ff var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(245 243 255 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-violet-100 {
  --tw-gradient-from: #ede9fe var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(237 233 254 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-violet-200 {
  --tw-gradient-from: #ddd6fe var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(221 214 254 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-violet-300 {
  --tw-gradient-from: #c4b5fd var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(196 181 253 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-violet-400 {
  --tw-gradient-from: #a78bfa var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(167 139 250 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-violet-500 {
  --tw-gradient-from: #8b5cf6 var(--tw-gradient-from-position);
  --tw-gradient-to: rgb(139 92 246 / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
```

--------------------------------

### Apply arbitrary outline-offset value to button

Source: https://v3.tailwindcss.com/docs/outline-offset

Demonstrates using Tailwind CSS arbitrary value syntax with square brackets to apply a custom outline-offset value (3px) that is not predefined in the theme. This allows one-off custom values without modifying the configuration file.

```html
<button class="outline-offset-[3px]">
  <!-- ... -->
</button>
```

--------------------------------

### Use arbitrary delay values with square brackets

Source: https://v3.tailwindcss.com/docs/transition-delay

Apply one-off transition delay values using square bracket notation without modifying the theme configuration. Useful for unique delay values that don't warrant theme customization.

```html
<div class="delay-[2000ms]">
  <!-- ... -->
</div>
```

--------------------------------

### Define Content Paths for Tailwind CSS Scanning in `tailwind.config.js`

Source: https://v3.tailwindcss.com/docs/configuration

This snippet demonstrates how to configure the `content` section of `tailwind.config.js`. It specifies the file paths where Tailwind CSS should look for class names, ensuring that only used styles are generated in the final CSS output.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js}',
    './components/**/*.{html,js}',
  ],
  // ...
}
```

--------------------------------

### Enable GPU hardware acceleration with transform-gpu

Source: https://v3.tailwindcss.com/docs/scale

Force GPU rendering for better transform performance by adding the transform-gpu utility class. Use transform-cpu to revert to CPU rendering if needed for conditional optimization.

```html
<div class="scale-150 transform-gpu">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS saturate Utility at Specific Breakpoints

Source: https://v3.tailwindcss.com/docs/saturate

Demonstrates how to use responsive variant modifiers, such as `md:`, to apply the `saturate-150` utility only on medium screen sizes and above. This allows for breakpoint-specific styling of saturation.

```HTML
<div class="saturate-50 md:saturate-150">
  <!-- ... -->
</div>
```

--------------------------------

### Applying touch action with responsive breakpoint modifier

Source: https://v3.tailwindcss.com/docs/touch-action

Demonstrates using Tailwind CSS responsive breakpoint modifiers with touch action utilities. The md: variant applies the touch-pan-x utility only at medium screen sizes and above, enabling responsive touch behavior that adapts to different device screen widths.

```html
<div class="md:touch-pan-x">
  <!-- ... -->
</div>
```

--------------------------------

### Create Dynamic Parameterized Variants with matchVariant

Source: https://v3.tailwindcss.com/docs/plugins

Uses matchVariant to register variants with parameters like nth-child selectors, similar to built-in supports-*, data-*, and aria-* variants. Accepts a predefined values object for static parameters.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ matchVariant }) {
      matchVariant(
        'nth',
        (value) => {
          return `&:nth-child(${value})`;
        },
        {
          values: {
            1: '1',
            2: '2',
            3: '3',
          }
        }
      );
    })
  ]
}
```

--------------------------------

### Apply Backdrop Saturate with Responsive Breakpoint

Source: https://v3.tailwindcss.com/docs/backdrop-saturate

Use responsive variant modifiers like md: to apply backdrop-saturate utilities at specific screen sizes. This allows different backdrop saturation values for different device sizes or media query conditions.

```html
<div class="backdrop-saturate-50 md:backdrop-saturate-150">
  <!-- ... -->
</div>
```

--------------------------------

### Use arbitrary Tailwind CSS line-clamp values

Source: https://v3.tailwindcss.com/docs/line-clamp

This snippet demonstrates the use of arbitrary values for `line-clamp` utilities in Tailwind CSS. By using square brackets (e.g., `line-clamp-[7]`), you can apply a specific line clamp value without needing to configure it in your `tailwind.config.js` file. This is useful for one-off, unique styling requirements where adding to the theme would be overkill.

```HTML
<p class="line-clamp-[7]">
  <!-- ... -->
</p>
```

--------------------------------

### Apply Text Color with Hover State in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-color

Use Tailwind CSS utility classes with hover variant modifiers to conditionally apply text colors on user interaction. The `hover:` prefix applies the utility class only when the element is hovered. This example demonstrates applying different text colors on hover to paragraph elements.

```html
<p class="text-slate-500 hover:text-blue-600">The quick brown fox...</p>
<p class="text-slate-400 hover:text-sky-400">The quick brown fox...</p>
```

--------------------------------

### Default `postcss.config.js` with Tailwind CSS and Autoprefixer

Source: https://v3.tailwindcss.com/docs/configuration

This JavaScript code shows the structure of a `postcss.config.js` file generated with the `-p` flag. It includes plugins for `tailwindcss` and `autoprefixer`, ready to process CSS with these tools.

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

--------------------------------

### Apply Arbitrary Tailwind CSS Padding Values

Source: https://v3.tailwindcss.com/docs/padding

Apply one-off padding values directly within your HTML using Tailwind CSS's arbitrary value syntax. This feature allows for precise, ad-hoc padding adjustments without needing to modify the `tailwind.config.js` theme file.

```html
<div class="p-[5px]">
  <!-- ... -->
</div>
```

--------------------------------

### Conditional Snap Utility with Hover State

Source: https://v3.tailwindcss.com/docs/scroll-snap-align

Demonstrates applying snap utilities conditionally using Tailwind's hover variant modifier. The snap-center class is applied by default, but changes to snap-start on hover. This allows dynamic snap behavior based on user interaction.

```html
<div class="snap-center hover:snap-start">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Arbitrary Transition Duration Value

Source: https://v3.tailwindcss.com/docs/transition-duration

Use square bracket notation to apply arbitrary transition-duration values that are not defined in your theme configuration. Useful for one-off values that don't warrant adding to the theme customization.

```html
<div class="duration-[2000ms]">
  <!-- ... -->
</div>
```

--------------------------------

### Style First and Last Child Elements with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Apply different styles to the first and last child elements in a list using the `first` and `last` modifiers. This example removes top padding from the first list item and bottom padding from the last item, creating proper spacing in a contact list. The modifiers work with any pseudo-class selector supported by Tailwind.

```html
<ul role="list" class="p-6 divide-y divide-slate-200">
  {#each people as person}
    <!-- Remove top/bottom padding when first/last child -->
    <li class="flex py-4 first:pt-0 last:pb-0">
      <img class="h-10 w-10 rounded-full" src="{person.imageUrl}" alt="" />
      <div class="ml-3 overflow-hidden">
        <p class="text-sm font-medium text-slate-900">{person.name}</p>
        <p class="text-sm text-slate-500 truncate">{person.email}</p>
      </div>
    </li>
  {/each}
</ul>
```

--------------------------------

### Set Maximum Height with Tailwind CSS max-h Utilities

Source: https://v3.tailwindcss.com/docs/max-height

Demonstrates basic usage of max-h-* utility classes to constrain element maximum heights. Shows multiple max-height values applied to nested divs within a fixed-height container. No external dependencies required.

```html
<div class="h-96 ...">
  <div class="h-full max-h-80 ...">max-h-80</div>
  <div class="h-full max-h-64 ...">max-h-64</div>
  <div class="h-full max-h-48 ...">max-h-48</div>
  <div class="h-full max-h-40 ...">max-h-40</div>
  <div class="h-full max-h-32 ...">max-h-32</div>
  <div class="h-full max-h-24 ...">max-h-24</div>
  <div class="h-full max-h-full ...">max-h-full</div>
</div>
```

--------------------------------

### Style Odd and Even Rows in Tables with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Apply alternating background colors to table rows using the `odd` and `even` modifiers. This example alternates white backgrounds for odd rows with slate-50 for even rows, improving table readability. The modifiers automatically apply based on the element's position without requiring conditional logic.

```html
<table>
  <!-- ... -->
  <tbody>
    {#each people as person}
      <!-- Use a white background for odd rows, and slate-50 for even rows -->
      <tr class="odd:bg-white even:bg-slate-50">
        <td>{person.name}</td>
        <td>{person.title}</td>
        <td>{person.email}</td>
      </tr>
    {/each}
  </tbody>
</table>
```

--------------------------------

### Customize Tailwind CSS column theme values

Source: https://v3.tailwindcss.com/docs/columns

This snippet demonstrates how to extend Tailwind CSS's default column configuration by adding custom column sizes to the `theme.extend.columns` section of your `tailwind.config.js` file. This allows for tailored column utilities beyond the default scale. Requires a Node.js environment and Tailwind CSS configuration.

```javascript
module.exports = {
  theme: {
    extend: {
      columns: {
        '4xs': '14rem'
      }
    }
  }
}
```

--------------------------------

### Aliasing Deprecated Tailwind CSS v2 Color Names in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/upgrade-guide

Tailwind CSS v3.0 uses extended color names by default, so v2 aliases like `green` (which was `emerald`) need to be remapped. This JavaScript configuration snippet shows how to alias these colors back in `tailwind.config.js` to maintain compatibility with existing projects using the old names.

```javascript
const colors = require('tailwindcss/colors')

module.exports = {
  theme: {
    extend: {
      colors: {
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
      }
    },
  },
  // ...
}
```

--------------------------------

### Apply gradient with hover state modifier in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/gradient-color-stops

Demonstrates using the hover variant modifier to change gradient colors on hover. The example shows a button with a teal-to-blue gradient that transitions to pink-to-orange on hover. Note that changing the 'from-*' color resets the entire gradient, requiring explicit specification of the 'to-*' color.

```html
<button type="button" class="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-pink-500 hover:to-orange-500 ...">
  Hover me
</button>
```

--------------------------------

### Set Minimum Height with Tailwind CSS `min-h-*` Utilities

Source: https://v3.tailwindcss.com/docs/min-height

This code demonstrates how to apply various `min-h-*` utility classes to `div` elements to control their minimum height. Each utility corresponds to a specific pixel or rem value, or a percentage (e.g., `min-h-full`).

```html
<div class="h-96 ...">
  <div class="min-h-80 ...">min-h-80</div>
  <div class="min-h-64 ...">min-h-64</div>
  <div class="min-h-48 ...">min-h-48</div>
  <div class="min-h-40 ...">min-h-40</div>
  <div class="min-h-32 ...">min-h-32</div>
  <div class="min-h-24 ...">min-h-24</div>
  <div class="min-h-full ...">min-h-full</div>
</div>
```

--------------------------------

### Registering a Custom Tailwind CSS Plugin in JavaScript

Source: https://v3.tailwindcss.com/docs/plugins

This snippet demonstrates how to define a custom Tailwind CSS plugin. It shows importing the `plugin` function and passing an anonymous function, which receives helper functions like `addUtilities`, `addComponents`, `e`, and `config`, to register new styles within `tailwind.config.js`.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addUtilities, addComponents, e, config }) {
      // Add your custom styles here
    }),
  ]
}
```

--------------------------------

### HTML - Arbitrary Flex Grow Value in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/flex-grow

Uses square bracket notation to apply a one-off arbitrary `flex-grow` value of 2 without adding it to the theme configuration. Useful for unique values that don't warrant theme customization.

```html
<div class="grow-[2]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Arbitrary Flex Values in Tailwind CSS HTML

Source: https://v3.tailwindcss.com/docs/flex

This HTML snippet illustrates the use of arbitrary values for `flex` utilities in Tailwind CSS. It allows developers to apply one-off `flex` property values directly in the HTML using square bracket notation, useful for values not defined in the theme.

```html
<div class="flex-[2_2_0%]">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Place Content Space Between Grid Layout

Source: https://v3.tailwindcss.com/docs/place-content

Distributes grid items with equal space between rows using the place-content-between utility. Creates a 2-column grid where rows are spaced evenly along the block axis. Effective for creating balanced spacing in grid layouts.

```html
<div class="grid grid-cols-2 gap-4 place-content-between h-48 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Use Arbitrary Values with Square Bracket Notation

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Generate Tailwind CSS classes on-the-fly with arbitrary values using square bracket notation for pixel-perfect designs. Supports combining with interactive modifiers (hover) and responsive modifiers (lg) for flexible styling without leaving the HTML.

```html
<div class="top-[117px]">
  <!-- ... -->
</div>
```

```html
<div class="top-[117px] lg:top-[344px]">
  <!-- ... -->
</div>
```

```html
<div class="bg-[#bada55] text-[22px] before:content-['Festivus']">
  <!-- ... -->
</div>
```

```html
<div class="grid grid-cols-[fit-content(theme(spacing.32))]">
  <!-- ... -->
</div>
```

```html
<div class="bg-[--my-color]">
  <!-- ... -->
</div>
```

--------------------------------

### Differentiate Nested Groups with Named Group Modifiers

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Style elements based on specific parent group states by assigning unique names to groups using `group/{name}` class and applying conditional styles with `group-hover/{name}` modifiers. This example shows a person list item with nested edit actions that become visible on hover of the parent group.

```html
<ul role="list">
  {#each people as person}
    <li class="group/item hover:bg-slate-100 ...">
      <img src="{person.imageUrl}" alt="" />
      <div>
        <a href="{person.url}">{person.name}</a>
        <p>{person.title}</p>
      </div>
      <a class="group/edit invisible hover:bg-slate-200 group-hover/item:visible ..." href="tel:{person.phone}">
        <span class="group-hover/edit:text-gray-700 ...">Call</span>
        <svg class="group-hover/edit:translate-x-0.5 group-hover/edit:text-slate-500 ...">
          <!-- ... -->
        </svg>
      </a>
    </li>
  {/each}
</ul>
```

--------------------------------

### Use arbitrary z-index values with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/z-index

Applies one-off z-index values using Tailwind CSS arbitrary value syntax with square brackets. Generates CSS property on-the-fly without requiring theme customization for unique values.

```html
<div class="z-[100]">
  <!-- ... -->
</div>
```

--------------------------------

### Style Form Elements with State Modifiers in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Apply conditional styling to form inputs based on their state using modifiers like `disabled`, `invalid`, and `focus`. This example demonstrates a disabled username input with specific styling for disabled and invalid states, and focus ring styles. Using state modifiers reduces template conditional logic by applying the same classes regardless of input state.

```html
<form>
  <label class="block">
    <span class="block text-sm font-medium text-slate-700">Username</span>
    <!-- Using form state modifiers, the classes can be identical for every input -->
    <input type="text" value="tbone" disabled class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
      focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
      disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
      invalid:border-pink-500 invalid:text-pink-600
      focus:invalid:border-pink-500 focus:invalid:ring-pink-500
    "/>
  </label>
  <!-- ... -->
</form>
```

--------------------------------

### Apply Tailwind CSS Container with Auto Margins

Source: https://v3.tailwindcss.com/docs/container

Demonstrates how to use the `container` class in HTML along with `mx-auto` to center it horizontally. The `container` class sets `max-width` based on breakpoints to match the `min-width` of the current breakpoint.

```html
<div class="container mx-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Create Basic N-Column Grid with Tailwind CSS `grid-cols-*` (HTML)

Source: https://v3.tailwindcss.com/docs/grid-template-columns

This HTML snippet demonstrates how to define a basic grid layout with a fixed number of equally sized columns using Tailwind CSS's `grid-cols-4` utility. It's applied to a `div` element, creating a 4-column grid with a gap of 4 units, useful for simple content arrangements.

```html
<div class="grid grid-cols-4 gap-4">
  <div>01</div>
  <!-- ... -->
  <div>09</div>
</div>
```

--------------------------------

### Basic Transition Timing Function HTML

Source: https://v3.tailwindcss.com/docs/transition-timing-function

Demonstrates how to apply ease-* utilities to HTML buttons with duration modifiers. Shows three buttons with different easing curves (ease-in, ease-out, ease-in-out) that trigger on hover. These utilities control the CSS transition-timing-function property for smooth animations.

```html
<button class="ease-in duration-300 ...">Button A</button>
<button class="ease-out duration-300 ...">Button B</button>
<button class="ease-in-out duration-300 ...">Button C</button>
```

--------------------------------

### Style Child Elements Based on Parent State with group-{modifier}

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Apply styles to child elements when a parent element enters a specific state using the `group` class and `group-*` modifiers like `group-hover`. This example changes both text and icon colors when hovering over a parent card link. The pattern works with any pseudo-class modifier including group-focus, group-active, and group-odd.

```html
<a href="#" class="group block max-w-xs mx-auto rounded-lg p-6 bg-white ring-1 ring-slate-900/5 shadow-lg space-y-3 hover:bg-sky-500 hover:ring-sky-500">
  <div class="flex items-center space-x-3">
    <svg class="h-6 w-6 stroke-sky-500 group-hover:stroke-white" fill="none" viewBox="0 0 24 24"><!-- ... --></svg>
    <h3 class="text-slate-900 group-hover:text-white text-sm font-semibold">New project</h3>
  </div>
  <p class="text-slate-500 group-hover:text-white text-sm">Create a new project from a variety of starting templates.</p>
</a>
```

--------------------------------

### Apply Arbitrary Drop Shadow Values

Source: https://v3.tailwindcss.com/docs/drop-shadow

Generate one-off drop shadow values using square brackets syntax without modifying the theme configuration. Allows arbitrary CSS filter values to be applied directly in HTML for custom shadow effects not covered by predefined utilities.

```HTML
<div class="drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)]">
  <!-- ... -->
</div>
```

--------------------------------

### Stylus @apply with @css wrapper

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Stylus requires @apply directives to be wrapped in @css blocks so Stylus treats the content as literal CSS. However, this approach prevents using Stylus features inside the @css block, making it a limited solution.

```stylus
@css {
  .card {
    @apply rounded-lg bg-white p-4
  }
}
```

--------------------------------

### Apply Tailwind CSS `content` Utility at Specific Breakpoints

Source: https://v3.tailwindcss.com/docs/content

This snippet demonstrates how to use responsive variant modifiers in Tailwind CSS to conditionally apply `content` utilities based on screen size breakpoints. It allows for different pseudo-element content to be displayed on mobile versus desktop.

```html
<div class="before:content-['Mobile'] md:before:content-['Desktop']">
  <!-- ... -->
</div>
```

--------------------------------

### Chat Notification with CSS-Only Abstraction (Not Recommended)

Source: https://v3.tailwindcss.com/docs/reusing-styles

Shows the problematic approach of using CSS classes to abstract components. While CSS can be updated in one place, the HTML structure must still be duplicated across every instance, limiting flexibility for structural changes. Demonstrates why component-based approaches are superior.

```html
<div class="chat-notification">
  <div class="chat-notification-logo-wrapper">
    <img class="chat-notification-logo" src="/img/logo.svg" alt="ChitChat Logo">
  </div>
  <div class="chat-notification-content">
    <div class="chat-notification-title">ChitChat</div>
    <p class="chat-notification-message">You have a new message!</p>
  </div>
</div>

<style>
  .chat-notification { /* ... */ }
  .chat-notification-logo-wrapper { /* ... */ }
  .chat-notification-logo { /* ... */ }
  .chat-notification-content { /* ... */ }
  .chat-notification-title { /* ... */ }
  .chat-notification-message { /* ... */ }
</style>
```

--------------------------------

### Apply Custom Tailwind CSS Breakpoints in HTML

Source: https://v3.tailwindcss.com/docs/breakpoints

This HTML snippet showcases the practical application of custom screen names defined in `tailwind.config.js`. It illustrates how modifiers like `tablet:` and `laptop:` are used with utility classes to create responsive layouts based on custom breakpoint configurations.

```html
<div class="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4">
  <!-- ... -->
</div>
```

--------------------------------

### Import global CSS in gatsby-browser.js

Source: https://v3.tailwindcss.com/docs/guides/gatsby

Create or modify 'gatsby-browser.js' at the root of your project to import the newly created './src/styles/global.css' file. This step ensures that your global styles, including Tailwind CSS, are loaded and applied across your Gatsby application.

```Javascript
import './src/styles/global.css'
```

--------------------------------

### Apply Arbitrary CSS Properties in Tailwind

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Use square bracket notation to write arbitrary CSS properties that Tailwind doesn't include utilities for out of the box. Supports modifiers for conditional styling and CSS variables that can change under different responsive conditions.

```html
<div class="[mask-type:luminance]">
  <!-- ... -->
</div>
```

```html
<div class="[mask-type:luminance] hover:[mask-type:alpha]">
  <!-- ... -->
</div>
```

```html
<div class="[--scroll-offset:56px] lg:[--scroll-offset:44px]">
  <!-- ... -->
</div>
```

--------------------------------

### Setting background position with Tailwind CSS utilities

Source: https://v3.tailwindcss.com/docs/background-position

HTML markup demonstrating how to apply Tailwind CSS background position utilities (bg-left-top, bg-top, bg-right-top, etc.) to position background images on div elements. Each utility corresponds to a specific CSS background-position value and can be combined with bg-no-repeat for non-repeating backgrounds.

```html
<div class="bg-no-repeat bg-left-top ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-top ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-right-top ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-left ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-center ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-right ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-left-bottom ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-bottom ..." style="background-image: url(...);"></div>
<div class="bg-no-repeat bg-right-bottom ..." style="background-image: url(...);"></div>
```

--------------------------------

### Apply Backdrop Saturation Classes in HTML

Source: https://v3.tailwindcss.com/docs/backdrop-saturate

Use backdrop-saturate utility classes to control an element's backdrop saturation. The classes range from backdrop-saturate-0 (0% saturation) to backdrop-saturate-200 (200% saturation). Combine with background color utilities like bg-white/30 for visual effect.

```html
<div class="backdrop-saturate-50 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-saturate-125 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-saturate-200 bg-white/30 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Apply box-border utility in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/box-sizing

This HTML snippet demonstrates how to use the `box-border` utility class in Tailwind CSS. It sets the `box-sizing` CSS property to `border-box`, ensuring that an element's specified width and height include its padding and borders. This is the default behavior in Tailwind's preflight styles.

```html
<div class="box-border h-32 w-32 p-4 border-4 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Apply z-index at responsive breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/z-index

Implements responsive z-index using Tailwind CSS breakpoint variant modifiers. Applies z-0 by default and z-50 at medium screen sizes and above using md: prefix.

```html
<div class="z-0 md:z-50">
  <!-- ... -->
</div>
```

--------------------------------

### Add List Semantics for VoiceOver Accessibility

Source: https://v3.tailwindcss.com/docs/preflight

Adds a role="list" attribute to an unstyled list element to ensure it is properly announced as a list by screen readers like VoiceOver. This maintains accessibility for assistive technology while keeping the visual styling removed.

```html
<ul role="list">
  <li>One</li>
  <li>Two</li>
  <li>Three</li>
</ul>
```

--------------------------------

### Register Configurable Plugin Without Custom Options

Source: https://v3.tailwindcss.com/docs/plugins

Register plugins created with withOptions API normally without invoking them to use default configuration.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    // ...
  },
  plugins: [
    require('./plugins/markdown.js')
  ],
}
```

--------------------------------

### Set Text Color with Tailwind CSS Utilities

Source: https://v3.tailwindcss.com/docs/text-color

Demonstrates how to apply predefined text colors to HTML elements using Tailwind CSS `text-*` utility classes. This allows for quick and consistent styling of text content across a web application.

```html
<p class="text-blue-600">The quick brown fox...</p><p class="text-sky-400">The quick brown fox...</p>
```

--------------------------------

### Apply Arbitrary Width Value in Tailwind CSS with HTML

Source: https://v3.tailwindcss.com/docs/width

Shows how to use an arbitrary, one-off width value directly within your HTML markup using Tailwind CSS. This method uses square bracket notation (e.g., `w-[32rem]`) to apply a specific width without adding it to the theme configuration.

```html
<div class="w-[32rem]">
  <!-- ... -->
</div>
```

--------------------------------

### Percentage-Based Sizes with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/size

Set element width and height to percentage values of the parent container using size utilities like size-full, size-1/2, size-1/3, and size-2/3. The size-full class makes an element 100% of its parent's width and height, useful for filling container spaces or creating responsive layouts.

```html
<div class="h-56 p-2 ...">
  <div class="size-full ...">size-full</div>
</div>
```

--------------------------------

### Set Viewport Width with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/width

Illustrates the use of the w-screen utility class to make an element occupy the full width of the current viewport. This is often used for hero sections or full-width banners that need to span the entire screen.

```html
<div class="w-screen">
  <!-- ... -->
</div>
```

--------------------------------

### Arbitrary Space Value in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/space

Use square bracket notation to apply one-off space values on the fly without adding them to the theme. This is useful for unique spacing requirements that don't justify theme customization.

```html
<div class="space-y-[5px]">
  <!-- ... -->
</div>
```

--------------------------------

### Make Image Display Inline with Tailwind Utility

Source: https://v3.tailwindcss.com/docs/preflight

Overrides the default block display of an image element back to inline using the inline utility class. This provides a quick way to restore inline display behavior when needed for specific image elements.

```html
<img class="inline" src="..." alt="...">
```

--------------------------------

### Sass screen() function with parentheses

Source: https://v3.tailwindcss.com/docs/using-with-preprocessors

Sass requires the Tailwind screen() function to be wrapped in parentheses within media queries. This prevents Sass from generating errors and allows the media query to work correctly, though it results in an extra set of parentheses.

```scss
@media (screen(md)) {
  .foo {
    color: blue;
  }
}
```

--------------------------------

### Apply bg-cover Background Size in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-size

Scale a background image to fill the entire background layer using the bg-cover utility class. This approach maintains aspect ratio while covering the full container, potentially cropping parts of the image. Combined with bg-center for alignment.

```html
<div class="bg-cover bg-center ..." style="background-image: url(...)"></div>
```

--------------------------------

### Define grid rows with Tailwind CSS `grid-rows-*` utilities

Source: https://v3.tailwindcss.com/docs/grid-template-rows

This snippet demonstrates how to use Tailwind CSS `grid-rows-*` utilities to define a grid with a specified number of equally sized rows. It also shows the application of `grid-flow-col` for column flow and `gap-4` for spacing between grid items, creating a basic grid layout.

```html
<div class="grid grid-rows-4 grid-flow-col gap-4">
  <div>01</div>
  <!-- ... -->
  <div>09</div>
</div>
```

--------------------------------

### Select All Text on Click with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/user-select

Use the select-all utility class to automatically select all text in an element when a user clicks on it. Useful for code snippets, input fields, or content that users might want to copy entirely.

```html
<div class="select-all ...">
  The quick brown fox jumps over the lazy dog.
</div>
```

--------------------------------

### Tailwind CSS: Explicit Type Hint for Arbitrary Values with CSS Variables

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Shows how to explicitly hint the underlying CSS data type (e.g., `length:` or `color:`) when using ambiguous arbitrary values like CSS variables. This ensures Tailwind generates the correct utility, such as for `font-size` or `color` properties.

```HTML
<!-- Will generate a font-size utility -->
<div class="text-[length:var(--my-var)]">...</div>
```

```HTML
<!-- Will generate a color utility -->
<div class="text-[color:var(--my-var)]">...</div>
```

--------------------------------

### Generate `tailwind.config.js` with a Custom Filename via CLI

Source: https://v3.tailwindcss.com/docs/configuration

This command allows you to generate a Tailwind CSS configuration file with a name other than the default `tailwind.config.js`. Useful for projects requiring specific naming conventions or multiple configuration files.

```bash
npx tailwindcss init tailwindcss-config.js
```

--------------------------------

### Define Custom Color Theme with @utility Directive

Source: https://v3.tailwindcss.com/docs/typography-plugin

Creates a custom prose color theme using the @utility directive in CSS. This approach defines all prose-related CSS variables for normal and inverted color modes, including body text, headings, links, code blocks, and table borders. Applicable for Tailwind CSS projects using utility directives.

```css
@utility prose-pink {
  --tw-prose-body: var(--color-pink-800);
  --tw-prose-headings: var(--color-pink-900);
  --tw-prose-lead: var(--color-pink-700);
  --tw-prose-links: var(--color-pink-900);
  --tw-prose-bold: var(--color-pink-900);
  --tw-prose-counters: var(--color-pink-600);
  --tw-prose-bullets: var(--color-pink-400);
  --tw-prose-hr: var(--color-pink-300);
  --tw-prose-quotes: var(--color-pink-900);
  --tw-prose-quote-borders: var(--color-pink-300);
  --tw-prose-captions: var(--color-pink-700);
  --tw-prose-code: var(--color-pink-900);
  --tw-prose-pre-code: var(--color-pink-100);
  --tw-prose-pre-bg: var(--color-pink-900);
  --tw-prose-th-borders: var(--color-pink-300);
  --tw-prose-td-borders: var(--color-pink-200);
  --tw-prose-invert-body: var(--color-pink-200);
  --tw-prose-invert-headings: var(--color-white);
  --tw-prose-invert-lead: var(--color-pink-300);
  --tw-prose-invert-links: var(--color-white);
  --tw-prose-invert-bold: var(--color-white);
  --tw-prose-invert-counters: var(--color-pink-400);
  --tw-prose-invert-bullets: var(--color-pink-600);
  --tw-prose-invert-hr: var(--color-pink-700);
  --tw-prose-invert-quotes: var(--color-pink-100);
  --tw-prose-invert-quote-borders: var(--color-pink-700);
  --tw-prose-invert-captions: var(--color-pink-400);
  --tw-prose-invert-code: var(--color-white);
  --tw-prose-invert-pre-code: var(--color-pink-300);
  --tw-prose-invert-pre-bg: rgb(0 0 0 / 50%);
  --tw-prose-invert-th-borders: var(--color-pink-600);
  --tw-prose-invert-td-borders: var(--color-pink-700);
}
```

--------------------------------

### Customize Backdrop Saturate in Tailwind Config

Source: https://v3.tailwindcss.com/docs/backdrop-saturate

Extend the default backdrop-saturate utilities by editing the tailwind.config.js file. Add custom saturation values to theme.extend.backdropSaturate to create application-specific utility classes.

```javascript
module.exports = {
  theme: {
    extend: {
      backdropSaturate: {
        25: '.25'
      }
    }
  }
}
```

--------------------------------

### Customize Tailwind CSS line-clamp utility values in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/line-clamp

Shows how to extend the default `lineClamp` utilities in your `tailwind.config.js` file. By adding a custom value like `7: '7'` to `theme.extend.lineClamp`, you can generate a new `line-clamp-7` utility class. This allows for tailored design systems, providing custom line truncation options beyond the default provided values.

```JavaScript
module.exports = {
  theme: {
    extend: {
      lineClamp: {
        7: '7',
      },
    }
  }
}
```

--------------------------------

### Create Table Layout with Tailwind CSS Display Utilities

Source: https://v3.tailwindcss.com/docs/display

Use Tailwind CSS table display utilities (`table`, `table-row`, `table-cell`, `table-header-group`, `table-row-group`) to create semantic table layouts without HTML table elements. This approach provides flexibility in structure while maintaining table-like visual presentation and proper accessibility semantics.

```html
<div class="table w-full ...">
  <div class="table-header-group ...">
    <div class="table-row">
      <div class="table-cell text-left ...">Song</div>
      <div class="table-cell text-left ...">Artist</div>
      <div class="table-cell text-left ...">Year</div>
    </div>
  </div>
  <div class="table-row-group">
    <div class="table-row">
      <div class="table-cell ...">The Sliding Mr. Bones (Next Stop, Pottersville)</div>
      <div class="table-cell ...">Malcolm Lockyer</div>
      <div class="table-cell ...">1961</div>
    </div>
    <div class="table-row">
      <div class="table-cell ...">Witchy Woman</div>
      <div class="table-cell ...">The Eagles</div>
      <div class="table-cell ...">1972</div>
    </div>
    <div class="table-row">
      <div class="table-cell ...">Shining Star</div>
      <div class="table-cell ...">Earth, Wind, and Fire</div>
      <div class="table-cell ...">1975</div>
    </div>
  </div>
</div>
```

--------------------------------

### Reference Tailwind Config in JavaScript using resolveConfig

Source: https://v3.tailwindcss.com/docs/configuration

Use the resolveConfig helper from tailwindcss to generate a fully merged configuration object in JavaScript. This enables access to theme values programmatically for dynamic styling, particularly useful in React or Vue components. Note: This increases bundle size; consider using babel-plugin-preval for static generation.

```javascript
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from './tailwind.config.js'

const fullConfig = resolveConfig(tailwindConfig)

fullConfig.theme.width[4]
// => '1rem'

fullConfig.theme.screens.md
// => '768px'

fullConfig.theme.boxShadow['2xl']
// => '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
```

--------------------------------

### Customize Tailwind CSS Opacity Theme Values

Source: https://v3.tailwindcss.com/docs/opacity

Explains how to extend the default Tailwind CSS theme to add custom `opacity` values in `tailwind.config.js`. This allows developers to define unique opacity percentages beyond the standard options, integrating them seamlessly into the utility class system.

```javascript
module.exports = {
  theme: {
    extend: {
      opacity: {
        '67': '.67'
      }
    }
  }
}
```

--------------------------------

### Tailwind CSS Place Content Stretch Grid Layout

Source: https://v3.tailwindcss.com/docs/place-content

Stretches grid items along their grid areas using the place-content-stretch utility. Expands 4 items in a 2-column grid to fill available space on the block axis. Useful for full-height grid item layouts.

```html
<div class="grid grid-cols-2 gap-4 place-content-stretch h-48 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Use Custom Static Variants in HTML

Source: https://v3.tailwindcss.com/docs/plugins

Demonstrates how custom variants registered with addVariant can be used in HTML markup just like built-in variants (hover, focus), enabling classes like optional:border-gray-300 and hocus:bg-blue-600.

```html
<form class="flex inverted-colors:outline ...">
  <input class="optional:border-gray-300 ..." />
  <button class="bg-blue-500 hocus:bg-blue-600">...</button>
</form>
```

--------------------------------

### Arbitrary Scroll Padding Value in HTML

Source: https://v3.tailwindcss.com/docs/scroll-padding

Demonstrates using square bracket notation to generate a one-off scroll padding value on the fly without needing to define it in your theme configuration. This approach is useful for unique scroll padding values that don't fit into your standard spacing scale.

```html
<div class="scroll-p-[24rem]">
  <!-- ... -->
</div>
```

--------------------------------

### Format CSS Color Channel Variables for Different Functions

Source: https://v3.tailwindcss.com/docs/colors

Demonstrates proper CSS variable formatting for different color functions. Space-separated syntax for modern rgb/hsl functions, comma-separated for legacy rgba/hsla functions, and degree notation for HSL values.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* For rgb(255 115 179 / 1) */
    --color-primary: 255 115 179;

    /* For hsl(333deg 100% 73% / 1) */
    --color-primary: 333deg 100% 73%;

    /* For rgba(255, 115, 179, 1) */
    --color-primary: 255, 115, 179;
  }
}
```

--------------------------------

### Apply Appearance Utility at Specific Breakpoints

Source: https://v3.tailwindcss.com/docs/appearance

Shows how to use Tailwind CSS breakpoint modifiers to apply appearance utilities responsively. The md:appearance-none modifier applies the appearance-none utility only at medium screen sizes and above, enabling responsive design patterns.

```html
<div class="appearance-auto md:appearance-none">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Flex Wrap at Specific Breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/flex-wrap

This snippet shows how to use responsive prefixes like `md:` in Tailwind CSS to apply a flex-wrap utility class only at medium screen sizes and above, controlling flex item wrapping based on breakpoints.

```html
<div class="flex flex-wrap md:flex-wrap-reverse">
  <!-- ... -->
</div>
```

--------------------------------

### Configure Theme in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Define custom design tokens including screens, colors, font families, and extended spacing/border-radius in the theme section of tailwind.config.js. This configuration file controls the core design system for your Tailwind CSS project.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    colors: {
      'blue': '#1fb6ff',
      'pink': '#ff49db',
      'orange': '#ff7849',
      'green': '#13ce66',
      'gray-dark': '#273444',
      'gray': '#8492a6',
      'gray-light': '#d3dce6',
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  }
}
```

--------------------------------

### Configure Tailwind with Prefix and Important Settings

Source: https://v3.tailwindcss.com/docs/plugins

Sets up a Tailwind configuration with a custom prefix 'tw-' and important flag enabled. Component classes will automatically respect the prefix but not the important setting unless manually added with !important.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  important: true,
  // ...
}
```

--------------------------------

### Apply local background attachment with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-attachment

Use the `bg-local` utility class to make a background image scroll along with its container's content and the viewport.

```html
<div class="bg-local ..." style="background-image: url(...)"></div>
```

--------------------------------

### Apply arbitrary aspect ratio value to element

Source: https://v3.tailwindcss.com/docs/aspect-ratio

Use square bracket notation to apply a one-off arbitrary aspect ratio value directly in the HTML without adding it to the theme configuration. This is useful for unique aspect ratios that don't need to be reused.

```html
<iframe class="w-full aspect-[4/3]" src="https://www.youtube.com/..."></iframe>
```

--------------------------------

### Apply box-decoration-slice and box-decoration-clone in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/box-decoration-break

This HTML snippet demonstrates the basic application of Tailwind CSS's `box-decoration-slice` and `box-decoration-clone` utilities. It shows how these classes affect the rendering of background, text color, and padding across a line break within `<span>` elements, illustrating the difference between continuous and distinct block rendering.

```html
<span class="box-decoration-slice bg-gradient-to-r from-indigo-600 to-pink-500 text-white px-2 ...">
  Hello<br />
  World
</span>
<span class="box-decoration-clone bg-gradient-to-r from-indigo-600 to-pink-500 text-white px-2 ...">
  Hello<br />
  World
</span>
```

--------------------------------

### Apply arbitrary max-width values using square bracket syntax

Source: https://v3.tailwindcss.com/docs/max-width

Use square bracket notation to apply one-off max-width values directly in HTML without adding them to the theme configuration. This is useful for unique values that don't warrant a custom theme entry, such as `max-w-[220px]`.

```html
<div class="max-w-[220px]">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Configuration for ESM or TypeScript Projects

Source: https://v3.tailwindcss.com/docs/configuration

This code block illustrates the structure of a Tailwind CSS configuration file compatible with ES Modules (ESM) or TypeScript environments. It uses `export default` for module export and includes JSDoc for type hinting, enhancing developer experience.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Configure Typography Plugin in Tailwind CSS v4

Source: https://v3.tailwindcss.com/docs/typography-plugin

Adds the typography plugin to your main style.css file using the @plugin directive. This configuration is for Tailwind CSS v4 projects using the new configuration approach.

```css
@import "tailwindcss";
+ @plugin "@tailwindcss/typography";
```

--------------------------------

### Apply Tailwind CSS Arbitrary Top Value in HTML

Source: https://v3.tailwindcss.com/docs/top-right-bottom-left

This HTML snippet illustrates the use of Tailwind CSS arbitrary values to apply a one-off `top` position. By enclosing '3px' in square brackets `top-[3px]`, a utility class is generated on the fly without needing to modify the `tailwind.config.js` file, useful for unique and non-reusable values.

```html
<div class="top-[3px]">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Tailwind CSS Outline Width Values in HTML

Source: https://v3.tailwindcss.com/docs/outline-width

Demonstrates the use of arbitrary values in Tailwind CSS to apply one-off `outline-width` values directly in HTML without needing to modify the configuration file. This is useful for unique styling requirements not covered by the theme.

```html
<div class="outline-[5px]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Font Family Utilities with HTML

Source: https://v3.tailwindcss.com/docs/font-family

Basic HTML markup demonstrating how to apply Tailwind's font family utility classes (font-sans, font-serif, font-mono) to paragraph elements for controlling text typeface.

```html
<p class="font-sans ...">The quick brown fox ...</p>
<p class="font-serif ...">The quick brown fox ...</p>
<p class="font-mono ...">The quick brown fox ...</p>
```

--------------------------------

### Tailwind CSS Place Content Space Around Grid Layout

Source: https://v3.tailwindcss.com/docs/place-content

Distributes grid items with equal space around each row using the place-content-around utility. Positions 4 items in a 2-column grid with balanced spacing around all rows. Useful for symmetric spacing in grid layouts.

```html
<div class="grid grid-cols-2 gap-4 place-content-around h-48 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Apply Transition Duration with Tailwind CSS Classes

Source: https://v3.tailwindcss.com/docs/transition-duration

Use the duration-* utility classes to control an element's CSS transition-duration property. Combines transition, duration, and easing utilities for smooth animations. Supports values from 0s to 1000ms with predefined increments.

```html
<button class="transition duration-150 ease-in-out ...">Button A</button>
<button class="transition duration-300 ease-in-out ...">Button B</button>
<button class="transition duration-700 ease-in-out ...">Button C</button>
```

--------------------------------

### Apply One-Off Custom Colors Using Tailwind CSS Arbitrary Values

Source: https://v3.tailwindcss.com/docs/colors

This HTML snippet demonstrates Tailwind CSS's arbitrary value notation for applying a custom color directly in the markup. It's useful for one-off custom colors without needing to modify the `tailwind.config.js` file, generating classes on-demand for specific elements like the button here.

```html
<button class="bg-[#1da1f2] text-white ...">
  <svg><!-- ... --></svg>
  Share on Twitter
</button>
```

--------------------------------

### Customize Space Theme in Tailwind Config

Source: https://v3.tailwindcss.com/docs/space

Customize only the space scale by editing theme.space or theme.extend.space in tailwind.config.js. This provides a dedicated configuration option separate from general spacing.

```javascript
module.exports = {
  theme: {
    extend: {
      space: {
        '5px': '5px',
      }
    }
  }
}
```

--------------------------------

### Apply Auto Table Layout with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/table-layout

This snippet demonstrates the use of `table-auto` to allow a table to automatically size its columns based on the content within each cell. This is the default browser behavior for table layout.

```html
<table class="table-auto">
  <thead>
    <tr>
      <th>Song</th>
      <th>Artist</th>
      <th>Year</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>The Sliding Mr. Bones (Next Stop, Pottersville)</td>
      <td>Malcolm Lockyer</td>
      <td>1961</td>
    </tr>
    <tr>
      <td>Witchy Woman</td>
      <td>The Eagles</td>
      <td>1972</td>
    </tr>
    <tr>
      <td>Shining Star</td>
      <td>Earth, Wind, and Fire</td>
      <td>1975</td>
    </tr>
  </tbody>
</table>
```

--------------------------------

### Apply Prefix to Complex Selectors in Tailwind Plugin

Source: https://v3.tailwindcss.com/docs/plugins

Demonstrates that all classes in a selector are prefixed automatically when using addComponents. A selector like '.navbar-inverse a.nav-link' becomes '.tw-navbar-inverse a.tw-nav-link' with the 'tw-' prefix.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  prefix: 'tw-',
  plugins: [
    plugin(function({ addComponents }) {
      const components = {
        // ...
        '.navbar-inverse a.nav-link': {
            color: '#fff',
        }
      }

      addComponents(components)
    })
  ]
}
```

--------------------------------

### Use Arbitrary Flex Basis Values in HTML

Source: https://v3.tailwindcss.com/docs/flex-basis

Apply one-off flex basis values directly in HTML using square bracket notation without modifying the theme configuration. This approach is useful for unique values that don't warrant adding to your theme. The basis-[14.2857143%] class demonstrates generating a custom flex basis property on the fly.

```html
<div class="basis-[14.2857143%]">
  <!-- ... -->
</div>
```

--------------------------------

### Use arbitrary `order` values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/order

This snippet illustrates how to apply one-off `order` values that are not part of the defined theme using arbitrary value syntax. By enclosing the desired value in square brackets, e.g., `order-[13]`, Tailwind CSS generates the corresponding CSS property on the fly. This is useful for unique cases without needing to modify the configuration file.

```html
<div class="order-[13]">
  <!-- ... -->
</div>
```

--------------------------------

### Extend Preflight with Custom Base Styles using @layer

Source: https://v3.tailwindcss.com/docs/preflight

Add custom base styles on top of Tailwind's Preflight using the @layer base directive. This allows you to define default styles for HTML elements like headings and links while maintaining Tailwind's reset base styles. The custom styles are applied after Preflight and before component and utility layers.

```CSS
@tailwind base;

@layer base {
  h1 {
    @apply text-2xl;
  }
  h2 {
    @apply text-xl;
  }
  h3 {
    @apply text-lg;
  }
  a {
    @apply text-blue-600 underline;
  }
}

@tailwind components;

@tailwind utilities;
```

--------------------------------

### Use arbitrary scale values with square bracket notation

Source: https://v3.tailwindcss.com/docs/scale

Generate one-off scale values using square bracket syntax without adding them to the theme configuration. Useful for unique scale multipliers that don't need to be reused across the project.

```html
<div class="scale-[1.7]">
  <!-- ... -->
</div>
```

--------------------------------

### Responsive List Style Image with Breakpoint Variant

Source: https://v3.tailwindcss.com/docs/list-style-image

Use Tailwind CSS breakpoint variant modifiers to apply list style image utilities at specific screen sizes. The md: prefix applies the utility only at medium screen sizes and above, enabling responsive list styling across different device sizes.

```html
<ul class="list-image-none md:list-image-[url(checkmark.png)]">
  <!-- ... -->
</ul>
```

--------------------------------

### Tailwind CSS: Preserve Underscore in URL Paths

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Illustrates how Tailwind CSS intelligently preserves underscores in contexts like URLs where spaces are invalid. This ensures that values such as file paths remain unmodifed, preventing issues with asset loading.

```HTML
<div class="bg-[url('/what_a_rush.png')]">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Tailwind CSS Spacing Scale in Config

Source: https://v3.tailwindcss.com/docs/padding

Extend the default spacing scale in your `tailwind.config.js` file to introduce custom spacing values for all spacing-related utilities. This allows for consistent application of bespoke spacing units, including padding, across your project.

```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '5px': '5px'
      }
    }
  }
}
```

--------------------------------

### Customize Backdrop Opacity Theme in Tailwind Config

Source: https://v3.tailwindcss.com/docs/backdrop-opacity

Extend or customize backdrop-opacity values in the tailwind.config.js file using theme.extend.backdropOpacity. Allows adding custom opacity values that generate corresponding utility classes for project-specific needs.

```javascript
module.exports = {
  theme: {
    extend: {
      backdropOpacity: {
        15: '.15',
      }
    }
  }
}
```

--------------------------------

### Apply Responsive Tailwind CSS `grid-cols-*` at Breakpoints (HTML)

Source: https://v3.tailwindcss.com/docs/grid-template-columns

This HTML snippet demonstrates how to apply Tailwind CSS `grid-cols-*` utilities responsively using breakpoint modifiers. The grid changes from 1 column to 6 columns at medium screen sizes and above (e.g., `md:grid-cols-6`), adapting the layout for different devices and screen dimensions.

```html
<div class="grid grid-cols-1 md:grid-cols-6">
  <!-- ... -->
</div>
```

--------------------------------

### Apply List Style Type Utilities in HTML

Source: https://v3.tailwindcss.com/docs/list-style-type

Demonstrates how to use Tailwind CSS list style type utilities (list-disc, list-decimal, list-none) on unordered and ordered lists. These utility classes directly map to CSS list-style-type property values for styling list markers.

```html
<ul class="list-disc">
  <li>Now this is a story all about how, my life got flipped-turned upside down</li>
  <!-- ... -->
</ul>

<ol class="list-decimal">
  <li>Now this is a story all about how, my life got flipped-turned upside down</li>
  <!-- ... -->
</ol>

<ul class="list-none">
  <li>Now this is a story all about how, my life got flipped-turned upside down</li>
  <!-- ... -->
</ul>
```

--------------------------------

### Tailwind CSS place-self-auto Grid Alignment

Source: https://v3.tailwindcss.com/docs/place-self

Align a grid item based on the container's place-items property using the place-self-auto utility class. Creates a 3-column grid layout where the second item uses auto alignment.

```html
<div class="grid grid-cols-3 gap-4 ...">
  <div>01</div>
  <div class="place-self-auto ...">02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>
```

--------------------------------

### Demonstrate Tailwind CSS Utility Class Duplication in HTML

Source: https://v3.tailwindcss.com/docs/reusing-styles

This HTML snippet illustrates a common issue in Tailwind CSS development where utility classes for similar elements, such as avatar images, are repeated multiple times. It highlights the verbosity and potential maintenance challenges that arise from direct duplication of styling.

```html
<div>
  <div class="flex items-center space-x-2 text-base">
    <h4 class="font-semibold text-slate-900">Contributors</h4>
    <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">204</span>
  </div>
  <div class="mt-3 flex -space-x-2 overflow-hidden">
    <img class="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
    <img class="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
    <img class="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" alt=""/>
    <img class="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
    <img class="inline-block h-12 w-12 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
  </div>
  <div class="mt-3 text-sm font-medium">
    <a href="#" class="text-blue-500">+ 198 others</a>
  </div>
</div>
```

--------------------------------

### Apply Justify Content at Specific Breakpoints in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/justify-content

This snippet illustrates how to apply Tailwind CSS `justify-content` utilities conditionally based on screen size using responsive breakpoints. It uses `md:justify-between` to apply the 'space-between' alignment utility only for medium screens and above, while smaller screens default to `justify-start`.

```html
<div class="flex justify-start md:justify-between">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Place Content Center Grid Layout

Source: https://v3.tailwindcss.com/docs/place-content

Centers grid items along the block axis using the place-content-center utility class. Creates a 2-column grid with 4 items centered vertically within a 48-unit height container. Useful for centering content in grid-based layouts.

```html
<div class="grid grid-cols-2 gap-4 place-content-center h-48 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Configure content paths in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/guides/gatsby

Update the 'content' array in your 'tailwind.config.js' file to specify the paths to all your template files (e.g., '.js', '.jsx', '.ts', '.tsx' files within 'src/pages' and 'src/components'). This allows Tailwind CSS to scan these files for utility classes and generate only the necessary CSS.

```Javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

```

--------------------------------

### Create Block-Level Grid Containers with Tailwind CSS `grid`

Source: https://v3.tailwindcss.com/docs/display

This HTML snippet uses the Tailwind CSS `grid` utility to establish a block-level grid container. It enables the creation of complex two-dimensional layouts by defining rows and columns for child elements.

```html
<div class="grid gap-4 grid-cols-3 grid-rows-3">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS: Convert Underscore to Space in Grid Columns

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Demonstrates how Tailwind CSS automatically converts underscores in arbitrary values to spaces during build-time, useful for defining grid column tracks. This allows for cleaner syntax in class names where a space is logically intended.

```HTML
<div class="grid grid-cols-[1fr_500px_2fr]">
  <!-- ... -->
</div>
```

--------------------------------

### Set Dynamic Viewport Height with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/height

Use the h-dvh utility class to set an element's height to the dynamic viewport height, which adapts as the browser UI expands or contracts (e.g., when address bar is visible/hidden). This provides a more accurate viewport height measurement than h-screen on mobile browsers.

```html
<div class="h-dvh">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Variants for Selector Modification

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Apply arbitrary variants using square bracket notation for on-the-fly selector modification, similar to built-in pseudo-class variants (hover) or responsive variants (md). Enables complex selectors like nth-child combinations with multiple modifiers directly in HTML.

```html
<ul role="list">
  {#each items as item}
    <li class="lg:[&:nth-child(3)]:hover:underline">{item}</li>
  {/each}
</ul>
```

--------------------------------

### Apply backdrop-grayscale utilities in HTML

Source: https://v3.tailwindcss.com/docs/backdrop-grayscale

Use `backdrop-grayscale` and `backdrop-grayscale-0` utilities to control whether an element's backdrop is rendered as grayscale or in full color. The `backdrop-grayscale-0` class renders the backdrop in full color while `backdrop-grayscale` applies 100% grayscale filter.

```html
<div class="backdrop-grayscale-0 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-grayscale bg-white/30 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Applying Inset Rings with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/ring-width

This snippet illustrates the use of the `ring-inset` utility to force a ring to render on the inside of an element. This is particularly useful for UI elements positioned at the edge of the screen where an external ring might be partially obscured, ensuring full visibility.

```html
<button class="... ring-2 ring-pink-300 ring-inset">
  Save Changes
</button><button class="... ring-2 ring-pink-500 ring-inset">
  Save Changes
</button>
```

--------------------------------

### Responsive breakpoint with Tailwind CSS md:items-center

Source: https://v3.tailwindcss.com/docs/align-items

Use media query variant modifiers like md:items-center to apply align-items utilities at specific breakpoints. The md: prefix applies the utility only at medium screen sizes and above.

```html
<div class="flex items-stretch md:items-center">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Arbitrary Grayscale Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/grayscale

Shows how to use arbitrary values to apply a one-off grayscale percentage directly within an HTML class. This method uses square bracket notation `grayscale-[value]` for values not defined in the theme.

```html
<div class="grayscale-[50%]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS justify-self at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/justify-self

Illustrates using responsive modifiers like `md:` to apply `justify-self` utilities only at specific screen sizes or above. This enables adaptive layouts for different viewports, ensuring optimal presentation across devices.

```html
<div class="justify-self-start md:justify-self-end">
  <!-- ... -->
</div>
```

--------------------------------

### Logical Scroll Padding Properties with Bidirectional Text in HTML

Source: https://v3.tailwindcss.com/docs/scroll-padding

Shows how to use scroll-ps-6 and scroll-pe-6 utilities to apply logical inline-start and inline-end scroll padding that automatically adjust based on text direction (LTR or RTL). Demonstrates conditional application for both left-to-right and right-to-left layouts.

```html
<div dir="ltr">
  <div class="scroll-ps-6 snap-x ...">
    <!-- ... -->
  </div>
</div>

<div dir="rtl">
  <div class="scroll-ps-6 snap-x ...">
    <!-- ... -->
  </div>
</div>
```

--------------------------------

### Set Media Elements to Block Display

Source: https://v3.tailwindcss.com/docs/preflight

Preflight sets images, videos, SVGs, canvas, audio, iframes, and other replaced elements to display: block with vertical-align: middle. This prevents unexpected inline alignment issues and provides consistent behavior across different media types.

```css
img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block;
  vertical-align: middle;
}
```

--------------------------------

### Create Block-Level Flex Containers with Tailwind CSS `flex`

Source: https://v3.tailwindcss.com/docs/display

This HTML snippet demonstrates how to use the Tailwind CSS `flex` utility to create a block-level flex container. It's commonly used to arrange child elements in a row or column, enabling flexible box layout for responsive designs.

```html
<div class="flex items-center">
  <img src="path/to/image.jpg">
  <div>
    <strong>Andrew Alfred</strong>
    <span>Technical advisor</span>
  </div>
</div>
```

--------------------------------

### Conditionally apply Tailwind CSS `whitespace-pre` at medium breakpoints

Source: https://v3.tailwindcss.com/docs/whitespace

This snippet illustrates using responsive variant modifiers to apply a `whitespace` utility class based on screen size. `md:whitespace-pre` ensures that `whitespace-pre` is active only on medium screen sizes and above, while `whitespace-normal` applies by default on smaller screens.

```html
<div class="whitespace-normal md:whitespace-pre">
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS Place Content End Grid Layout

Source: https://v3.tailwindcss.com/docs/place-content

Packs grid items against the end of the block axis using the place-content-end utility. Aligns 4 items in a 2-column grid to the bottom of the container. Useful for bottom-aligned grid content.

```html
<div class="grid grid-cols-2 gap-4 place-content-end h-48 ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>
```

--------------------------------

### Basic Backdrop Invert Usage in HTML

Source: https://v3.tailwindcss.com/docs/backdrop-invert

Apply backdrop-invert or backdrop-invert-0 classes to elements to control whether backdrop colors are inverted. The backdrop-invert class applies invert(100%) while backdrop-invert-0 applies invert(0) for normal rendering.

```html
<div class="backdrop-invert-0 bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-invert bg-white/30 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS Outline Width Utilities to HTML Elements

Source: https://v3.tailwindcss.com/docs/outline-width

Demonstrates how to apply predefined outline width utilities like `outline-1`, `outline-2`, and `outline-4` to HTML elements. These classes set the `outline-width` property, requiring the `outline` class to be present for the outline to be visible.

```html
<button class="outline outline-offset-2 outline-1 ...">Button A</button>
<button class="outline outline-offset-2 outline-2 ...">Button B</button>
<button class="outline outline-offset-2 outline-4 ...">Button C</button>
```

--------------------------------

### Conditionally apply background attachment at breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/background-attachment

Shows how to use responsive breakpoint modifiers, such as `md:`, to apply the `bg-fixed` utility only at medium screen sizes and above, maintaining `bg-local` otherwise.

```html
<div class="bg-local md:bg-fixed">
  <!-- ... -->
</div>
```

--------------------------------

### Use Tailwind CSS Logical Properties for Positioning

Source: https://v3.tailwindcss.com/docs/top-right-bottom-left

Tailwind CSS provides `start-*` and `end-*` utilities that map to `inset-inline-start` and `inset-inline-end` logical properties. These properties automatically adjust their physical direction (left or right) based on the current text direction (`ltr` or `rtl`), offering enhanced flexibility for internationalization.

```html
<div dir="ltr">
  <div class="relative h-32 w-32 ...">
    <div class="absolute h-14 w-14 top-0 start-0 ..."></div>
  </div>
<div>

<div dir="rtl">
  <div class="relative h-32 w-32 ...">
    <div class="absolute h-14 w-14 top-0 start-0 ..."></div>
  </div>
<div>
```

--------------------------------

### Restore Default Element Appearance with appearance-auto

Source: https://v3.tailwindcss.com/docs/appearance

Shows how to use appearance-auto to restore default browser styling on elements. This utility is particularly useful for accessibility modes like forced-colors, allowing elements to fall back to standard browser controls when needed.

```html
<label>
  <div>
    <input type="checkbox" class="appearance-none forced-colors:appearance-auto ..." />
    <svg class="invisible peer-checked:visible forced-colors:hidden ...">
      <!-- ... -->
    </svg>
  </div>
  Falls back to default appearance
</label>
```

--------------------------------

### Apply Sepia at Responsive Breakpoints with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/sepia

Use responsive variant modifiers like `md:sepia-0` to apply sepia utilities at specific breakpoints. This allows different filter behaviors across screen sizes, such as applying sepia on mobile but removing it on medium screens and larger.

```html
<div class="sepia md:sepia-0">
  <!-- Sepia applied on small screens, removed on medium screens and above -->
</div>
```

--------------------------------

### Apply resize utility with responsive breakpoint modifier

Source: https://v3.tailwindcss.com/docs/resize

Tailwind CSS breakpoint variant modifiers enable responsive design by applying utilities at specific screen sizes. The `md:resize` modifier applies the resize utility only at medium screen sizes and above. Other breakpoints and media queries are supported.

```html
<div class="resize-none md:resize">
  <!-- ... -->
</div>
```

--------------------------------

### Configure Custom Typography Theme in Tailwind Config

Source: https://v3.tailwindcss.com/docs/typography-plugin

Extends Tailwind CSS typography configuration in the JavaScript config file by adding a custom pink theme under the theme.extend.typography section. This method defines prose CSS variables directly in the configuration object for Tailwind v3, providing a programmatic approach to color theme customization.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: () => ({
        pink: {
          css: {
            '--tw-prose-body': 'var(--color-pink-800)',
            '--tw-prose-headings': 'var(--color-pink-900)',
            '--tw-prose-lead': 'var(--color-pink-700)',
            '--tw-prose-links': 'var(--color-pink-900)',
            '--tw-prose-bold': 'var(--color-pink-900)',
            '--tw-prose-counters': 'var(--color-pink-600)',
            '--tw-prose-bullets': 'var(--color-pink-400)',
            '--tw-prose-hr': 'var(--color-pink-300)',
            '--tw-prose-quotes': 'var(--color-pink-900)',
            '--tw-prose-quote-borders': 'var(--color-pink-300)',
            '--tw-prose-captions': 'var(--color-pink-700)',
            '--tw-prose-code': 'var(--color-pink-900)',
            '--tw-prose-pre-code': 'var(--color-pink-100)',
            '--tw-prose-pre-bg': 'var(--color-pink-900)',
            '--tw-prose-th-borders': 'var(--color-pink-300)',
            '--tw-prose-td-borders': 'var(--color-pink-200)',
            '--tw-prose-invert-body': 'var(--color-pink-200)',
            '--tw-prose-invert-headings': 'var(--color-white)',
            '--tw-prose-invert-lead': 'var(--color-pink-300)',
            '--tw-prose-invert-links': 'var(--color-white)',
            '--tw-prose-invert-bold': 'var(--color-white)',
            '--tw-prose-invert-counters': 'var(--color-pink-400)',
            '--tw-prose-invert-bullets': 'var(--color-pink-600)',
            '--tw-prose-invert-hr': 'var(--color-pink-700)',
            '--tw-prose-invert-quotes': 'var(--color-pink-100)',
            '--tw-prose-invert-quote-borders': 'var(--color-pink-700)',
            '--tw-prose-invert-captions': 'var(--color-pink-400)',
            '--tw-prose-invert-code': 'var(--color-white)',
            '--tw-prose-invert-pre-code': 'var(--color-pink-300)',
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': 'var(--color-pink-600)',
            '--tw-prose-invert-td-borders': 'var(--color-pink-700)',
          },
        },
      }),
    },
  },
}
```

--------------------------------

### Apply responsive delay with breakpoint modifiers

Source: https://v3.tailwindcss.com/docs/transition-delay

Use breakpoint variant modifiers like md: to apply transition delay at specific screen sizes. This enables responsive design patterns for transitions across different device sizes.

```html
<div class="transition duration-300 delay-150 md:delay-300">
  <!-- ... -->
</div>
```

--------------------------------

### JavaScript - Customize Flex Grow Theme in Tailwind Config

Source: https://v3.tailwindcss.com/docs/flex-grow

Extends the default Tailwind CSS theme by adding a custom `grow-2` utility with a value of '2'. Modifies `tailwind.config.js` to define additional flex-grow values beyond the default options.

```javascript
module.exports = {
  theme: {
    extend: {
      flexGrow: {
        2: '2'
      }
    }
  }
}
```

--------------------------------

### Apply Tailwind CSS Padding to All Sides

Source: https://v3.tailwindcss.com/docs/padding

Apply `p-*` utilities to control the padding on all four sides of an HTML element. This class provides a consistent padding around the entire element, leveraging Tailwind CSS's default spacing scale.

```html
<div class="p-8 ...">p-8</div>
```

--------------------------------

### Using Arbitrary Ring Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/ring-width

This code demonstrates the use of arbitrary values in Tailwind CSS to apply a one-off `ring` thickness directly in the HTML. This feature is useful for values that don't need to be part of the theme, allowing for flexible, on-the-fly styling without config modifications.

```html
<div class="ring-[10px]">
  <!-- ... -->
</div>
```

--------------------------------

### Create Reusable Primary Button Component in Vue with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/utility-first

A reusable Vue button component using Tailwind CSS utility classes for styling and state management. Encapsulates common button styling patterns including background colors, hover states, text styling, and padding. This component extraction pattern solves maintainability concerns when using utility-first CSS by reducing repeated utility combinations.

```vue
<!-- PrimaryButton.vue -->
<template>
  <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    <slot/>
  </button>
</template>
```

--------------------------------

### Customize Tailwind CSS Flex Utilities in tailwind.config.js

Source: https://v3.tailwindcss.com/docs/flex

This JavaScript configuration snippet demonstrates how to extend the default Tailwind CSS theme to include custom `flex` utility values. By modifying `theme.extend.flex` in `tailwind.config.js`, developers can define new custom flex behaviors.

```javascript
module.exports = {
  theme: {
    extend: {
      flex: {
        '2': '2 2 0%'
      }
    }
  }
}
```

--------------------------------

### Force hardware acceleration for transforms in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/rotate

To improve performance for transitions by forcing GPU rendering, use the `transform-gpu` utility. This can optimize complex animations by offloading them to the graphics processing unit. Conversely, `transform-cpu` can be used to revert to CPU rendering if needed conditionally.

```html
<div class="rotate-45 transform-gpu">
  <!-- ... -->
</div>
```

--------------------------------

### Create Arbitrary Peer Modifiers with Custom Selectors

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

Generate one-off `peer-*` modifiers on-the-fly using arbitrary values in square brackets to target elements based on custom sibling selectors. The `&` character controls where `.peer` appears in the final selector for advanced selector composition.

```html
<form>
  <label for="email">Email:</label>
  <input id="email" name="email" type="email" class="is-dirty peer" required />
  <div class="peer-[.is-dirty]:peer-required:block hidden">This field is required.</div>
  <!-- ... -->
</form>
```

```html
<div>
  <input type="text" class="peer" />
  <div class="hidden peer-[:nth-of-type(3)_&]:block">
    <!-- ... -->
  </div>
</div>
```

--------------------------------

### Force Hardware Acceleration for Transforms with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/translate

Apply the `transform-gpu` utility to force a transition or transform to be rendered by the GPU, potentially improving performance. If needed, the `transform-cpu` utility can be used to explicitly revert rendering back to the CPU.

```html
<div class="translate-y-6 transform-gpu">
  <!-- ... -->
</div>
```

--------------------------------

### Apply text decoration thickness with Tailwind CSS utilities

Source: https://v3.tailwindcss.com/docs/text-decoration-thickness

Basic usage of decoration-* utility classes to set text decoration thickness on HTML elements. These classes directly map to CSS text-decoration-thickness property values ranging from 0px to 8px.

```html
<p class="underline decoration-1 ...">The quick brown fox...</p>
<p class="underline decoration-2 ...">The quick brown fox...</p>
<p class="underline decoration-4 ...">The quick brown fox...</p>
```

--------------------------------

### Configure PostCSS to Load Custom Tailwind CSS Config

Source: https://v3.tailwindcss.com/docs/configuration

This PostCSS configuration snippet shows how to tell the `tailwindcss` PostCSS plugin to use a custom configuration file. It's essential when Tailwind CSS is integrated into a PostCSS workflow and the config file has a non-default name or location.

```javascript
module.exports = {
  plugins: {
    tailwindcss: { config: './tailwindcss-config.js' },
  },
}
```

--------------------------------

### Tailwind CSS Arbitrary Vertical Alignment Values

Source: https://v3.tailwindcss.com/docs/vertical-align

Apply custom vertical-align values not included in Tailwind's default utilities using square bracket syntax. Generates inline CSS properties on-the-fly for one-off alignment needs. Provides flexibility for non-standard alignment requirements.

```HTML
<div class="align-[4px]">
  <!-- ... -->
</div>
```

--------------------------------

### Conditionally apply Tailwind CSS `pointer-events` based on screen size

Source: https://v3.tailwindcss.com/docs/pointer-events

This HTML snippet demonstrates how to responsively control pointer event behavior using Tailwind CSS breakpoints. It sets `pointer-events-none` by default and applies `pointer-events-auto` only for medium screen sizes and above. This allows for adaptive UI interactions across different device sizes.

```html
<div class="pointer-events-none md:pointer-events-auto">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Transition Property Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/transition-property

This snippet demonstrates applying a one-off transition property, `height`, directly in HTML using Tailwind CSS's arbitrary value syntax with square brackets, `transition-[height]`, without modifying the theme configuration.

```html
<div class="transition-[height]">
  <!-- ... -->
</div>
```

--------------------------------

### Reset Global Border Styles

Source: https://v3.tailwindcss.com/docs/preflight

Preflight resets border properties on all elements and pseudo-elements (::before, ::after), setting border-width to 0, border-style to solid, and border-color to the default theme color. This allows the border utility class to work predictably by only requiring width specification.

```css
*,
::before,
::after {
  border-width: 0;
  border-style: solid;
  border-color: theme('borderColor.DEFAULT', currentColor);
}
```

--------------------------------

### Apply Opacity to Text Decoration Color with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-decoration-color

Demonstrates how to control the opacity of an element's text decoration color using Tailwind CSS utility classes. It utilizes the `/` syntax directly on color classes to specify opacity values.

```html
<div>
  <p>
    I’m Derek, an astro-engineer based in Tattooine. I like to build X-Wings at
    <a class="underline decoration-sky-500/30">My Company, Inc</a>.
    Outside of work, I like to <a class="underline decoration-pink-500/30">watch
    pod-racing</a> and have <a class="underline decoration-indigo-500/30">light-saber</a> fights.
  </p>
</div>
```

--------------------------------

### Use arbitrary backdrop-grayscale values

Source: https://v3.tailwindcss.com/docs/backdrop-grayscale

Apply one-off `backdrop-grayscale` values using square bracket notation without modifying the theme configuration. This generates a CSS property on the fly for arbitrary values.

```html
<div class="backdrop-grayscale-[.5]">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Multiple Font Variant Numeric Classes in HTML

Source: https://v3.tailwindcss.com/docs/font-variant-numeric

Demonstrates how to combine multiple font-variant-numeric utility classes on a single HTML element to enable multiple numeric features simultaneously. These utilities are composable and work together when the font supports the features.

```html
<p class="ordinal slashed-zero tabular-nums ...">
  1234567890
</p>
```

--------------------------------

### Apply Arbitrary Sepia Values in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/sepia

Use square bracket notation to apply one-off sepia values that aren't defined in your theme configuration. This allows inline generation of custom sepia filter values without modifying the config file.

```html
<div class="sepia-[.25]">
  <!-- Custom 0.25 sepia filter applied -->
</div>
```

--------------------------------

### Style input when placeholder is shown using Tailwind CSS

Source: https://v3.tailwindcss.com/docs/hover-focus-and-other-states

This snippet demonstrates how to apply styles to an HTML input element using Tailwind CSS when its placeholder text is visible. It uses the `placeholder-shown:` modifier to add a border to the input.

```html
<input class="placeholder-shown:border-gray-500 ..." placeholder="you@example.com" />
```

--------------------------------

### Apply Tailwind CSS Utilities at Responsive Breakpoints

Source: https://v3.tailwindcss.com/docs/display

Use responsive breakpoint variant modifiers to conditionally apply Tailwind utilities at specific screen sizes. Prefix the utility class with a breakpoint identifier like `md:` to apply the style only at medium screen sizes and above, enabling mobile-first responsive design.

```html
<div class="flex md:inline-flex">
  <!-- ... -->
</div>
```

--------------------------------

### Add New Tailwind CSS Breakpoints with Extend

Source: https://v3.tailwindcss.com/docs/breakpoints

This snippet illustrates how to introduce additional breakpoints (e.g., `3xl`) into Tailwind CSS. By placing new screen definitions within `theme.extend.screens`, Tailwind automatically sorts and integrates them into the responsive design system.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      screens: {
        '3xl': '1600px'
      }
    }
  },
  plugins: []
}
```

--------------------------------

### Maintaining Aspect Ratio with Tailwind CSS Plugin in HTML

Source: https://v3.tailwindcss.com/docs/plugins

This snippet illustrates how to use the `@tailwindcss/aspect-ratio` plugin to give an element a fixed aspect ratio. By applying `aspect-w-*` and `aspect-h-*` classes to a container, it ensures content like an iframe maintains its proportions.

```html
<div class="aspect-w-16 aspect-h-9">
  <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
```

--------------------------------

### Use arbitrary skew values directly in HTML with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/skew

This HTML snippet demonstrates how to apply one-off, arbitrary skew values directly in your HTML using Tailwind CSS without modifying the configuration file. By enclosing the desired value in square brackets, e.g., `skew-y-[17deg]`, you can apply a custom skew for specific cases.

```html
<div class="skew-y-[17deg]">
  <!-- ... -->
</div>
```

--------------------------------

### Register component classes with addComponents

Source: https://v3.tailwindcss.com/docs/plugins

Adds opinionated, complex component styles to Tailwind's components layer using addComponents function. Useful for pre-built components like buttons, forms, and alerts that can be overridden with utility classes. Component classes only generate CSS if used in the project.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addComponents }) {
      addComponents({
        '.btn': {
          padding: '.5rem 1rem',
          borderRadius: '.25rem',
          fontWeight: '600',
        },
        '.btn-blue': {
          backgroundColor: '#3490dc',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#2779bd'
          },
        },
        '.btn-red': {
          backgroundColor: '#e3342f',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#cc1f1a'
          },
        },
      })
    })
  ]
}
```

--------------------------------

### Configure Tailwind CSS Theme with Custom Colors and Fonts

Source: https://v3.tailwindcss.com/docs/configuration

This configuration defines custom colors, font families, spacing, and border radii within the `theme` section of `tailwind.config.js`. It allows for extensive visual design customization by extending Tailwind's default theme properties.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
  theme: {
    colors: {
      'blue': '#1fb6ff',
      'purple': '#7e5bef',
      'pink': '#ff49db',
      'orange': '#ff7849',
      'green': '#13ce66',
      'yellow': '#ffc82c',
      'gray-dark': '#273444',
      'gray': '#8492a6',
      'gray-light': '#d3dce6'
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif']
    },
    extend: {
      spacing: {
        '8xl': '96rem',
        '9xl': '128rem'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  }
}
```

--------------------------------

### Applying Typography Plugin Classes in HTML

Source: https://v3.tailwindcss.com/docs/plugins

This snippet showcases the usage of the `@tailwindcss/typography` plugin. By adding `prose` classes to an HTML article element, it automatically applies sensible typographic styles to the contained content, suitable for markdown or CMS output.

```html
<article class="prose lg:prose-xl">
  <h1>Garlic bread with cheese: What the science tells us</h1>
  <p>
    For years parents have espoused the health benefits of eating garlic bread with cheese to their
    children, with the food earning such an iconic status in our culture that kids will often dress
    up as warm, cheesy loaf for Halloween.
  </p>
  <p>
    But a recent study shows that the celebrated appetizer may be linked to a series of rabies cases
    springing up around the country.
  </p>
  <!-- ... -->
</article>
```

--------------------------------

### Apply Tailwind CSS `bg-clip` based on screen size

Source: https://v3.tailwindcss.com/docs/background-clip

This HTML snippet demonstrates how to apply a `bg-clip` utility conditionally based on screen size using Tailwind CSS responsive breakpoints. The element will default to `bg-clip-border` and switch to `md:bg-clip-padding` for medium screen sizes and above.

```html
<div class="bg-clip-border md:bg-clip-padding">
  <!-- ... -->
</div>
```

--------------------------------

### Customize Sepia Theme Values in Tailwind Config

Source: https://v3.tailwindcss.com/docs/sepia

Extend the default sepia utility values by editing `theme.extend.sepia` in your `tailwind.config.js` file. This allows you to define custom sepia opacity levels (like 0.25 or 0.75) that can be used as utility classes in your HTML.

```javascript
module.exports = {
  theme: {
    extend: {
      sepia: {
        25: '.25',
        75: '.75'
      }
    }
  }
}
```

--------------------------------

### Apply basic rotation to elements with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/rotate

Use the `rotate-*` utilities to apply a predefined rotation to an HTML element. These classes provide standard rotation values (e.g., 0, 45, 90, 180 degrees) for quick styling. Apply the desired class directly to your element, such as an `<img>` tag.

```html
<img class="rotate-0 ...">
<img class="rotate-45 ...">
<img class="rotate-90 ...">
<img class="rotate-180 ...">
```

--------------------------------

### Apply Tailwind CSS `auto-rows-max` for Implicit Grid Row Sizing

Source: https://v3.tailwindcss.com/docs/grid-auto-rows

This HTML snippet demonstrates the basic usage of the Tailwind CSS `auto-rows-max` utility. It sets the implicitly created grid rows to size themselves based on their maximum content. This utility is applied directly to a grid container.

```html
<div class="grid grid-flow-row auto-rows-max">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>
```

--------------------------------

### Customize Tailwind CSS `order` values in `tailwind.config.js`

Source: https://v3.tailwindcss.com/docs/order

This configuration snippet shows how to extend Tailwind CSS's default `order` utilities by modifying `theme.extend.order` in `tailwind.config.js`. This allows developers to define custom `order` values, such as `'13': '13'`, which can then be used throughout the project as `order-13`. It requires recompiling the CSS after modification.

```javascript
module.exports = {
  theme: {
    extend: {
      order: {
        '13': '13'
      }
    }
  }
}
```

--------------------------------

### Apply Arbitrary Values for Text Decoration Color in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/text-decoration-color

Shows how to use square bracket notation to apply a one-off, arbitrary color value directly as a text decoration color. This bypasses the theme configuration for specific, non-reusable cases.

```html
<p class="decoration-[#50d71e]">
  <!-- ... -->
</p>
```

--------------------------------

### Constrain Media Elements to Parent Width

Source: https://v3.tailwindcss.com/docs/preflight

Preflight applies max-width: 100% and height: auto to images and videos, making them responsive by default and preventing overflow. This ensures media respects parent container dimensions while maintaining intrinsic aspect ratios.

```css
img,
video {
  max-width: 100%;
  height: auto;
}
```

--------------------------------

### Provide default theme values in plugins

Source: https://v3.tailwindcss.com/docs/plugins

Allows utility plugins to define default theme configuration as a second argument to the plugin function. These defaults can be overridden or extended by end users in their Tailwind configuration.

```javascript
const plugin = require('tailwindcss/plugin')

module.exports = plugin(function({ matchUtilities, theme }) {
  matchUtilities(
    {
      tab: (value) => ({
        tabSize: value
      }),
    },
    { values: theme('tabSize') }
  )
}, {
  theme: {
    tabSize: {
      1: '1',
      2: '2',
      4: '4',
      8: '8',
    }
  }
})
```

--------------------------------

### Enable GPU hardware acceleration for transforms in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/skew

This HTML snippet shows how to force GPU hardware acceleration for transformations using the `transform-gpu` utility in Tailwind CSS. Applying this class can improve rendering performance for complex transitions or animations by offloading processing to the graphics card.

```html
<div class="skew-y-6 transform-gpu">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Backdrop Invert Values in HTML

Source: https://v3.tailwindcss.com/docs/backdrop-invert

Apply one-off backdrop-invert values using square bracket notation without modifying the theme configuration. This generates the CSS property on the fly for values not included in the default theme.

```html
<div class="backdrop-invert-[.25]">
  <!-- ... -->
</div>
```

--------------------------------

### Use Stacked Fractions Utility for Stacked Fraction Glyphs

Source: https://v3.tailwindcss.com/docs/font-variant-numeric

Demonstrates the stacked-fractions utility class that replaces slash-separated numbers with common stacked fraction glyphs, corresponding to the afrc OpenType feature. Note that very few fonts support this feature.

```html
<p class="stacked-fractions ...">
  1/2 3/4 5/6
</p>
```

--------------------------------

### Divide Color CSS Output for Fuchsia Palette

Source: https://v3.tailwindcss.com/docs/divide-color

Shows the compiled CSS output for Tailwind's divide color utilities using the fuchsia color palette. Each divide-* class generates a border-color style with CSS custom properties for opacity control, enabling dynamic opacity adjustments via the --tw-divide-opacity variable.

```css
.divide-fuchsia-300 > * + * {
  border-color: rgb(240 171 252 / var(--tw-divide-opacity, 1));
}

.divide-fuchsia-400 > * + * {
  border-color: rgb(232 121 249 / var(--tw-divide-opacity, 1));
}

.divide-fuchsia-500 > * + * {
  border-color: rgb(217 70 239 / var(--tw-divide-opacity, 1));
}
```

--------------------------------

### Apply Sticky Positioning with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/position

The `sticky` utility combines `relative` and `fixed` behavior. An element acts as `relative` until it scrolls past a defined threshold, then becomes `fixed` until its parent container scrolls out of view. Offsets are applied once it becomes fixed, and it acts as a positioning reference for children.

```html
<div>
  <div>
    <div class="sticky top-0 ...">A</div>
    <div>
      <div>
        <img src="..." />
        <strong>Andrew Alfred</strong>
      </div>
      <div>
        <img src="..." />
        <strong>Aisha Houston</strong>
      </div>
      <!-- ... -->
    </div>
  </div>
  <div>
    <div class="sticky top-0">B</div>
    <div>
      <div>
        <img src="..." />
        <strong>Bob Alfred</strong>
      </div>
      <!-- ... -->
    </div>
  </div>
  <!-- ... -->
</div>
```

--------------------------------

### Tailwind CSS: Add Custom CSS Rules to Main Stylesheet

Source: https://v3.tailwindcss.com/docs/adding-custom-styles

Explains the basic method for incorporating custom CSS rules into a Tailwind project by directly adding them to the main stylesheet. These rules will be processed alongside Tailwind's directives, though their order relative to Tailwind's layers depends on their placement.

```CSS
@tailwind base;
@tailwind components;
@tailwind utilities;

.my-custom-style {
  /* ... */
}
```

--------------------------------

### Apply Backdrop Blur Effects with Tailwind CSS

Source: https://v3.tailwindcss.com/docs/backdrop-blur

Use backdrop-blur-* utility classes to add blur effects behind elements with different intensity levels (sm, md, lg, xl, 2xl, 3xl). Combines with background color and opacity utilities for layered visual effects.

```html
<div class="backdrop-blur-sm bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-blur-md bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-blur-xl bg-white/30 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Backdrop Opacity Classes in HTML

Source: https://v3.tailwindcss.com/docs/backdrop-opacity

Use backdrop-opacity-* utility classes to control the opacity of backdrop filters on HTML elements. Classes range from backdrop-opacity-0 (0% opacity) to backdrop-opacity-100 (100% opacity) in 5% increments. Can be combined with other backdrop filter utilities like backdrop-invert.

```html
<div class="backdrop-opacity-10 backdrop-invert bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-opacity-60 backdrop-invert bg-white/30 ...">
  <!-- ... -->
</div>
<div class="backdrop-opacity-95 backdrop-invert bg-white/30 ...">
  <!-- ... -->
</div>
```

--------------------------------

### Apply Tailwind CSS `min-h-*` Conditionally at Breakpoints

Source: https://v3.tailwindcss.com/docs/min-height

This code snippet illustrates how to apply the `min-h-full` utility class conditionally based on screen size using responsive breakpoint modifiers. In this case, `md:min-h-full` ensures the utility is active only for medium screens and larger.

```html
<div class="h-24 min-h-0 md:min-h-full">
  <!-- ... -->
</div>
```

--------------------------------

### Use Arbitrary Backdrop Hue Rotate Values in HTML

Source: https://v3.tailwindcss.com/docs/backdrop-hue-rotate

Generate custom backdrop-hue-rotate values on the fly using square bracket notation for one-off values that don't need to be added to the theme configuration. This allows flexibility for unique hue rotation requirements.

```html
<div class="backdrop-hue-rotate-[270deg]">
  <!-- ... -->
</div>
```

--------------------------------

### Generate Arbitrary List Style Values

Source: https://v3.tailwindcss.com/docs/list-style-type

Uses Tailwind's arbitrary value syntax with square brackets to apply one-off list-style-type values without adding them to the theme configuration. Useful for unique styling that doesn't warrant a reusable utility class.

```html
<ul class="list-[upper-roman]">
  <!-- ... -->
</ul>
```

--------------------------------

### Logical margin properties with RTL support in Tailwind CSS

Source: https://v3.tailwindcss.com/docs/margin

Use ms-* and me-* utilities to set margin-inline-start and margin-inline-end logical properties, which automatically adjust based on text direction (LTR or RTL). Enables consistent spacing across different languages.

```html
<div dir="ltr">
  <div class="ms-8 ...">ms-8</div>
  <div class="me-8 ...">me-8</div>
</div>

<div dir="rtl">
  <div class="ms-8 ...">ms-8</div>
  <div class="me-8 ...">me-8</div>
</div>
```