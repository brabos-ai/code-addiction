### Install Motion via npm

Source: https://motion.dev/docs/quick-start

Install the Motion animation library using npm package manager. This is the most popular installation method for JavaScript projects using bundlers or package managers.

```bash
npm install motion
```

--------------------------------

### Install Motion for React using pnpm

Source: https://motion.dev/docs/react-installation

Installs the Motion library for React using the pnpm package manager. pnpm is known for its efficient disk space usage and faster installations compared to npm and Yarn.

```bash
pnpm add motion
```

--------------------------------

### Install Motion for React using Yarn

Source: https://motion.dev/docs/react-installation

Installs the Motion library for React using the Yarn package manager. Yarn offers a fast, reliable, and secure alternative to npm for managing project dependencies.

```bash
yarn add motion
```

--------------------------------

### Use Motion in Next.js App Router client components

Source: https://motion.dev/docs/react-installation

This example shows how to declare a component as a client component in the Next.js App Router using `"use client"` and then import and use the Motion library. This ensures the component is rendered on the client side, enabling interactive animations.

```javascript
"use client"

import { motion } from "motion/react"

export default function MyComponent() {
  return <motion.div animate={{ scale: 1.5 }} />
}
```

--------------------------------

### Add Motion for React via jsDelivr CDN

Source: https://motion.dev/docs/react-installation

This HTML script tag demonstrates how to import the Motion library directly from the jsDelivr CDN. It uses a type="module" script for ES module compatibility, enabling Motion's features without local installation.

```html
<script type="module">
  import motion from "https://cdn.jsdelivr.net/npm/motion@latest/react/+esm"
</script>
```

--------------------------------

### Import Motion functions in JavaScript

Source: https://motion.dev/docs/quick-start

Import the animate and scroll functions from the Motion library after installation. This enables access to core animation functionality in your JavaScript code.

```javascript
import { animate, scroll } from "motion"
```

--------------------------------

### Create spring animation with Motion

Source: https://motion.dev/docs/quick-start

Create a natural, kinetic spring animation by setting the animation type to 'spring' with stiffness parameter. Spring animations produce physics-based motion that feels organic and responsive.

```javascript
animate(
  element,
  { rotate: 90 },
  { type: "spring", stiffness: 300 }
);
```

--------------------------------

### Load Motion via script tag - Legacy global variable

Source: https://motion.dev/docs/quick-start

Import Motion as a global variable using the legacy script include method. This approach exposes Motion functions as properties of a global Motion object, compatible with older browsers.

```html
<script src="https://cdn.jsdelivr.net/npm/motion@latest/dist/motion.js"></script>
<script>
  const { animate, scroll } = Motion
</script>
```

--------------------------------

### Exit Animations with AnimatePresence in Motion for React

Source: https://motion.dev/docs/react

Demonstrates how to use the AnimatePresence component to wrap motion elements and enable exit animations when components are removed from the DOM. The example shows conditional rendering with a motion.div element that fades out (opacity: 0) on exit. Requires the motion library and AnimatePresence component to be imported.

```jsx
<AnimatePresence>
  {show ? <motion.div key="box" exit={{ opacity: 0 }} /> : null}
</AnimatePresence>
```

--------------------------------

### Optimize Motion import for Next.js App Router client components

Source: https://motion.dev/docs/react-installation

To reduce the JavaScript bundle size and improve performance in Next.js App Router client components, this code snippet illustrates importing Motion using `motion/react-client`. This ensures only the necessary client-side code is bundled.

```javascript
import * as motion from "motion/react-client"

export default function MyComponent() {
  return <motion.div animate={{ scale: 1.5 }} />
}
```

--------------------------------

### Upgrade Motion package imports in React

Source: https://motion.dev/docs/react-upgrade-guide

Instructions for upgrading from framer-motion to motion package. Uninstall the legacy framer-motion package and install the new motion package, then update import statements to use 'motion/react' instead of 'framer-motion'.

```bash
npm uninstall framer-motion
npm install motion
```

```javascript
import { motion } from "motion/react"
```

--------------------------------

### Create basic animation with Motion component

Source: https://motion.dev/docs/react

Use the motion component with the animate prop to create simple animations. When animate prop values change, Motion automatically animates to the new values using sensible defaults. Animations can be customized via the transition prop.

```javascript
<motion.button animate={{ opacity: 1 }} />
```

```javascript
<motion.ul animate={{ rotate: 360 }} />
```

```javascript
<motion.div
  animate={{
    scale: 2,
    transition: { duration: 2 }
  }}
/>
```

--------------------------------

### Basic press gesture with start callback

Source: https://motion.dev/docs/press

Simple press gesture example that logs the element being pressed and returns a function to log when the press ends.

```javascript
press("button", (element) => {
  console.log("press started on", element)
  
  return () => console.log("press ended")
})
```

--------------------------------

### Load Motion via script tag - Modern import syntax

Source: https://motion.dev/docs/quick-start

Import Motion directly in HTML using a script tag with modern ES6 import syntax. Ideal for standalone HTML projects or no-code platforms like Webflow. Always replace 'latest' with a specific version number.

```html
<script type="module">
  import { animate, scroll } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm"
</script>
```

--------------------------------

### Customize animation with easing and duration

Source: https://motion.dev/docs/quick-start

Animate an element's scale property with custom easing curve and duration parameters. Demonstrates how to use scale as an array for initial and final values, and apply advanced animation timing options.

```javascript
animate(
  element,
  { scale: [0.4, 1] },
  { ease: "circInOut", duration: 1.2 }
);
```

--------------------------------

### Implement scroll-triggered animations with whileInView

Source: https://motion.dev/docs/react

Use the whileInView prop to trigger animations when elements enter or leave the viewport. This enables scroll-triggered animations that automatically animate from initial values to whileInView values based on element visibility.

```javascript
<motion.div
  initial={{ backgroundColor: "rgb(0, 255, 0)", opacity: 0 }}
  whileInView={{ backgroundColor: "rgb(255, 0, 0)", opacity: 1 }}
/>
```

--------------------------------

### Install Motion+ Library for React

Source: https://motion.dev/docs/cursor

This command demonstrates how to install the Motion+ library, which includes the Cursor component, into your project using npm. Access requires a private token available to Motion+ members.

```bash
npm install https://api.motion.dev/registry?package=motion-plus&version=2.0.2&token
```

--------------------------------

### Implement enter animations with Motion for React

Source: https://motion.dev/docs/react

Define initial animation state using the initial prop and target state using the animate prop. When a component enters the page, it animates from initial values to animate values. Set initial={false} to disable initial animations entirely.

```javascript
<motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} />
```

```javascript
<motion.button initial={false} animate={{ scale: 1 }} />
```

--------------------------------

### Animate JavaScript object with Motion options

Source: https://motion.dev/docs/quick-start

Animate a Three.js object's rotation properties using Motion with custom options including duration, repeat, and easing. Demonstrates animating non-DOM objects and advanced animation parameters.

```javascript
animate(
  cube.rotation,
  { y: rad(360), z: rad(360) },
  { duration: 10, repeat: Infinity, ease: "linear" }
)
```

--------------------------------

### Install motion-plus Package via npm

Source: https://motion.dev/docs/react-animate-activity

This command illustrates how to install the `motion-plus` package, which provides `AnimateActivity`, using npm. It requires a private token for Motion+ members to access the registry.

```bash
npm install https://api.motion.dev/registry.tgz\?package\=motion-plus\&version\=2.0.2\&token=YOUR_AUTH_TOKEN
```

--------------------------------

### Install Motion for React Three Fiber dependencies

Source: https://motion.dev/docs/react-three-fiber

This command installs the core libraries required for Motion for React Three Fiber: Three.js, React Three Fiber, and framer-motion-3d. Ensure you have Node.js and npm installed to run this command successfully.

```bash
npm install three@0.137.0 @react-three/fiber@8.2.2 framer-motion-3d@11.2.0
```

--------------------------------

### Animate element with CSS selector

Source: https://motion.dev/docs/quick-start

Create a basic rotation animation using Motion's animate() function with a CSS selector. The animate function targets elements and applies transform properties like rotation.

```javascript
import { animate } from "motion"

animate(".box", { rotate: 360 })
```

--------------------------------

### Migrate start/end keyframe animation from GSAP's fromTo to Motion

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

This example shows how to migrate an animation defining explicit start and end keyframes. GSAP uses the `fromTo` method, while Motion achieves the same effect using array syntax within its `animate` function, providing a more concise way to specify keyframes.

```javascript
gsap.fromTo(".box", { opacity: 0 }, { opacity: 0.5, duration: 1 })
```

```javascript
animate(".box", { opacity: [0, 0.5] }, { duration: 1 })
```

--------------------------------

### Install Ticker from Motion+ Registry

Source: https://motion.dev/docs/react-ticker

Install the Motion+ library containing the Ticker component using npm with a private token. Requires Motion+ membership to generate a private token for authentication.

```bash
npm install https://api.motion.dev/registry\?package\=motion-plus\&version\=2.0.2\&token
```

--------------------------------

### Create a Framer override with a Motion rotate animation

Source: https://motion.dev/docs/framer

This example illustrates how to create a Framer override using a higher-order component to apply a rotation animation to any component. It showcases passing `animate` and `transition` props to a `motion` component, rotating it by 90 degrees over a 2-second duration, and adjusting its x-position.

```typescript
export function withRotateAnimation(Component): ComponentType {
    return forwardRef((props, ref) => {
        return (
            <Component
                ref={ref}
                {...props}
                animate={{ rotate: 90 }}
                transition={{ duration: 2 }}
                style={{ ...props.style, x: 100 }}
            />
        )
    })
}
```

--------------------------------

### Add hover and tap gesture animations in Motion for React

Source: https://motion.dev/docs/react

Use whileHover and whileTap props to define animation states for user gestures. Motion also provides event callbacks like onHoverStart to detect gesture interactions. These gesture animations work reliably across all devices including touch screens.

```javascript
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  onHoverStart={() => console.log('hover started!')}
/>
```

--------------------------------

### Animate layout changes with Motion for React

Source: https://motion.dev/docs/react

Apply the layout prop to motion components to automatically animate between layout changes using transforms. Use layoutId prop to animate transitions between completely different elements while maintaining visual continuity.

```javascript
<motion.div layout />
```

```javascript
<motion.div layoutId="underline" />
```

--------------------------------

### Animate multiple elements directly

Source: https://motion.dev/docs/quick-start

Animate multiple DOM elements by passing a NodeList from querySelectorAll directly to the animate() function instead of using a CSS selector string.

```javascript
import { animate } from "motion"

const boxes = document.querySelectorAll(".box")

animate(boxes, { rotate: 360 })
```

--------------------------------

### Setup Motion.js with Base UI React Components

Source: https://motion.dev/docs/base-ui

Demonstrates how to integrate Motion components with Base UI by utilizing the `render` prop. It shows importing `Menu` from `@base-ui-components/react` and `motion` from `motion/react` to apply initial, animate, and whilePress animations to a button within a `Menu.Trigger`.

```javascript
import { Menu } from "@base-ui-components/react/menu"
import { motion } from "motion/react"

function Component() {
  return (
    <Menu.Trigger render={
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whilePress={{ scale: 0.9 }}
      />
    } />
  )
}
```

--------------------------------

### Access Hovered Element and PointerEvent on Start with Motion's hover

Source: https://motion.dev/docs/hover

This example shows how the callback function for a hover gesture's start event receives two arguments: the DOM element being hovered and the `PointerEvent` object. This allows access to detailed event information, such as cursor coordinates.

```javascript
hover("div:nth-child(2)", (element, startEvent) => {
  console.log("Hover started on", element)
  console.log("At", startEvent.clientX, startEvent.clientY)
})
```

--------------------------------

### Initialize MotionValue and Animate in JavaScript

Source: https://motion.dev/docs/motion-value

This example demonstrates creating a new `motionValue`, subscribing to its `change` events to log the latest value, and then animating it from its initial state to a new target using the `animate` function. It shows the fundamental workflow of a Motion Value.

```javascript
const x = motionValue(0)

x.on("change", latest => console.log(latest))

animate(x, 100)
```

--------------------------------

### Configure Motion.js stagger with an initial start delay

Source: https://motion.dev/docs/stagger

Illustrates how to use the `startDelay` option in `stagger()` to set an initial delay before the staggered animation begins. This example sets a base delay of `0.2` seconds, with subsequent elements increasing by `0.1` seconds.

```javascript
stagger(0.1, { startDelay: 0.2 }) // 0.2, 0.3, 0.4...
```

--------------------------------

### Install AnimateNumber from Motion+ Registry

Source: https://motion.dev/docs/react-animate-number

Install the motion-plus package from the private Motion+ registry using an npm private token. This command adds the Motion+ library to your project, enabling access to exclusive components like AnimateNumber.

```bash
npm install https://api.motion.dev/registry\?package\=motion-plus\&version\=1.5.4\&token
```

--------------------------------

### CSS Linear Easing Spring Animation

Source: https://motion.dev/docs/studio

Demonstrates a CSS linear() easing curve that creates a bouncy spring animation effect. This example shows a 600ms animation duration with a linear easing function that includes bounce characteristics. The easing values define the animation curve progression from 0 to 1.

```css
600ms linear(0, 0.0121 /* ... */)
```

--------------------------------

### Configure Steps Easing to Change at Start of Step

Source: https://motion.dev/docs/easing-functions

Shows how to modify the `steps` easing function to have the step changes occur at the *start* of each interval, by passing the "start" keyword as the second argument. This alters the timing of discrete transitions for specific animation effects where the jump should happen immediately.

```JavaScript
const easing = steps(4, "start")

easing(0.2) // 0.25
```

--------------------------------

### Implementing Spring Animations with Motion 11.0 Mini `animate`

Source: https://motion.dev/docs/upgrade-guide

To create spring animations in Motion 11.0, specify `type: "spring"` within the `animate` function's options. This example uses the `mini` `animate` function to apply a spring animation with a custom stiffness to an element's transform property.

```javascript
import { animate } from "motion/mini"
import { spring } from "motion"

animate(
  element,
  { transform: "translateX(100px)" },
  { type: spring, stiffness: 400 }
)
```

--------------------------------

### Configure Motion Studio MCP in Editor Settings (JSON)

Source: https://motion.dev/docs/studio-install

This JSON configuration snippet sets up the Motion Studio MCP (Motion Computing Platform) in a code editor. It defines a server named 'motion' that executes 'npx motion-ai' to enable AI enhancements such as CSS spring generation and LLM documentation. Users should add this block to their editor's MCP JSON settings, with exact process varying by editor.

```json
{
"mcpServers": {
"motion": {
"command": "npx",
"args": ["-y", "motion-ai"]
}
}
}
```

--------------------------------

### Old Gesture Callback Syntax in Motion 12.0

Source: https://motion.dev/docs/upgrade-guide

Before Motion 12.0, gesture callbacks for `press`, `hover`, and `inView` received only the triggering event (e.g., `PointerEvent` or `IntersectionEntry`) as their first argument. This code demonstrates the previous callback signature where only the event was passed to the start callback.

```javascript
press("a", (startEvent) => {
return (endEvent) => {}
})
hover("li", (startEvent) => {
return (endEvent) => {}
})
inView("section", (startEntry) => {
return (endEntry) => {}
})
```

--------------------------------

### Start Animation at Specific Time in Motion Sequence with `at`

Source: https://motion.dev/docs/animate

Uses the `at` option within an animation sequence to define a precise start time (in seconds) for an animation relative to the sequence's beginning.

```javascript
const sequence = [
  ["nav", { opacity: 1 }],
  
  // This will start 0.5 from the start of the whole animation:
  ["nav", { x: 100 }, { at: 0.5 }]
]
```

--------------------------------

### Start Animation at Labeled Time in Motion Sequence with `at`

Source: https://motion.dev/docs/animate

Employs a string label with the `at` option to synchronize an animation's start time with a previously defined label within a sequence.

```javascript
const sequence = [
  ["nav", { x: 100 }, { duration: 1 }],
  
  "my-label", // label definition
  ["li", { opacity: 1 }],
  
  // my-label was defined at 1 second
  ["a", { scale: 1.2 }, { at: "my-label" }]
]
```

--------------------------------

### Handling Animation Completion in Motion

Source: https://motion.dev/docs/upgrade-guide

This snippet demonstrates how to handle the completion of an animation in the Motion library. Instead of relying on a `finished` property, developers can now use the animation's promise-like behavior with `.then()` or `await` to react when the animation concludes.

```javascript
const animation = animate()

animation.then(() => {})
await animation
```

--------------------------------

### Animate a 3D pointLight component

Source: https://motion.dev/docs/react-three-fiber

This example demonstrates how to apply an animation to a `motion.pointLight` component, animating its `x` position. It showcases the basic usage of the `animate` prop on a 3D motion component.

```jsx
<motion.pointLight animate={{ x: 2 }} />
```

--------------------------------

### Offset Animation from Previous Start in Motion Sequence with `at`

Source: https://motion.dev/docs/animate

Uses `<+` or `<-` prefixes with the `at` option to define an animation's start time relative to the beginning of the previous animation in a sequence.

```javascript
const sequence = [
  ["nav", { opacity: 1 }],
  
  // 0.5 seconds after the start animation (0.5 secs):
  ["nav", { x: 100 }, { at: "<0.5" }],
  
  // 0.2 seconds before the start of the previous animation (0.3 secs):
  ["nav li", { opacity: 1 }, { at: "<-0.2" }]
]
```

--------------------------------

### Stagger animations across multiple elements

Source: https://motion.dev/docs/quick-start

Create offset animations across multiple list items using Motion's stagger() function to dynamically set delays. Staggering makes animations feel more natural and lively by offsetting each element's animation timing.

```javascript
import { animate, stagger } from "motion"

animate(
  "li",
  { y: 0, opacity: 1 },
  { delay: stagger(0.1) }
)
```

--------------------------------

### Using Motion's Mini `animate` Function (11.0+)

Source: https://motion.dev/docs/upgrade-guide

Motion 11.0 introduces a 'mini' version of the `animate` function, optimized for a smaller bundle size (2.5kb) and supporting default value types. This version is suitable for basic animations and should be imported from `motion/mini`.

```javascript
import { animate } from "motion/mini"

animate(element, { width: 200 })
```

--------------------------------

### Animating Single Values with Motion 11.0 Hybrid `animate`

Source: https://motion.dev/docs/upgrade-guide

Motion 11.0's hybrid `animate` function replaces the old callback syntax, allowing direct animation of single values, motion values, and objects. This example demonstrates animating a numeric range from 0 to 1 and using the `onUpdate` option to process animation progress.

```javascript
import { animate } from "motion"

animate(0, 1, { onUpdate: (progress) => {} })
```

--------------------------------

### Align Animation with Previous Start in Motion Sequence using `at: "<"`

Source: https://motion.dev/docs/animate

Utilizes `at: "<"` to make an animation in a sequence start concurrently with the preceding animation segment.

```javascript
const sequence = [
  ["nav", { x: 100 }, { duration: 1 }],
  
  // This will start at the same time as the x: 100 animation
  ["li", { opacity: 1 }, { at: "<" }]
]
```

--------------------------------

### Handle Tap Start Event for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onTapStart` callback fires when a pointer initiates a press on a `motion` component. It receives the triggering `PointerEvent`, enabling custom logic at the start of a tap interaction.

```javascript
<motion.div onTapStart={(event) => console.log(event)} />
```

--------------------------------

### Apply custom transition properties to layout animations in Motion 2

Source: https://motion.dev/docs/react-upgrade-guide

This example shows how to apply custom transition properties to layout animations in Motion 2. Unlike Motion 1 where transitions were passed to `layoutTransition`, Motion 2 uses the standard `transition` prop alongside the `layout` prop for consistency.

```jsx
// Before
<motion.div layoutTransition={{ duration: 2 }} />
```

```jsx
// After
<motion.div layout transition={{ duration: 2 }} />
```

--------------------------------

### Full Exit Animation for Base UI ContextMenu with Motion.js and AnimatePresence

Source: https://motion.dev/docs/base-ui

Provides a complete example of applying exit animations to a `ContextMenu` using `Motion.js`. It combines hoisted state, `AnimatePresence`, `keepMounted` on `Portal`, and renders a `motion.div` within `ContextMenu.Popup` with `initial`, `animate`, and `exit` transform and opacity properties.

```javascript
function App() {
  const [open, setOpen] = useState(false)
  
  return (
    <ContextMenu.Root open={open} onOpenChange={setOpen}>
      <ContextMenu.Trigger>Open menu</ContextMenu.Trigger>
      <AnimatePresence>
        {open && (
          <ContextMenu.Portal keepMounted>
            <ContextMenu.Positioner>
              <ContextMenu.Popup
                render={
                  <motion.div
                    initial={{ opacity: 0, transform: "scale(0.9)" }}
                    animate={{ opacity: 1, transform: "scale(1)" }}
                    exit={{ opacity: 0, transform: "scale(0.9)" }}
                  />
                }
              >
                {/* Children */}
              </ContextMenu.Popup>

```

--------------------------------

### Integrate Motion.js with CDN in Squarespace Footer (JavaScript/HTML)

Source: https://motion.dev/docs/squarespace

This snippet demonstrates the basic method for installing Motion.js on a Squarespace site. It involves placing a <script type="module" defer> tag in the site's footer via the Custom Code injection, importing Motion.js from a CDN, and then using the `animate` function to add a simple animation. This approach uses the full Motion.js library.

```html
<script type="module" defer>
    import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm"

    // Your animation code here
    animate("h1", { opacity: [0, 1] })
</script>
```

--------------------------------

### Handle Animation Start Event for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onAnimationStart` callback is triggered when any animation (excluding layout animations) begins on a `motion` component. It receives the target or variant name of the started animation as an argument.

```javascript
<motion.circle
  animate={{ r: 10 }}
  onAnimationStart={latest => console.log(latest.r)}
/>
```

--------------------------------

### Setup LazyMotion with domAnimation features synchronously

Source: https://motion.dev/docs/react-reduce-bundle-size

Configure LazyMotion to load the domAnimation feature package synchronously into the main bundle. This provides support for animations, variants, exit animations, and tap/hover/focus gestures, adding approximately 15kb to the bundle.

```jsx
import { LazyMotion, domAnimation } from "motion/react"

function App({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  )
}
```

--------------------------------

### Handle Pan Gesture Start for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onPanStart` callback fires when a pan gesture begins. It's provided with the triggering `PointerEvent` and an `info` object containing details like `delta` for the initial movement.

```javascript
<motion.div onPanStart={(event, info) => console.log(info.delta.x)} />
```

--------------------------------

### useMotionValueEvent Import and Basic Setup

Source: https://motion.dev/docs/react-use-motion-value-event

Shows the import statement and basic setup for using useMotionValueEvent with a motion value. The hook takes three parameters: the motion value, event name ('change', 'animationStart', 'animationComplete', or 'animationCancel'), and a callback function that receives the latest value.

```javascript
import { useMotionValueEvent } from "motion/react"

const color = useMotionValue("#00f")

useMotionValueEvent(color, "change", (latest) => {
  console.log(latest)
})
```

--------------------------------

### Trigger and Stop Animation on Hover with Motion's hover

Source: https://motion.dev/docs/hover

This example showcases how `hover` can be integrated with animations. When a hover gesture starts on `<li>` elements, an animation is initiated. The returned callback ensures that the animation is stopped precisely when the hover gesture concludes.

```javascript
hover("li", (element) => {
  const animation = animate(element, { rotate: 360 })
  
  return () => animation.stop()
})
```

--------------------------------

### React Motion: Smooth Scroll-Linked Values with useSpring

Source: https://motion.dev/docs/react-scroll-animations

This example demonstrates how to apply smoothing to a scroll-linked motion value for a more fluid animation. The `scrollYProgress` obtained from `useScroll` is passed through `useSpring` with custom stiffness, damping, and restDelta parameters, resulting in a softened `scaleX` animation.

```jsx
const { scrollYProgress } = useScroll();
const scaleX = useSpring(scrollYProgress, {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001
})

return <motion.div style={{ scaleX }} />
```

--------------------------------

### Delay child animations with delayChildren in Motion variants

Source: https://motion.dev/docs/react-transitions

Configures a delay applied to all child animations when using variants on a parent component. The example shows how container and item variants orchestrate animations where children begin 0.5 seconds after the parent animation starts.

```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.5
    }
  }
}

const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
}

return (
  <motion.ul
    variants={container}
    initial="hidden"
    animate="show"
  >
    <motion.li variants={item} />
    <motion.li variants={item} />
  </motion.ul>
)
```

--------------------------------

### Transform with Multiple Range Values (JavaScript)

Source: https://motion.dev/docs/transform

This example demonstrates how `transform` can handle multiple values in both the input and output ranges. This allows for more complex, non-linear mappings across different segments of the input.

```javascript
const x = [-100, 0, 100, 200]
const opacity = [0, 1, 1, 0]
const transformer = transform(x, opacity)
  
transformer(-50) // 0.5
transformer(50) // 1
transformer(150) // 0.5
```

--------------------------------

### Link animations to scroll position with useScroll hook

Source: https://motion.dev/docs/react

Use the useScroll hook to obtain scroll progress values (like scrollYProgress) that can be directly linked to animation properties via MotionValues. This enables scroll-linked animations where property values change continuously based on scroll position.

```javascript
const { scrollYProgress } = useScroll()

return <motion.div style={{ scaleX: scrollYProgress }} />
```

--------------------------------

### Apply basic glide easing to an animation with Motion

Source: https://motion.dev/docs/glide

This example demonstrates how to use the `glide` easing function with `animate()` to create momentum-based transform animations. Note that `glide` is a simulation and will override explicit target keyframes and `duration` values.

```javascript
import { animate, glide } from "motion"

animate(
  element,
  { x: 500 },
  { easing: glide() }
)
```

--------------------------------

### Animate from a specific value with GSAP's from method

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

This GSAP example uses the `from` method to animate an element's opacity from a specified value (`0`) to its current, DOM-read value. Motion does not offer a comparable API due to potential visual inconsistencies caused by render-blocking behavior, and generally discourages this approach.

```javascript
gsap.from(".box", { opacity: 0 })
```

--------------------------------

### Basic usage of Typewriter component

Source: https://motion.dev/docs/react-typewriter

This example illustrates the fundamental way to use the `Typewriter` component. By passing a string as a child, the component will animate the text character by character, creating a typewriter effect.

```jsx
<Typewriter>Hello world!</Typewriter>
```

--------------------------------

### React: Customize Hover Animation Transitions with `whileHover`

Source: https://motion.dev/docs/react-hover-animation

This example shows how to define separate transition properties for when a hover gesture starts and ends. The `transition` property within `whileHover` applies when the hover begins, while a top-level `transition` prop applies when the hover gesture concludes.

```jsx
<motion.button
  whileHover={{
    scale: 1.1,
    // Will be used when gesture starts
    transition: { duration: 0.1 }
  }}
  // Will be used when gesture ends
  transition={{ duration: 0.5 }}
/>
```

--------------------------------

### React Motion: One-Time Scroll-Triggered Animation with viewport.once

Source: https://motion.dev/docs/react-scroll-animations

This example shows how to configure a scroll-triggered animation to run only once. By setting `viewport={{ once: true }}` on the `motion.div`, the animation will execute when the element first enters the viewport but will not re-trigger if the element subsequently leaves and re-enters.

```jsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
/>
```

--------------------------------

### React Motion: Scroll-Linked Progress Bar with useScroll

Source: https://motion.dev/docs/react-scroll-animations

This example demonstrates creating a basic scroll-linked animation to function as a progress bar. The `useScroll` hook provides `scrollYProgress`, which is directly applied to the `scaleX` style of a `motion.div`, causing it to expand horizontally as the user scrolls down the page.

```jsx
const { scrollYProgress } = useScroll();

return (
  <motion.div style={{ scaleX: scrollYProgress }} />  
)
```

--------------------------------

### Define Custom Scroll Offsets for Element Tracking

Source: https://motion.dev/docs/react-use-scroll

These examples showcase how to use the `offset` option to precisely define when `scrollYProgress` should start and end its 0-1 range. The first tracks an element as it enters from the bottom, while the second tracks it as it moves out of the top, allowing for highly customized scroll-triggered animations.

```jsx
// Track an element as it enters from the bottom
const { scrollYProgress } = useScroll({
  target: targetRef,
  offset: ["start end", "end end"]
})

// Track an element as it moves out the top
const { scrollYProgress } = useScroll({
  target: targetRef,
  offset: ["start start", "end start"]
})
```

--------------------------------

### Apply Exit Animations to Radix Tooltip with AnimatePresence

Source: https://motion.dev/docs/radix

This combined example shows how to use `AnimatePresence` with an externally controlled Radix Tooltip to implement exit animations. The `forceMount` prop on `Tooltip.Portal` is crucial when conditionally rendering children with `AnimatePresence` to ensure proper animation behavior.

```jsx
<AnimatePresence>
  {isOpen && (
    <Tooltip.Portal forceMount>
      <Tooltip.Content asChild>
        <motion.div
            exit={{ opacity: 0 }}

```

--------------------------------

### Accessing Target Element with Old Gesture Callbacks

Source: https://motion.dev/docs/upgrade-guide

Prior to Motion 12.0, developers often accessed the target element within gesture callbacks by destructuring the `target` property from the event object. This example illustrates the previous method, which could be unpredictable due to the dynamic nature of `target` and `currentTarget`.

```javascript
hover("button", ({ target }) => {
  animate(target, { opacity: 0 })
  
  return (endEvent) => {}
})
```

--------------------------------

### Import resize from Motion

Source: https://motion.dev/docs/resize

Import the resize function from the Motion library to begin monitoring size changes on viewports and DOM elements.

```javascript
import { resize } from "motion"
```

--------------------------------

### Building a slideshow with AnimatePresence and dynamic keys in React

Source: https://motion.dev/docs/react-animate-presence

Provides a complete functional example of a slideshow component utilizing `AnimatePresence`. By changing the `key` prop of the `motion.img`, new images animate in while old ones animate out seamlessly.

```jsx
export const Slideshow = ({ image }) => (
  <AnimatePresence>
    <motion.img
      key={image.src}
      src={image.src}
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
    />
  </AnimatePresence>
)
```

--------------------------------

### delay Configuration

Source: https://motion.dev/docs/animate

Set a delay before animation starts or begin animation partway through by using negative values. Negative delay values start the animation that many seconds into the sequence.

```APIDOC
## delay Configuration

### Description
Delay the animation by this duration (in seconds). Setting delay to a negative value starts the animation that long into the animation sequence.

### Property
**delay** (number)

### Default Value
`0`

### Usage
```javascript
animate(element, { filter: "blur(10px)" }, { delay: 0.3 })
```

### Negative Delay Example
```javascript
// Start 1 second into the animation
animate(element, { x: 100 }, { delay: -1 })
```

### Parameters
- **delay** (number) - Optional - Animation delay in seconds (default: 0)
```

--------------------------------

### Defining Declarative Animation Sequences with Motion animate()

Source: https://motion.dev/docs/gsap-vs-motion

This example demonstrates Motion's modern, declarative approach to sequencing animations using the `animate()` function. It accepts a simple JavaScript array of animation definitions, allowing for readable and easily modifiable sequences, similar to GSAP's timeline functionality but with a different API paradigm.

```javascript
animate([
  ["h1", { opacity: 1 }],
  ["p", { y: 0 }, { at: "-0.5" }]
])
```

--------------------------------

### onDragStart Callback

Source: https://motion.dev/docs/react-motion-component

Callback function that fires when a drag gesture starts. Provided the triggering PointerEvent and info object with drag data.

```APIDOC
## onDragStart

### Description
Callback function that fires when a drag gesture starts. Provided the triggering `PointerEvent` and `info`.

### Callback Signature
```jsx
function onDragStart(event, info) {
  // event: PointerEvent
  // info: DragInfo
}
```

### Info Object Properties
- **point** (Object) - Current pointer position
- **delta** (Object) - Distance moved
- **offset** (Object) - Distance from origin
- **velocity** (Object) - Pointer velocity

### Usage Example
```jsx
<motion.div drag onDragStart={(event, info) => console.log(info.delta.x)} />
```
```

--------------------------------

### Animate Element Interactions with Motion.js `press` in Squarespace (JavaScript/HTML)

Source: https://motion.dev/docs/squarespace

This example demonstrates how to select and animate elements based on user interaction using Motion.js. It uses the `press` function to detect when an element (e.g., an <a> tag) is pressed, applying a `scale` animation on press and reverting it on release. The Motion.js library is imported via CDN in the Squarespace footer.

```html
<script type="module" defer>
    import { animate, press } from "https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm"

    press("a", (element) => {
      animate(element, { scale: 0.7 })

      return () => animate(element, { scale: 1 })
    })
</script>
```

--------------------------------

### Transform Number to Color (JavaScript)

Source: https://motion.dev/docs/transform

This example demonstrates how to use the `transform` function to map a numeric input value from one range to a color output range, resulting in a computed color.

```javascript
const numberToColor = transform(
[0, 100], // Input
["#000", "#fff"] // Output
)
  
numberToColor(50) // rgba(128, 128, 128, 1)
```

--------------------------------

### Offset Animation from Previous End in Motion Sequence with `at`

Source: https://motion.dev/docs/animate

Specifies a start time relative to the end of the previous animation using `+` or `-` prefixes with the `at` option in a sequence.

```javascript
const sequence = [
  ["nav", { opacity: 1 }, { duration: 1 }],
  
  // 0.5 seconds after the previous animation (1.5 secs):
  ["nav", { x: 100 }, { at: "+0.5" }],
  
  // 0.2 seconds before the end of the previous animation:
  ["nav li", { opacity: 1 }, { at: "-0.2" }]
]
```

--------------------------------

### Updating Motion `scroll` Callback Signature

Source: https://motion.dev/docs/upgrade-guide

This snippet illustrates the change in the `scroll` function's callback signature in the Motion library. Previously, the callback received an `info` object directly. Now, it explicitly receives `progress` as the first argument, followed by `info`, enabling optimized scroll measurements by allowing callbacks that only need `progress` to run via `ScrollTimeline`.

```javascript
// Previously
scroll((info) => {}, options)
```

```javascript
// Now
scroll((progress, info) => {}, options)
```

--------------------------------

### Delay an Animation Start with Motion `delay` Option

Source: https://motion.dev/docs/animate

Specifies a delay before the animation begins in seconds. Negative values allow the animation to start partway through its timeline. Defaults to `0`.

```javascript
animate(element, { filter: "blur(10px)" }, { delay: 0.3 })
```

--------------------------------

### Sample Spring Generator in Time Order (JavaScript)

Source: https://motion.dev/docs/spring

Provides an example of how to iterate through a spring generator in chronological order using a `while` loop. This method allows you to collect a series of values representing the spring's motion over time, useful for visualizations or custom easing functions. Be cautious with springs having `damping: 0` as they can run indefinitely.

```javascript
const generator = spring({ keyframes: [25, 75], stiffness: 400 })
const output = []

let isDone = false
let time = 0
const sampleDuration = 20 // ms

while (!isDone) {
  const { value, done } = generator.next(time)

  output.push(value)

  time += sampleDuration

  if (done) isDone = true
}
```

--------------------------------

### repeatType Configuration

Source: https://motion.dev/docs/animate

Define how the animation repeats: loop from start, reverse direction, or mirror origin and target on each iteration.

```APIDOC
## repeatType Configuration

### Description
How to repeat the animation. This can be either loop, reverse, or mirror.

### Property
**repeatType** (string)

### Default Value
`"loop"`

### Allowed Values
- **loop** - Repeats the animation from the start
- **reverse** - Alternates between forward and backwards playback
- **mirror** - Switches animation origin and target on each iteration

### Usage
```javascript
animate(
  element,
  { backgroundColor: "#fff" },
  { repeat: 1, repeatType: "reverse", duration: 2 }
)
```

### Parameters
- **repeatType** (string) - Optional - Repeat behavior: "loop", "reverse", or "mirror" (default: "loop")
```

--------------------------------

### Animate on press start and end

Source: https://motion.dev/docs/press

Use press with animate to scale elements on press start and restore on press end. Return a function from the start callback to define end behavior.

```javascript
press("button", (element) => {
  animate(element, { scale: 0.9 })

  return () => animate(element, { scale: 1 })
})
```

--------------------------------

### Initiate Dragging with useDragControls Hook (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `useDragControls` hook provides a way to initiate dragging from a component different from the draggable one. It returns a `dragControls` object with a `start` method, which can be called on an event (e.g., `onPointerDown`) of another element. The `dragControls` object is then passed to the `dragControls` prop of the `motion.div` to link them. For this setup, it's often useful to set `dragListener={false}` on the draggable element.

```jsx
const dragControls = useDragControls()

function startDrag(event) {
  dragControls.start(event, { snapToCursor: true })
}

return (
  <>
    <div onPointerDown={startDrag} />
    <motion.div drag="x" dragControls={dragControls} />
  </>
)
```

--------------------------------

### Create fade-in enter animations in React

Source: https://motion.dev/docs/react-animation

Combine the initial and animate props to define entry animations when elements mount to the DOM. This example creates a fade-in effect from transparent to opaque.

```jsx
<motion.article
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
/>
```

--------------------------------

### Start drag from pointer event with useDragControls

Source: https://motion.dev/docs/react-use-drag-controls

Initiate a drag session from any element's onPointerDown event using the controls.start() method. The event object is passed to the start method to determine initial pointer position.

```javascript
<div onPointerDown={event => controls.start(event)} />
```

--------------------------------

### at - Animation Sequencing

Source: https://motion.dev/docs/animate

Control timing of animations in sequences. Define when each animation starts relative to specific times, labels, or previous animations.

```APIDOC
## at - Animation Sequencing

### Description
When defining animations as part of a larger sequence, each definition will start one after the other. By passing `at`, this behavior can be changed to control timing.

### Property
**at** (number | string)

### Usage Patterns

#### Specific Time (number)
Set as a number to define a specific time in seconds from start of sequence:
```javascript
const sequence = [
  ["nav", { opacity: 1 }],
  // Starts 0.5 seconds from the start of the whole animation
  ["nav", { x: 100 }, { at: 0.5 }]
]
```

#### Labelled Time (string)
Set as a label name to start at the same point as the label definition:
```javascript
const sequence = [
  ["nav", { x: 100 }, { duration: 1 }],
  "my-label", // label definition at 1 second
  ["li", { opacity: 1 }],
  // Starts at my-label position (1 second)
  ["a", { scale: 1.2 }, { at: "my-label" }]
]
```

#### Start of Previous Animation ("<")
Pass `"<"` to start at the same time as the previous segment:
```javascript
const sequence = [
  ["nav", { x: 100 }, { duration: 1 }],
  // Starts at the same time as x: 100 animation
  ["li", { opacity: 1 }, { at: "<" }]
]
```

#### Relative to End of Previous Animation ("+"/"-")
Pass a string starting with `+` or `-` to start relative to the end:
```javascript
const sequence = [
  ["nav", { opacity: 1 }, { duration: 1 }],
  // 0.5 seconds after the previous animation ends (at 1.5 secs)
  ["nav", { x: 100 }, { at: "+0.5" }],
  // 0.2 seconds before the previous animation ends
  ["nav li", { opacity: 1 }, { at: "-0.2" }]
]
```

#### Relative to Start of Previous Animation ("<+"/"<-")
Pass a string starting with `<+` or `<-` to start relative to the start:
```javascript
const sequence = [
  ["nav", { opacity: 1 }],
  // 0.5 seconds after the start of previous animation (at 0.5 secs)
  ["nav", { x: 100 }, { at: "<0.5" }],
  // 0.2 seconds before the start of previous animation (at 0.3 secs)
  ["nav li", { opacity: 1 }, { at: "<-0.2" }]
]
```

### Parameters
- **at** (number | string) - Optional - Timing control: number for specific time, string for label or relative timing
```

--------------------------------

### Migrate basic rotation animation from GSAP to Motion

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

This example demonstrates migrating a basic, infinitely repeating rotation animation from GSAP's `gsap.to` to Motion's `animate` function. Key differences include property naming (`rotate` vs `rotation`), repeat values (`Infinity` vs `-1`), and ease names (`linear` vs `none`). Motion separates animation values from options, allowing for clearer distinction.

```javascript
gsap.to("#animate-anything-css", {
  duration: 10,
  ease: "none",
  repeat: -1,
  rotation: 360,
})
```

```javascript
animate(
  "#animate-anything-css",
  { rotate: 360 },
  { ease: "linear", duration: 10, repeat: Infinity }
)
```

--------------------------------

### Handle Hover Start Event for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onHoverStart` callback is invoked when a pointer begins hovering over a `motion` component. It receives the triggering `PointerEvent` as an argument, allowing access to event details.

```javascript
<motion.div onHoverStart={(event) => console.log(event)} />
```

--------------------------------

### Enable LazyMotion with domAnimation for React Components

Source: https://motion.dev/docs/react-lazy-motion

This example demonstrates how to use `LazyMotion` with `domAnimation` to reduce the initial bundle size for React applications. It uses the lighter `m` component for animated elements, loading only necessary DOM animation features.

```jsx
import { LazyMotion, domAnimation } from "motion/react"
import * as m from "motion/react-m"
  
export const MyComponent = ({ isVisible }) => (
<LazyMotion features={domAnimation}>
<m.div animate={{ opacity: 1 }} />
</LazyMotion>
)
```

--------------------------------

### Set Initial Value for useInView

Source: https://motion.dev/docs/react-use-in-view

Use the 'initial' option to provide a starting value before the element is measured. Useful for preventing layout shifts or setting default visibility states.

```javascript
const isInView = useInView(ref, { initial: true })
```

--------------------------------

### Import Motion.js for Tree-shaking in Local Development (JavaScript)

Source: https://motion.dev/docs/squarespace

This code snippet shows how to import specific functions like `animate` from the Motion.js library in a local development environment. This approach is intended for use with bundlers like Vite or Rollup, which can then perform tree-shaking to include only the used parts of the library, optimizing the final build size.

```javascript
import { animate } from "motion"

animate("header", { opacity: 1 })
```

--------------------------------

### Create mixers for different value types

Source: https://motion.dev/docs/mix

Demonstrates creating mixer functions for various data types: numbers, colors (hex format), and objects containing pixel values and numbers. Each mixer interpolates between the start and end values of the same type.

```javascript
const mixNumber = mix(0, 100)
const mixColor = mix("#000", "#FFF")
const mixObject = mix(
  { a: "0px", b: 10 },
  { a: "20px", b: 0 }
)
```

--------------------------------

### Simple animate() selector animation

Source: https://motion.dev/docs/animate

Quick example of animating multiple elements selected by CSS selector to change opacity. This is the most basic usage pattern for the animate() function.

```JavaScript
animate("li", { opacity: 0 })
```

--------------------------------

### Create Dynamic CSS Drop Shadow with useMotionTemplate

Source: https://motion.dev/docs/react-use-motion-template

Provides an example of generating a complex CSS `drop-shadow` property using `useMotionTemplate`. It combines `useSpring` and `useMotionValue` for dynamic shadow offsets, applying the resulting filter to a `motion.div`.

```javascript
const shadowX = useSpring(0)
const shadowY = useMotionValue(0)
  
const filter = useMotionTemplate`drop-shadow(${shadowX}px ${shadowY}px 20px rgba(0,0,0,0.3))`
  
return <motion.div style={{ filter }} />
```

--------------------------------

### Set MotionValue State Directly via set() API in JavaScript

Source: https://motion.dev/docs/motion-value

A concise example of the `set()` API method, showing how to update a Motion Value's state directly. This method is crucial for programmatic control over a Motion Value's value.

```javascript
x.set("#f00")
```

--------------------------------

### Import Typewriter React component

Source: https://motion.dev/docs/react-typewriter

After installing the Motion+ library, this snippet shows how to import the `Typewriter` component from the `motion-plus/react` package into your React application, making it available for use.

```javascript
import { Typewriter } from "motion-plus/react"
```

--------------------------------

### GSAP Timeline Sequencing with Imperative API

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Shows GSAP's imperative timeline construction using the timeline() constructor and methods like .to(), .addLabel(), and sequential chaining. This approach allows dynamic timeline modifications during playback.

```javascript
const timeline = gsap.timeline(options)

timeline.to("#id", { x: 100, duration: 1 })
timeline.addLabel("My label")
timeline.to("#id", { y: 50, duration: 1 })
```

--------------------------------

### useAnimate Basic Usage with JSX

Source: https://motion.dev/docs/react-use-animate

Demonstrates the basic setup of useAnimate hook in a React component. The hook returns a scope ref that must be attached to a DOM element and an animate function for triggering animations on child elements.

```javascript
function Component() {
  const [scope, animate] = useAnimate()
  
  useEffect(() => {
    // This "li" selector will only select children
    // of the element that receives `scope`.
    animate("li", { opacity: 1 })
  })
  
  return <ul ref={scope}>{children}</ul>
}
```

--------------------------------

### Orchestration - delay Property

Source: https://motion.dev/docs/react-transitions

Delay animation start by a specified duration in seconds. Default is 0. Negative values start the animation partway through its sequence.

```APIDOC
## Orchestration - delay

### Description
Delay the start of an animation by a specified duration in seconds. Positive values delay the animation start, while negative values start the animation partway into its sequence. Useful for coordinating multiple animations.

### Property
**delay** (number) - Optional - Default: 0 - Duration in seconds

### Parameters
- **delay** (number) - Optional - Default: 0 - Delay in seconds

### Request Example
```jsx
animate(element, { filter: "blur(10px)" }, { delay: 0.3 })
```

### Response
- delay of 0.3 starts animation 0.3 seconds after initialization
- delay of -1 starts animation 1 second into its sequence
- delay of 0 starts animation immediately (default)
```

--------------------------------

### Integrating GSAP with React using useGSAP Hook

Source: https://motion.dev/docs/gsap-vs-motion

This example illustrates GSAP's imperative approach within a React component. It uses the `useGSAP` hook and React's `useRef` to target elements, demonstrating how GSAP animations are applied to DOM elements within React's lifecycle, requiring refs for integration.

```jsx
const container = useRef()

useGSAP(() => {
  gsap.to(".box", { x: 100 })
}, { scope: container })

return (
  <div ref={container}>
    <div className="box"></div>
  </div>
);
```

--------------------------------

### Import AnimateNumber Component

Source: https://motion.dev/docs/react-animate-number

Import the AnimateNumber component from the motion-plus/react package after installation. This makes the component available for use in your React application.

```javascript
import { AnimateNumber } from "motion-plus/react"
```

--------------------------------

### Import Motion for React components and hooks in Framer projects

Source: https://motion.dev/docs/framer

This snippet demonstrates how to import the `motion` component and `useSpring` hook from `framer-motion` for use within Framer custom components or overrides. Ensure you use the `framer-motion` package when integrating Motion into your Framer projects.

```typescript
import { motion, useSpring } from "framer-motion"
```

--------------------------------

### Motion Scroll Offset Configuration

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Demonstrates Motion's scroll() offset array syntax for mapping multiple animation keyframes to scroll positions. Uses axis-agnostic 'start' and 'end' keywords instead of directional terms.

```javascript
scroll(callback, {
  target: element,
  offset: ["start start", "end start"] // Exits the viewport top
})
```

--------------------------------

### Read MotionValue state with `get()`

Source: https://motion.dev/docs/react-motion-value

Shows how to synchronously retrieve the current state of a motion value using its `get()` method. This method provides immediate access to the latest value held by the motion value at any given time.

```javascript
x.get() // 100
```

--------------------------------

### Implement Basic Exit Animations with AnimatePresence in React

Source: https://motion.dev/docs/radix

This example illustrates the fundamental use of `AnimatePresence` to handle exit animations. `AnimatePresence` mounts and unmounts its children, tracking components that are being removed from the DOM to animate their exit.

```jsx
<AnimatePresence>
  {isOpen && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
```

--------------------------------

### useInView with Component Implementation

Source: https://motion.dev/docs/react-use-in-view

Complete component example showing how to implement useInView within a functional React component. The hook tracks visibility of an element and re-renders when the element enters or leaves the viewport.

```javascript
import { useInView } from "motion/react"
import { useRef } from "react"

function Component() {
  const ref = useRef(null)
  const isInView = useInView(ref)

  return <div ref={ref} />
}
```

--------------------------------

### Convert mouse/touch events to pointer events in Framer Motion 8.0

Source: https://motion.dev/docs/react-upgrade-guide

Framer Motion 8.0 removes the polyfill for mouse and touch events and requires pointer events. DragControls.start and event handlers must use onPointerDown instead of onMouseDown or onTouchStart.

```javascript
// Old syntax (versions < 8.0)
const dragControls = useDragControls()

const handleMouseDown = (event) => {
  dragControls.start(event)
}
```

```javascript
// New syntax (version 8.0+)
const dragControls = useDragControls()

const handlePointerDown = (event) => {
  dragControls.start(event)
}
```

--------------------------------

### Apply Gesture-Based Animations with Motion for React Props

Source: https://motion.dev/docs/react-animation

This snippet demonstrates how to use `whileHover`, `whileTap`, and `whileInView` props on a `motion.button` component. These props define animation targets that are triggered when a specific gesture starts, animating back to `initial` or `animate` values when the gesture ends.

```jsx
<motion.button
  initial={{ opacity: 0 }}
  whileHover={{ backgroundColor: "rgba(220, 220, 220, 1)" }}
  whileTap={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
  whileInView={{ opacity: 1 }}
/>
```

--------------------------------

### Import AnimateActivity Component

Source: https://motion.dev/docs/react-animate-activity

After installing the `motion-plus` package, this snippet shows the standard way to import the `AnimateActivity` component into your React or TypeScript files from its specific module path.

```typescript
import { AnimateActivity } from "motion-plus/animate-activity"
```

--------------------------------

### Detect press start on single element

Source: https://motion.dev/docs/press

Attach a press gesture listener to a single DOM element using its reference. The callback fires when a press gesture starts on the element.

```javascript
press(
  document.getElementById("my-id"),
  () => {
    console.log("my-id pressed!")
  }
)
```

--------------------------------

### Create and Use Default Steps Easing Function

Source: https://motion.dev/docs/easing-functions

Illustrates the creation of a `steps` easing function with a specified number of discrete steps. This example shows its default behavior where the step changes occur at the end of each interval, resulting in a 'jumpy' animation effect that is spec-compliant with CSS `steps` easing.

```JavaScript
import { steps } from "motion"

const easing = steps(4)

easing(0.2) // 0
easing(0.25) // 0.25
```

--------------------------------

### Import Mini `animate` Function for Optimized Motion.js in Squarespace (JavaScript/HTML)

Source: https://motion.dev/docs/squarespace

To achieve greater filesize savings, this code shows how to import only the lightweight mini version of the `animate` function from Motion.js. This is done by specifying a different CDN path in the <script type="module" defer> tag within the Squarespace footer. It's ideal for situations where only basic animation capabilities are needed, reducing the overall script footprint.

```html
<script type="module" defer>
    import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.13.5/mini/+esm"

    // Your animation code here
    animate("h1", { opacity: [0, 1] })
</script>
```

--------------------------------

### Implement Infinite Looping SVG Draw Animation (JavaScript)

Source: https://motion.dev/docs/svg-effect

This example combines `pathLength` and `pathOffset` with an infinite animation to create a continuous, looping 'draw' effect on an SVG path. Omitting `pathSpacing` allows dynamic calculation for seamless loops.

```javascript
const pathLength = motionValue(0.5)
const pathOffset = motionValue(0)

svgEffect("path", { pathLength, pathOffset })

animate(pathOffset, [0, 1], { repeat: Infinity })
```

--------------------------------

### Apply Hover Effects to Words with Motion and splitText

Source: https://motion.dev/docs/split-text

Illustrates how to use `splitText` to get an array of words, then apply interactive hover effects to each word element individually using Motion's `hover` function.

```javascript
const { words } = splitText("h1")

hover(words, (wordElement) => {
  // Hover logic
})
```

--------------------------------

### Import Ticker Component in React

Source: https://motion.dev/docs/react-ticker

Import the Ticker component from the motion-plus/react package after installation. This makes the component available for use in your React application.

```javascript
import { Ticker } from "motion-plus/react"
```

--------------------------------

### Import splitText Utility in JavaScript

Source: https://motion.dev/docs/split-text

Shows how to import the `splitText` function from the `motion-plus` package into a JavaScript file, making it available for use in your project.

```javascript
import { splitText } from "motion-plus"
```

--------------------------------

### Detect Basic Hover Start and End with Motion's hover

Source: https://motion.dev/docs/hover

This snippet demonstrates the fundamental usage of Motion's `hover` function to detect when a hover gesture starts on an element (specified by a CSS selector) and when it ends. It logs messages to the console for both events.

```javascript
hover(".button", (element) => {
  console.log("hover started on", element)
  
  return () => console.log("hover end")
})
```

--------------------------------

### Set Global Transition Configuration with MotionConfig

Source: https://motion.dev/docs/react-motion-config

Import MotionConfig and motion components from motion/react, then wrap child motion components with MotionConfig to apply a fallback transition duration to all animations. This example sets a 1-second duration that applies to all child motion.div elements unless overridden individually.

```jsx
import { motion, MotionConfig } from "motion/react"

export const MyComponent = ({ isVisible }) => (
  <MotionConfig transition={{ duration: 1 }}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />
  </MotionConfig>
)
```

--------------------------------

### Stagger animations from specific position with stagger from option

Source: https://motion.dev/docs/react-transitions

Applies staggered delays starting from a custom position using the stagger function's from option. Supports 'last', 'center', or a specific numeric index to control the stagger direction and starting point.

```jsx
const transition = {
  delayChildren: stagger(0.1, { from: "last" })
}
```

--------------------------------

### Create and use a MotionValue with React `useMotionValue`

Source: https://motion.dev/docs/react-motion-value

This example demonstrates how to manually create a motion value using the `useMotionValue` hook. The created motion value `x` is then passed to a `motion.div` component via the `style` prop to control its position, allowing for animated `x` transforms.

```javascript
import { motion, useMotionValue } from "motion/react"

export function MyComponent() {
  const x = useMotionValue(0)
  return <motion.div style={{ x }} />
}
```

--------------------------------

### Call useMotionValue as Tagged Template in React

Source: https://motion.dev/docs/react-use-motion-template

Illustrates the 'tagged template' syntax used for `useMotionTemplate` (shown here with `useMotionValue` as an example), where the function name is followed directly by a backtick-delimited string literal.

```javascript
useMotionValue``
```

--------------------------------

### Control Animation Frame with usePageInView

Source: https://motion.dev/docs/react-use-page-in-view

Use usePageInView with useAnimationFrame to conditionally start or stop animation loops, passing the update function only when the page is in view.

```javascript
useAnimationFrame(isPageInView ? update : undefined)
```

--------------------------------

### Retrieve MotionValue Current State with get() in JavaScript

Source: https://motion.dev/docs/motion-value

Demonstrates how to read the most recent value of a Motion Value using the `.get()` method. This provides an immediate snapshot of the Motion Value's current state.

```javascript
const latest = x.get() // 100
```

--------------------------------

### Apply value-specific easing options in Motion

Source: https://motion.dev/docs/glide

This example illustrates how to apply different easing options, including `glide` and `spring`, to individual animated properties within a single `animate()` call. This allows for fine-grained control over the animation behavior of each value, such as different velocities per axis.

```javascript
animate(
  "#ball",
  { x: 0, y: 0 },
  {
    x: { easing: glide({ velocity: 200 }) },
    y: { easing: spring({ velocity: 500 }) }
  }
)
```

--------------------------------

### React Motion: Basic Scroll-Triggered Animation with whileInView

Source: https://motion.dev/docs/react-scroll-animations

This snippet demonstrates a fundamental scroll-triggered animation using Motion's `whileInView` prop. An element with initial `opacity: 0` will smoothly animate to `opacity: 1` as it enters the user's viewport, providing a common reveal effect for UI components.

```jsx
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
/>
```

--------------------------------

### Tracking Another Motion Value with useSpring for Animation

Source: https://motion.dev/docs/react-use-spring

This example shows how `useSpring` can automatically animate towards the latest value of another motion value. The source motion value must be a number or a unit-type string.

```javascript
const x = useMotionValue(0)
const y = useSpring(x)
```

--------------------------------

### Create and Call Transformation Function (JavaScript)

Source: https://motion.dev/docs/transform

This snippet illustrates how to create a reusable transformation function by providing an input range and an output range, then calling it with an input value to get a mapped output. Both ranges must be the same length, and the input range must be linear.

```javascript
const transformer = transform([0, 100], [0, 360])
transformer(50) // 180
```

--------------------------------

### Percentage-Based Transform Animation

Source: https://motion.dev/docs/performance

Example of a percentage-based transform that may not receive hardware acceleration in some browsers. Chrome previously disabled hardware acceleration for percentage-based transforms like this.

```javascript
animate(element, { transform: "translateX(100%)" })
```

--------------------------------

### Cubic Bezier Easing with Motion Array Syntax

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Demonstrates Motion's shorthand array syntax for cubic bezier easing, providing a more concise alternative to WAAPI's CSS string format. Motion accepts both string and array formats.

```javascript
animate(
  element,
  { transform: "translateX(50px)" },
  { ease: [0.29, -0.13, 0.18, 1.18] }
)
```

--------------------------------

### Spring Animation - velocity Property

Source: https://motion.dev/docs/react-transitions

Set the initial velocity of the spring animation. Default uses the current value velocity. Controls the starting speed of the animation.

```APIDOC
## Spring Animation - velocity

### Description
The initial velocity of the spring animation. Default value is the current velocity of the animated value. Allows you to start the spring with a specific initial speed.

### Property
**velocity** (number) - Optional - Default: Current value velocity

### Parameters
- **velocity** (number) - Optional - Initial velocity in units per second
- **type** (string) - Required - Set to "spring"

### Request Example
```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', velocity: 2 }}
/>
```

### Response
- Animation starts with initial velocity of 2 units per second
- Higher velocity values create more energetic starting motion
- Default uses the current animation value's velocity
```

--------------------------------

### Rotating Cube with GSAP useGSAP Hook

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Create a rotating cube animation using GSAP's useGSAP React hook. This example demonstrates the traditional GSAP pattern for React animations with a 360-degree rotation.

```jsx
const RotatingCube = () => {
  const boxRef = useRef()

  useGSAP(() => {
    gsap.to(boxRef.current, {
      duration: 10,
      repeat: -1,
      rotation: 360,
    })
  })

  return <div ref={boxRef} />
}
```

--------------------------------

### speed Control Property

Source: https://motion.dev/docs/animate

Get or set the current playback speed of the animation. Supports normal playback, slow-motion, fast-forward, and reverse playback.

```APIDOC
## speed Control Property

### Description
Gets and sets the current playback speed of the animation.

### Property
**speed** (number)

### Speed Values
- **1** - Normal playback rate
- **0.5** - Half speed (slow-motion)
- **2** - Double speed (fast-forward)
- **-1** - Reverse playback

### Usage
```javascript
const animation = animate(element, { opacity: 0 })

const currentSpeed = animation.speed

// Double current speed
animation.speed = currentSpeed * 2
```

### Parameters
- **speed** (number) - Playback speed multiplier (1 = normal, <1 = slower, >1 = faster, negative = reverse)
```

--------------------------------

### Animate between different value types in React

Source: https://motion.dev/docs/react-animation

Motion supports animating certain properties between different value types. This example animates the x position from a percentage to a calculated viewport width value.

```jsx
<motion.div
  initial={{ x: "100%" }}
  animate={{ x: "calc(100vw - 50%)" }}
/>
```

--------------------------------

### time Control Property

Source: https://motion.dev/docs/animate

Get or set the current playback time of the animation in seconds. Allows seeking to specific points in the animation timeline.

```APIDOC
## time Control Property

### Description
Gets and sets the current time of the animation.

### Property
**time** (number)

### Usage
```javascript
const animation = animate(x, 100, { duration: 1 })

// Set animation time to 0.5 seconds
animation.time = 0.5

// Get animation time
console.log(animation.time) // 0.5
```

### Parameters
- **time** (number) - Current playback time in seconds
```

--------------------------------

### Composing Multiple Timelines: GSAP vs Motion

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Compares approaches for combining multiple timelines. GSAP uses the .add() method for imperative composition, while Motion uses array spread syntax for declarative combination.

```javascript
// GSAP
timeline.add(timelineA)
timeline.add(timelineB)

// Motion
const timeline = [...timelineA, ...timelineB]
```

--------------------------------

### Create feature export file for lazy loading Motion React

Source: https://motion.dev/docs/react-reduce-bundle-size

Create a separate file that exports only the required feature package (domMax in this example). This file will be dynamically imported later, allowing features to be loaded only after the initial page render.

```javascript
// features.js
import { domMax } from "motion/react"
export default domMax
```

--------------------------------

### Orchestrate Component Animations Using Named Variants

Source: https://motion.dev/docs/react-animation

This example shows how to use named variants, such as `hidden` and `visible`, with `initial`, `whileInView`, and `exit` props on a `motion.div` component. This allows for clear, declarative control over different animation states and transitions.

```jsx
<motion.div
  variants={variants}
  initial="hidden"
  whileInView="visible"
  exit="hidden"
/>
```

--------------------------------

### Animate transform property with spring transition in React

Source: https://motion.dev/docs/react-animation

Motion provides hardware-accelerated animations when using the transform property directly. This example animates a horizontal translation with a spring transition effect.

```jsx
<motion.li
  initial={{ transform: "translateX(-100px)" }}
  animate={{ transform: "translateX(0px)" }}
  transition={{ type: "spring" }}
/>
```

--------------------------------

### Migrate layout animation prop from Motion 1 `layoutTransition` to Motion 2 `layout`

Source: https://motion.dev/docs/react-upgrade-guide

This snippet demonstrates updating layout animation props from Framer Motion 1 to Motion 2. Previously, `layoutTransition` enabled layout animations. In Motion 2, this is replaced by the simpler boolean `layout` prop.

```jsx
// Before
<motion.div layoutTransition />
```

```jsx
// After
<motion.div layout />
```

--------------------------------

### Create drag controls and pass to motion component

Source: https://motion.dev/docs/react-use-drag-controls

Initialize drag controls using useDragControls hook and pass them to a motion.div with drag prop enabled. The controls object can then be used to programmatically start drag sessions.

```javascript
const controls = useDragControls()

return <motion.div drag dragControls={controls} />
```

--------------------------------

### New Gesture Callback Syntax in Motion 12.0

Source: https://motion.dev/docs/upgrade-guide

As of Motion 12.0, gesture callbacks for `press`, `hover`, and `inView` now explicitly receive the target element as their first argument, followed by the triggering event. This change standardizes access to the matched element, making it more predictable and stable within the callback.

```javascript
press("a", (element, startEvent) => {
return (endEvent) => {}
})
hover("li", (element, startEvent) => {
return (endEvent) => {}
})
inView("section", (element, startEntry) => {
return (endEntry) => {}
})
```

--------------------------------

### Observe Automatic Updates of Derived MotionValue in JavaScript

Source: https://motion.dev/docs/transform-value

This example illustrates `transformValue`'s automatic dependency tracking. It sets up `doubleX` to derive its value from `x`, then demonstrates that a `change` listener on `doubleX` is triggered, logging the updated value, whenever `x` is modified using `x.set()`.

```javascript
import { motionValue, transformValue } from "motion"
  
const x = motionValue(0)
const doubleX = transformValue(() => x.get() * 2)

doubleX.on("change", (latest) => console.log(latest))

x.set(10) // doubleX will log 20
```

--------------------------------

### Create Dynamic Motion for React Variants Using Custom Prop

Source: https://motion.dev/docs/react-animation

This example shows how to define variants as functions that accept a `custom` prop. This allows each animating element to resolve its animation properties (like `delay`) uniquely, based on a value passed via the `custom` prop during rendering, enabling per-item dynamic animation.

```javascript
const variants = {
  hidden: { opacity: 0 },
  visible: (index) => ({
    opacity: 1,
    transition: { delay: index * 0.3 }
  })
}
```

```jsx
items.map((item, index) => <motion.div custom={index} variants={variants} />)
```

--------------------------------

### dragTransition Property

Source: https://motion.dev/docs/react-motion-component

Allows customization of the dragging momentum transition animation. When releasing a draggable element, an inertia animation starts based on dragging velocity.

```APIDOC
## dragTransition

### Description
Allows you to change dragging momentum transition. When releasing a draggable element, an animation with type `"inertia"` starts. The animation is based on your dragging velocity. This property allows you to customize it.

### Property Type
Object

### Parameters
- **bounceStiffness** (number) - Optional - Stiffness of the bounce animation
- **bounceDamping** (number) - Optional - Damping of the bounce animation

### Usage Example
```jsx
<motion.div
  drag
  dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
/>
```
```

--------------------------------

### Animate Box Shadow vs. Drop Shadow Filter for Performance

Source: https://motion.dev/docs/performance

This example contrasts animating `boxShadow`, which can be less performant due to costly paint operations, with animating `filter` using `drop-shadow`. The `filter` property is often hardware-accelerated and processed directly by the compositor, leading to smoother animations.

```javascript
// ❌
animate(element, { boxShadow: "10px 10px black" })

// ✅
animate(element, { filter: "drop-shadow(10px 10px black)" })
```

--------------------------------

### Configure the 'velocity' option for glide easing in Motion

Source: https://motion.dev/docs/glide

The `velocity` option sets the initial velocity (in units per second) for the `glide` animation. By default, it's 0 or inherits from previous animations, but it can be explicitly set to control the starting speed.

```javascript
glide({ velocity: 1000 })
```

--------------------------------

### Asynchronously Load LazyMotion Features in React

Source: https://motion.dev/docs/react-lazy-motion

This example shows how to asynchronously load animation features using `LazyMotion` in React, ensuring the site is hydrated before loading additional animation functionality. It involves splitting feature definitions into a separate file and dynamically importing them.

```javascript
// features.js
import { domAnimation } from "motion/react"
export default domAnimation
```

```javascript
// index.js
const loadFeatures = import("./features.js")
  .then(res => res.default)

function Component() {
  return (
    <LazyMotion features={loadFeatures}>
      <m.div animate={{ scale: 1.5 }} />
    </LazyMotion>
  )
}
```

--------------------------------

### Set repeatDelay between animation cycles in Motion

Source: https://motion.dev/docs/react-transitions

Configures the delay duration in seconds between each animation repetition using the repeatDelay property. This example creates an infinite rotation animation with a 1-second pause between each repeat cycle.

```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ repeat: Infinity, repeatDelay: 1 }}
/>
```

--------------------------------

### Create Fade Out Effect with mapValue

Source: https://motion.dev/docs/map-value

Combine mapValue with motion values to create opacity effects that fade in and out based on input range. This example fades out when input is outside the 0-100 range.

```JavaScript
const x = motionValue(100)

// Fade out outside the 0-100 range
const opacity = mapValue(x, [-100, 0, 100, 200], [0, 1, 1, 0])

// Shift color when fading out
const backgroundColor = mapValue(opacity, [0, 1], ["#f00", "#00f"])
```

--------------------------------

### Handle press end event with callback return

Source: https://motion.dev/docs/press

Return a function from the press start callback to handle when the press gesture ends. The end callback receives the end event.

```javascript
press(element, (element, startEvent) => {
  console.log("press start")
  
  return (endEvent) => {
    console.log("press end")
  }
})
```

--------------------------------

### Basic AnimateActivity Usage with motion.div

Source: https://motion.dev/docs/react-animate-activity

This example demonstrates how to wrap a `motion.div` component with `AnimateActivity`. The `mode` prop, controlled by an `isVisible` boolean, determines whether the child element is visible or hidden, triggering exit animations upon hiding.

```jsx
<AnimateActivity mode={isVisible ? "visible" : "hidden"}>
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
/>
</AnimateActivity>
```

--------------------------------

### Create Layout Animation with motion.div React

Source: https://motion.dev/docs/react-layout-animations

Demonstrates basic layout animation using Motion's motion.div component with the layout prop. When the component re-renders and its layout changes (height in this example), the animation is automatically triggered. This creates smooth transitions when state changes affect component dimensions.

```javascript
function Accordion() {
  const [isOpen, setOpen] = useState(false)
  
  return (
    <motion.div
      layout
      style={{ height: isOpen ? "100px" : "500px" }}
      onClick={() => setOpen(!isOpen)}
    />
  )
}
```

--------------------------------

### Implement Magnetic and Target-Morphing Effects with Motion+ Cursor

Source: https://motion.dev/docs/react-animation

This example shows the usage of the `Cursor` component from Motion+ to create advanced magnetic and target-morphing hover effects. By simply adding the `magnetic` prop, clickable elements can respond with dynamic visual feedback.

```jsx
<Cursor magnetic />
```

--------------------------------

### Utility `resize` Function

Source: https://motion.dev/docs/resize

Monitors and reacts to size changes in the viewport or specified HTML/SVG elements. Utilizes a single `ResizeObserver` for optimal performance.

```APIDOC
## FUNCTION resize

### Description
The `resize` function from the Motion library allows you to monitor and react to size changes in the viewport, or specific HTML and SVG elements. It efficiently manages listeners via a single, shared `ResizeObserver`.

### Method
Function Call

### Endpoint
`resize(target?, callback)`

### Parameters
#### Arguments
- **target** (string | HTMLElement) - Optional - The CSS selector string or HTMLElement to observe. If omitted, the viewport is observed.
- **callback** (function) - Required - The function to execute when a size change is detected.

### Callback Signature
#### For Viewport Tracking
`callback({ width, height })`
- **width** (number) - The current width of the viewport.
- **height** (number) - The current height of the viewport.

#### For Element Tracking
`callback(element, { width, height })`
- **element** (HTMLElement) - The HTML element that changed size.
- **width** (number) - The current border-box width of the element.
- **height** (number) - The current border-box height of the element.

### Request Example
```javascript
import { resize, frame } from "motion";

// Tracking viewport changes
resize(({ width, height }) => {
  console.log(`Viewport changed: ${width}x${height}`);
});

// Tracking element changes with a CSS selector
resize(".drawer", (element, { width, height }) => {
  console.log(`${element.tagName} (.drawer) changed: ${width}x${height}`);
  // Example of responding with Motion frameloop
  frame.render(() => {
    element.style.height = Math.max(400, height) + "px";
  });
});

// Cleaning up the listener
const logViewportSize = ({ width, height }) => {
  console.log(`Current viewport size: ${width}x${height}`);
};
const stopTrackingViewport = resize(logViewportSize);
// Call stopTrackingViewport() later to remove the listener
// stopTrackingViewport();
```

### Response
#### Return Value
The `resize` function returns a `stop` function.
- **stop()** (function) - Calling this function will remove the attached resize listener(s) and clean up the `ResizeObserver` if no more listeners are active for the element or globally.

#### Response Example
```javascript
// The resize function returns a cleanup function
const stop = resize(() => {
  console.log("Size changed!");
});

// To stop listening:
// stop();
```
```

--------------------------------

### Using Motion's Hybrid `animate` Function (11.0+)

Source: https://motion.dev/docs/upgrade-guide

The 'hybrid' `animate` function in Motion 11.0 offers advanced capabilities such as timeline sequencing and independent transform animations. While larger in size, it's necessary for more complex animation scenarios and should be imported directly from `motion`.

```javascript
import { animate } from "motion"

animate(element, { x: 100 })
```

--------------------------------

### Polyfill .finished Promise for WAAPI Animations with Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

The `animation.finished` Promise, a newer part of the WAAPI specification, lacks full browser support. Motion provides a polyfill for this feature, enabling consistent use of async/await or .then() syntax to handle animation completion across various browsers.

```javascript
const animation = animate("#box", { opacity: 0 })

// Async
await animation

// Promise
animation.then(() => {})
```

--------------------------------

### Motion animated container with mapped child elements

Source: https://motion.dev/docs/figma

JSX component using Motion's motion.div and motion.span to create animated text with container and child variants. This example demonstrates mapping over words array and applying animations using Motion's variants system with initial and animate props.

```jsx
<motion.div
  className={className}
  variants={container}
  initial="hidden"
  animate="visible"
>
  {words.map((word, index) => (
    <motion.span
      key={index}
      variants={child}
      style={{ display: "inline-block", marginRight: "0.25em" }}
    >
      {word}
    </motion.span>
  ))}
</motion.div>
```

--------------------------------

### Import and Create MotionValue in JavaScript

Source: https://motion.dev/docs/motion-value

Demonstrates how to import the `motionValue` function from the 'motion' library and initialize a new Motion Value with an initial numeric state. This is the first step in manually managing animated properties.

```javascript
import { motionValue } from "motion"

const x = motionValue(0)
```

--------------------------------

### Apply whileInView Animation as Target (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `whileInView` prop allows a `motion.div` to animate to specific target properties when it enters the viewport. This is a simple way to create scroll-triggered entry animations. In this example, the `opacity` of the div is set to `1` when it becomes visible.

```jsx
// As target
<motion.div whileInView={{ opacity: 1 }} />
```

--------------------------------

### Compose scrollYProgress with useSpring for Smooth Animation

Source: https://motion.dev/docs/react-use-scroll

This example demonstrates how `useScroll`'s motion values can be composed with other Motion hooks. Here, `scrollYProgress` is passed to `useSpring` to create a smoother, spring-animated `scaleX` value, which is then applied to a `motion.div` for a more fluid progress indicator.

```jsx
const { scrollYProgress } = useScroll()
const scaleX = useSpring(scrollYProgress)

return <motion.div style={{ scaleX }} />
```

--------------------------------

### Subscribe to MotionValue events with `useMotionValueEvent`

Source: https://motion.dev/docs/react-motion-value

This example illustrates how to use the `useMotionValueEvent` hook to subscribe to specific events, such as `'change'`, on a motion value. The provided callback function `(latest) => console.log(latest)` will be executed whenever the motion value updates, receiving its new value.

```javascript
useMotionValueEvent(x, "change", (latest) => console.log(latest))
```

--------------------------------

### Import useAnimate from Motion React

Source: https://motion.dev/docs/react-use-animate

Shows the import statements for useAnimate from Motion library. Two import options are available: mini version for minimal bundle size and hybrid version with full features.

```javascript
// Mini
import { useAnimate } from "motion/react-mini"

// Hybrid
import { useAnimate } from "motion/react"
```

--------------------------------

### Control Animation Repetition Behavior with Motion `repeatType`

Source: https://motion.dev/docs/animate

Determines the style of animation repetition: `loop` (from start), `reverse` (alternating playback), or `mirror` (switching origin/target). Defaults to `"loop"`.

```javascript
animate(
  element,
  { backgroundColor: "#fff" },
  { repeat: 1, repeatType: "reverse", duration: 2 }
)
```

--------------------------------

### Import propEffect from Motion library

Source: https://motion.dev/docs/prop-effect

Shows the required import statement to use propEffect in your project. The function is exported from the main 'motion' package.

```javascript
import { propEffect } from "motion"
```

--------------------------------

### React: Implement Lightweight Hover Detection using `hover()` Function and `useEffect`

Source: https://motion.dev/docs/react-hover-animation

This code demonstrates how to use the lightweight `hover()` utility function from Motion for gesture recognition. It integrates with React's `useEffect` hook, accepting a DOM element reference and callback functions for hover start and end, with the ability to return a cleanup function.

```javascript
import { hover } from "motion"
import { useRef, useEffect } from "react"

function Component() {
  const ref = useRef(null)

  useEffect(() => {
    return hover(ref.current, () => {
      console.log("on hover start")

      return () => console.log("on hover end")
    })
  }, [])

  return <button ref={ref} />
}
```

--------------------------------

### Get and Set Animation Current Time with Motion `animation.time`

Source: https://motion.dev/docs/animate

Shows how to both set and retrieve the current playback time of an animation using the `time` property of the animation control object. Time is measured in seconds.

```javascript
const animation = animate(x, 100, { duration: 1 })

// Set animation time to 0.5 seconds
animation.time = 0.5

// Get animation time
console.log(animation.time) // 0.5
```

--------------------------------

### Control animation timing with when variant property in Motion

Source: https://motion.dev/docs/react-transitions

Uses the when property with variants to control whether parent animations play before or after child animations. The example demonstrates 'afterChildren' timing where parent animation waits for all children to complete before playing.

```jsx
const list = {
  hidden: {
    opacity: 0,
    transition: { when: "afterChildren" }
  }
}

const item = {
  hidden: {
    opacity: 0,
    transition: { duration: 2 }
  }
}

return (
  <motion.ul variants={list} animate="hidden">
    <motion.li variants={item} />
    <motion.li variants={item} />
  </motion.ul>
)
```

--------------------------------

### Motion Timeline Sequencing with Declarative Array Syntax

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Demonstrates Motion's declarative array-based timeline composition using nested arrays for animations and string labels. This approach reduces boilerplate for long animations but requires full timeline redefinition for changes.

```javascript
const timeline = [
  ["#id", { x: 100, duration: 1 }],
  "My label",
  ["#id", { y: 100, duration: 1 }]
]

animate(timeline, options)
```

--------------------------------

### Import Motion Mini Version from CDN

Source: https://motion.dev/docs/webflow

Imports only the minimal Motion animate function (2.3kb) from CDN instead of the full library. This reduces file size significantly while still providing core animation capabilities for simple use cases.

```html
<script type="module">
  import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.13.5/mini/+esm"
</script>
```

--------------------------------

### attrEffect with Aria and Data Attributes

Source: https://motion.dev/docs/attr-effect

Shows how attrEffect automatically converts camelCase attribute names to kebab-case for aria and data attributes. This example demonstrates applying a motion value to ariaValuenow and dataValue attributes, which are rendered as aria-valuenow and data-value.

```javascript
const value = motionValue("#fff")

attrEffect(counter, {
  ariaValuenow: value,
  dataValue: value
})

// <div aria-valuenow="#fff" data-value="#fff">
```

--------------------------------

### Apply computed filter to element style with styleEffect (JavaScript)

Source: https://motion.dev/docs/style-effect

This example demonstrates how to apply a dynamic CSS filter using `styleEffect`. It initializes a `motionValue` for blur, then uses `transformValue` to create a CSS `filter` string based on its current value. The resulting filter is then bound to an `<img>` element.

```javascript
const blur = motionValue(2)
const filter = transformValue(() => `blur(${blur.get()}px)`)

styleEffect("img", { filter })
```

--------------------------------

### Mirror a Custom Easing Function with mirrorEasing

Source: https://motion.dev/docs/easing-functions

Demonstrates how to use the `mirrorEasing` modifier to create an 'ease in-out' function from an 'ease in' function. This modifier reflects the easing curve, causing the animation to accelerate and then decelerate symmetrically, providing a smooth start and end.

```JavaScript
import { mirrorEasing } from "motion"

const powerIn = (progress) => progress * progress

const powerInOut = mirrorEasing(powerInOut)
```

--------------------------------

### Typewriter with moderate typing speed variance

Source: https://motion.dev/docs/react-typewriter

This example demonstrates how to apply a custom variance factor to the typing speed. Setting `variance` to `0.5` introduces a moderate level of natural speed variation, making the typing animation feel more organic.

```jsx
<Typewriter variance={0.5}>Hello world!</Typewriter>
```

--------------------------------

### Control Keyframe Position with Times Property

Source: https://motion.dev/docs/react-transitions

Adjusts the position of each keyframe throughout the animation duration using the times property. Values range from 0 to 1, representing the animation's start and end points.

```jsx
<motion.div
  animate={{
    x: [0, 100, 0],
    transition: { times: [0, 0.3, 1] }
  }}
/>
```

--------------------------------

### Import mix function from Motion

Source: https://motion.dev/docs/mix

Import the mix function and related utilities from the Motion library. This is the first step to using the mix functionality for value interpolation in your JavaScript project.

```javascript
import { mix } from "motion"
```

--------------------------------

### Basic usePageInView Hook Usage

Source: https://motion.dev/docs/react-use-page-in-view

Call usePageInView to get a boolean value indicating whether the current page is in view. Returns true when the page is the active tab, and defaults to true on server and initial client render.

```javascript
const isPageInView = usePageInView()
```

--------------------------------

### Conditionally Render Motion+ Cursor Component in React

Source: https://motion.dev/docs/cursor

This example shows how to conditionally render the `Cursor` component based on a boolean state, `isCursorVisible`. Removing the component from the DOM will restore the default browser cursor.

```jsx
{isCursorVisible ? <Cursor /> : null}
```

--------------------------------

### Using scroll with a Callback Function in JavaScript

Source: https://motion.dev/docs/scroll

This example shows how to use `scroll()` with a callback function. The callback receives the latest scroll progress value, normalized between `0` and `1`, every time the scroll position changes.

```javascript
scroll(progress => console.log(progress))
```

--------------------------------

### Apply MotionValues to DOM Elements with styleEffect in JavaScript

Source: https://motion.dev/docs/motion-value

This example demonstrates how to link Motion Values to DOM element styles using `styleEffect`. Changes to `x` and `opacity` Motion Values will automatically be applied to all `<li>` elements on the next animation frame, allowing for synchronized visual updates.

```javascript
const x = motionValue(0)
const opacity = motionValue(1)

styleEffect("li", { x, opacity })

x.set(100) // Will apply to all <li> elements on the next frame
animate(opacity, 0) // Will animate all <li> opacity
```

--------------------------------

### Snap motion component to cursor position

Source: https://motion.dev/docs/react-use-drag-controls

Pass snapToCursor: true option to the start method to make the motion component immediately snap to the cursor position at the beginning of the drag gesture, rather than only applying position changes.

```javascript
controls.start(event, { snapToCursor: true })
```

--------------------------------

### Include Bundled Custom JavaScript in Squarespace Asynchronously (HTML)

Source: https://motion.dev/docs/squarespace

After bundling custom Motion.js code (potentially tree-shaken), this HTML snippet demonstrates how to include the resulting JavaScript file in a Squarespace site. By using an `async` script tag pointing to a CDN, the script loads without blocking page rendering, further improving performance and SEO scores.

```html
<script async src="https://yourdomain.com/my-script.js"></script>
```

--------------------------------

### AnimateActivity Basic Usage with Child Component

Source: https://motion.dev/docs/react-animate-activity

This example demonstrates the basic usage of `AnimateActivity` by wrapping a custom `Tab` component. The `mode` prop dynamically switches between "visible" and "hidden" states, enabling exit animations for the `Tab` component.

```jsx
<AnimateActivity mode={isVisible ? "visible" : "hidden"}>
  <Tab />
</AnimateActivity>
```

--------------------------------

### Cancel scheduled frame callback JavaScript

Source: https://motion.dev/docs/frame

Import and use `cancelFrame` to prevent a previously scheduled callback from executing. This example demonstrates canceling a DOM measurement callback after scheduling it with `frame.read()`.

```javascript
import { frame, cancelFrame } from "framer-motion"

function measureElement() {
  console.log(element.getBoundingClientRect())
}

frame.read(measureElement)
cancelFrame(measureElement)
```

--------------------------------

### Manage Shared Layout Element Exit Animations with AnimatePresence

Source: https://motion.dev/docs/react-layout-animations

This example combines `layoutId` with `AnimatePresence` to handle both entry and exit animations for shared layout elements. `AnimatePresence` ensures that when `isOpen` becomes false, the `motion.div` stays in the DOM long enough for its exit animation to complete, providing a smooth transition back to its origin.

```jsx
<AnimatePresence>
  {isOpen && <motion.div layoutId="modal" />}
</AnimatePresence>
```

--------------------------------

### Cancel styleEffect application with cleanup function (JavaScript)

Source: https://motion.dev/docs/style-effect

This example demonstrates how to stop `styleEffect` from further applying changes to an element's styles. Calling the `cancel` function, which is returned by `styleEffect`, effectively cleans up and disconnects the motion values from the target element.

```javascript
const width = motionValue("0px")
const cancel = styleEffect("#progress", { width })

cancel()
```

--------------------------------

### Configure springValue with Custom Options (JavaScript)

Source: https://motion.dev/docs/spring-value

Shows how to pass configuration options, such as `stiffness`, as a second argument to the `springValue` function. These options customize the physics and behavior of the spring animation.

```javascript
springValue(0, { stiffness: 1000 })
```

--------------------------------

### Configure repeatType for animation playback in Motion

Source: https://motion.dev/docs/react-transitions

Sets how animations repeat using the repeatType property with values 'loop', 'reverse', or 'mirror'. The example demonstrates reverse repetition where animation alternates between forward and backwards playback over 2 seconds with one repeat cycle.

```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{
    repeat: 1,
    repeatType: "reverse",
    duration: 2
  }}
/>
```

--------------------------------

### Render DOM Style Changes on MotionValue Update with on() and frame.render in JavaScript

Source: https://motion.dev/docs/motion-value

This advanced example shows how to subscribe to `change` events on a `motionValue` and use `frame.render` to safely apply style updates to a DOM element. This ensures that DOM manipulations happen within Motion's optimized frameloop, preventing layout thrashing.

```javascript
import { motionValue, frame } from "motion"

const color = motionValue("#fff")

color.on("change", latest => {
  frame.render(() => element.style.backgroundColor = latest)
})
```

--------------------------------

### Reduce Bundle Size with `LazyMotion` in Framer Motion 4 (React/JavaScript)

Source: https://motion.dev/docs/react-upgrade-guide

Framer Motion 4 introduces the `LazyMotion` component to reduce initial bundle size by enabling lazy-loading of animation features. It replaces the previous `MotionConfig`'s `features` prop for this purpose. Wrap your `motion` components with `LazyMotion` and specify feature sets like `domAnimation` to load only the necessary animation capabilities.

```javascript
import { LazyMotion, domAnimation, m } from "framer-motion"

export const MyComponent = ({ isVisible }) => (
  <LazyMotion features={domAnimation}>
    <m.div animate={{ opacity: 1 }} />
  </LazyMotion>
)
```

--------------------------------

### Typewriter with slow typing speed

Source: https://motion.dev/docs/react-typewriter

This example demonstrates how to adjust the typing speed of the `Typewriter` component. Setting the `speed` prop to `"slow"` will make the animation proceed at a deliberately slower pace than the default realistic speed.

```jsx
<Typewriter speed="slow">Hello world!</Typewriter>
```

--------------------------------

### Import attrEffect from Motion Library

Source: https://motion.dev/docs/attr-effect

Shows the required import statement to use attrEffect in a JavaScript module. This must be done before attrEffect can be called in the code.

```javascript
import { attrEffect } from "motion"
```

--------------------------------

### Set initial velocity for a glide animation in Motion

Source: https://motion.dev/docs/glide

This snippet shows how to manually provide an initial `velocity` to the `glide` easing function. This overrides the automatic velocity passing from previous animations, allowing precise control over the starting momentum, measured in units per second.

```javascript
animate(
  "#carousel",
  { x: 100 },
  { easing: glide({ velocity: 1000 }) }
)
```

--------------------------------

### AnimatePresence exitBeforeEnter prop deprecation in Framer Motion 10.0

Source: https://motion.dev/docs/react-upgrade-guide

The exitBeforeEnter prop was deprecated in version 7.2.0 and removed in version 10.0. Code using this prop must be updated to use the mode="wait" prop instead.

```javascript
// Old syntax (deprecated)
<AnimatePresence exitBeforeEnter>
  {children}
</AnimatePresence>
```

```javascript
// New syntax (version 10.0+)
<AnimatePresence mode="wait">
  {children}
</AnimatePresence>
```

--------------------------------

### Tracking an Element's Position within a Scroll Container

Source: https://motion.dev/docs/scroll

This example illustrates how to use the `target` option to track the progress of a specific element (referenced by its `ref`) as it moves within its scrollable container. This enables animations relative to an element's position.

```javascript
scroll(animation, { target: document.getElementById("item") })
```

--------------------------------

### Update Jest tests for async render scheduling in Framer Motion 11.0

Source: https://motion.dev/docs/react-upgrade-guide

Framer Motion 11.0 moved render scheduling from synchronous to microtask execution. Jest tests that previously assumed synchronous updates must now await an animation frame before asserting on DOM updates.

```javascript
// Old test (synchronous)
render(
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ false }}
  />
)

expect(element).toHaveStyle("opacity: 1")
```

```javascript
// New test (with await)
render(
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ false }}
  />
)

await nextFrame()

expect(element).toHaveStyle("opacity: 1")
```

```javascript
// utils.js
import { frame } from "framer-motion"

export async function nextFrame() {
    return new Promise<void>((resolve) => {
        frame.postRender(() => resolve())
    })
}
```

--------------------------------

### Import Motion with Full Library from CDN

Source: https://motion.dev/docs/webflow

Imports the complete Motion library from a CDN and uses the animate function to fade in a header element. This approach provides all Motion functionality but includes unused code. The version can be customized by replacing the version number in the URL.

```html
<script type="module">
  import { animate, scroll } from "https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm"

  animate("header", { opacity: 1 })
</script>
```

--------------------------------

### Animate CSS Property Changes with Motion Layout

Source: https://motion.dev/docs/react-layout-animations

This example showcases Motion's ability to animate CSS properties that are typically not animatable, such as `justify-content`. When the `isOn` state changes, the `layout` prop ensures a smooth animation between the `flex-start` and `flex-end` values.

```jsx
<motion.div
  layout
  style={{ justifyContent: isOn ? "flex-start" : "flex-end" }}
/>
```

--------------------------------

### Create spring-animated MotionValues with `useSpring`

Source: https://motion.dev/docs/react-motion-value

This snippet demonstrates how `useSpring` can be used to create new motion values (`x`, `y`) that smoothly follow other motion values (`dragX`, `dragY`) with a spring animation. This is particularly useful for creating interactive, physics-based effects where values react with inertia and damping.

```javascript
const dragX = useMotionValue(0)
const dragY = useMotionValue(0)
const x = useSpring(dragX)
const y = useSpring(dragY)
```

--------------------------------

### Animate multiple transforms with gestures in React

Source: https://motion.dev/docs/react-animation

Motion supports animating different transform axes independently, enabling complex gesture-based animations. This example combines initial state, animated state, hover scale, and tap scale effects.

```jsx
<motion.button
  initial={{ y: 10 }}
  animate={{ y: 0 }}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
/>
```

--------------------------------

### Forward All Motion Props with `motion()` Configuration in Framer Motion 4 (React/JavaScript)

Source: https://motion.dev/docs/react-upgrade-guide

In Framer Motion 4, the `motion.custom()` helper has been removed. To achieve its functionality of automatically forwarding all Framer Motion props to an underlying custom component, use the `forwardMotionProps: true` option when creating a `motion` component. This ensures that all animation and motion-related props are passed down correctly to your custom React component.

```javascript
const MotionComponent = motion(Component, {
    forwardMotionProps: true
})
```

--------------------------------

### Instantly change MotionValue state with `jump()`

Source: https://motion.dev/docs/react-motion-value

This example shows how `jump()` can be used to instantly move a motion value to a new state, such as `10`. Crucially, it resets its velocity to `0` and ignores any attached effects like springs, providing a way to forcefully break continuity in animations.

```javascript
const x = useSpring(0)
x.jump(10)
x.getVelocity() // 0
```

--------------------------------

### Setup LazyMotion with lazy-loaded features in Motion React

Source: https://motion.dev/docs/react-reduce-bundle-size

Use dynamic imports with LazyMotion to defer loading animation features until after the initial render. The loadFeatures function returns a promise that resolves to the feature bundle, enabling code-splitting and improved initial load performance.

```jsx
import { LazyMotion } from "motion/react"
import * as m from "motion/react-m"

const loadFeatures = () =>
  import("./features.js").then(res => res.default)

function App() {
  return (
    <LazyMotion features={loadFeatures}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
    </LazyMotion>
  )
}
```

--------------------------------

### Define and Apply a Custom Cubic Bezier Easing

Source: https://motion.dev/docs/easing-functions

Demonstrates how to create a custom easing function using `cubicBezier` from the Motion library. It shows importing the function, defining a new easing curve with four control points, and then applying it to a progress value to get an eased result, providing precise control over animation acceleration.

```JavaScript
import { cubicBezier } from "motion"

const easing = cubicBezier(.35,.17,.3,.86)

const easedProgress = easing(0.5)
```

--------------------------------

### Creating Animation Timelines with GSAP

Source: https://motion.dev/docs/gsap-vs-motion

This snippet showcases GSAP's powerful, chain-based imperative API for creating complex animation sequences. A `gsap.timeline()` instance is used to sequence multiple animations, with `to()` methods applying styles to elements like `h1` and `p` with relative offsets.

```javascript
const tl = gsap.timeline()
tl.to("h1", { opacity: 1 })
tl.to("p", { y: 0 }, "-=0.5")
```

--------------------------------

### Animate CSS filter properties in React

Source: https://motion.dev/docs/react-animation

Motion can animate standard CSS values like filters. This example animates a blur filter from 10px to none, demonstrating Motion's capability to handle complex CSS properties.

```jsx
<motion.section
  initial={{ filter: "blur(10px)" }}
  animate={{ filter: "none" }}
/>
```

--------------------------------

### Cubic Bezier Easing with WAAPI

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Shows WAAPI's cubic bezier easing syntax using CSS string format. The easing parameter accepts cubic-bezier functions defined as strings.

```javascript
element.animate(
  { transform: "translateX(50px)" },
  { easing: "cubic-bezier(0.29, -0.13, 0.18, 1.18)" }
)
```

--------------------------------

### Adjust Animation Playback Speed with Motion `animation.speed`

Source: https://motion.dev/docs/animate

Demonstrates how to get and set the `speed` property of an animation control object to modify playback rate. Values like `1` (normal), `0.5` (half), `2` (double), and `-1` (reverse) are supported.

```javascript
const animation = animate(element, { opacity: 0 })

const currentSpeed = animation.speed

// Double current speed
animation.speed = currentSpeed * 2
```

--------------------------------

### GSAP Animation Controls Methods

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Demonstrates GSAP animation control methods for manipulating animation state after creation. GSAP provides getter/setter methods for each animation option, offering more granular control than Motion but with more verbose syntax.

```javascript
const animation = gsap.to()

animation.delay(0.5) // No Motion equivalent
```

--------------------------------

### Utilize MotionValue and useTransform for complex 3D animations

Source: https://motion.dev/docs/react-three-fiber

This example showcases the use of `useMotionValue` to create an animatable value and `useTransform` to derive another value based on it. It demonstrates injecting motion values into R3F attributes like `position-x` and `scale` for granular control over 3D component animations.

```jsx
import { useMotionValue, useTransform } from "framer-motion"
import { motion } from "framer-motion-3d"

export function Box() {
  const x = useMotionValue(0)
  const scaleZ = useTransform(x, v => v / 100)
  
  return (
    <motion.mesh
      position-x={x}
      scale={[1, 1, scaleZ]}
      animate={{ x: 100 }} 
    />
  )
}
```

--------------------------------

### Generate CSS Filter String with TransformValue in JavaScript

Source: https://motion.dev/docs/transform-value

This example demonstrates how to use `transformValue` to create a dynamic CSS `filter` property. It derives a `blur()` string from a `motionValue(0)` and applies it to an `img` element using `styleEffect`, updating automatically when the blur value changes.

```javascript
const blur = motionValue(0)
const filter = transformValue(() => `blur(${blur.get()}px)`)
  
styleEffect("img", { filter })
```

--------------------------------

### Animate SVG Style Properties with Motion in React

Source: https://motion.dev/docs/react-svg-animation

This example shows how to animate CSS-like style properties, such as `fill`, on an SVG element using Motion's `animate` prop. It transitions the circle's fill color from blue to red.

```jsx
<motion.circle
  style={{ fill: "#00f" }}
  animate={{ fill: "#f00" }}
/>
```

--------------------------------

### Apply Motion Value to SVG Style with svgEffect (JavaScript)

Source: https://motion.dev/docs/svg-effect

This example demonstrates how to use `svgEffect` to bind a `motionValue` to an SVG element's `cx` (center x) coordinate. When `cx` updates, the circle's position will automatically re-render, enabling dynamic positioning.

```javascript
const cx = motionValue(100)

svgEffect("circle", { cx })
```

--------------------------------

### Apply MotionValue to SVG attribute in React

Source: https://motion.dev/docs/react-motion-value

This example demonstrates how to directly bind a motion value, `cx`, to an SVG attribute. When used with a `motion.circle` component, the `cx` attribute will be animated by the motion value, enabling dynamic SVG manipulations.

```jsx
<motion.circle cx={cx} />
```

--------------------------------

### Animate with Custom Easing Functions and Springs using Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Motion extends WAAPI's easing capabilities to support custom easing functions by generating CSS linear() easing definitions. It also integrates spring animations, either by compiling them to linear() easing in `animateStyle` or pre-calculating keyframes in the `animate` function for physics-based movement.

```javascript
animate(
"li",
{ opacity: 1 },
{ ease: mirrorEasing(Math.sin) }
)
```

```javascript
import { animate } from "motion/dom"
import { spring } from "motion"
  
animate(
"li",
{ transform: "translateX(100px)" },
{ type: spring, stiffness: 400 }
)
```

--------------------------------

### Apply Multiple Motion Values to SVG Styles (JavaScript)

Source: https://motion.dev/docs/svg-effect

This example binds multiple `motionValue`s (`stroke` and `strokeWidth`) to their corresponding style properties of an SVG circle element using `svgEffect`. Changes to these motion values will automatically update the circle's appearance.

```javascript
const stroke = motionValue("#00f")
const strokeWidth = motionValue(5)

svgEffect("circle", { strokeWidth, stroke })
```

--------------------------------

### Import useMotionTemplate Hook in React

Source: https://motion.dev/docs/react-use-motion-template

Shows the standard import statement for bringing the `useMotionTemplate` hook into a React component from the `motion/react` library, making it ready for use.

```javascript
import { useMotionTemplate } from "motion/react"
```

--------------------------------

### Control keyframe positions with times option

Source: https://motion.dev/docs/animate

Shows how to adjust the position of each keyframe throughout the animation duration using the times option. Times values range from 0 to 1, representing the start and end of the animation, and must match the number of keyframes.

```javascript
animate(
  element,
  { x: [0, 100, 0] },
  { times: [0, 0.3, 1] }
)
```

--------------------------------

### Specifying Horizontal Scroll Axis with the 'axis' Option

Source: https://motion.dev/docs/scroll

This example illustrates how to configure `scroll()` to monitor horizontal scroll progress by setting the `axis` option to `"x"`. This allows scroll-linked animations or callbacks to respond to left-to-right scrolling.

```javascript
scroll(
  (progress) => console.log(progress),
  { axis: "x" }  
)
```

--------------------------------

### Enable dragSnapToOrigin for Return Animation (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragSnapToOrigin` prop, when set to `true`, makes the draggable element animate back to its initial position when released. This is useful for elements that should temporarily be moved but always return to their starting point. By default, this prop is `false`.

```jsx
<motion.div drag dragSnapToOrigin />
```

--------------------------------

### Create Enter Animations with initial and animate Props in React Motion

Source: https://motion.dev/docs/react-animation

Illustrates how to create an enter animation for a `motion` component by defining an `initial` state and an `animate` target state. When the component first renders, it will animate from the `initial` values to the `animate` values.

```jsx
<motion.li
  initial={{ opacity: 0, scale: 0 }}
  animate={{ opacity: 1, scale: 1 }}
/>
```

--------------------------------

### useTransform Basic Usage with Transform Function

Source: https://motion.dev/docs/react-use-transform

Creates a new motion value using a transform function that combines multiple motion values. The function automatically subscribes to motion values via the get() method and recalculates on each animation frame when dependencies change.

```javascript
import { useTransform } from "motion/react"

const x = useMotionValue(1)
const y = useMotionValue(1)

const z = useTransform(() => x.get() + y.get()) // z.get() === 2
```

--------------------------------

### Update motion value to trigger style re-render (JavaScript)

Source: https://motion.dev/docs/style-effect

This example demonstrates how updates to `motionValue` instances automatically trigger style changes on the bound element. When `opacity.set(1)` or `animate(backgroundColor, ...)` are called, `styleEffect` ensures the element re-renders on the next animation frame.

```javascript
opacity.set(1)
animate(backgroundColor, "rgba(34, 255, 0, 1)")
```

--------------------------------

### useAnimationFrame Hook Basic Usage

Source: https://motion.dev/docs/react-use-animation-frame

Basic example of using useAnimationFrame to rotate a DOM element continuously. The callback receives time parameter representing total elapsed time since the hook was called, which is used to apply CSS transforms.

```javascript
useAnimationFrame((time) => {
  ref.current.style.transform = `rotateY(${time}deg)`
})
```

--------------------------------

### Apply various easing functions to Motion.js stagger

Source: https://motion.dev/docs/stagger

Provides examples of how to customize the timing of staggered animations using different `ease` options within `stagger()`. This includes using cubic bezier arrays, predefined easing function names like 'easeOut', and custom JavaScript functions for fine-grained control over the stagger distribution.

```javascript
stagger(0.1, { ease: [.32, .23, .4, .9] })
```

```javascript
stagger(0.1, { ease: "easeOut" })
```

```javascript
stagger(0.1, { ease: p => Math.sin(p) })
```

--------------------------------

### Exit Animations with useAnimate and usePresence

Source: https://motion.dev/docs/react-use-animate

Demonstrates creating custom exit animations using useAnimate combined with usePresence hook. Handles both enter and exit animation sequences with sequential animations using async/await patterns.

```javascript
import { useAnimate, usePresence } from "framer-motion"

function Component() {
  const [isPresent, safeToRemove] = usePresence()
  const [scope, animate] = useAnimate()
  
  useEffect(() => {
     if (isPresent) {
       const enterAnimation = async () => {
         await animate(scope.current, { opacity: 1 })
         await animate("li", { opacity: 1, x: 0 })
       }
       enterAnimation()

     } else {
       const exitAnimation = async () => {
         await animate("li", { opacity: 0, x: -100 })
         await animate(scope.current, { opacity: 0 })
         safeToRemove()
       }
       
       exitAnimation()
     }
  }, [isPresent])
  
  return (
    <ul ref={scope}>
      <li />
      <li />
      <li />
    </ul>
  )
}
```

--------------------------------

### Tracking Horizontal Scroll with Motion's scroll Function

Source: https://motion.dev/docs/scroll

This example demonstrates how to configure the `scroll()` function to track horizontal scrolling instead of the default vertical axis. By passing an `axis: "x"` option, the callback or animation will respond to horizontal scroll changes.

```javascript
scroll(callback, { axis: "x" })
```

--------------------------------

### useAnimationFrame with Import and Full Component

Source: https://motion.dev/docs/react-use-animation-frame

Complete React component example showing useAnimationFrame import from 'motion/react' and usage with both time and delta parameters. The component applies a rotateY transform to a div element based on animation frame time, demonstrating proper hook integration within a functional component.

```javascript
import { useAnimationFrame } from "motion/react"

function Component() {
  const ref = useRef(null)
  useAnimationFrame((time, delta) => {
    ref.current.style.transform = `rotateY(${time}deg)`
  })

  return <div ref={ref} />
}
```

--------------------------------

### Set Transition on Animation Prop

Source: https://motion.dev/docs/react-transitions

Demonstrates setting a transition directly on an animation prop, such as on whileHover. This approach allows inline configuration of animation behavior when a specific state is triggered.

```jsx
<motion.div
  whileHover={{
    scale: 1.1,
    transition: { duration: 0.2 }
  }}
/>
```

--------------------------------

### Define animation priority ranking in Motion 3

Source: https://motion.dev/docs/react-upgrade-guide

Motion 3 centralizes animation state computation. This JavaScript snippet defines the 'priority' array, specifying the ranking of animation properties. This ranking determines how animations are recomputed when props change or become active/inactive.

```javascript
const priority = ["animate", "while-", "exit"]
```

--------------------------------

### Conditionally Animate React Component based on Reduced Motion

Source: https://motion.dev/docs/react-use-reduced-motion

This example shows how to integrate the `useReducedMotion` hook within a React component (`Sidebar`) to conditionally apply animations. If reduced motion is enabled, the `x` animation is replaced with a static position, while `opacity` remains animated, demonstrating an accessible approach to UI transitions.

```javascript
export function Sidebar({ isOpen }) {
const shouldReduceMotion = useReducedMotion()
const closedX = shouldReduceMotion ? 0 : "-100%"
  

return (
<motion.div animate={{
opacity: isOpen ? 1 : 0,
x: isOpen ? 0 : closedX
}} />
)
}
```

--------------------------------

### Configure drag threshold distance with useDragControls

Source: https://motion.dev/docs/react-use-drag-controls

Set distanceThreshold option in the start method to configure minimum cursor travel distance (in pixels) before drag gesture initializes. Default is 3 pixels. Also affects directionLock axis determination.

```javascript
controls.start(event, { distanceThreshold: 10 })
```

--------------------------------

### Define Custom Transitions for Motion Components in React

Source: https://motion.dev/docs/react-animation

Shows how to customize the animation behavior for a `motion` component by providing a `transition` prop. This example sets a specific easing curve and duration for the `x` property animation, overriding Framer Motion's default transition logic.

```jsx
<motion.div
  animate={{ x: 100 }}
  transition={{ ease: "easeOut", duration: 2 }}
/>
```

--------------------------------

### Implement Manual Drag Control with useDragControls Hook

Source: https://motion.dev/docs/react-drag

Demonstrates how to use the useDragControls hook to manually initiate drag gestures from a separate element (scrubber track) controlling a draggable element (scrubber handle). The hook returns dragControls that are passed to the motion.div, and the start() method is called from a pointer event handler on the track element with snapToCursor option enabled to snap the handle to the cursor position.

```jsx
import { motion, useDragControls } from "motion/react"

export function Scrubber() {
  const dragControls = useDragControls()

  function startDrag(event) {
    // Start the drag gesture imperatively
    dragControls.start(event, { snapToCursor: true })
  }

  return (
    <>
      <div onPointerDown={startDrag} className="scrubber-track" />
      <motion.div
        drag="x"
        dragControls={dragControls}
        dragListener={false}
        className="scrubber-handle"
      />
    </>
  )
}
```

--------------------------------

### Initialize springValue with Number or Unit String (JavaScript)

Source: https://motion.dev/docs/spring-value

Illustrates how to import `springValue` from the "motion" library and initialize it with either a numerical value or a string representing a value with a unit, setting its initial state.

```javascript
import { springValue } from "motion"

const scaleX = springValue(0)
const rotate = springValue("1turn")
```

--------------------------------

### Group Layout Animations with `LayoutGroup` in Framer Motion 5 (React/JavaScript)

Source: https://motion.dev/docs/react-upgrade-guide

Framer Motion 5 introduces `LayoutGroup` to efficiently group components whose layout changes affect each other, replacing `AnimateSharedLayout`. This component ensures that layout measurements are batched when one child component re-renders, preventing unnecessary forced re-renders of other grouped components. Utilize the `layout` prop on `motion` components within the `LayoutGroup` to enable layout animations.

```javascript
import { LayoutGroup, motion } from "framer-motion"

export function App() {
  return (
    <LayoutGroup>
      <Submenu />
      <Submenu />
    </LayoutGroup>
  )
}

function Submenu({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <motion.ul
      layout
      style={{ height: isOpen ? "auto" : 40 }}
    >
      {children}
    </motion.ul>
  )
}
```

--------------------------------

### Canceling a Scroll-Linked Animation in Motion

Source: https://motion.dev/docs/scroll

This example shows how `scroll()` returns a cleanup function that can be called to stop or cancel the scroll-linked animation or callback. This is essential for managing resources and preventing memory leaks when the animation is no longer needed.

```javascript
const cancel = scroll(callback)

cancel()
```

--------------------------------

### Create a Spring Generator with Keyframes (JavaScript)

Source: https://motion.dev/docs/spring

Illustrates how to instantiate a spring generator by calling `spring()` with an array of two numerical `keyframes`. The `spring` function returns a generator object, which can then be used to sample the spring's state over time.

```javascript
const generator = spring({ keyframes: [0, 100] })
```

--------------------------------

### React: Calculate acceleration using chained useVelocity

Source: https://motion.dev/docs/react-use-velocity

This example illustrates how `useVelocity` can be chained to derive higher-order derivatives like acceleration. By passing the velocity motion value (derived from `x`) to another `useVelocity` call, you can track the rate of change of velocity, which represents acceleration.

```javascript
const x = useMotionValue(0)
const xVelocity = useVelocity(x)
const xAcceleration = useVelocity(xVelocity)
```

--------------------------------

### Define Minimum Constraint for Inertia Animation Bouncing in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `min` property establishes a lower boundary for Framer Motion inertia animations, especially when used with `dragTransition`. If the animated value reaches or starts below this constraint, it will 'bump' or spring towards this minimum value.

```jsx
<motion.div
  drag
  dragTransition={{ min: 0, max: 100 }}
/>
```

--------------------------------

### Apply CSS Transforms to HTML Elements with Motion in React

Source: https://motion.dev/docs/react-svg-animation

This example shows how Motion applies CSS transforms, such as `rotate`, to standard HTML elements (`motion.div`). The rotation occurs around the element's center point, as expected for CSS transforms.

```jsx
<motion.div style={{ rotate: 90 }} />
```

--------------------------------

### Gesture Animation Props with Inline Targets

Source: https://motion.dev/docs/react-gestures

Define gesture animation targets directly using inline values. The whileHover and whileTap props animate the component to specified values when the respective gesture is active. This example scales the button to 1.2 on hover and 0.9 on tap with a 1-second transition.

```jsx
<motion.button
  whileHover={{
    scale: 1.2,
    transition: { duration: 1 },
  }}
  whileTap={{ scale: 0.9 }}
/>
```

--------------------------------

### AnimateActivity with Layout Mode Pop

Source: https://motion.dev/docs/react-animate-activity

This example shows how to configure `AnimateActivity` to immediately remove exiting children from the document flow using `layoutMode="pop"`. This allows surrounding elements to reflow without waiting for the exit animation to complete, preventing layout shifts.

```jsx
<AnimateActivity
  mode={isVisible ? "visible" : "hidden"}
  layoutMode="pop"
/>
```

--------------------------------

### React: Listen to motion value velocity changes

Source: https://motion.dev/docs/react-use-velocity

This React component demonstrates how to use `useVelocity` to track the velocity of a motion value and `useMotionValueEvent` to listen for and log changes to that velocity. This setup provides real-time feedback on the motion's dynamics, useful for debugging or triggering effects based on speed.

```jsx
import { useMotionValue, useVelocity, useMotionValueEvent } from "framer-motion"
  
function Component() {
  const x = useMotionValue(0)
  const xVelocity = useVelocity(x)
  
  useMotionValueEvent(xVelocity, "change", latest => {
    console.log("Velocity", latest)
  })
  return <motion.div style={{ x }} />
}
```

--------------------------------

### Enforce Strict Mode for LazyMotion in React

Source: https://motion.dev/docs/react-lazy-motion

This example illustrates the use of the `strict` prop with `LazyMotion`. When `strict` is set to `true`, `LazyMotion` will throw an error if a full `motion` component is used within it, thereby preventing the loss of bundle size benefits intended by lazy-loading.

```jsx
// This component will throw an error that explains using a motion component
// instead of the m component will break the benefits of code-splitting.
function Component() {
  return (
    <LazyMotion features={domAnimation} strict>
      <motion.div />
    </LazyMotion>
  )
}
```

--------------------------------

### Configure initial velocity for spring animations

Source: https://motion.dev/docs/animate

Shows how to set the initial velocity parameter for spring animations. The velocity is used to determine how the spring begins its motion, with a default value of the current value velocity.

```javascript
animate(
  ".my-element",
  { rotate: 180 },
  { type: "spring", velocity: 2 }
)
```

--------------------------------

### Check Reduced Motion Preference in React Component

Source: https://motion.dev/docs/react-use-reduced-motion

This example demonstrates calling the `useReducedMotion` hook within a React component. The returned boolean value, `prefersReducedMotion`, indicates whether the user's device has the Reduced Motion setting active, allowing for conditional logic to enhance accessibility.

```javascript
const prefersReducedMotion = useReducedMotion()
```

--------------------------------

### Animate Motion for React Component with React State and Inline Variants

Source: https://motion.dev/docs/react-animation

This example demonstrates how to connect a `motion.div`'s animation to a React state variable. The `animate` prop directly receives the state value, and inline `variants` are defined to map state values to animation targets, including for nested `motion.svg` components.

```jsx
const [status, setStatus] = useState<"inactive" | "active" | "complete">(
  "inactive"
);

<motion.div
  animate={status} // pass in our React state!
  variants={{
    inactive: { scale: 0.9, color: "var(--gray-500)" },
    active: { scale: 1, color: "var(--blue-500)" },
    complete: { scale: 1, color: "var(--blue-500)" }
  }}
>
  <motion.svg
    path={checkmarkPath}
    variants={{
      inactive: { pathLength: 0 },
      active: { pathLength: 0 },
      complete: { pathLength: 1}
    }}
  />
</motion.div>
```

--------------------------------

### Use null for Current Value in Keyframe Animations with React Motion

Source: https://motion.dev/docs/react-animation

Illustrates the use of `null` as a wildcard keyframe at the start of an animation array. This tells Framer Motion to begin the animation from the property's current value, providing smoother transitions when an animation interrupts another.

```jsx
<motion.div animate={{ x: [null, 100, 0] }} />
```

--------------------------------

### Importing AnimatePresence and Motion hooks in React

Source: https://motion.dev/docs/react-animate-presence

Shows how to import the `AnimatePresence` component and various related hooks (`useIsPresent`, `usePresenceData`, `usePresence`) from the `motion/react` library, which are essential for implementing exit animations and managing component presence.

```jsx
import { AnimatePresence } from "motion/react"
import { useIsPresent, usePresenceData, usePresence } from "motion/react"
```

--------------------------------

### Partial Keyframes with WAAPI

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Demonstrates WAAPI's keyframe syntax requiring two or more keyframes in legacy versions. The browser infers the initial keyframe from the element's current visual state when using single keyframe syntax.

```javascript
element.animate({ opacity: [0.2, 1] })
```

```javascript
element.animate({ opacity: 1 })
```

--------------------------------

### Import usePageInView from Motion React

Source: https://motion.dev/docs/react-use-page-in-view

Import the usePageInView hook from the motion/react package to access the page visibility tracking functionality.

```javascript
import { usePageInView } from "motion/react"
```

--------------------------------

### Listen to Drag Events and Get Pointer Info (React)

Source: https://motion.dev/docs/react-drag

Attach event listeners like `onDragStart`, `onDrag`, and `onDragEnd` to a draggable `motion` component to respond to the lifecycle of drag gestures. The callback receives the original `PointerEvent` and an `info` object with valuable data about the gesture's state, including `point`, `delta`, `offset`, and `velocity`.

```jsx
function onDrag(event, info) {
  console.log(info.point.x, info.point.y)
}

<motion.div drag onDrag={onDrag} />
```

--------------------------------

### Motion Studio Declarative Spring Configuration

Source: https://motion.dev/docs/studio-generate-css

This JSON object demonstrates how a spring animation is declaratively defined within Motion Studio. It uses a simple, readable structure to specify the animation type and its bounce property, offering a high-level abstraction compared to the complexity of direct `linear()` CSS.

```JSON
{ "type": "spring", "bounce": 0.2 }
```

--------------------------------

### Animate Component State While Dragging (React)

Source: https://motion.dev/docs/react-drag

Utilize the `whileDrag` prop to apply visual feedback, such as scaling or adding a shadow, to a `motion` component while it's being dragged. The component animates to this state when dragging starts and reverts when it ends, creating effects like a 'lift'.

```jsx
<motion.div
  drag
  whileDrag={{
    scale: 1.1,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.2)"
  }}
/>
```

--------------------------------

### Import styleEffect from Motion library (JavaScript)

Source: https://motion.dev/docs/style-effect

This snippet shows the standard JavaScript syntax for importing the `styleEffect` function. It retrieves `styleEffect` from the `motion` library, making it available for use in the current module.

```javascript
import { styleEffect } from "motion"
```

--------------------------------

### Animate SVG Element x-Attribute with Motion attrX Shorthand in React

Source: https://motion.dev/docs/react-svg-animation

This example uses Motion's `attrX` prop to animate the `x` attribute of an SVG element, rather than applying a CSS transform. This is useful when the SVG element itself uses `x` as a direct attribute.

```jsx
<motion.rect attrX={0} animate={{ attrX: 100 }} />
```

--------------------------------

### Track Progress of a Target Element within a Container

Source: https://motion.dev/docs/react-use-scroll

This example illustrates tracking the scroll progress of a specific `target` element as it moves within its scrollable `container`. By passing a `ref` to the `target` option, `useScroll` provides `scrollYProgress` reflecting the target's visibility and position relative to the container, with optional `offset` for fine-grained control.

```jsx
const ref = useRef(null)
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end end"]
})

return <div ref={ref}>
```

```jsx
const targetRef = useRef(null)
const { scrollYProgress } = useScroll({ target: targetRef })
```

--------------------------------

### Define Initial Velocity for Spring Animations in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `velocity` property specifies the initial speed of a Framer Motion spring animation. If left undefined, it defaults to the current value's velocity, providing a seamless continuation. This property is crucial for controlling the animation's starting momentum.

```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', velocity: 2 }}
/>
```

--------------------------------

### Detailed CSS linear() Spring Easing Function

Source: https://motion.dev/docs/studio-generate-css

This comprehensive CSS `linear()` function provides a complete definition for a complex spring easing curve. It's an example of the highly detailed output generated by Motion Studio, showcasing the numerous control points required to achieve specific spring and bounce effects directly in CSS.

```CSS
linear(
0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017,
1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%,
1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%,
0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1
)
```

--------------------------------

### Apply motion values to object properties with propEffect

Source: https://motion.dev/docs/prop-effect

Demonstrates basic usage of propEffect to link motion values to object properties. When the motion value updates via set() or animate(), the target object property automatically updates on each animation frame.

```javascript
const pos = { x: 0, y: 0, z: 0 }
const x = motionValue(0)

propEffect(pos, { x })

// Set x on pos to 100
x.set(100)

// Animate x on pos to 200
animate(x, 200)
```

--------------------------------

### Customize dragTransition for Release Animation (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragTransition` prop allows customization of the inertia animation that occurs when a draggable element is released, based on its drag velocity. By default, it uses a type 'inertia' animation. This example customizes the `bounceStiffness` and `bounceDamping` to control the spring-like effect of the release animation.

```jsx
<motion.div
  drag
  dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
/>
```

--------------------------------

### Import spring function from Motion

Source: https://motion.dev/docs/css

Import the spring() function from the Motion library to generate CSS spring animations. This is the primary entry point for using Motion's spring generation capabilities.

```javascript
import { spring } from "motion"
```

--------------------------------

### Motion Scroll-Linked Animations with scroll() Function

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Shows Motion's scroll-linked animation approach using the scroll() function which leverages the Scroll Timeline API for hardware acceleration and scroll progress measurement without polling.

```javascript
const animation = animate(element, { x: 500 })
scroll(animation, { target: element })
```

--------------------------------

### Control Shared Layout Animation Transitions Based on Direction

Source: https://motion.dev/docs/react-layout-animations

This example illustrates how Motion determines which transition to use during shared layout animations. The transition defined on the element being animated *to* (e.g., the modal when opening) is applied for its entry, and the transition on the element animating *from* (e.g., the button when closing) is used for its exit, allowing for distinct open/close animations.

```jsx
<>
  <motion.button
    layoutId="modal"
    onClick={() => setIsOpen(true)}
    // This transition will be used when the modal closes
    transition={{ type: "spring" }}
  >
    Open
  </motion.button>
  <AnimatePresence>
    {isOn && (
      <motion.dialog
        layoutId="modal"
        // This transition will be used when the modal opens
        transition={{ duration: 0.3 }}
      />
    )}
  </AnimatePresence>
</>
```

--------------------------------

### Share animation state between 2D and 3D components

Source: https://motion.dev/docs/react-three-fiber

This example shows how to bridge state between a 2D React DOM component using `framer-motion` and a 3D React Three Fiber component using `framer-motion-3d`. It uses a shared `isHovered` state to trigger synchronized animations across both environments, demonstrating how to control 3D animations based on 2D interactions.

```jsx
// index.js
import { motion } from "framer-motion"
import { Scene } from "./scene"

export function App() {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      whileHover={{ scale: 1.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(true)}
    >
      <Scene isHovered={isHovered} />
    </motion.div>
  )
}
```

```jsx
// scene.js
import { Canvas } from "@react-three/fiber"
import { motion } from "framer-motion-3d"

export function Scene({ isHovered }) {
  return (
    <Canvas>
      <motion.group animate={isHovered ? "hover" : "rest"}>
        <motion.mesh variants={{ hover: { z: 1 } }} />
      </motion.group>
    </Canvas>
  )
}
```

--------------------------------

### Configure global animation options with Motion animate

Source: https://motion.dev/docs/animate

Shows how to apply animation options globally to all animated properties. Options like duration affect every value being animated unless overridden with named transitions for specific properties.

```javascript
animate(
  element,
  { x: 100, rotate: 0 },
  { duration: 1 }
)
```

--------------------------------

### Create and Animate springValue with Numbers and Strings (JavaScript)

Source: https://motion.dev/docs/spring-value

Demonstrates initializing `springValue` with a number or a string percentage, and then animating these values using the `.set()` method. The animated values are applied to a `div` element via `styleEffect` to visually update its position.

```javascript
const x = springValue(0)
const y = springValue("100%")

// These will go to their new target with a spring animation
x.set(100)
y.set("0%")

styleEffect("div", { x, y })
```

--------------------------------

### Define custom transform order with Framer Motion `transformTemplate` (values)

Source: https://motion.dev/docs/react-motion-component

The `transformTemplate` prop allows customizing the order and composition of CSS transforms applied by Framer Motion. This example demonstrates using the `x` and `rotate` values from the `style` prop to build a custom transform string, overriding the default `translate`, `scale`, `rotate`, `skew` order.

```jsx
// Use the latest transform values
<motion.div
  style={{ x: 0, rotate: 180 }}
  transformTemplate={
    ({ x, rotate }) => `rotate(${rotate}deg) translateX(${x}px)`
  }
/>
```

--------------------------------

### Respond to size changes with Motion frameloop

Source: https://motion.dev/docs/resize

Perform DOM updates in response to element size changes using the Motion frameloop to ensure efficient batching of DOM reads and writes, preventing layout thrashing.

```javascript
resize(".drawer", (element, { width, height }) => {
  frame.render(() => {
    element.style.height = Math.max(400, height)
  })
})
```

--------------------------------

### Layout Animation Callbacks

Source: https://motion.dev/docs/react-motion-component

Lifecycle callbacks for layout animation events. Use onLayoutAnimationStart and onLayoutAnimationComplete to run code at specific animation phases.

```APIDOC
## Layout Animation Callbacks

### Description
Callbacks to run at specific phases of layout animations.

### onLayoutAnimationStart
- **Type:** Function
- **Required:** No
- **Description:** A callback to run when a layout animation starts.

### onLayoutAnimationComplete
- **Type:** Function
- **Required:** No
- **Description:** A callback to run when a layout animation completes.

### Usage Example
```jsx
<motion.div
  layout
  onLayoutAnimationStart={() => console.log('Animation started')}
  onLayoutAnimationComplete={() => console.log('Animation complete')}
/>
```
```

--------------------------------

### Fix `borderRadius` and `boxShadow` distortion in Motion 2 layout animations

Source: https://motion.dev/docs/react-upgrade-guide

Framer Motion 2 fixes distortion issues with `borderRadius` and `boxShadow` during layout animations, which affected Motion 1. By applying the `layout` prop and animating these properties (e.g., via `initial`), they will render correctly during size changes.

```jsx
<motion.div layout initial={{ borderRadius: 20 }} />
```

--------------------------------

### React Motion: Custom Scroll Container for whileInView

Source: https://motion.dev/docs/react-scroll-animations

This snippet illustrates how to define a custom scrollable element as the viewport for `whileInView` animations, instead of the default window. It uses a `useRef` hook to target a specific `div` with `overflow: "scroll"` and passes this reference to the `viewport={{ root: scrollRef }}` prop of the `motion.div`.

```jsx
function Component() {
  const scrollRef = useRef(null)
  
  return (
    <div ref={scrollRef} style={{ overflow: "scroll" }}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ root: scrollRef }}
      />
    </div>
  )
}
```

--------------------------------

### Apply multiple motion values to object properties

Source: https://motion.dev/docs/prop-effect

Demonstrates applying a motion value to an object property. Multiple motion values can be provided in the mapping object to synchronize different properties.

```javascript
const data = { opacity: 0, x: 100 }
const opacity = motionValue(0)

propEffect(data, { opacity })

opacity.set(1)
```

--------------------------------

### GSAP Scroll-Linked Animations with ScrollTrigger

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Demonstrates GSAP's scroll-linked animations using the scrub option, where animations are driven by scroll progress rather than time. This creates animations that respond in real-time to viewport scrolling.

```javascript
gsap.to('.box', {
    scrollTrigger: {
      trigger: '.box',
      scrub: true
    },
    x: 500
})
```

--------------------------------

### React Motion: Transform Scroll Progress to Color with useTransform

Source: https://motion.dev/docs/react-scroll-animations

This snippet illustrates how to transform a scroll progress motion value into other arbitrary values, such as colors, using the `useTransform` hook. As `scrollYProgress` interpolates from 0 to 1, the `backgroundColor` of the `motion.div` smoothly transitions between red, green, and blue.

```jsx
const backgroundColor = useTransform(
  scrollYProgress,
  [0, 0.5, 1],
  ["#f00", "#0f0", "#00f"]
)

return <motion.div style={{ backgroundColor }} />
```

--------------------------------

### Correct child component distortion during parent layout animations in Motion 2

Source: https://motion.dev/docs/react-upgrade-guide

When a parent component with `layout` resizes, its children might distort. To prevent this, apply the `layout` prop to immediate child components as well. This ensures children scale correctly and smoothly within a resizing parent.

```jsx
<motion.div layout>
  <motion.div layout />
</motion.div>
```

--------------------------------

### Initialize a MotionValue with `useMotionValue` in React

Source: https://motion.dev/docs/react-motion-value

This snippet demonstrates the basic initialization of a motion value using the `useMotionValue` hook from `motion/react`. It sets the initial state of the `x` motion value to `0`, which can then be used to control animated properties of UI elements.

```javascript
import { useMotionValue } from "motion/react"

const x = useMotionValue(0)
```

--------------------------------

### Animate Full Transform String with WAAPI

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Shows WAAPI's approach to animating transforms by requiring the full transform string since CSS doesn't offer separate styles for x, scaleX, and similar properties.

```javascript
element.animate({ transform: "translateX(50px) scaleX(2)" })
```

--------------------------------

### Combine generated and custom transforms with `transformTemplate`

Source: https://motion.dev/docs/react-motion-component

This `transformTemplate` example shows how to combine Framer Motion's internally generated transform string with custom transformations. The function receives both the `latest` transform values and the `generated` transform string, enabling developers to prepend or append additional CSS transforms like `translate(-50%, -50%)`.

```jsx
// Or the generated transform string
<motion.div
  style={{ x: 0, rotate: 180 }}
  transformTemplate={
    (latest, generated) => `translate(-50%, -50%) ${generated}`
  }
/>
```

--------------------------------

### Disable Parallax Animation based on Framer `useReducedMotion` Hook in React

Source: https://motion.dev/docs/react-accessibility

Conditionally disable parallax scroll effects in a React component using the `useReducedMotion` hook. This example shows how to apply a `y` transform only when reduced motion is not enabled, preventing potentially disorienting effects for sensitive users.

```jsx
function Parallax() {
  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()

  const y = useTransform(scrollY, [0, 1], [0, -0.2], {
    clamp: false,
  })

  return (
    <motion.div style={{ y: shouldReduceMotion ? 0 : y }} />
  )
}
```

--------------------------------

### React: Transform scale based on motion value velocity

Source: https://motion.dev/docs/react-use-velocity

This example demonstrates how to use `useVelocity` in React to derive a velocity motion value from an existing motion value. It then uses `useTransform` to map this velocity to a scale property, allowing for dynamic visual feedback during drag interactions, with clamping disabled for more expressive motion.

```jsx
const x = useMotionValue(0)
const xVelocity = useVelocity(x)
const scale = useTransform(
  xVelocity,
  [-3000, 0, 3000],
  [2, 1, 2],
  { clamp: false }
)
  
return <motion.div drag="x" style={{ x, scale }} />
```

--------------------------------

### MotionValue velocity calculation in Framer Motion 11.0

Source: https://motion.dev/docs/react-upgrade-guide

Demonstrates the breaking change in velocity calculations for MotionValue in Framer Motion 11.0. Multiple synchronous value updates within the same animation frame are no longer considered when calculating velocity. The velocity is now calculated between the latest value and the value at the end of the previous frame.

```javascript
// Previous behavior (versions < 11.0)
const x = motionValue(0)

requestAnimationFrame(() => {
  x.set(100)
  x.getVelocity() // Velocity of 0 -> 100
  x.set(200)
  x.getVelocity() // Velocity of 100 -> 200
})
```

```javascript
// New behavior (version 11.0+)
const x = motionValue(0)

requestAnimationFrame(() => {
  x.set(100)
  x.getVelocity() // Velocity of 0 -> 100
  x.set(200)
  x.getVelocity() // Velocity of 0 -> 200
})
```

--------------------------------

### Incorrect Conditional Rendering of AnimatePresence for Exit Animations (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

Placing `AnimatePresence` conditionally, such that it unmounts when its child should exit, prevents it from controlling the exit animation. If `AnimatePresence` itself is removed from the DOM, it cannot detect the child's removal and trigger the exit animation. This example shows an anti-pattern where the conditional rendering prevents exit animations.

```jsx
isVisible && (
  <AnimatePresence>
    <Component />
  </AnimatePresence>
)
```

--------------------------------

### Configuring Spring Transition Options in useSpring Hook

Source: https://motion.dev/docs/react-use-spring

Explains how to customize the spring animation's behavior by passing a configuration object to `useSpring`. This allows defining properties like `stiffness` for precise control over the animation.

```javascript
useSpring(0, { stiffness: 300 })
```

--------------------------------

### Animate with spring animation type using Motion mini

Source: https://motion.dev/docs/animate

Shows how to use spring animation type with the Motion mini library. Spring animations accept physics parameters like stiffness to control the animation behavior and incorporate velocity from existing gestures.

```javascript
import { animate } from "motion/mini"
import { spring } from "motion"

animate(
  element,
  { transform: "translateX(100px)" },
  { type: spring, stiffness: 300 }
)
```

--------------------------------

### Apply dragConstraints with Object Values (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragConstraints` prop in Framer Motion restricts the draggable area of a `motion.div` component. When set as an object, it defines fixed boundaries using pixel values for `left`, `right`, `top`, and `bottom`. This example limits horizontal dragging between 0 and 300 pixels.

```jsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 300 }}
/>
```

--------------------------------

### Handle Hover End Event with PointerEvent in Motion's hover

Source: https://motion.dev/docs/hover

When the hover start callback returns another function, that function serves as the hover end handler. This snippet demonstrates that this end handler also receives the `PointerEvent` object, allowing for specific actions or logging based on the event details when the hover concludes.

```javascript
hover("a", () => {
  console.log("hover start")
  
  return (endEvent) => {
    console.log("hover end")
  }
})
```

--------------------------------

### React Tab and TabRow Components with Shared LayoutId

Source: https://motion.dev/docs/react-layout-group

Shows React components `Tab` and `TabRow` where `Tab` uses a shared `layoutId="underline"` for a `motion.div`. This setup enables a shared element animation between tabs when selection changes. This snippet assumes the `LayoutGroup` is not yet applied, demonstrating the global nature of `layoutId` without grouping.

```jsx
function Tab({ label, isSelected }) {
  return (
    <li>
      {label}
      {isSelected
        ? <motion.div layoutId="underline" />
        : null}
    </li>  
  )
}

function TabRow({ items }) {
  return items.map(item => <Tab {...item} />)
}
```

--------------------------------

### Monitor specific element size changes

Source: https://motion.dev/docs/resize

Track size changes on specific DOM elements by passing a CSS selector or element reference and a callback. The callback receives the element and an object containing width and height getters representing the element's border box.

```javascript
resize("li", (element) => console.log(element, "change detected"))

resize(".drawer", (element, { width, height }) => {
  console.log(element, " is now ", width, height)
})
```

--------------------------------

### Import frame from Motion JavaScript

Source: https://motion.dev/docs/frame

Import the `frame` function from the Motion library to access the animation loop scheduling API.

```javascript
import { frame } from "motion"
```

--------------------------------

### Import hover Function from Motion Library

Source: https://motion.dev/docs/hover

This snippet shows the standard way to import the `hover` function into a JavaScript project. It uses ES module syntax to bring the function directly from the 'motion' package, making it available for use in your code.

```javascript
import { hover } from "motion"
```

--------------------------------

### Scope `layoutId`s using `LayoutGroup` ID in Framer Motion 5 (React/JavaScript)

Source: https://motion.dev/docs/react-upgrade-guide

To manage and isolate shared layout animations, Framer Motion 5 allows namespacing `layoutId`s by providing a unique `id` prop to `LayoutGroup` instances. This feature enables localized shared layout animations, replicating the scoping behavior previously provided by `AnimateSharedLayout` but with improved performance. It prevents unintended animations between components that share the same `layoutId` but belong to different logical groups.

```javascript
/**
 * These layoutIds are now namespaced with
 * the id provided to LayoutGroup.
 */
<>
  <LayoutGroup id="a">
    {isVisible ? <motion.div layoutId="modal" /> : null}
  </LayoutGroup>
  <LayoutGroup id="b">
   {isVisible ? <motion.div layoutId="modal" /> : null}
  </LayoutGroup>
</>
```

--------------------------------

### Animate Border Radius vs. Clip Path for Performance

Source: https://motion.dev/docs/performance

This snippet illustrates the difference between animating `borderRadius`, which can trigger expensive paint operations, and animating `clipPath` with the `inset` function. Animating `clipPath` can leverage compositor acceleration, offering better performance.

```javascript
// ❌
animate(element, { borderRadius: "50px" })

// ✅
animate(element, { clipPath: "inset(0 round 50px)" })
```

--------------------------------

### Apply easing functions to keyframe animations

Source: https://motion.dev/docs/animate

Demonstrates how to apply different easing functions between keyframes in an animation. When animating multiple keyframes, an array of easing functions can be used to set different easings between each value transition.

```javascript
animate(
  element,
  { x: [0, 100, 0] },
  { ease: ["easeIn", "easeOut"] }
)
```

--------------------------------

### inView with multiple input types

Source: https://motion.dev/docs/inview

The inView function accepts a selector string, a single Element, or an array of Elements as the first argument. Demonstrates all three usage patterns.

```javascript
// Selector
inView("section", callback)

// Element
const box = document.getElementById("box")
inView(box, callback)
```

--------------------------------

### Enable dragDirectionLock for Axis-Specific Dragging (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragDirectionLock` prop, when `true`, locks the drag gesture to the axis (x or y) that shows the most movement when the drag initially begins. This means if the user primarily moves the element horizontally at the start, it will only be draggable along the x-axis for the remainder of that gesture, preventing diagonal movement. It is `false` by default.

```jsx
<motion.div drag dragDirectionLock />
```

--------------------------------

### Basic Motion component usage with animation props

Source: https://motion.dev/docs/react-motion-component

Create a motion.div component with animation capabilities using props like animate for target animation state, whileInView for viewport-triggered animations, layout for layout change animations, and style for independent transforms. This demonstrates the core declarative animation API.

```javascript
<motion.div
  className="box"
  animate={{ scale: 2 }}
  whileInView={{ opacity: 1 }}
  layout
  style={{ x: 100 }}
/>
```

--------------------------------

### Basic animate() usage with HTML elements and CSS selectors

Source: https://motion.dev/docs/animate

Demonstrates importing and using the animate() function to animate HTML/SVG elements by direct reference or CSS selector. Both mini and hybrid versions support this basic functionality with configurable duration options.

```JavaScript
// Hybrid
import { animate } from "motion"

// Mini
import { animate } from "motion/mini"

// Element(s)
const box = document.getElementById("box")
animate(box, { opacity: 0 }, { duration: 0.5 })

// CSS selectors
animate("div", { opacity: 0 }, { duration: 0.5 })
```

--------------------------------

### React Motion: Detect Scroll Direction with useScroll and useMotionValueEvent

Source: https://motion.dev/docs/react-scroll-animations

This snippet shows how to detect and respond to the user's scroll direction using Motion's `useScroll` and `useMotionValueEvent` hooks. It listens for changes in `scrollY` and compares the current scroll position to the previous one to determine if the user is scrolling 'down' or 'up', updating a React state variable accordingly.

```jsx
const { scrollY } = useScroll()
const [scrollDirection, setScrollDirection] = useState("down")

useMotionValueEvent(scrollY, "change", (current) => {
  const diff = current - scrollY.getPrevious()
  setScrollDirection(diff > 0 ? "down" : "up")
})
```

--------------------------------

### Incorrectly Using Index as Key in AnimatePresence for List Items (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

Using the `index` of an array item as a `key` prop within `AnimatePresence` can lead to incorrect exit animations, especially if the list items reorder. When items reorder, the `index` no longer uniquely identifies a specific component, causing `AnimatePresence` to lose track of which component is exiting or entering. This example demonstrates an anti-pattern for assigning `key` props.

```jsx
<AnimatePresence>
  {items.map((item, index) => (
    <Component key={index} />
  ))}
</AnimatePresence>
```

--------------------------------

### Basic inView with selector and callback

Source: https://motion.dev/docs/inview

Detect when elements matching a selector enter the viewport and execute a callback function. The callback fires once by default when the element first enters the viewport.

```javascript
inView("#carousel li", (element) => {
  animate(element, { opacity: 1 })
})
```

--------------------------------

### Handle Motion Animation Completion with then() (JavaScript)

Source: https://motion.dev/docs/animate

The `then()` method provides a Promise-like API to execute a callback function once a Motion animation finishes. It supports both Promise syntax and `async/await` for handling animation completion. Note that a new Promise is created when an animation finishes, and replaying the animation will not refire old callbacks.

```javascript
const animation = animate(element, { opacity: 0 })

// Async/await
await animation
console.log("Animation complete")

// Promise
animation.then(() => {
  console.log("Animation complete")
})
```

--------------------------------

### Pass Custom Data to Exit Animations with AnimatePresence custom Prop (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

The `custom` prop in `AnimatePresence` enables dynamic exit animations by allowing you to pass a value that can be accessed by dynamic variants. This is useful when the component is removed from the React tree, preventing direct prop updates for its exit animation. The passed `custom` data can be used to influence the exit animation's behavior, for example, changing direction based on user interaction.

```jsx
const variants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction === 1 ? -300 : 300
  }),
  visible: { opacity: 1, x: 0 }
}

export const Slideshow = ({ image, direction }) => (
  <AnimatePresence custom={direction}>
    <motion.img
      key={image.src}
      src={image.src}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    />
  </AnimatePresence>
)
```

--------------------------------

### Monitor viewport size changes

Source: https://motion.dev/docs/resize

Detect changes to the viewport dimensions by passing a callback function to resize. The callback receives an object with width and height getters that return current viewport dimensions.

```javascript
resize(() => console.log("viewport change detected"))

resize(({ width, height }) => console.log(width, height))
```

--------------------------------

### Conditionally Render Base UI Portal with AnimatePresence and keepMounted

Source: https://motion.dev/docs/base-ui

Explains how to conditionally render a Base UI `Portal` component with `AnimatePresence` for components that control their own rendering, such as `ContextMenu`. The `Portal` requires the `keepMounted` prop to ensure elements remain in the DOM for exit animations.

```javascript
return (
   <ContextMenu.Root open={open} onOpenChange={setOpen}>
    <ContextMenu.Trigger>Open menu</ContextMenu.Trigger>
    <AnimatePresence>
      {open && (
        <ContextMenu.Portal keepMounted>

```

--------------------------------

### Implement hover and tap gestures on a 3D mesh

Source: https://motion.dev/docs/react-three-fiber

This code snippet demonstrates how to add interactive gestures like `whileHover`, `whileTap`, `onHoverStart`, and `onTap` to a `motion.mesh` component. These props allow 3D objects to react to user interactions such as hovering and clicking.

```jsx
<motion.mesh
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  onHoverStart={() => console.log('hover start')}
  onTap={() => console.log('tapped!')}
/>
```

--------------------------------

### scroll() - Basic Usage

Source: https://motion.dev/docs/scroll

Import and use the scroll() function to create scroll-linked animations. The function accepts a callback that receives progress values between 0 and 1 as the user scrolls.

```APIDOC
## scroll()

### Description
Creates scroll-linked animations where a value is bound directly to scroll progress. When scroll changes, the value changes by the relative amount. Utilizes Motion's hybrid engine with ScrollTimeline API for optimal hardware-accelerated performance where supported.

### Method
Function

### Signature
```
scroll(callback | animation, options?): () => void
```

### Parameters
#### Callback Function
- **callback** (function) - Required - Function called on scroll changes with progress value (0-1)

#### Animation Object
- **animation** (Animation) - Required - Animation created with animate() function

#### Options Object
- **container** (Element | Window) - Optional - Scroller element or window to track. Default: `window`
- **axis** ("x" | "y") - Optional - Scroll axis to track. Default: `"y"`
- **target** (Element) - Optional - Element to track progress of within container. Default: scrollable area of container
- **offset** (Array<string>) - Optional - Intersection points to track. Default: `["start start", "end end"]`

### Request Example
```javascript
import { scroll } from "motion"

// Callback with progress
scroll(progress => console.log(progress))

// Animation
const animation = animate(
  "div",
  { transform: ["none", "rotate(90deg)"] },
  { ease: "linear" }
)
scroll(animation)

// With options
scroll(callback, { axis: "x", container: document.getElementById("scroller") })
```

### Response
#### Return Value
- **cleanup** (function) - Function to cancel the scroll animation

#### Response Example
```javascript
const cancel = scroll(callback)
cancel() // Cancels scroll animation
```
```

--------------------------------

### Import Motion component from React

Source: https://motion.dev/docs/react-motion-component

Import the motion component from the Motion library for client-side React applications or from motion/react-client for server components in Next.js. This is the first step to using Motion animations in your React project.

```javascript
import { motion } from "motion/react"
```

```javascript
import * as motion from "motion/react-client"
```

--------------------------------

### Import a Specific Easing Function from Motion

Source: https://motion.dev/docs/easing-functions

Illustrates importing a specific easing function, such as `easeIn`, directly from the 'motion' library. This allows for standalone use of the easing function in custom animation logic or with the tiny `animate` function from `motion/dom`.

```JavaScript
import { easeIn } from "motion"
```

--------------------------------

### Integrate Motion Components with Radix UI using asChild

Source: https://motion.dev/docs/radix

This snippet shows how to pass a `motion` component as a child to a Radix component by setting the `asChild` prop to `true`. This allows the Radix component to use the `motion` component as its DOM node, enabling all of Motion's animation props.

```jsx
<Toast.Root asChild>
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    layout
```

--------------------------------

### Import press function from Motion

Source: https://motion.dev/docs/press

Import the press function from the Motion library to enable gesture detection on DOM elements. This is the first step to using press gestures in your project.

```javascript
import { press } from "motion"
```

--------------------------------

### Define and Apply Transition Configuration

Source: https://motion.dev/docs/react-transitions

Creates a transition object with duration, delay, and easing curve, then applies it to both Motion components and the animate() function. The transition object defines how animations between values are performed.

```jsx
const transition = {
  duration: 0.8,
  delay: 0.5,
  ease: [0, 0.71, 0.2, 1.01],
}

// Motion component
<motion.div
  animate={{ x: 100 }}
  transition={transition}
/>

// animate() function
animate(".box", { x: 100 }, transition)
```

--------------------------------

### Rotating Cube with Motion useAnimate Hook

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Rewrite a rotating cube animation using Motion's lightweight useAnimate hook from motion/react-mini. This provides 90% smaller bundle size with hardware acceleration for smoother animations during React re-renders.

```jsx
import { useAnimate } from "motion/react-mini"

const RotatingCube = () => {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const animation = animate(
      scope.current,
      { transform: "rotate(360deg)" },
      { duration: 10, repeat: Infinity }
    )

    return () => animation.stop()
  }, [])

  return <div ref={scope} />
}
```

--------------------------------

### Server-side rendering with motion components

Source: https://motion.dev/docs/react-motion-component

Motion components support server-side rendering with initial state reflected in server-generated output. Use initial={false} to prevent enter animations and render initial state as defined in animate prop.

```javascript
// Server will output `translateX(100px)`
<motion.div initial={false} animate={{ x: 100 }} />
```

--------------------------------

### Spring animation with Vue reactive reference

Source: https://motion.dev/docs/css

Create spring animations in Vue using a reactive reference to store the spring() result. Bind the transition to the element's style using Vue's template syntax.

```javascript
const springTransition = ref(spring(0.3, 1))
```

```vue
<div :style="{ transition: 'filter ' + springTransition }"></div>
```

--------------------------------

### Initializing useSpring with Number or Unit-Type String

Source: https://motion.dev/docs/react-use-spring

Shows how to initialize `useSpring` with an initial numerical value or a unit-type string. This creates a motion value that will animate to new targets with a spring effect.

```javascript
const x = useSpring(0)
const y = useSpring("100vh")
```

--------------------------------

### Importing transform Function (JavaScript)

Source: https://motion.dev/docs/transform

To use the `transform` function in your JavaScript project, you need to import it from the 'motion' library. React users can also use the `useTransform` hook.

```javascript
import { transform } from "motion"
```

--------------------------------

### useTransform Import Statement

Source: https://motion.dev/docs/react-use-transform

Standard import statement for the useTransform hook from the Motion React library.

```javascript
import { useTransform } from "motion/react"
```

--------------------------------

### Hardware Accelerated Scroll Animation with Motion

Source: https://motion.dev/docs/gsap-vs-motion

Demonstrates how to create a hardware-accelerated scroll animation using Motion's animate and scroll functions. This approach ensures smooth animations that remain synchronized with GPU-rendered scroll events, avoiding the typical JavaScript-based scroll animation lag.

```javascript
const animation = animate(element, { opacity: [0, 1] })

scroll(animation)
```

--------------------------------

### Importing useSpring Hook in Motion/React

Source: https://motion.dev/docs/react-use-spring

This snippet demonstrates how to import the `useSpring` hook from the `motion/react` library, making it available for use in React components to create spring animations.

```javascript
import { useSpring } from "motion/react"
```

--------------------------------

### Define animation sequences with hybrid animate()

Source: https://motion.dev/docs/animate

The hybrid animate() function accepts an array of animation definitions (sequences) that play sequentially by default. Each definition is an array containing target, properties, and options. Use the 'at' option to control timing with absolute/relative times or labels.

```JavaScript
const sequence = [
  ["ul", { opacity: 1 }, { duration: 0.5 }],
  ["li", 100, { ease: "easeInOut" }]
]

animate(sequence)
```

--------------------------------

### Handle onDragStart Callback Event (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `onDragStart` callback function is fired once when a drag gesture is recognized and begins on the element. It receives the triggering `PointerEvent` and an `info` object, similar to `onDrag`. This is useful for performing actions like setting initial states or triggering visual feedback at the very beginning of a drag operation.

```jsx
<motion.div drag onDragStart={(event, info) => console.log(info.delta.x)} />
```

--------------------------------

### Enable Layout Animations in Radix Components with asChild

Source: https://motion.dev/docs/radix

This snippet demonstrates how to achieve layout animations with Radix components by wrapping them in a `motion.div` and using the `asChild` prop. Controlling the component's value state externally ensures that `motion` components are aware of changes for smooth layout transitions.

```jsx
const [tab, setTab] = useState("account")

return (
  <Tabs.Root value={tab} onValueChange={setTab} asChild>
    <motion.div layout>

```

--------------------------------

### Animating with Motion's Declarative React/Vue API

Source: https://motion.dev/docs/gsap-vs-motion

This snippet demonstrates how Motion integrates with React and Vue using a declarative API. Animations are defined directly within component props, making the code clean and readable, as shown with a simple 'x' axis translation on a 'motion.div' component.

```jsx
<motion.div animate={{ x: 100 }} />
```

--------------------------------

### Create basic motion components in React

Source: https://motion.dev/docs/react-animation

Define motion components for HTML and SVG elements by prefixing standard elements with 'motion.' These components function identically to static counterparts but include special animation props for creating animations.

```jsx
<motion.div />

<motion.a href="#" />

<motion.circle cx={0} />
```

--------------------------------

### Configure inView with amount option

Source: https://motion.dev/docs/inview

Define the visibility threshold required for an element to be considered in view using the amount option. Accepts "some" (default), "all", or a number between 0 and 1.

```javascript
// Using "some" (default) - any part of element in view
inView(element, callback, { amount: "some" })

// Using "all" - entire element must be in view
inView(element, callback, { amount: "all" })

// Using proportion - 0.5 means 50% of element
inView(element, callback, { amount: 0.5 })
```

--------------------------------

### Importing Motion's scroll Function in JavaScript

Source: https://motion.dev/docs/scroll

This snippet demonstrates the standard way to import the `scroll` function from the Motion library, making it available for use in your JavaScript code.

```javascript
import { scroll } from "motion"
```

--------------------------------

### Import mapValue from Motion

Source: https://motion.dev/docs/map-value

Import the mapValue function from the Motion library to enable value mapping functionality in your JavaScript projects.

```JavaScript
import { mapValue } from "motion"
```

--------------------------------

### Sample Spring Generator at Specific Time (JavaScript)

Source: https://motion.dev/docs/spring

Explains how to retrieve the spring's state at a particular millisecond using the `next()` method of the generator. The method returns an object containing the `value` of the spring at that time and a `done` boolean indicating if the animation has finished.

```javascript
const { value, done } = generator.next(10) // Spring state at 10 milliseconds
```

--------------------------------

### Import Motion React library

Source: https://motion.dev/docs/figma

ES6 import statement to include Motion animations library in a React component. This import statement provides access to the motion component API for creating animations. Can be added manually to generated code or requested from Figma Make AI generator.

```javascript
import { motion } from "motion/react"
```

--------------------------------

### Import inView from Motion library

Source: https://motion.dev/docs/inview

Import the inView function from the Motion library to enable viewport detection functionality in your JavaScript application.

```javascript
import { inView } from "motion"
```

--------------------------------

### Access and Manipulate Motion Animation Playback Controls

Source: https://motion.dev/docs/animate

Demonstrates how to obtain an animation object from `animate()` and use its properties and methods, like `time` and `stop()`, to control playback.

```javascript
const animation = animate(element, { opacity: 1 })

animation.time = 0.5
animation.stop()
```

--------------------------------

### Apply multiple motion values to element styles with styleEffect (JavaScript)

Source: https://motion.dev/docs/style-effect

This code illustrates how `styleEffect` can bind multiple `motionValue` instances to different CSS properties of an element. It sets up `opacity` and `backgroundColor` motion values and applies them to a `<div>` element, establishing initial reactive styles.

```javascript
const opacity = motionValue(0.5)
const backgroundColor = motionValue("#00f")

styleEffect("div", { opacity, backgroundColor })
```

--------------------------------

### Animate Independent Transforms with Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Demonstrates Motion's ability to animate individual transform properties like x and scaleX separately, enabling independent animation options for each property which is impossible with WAAPI.

```javascript
animate(element, { x: 50, scaleX: 2 })
```

--------------------------------

### Spring animation with Astro using CSS variables

Source: https://motion.dev/docs/css

Define spring animations in Astro by creating CSS variables with the spring() function and referencing them in CSS rules. This approach combines server-side generation with CSS variable flexibility.

```astro
<style define:vars={{ spring: spring(0.2, 0) }}>
  span {
    transition: transform var(--spring);
  }
</style>
```

--------------------------------

### Render Basic Motion+ Cursor Component in React

Source: https://motion.dev/docs/cursor

This JSX code demonstrates the simplest way to render the `Cursor` component. When included in your React application, it will replace the browser's default cursor with a custom one provided by Motion+.

```jsx
<Cursor />
```

--------------------------------

### Configure spring animation with bounce parameter

Source: https://motion.dev/docs/animate

Demonstrates how to configure a spring animation with the bounce parameter to control bounciness. Bounce values range from 0 (no bounce) to 1 (extremely bouncy), and are overridden if stiffness, damping, or mass are set.

```javascript
animate(
  "section",
  { rotateX: 90 },
  { type: "spring", bounce: 0.25 }
)
```

--------------------------------

### Implement Responsive Y-Axis Animation using Tailwind CSS Variables and Motion (React)

Source: https://motion.dev/docs/react-tailwind

This React code snippet illustrates how to create responsive animations by defining CSS variables with screen-specific values using Tailwind CSS, then animating those variables with Motion. It shows how to set an initial `y` offset based on screen size (`--entry-distance-y`) and animate it to `0`.

```jsx
<motion.div
  className="
    p-8 bg-rose-500 text-white rounded-xl shadow-lg max-w-md mx-auto
    
    /* Define the CSS variable inline, with responsive values */
    [--entry-distance-y:20px] 
    md:[--entry-distance-y:50px]
  "
  initial={{ opacity: 0, y: "var(--entry-distance-y)" }}
  animate={{ opacity: 1, y: 0 }}
>
```

--------------------------------

### Optimize Rendering with willChange Property and Animation

Source: https://motion.dev/docs/performance

This snippet demonstrates how to use the `willChange` CSS property to hint to the browser that an element's `transform` property will be animated, potentially promoting it to its own layer for better rendering performance. It then shows an animation of `borderRadius`, which typically triggers a paint operation, on that element.

```javascript
element.style.willChange = "transform"
animate(element, { borderRadius: "50%" })
```

--------------------------------

### LLM Generated CSS linear() Spring Preview

Source: https://motion.dev/docs/studio-generate-css

This snippet illustrates a partial CSS `linear()` easing function generated by an LLM in response to a natural language prompt. It shows the typical format and content for a spring curve, including duration and initial control points, demonstrating the LLM's ability to interpret requests into CSS.

```CSS
500ms linear(0, 0.009, 0.035 2.1%, /* ... */)
```

--------------------------------

### Apply Spring Animation with Bounce

Source: https://motion.dev/docs/react-transitions

Creates a spring animation using the bounce parameter to control bounciness. A bounce value of 0 means no bounce, while 1 is extremely bouncy, providing physics-based animation feedback.

```jsx
<motion.div
  animate={{ rotateX: 90 }}
  transition={{ type: "spring", bounce: 0.25 }}
/>
```

--------------------------------

### Apply Spring Easing to Motion animate() Function (JavaScript)

Source: https://motion.dev/docs/spring

Demonstrates how to use the `spring` function as an easing type within `motion/mini`'s `animate()` function. This applies spring physics to an animation, with options like `bounce` and `duration` controlling its behavior. It requires importing `animate` from `motion/mini` and `spring` from `motion`.

```javascript
import { animate } from "motion/mini"
import { spring } from "motion"

animate(
  element,
  { transform: "translateX(100px)" },
  { type: spring, bounce: 0.3, duration: 0.8 }
)
```

--------------------------------

### Animate Characters with Motion and splitText

Source: https://motion.dev/docs/split-text

Demonstrates basic usage of `splitText` to break text into characters and then animate them using Motion's `animate` and `stagger` functions. It targets an `<h1>` element and applies opacity and Y-axis animation.

```javascript
const { chars } = splitText("h1")

animate(
  chars,
  { opacity: [0, 1], y: [10, 0] },
  { duration: 1, delay: stagger(0.05) }
)
```

--------------------------------

### Animate Properties with Keyframes in React Motion

Source: https://motion.dev/docs/react-animation

Demonstrates animating a property through a sequence of values using keyframes. By providing an array of values to the `animate` prop, the `motion` component will transition through each value in order.

```jsx
<motion.div animate={{ x: [0, 100, 0] }} />
```

--------------------------------

### Inertia Animation - min and max Constraints

Source: https://motion.dev/docs/react-transitions

Set minimum and maximum boundary constraints for inertia animations. Values will bounce against these limits using spring animation when reached.

```APIDOC
## Inertia Animation - min and max

### Description
Define boundary constraints for inertia animations. The animated value will snap to these limits if initial animation value exceeds them, or "bump" against them during animation. Uses spring animation for the bounce effect.

### Properties
**min** (number) - Optional - Minimum constraint value
**max** (number) - Optional - Maximum constraint value

### Parameters
- **min** (number) - Optional - Minimum boundary value
- **max** (number) - Optional - Maximum boundary value
- **type** (string) - Optional - Set to "inertia"

### Request Example
```jsx
<motion.div
  drag
  dragTransition={{ min: 0, max: 100 }}
/>
```

### Response
- Animation value constrained between 0 and 100
- Value bumps against boundaries with spring animation
- If initial value exceeds max, it immediately snaps to max
- If initial value is less than min, it immediately snaps to min
```

--------------------------------

### Execute Callback on Animation Update with Motion `onUpdate`

Source: https://motion.dev/docs/animate

Provides an `onUpdate` callback function that is invoked with the latest animation values during its execution. Currently supports single-value animations only.

```javascript
animate("#fff", "#000", {
  duration: 2,
  onUpdate: latest => console.log(latest)
})
```

--------------------------------

### Implement Basic Exit Animations with AnimatePresence in React

Source: https://motion.dev/docs/base-ui

Illustrates how to use `AnimatePresence` for exit animations when a Base UI component leaves the DOM. The `motion.button` inside `Menu.Trigger` includes `initial`, `animate`, and `exit` props, and is conditionally rendered based on the `open` state.

```javascript
<AnimatePresence>
  {open && (
    <Menu.Trigger render={
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    } />
  )}
</AnimatePresence>
```

--------------------------------

### Animate Independent Transforms with Different Options

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Shows Motion's capability to apply different animation options to individual transform properties, allowing fine-grained control over separate transform animations.

```javascript
animate(
  element,
  { x: 50, scaleX: 2 },
  { x: { duration: 2 }, scaleX: { repeat: 1 } }
)
```

--------------------------------

### Hoist Open State for Base UI Components in React

Source: https://motion.dev/docs/base-ui

Shows how to manually hoist the `open` state for Base UI components like `ContextMenu` to enable custom control over their conditional rendering. It uses React's `useState` hook to manage the `open` prop of `ContextMenu.Root`.

```javascript
const [open, setOpen] = useState(false)

return (
  <ContextMenu.Root open={open} onOpenChange={setOpen}>

```

--------------------------------

### Simplifying Animation State Persistence with Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Unlike WAAPI's complex state persistence, Motion's `animate` function streamlines the process. It automatically ensures that elements remain in their target state once an animation completes, eliminating the need for manual workarounds or `fill: "forwards"`.

```javascript
animate(element, { opacity: 0 })
```

--------------------------------

### Create Basic mapValue with Number Mapping

Source: https://motion.dev/docs/map-value

Create a new motion value that maps a numerical input range to a numerical output range. Both ranges must be equal length, with the input range being linear (either ascending or descending).

```JavaScript
const x = motionValue(0)
const opacity = mapValue(x, [-100, 0, 100, 200], [0, 1, 1, 0])
```

--------------------------------

### Animate elements with staggered delays using Motion.js

Source: https://motion.dev/docs/stagger

Demonstrates how to use the `stagger()` function with `animate()` from the Motion.js library to create a delayed animation effect across multiple elements. It imports necessary functions and applies a `0.1` second stagger delay to `li` elements, making them appear sequentially.

```javascript
import { animate, stagger } from "motion"

animate(
  "li",
  { opacity: 1 },
  { delay: stagger(0.1) }
)
```

--------------------------------

### scroll() - Callback with Info

Source: https://motion.dev/docs/scroll

Pass a callback with a second info argument to receive detailed scrolling information including position, velocity, and progress on each axis.

```APIDOC
## scroll() - Scroll Information

### Description
Access detailed scroll information by providing a callback with a second info parameter. Returns comprehensive data about scroll position, velocity, and progress.

### Method
Function

### Signature
```
scroll((progress, info) => void, options?): () => void
```

### Parameters
#### Callback Parameters
- **progress** (number) - Progress value between 0-1
- **info** (ScrollInfo) - Object containing scroll information

#### Info Object Structure
- **time** (number) - Timestamp when scroll position was recorded
- **x** (AxisInfo) - Information on x scroll axis
- **y** (AxisInfo) - Information on y scroll axis

#### AxisInfo Object
- **current** (number) - Current scroll position on axis
- **offset** (Array<number>) - Scroll offsets resolved as pixels
- **progress** (number) - Progress value (0-1) within resolved offsets
- **scrollLength** (number) - Total scrollable length on axis
- **velocity** (number) - Velocity of scroll on axis

### Request Example
```javascript
scroll((progress, info) => {
  console.log(info.x.current)
  console.log(info.y.velocity)
  console.log(info.time)
})
```

### Response
#### Response Example
```javascript
{
  "time": 1234567890,
  "x": {
    "current": 0,
    "offset": [0, 1000],
    "progress": 0,
    "scrollLength": 2000,
    "velocity": 0
  },
  "y": {
    "current": 450,
    "offset": [0, 2000],
    "progress": 0.225,
    "scrollLength": 5000,
    "velocity": 15.5
  }
}
```
```

--------------------------------

### Generate CSS Transitions with spring() Function (JavaScript)

Source: https://motion.dev/docs/spring

Demonstrates how the `spring()` function can be utilized to directly generate a CSS transition string. This allows for applying complex spring physics to standard CSS properties, providing a bridge between Motion.js's physics engine and native browser animations.

```javascript
element.style.transition = "all " + spring(0.5)
```

--------------------------------

### useInView Hook

Source: https://motion.dev/docs/react-use-in-view

`useInView` is a tiny (0.6kb) React hook that detects when a provided element is within the viewport. It takes a `ref` to the element and an optional options object, returning a boolean indicating visibility.

```APIDOC
## useInView Hook

### Description
The `useInView` hook detects when a React element is within the viewport. It's designed for scroll-based animations and effects, providing a simple boolean state indicating visibility.

### Hook Signature
```javascript
const isInView = useInView(ref, options?)
```

### Parameters
#### Arguments
- **ref** (React.RefObject<HTMLElement>) - Required - A React ref object attached to the HTML element you want to track.
- **options** (object) - Optional - An object to configure the intersection observation.

#### Options Object Properties
- **root** (React.RefObject<HTMLElement> | null) - Optional - Default: `null` (document viewport). The element that is used as the viewport for checking visibility. If `null`, the browser viewport is used.
- **margin** (string) - Optional - Default: `"0px"`. A margin to add to the viewport to change the detection area. Use multiple values to adjust top/right/bottom/left, e.g., `"0px -20px 0px 100px"`. Warning: For browser security reasons, `margin` won't take affect within cross-origin iframes unless `root` is explicitly defined.
- **once** (boolean) - Optional - Default: `false`. If `true`, once an element is in view, `useInView` will stop observing the element and always return `true`.
- **initial** (boolean) - Optional - Default: `false`. Set an initial value to return until the element has been measured.
- **amount** (string | number) - Optional - Default: `"some"`. The amount of an element that should enter the viewport to be considered "entered". Either `"some"`, `"all"` or a number between `0` and `1`.

### Return Value
- **isInView** (boolean) - Returns `true` if the element is currently within the viewport (or meets the `amount` threshold), `false` otherwise.

### Usage Example
```javascript
import { useInView } from "motion/react"
import { useRef, useEffect } from "react"

function Component() {
  const ref = useRef(null)
  const isInView = useInView(ref)

  useEffect(() => {
    console.log("Element is in view: ", isInView)
  }, [isInView])

  return <div ref={ref} style={{ height: "200px", background: isInView ? "lightblue" : "lightgray" }}>
    {isInView ? "I'm in view!" : "Scroll me into view"}
  </div>
}
```
```javascript
// Example with custom root
function Carousel() {
  const container = useRef(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { root: container, margin: "0px 0px -50px 0px" })

  return (
    <div ref={container} style={{ overflow: "scroll", height: "300px", border: "1px solid black" }}>
      <div style={{ height: "500px" }}>Scroll down</div>
      <div ref={ref} style={{ height: "100px", background: isInView ? "lightgreen" : "orange" }}>
        {isInView ? "In carousel view!" : "Scroll into carousel view"}
      </div>
      <div style={{ height: "500px" }}>Scroll up</div>
    </div>
  )
}
```
```javascript
// Example with `once` option
function OnceVisibleComponent() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div ref={ref} style={{ height: "150px", background: isInView ? "gold" : "silver" }}>
      {isInView ? "I was in view (once)!" : "Waiting to be in view"}
    </div>
  )
}
```
```javascript
// Example with `initial` option
function InitialValueComponent() {
  const ref = useRef(null)
  const isInView = useInView(ref, { initial: true })

  return (
    <div ref={ref} style={{ height: "150px", background: isInView ? "teal" : "purple", color: "white" }}>
      {`Initial is ${initial}, then updates`}
    </div>
  )
}
```
```

--------------------------------

### Import svgEffect Function (JavaScript)

Source: https://motion.dev/docs/svg-effect

This code shows the standard ES module import statement required to bring the `svgEffect` function into your JavaScript file. It imports `svgEffect` specifically from the 'motion' library.

```javascript
import { svgEffect } from "motion"
```

--------------------------------

### Define min and max boundaries for glide easing in Motion

Source: https://motion.dev/docs/glide

This snippet demonstrates how to set `min` and `max` boundaries for a `glide` animation. If the animated value exceeds these limits, a `spring` animation will automatically engage to snap the value back to the boundary, creating a natural 'bounce' effect.

```javascript
glide({ min: -100, max: 100 })
```

--------------------------------

### Control spring stiffness for animation behavior

Source: https://motion.dev/docs/animate

Demonstrates how to configure the stiffness parameter for spring animations. Higher stiffness values create more sudden movement, with a default value of 1.

```javascript
animate(
  "section",
  { rotate: 180 },
  { type: "spring", stiffness: 50 }
)
```

--------------------------------

### Configure Easing in Motion Animate Function

Source: https://motion.dev/docs/easing-functions

Demonstrates how to specify easing functions within Motion's `animate` function or `motion` component configuration. Easing can be defined using a named preset string like "easeIn" for common curves, or a four-element array to specify a custom cubic Bezier curve.

```JavaScript
// Named easing
ease: "easeIn"

// Bezier curve
ease: [0.39, 0.24, 0.3, 1]
```

--------------------------------

### Basic attrEffect Usage with Motion Values

Source: https://motion.dev/docs/attr-effect

Demonstrates basic usage of attrEffect to apply a motion value to an element's attribute. The motion value is created with an initial value and then applied to the rect element's width attribute.

```javascript
const width = motionValue(100)

attrEffect("rect", { width })
```

--------------------------------

### Import delay from Motion JavaScript library

Source: https://motion.dev/docs/delay

Import the `delay` function from the Motion library to access the setTimeout alternative. This is the first step required to use delay functionality in your Motion animation project.

```javascript
import { delay } from "motion"
```

--------------------------------

### Animate Combined Transform for Hardware Acceleration

Source: https://motion.dev/docs/performance

For guaranteed hardware acceleration when needed, animate the transform property directly with combined transform functions rather than individual properties. This approach ensures the animation runs on the compositor across browsers.

```javascript
animate(".box", { transform: "translateX(100px) scale(2)" })
```

--------------------------------

### SplitText Animation with Motion

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Animate individual characters using Motion's splitText function with opacity effects. This provides a lightweight 0.7kb alternative to GSAP's SplitText plugin, with built-in aria-label support for screen readers.

```javascript
animate(
  splitText("h1").chars,
  { opacity: [0, 1] }
)
```

--------------------------------

### useTransform with clamp Option - Clamping Behavior

Source: https://motion.dev/docs/react-use-transform

Demonstrates the difference between clamped (default) and unclamped value mapping. When clamped, output values are restricted to the specified range; when unclamped, mapping continues beyond the defined range.

```javascript
const y = useTransform(x, [0, 1], [0, 2])
const z = useTransform(x, [0, 1], [0, 2], { clamp: false })

useEffect(() => {
  x.set(2)
  console.log(y.get()) // 2, input clamped
  console.log(z.get()) // 4
})
```

--------------------------------

### Import Cursor Component into React Project

Source: https://motion.dev/docs/cursor

This JavaScript import statement allows you to bring the `Cursor` component from the `motion-plus/react` package into your React component file, making it ready for use in your application.

```javascript
import { Cursor } from "motion-plus/react"
```

--------------------------------

### Enable Basic Layout Animation with Motion

Source: https://motion.dev/docs/react-layout-animations

This snippet demonstrates the simplest way to activate layout animations on a Framer Motion component. By adding the `layout` prop, any subsequent layout changes resulting from React renders will automatically animate.

```jsx
<motion.div layout />
```

--------------------------------

### Animation Controls - Overview

Source: https://motion.dev/docs/animate

The animate() function returns animation playback controls for managing animation state, including pause, play, cancel, speed adjustment, and time manipulation.

```APIDOC
## Animation Controls

### Description
`animate()` returns animation playback controls. These can be used to pause, play, cancel, change playback speed and more.

### Usage
```javascript
const animation = animate(element, { opacity: 1 })

animation.time = 0.5
animation.stop()
```

### Available Controls
- **duration** - Returns the duration of the animation (read-only)
- **time** - Gets and sets the current time of the animation
- **speed** - Gets and sets the current playback speed
```

--------------------------------

### Import and Basic Usage of useInView Hook

Source: https://motion.dev/docs/react-use-in-view

Import the useInView hook from the Motion library and use it with a React ref to track element visibility. The hook returns a boolean indicating whether the referenced element is currently in the viewport.

```javascript
import { useInView } from "motion/react"

const ref = useRef(null)
const isInView = useInView(ref)

return <div ref={ref} />
```

--------------------------------

### Override animation options per-value basis

Source: https://motion.dev/docs/animate

Demonstrates how to apply different transition options to individual animated values. Named transitions override global options for specific properties, allowing fine-grained control over animation behavior.

```javascript
animate(
  element,
  { x: 100, rotate: 0 },
  {
    duration: 1,
    rotate: { duration: 0.5, ease: "easeOut" }
  }
)
```

--------------------------------

### Reveal and Animate Split Text in JavaScript

Source: https://motion.dev/docs/split-text

Shows the JavaScript logic to make a hidden container visible and then animate its split text content using `splitText` and Motion's `animate` function. This snippet pairs with the CSS for hiding the container.

```javascript
document.querySelector(".container").style.visibility = "visible"

const { words } = splitText(".container")
animate(words, { opacity: [0, 1] })
```

--------------------------------

### repeat Configuration

Source: https://motion.dev/docs/animate

Control how many times an animation repeats. Set to Infinity for perpetual looping animations.

```APIDOC
## repeat Configuration

### Description
The number of times to repeat the transition. Set to `Infinity` for perpetual animation.

### Property
**repeat** (number)

### Default Value
`0`

### Usage
```javascript
animate(
  element,
  { backgroundColor: "#fff" },
  { repeat: Infinity, duration: 2 }
)
```

### Parameters
- **repeat** (number) - Optional - Number of repetitions, use Infinity for infinite loop (default: 0)
```

--------------------------------

### Apply global options and defaultTransition to animation sequences

Source: https://motion.dev/docs/animate

Animation sequences support global playback options like duration and repeat that apply to the entire sequence. The defaultTransition option sets default timing for all items in the sequence without explicit configuration.

```JavaScript
animate(sequence, { duration: 10, repeat: 2 })

animate(sequence, {
  defaultTransition: { duration: 0.2 }
})
```

--------------------------------

### Immediately Complete Motion Animation with complete() (JavaScript)

Source: https://motion.dev/docs/animate

Calling `complete()` will immediately advance a Motion animation to its final state. This effectively skips the remaining animation duration and applies the end values.

```javascript
animation.complete()
```

--------------------------------

### Stagger animations across multiple elements

Source: https://motion.dev/docs/animate

Demonstrates how to apply staggered delays to multiple elements using the stagger function from the Motion library. The stagger function accepts a delay value in seconds, applying incremental delays to each animated element sequentially.

```javascript
import { stagger, animate } from "motion"

animate(".item", { x: 300 }, { delay: stagger(0.1) })
```

--------------------------------

### Animate Split Text After Custom Fonts Load in JavaScript

Source: https://motion.dev/docs/split-text

Demonstrates how to ensure `splitText` is executed only after custom web fonts have fully loaded. This prevents incorrect text splitting due to font metric changes and uses the `document.fonts.ready` promise.

```javascript
document.fonts.ready.then(() => {
  const { words } = splitText(element)

  animate(
    words,
    { y: [-10, 10] },
    { delay: stagger(0.04) }
  )
})
```

--------------------------------

### Override Animation with Motion Auto-Detection

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Motion's animate function automatically detects legacy browsers and generates initial keyframes using getComputedStyle when necessary, ensuring compatibility with older browsers and WAAPI polyfills.

```javascript
const animation = animate(element, { opacity: 1 }, { duration: 1000 })
// Motion automatically handles legacy browser compatibility
```

--------------------------------

### Batch reads and writes with delay and frame in animation loop

Source: https://motion.dev/docs/delay

Use `delay` with `frame.render` to synchronize DOM reads with writes in Motion's animation loop. The callback fires on the 'read' step, allowing subsequent frame.render calls to batch writes efficiently without layout thrashing.

```javascript
import { delay, frame } from "motion"

delay(() => {
  const { left } = element.getBoundingClientRect()

  // Will render later during this animation frame
  frame.render(() => {
    element.style.left = `${left * 2}px`
  })
}, 1)
```

--------------------------------

### Layout Animation

Source: https://motion.dev/docs/react-motion-component

Enable layout animations to smoothly animate changes in component size and position. Can be applied globally or per dimension.

```APIDOC
## layout Property

### Description
If `true`, this component will perform layout animations. Can be set to `"position"` or `"size"` to animate only specific dimensions.

### Type
boolean | "position" | "size"

### Default
`false`

### Values
- **true** - Animate both position and size changes
- **"position"** - Animate only position changes
- **"size"** - Animate only size changes
- **false** - No layout animation (default)

### Usage Examples
```jsx
// Animate all layout changes
<motion.div layout />

// Animate only position
<motion.img layout="position" />

// Animate only size
<motion.img layout="size" />
```
```

--------------------------------

### Split Text by Custom Delimiter with splitText

Source: https://motion.dev/docs/split-text

Demonstrates using the `splitBy` option to define a custom delimiter for splitting text, useful for content that is not space-separated. It also includes a warning about potential line wrapping issues.

```html
<p>My+custom+text</p>
```

```javascript
splitText(paragraph, { splitBy: "+" })
```

--------------------------------

### Motion Multi-Keyframe Scroll Animation with Fade In/Out

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Shows advanced Motion scroll animation mapping multiple opacity keyframes to four scroll offset positions, creating a fade-in effect as element enters viewport and fade-out as it exits.

```javascript
const animation = animate(element, { opacity: [0, 1, 1, 0] })

scroll(animation, {
  target: element,
  offset: [
    // When the target starts entering the bottom of the viewport, opacity = 0
    "start end",
    // When the target is fully in the bottom of the viewport, opacity = 1
    "end end",
    // When the target starts exiting the top of the viewport, opacity = 1
    "start start",
    // When the target is fully off the top of the viewport, opacity = 0
    "end start"
  ]
})
```

--------------------------------

### Create custom DOM elements with motion.create

Source: https://motion.dev/docs/react-motion-component

Pass a string to motion.create() to create custom DOM elements. This renders custom HTML elements with full motion animation capabilities.

```javascript
// Will render <custom-element /> into HTML
const MotionComponent = motion.create('custom-element')
```

--------------------------------

### Accessing Detailed Scroll Information in Motion Callbacks

Source: https://motion.dev/docs/scroll

This snippet demonstrates how to receive a detailed `info` object as a second argument in the `scroll()` callback. This object provides comprehensive data about the scroll event, including current position, offset, progress, scroll length, and velocity for both X and Y axes.

```javascript
scroll((progress, info) => {
  console.log(info.x.current)
})
```

--------------------------------

### Apply whileInView Animation as Variants (React/JSX)

Source: https://motion.dev/docs/react-motion-component

Instead of direct target properties, `whileInView` can also trigger a named variant defined on the `motion.div`. This provides more structured and reusable animations when an element enters the viewport. The component will transition to the 'visible' variant when it becomes visible.

```jsx
// As variants
<motion.div whileInView="visible" />
```

--------------------------------

### press() - Basic Press Gesture Detection

Source: https://motion.dev/docs/press

Detects when a user presses (mousedown/touchstart) an element and optionally when they release. Automatically filters secondary pointer events and provides keyboard accessibility.

```APIDOC
## press(target, callback, options?)

### Description
Detects press gestures on DOM elements, firing callbacks when the gesture starts, ends, or is cancelled. Automatically manages event listeners and provides keyboard accessibility.

### Method
Function

### Signature
```javascript
press(target, callback, options?) => () => void
```

### Parameters

#### target (required)
- **Type:** `Element | Element[] | string` - Required
- **Description:** A DOM element, array of elements, or CSS selector string to attach press listeners to

#### callback (required)
- **Type:** `(element: Element, startEvent: PointerEvent) => ((endEvent: PointerEvent, info: PressInfo) => void)?` - Required
- **Description:** Function called when press starts. Receives the pressed element and triggering PointerEvent. Can optionally return a function to be called when press ends.

#### options (optional)
- **Type:** `PressOptions` - Optional
- **Description:** Configuration object for press behavior

### Options

#### passive
- **Type:** `boolean` - Optional
- **Default:** `true`
- **Description:** If false, allows calling event.preventDefault() but reduces performance. Learn more about passive events.

#### once
- **Type:** `boolean` - Optional
- **Default:** `false`
- **Description:** If true, each element fires the gesture only once.

### Return Value
- **Type:** `() => void`
- **Description:** A function that, when called, cancels all active event handlers for this press gesture.

### Request Example - Press Start Only
```javascript
import { press } from "motion"

press(
  document.getElementById("my-id"),
  () => {
    console.log("my-id pressed!")
  }
)
```

### Request Example - Using CSS Selector
```javascript
press("a", () => console.log("link pressed"))
```

### Request Example - Press Start with Element Info
```javascript
press("div:nth-child(2)", (element, startEvent) => {
  console.log("Pressed", element)
  console.log("At", startEvent.clientX, startEvent.clientY)
})
```

### Request Example - Press Start and End
```javascript
press(element, (element, startEvent) => {
  console.log("press start")
  
  return (endEvent) => {
    console.log("press end")
  }
})
```

### Request Example - Press Success/Cancel Detection
```javascript
press(element, () => {
  return (endEvent, info) => {
    console.log("press", info.success ? "end" : "cancel")
  }
})
```

### Request Example - With Animation
```javascript
press("button", (element) => {
  animate(element, { scale: 0.9 })

  return () => animate(element, { scale: 1 })
})
```

### Request Example - Cancel Gesture
```javascript
const cancelPress = press(element, callback)

cancelPress()
```

### Response - Callback Parameters

#### On Press Start
- **element** (Element) - The element that was pressed
- **startEvent** (PointerEvent) - The native pointer event that triggered the press

#### On Press End
- **endEvent** (PointerEvent) - The native pointer event when press ended
- **info** (PressInfo) - Object containing press result information
  - **success** (boolean) - True if press completed successfully (like a click), false if ended outside element or blurred via keyboard

### Features
- **Clean:** Automatically manages event listeners
- **Convenient:** Accepts elements or CSS selectors for attaching multiple listeners at once
- **Lazy:** Attaches only the listeners needed
- **Accessible:** Automatically keyboard accessible via focus and enter key
- **Filtered:** Automatically filters out secondary pointer events like right clicks or second touch points

### Import
```javascript
import { press } from "motion"
```
```

--------------------------------

### Import lightweight m component from Motion React

Source: https://motion.dev/docs/react-reduce-bundle-size

Replace the standard `motion` import with the slimmer `m` component which excludes preloaded features like animations, layout animations, and drag gestures. This reduces bundle size significantly while maintaining the same API.

```javascript
import * as m from "motion/react-m"
```

--------------------------------

### Configure Visibility Amount for useInView

Source: https://motion.dev/docs/react-use-in-view

Use the 'amount' option to specify how much of an element must enter the viewport to be considered 'in view'. Accepts 'some', 'all', or a number between 0 and 1.

```javascript
const isInView = useInView(ref, { amount: "some" })
const isFullyInView = useInView(ref, { amount: "all" })
const isPartiallyInView = useInView(ref, { amount: 0.5 })
```

--------------------------------

### Pause and Resume Video with usePageInView

Source: https://motion.dev/docs/react-use-page-in-view

Use usePageInView with useEffect to pause video playback when the page loses focus and resume when the page regains focus, improving performance and user experience.

```javascript
const videoRef = useRef(null)
const isInView = usePageInView()

useEffect(() => {
  const videoElement = videoRef.current
  if (!videoElement) return

  if (isInView) {
    videoElement.play()
  } else {
    videoElement.pause()
  }
}, [isInView])
```

--------------------------------

### attrEffect with CSS Selector and Data Attribute

Source: https://motion.dev/docs/attr-effect

Demonstrates using attrEffect with a CSS selector to target elements. A motion value is created and applied to a data-progress attribute, allowing dynamic attribute updates via motion values.

```javascript
const progress = motionValue(0.5)

attrEffect("#progress", { "data-progress": progress })
```

--------------------------------

### Configure inView with root option

Source: https://motion.dev/docs/inview

Use the root option to detect viewport entry/exit relative to a scrollable parent element instead of the browser window.

```javascript
const carousel = document.querySelector("#carousel")

inView("#carousel li", callback, { root: carousel })
```

--------------------------------

### Apply animation variants to a 3D material

Source: https://motion.dev/docs/react-three-fiber

This snippet illustrates how to define and use animation variants with `motion.meshStandardMaterial`. By setting `initial`, `animate`, and `variants` props, you can declaratively control the animation states of 3D materials.

```jsx
const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

return (
  <motion.meshStandardMaterial
    initial="hidden"
    animate="visible"
    variants={variants}
  />
)
```

--------------------------------

### Viewport Configuration

Source: https://motion.dev/docs/react-motion-component

Configure how elements are tracked within the viewport using the viewport prop. Control detection area, frequency, and ancestor scroll containers.

```APIDOC
## viewport Property

### Description
Options to define how the element is tracked within the viewport.

### Type
Object with the following properties:

### Properties

#### once
- **Type:** boolean
- **Required:** No
- **Description:** If `true`, once element enters the viewport it won't detect subsequent leave/enter events.

#### root
- **Type:** React.RefObject
- **Required:** No
- **Description:** The `ref` of an ancestor scrollable element to detect intersections with (instead of `window`).

#### margin
- **Type:** string
- **Required:** No
- **Default:** `"0px"`
- **Description:** A margin to add to the viewport to change the detection area. Use multiple values to adjust top/right/bottom/left, e.g. `"0px -20px 0px 100px"`.

#### amount
- **Type:** string | number
- **Required:** No
- **Default:** `"some"`
- **Description:** The amount of an element that should enter the viewport to be considered "entered". Either `"some"`, `"all"` or a number between `0` and `1`.

### Usage Example
```jsx
<motion.section
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
/>
```
```

--------------------------------

### Support layout animations for `position: fixed` elements with `layoutRoot`

Source: https://motion.dev/docs/react-motion-component

The `layoutRoot` prop is used to correctly handle layout animations for `motion` components within `position: fixed` elements. Marking an element as `layoutRoot` ensures that page scroll is accounted for, allowing fixed-position components to animate smoothly.

```jsx
<motion.div layoutRoot style={{ position: "fixed" }}>
  <motion.div layout />
</motion.div>
```

--------------------------------

### Motion useAnimate with Hybrid Animate Function

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Import useAnimate from motion/react to access the hybrid animate function that supports GSAP-style property syntax like rotate instead of transform.

```jsx
import { useAnimate } from "motion/react"
```

--------------------------------

### Scroll-Triggered Animations: GSAP ScrollTrigger vs Motion inView

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Compares scroll-triggered animation implementations. GSAP uses the ScrollTrigger plugin with frame-based scroll tracking, while Motion uses the inView function based on the Intersection Observer API for better performance and lazy initialization.

```javascript
// GSAP
gsap.to('.box', {
  scrollTrigger: '.box',
  x: 500
})

// Motion
inView(".box", ({ target }) => {
  animate(target, { x: 500 })
})
```

--------------------------------

### Apply an Easing Function to a Progress Value

Source: https://motion.dev/docs/easing-functions

Shows how to apply an imported easing function, like `easeIn`, to a `0`-`1` progress value. The function takes the current linear progress and returns an eased progress value, which can then be used to calculate animation states.

```JavaScript
const eased = easeIn(0.75)
```

--------------------------------

### Subscribe to MotionValue Change Events in JavaScript

Source: https://motion.dev/docs/motion-value

Shows how to attach a listener to a Motion Value using the `.on('change', ...)` method. The provided callback function will be executed every time the Motion Value's state updates, receiving the `latest` value as an argument.

```javascript
x.on("change", latest => console.log(latest))
```

--------------------------------

### Configure Value-Specific Transitions

Source: https://motion.dev/docs/react-transitions

Applies different transition settings to individual animated values using a default transition and value-specific overrides. The default transition applies to all values except those with explicit configurations.

```jsx
// Motion component
<motion.li
  animate={{
    x: 0,
    opacity: 1,
    transition: {
      default: { type: "spring" },
      opacity: { ease: "linear" }
    }
  }}
/>

// animate() function
animate("li", { x: 0, opacity: 1 }, {
  default: { type: "spring" },
  opacity: { ease: "linear" }
})
```

--------------------------------

### Orchestrate Child Animations with Motion for React Transition Props

Source: https://motion.dev/docs/react-animation

This code demonstrates how to control the timing of child animations relative to their parent using `transition` properties within a variant. `when: "beforeChildren"` or `"afterChildren"` and `delayChildren` (often with `stagger`) allow for precise sequencing and staggering of animations in a hierarchy.

```javascript
const list = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      delayChildren: stagger(0.3), // Stagger children by .3 seconds
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren",
    },
  },
}
```

--------------------------------

### Handle Default Value Types in Web Animations API and Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

WAAPI strictly requires unit types for animatable values (e.g., "100px"), which can lead to errors if omitted. Motion simplifies this by automatically inferring the correct default unit type for popular values, allowing developers to use unitless numbers.

```javascript
element.animate({ width: "100px" })
element.animate({ width: 100 }) // Error!
```

```javascript
animate(element, { width: 100 })
```

--------------------------------

### Basic useMotionValueEvent Hook Usage in React

Source: https://motion.dev/docs/react-use-motion-value-event

Demonstrates how to use useMotionValueEvent to listen to motion value events like 'animationStart' and 'change'. The hook automatically cleans up event handlers when the component unmounts, preventing memory leaks.

```javascript
function Component() {
  const x = useMotionValue(0)
  useMotionValueEvent(x, "animationStart", () => {
    console.log("animation started on x")
  })
  useMotionValueEvent(x, "change", (latest) => {
    console.log("x changed to", latest)
  })
  return <motion.div style={{ x }} />
}
```

--------------------------------

### Import useDragControls from Motion React

Source: https://motion.dev/docs/react-use-drag-controls

Import the useDragControls hook from the Motion React library. This hook provides drag control APIs for programmatically initiating drag gestures on motion components.

```javascript
import { useDragControls } from "motion/react"
```

--------------------------------

### Configure the 'power' option for glide easing in Motion

Source: https://motion.dev/docs/glide

The `power` option (default: 0.8) determines how much of the initial velocity influences the animation's distance. Higher values result in the animation gliding further and feeling lighter, while lower values create a heavier feel.

```javascript
glide({ power: 1 })
```

--------------------------------

### Map Motion Value to Color Range

Source: https://motion.dev/docs/map-value

Map a motion value's output to a range of color values. The output range can contain hex colors or other color formats, enabling smooth color transitions based on input motion values.

```JavaScript
const backgroundColor = mapValue(opacity, [0, 1], ["#f00", "#00f"])
```

--------------------------------

### JavaScript `frame` Utility

Source: https://motion.dev/docs/frame

The `frame` utility schedules functions to run on Motion's animation loop, providing optimized DOM interaction by preventing layout thrashing and managing `requestAnimationFrame` calls efficiently.

```APIDOC
## JavaScript Utility: `frame`

### Description
The `frame` utility schedules functions to run on Motion's animation loop, which is divided into `read`, `update`, and `render` steps. This prevents layout thrashing, provides an easy keep-alive API, and avoids performance overhead from multiple `requestAnimationFrame` calls.

### Import
```javascript
import { frame, cancelFrame } from "motion"
```
Or if `framer-motion`:
```javascript
import { frame, cancelFrame } from "framer-motion"
```

### Methods

#### `frame.read(callback, keepAlive)`
Schedules a callback to run during the `read` phase of the animation frame, suitable for reading values from or measuring the DOM.
- **callback** (function) - Required - The function to execute.
- **keepAlive** (boolean) - Optional - If `true`, the callback will be fired every frame until cancelled.

#### `frame.update(callback, keepAlive)`
Schedules a callback to run during the `update` phase of the animation frame, suitable for amending values once all values have been read.
- **callback** (function) - Required - The function to execute.
- **keepAlive** (boolean) - Optional - If `true`, the callback will be fired every frame until cancelled.

#### `frame.render(callback, keepAlive)`
Schedules a callback to run during the `render` phase of the animation frame, suitable for applying updated values to the DOM.
- **callback** (function) - Required - The function to execute.
- **keepAlive** (boolean) - Optional - If `true`, the callback will be fired every frame until cancelled.

#### `cancelFrame(callback)`
Cancels a previously scheduled callback, preventing it from running on future animation frames.
- **callback** (function) - Required - The function that was previously scheduled with `frame.read`, `frame.update`, or `frame.render`.

### Usage Examples

#### Schedule a callback
```javascript
frame.render(() => element.style.transform = "translateX(0px)")
```

#### Cancel a callback
```javascript
function measureElement() {
  console.log(element.getBoundingClientRect())
}

frame.read(measureElement)
cancelFrame(measureElement)
```

#### Animation loop (keep-alive)
```javascript
let i = 0

function update() {
  i++

  // Stop after 100 frames
  if (i >= 100) cancelFrame(update)
}

frame.update(update, true)
```
```

--------------------------------

### CSS spring animation fallback for cross-browser support

Source: https://motion.dev/docs/css

Provide fallback animations for browsers that don't support the linear() easing function. Set two transition rules with the fallback using a lower-specificity transition property.

```css
transition: filter 0.3s ease-out;
transition: filter ${spring(0.3)};
```

--------------------------------

### Generate biased random values with easing

Source: https://motion.dev/docs/mix

Combine Math.random() with easing functions to bias random value generation toward specific ranges. Use easeOut for higher values or easeIn for lower values, creating non-uniform probability distributions.

```javascript
// Mostly higher numbers
mix(0, 50, easeOut(Math.random()))

// Mostly lower numbers
mix(0, 50, easeIn(Math.random()))
```

--------------------------------

### Target Individual Split Characters with CSS

Source: https://motion.dev/docs/split-text

Explains how to style specific characters that have been split by `splitText` using CSS. It leverages the automatically applied `split-char` class and `data-index` attribute for precise targeting.

```css
.split-char[data-index=3] {
  color: red;
}
```

--------------------------------

### Animate with tween animation type

Source: https://motion.dev/docs/animate

Demonstrates tween animation configuration with duration and easing parameters. Tween animations are time-based animations that use easing curves to control acceleration and deceleration.

```javascript
animate("path", { pathLength: 1 }, { duration: 2, type: "tween" })
```

--------------------------------

### Spring animation with visual duration in React Server Components

Source: https://motion.dev/docs/css

Set spring animations on elements using the style prop in React Server Components. This approach runs entirely server-side with no runtime overhead, enabling efficient spring animation generation.

```jsx
<div style={{ transition: "all " + spring() }}>
```

```jsx
<style>{`
  button:hover {
    transition: transform ${spring(0.8, 0)};
    transform: scale(1.2);
  }
`}</style>
```

--------------------------------

### Map Motion Value to Complex String Range

Source: https://motion.dev/docs/map-value

Map a motion value to complex string values like box shadows. Each string in the output range must have identical format with the same number of values and colors in the same order.

```JavaScript
const boxShadow = mapValue(
  progress,
  [0, 1],
  ["0px 0px 0px rgba(0, 0, 0, 0)", "10px 10px 5px rgba(0, 0, 0, 0.3)"]
)
```

--------------------------------

### Import motion components from framer-motion-3d

Source: https://motion.dev/docs/react-three-fiber

This import statement brings the `motion` object into scope, allowing you to use motion-enhanced 3D components provided by `framer-motion-3d` in your React Three Fiber application.

```javascript
import { motion } from "framer-motion-3d"
```

--------------------------------

### Defining AnimatePresence exit animations using variants in React

Source: https://motion.dev/docs/react-animate-presence

Illustrates the use of variants for defining `exit` animations, allowing for more structured and complex animation sequences. Variants enable orchestration of parent and child animations using `transition` properties like `when`.

```jsx
const modalVariants = {
  visible: { opacity: 1, transition: { when: "beforeChildren" } },
  hidden: { opacity: 0, transition: { when: "afterChildren" } }
}

function Modal({ children }) {
  return (
    <motion.div initial="hidden" animate="visible" exit="hidden">
      {children}
    </motion.div>
  )
}
```

--------------------------------

### Spring animation with Tamagui

Source: https://motion.dev/docs/css

Apply spring animations in Tamagui using string concatenation in the transition property. The spring() function generates the appropriate CSS easing and duration for smooth animations.

```javascript
export const RoundedSquare = styled(View, {
  transition: "opacity " + spring(0.5)
})
```

--------------------------------

### Apply Default Transition via MotionConfig

Source: https://motion.dev/docs/react-transitions

Uses MotionConfig to set default transition settings for all motion components within its children. This centralizes animation configuration for a group of components.

```jsx
<MotionConfig transition={{ duration: 0.4, ease: "easeInOut" }}>
  <App />
</MotionConfig>
```

--------------------------------

### Import useReducedMotion Hook in React

Source: https://motion.dev/docs/react-use-reduced-motion

This snippet shows the standard way to import the `useReducedMotion` hook from the `motion/react` library. This is a prerequisite for using the hook in any React component to detect reduced motion settings.

```javascript
import { useReducedMotion } from "motion/react"
```

--------------------------------

### Create Motion Value from String Template in React

Source: https://motion.dev/docs/react-use-motion-template

Demonstrates the basic usage of `useMotionTemplate` to generate a `transform` CSS property from a `useMotionValue` instance. The `transform` motion value will automatically update when 'x' changes.

```javascript
const x = useMotionValue(100)
const transform = useMotionTemplate`transform(${x}px)`
```

--------------------------------

### Apply single motion value to multiple styles with styleEffect (JavaScript)

Source: https://motion.dev/docs/style-effect

This snippet shows the flexibility of `styleEffect` by applying a single `motionValue` (`progress`) to control multiple CSS properties simultaneously. Both `opacity` and `scaleX` of the `#progress` element will update in sync with the `progress` motion value.

```javascript
const progress = motionValue(0)

styleEffect("#progress", {
  opacity: progress,
  scaleX: progress
})
```

--------------------------------

### Create SVG Draw Animation with pathLength (JavaScript)

Source: https://motion.dev/docs/svg-effect

This snippet illustrates the use of `pathLength` for 'draw'-style animations on SVG paths. A `motionValue` set to `0.5` will display half the length of the circle's path, creating a partial drawing effect.

```javascript
const pathLength = motionValue(0.5)

svgEffect("circle", { pathLength }) // 0.5 = half path length
```

--------------------------------

### Set a minimum boundary for glide easing in Motion

Source: https://motion.dev/docs/glide

The `min` option sets a lower boundary for the `glide` animation. If the animated value falls below this limit, a `spring` animation will take over to smoothly snap the value back to the `min` boundary.

```javascript
glide({ min: -100 })
```

--------------------------------

### Set Global Default Transitions with MotionConfig in React

Source: https://motion.dev/docs/react-animation

Explains how to apply a default transition to all `motion` components within a specific scope using the `MotionConfig` component. This simplifies managing consistent animation timings across multiple elements by setting a single default duration.

```jsx
<MotionConfig transition={{ duration: 0.3 }}>
  <motion.div animate={{ opacity: 1 }} />
</MotionConfig>
```

--------------------------------

### Combine Multiple Motion Values and Static Text for CSS Filter

Source: https://motion.dev/docs/react-use-motion-template

Demonstrates `useMotionTemplate`'s ability to create a dynamic CSS `filter` string by embedding both a static value and a `useMotionValue` instance within a template literal, then applying it to a `motion.div`.

```javascript
const blur = useMotionValue(10)
const saturate = useMotionValue(50)
const filter = useMotionTemplate`blur(${10}px) saturate(${saturate}%)`
  
return <motion.div style={{ filter }} />
```

--------------------------------

### useTransform Value Mapping with Symmetrical Output

Source: https://motion.dev/docs/react-use-transform

Creates a mapping where the output has a symmetrical relationship to the input range. When input reaches 0, output is 1; when input reaches ±100, output is 0, useful for opacity and similar properties.

```javascript
const x = useMotionValue(0)
const input = [-100, 0, 100]
const output = [0, 1, 0]
const opacity = useTransform(x, input, output)
```

--------------------------------

### React: Handle Hover Events with `onHoverStart` and `onHoverEnd`

Source: https://motion.dev/docs/react-hover-animation

This snippet illustrates how to use `onHoverStart` and `onHoverEnd` event handlers on a Motion component. Unlike native browser events, these props only fire on devices where true hover is possible, explicitly ignoring touch events to prevent 'sticky' states.

```jsx
<motion.a
  onHoverStart={() => console.log('Hover starts')}
  onHoverEnd={() => console.log('Hover ends')}
/>
```

--------------------------------

### Animate CSS variables with animate()

Source: https://motion.dev/docs/animate

The hybrid version can animate CSS variables in all browsers, while the mini version only supports registered CSS properties in modern browsers. CSS variables are specified with the -- prefix.

```JavaScript
animate(element, { "--rotate": "360deg" })
```

--------------------------------

### Create number mixer with mix function

Source: https://motion.dev/docs/mix

Create a mixer function that interpolates between two numeric values. The returned function accepts a progress value (0-1) and returns the interpolated number. This is the basic use case for the mix function.

```javascript
const mixer = mix(0, 100)
mixer(0.5) // 50
```

--------------------------------

### Spring animation with Styled Components

Source: https://motion.dev/docs/css

Use spring animations in Styled Components by interpolating the spring() function directly into template literals. The function generates the complete CSS easing and duration values.

```javascript
const Button = styled.button`
  transition: opacity ${spring(0.5)};
`
```

--------------------------------

### Define animation variants for motion component

Source: https://motion.dev/docs/react-motion-component

Create reusable animation states using variants object with named states and their corresponding animation targets. Reference variants by name in initial and animate props for declarative state management.

```javascript
const variants = {
  active: {
    backgroundColor: "#f00"
  },
  inactive: {
    backgroundColor: "#fff",
    transition: { duration: 2 }
  }
}

return (
  <motion.div
    variants={variants}
    animate={isActive ? "active" : "inactive"}
  />
)
```

--------------------------------

### Retrieve MotionValue velocity with `getVelocity()`

Source: https://motion.dev/docs/react-motion-value

Demonstrates how to obtain the current velocity of a numerical motion value using `getVelocity()`. The velocity is calculated per second, which normalizes for variations in frame rate across different devices, providing a consistent measurement of motion speed.

```javascript
const xVelocity = x.getVelocity()
```

--------------------------------

### Apply Crossfade Animation with Motion's animateView() (JavaScript)

Source: https://motion.dev/docs/animate-view

This code snippet demonstrates how to use Motion's `animateView()` function to create a crossfade effect when transitioning to a new view. It defines an 'enter' animation that sets the opacity of the incoming view to 1, effectively fading it in. The `update` function (not shown) would contain the logic to change the view's content or state.

```JavaScript
// Crossfade
animateView(update).enter({ opacity: 1 })
```

--------------------------------

### Scroll-triggered Animations with useAnimate and useInView

Source: https://motion.dev/docs/react-use-animate

Combines useAnimate with useInView hook to trigger animations when the scoped element enters the viewport. Uses useEffect to monitor viewport visibility and trigger animation accordingly.

```javascript
import { useAnimate, useInView } from "motion/react"

function Component() {
  const [scope, animate] = useAnimate()
  const isInView = useInView(scope)
  
  useEffect(() => {
     if (isInView) {
       animate(scope.current, { opacity: 1 })
     }
  }, [isInView])
  
  return (
    <ul ref={scope}>
      <li />
      <li />
      <li />
    </ul>
  )
}
```

--------------------------------

### Hide Container for Enter Animations with CSS

Source: https://motion.dev/docs/split-text

Provides CSS to initially hide a container element. This prevents a 'flash of unstyled content' before JavaScript loads and performs an enter animation on the split text content.

```css
.container {
  visibility: hidden;
}
```

--------------------------------

### onViewportEnter Callback

Source: https://motion.dev/docs/react-motion-component

Event handler that fires when an element enters the viewport. Receives an IntersectionObserverEntry object with intersection details.

```APIDOC
## onViewportEnter Event Handler

### Description
Callback function that fires when an element enters the viewport. Provided the `IntersectionObserverEntry` with details of the intersection event.

### Type
Function

### Parameters
- **entry** (IntersectionObserverEntry) - Required - The intersection observer entry containing intersection details

### Properties Available
- **isIntersecting** (boolean) - Whether the element is currently intersecting
- **intersectionRect** (DOMRectReadOnly) - Rectangle describing the intersection
- **boundingClientRect** (DOMRectReadOnly) - Element's bounding rectangle
- **target** (Element) - The element being observed

### Usage Example
```jsx
<motion.div onViewportEnter={(entry) => console.log(entry.isIntersecting)} />
```
```

--------------------------------

### Immediately Updating useSpring Motion Value with jump() Method

Source: https://motion.dev/docs/react-use-spring

Demonstrates using the `.jump()` method to instantly update a `useSpring` motion value without any spring animation. This is useful for immediate state changes.

```javascript
x.jump(50)
y.jump("0vh")
```

--------------------------------

### Set mass parameter for spring animations

Source: https://motion.dev/docs/animate

Demonstrates how to configure the mass parameter for spring animations. Higher mass values result in more lethargic movement, with a default value of 1.

```javascript
animate(
  "feTurbulence",
  { baseFrequency: 0.5 },
  { type: "spring", mass: 0.5 }
)
```

--------------------------------

### Configure inView with margin option

Source: https://motion.dev/docs/inview

Apply margins to the viewport boundaries using the margin option. Supports pixel or percentage values in top/right/bottom/left order. Positive values extend boundaries, negative values contract them.

```javascript
inView(element, callback, { margin: "0px 100px 0px 0px" })
```

--------------------------------

### Set transform origin shortcut properties in React

Source: https://motion.dev/docs/react-animation

Motion provides originX, originY, and originZ shortcut properties for animating transform-origin. When set as numbers, originX and originY use progress values from 0 to 1.

```jsx
<motion.div style={{ originX: 0.5 }} />
```

--------------------------------

### Implement Justified Text Alignment for Split Lines with CSS

Source: https://motion.dev/docs/split-text

Offers a CSS solution to replicate `text-align: justify` behavior for split text lines, which is otherwise lost when using `splitText`. It achieves this by applying flexbox properties to the `split-line` class.

```css
.align-justify .split-line {
  display: flex;
  justify-content: space-between;
}
```

--------------------------------

### Enable Basic Dragging with Motion Component (React)

Source: https://motion.dev/docs/react-drag

The simplest way to make a React component draggable is by adding the `drag` prop to a `motion` component. This instantly allows users to move the element with their pointer.

```jsx
<motion.div drag />
```

--------------------------------

### Conditional Component Rendering with AnimatePresence

Source: https://motion.dev/docs/react-use-animate

Shows how to conditionally render components with exit animations using AnimatePresence wrapper. Ensures exit animations complete before component removal from DOM.

```javascript
<AnimatePresence>
  {show ? <Component key="dialog" /> : null}
</AnimatePresence>
```

--------------------------------

### Advanced Multi-Property Transition Configuration

Source: https://motion.dev/docs/react-animate-number

Set specific transition settings for different animation properties (layout, opacity, y) using value-specific configuration. This allows fine-grained control over different aspects of the animation independently.

```jsx
<AnimateNumber transition={{
  layout: { duration: 0.3 },
  opacity: { ease: "linear" },
  y: { type: "spring", visualDuration: 0.4, bounce: 0.2 }
}}>
  {count}
</AnimateNumber>
```

--------------------------------

### Create custom motion component from React component

Source: https://motion.dev/docs/react-motion-component

Transform any React component into a motion component using motion.create(). The component must forward a ref to the DOM element you want to animate. Supports both React 18 with forwardRef and React 19 with ref via props.

```javascript
const MotionComponent = motion.create(Component)
```

```javascript
const Component = React.forwardRef((props, ref) => {
  return <div ref={ref} />
})
```

```javascript
const Component = (props) => {
  return <div ref={props.ref} />
}
```

--------------------------------

### Handle Pan Gesture for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onPan` callback is triggered when a pan gesture is detected on the element. For touch input, ensure `touch-action` CSS is set to `none` for correct behavior. It provides `PointerEvent` and `info` with pan details.

```javascript
function onPan(event, info) {
  console.log(info.point.x, info.point.y)
}

<motion.div onPan={onPan} />
```

--------------------------------

### Animate springValue with Another MotionValue (JavaScript)

Source: https://motion.dev/docs/spring-value

Shows how to link `springValue` to an existing `motionValue`. The `springValue` then automatically animates changes originating from the source `motionValue`, here tied to pointer movement, applying a spring effect to the `div`'s position.

```javascript
const pointerX = motionValue(0)
const x = springValue(pointerX)

document.addEventListener("pointerMove", (e) => {
// x will animate these changes with a spring animation
pointerX.set(e.clientX)
})

styleEffect("div", { x })
```

--------------------------------

### Control animation sequence timing with 'at' option

Source: https://motion.dev/docs/animate

Animation sequence segments can be controlled to play at specific times using the 'at' option, which accepts absolute time values, relative time, or label references to create complex animation patterns.

```JavaScript
const sequence = [
  ["ul", { opacity: 1 }],
  ["li", { x: [-100, 0] }, { at: 1 }]
]

animate(sequence)
```

--------------------------------

### useTransform with Easing Functions

Source: https://motion.dev/docs/react-use-transform

Applies easing functions to the value mapping to control how interpolation occurs between output values. Supports both pre-defined easing functions and custom cubic bezier curves.

```javascript
import { cubicBezier, circOut } from "motion"
import { useTransform } from "motion/react"

const y = useTransform(x, [0, 1], [0, 2], { ease: circOut })

const z = useTransform(
  x,
  [0, 1],
  [0, 2],
  { ease: cubicBezier(0.17, 0.67, 0.83, 0.67) }
)
```

--------------------------------

### Handle element entering viewport with Framer Motion `onViewportEnter`

Source: https://motion.dev/docs/react-motion-component

The `onViewportEnter` callback fires when a `motion` component enters the viewport. It provides an `IntersectionObserverEntry` object, allowing developers to access details about the intersection event and execute custom logic, such as logging or state updates, upon element visibility.

```jsx
<motion.div onViewportEnter={(entry) => console.log(entry.isIntersecting)} />
```

--------------------------------

### Apply easing to mixed values

Source: https://motion.dev/docs/mix

Combine the mix function with easing functions to apply non-linear interpolation. Pass the progress value through an easing function (like easeInOut) before using it with the mixer to create smoother, more natural animations.

```javascript
import { mix, easeInOut } from "motion"

const mixNumber = mix(0, 100)

mixNumber(easeInOut(0.75))
```

--------------------------------

### Interrupt Animation with Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Demonstrates Motion's automatic animation interruption which smoothly transitions to the new target value. Motion interrupts existing animations on specified values and seamlessly animates to the new target.

```javascript
animate(
  element,
  { transform: "translateX(300px)" },
  { duration: 2, iterations: Infinity }
)
  
setTimeout(() => {
  animate(element, { transform: "none" }, { duration: 500 })
}, 500)
```

--------------------------------

### Define Basic Motion SVG Structure with React

Source: https://motion.dev/docs/react-svg-animation

This snippet demonstrates the basic structure for defining SVG elements using Motion's React components, where `<motion.svg>` acts as the container for other SVG elements like `<motion.circle>`.

```jsx
<motion.svg>
  <motion.circle />
</motion.svg>
```

--------------------------------

### Create persistent animation loop with frame JavaScript

Source: https://motion.dev/docs/frame

Schedule a function to run repeatedly every frame by passing `true` as the second argument. The callback can cancel itself after a certain condition is met using `cancelFrame()`.

```javascript
let i = 0

function update() {
  i++

  // Stop after 100 frames
  if (i >= 100) cancelFrame(update)
}

frame.update(update, true)
```

--------------------------------

### Apply spring transition to DOM element with JavaScript

Source: https://motion.dev/docs/css

Dynamically set spring transitions on DOM elements at runtime using the style attribute. Set the transition property before modifying other styles to ensure the animation applies to the changes.

```javascript
const element = document.querySelector("button")

element.style.transition = "transform " + spring(0.3)
element.style.transform = "scale(1.2)"
```

--------------------------------

### Define Tab Component with motion.div

Source: https://motion.dev/docs/react-animate-activity

This code defines a simple `Tab` functional component that utilizes `motion.div` from Motion to handle initial, animate, and exit opacity transitions. This component can be used as a child within `AnimateActivity`.

```jsx
function Tab() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )
}
```

--------------------------------

### Define Separate Layout and Property Transitions in Motion

Source: https://motion.dev/docs/react-layout-animations

This advanced customization demonstrates how to apply a specific transition solely for layout animations, distinct from other property animations (like `opacity`). By nesting a `layout` object within the main `transition` prop, you can precisely control layout animation timing and easing.

```jsx
<motion.div
  layout
  animate={{ opacity: 0.5 }}
  transition={{
    ease: "linear",
    layout: { duration: 0.3 }
  }}
/>
```

--------------------------------

### Configure useInView with Once Option

Source: https://motion.dev/docs/react-use-in-view

Set the 'once' option to true to stop observing an element after it enters the viewport. Once activated, the hook will always return true for that element.

```javascript
const isInView = useInView(ref, { once: true })
```

--------------------------------

### SplitText with Nested HTML Elements

Source: https://motion.dev/docs/migrate-from-gsap-to-motion

Handle nested tags in splitText by wrapping text content in separate span elements and combining split text arrays. This workaround addresses Motion's current limitation with nested tags like anchor elements.

```html
<h2>
  <span class="before">Before</span>
  <a href="#">Link</a>
  <span class="after">After</span>
</h2>

<script>
  const chars = [
    ...splitText(".before").chars,
    ...splitText("a").chars,
    ...splitText(".after").chars,
  ]
</script>
```

--------------------------------

### repeatDelay Configuration

Source: https://motion.dev/docs/animate

Set the wait duration between animation repetitions. Not available in the animate mini version.

```APIDOC
## repeatDelay Configuration

### Description
When repeating an animation, `repeatDelay` sets the duration of time to wait (in seconds) between each repetition.

### Property
**repeatDelay** (number)

### Default Value
`0`

### Availability
Not available in `animate` mini.

### Usage
```javascript
animate(
  element,
  { backgroundColor: "#fff" },
  { repeat: 1, repeatDelay: 1 }
)
```

### Parameters
- **repeatDelay** (number) - Optional - Duration in seconds between repetitions (default: 0)
```

--------------------------------

### Typewriter with instant all-content backspacing

Source: https://motion.dev/docs/react-typewriter

This snippet shows how to configure the `Typewriter` component to immediately remove all mismatching content when its child prop changes, rather than backspacing character by character. This is done by setting the `backspace="all"` prop.

```jsx
<Typewriter backspace="all">{text}</Typewriter>
```

--------------------------------

### Generate CSS transition with spring easing

Source: https://motion.dev/docs/css

Use the spring() function to generate CSS duration and easing values. The function returns a string that can be interpolated into CSS transition rules, automatically calculating the appropriate duration and linear() easing function.

```javascript
transition: transform ${spring(0.5, 0.2)};

// Outputs:
// transition: transform 800ms linear(...)
```

--------------------------------

### scroll() - Options: container

Source: https://motion.dev/docs/scroll

Specify a container element or window to track scroll progress. By default, the window scroll is tracked.

```APIDOC
## scroll() - container Option

### Description
Track scroll progress of a specific container element instead of the window. Useful for carousel elements or custom scrollable containers.

### Option Name
`container`

### Type
Element | Window

### Default Value
`window`

### Usage Example
```javascript
scroll(
  (progress) => console.log(progress),
  { container: document.getElementById("carousel") }
)
```

### Use Cases
- Track scroll within a specific div element
- Create animations tied to carousel scroll
- Monitor overflow scroll on custom containers
```

--------------------------------

### Import useTime from Motion React

Source: https://motion.dev/docs/react-use-time

Shows how to import the useTime hook from the Motion React library. This is the required import statement to use the hook in your React components.

```JavaScript
import { useTime } from "motion/react"
```

--------------------------------

### Apply an Easing Function within Steps Easing

Source: https://motion.dev/docs/easing-functions

Demonstrates how to combine the `steps` easing function with another easing function, such as `circInOut`, to modify the distribution of steps. This technique allows for non-linear step transitions within a discrete animation, making the steps themselves accelerate or decelerate.

```JavaScript
const easing = steps(4)

easing(circInOut(0.2))
```

--------------------------------

### Optimize Layout Animations with layoutDependency

Source: https://motion.dev/docs/radix

To enhance performance for layout animations, particularly when the component's state changes, the `layoutDependency` prop can be used. This tells `motion` components which specific state variable should trigger the layout animation.

```jsx
<motion.div layout layoutDependency={tab}>

```

--------------------------------

### Hover Gesture with Event Handlers

Source: https://motion.dev/docs/react-gestures

Implement hover detection with whileHover animation and onHoverStart/onHoverEnd event callbacks. The gesture fires when a pointer hovers over or leaves the component, enabling responsive animations and event-driven logic.

```jsx
<motion.a
  whileHover={{ scale: 1.2 }}
  onHoverStart={event => {}}
  onHoverEnd={event => {}}
/>
```

--------------------------------

### Use propEffect with Three.js mesh position

Source: https://motion.dev/docs/prop-effect

Shows how to apply propEffect to Three.js object properties like mesh.position. Motion values can be bound to Three.js properties for dynamic 3D transformations.

```javascript
const cube = new THREE.Mesh(geometry, material)
const x = motionValue(0)

propEffect(cube.position, { x })
```

--------------------------------

### Animate Button Hover/Tap with Motion and Tailwind CSS (React)

Source: https://motion.dev/docs/react-tailwind

This React component demonstrates how to create basic interactive animations for a button using Motion's `whileHover` and `whileTap` props, while Tailwind CSS handles the static styling. Motion applies inline styles that override Tailwind's, ensuring smooth animation behavior.

```jsx
import { motion } from "motion/react";

function Button() {
  return (
    <motion.button
      className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      Click Me!
    </motion.button>
  );
}
```

--------------------------------

### Advanced useMotionValueEvent with Manual Subscription Cleanup

Source: https://motion.dev/docs/react-use-motion-value-event

Advanced pattern using the motion value's 'on' method directly within useEffect for more control over subscription timing. Requires manual unsubscription in the cleanup function to prevent memory leaks when the component unmounts.

```javascript
useEffect(() => {
  const doSomething = () => {}
  
  const unsubX = x.on("change", doSomething)
  const unsubY = y.on("change", doSomething)
  
  return () => {
    unsubX()
    unsubY()
  }
}, [x, y])
```

--------------------------------

### Set initial animation state for motion component

Source: https://motion.dev/docs/react-motion-component

Define the initial visual state of a motion component using animation targets, variant names, or array of variants. Set initial={false} to disable enter animation and render with animate values.

```javascript
<motion.section initial={{ opacity: 0, x: 0 }} />
```

```javascript
<motion.li initial="visible" />
```

```javascript
<motion.div initial={["visible", "active"]} />
```

```javascript
<motion.div initial={false} animate={{ opacity: 0 }} />
```

--------------------------------

### scroll() - Options: offset

Source: https://motion.dev/docs/scroll

Define which parts of the target element to track within the container. Offset describes intersection points where the target and container meet.

```APIDOC
## scroll() - offset Option

### Description
Define intersection points where the target and container meet. Controls which portions of the target element trigger animation progress changes.

### Option Name
`offset`

### Type
Array<string>

### Default Value
`["start start", "end end"]`

### Offset Syntax
Each offset string contains two parts separated by space:
- First part: Position on **target** - "start" or "end"
- Second part: Position on **container** - "start" or "end"

### Common Offset Values
- **"start start"** - Top of target meets top of viewport
- **"start end"** - Top of target meets bottom of viewport (entering)
- **"end start"** - Bottom of target meets top of viewport (leaving)
- **"end end"** - Bottom of target meets bottom of viewport

### Usage Example
```javascript
// Track element entering viewport
scroll(
  animation,
  {
    target: document.getElementById("item"),
    offset: ["start end", "start start"]
  }
)
```

### Use Cases
- Track elements as they enter from bottom
- Track elements leaving at top
- Track elements throughout entire viewport
- Custom scroll trigger ranges
```

--------------------------------

### Managing Animation State Persistence in Web Animations API

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

WAAPI's default behavior often causes elements to revert to their initial state after an animation completes. While `fill: "forwards"` can persist the final state, it has implications like memory leaks. Recommended WAAPI workarounds include using a Promise handler to manually set `element.style` or pre-setting `element.style` before animating.

```javascript
element.animate({ opacity: 0 })
```

```javascript
element.animate({ opacity: 0 }, { fill: "forwards" })
```

```javascript
await element.animate({ opacity: 0 }, 200).finished
  
element.style.opacity = 0
```

```javascript
const opacity = element.style.opacity
element.style.opacity = 1
element.animate({ opacity, offset: 0 }, 200)
```

--------------------------------

### layoutRoot Property

Source: https://motion.dev/docs/react-motion-component

Mark fixed position container elements to enable correct layout animation measurements. Required for layout animations within position: fixed elements.

```APIDOC
## layoutRoot Property

### Description
For layout animations to work correctly within `position: fixed` elements, we need to account for page scroll. Add `layoutRoot` to mark an element as `position: fixed`.

### Type
boolean

### Required
No

### Usage Example
```jsx
<motion.div layoutRoot style={{ position: "fixed" }}>
  <motion.div layout />
</motion.div>
```
```

--------------------------------

### Apply Defined Variants to a Motion for React Component

Source: https://motion.dev/docs/react-animation

This snippet demonstrates how to link the previously defined `variants` object to a `motion.div` component. By setting the `variants` prop, the component gains access to the named animation targets for controlled playback.

```jsx
<motion.div variants={variants} />
```

--------------------------------

### SVG path drawing animations with animate()

Source: https://motion.dev/docs/animate

The hybrid animate() function supports line drawing animations using pathLength, pathSpacing, and pathOffset properties. All values are progress values between 0 and 1, compatible with circle, ellipse, line, path, polygon, polyline, and rect elements.

```JavaScript
animate("circle", { pathLength: [0, 1] })
```

--------------------------------

### Animate Motion Component on Tap in React

Source: https://motion.dev/docs/react-motion-component

The `whileTap` prop specifies an animation state or variant label to activate while a tap or press gesture is active. It can directly define animation targets or refer to a predefined variant.

```javascript
// As target
<motion.button whileTap={{ scale: 0.9 }} />
```

```javascript
// As variants
<motion.div whileTap="tapped" />
```

--------------------------------

### Update springValue Target with .set() Method (JavaScript)

Source: https://motion.dev/docs/spring-value

Explains how to update the target value of a `springValue` that was initialized with a number or unit string. Calling `.set()` on the motion value triggers a physics-based spring animation to the new target.

```javascript
scaleX.set(1)
rotate.set("2turn")
```

--------------------------------

### Define Animation Durations in Seconds with Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

While WAAPI and many JavaScript animation libraries define durations in milliseconds, Motion opts for seconds. This design choice aims to offer a more intuitive and approachable unit for developers, as revealed by user testing during its development.

```javascript
const animation = element.animate({ x: 50 }, { duration: 2000 })
animation.currentTime = 1000
```

```javascript
const animation = animate(element, { x: 50 }, { duration: 2 })
animation.currentTime = 1
```

--------------------------------

### Basic AnimateNumber Usage

Source: https://motion.dev/docs/react-animate-number

Create a simple AnimateNumber component that displays and animates a static number. The component accepts a single numeric child and automatically animates when the value changes.

```jsx
<AnimateNumber>300</AnimateNumber>
```

--------------------------------

### Configure spring damping to control oscillation

Source: https://motion.dev/docs/animate

Shows how to set the damping parameter for spring animations to control the strength of the opposing force. A damping value of 0 causes the spring to oscillate indefinitely, with a default value of 10.

```javascript
animate(
  "section",
  { rotate: 180 },
  { type: "spring", damping: 300 }
)
```

--------------------------------

### Control Radix Component State Externally for Exit Animations

Source: https://motion.dev/docs/radix

To enable exit animations with `AnimatePresence`, Radix components' internal state (like `isOpen`) needs to be controlled externally. This snippet demonstrates using `open` and `onOpenChange` props of a Radix Tooltip to manage its visibility state from a React component.

```jsx
const [isOpen, setOpen] = useState(false)

return (
  <Tooltip.Provider>
    <Tooltip.Root open={isOpen} onOpenChange={setOpen}>
```

--------------------------------

### Set default transition for motion component

Source: https://motion.dev/docs/react-motion-component

Define default transition configuration for a motion component using transition prop. Applied to all animation props unless overridden with specific transition values.

```javascript
<motion.div transition={{ type: "spring" }} animate={{ scale: 1.2 }} />
```

--------------------------------

### Set animation duration in Motion animate

Source: https://motion.dev/docs/animate

Shows how to configure the duration option for animations. Duration specifies how long the animation takes in seconds, with a default of 0.3 seconds or 0.8 seconds if multiple keyframes are defined.

```javascript
animate("ul > li", { opacity: 1 }, { duration: 1 })
```

--------------------------------

### Schedule callback on render phase JavaScript

Source: https://motion.dev/docs/frame

Schedule a function to execute during the render phase of Motion's animation frame, where DOM updates are applied after all values have been read and updated.

```javascript
frame.render(() => element.style.transform = "translateX(0px)")
```

--------------------------------

### Use `useAnimate` Hook for Imperative Animation Control in Motion for React

Source: https://motion.dev/docs/react-animation

This snippet demonstrates the `useAnimate` hook to gain manual control over animation playback. It allows animating any HTML/SVG element, building complex sequences, and controlling aspects like speed and playback (play/pause/stop) outside of declarative `motion` props.

```jsx
function MyComponent() {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const controls = animate([
      [scope.current, { x: "100%" }],
      ["li", { opacity: 1 }]
    ])

    controls.speed = 0.8

    return () => controls.stop()
  }, [])

  return (
    <ul ref={scope}>
      <li />
      <li />
      <li />
    </ul>
  )
}
```

--------------------------------

### Configure 'bounceDamping' for glide boundary springs in Motion

Source: https://motion.dev/docs/glide

The `bounceDamping` option (default: 10) dictates the opposing force of the `spring` animation triggered when `glide` reaches a boundary. Increasing this value reduces the bounciness of the spring effect.

```javascript
glide({ max: 100, bounceDamping: 30 })
```

--------------------------------

### Handle element leaving viewport with inView

Source: https://motion.dev/docs/inview

Return a function from the inView callback to execute code when the element leaves the viewport. Useful for stopping animations or cleaning up resources.

```javascript
inView(element,
  (element, enterInfo) => {
    const animation = animate(element, { opacity: 1 })
    
    // This will fire when the element leaves the viewport
    return (leaveInfo) => animation.stop()
  }
)
```

--------------------------------

### Import useScroll from Motion for React

Source: https://motion.dev/docs/react-use-scroll

This snippet demonstrates the standard way to import the `useScroll` hook into a React component from the `motion/react` library, making it available for use in scroll-linked animations.

```jsx
import { useScroll } from "motion/react"
```

--------------------------------

### onUpdate Callback

Source: https://motion.dev/docs/animate

Provide a callback function to receive the latest animation values on each frame update. Currently works only for single value animations.

```APIDOC
## onUpdate Callback

### Description
A function that's provided the latest animation values on each frame.

### Property
**onUpdate** (function)

### Current Limitations
Currently works only for single value animations.

### Usage
```javascript
animate("#fff", "#000", {
  duration: 2,
  onUpdate: latest => console.log(latest)
})
```

### Parameters
- **onUpdate** (function) - Optional - Callback function receiving latest animation values
```

--------------------------------

### Create Shared Element Transitions using Motion's layoutId

Source: https://motion.dev/docs/react-layout-animations

This code snippet illustrates how to use the `layoutId` prop to establish a connection between elements for shared transitions. When two elements on the page (or across different states) share the same `layoutId`, Motion can animate between their positions and sizes, enabling 'magic motion' effects.

```jsx
<motion.li layoutId="item" />
```

--------------------------------

### Focus Gesture Animation

Source: https://motion.dev/docs/react-gestures

Detect component focus using CSS :focus-visible rules with whileFocus animation. Fires when input receives focus by any means or other elements receive focus via keyboard navigation. Enables accessible keyboard-driven animations.

```jsx
<motion.a whileFocus={{ scale: 1.2 }} href="#" />
```

--------------------------------

### Animate Element by Class Selector with Motion

Source: https://motion.dev/docs/wordpress

This snippet illustrates how to apply an animation to a specific element using a CSS class selector. It rotates an element with the class 'my-class' by 20 degrees over a duration of 0.4 seconds, showcasing specific targeting for animations within WordPress.

```javascript
animate(".my-class", { rotate: [0, 20, 0] }, { duration: 0.4 })
```

--------------------------------

### Animate Motion Component on Focus in React

Source: https://motion.dev/docs/react-motion-component

The `whileFocus` prop specifies an animation state or variant label to activate when the component receives focus. It can directly define animation targets or refer to a predefined variant.

```javascript
// As target
<motion.button whileFocus={{ outline: "dashed #000" }} />
```

```javascript
// As variants
<motion.div whileFocus="focused" />
```

--------------------------------

### useTransform with Doubled Value Calculation

Source: https://motion.dev/docs/react-use-transform

Demonstrates a simple transform function that multiplies a motion value by a constant. The function is re-executed on the next animation frame whenever the source motion value changes.

```javascript
const x = useMotionValue(1)
const doubledX = useTransform(() => x.get() * 2)
```

--------------------------------

### Configure individual segment options in animation sequences

Source: https://motion.dev/docs/animate

Each segment in an animation sequence can accept all animate options (except repeatDelay and repeatType) to control duration and animation settings. Additionally, specific properties can override transitions on an individual basis.

```JavaScript
const sequence = [
  [
    "ul",
    { opacity: 1, x: 100 },
    { duration: 1, x: { duration: 2 } }
  ]
]

animate(sequence)
```

--------------------------------

### Mix multiple value types in animation sequences

Source: https://motion.dev/docs/animate

Animation sequences support mixing different value types including HTML/SVG elements, motion values, and JavaScript objects in the same sequence. This enables complex multi-target animations with unified timing control.

```JavaScript
const color = motionValue("rgba(255, 0, 0, 1)")
const box = new THREE.BoxGeometry()

const sequence = [
  ["li", { x: 100 }],
  [box.position, { y: 10 }],
  [color, "#444"]
]

animate(sequence)
```

--------------------------------

### React: Import useVelocity hook

Source: https://motion.dev/docs/react-use-velocity

This snippet shows how to import the `useVelocity` hook from the Motion library, specifically for React, making it available for use in your functional components.

```javascript
import { useVelocity } from "motion/react"
```

--------------------------------

### Apply Wildcard Keyframes to Hold Values in React Motion Animations

Source: https://motion.dev/docs/react-animation

Shows how to use `null` as a wildcard keyframe within an animation sequence to hold a value. This technique avoids repeating values explicitly, making the keyframe definition cleaner and easier to maintain for holding states.

```jsx
<motion.div
  animate={{ x: [0, 100, null, 0 ] }}
/>
```

--------------------------------

### Detect Hover on Elements by CSS Selector using Motion's hover

Source: https://motion.dev/docs/hover

This snippet illustrates how to apply hover detection to multiple elements that match a given CSS selector. In this case, it targets all `<a>` tags on the page, executing a callback function when any of them are hovered.

```javascript
hover("a", () => console.log("link hovered"))
```

--------------------------------

### Updating useSpring Motion Value with set() Method

Source: https://motion.dev/docs/react-use-spring

Illustrates how to update the target value of a `useSpring` motion value using the `.set()` method. The value will animate to the new target using the defined spring physics.

```javascript
x.set(100)
y.set("50vh")
```

--------------------------------

### Animate element opacity in React

Source: https://motion.dev/docs/react-animation

Use the animate prop to automatically transition element values when they change. The most common use case is animating opacity for fade effects.

```jsx
<motion.div animate={{ opacity: 1 }} />
```

--------------------------------

### Sequencing Child Exit Animations with Variants

Source: https://motion.dev/docs/react-animate-activity

This snippet illustrates how to apply sequenced exit animations to a list of child elements within `AnimateActivity`. By using `motion.ul` with `variants` and `delayChildren`, each `motion.li` element's exit animation can be staggered.

```jsx
<AnimateActivity mode={isVisible ? "visible" : "hidden"}>
  <motion.ul
    exit="hidden"
    variants={{
      hidden: { delayChildren: stagger(0.1) }
    }}
  >
    {items.map(item => (
      <motion.li
        variants={{ hidden: { opacity: 0 }}}
      >
        {item.title}
      </motion.li>
    ))}
  </motion.ul>
</AnimateActivity>
```

--------------------------------

### Create Rotating Animation with useTime and useTransform

Source: https://motion.dev/docs/react-use-time

Demonstrates how to use useTime to create a motion value that tracks elapsed time, then compose it with useTransform to rotate a div 360 degrees over 4 seconds. The clamp option is set to false to allow continuous rotation.

```JavaScript
const time = useTime();
const rotate = useTransform(time, [0, 4000], [0, 360], { clamp: false });

return <motion.div style={{ rotate }} />
```

--------------------------------

### Chain springValue to another MotionValue (JavaScript)

Source: https://motion.dev/docs/spring-value

Demonstrates creating a `springValue` that derives its input from another `motionValue`, potentially after a transformation with `mapValue`. This allows the `springValue` to animate changes from the upstream motion value with a spring effect.

```javascript
const opacity = motionValue(1)
const x = mapValue(opacity, [0, 1], [0, 100])
const xWithSpring = springValue(x)
```

--------------------------------

### Apply MotionValue to `motion` component style in React

Source: https://motion.dev/docs/react-motion-value

Illustrates how to integrate a motion value, `x`, into a `motion` component. By passing `x` to the `style` prop of a `<motion.li />` element, its corresponding CSS property (e.g., `translateX` if `x` is a number) will be controlled and animated by the motion value.

```jsx
<motion.li style={{ x }} />
```

--------------------------------

### Generate random values with mix function

Source: https://motion.dev/docs/mix

Use Math.random() as the progress value to generate random interpolated values. By default produces a uniform linear distribution across the range, but can be combined with easing functions to bias the distribution toward higher or lower values.

```javascript
const x = mix(100, 400, Math.random())
```

--------------------------------

### Chain MotionValues with `useTransform` in React

Source: https://motion.dev/docs/react-motion-value

This snippet shows how to create a new motion value (`opacity`) by transforming an existing one (`x`) using `useTransform`. The `opacity` will dynamically change based on the `x` value, providing a powerful way to create interconnected animations. The `motion.div` is made draggable on the x-axis to illustrate the effect.

```javascript
const x = useMotionValue(0)
const opacity = useTransform(
  x,
  [-200, 0, 200],
  [0, 1, 0]
)

// Will change opacity as element is dragged left/right
return <motion.div drag="x" style={{ x, opacity }} />
```

--------------------------------

### Animate transform properties with hybrid version

Source: https://motion.dev/docs/animate

The hybrid version of animate() supports independent transform axis animations including translate (x, y, z), scale (scale, scaleX, scaleY), rotate (rotate, rotateX, rotateY, rotateZ), skew (skew, skewX, skewY), and perspective transformations.

```JavaScript
animate("div", { rotate: 360 })
```

--------------------------------

### useTransform Value Mapping - Basic Color Interpolation

Source: https://motion.dev/docs/react-use-transform

Maps a single motion value from an input range to an output range. When the input motion value changes within the specified range, the output values are interpolated accordingly.

```javascript
const x = useMotionValue(0)
const color = useTransform(x, [0, 100], ["#f00", "#00f"])
```

--------------------------------

### Set Default Transition on Motion Component

Source: https://motion.dev/docs/react-transitions

Applies a default transition configuration directly to a single motion.div component. This transition will be used for all animations on that component unless overridden.

```jsx
<motion.div
  animate={{ x: 100 }}
  transition={{ type: "spring", stiffness: 100 }}
/>
```

--------------------------------

### Spring Animation - stiffness Property

Source: https://motion.dev/docs/react-transitions

Control the stiffness of the spring. Default is 1. Higher stiffness values create more sudden, reactive movement with quicker responses.

```APIDOC
## Spring Animation - stiffness

### Description
Stiffness of the spring affects how quickly the spring responds. Higher stiffness values create more sudden, reactive movement, while lower values create more gradual animations.

### Property
**stiffness** (number) - Optional - Default: 1

### Parameters
- **stiffness** (number) - Optional - Default: 1 - Spring stiffness multiplier
- **type** (string) - Required - Set to "spring"

### Request Example
```jsx
<motion.section
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', stiffness: 50 }}
/>
```

### Response
- Higher stiffness values create more sudden, snappy movement
- Lower stiffness values create more gradual, flowing animations
- Default stiffness of 1 provides moderate responsiveness
```

--------------------------------

### AnimatePresence for animating component key changes in React

Source: https://motion.dev/docs/react-animate-presence

Demonstrates using `AnimatePresence` to animate a component's exit and entry when its `key` prop changes. This pattern is effective for components like sliders or carousels where content swaps frequently.

```jsx
<AnimatePresence>
  <Slide key={activeItem.id} />
</AnimatePresence>
```

--------------------------------

### inView callback with element and IntersectionObserverEntry

Source: https://motion.dev/docs/inview

Access both the matched element and the IntersectionObserverEntry object containing intersection details in the callback function.

```javascript
inView("a", (element, info) => {
  console.log("The link ", element, " has entered the viewport")
})
```

--------------------------------

### Handle Pan Gesture End for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onPanEnd` callback is invoked when a pan gesture concludes. It receives the `PointerEvent` and an `info` object with the final pan details, such as `delta`.

```javascript
<motion.div onPanEnd={(event, info) => console.log(info.delta.x)} />
```

--------------------------------

### Compose MotionValues with functional `useTransform`

Source: https://motion.dev/docs/react-motion-value

Shows an advanced use of `useTransform` where a new motion value `y` is created based on a function that accesses the current state of another motion value `x`. This powerful pattern allows for complex derived values and intricate transformations between motion values.

```javascript
const y = useTransform(() => x.get() * 2)
```

--------------------------------

### Customize Layout Animation Transition in Motion

Source: https://motion.dev/docs/react-layout-animations

This snippet shows how to customize the transition properties specifically for a layout animation. By passing a `transition` object to the `motion.div`, you can control aspects like `duration`, `ease`, and `delay` for all animated properties, including layout changes.

```jsx
<motion.div layout transition={{ duration: 0.3 }} />
```

--------------------------------

### Create shared element layout animations with Framer Motion `layoutId`

Source: https://motion.dev/docs/react-motion-component

The `layoutId` property enables shared element transitions between components. When a new element with a matching `layoutId` enters the DOM, it animates from the position and size of the previously existing element, creating seamless transitions for elements like underlines or selected states.

```jsx
{items.map(item => (
   <motion.li layout>
      {item.name}
      {item.isSelected && <motion.div layoutId="underline" />}
   </motion.li>
))}
```

--------------------------------

### scroll() - Options: target

Source: https://motion.dev/docs/scroll

Track the progress of an element as it moves within a container. By default, the scrollable area of the container is tracked.

```APIDOC
## scroll() - target Option

### Description
Track an element's progress as it moves within its container. Enables animations tied to specific element positioning rather than raw scroll distance.

### Option Name
`target`

### Type
Element

### Default Value
Scrollable area of container

### Usage Example
```javascript
scroll(
  animation,
  { target: document.getElementById("item") }
)
```

### Use Cases
- Track element entry/exit from viewport
- Section-based full-screen effects
- Element position-based animations
- Parallax effects tied to element visibility
```

--------------------------------

### Basic AnimatePresence exit animation in React

Source: https://motion.dev/docs/react-animate-presence

Demonstrates the fundamental usage of `AnimatePresence` to enable an exit animation for a `motion.div` component. When the `show` condition becomes false, the component will fade out with `opacity: 0` before being removed from the DOM.

```jsx
<AnimatePresence>
  {show && <motion.div key="modal" exit={{ opacity: 0 }} />}
</AnimatePresence>
```

--------------------------------

### Set Custom Viewport with Root Option

Source: https://motion.dev/docs/react-use-in-view

Use the 'root' option to specify a scrollable parent element as the viewport instead of the window. Pass a ref to the scrollable container to track visibility within that element.

```javascript
import { useRef } from "react"
import { useInView } from "motion/react"

function Carousel() {
  const container = useRef(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { root: container })

  return (
    <div ref={container} style={{ overflow: "scroll" }}>
      <div ref={ref} />
    </div>
  )
}
```

--------------------------------

### Configure viewport tracking for Framer Motion components

Source: https://motion.dev/docs/react-motion-component

The `viewport` property defines how an element is tracked within the viewport, supporting options like `once` for single-trigger events, `root` to specify a custom scrollable ancestor, `margin` to adjust detection area, and `amount` for defining the visibility threshold. This allows precise control over when animations are triggered based on an element's visibility.

```jsx
<motion.section
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
/>
```

--------------------------------

### Animate single values and colors with onUpdate callback

Source: https://motion.dev/docs/animate

The hybrid animate() function can interpolate between numeric or color values and output them to an onUpdate callback function for custom handling. This is useful when animating values that don't correspond to DOM properties.

```JavaScript
// Numbers
animate(0, 100, {
  onUpdate: latest => console.log(latest)
})

// Colors
animate("#fff", "#000", {
  duration: 2,
  onUpdate: latest => console.log(latest)
})
```

--------------------------------

### Create Tween Animation with Duration and Easing

Source: https://motion.dev/docs/react-transitions

Implements a tween animation using duration and easing function type. Tween animations are set with a duration and an easing curve for smooth, predictable transitions.

```jsx
<motion.path
  animate={{ pathLength: 1 }}
  transition={{ duration: 2, type: "tween" }}
/>
```

--------------------------------

### Handle Tap Event on Release Inside Component in React

Source: https://motion.dev/docs/react-motion-component

The `onTap` callback is triggered when a pointer stops pressing a `motion` component and is released *inside* the component's bounds. It provides the triggering `PointerEvent`.

```javascript
<motion.div onTap={(event) => console.log(event)} />
```

--------------------------------

### Apply Custom CSS Spring Easing Utility Class with Tailwind CSS

Source: https://motion.dev/docs/react-tailwind

This HTML snippet demonstrates how to apply a custom CSS spring easing utility class, previously defined in the Tailwind CSS theme, to an element. It uses `transition-transform`, `duration-700`, and the custom `ease-spring-soft` class to achieve a specific spring animation effect.

```html
<div className="transition-transform duration-700 ease-spring-soft">
</div>
```

--------------------------------

### Animate with Multiple Concurrent Motion for React Variants

Source: https://motion.dev/docs/react-animation

This code snippet illustrates how to apply multiple named variants simultaneously to a `motion` component. By passing an array of variant names to the `animate` prop, the component will combine the animation properties defined in each variant.

```jsx
animate={["visible", "danger"]}
```

--------------------------------

### Configure 'bounceStiffness' for glide boundary springs in Motion

Source: https://motion.dev/docs/glide

The `bounceStiffness` option (default: 100) controls the attraction force of the `spring` animation that activates when `glide` hits a `min` or `max` boundary. Higher values result in faster, sharper rebound movements.

```javascript
glide({ min: 100, bounceStiffness: 500 })
```

--------------------------------

### Apply Single Motion Value to Multiple SVG Properties (JavaScript)

Source: https://motion.dev/docs/svg-effect

This code shows how a single `motionValue` (`progress`) can drive multiple SVG properties (`pathLength` and `pathOffset`) simultaneously. This enables synchronized animations on different properties based on one controlling value.

```javascript
const progress = motionValue(0)

svgEffect("#progress", {
  pathLength: progress,
  pathOffset: progress
})
```

--------------------------------

### Retrieve MotionValue Velocity with getVelocity() in JavaScript

Source: https://motion.dev/docs/motion-value

Shows how to obtain the current velocity of a Motion Value using the `.getVelocity()` method. This is useful for physics-based animations or understanding the rate of change of an animated property.

```javascript
const velocity = x.getVelocity()
```

--------------------------------

### Update MotionValue State with set() in JavaScript

Source: https://motion.dev/docs/motion-value

Illustrates using the `.set()` method to directly update the current state of a Motion Value. This method instantly changes the value without animation, triggering any subscribed `change` listeners.

```javascript
x.set(100)
```

--------------------------------

### Basic Ticker Component Usage

Source: https://motion.dev/docs/react-ticker

Create a basic horizontal ticker by passing an array of React nodes (components, strings, or numbers) to the items prop. The component automatically handles the infinitely-scrolling animation.

```jsx
const items = [
  <span>One</span>,
  <span>Two</span>,
  <span>Three</span>
]

return <Ticker items={items} />
```

--------------------------------

### useMotionValueEvent Hook

Source: https://motion.dev/docs/react-use-motion-value-event

Manages motion value event handlers with automatic lifecycle cleanup. Provides a declarative way to listen to motion value events like change and animation lifecycle events without manual subscription management.

```APIDOC
## useMotionValueEvent Hook

### Description
Manages a motion value event handler throughout the lifecycle of a React component. Event handlers are automatically cleaned up when the component unmounts.

### Import
```javascript
import { useMotionValueEvent } from "motion/react"
```

### Syntax
```javascript
useMotionValueEvent(motionValue, eventName, callback)
```

### Parameters
- **motionValue** (MotionValue) - Required - The motion value to listen to
- **eventName** (string) - Required - The event to listen for: "change", "animationStart", "animationComplete", or "animationCancel"
- **callback** (function) - Required - Callback function invoked when the event occurs

### Available Events
- **change** - Fired when the motion value changes. Callback receives the latest value
- **animationStart** - Fired when an animation starts on the motion value
- **animationComplete** - Fired when an animation completes on the motion value
- **animationCancel** - Fired when an animation is cancelled on the motion value

### Usage Example
```javascript
function Component() {
  const x = useMotionValue(0)
  
  useMotionValueEvent(x, "animationStart", () => {
    console.log("animation started on x")
  })
  
  useMotionValueEvent(x, "change", (latest) => {
    console.log("x changed to", latest)
  })
  
  return <motion.div style={{ x }} />
}
```

### Multiple Event Listeners
```javascript
const color = useMotionValue("#00f")

useMotionValueEvent(color, "change", (latest) => {
  console.log("Color changed to:", latest)
})
```

### Advanced Usage with motion.on()
For more control over subscription timing, use the motion value's `on` method directly with manual cleanup:
```javascript
useEffect(() => {
  const doSomething = () => {}
  
  const unsubX = x.on("change", doSomething)
  const unsubY = y.on("change", doSomething)
  
  return () => {
    unsubX()
    unsubY()
  }
}, [x, y])
```

### Features
- Automatic cleanup on component unmount
- Declarative event handling
- Supports multiple event listeners on the same motion value
- Change events provide the latest motion value
- Works with any motion value created by useMotionValue

### Related Hooks
- useMotionValue - Creates a motion value
- useMotionTemplate - Creates a motion string
- useScroll - Tracks scroll position as motion values
```

--------------------------------

### Typewriter with word-level backspacing

Source: https://motion.dev/docs/react-typewriter

When the `children` prop changes, this configuration animates the `Typewriter` by backspacing character by character until a word boundary or special character is reached, then types out the new content. This is achieved using the `backspace="word"` prop.

```jsx
<Typewriter backspace="word">{text}</Typewriter>
```

--------------------------------

### restDelta Configuration

Source: https://motion.dev/docs/animate

Configure the minimum distance threshold for ending spring animations. The animation terminates when both the distance falls below restDelta and speed is below restSpeed.

```APIDOC
## restDelta Configuration

### Description
End animation if distance is below this value and speed is below `restSpeed`. When animation ends, the spring will end.

### Property
**restDelta** (number)

### Default Value
`0.01`

### Usage
```javascript
animate(
  ".my-element",
  { x: 200 },
  { type: "spring", restDelta: 0.5 }
)
```

### Parameters
- **restDelta** (number) - Optional - Minimum distance threshold below which animation ends (default: 0.01)
```

--------------------------------

### Animate JavaScript objects with animate()

Source: https://motion.dev/docs/animate

Any JavaScript object can be animated including numeric and color properties. This enables animation of complex objects such as Three.js Object3D instances, allowing properties like rotation to be smoothly interpolated.

```JavaScript
const values = {
  x: 100,
  color: "#f00"
}

animate(values, { x: 200, color: "#00f" })

// Three.js example
const camera = new THREE.Camera()
animate(camera.rotation, { y: 360 }, { duration: 10 })
```

--------------------------------

### Animate height to and from auto in React

Source: https://motion.dev/docs/react-animation

Motion uniquely supports animating width and height properties to and from 'auto', enabling responsive animations that adapt to content size changes.

```jsx
<motion.div
  initial={{ height: 0 }}
  animate={{ height: "auto" }}
/>
```

--------------------------------

### Define Multiple Keyframes with Easing Functions

Source: https://motion.dev/docs/react-transitions

Animates through multiple keyframes with different easing functions applied between each pair of values. Each easing function controls the curve between consecutive keyframes.

```jsx
<motion.div
  animate={{
    x: [0, 100, 0],
    transition: { ease: ["easeIn", "easeOut"] }
  }}
/>
```

--------------------------------

### Define animate target for motion component

Source: https://motion.dev/docs/react-motion-component

Specify animation target values using animate prop with object notation for specific properties or variant names. Supports multiple variants as array for sequential or parallel animations.

```javascript
<motion.div
  initial={{ boxShadow: "0px 0px #000" }}
  animate={{ boxShadow: "10px 10px #000" }}
/>
```

```javascript
<motion.li animate="visible" />
```

```javascript
<motion.div initial="hidden" animate={["visible", "active"]} />
```

--------------------------------

### layoutId Property

Source: https://motion.dev/docs/react-motion-component

Enable shared layout animations between components. When a new element with matching layoutId enters the DOM, it animates from the previous element's size and position.

```APIDOC
## layoutId Property

### Description
If set, this component will animate changes to its layout. Additionally, when a new element enters the DOM and an element already exists with a matching `layoutId`, it will animate out from the previous element's size/position. If the previous component remains in the tree, the two elements will crossfade.

### Type
string

### Required
No

### Usage Example
```jsx
{items.map(item => (
   <motion.li layout>
      {item.name}
      {item.isSelected && <motion.div layoutId="underline" />}
   </motion.li>
))}
```
```

--------------------------------

### Style Motion+ Cursor Component with CSS in React

Source: https://motion.dev/docs/cursor

This JSX snippet illustrates how to apply custom styles to the `Cursor` component using both a CSS class name (`className`) and inline styles (`style` prop), enabling full visual customization.

```jsx
<Cursor className="my-cursor" style={{ backgroundColor: "red" }} />
```

--------------------------------

### onDrag Callback

Source: https://motion.dev/docs/react-motion-component

Callback function that fires when the drag gesture is recognized on the element. Provides drag information including point coordinates, delta, offset, and velocity.

```APIDOC
## onDrag

### Description
Callback function that fires when the drag gesture is recognised on this element. Pan and drag events are provided the origin `PointerEvent` as well as an object `info` that contains coordinate data.

### Callback Signature
```jsx
function onDrag(event, info) {
  // event: PointerEvent
  // info: DragInfo
}
```

### Info Object Properties
- **point** (Object) - Relative to the device or page
  - **x** (number) - X coordinate
  - **y** (number) - Y coordinate
- **delta** (Object) - Distance since the last event
  - **x** (number) - X delta
  - **y** (number) - Y delta
- **offset** (Object) - Distance from the original event
  - **x** (number) - X offset
  - **y** (number) - Y offset
- **velocity** (Object) - Current velocity of the pointer
  - **x** (number) - X velocity
  - **y** (number) - Y velocity

### Usage Example
```jsx
function onDrag(event, info) {
  console.log(info.point.x, info.point.y)
}

<motion.div drag onDrag={onDrag} />
```
```

--------------------------------

### Configure Custom Character Class for splitText

Source: https://motion.dev/docs/split-text

Shows how to override the default class name for split characters using the `charClass` option in `splitText`. This allows developers to use their own custom class names for styling hooks.

```javascript
splitText(element, { charClass: "my-char-class" })
```

--------------------------------

### Forward motion props to custom components

Source: https://motion.dev/docs/react-motion-component

Configure motion.create() with forwardMotionProps option to pass motion-specific props like animate to the wrapped component. By default, motion props are filtered out.

```javascript
motion.create(Component, { forwardMotionProps: true })
```

--------------------------------

### Use transform shortcuts in motion style prop

Source: https://motion.dev/docs/react-animation

Motion's enhanced style prop supports transform shorthand values like x, y, and z for static positioning without animation.

```jsx
<motion.section style={{ x: -20 }} />
```

--------------------------------

### Cancel Animation with WAAPI

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Demonstrates using WAAPI's animate function with the cancel method to stop and remove an animation completely. The animation is cancelled after 500ms, reverting the element to its original state as if the animation never played.

```javascript
const animation = element.animate({ opacity: 0 }, { duration: 1000 })
setTimeout(() => { animation.cancel()}, 500)
```

--------------------------------

### Apply Motion Values and Transforms to React Style Prop

Source: https://motion.dev/docs/react-motion-component

The `style` prop for `motion` components extends the standard React DOM `style` prop, allowing the integration of motion values and independent transforms like `x` and `rotate`. This enables dynamic animation of CSS properties.

```javascript
const x = useMotionValue(30)

return <motion.div style={{ x, rotate: 90, originX: 0.5 }} />
```

--------------------------------

### layoutDependency Property

Source: https://motion.dev/docs/react-motion-component

Optimize layout animation performance by specifying when layout measurements should be recalculated. Measurements only occur when the dependency value changes.

```APIDOC
## layoutDependency Property

### Description
By default, layout changes are detected every render. To reduce measurements and thus improve performance, you can pass a `layoutDependency` prop. Measurements will only occur when this value changes.

### Type
any

### Required
No

### Usage Example
```jsx
<motion.nav layout layoutDependency={isOpen} />
```
```

--------------------------------

### React: Apply Simple Hover Animation with `whileHover` Prop

Source: https://motion.dev/docs/react-hover-animation

This code snippet demonstrates the simplest way to add a hover animation to a Motion component. By defining a `whileHover` prop with a target animation state, the component will animate to these values when hovered and return to its original state when the hover gesture ends.

```jsx
<motion.button whileHover={{ scale: 1.1 }} />
```

--------------------------------

### Implement Exit Animations with AnimatePresence in React Motion

Source: https://motion.dev/docs/react-animation

Explains how to use the `AnimatePresence` component to enable exit animations for components being removed from the DOM. `AnimatePresence` keeps the component mounted temporarily to allow an `exit` animation to complete before it is unmounted.

```jsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```

--------------------------------

### Synchronize Layout Animations with LayoutGroup React

Source: https://motion.dev/docs/react-layout-animations

Shows how to use Motion's LayoutGroup component to synchronize layout animations across multiple child components that don't re-render simultaneously. When layout changes are detected in any grouped motion component, animations trigger across all of them, ensuring coordinated visual updates.

```javascript
import { LayoutGroup } from "motion/react"

function List() {
  return (
    <LayoutGroup>
      <Accordion />
      <Accordion />
    </LayoutGroup>  
  )
}
```

--------------------------------

### Trigger Effects on useInView State Change

Source: https://motion.dev/docs/react-use-in-view

Use useEffect hook to trigger functions when the isInView state changes. This pattern enables side effects like logging, animations, or data fetching based on element visibility.

```javascript
import { useEffect } from "react"

useEffect(() => {
  console.log("Element is in view: ", isInView)
}, [isInView])
```

--------------------------------

### Configure the 'restDistance' option for spring easing in Motion

Source: https://motion.dev/docs/glide

The `restDistance` option (default: 0.5, or 0.01 for scale) sets the distance from the animation target below which a `spring` animation is considered finished. This is useful for `spring` animations initiated by `glide` boundary conditions.

```javascript
spring({ restDistance: 0.1 })
```

--------------------------------

### Control Motion Animation Playback with play() (JavaScript)

Source: https://motion.dev/docs/animate

The `play()` method controls the playback of a Motion animation, allowing it to resume or restart. If the animation is paused, it will resume from its current time; if it has finished, it will restart from the beginning.

```javascript
animation.pause()

// Will resume from 1 second
animation.time = 1
animation.play()

// Will play from start
await animation
animation.play()
```

--------------------------------

### Configure Spring Transition for AnimateNumber

Source: https://motion.dev/docs/react-animate-number

Customize the animation behavior using the transition prop with Motion's spring animation type. This creates a bouncy, elastic animation effect for number changes.

```jsx
<AnimateNumber transition={{ type: "spring" }}>
  {count}
</AnimateNumber>
```

--------------------------------

### Linking Animation to an Element's Progress with 'target' Option

Source: https://motion.dev/docs/scroll

This snippet shows how to use the `target` option to link an animation to the scroll progress of a specific HTML element. The animation will then progress as `item` moves within its scrollable container or viewport.

```javascript
scroll(
  animation
  { target: document.getElementById("item") }  
)
```

--------------------------------

### Reverse a Custom Easing Function with reverseEasing

Source: https://motion.dev/docs/easing-functions

Illustrates the use of the `reverseEasing` modifier to create a new easing function that is the inverse of an existing one. This transforms an 'ease in' function into an 'ease out' equivalent, useful for symmetrical animation effects like transitions where an element enters and exits with opposite acceleration profiles.

```JavaScript
import { reverseEasing } from "motion"

const powerIn = (progress) => progress * progress

const powerOut = reverseEasing(powerIn)
```

--------------------------------

### Detect press on multiple elements using CSS selector

Source: https://motion.dev/docs/press

Use CSS selectors to attach press gesture listeners to multiple elements at once. The callback fires for each element matching the selector.

```javascript
press("a", () => console.log("link pressed"))
```

--------------------------------

### Configure `restDelta` for Spring Animations in Motion

Source: https://motion.dev/docs/animate

Sets the threshold for `restDelta` in a spring animation. The animation ends if the distance falls below this value and speed is low. Defaults to `0.01`.

```javascript
animate(
  ".my-element",
  { x: 200 },
  { type: "spring", restDelta: 0.5 }
)
```

--------------------------------

### Interrupt Animation with WAAPI

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Shows WAAPI's default behavior where a new animation overrides an existing one without interruption. If the old animation is still running when the new one finishes, the value appears to jump back to the old animation.

```javascript
element.animate(
  { transform: ["none", "translateX(300px)"] },
  { duration: 2000, iterations: Infinity, direction: "alternate" }
)
  
setTimeout(() => {
  element.animate({ transform: "none" }, { duration: 500 })
}, 500)
```

--------------------------------

### wrap Function - Value Wrapping

Source: https://motion.dev/docs/wrap

The wrap function takes a minimum value, maximum value, and a target value, then constrains the target value within the range with wraparound behavior. This is particularly useful for implementing pagination controls or cyclic operations.

```APIDOC
## wrap Function

### Description
Wraps a value within a limited range. Values within the range remain unchanged, while values outside the range wrap around to the opposite end of the range.

### Function Signature
```javascript
wrap(min: number, max: number, value: number): number
```

### Parameters
- **min** (number) - Required - The minimum boundary of the range
- **max** (number) - Required - The maximum boundary of the range
- **value** (number) - Required - The value to wrap within the range

### Return Value
- **number** - The wrapped value constrained within the [min, max) range

### Usage Examples

#### Example 1: Value Within Range
```javascript
import { wrap } from "motion"

wrap(0, 10, 5) // Returns: 5
```
When the value is within the range, it remains unchanged.

#### Example 2: Value Exceeds Maximum
```javascript
import { wrap } from "motion"

wrap(0, 100, 150) // Returns: 50
wrap(0, 10, 11)   // Returns: 1
```
When the value exceeds the maximum, it wraps back to the beginning of the range.

#### Example 3: Value Below Minimum
```javascript
import { wrap } from "motion"

wrap(0, 10, -1) // Returns: 9
```
When the value is below the minimum, it wraps to the end of the range.

#### Example 4: Pagination Use Case
```javascript
import { wrap } from "motion"

const numItems = 10
const currentIndex = 4
const nextIndex = wrap(0, numItems, currentIndex + 1)
// When currentIndex is 4, nextIndex becomes 5
// When currentIndex is 9, nextIndex becomes 0 (wraps around)
```
Useful for implementing next/previous pagination logic with automatic wraparound.

### Import
```javascript
import { wrap } from "motion"
```

### Notes
- The range is [min, max) - inclusive of min, exclusive of max
- Commonly used in carousel/pagination implementations
- Works with negative ranges and decimal values
```

--------------------------------

### Detect Hover on Specific Element by ID using Motion's hover

Source: https://motion.dev/docs/hover

This code demonstrates attaching a hover detection callback directly to a specific DOM element identified by its ID. The provided callback function will execute when the hover gesture begins on that particular element, logging a message.

```javascript
hover(
  document.getElementById("my-id"),
  () => {
    console.log("my-id hovered!")
  }
)
```

--------------------------------

### Customizing the Scroll Container with the 'container' Option

Source: https://motion.dev/docs/scroll

This code demonstrates how to use the `container` option to explicitly define which scrollable element `scroll()` should observe. Here, it tracks the scroll progress of an HTML element with the ID 'carousel' instead of the default window.

```javascript
scroll(
  (progress) => console.log(progress),
  { container: document.getElementById("carousel") }  
)
```

--------------------------------

### Spring Animation - visualDuration Property

Source: https://motion.dev/docs/react-transitions

Configure the visual duration of a spring animation in seconds. This property overrides the standard duration and controls when the bulk of the transition occurs, with the bouncy effect happening after.

```APIDOC
## Spring Animation - visualDuration

### Description
Overrides the standard duration property to set a specific visual duration in seconds. The animation's main transition occurs before this time, with the bouncy effect mostly happening after, making it easier to coordinate with other time-based animations.

### Property
**visualDuration** (number) - Required - Time in seconds for the animation to visually reach its target

### Parameters
- **visualDuration** (number) - Required - Duration in seconds
- **bounce** (number) - Optional - Bounce intensity (0-1)
- **type** (string) - Required - Set to "spring"

### Request Example
```jsx
<motion.div
  animate={{ rotateX: 90 }}
  transition={{
    type: "spring",
    visualDuration: 0.5,
    bounce: 0.25
  }}
/>
```

### Response
- Animation will visually complete the main transition in 0.5 seconds
- Bouncy effect occurs after the 0.5 second mark
```

--------------------------------

### Handle Animation Completion Event for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onAnimationComplete` callback fires when an animation (excluding layout animations) finishes on a `motion` component. It's provided with the target or variant name of the completed animation.

```javascript
<motion.circle
  animate={{ r: 10 }}
  onAnimationComplete={latest => console.log(latest.r)}
/>
```

--------------------------------

### Connecting scroll to an Animation in JavaScript

Source: https://motion.dev/docs/scroll

This snippet illustrates how to link a Motion `animate()` function directly to `scroll()`. This creates a scroll-linked animation, where the `div`'s transform property changes based on scroll progress, utilizing hardware acceleration via `ScrollTimeline` where supported.

```javascript
const animation = animate(
  "div",
  { transform: ["none", "rotate(90deg)"] },
  { ease: "linear" }
)  

scroll(animation)
```

--------------------------------

### onDragEnd Callback

Source: https://motion.dev/docs/react-motion-component

Callback function that fires when a drag gesture ends. Provided the triggering PointerEvent and info object with final drag data.

```APIDOC
## onDragEnd

### Description
Callback function that fires when a drag gesture ends. Provided the triggering `PointerEvent` and `info`.

### Callback Signature
```jsx
function onDragEnd(event, info) {
  // event: PointerEvent
  // info: DragInfo
}
```

### Info Object Properties
- **point** (Object) - Final pointer position
- **delta** (Object) - Total distance moved
- **offset** (Object) - Total distance from origin
- **velocity** (Object) - Final pointer velocity

### Usage Example
```jsx
<motion.div drag onDragEnd={(event, info) => console.log(info.delta.x)} />
```
```

--------------------------------

### AnimatePresence for conditional component rendering in React

Source: https://motion.dev/docs/react-animate-presence

Illustrates how `AnimatePresence` handles exit animations when a child component is conditionally mounted or unmounted based on a state variable, such as a modal appearing and disappearing.

```jsx
<AnimatePresence>
  {show && <Modal key="modal" />}
</AnimatePresence>
```

--------------------------------

### Set Animation Repetition Count with Motion `repeat`

Source: https://motion.dev/docs/animate

Defines how many times an animation should repeat. Setting `repeat` to `Infinity` creates a perpetual animation. Defaults to `0`.

```javascript
animate(
  element,
  { backgroundColor: "#fff" },
  { repeat: Infinity, duration: 2 }
)
```

--------------------------------

### Wrap AnimatePresence in LayoutGroup for Coordinated Layout Animations (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

When combining exit animations with layout animations, especially with `mode="sync"`, wrapping `AnimatePresence` within a `LayoutGroup` ensures that components outside `AnimatePresence` are aware of layout changes. This allows for coordinated layout animations across different parts of the UI, preventing conflicts and ensuring smooth transitions for all elements affected by the exiting component.

```jsx
<LayoutGroup>
  <motion.ul layout>
    <AnimatePresence>
      {items.map(item => (
        <motion.li layout key={item.id} />
      ))}
    </AnimatePresence>
  </motion.ul>
</LayoutGroup>
```

--------------------------------

### Animate Motion Component on Hover in React

Source: https://motion.dev/docs/react-motion-component

The `whileHover` prop defines an animation state or variant label to activate when a hover gesture is active. It can directly specify animation targets or reference a predefined variant.

```javascript
// As target
<motion.button whileHover={{ scale: 1.2 }} />
```

```javascript
// As variants
<motion.div whileHover="hovered" />
```

--------------------------------

### Cancel propEffect updates with cleanup function

Source: https://motion.dev/docs/prop-effect

Shows how to stop applying motion value changes to an object by calling the cancel function returned by propEffect. This is useful for cleaning up effects when components unmount.

```javascript
const rotateX = motionValue(0)
const cancel = propEffect(threeRotation, { x: rotateX })

cancel()
```

--------------------------------

### Animate React motion values

Source: https://motion.dev/docs/animate

The hybrid animate() function can accept a React motion value as the target, automatically updating it with the latest animation values. This integrates with the Motion library's motion value system.

```JavaScript
const x = motionValue(0)

animate(x, 200, { duration: 0.5 })
```

--------------------------------

### Optimize layout animations with Framer Motion `layoutDependency`

Source: https://motion.dev/docs/react-motion-component

The `layoutDependency` prop allows developers to control when layout measurements are performed. By providing a dependency value, measurements and subsequent layout animations will only occur when this value changes, reducing unnecessary computations and improving performance.

```jsx
<motion.nav layout layoutDependency={isOpen} />
```

--------------------------------

### inView Function

Source: https://motion.dev/docs/inview

The `inView` function from Motion.js detects when one or more elements enter or leave the viewport. It's built on the native Intersection Observer API for optimal performance and a small footprint. It enables use cases like animating elements on scroll, lazy loading, and controlling media playback based on visibility.

```APIDOC
## FUNCTION inView

### Description
Detects when elements enter and leave the viewport. `inView` is built on the browser's native Intersection Observer API, providing excellent performance and a tiny filesize. It fires a callback when the observed element's visibility changes relative to a root element's viewport.

### Method
Function Call

### Endpoint
`inView(target, callback, [options])`

### Parameters
#### Arguments
- **target** (string | Element | Element[]) - Required - A CSS selector string (e.g., `"section"`), a single DOM `Element` object (e.g., `document.getElementById("box")`), or an array of `Element` objects. These are the elements whose visibility `inView` will observe.
- **callback** (function) - Required - A function that is executed when the `target` element(s) enter the viewport.
  - **Arguments**:
    - `element` (Element): The DOM element that triggered the callback.
    - `info` (IntersectionObserverEntry): An object containing information about the intersection change.
  - **Return Value**: The callback can optionally return another function. If a function is returned, it will be executed when the element leaves the viewport.
- **options** (object) - Optional - An object to configure the `inView` behavior. See "Options" section below for details.

### Options
These options can be passed as the third argument to the `inView` function.

#### `root`
- **Type**: `Element | null`
- **Default**: `window`
- **Description**: The element whose bounding box is used as the viewport for checking target visibility. If `null` or `undefined`, the browser's viewport (window) is used.
- **Example**:
  ```javascript
  const carousel = document.querySelector("#carousel");
  inView("#carousel li", callback, { root: carousel });
  ```

#### `margin`
- **Type**: `string`
- **Default**: `"0"`
- **Description**: One or more margins to apply to the viewport. This extends or contracts the point at which the element is considered inside or outside the viewport. Can be defined in pixels or percentages. Accepts up to four values (top/right/bottom/left), similar to CSS `margin` shorthand.
- **Example**:
  ```javascript
  inView(element, callback, { margin: "0px 100px 0px 0px" });
  ```
- **Note**: Positive values extend the boundaries; negative values pull them in. Due to browser security, `margin` won't affect cross-origin iframes unless `root` is explicitly defined.

#### `amount`
- **Type**: `string | number`
- **Default**: `"some"`
- **Description**: The proportion of the target element that needs to be within the viewport boundaries to be considered "in view".
  - `"some"`: Any part of the element is visible.
  - `"all"`: The entire element is visible.
  - A number between `0` and `1`: Represents a percentage (e.g., `0.5` means 50% of the element is visible).
- **Example**:
  ```javascript
  inView(element, callback, { amount: "all" });
  inView(element, callback, { amount: 0.75 }); // 75% in view
  ```

### Request Example
#### Basic Usage with Selector
```javascript
import { inView, animate } from "motion";

inView("#carousel li", (element) => {
  animate(element, { opacity: 1 });
  console.log("Element entered viewport:", element);

  // Return a function to stop animation when element leaves
  return (leaveInfo) => {
    console.log("Element left viewport:", element, leaveInfo);
    // animation.stop() // Assuming 'animate' returns a controllable animation object
  };
});
```

#### Usage with Element
```javascript
const box = document.getElementById("box");
inView(box, (element, info) => {
  console.log("Box is in view:", element, info);
});
```

#### Stop Detection
```javascript
const stopDetection = inView(element, callback);
// ... later ...
stopDetection(); // Stops observing the element
```

### Return Value
`inView` returns a function. Calling this returned function will stop the viewport detection for the observed elements.
```javascript
const stop = inView(element, callback);
stop(); // Stops detection
```
```

--------------------------------

### Trigger Callback on Motion Component Update in React

Source: https://motion.dev/docs/react-motion-component

The `onUpdate` callback is executed every frame when any value within the `motion` component updates. It provides a single argument with the latest values, useful for logging or reacting to real-time animation changes.

```javascript
<motion.article
  animate={{ opacity: 1 }}
  onUpdate={latest => console.log(latest.opacity)}
/>
```

--------------------------------

### Define exit animation for removed components

Source: https://motion.dev/docs/react-motion-component

Use exit prop to animate a motion component when it's removed from the DOM tree. Component must be a direct child of AnimatePresence wrapper to enable exit animations.

```javascript
<AnimatePresence>
  {isVisible && (
    <ul key="list">
      <motion.li exit={{ opacity: 0 }} />
    </ul>
  )}
</AnimatePresence>
```

--------------------------------

### Propagate Motion for React Variants to Child Components

Source: https://motion.dev/docs/react-animation

This snippet shows how variants defined on a parent `motion` component (`motion.ul`) can propagate down to its children (`motion.li`). When the parent animates, its children that also have the specified variant (e.g., 'visible') will animate in sequence, orchestrating complex layouts.

```jsx
const list = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}

const item = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -100 },
}

return (
  <motion.ul
    initial="hidden"
    whileInView="visible"
    variants={list}
  >
    <motion.li variants={item} />
    <motion.li variants={item} />
    <motion.li variants={item} />
  </motion.ul>
)
```

--------------------------------

### Cancel attrEffect Updates with Cleanup Function

Source: https://motion.dev/docs/attr-effect

Demonstrates how attrEffect returns a cleanup function that can be called to stop applying motion value changes to elements. This is useful for cleanup when elements are removed or effects are no longer needed.

```javascript
const cx = motionValue(0)
const cy = motionValue(0)
const cancel = attrEffect("circle", { cx, cy })

cancel()
```

--------------------------------

### Configure the 'restSpeed' option for spring easing in Motion

Source: https://motion.dev/docs/glide

The `restSpeed` option (default: 2, or 0.05 for scale) defines the absolute speed (units per second) below which a `spring` animation is considered complete. This is relevant when `glide` transitions to a `spring` animation due to boundary hits.

```javascript
spring({ restSpeed: 1 })
```

--------------------------------

### Animate Individual Transforms with Motion

Source: https://motion.dev/docs/performance

Motion allows animation of individual transform properties (x, scale, etc.) using a simplified syntax. Under the hood, Motion animates CSS variables applied to the transform property. Note that CSS variable animations are not currently hardware accelerated.

```javascript
animate(".box", { x: 100, scale: 2 })
```

--------------------------------

### custom Property

Source: https://motion.dev/docs/react-motion-component

Pass custom data to dynamic variants for dynamic animation calculations. Useful for staggering animations or varying transitions based on component index.

```APIDOC
## custom Property

### Description
Custom data to pass through to dynamic variants. This value will be passed to variant functions, allowing you to create dynamic animations.

### Type
any

### Required
No

### Usage Example
```jsx
const variants = {
  visible: (custom) => ({
    opacity: 1,
    transition: { delay: custom * 0.2 }
  })
}

return (
  <motion.ul animate="visible">
    <motion.li custom={0} variants={variants} />
    <motion.li custom={1} variants={variants} />
    <motion.li custom={2} variants={variants} />
  </motion.ul>
)
```
```

--------------------------------

### Detect successful press completion with info object

Source: https://motion.dev/docs/press

The press end callback receives an info object with a success property indicating if the press was completed (true) or cancelled (false). Success is false when the press ends outside the element.

```javascript
press(element, () => {
  return (endEvent, info) => {
    console.log("press ", info.success ? "end" : "cancel")
  }
})
```

--------------------------------

### Access pressed element and PointerEvent details

Source: https://motion.dev/docs/press

The press callback receives the pressed element and the triggering PointerEvent as arguments. Use these to access event details like client coordinates.

```javascript
press("div:nth-child(2)", (element, startEvent) => {
  console.log("Pressed", element)
  console.log("At", startEvent.clientX, startEvent.clientY)
})
```

--------------------------------

### Use popLayout Mode with AnimatePresence for Reflowing Elements (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

The `popLayout` mode in `AnimatePresence` removes exiting elements from the page layout, allowing surrounding content to reflow immediately. This mode is particularly effective when combined with the `layout` prop on `motion` components, enabling them to animate smoothly to their new positions. When using custom components with `popLayout`, they must be wrapped in `React.forwardRef`.

```jsx
<AnimatePresence>
  {items.map(item => (
    <motion.li layout exit={{ opacity: 0 }} />
  ))}
</AnimatePresence>
```

--------------------------------

### transformTemplate Property

Source: https://motion.dev/docs/react-motion-component

Customize the order and format of CSS transform functions. Accept transform values and generated string to return a modified transform string.

```APIDOC
## transformTemplate Property

### Description
By default, transforms are applied in order of `translate`, `scale`, `rotate` and `skew`. To change this, `transformTemplate` can be set as a function that accepts the latest transforms and the generated transform string and returns a new transform string.

### Type
Function

### Parameters
The function receives either:
- **Option 1:** An object containing the latest transform values (x, y, z, scale, scaleX, scaleY, rotate, rotateX, rotateY, rotateZ, skew, skewX, skewY)
- **Option 2:** Two parameters: `latest` (transform values object) and `generated` (the default transform string)

### Returns
A string representing the custom transform value

### Usage Examples
```jsx
// Use the latest transform values
<motion.div
  style={{ x: 0, rotate: 180 }}
  transformTemplate={
    ({ x, rotate }) => `rotate(${rotate}deg) translateX(${x}px)`
  }
/>

// Or the generated transform string
<motion.div
  style={{ x: 0, rotate: 180 }}
  transformTemplate={
    (latest, generated) => `translate(-50%, -50%) ${generated}`
  }
/>
```
```

--------------------------------

### Stop Animation with Motion

Source: https://motion.dev/docs/improvements-to-the-web-animations-api-dx

Shows Motion's stop method which cancels an animation but preserves the element's current state, unlike WAAPI's cancel method. The animation stops after 500ms while maintaining the element's position at that moment.

```javascript
const animation = animate(element, { opacity: 0 }, { duration: 1000 })
setTimeout(() => { animation.stop()}, 500)
```

--------------------------------

### Configure the 'decay' option for glide easing in Motion

Source: https://motion.dev/docs/glide

The `decay` option (default: 0.325) is a time constant in seconds that controls the rate of velocity decay. Higher values lead to longer animations with more gradual deceleration, imparting a lighter feel to the movement.

```javascript
glide({ decay: 0.5 })
```

--------------------------------

### Manually controlling component removal with usePresence hook in React

Source: https://motion.dev/docs/react-animate-presence

Shows how to use the `usePresence` hook to gain explicit control over when an exiting component is removed from the DOM. It returns `isPresent` state and a `safeToRemove` callback, which can be invoked after custom animations or delays.

```jsx
function Component() {
  const [isPresent, safeToRemove] = usePresence()

  useEffect(() => {
    // Remove from DOM 1000ms after being removed from React
    !isPresent && setTimeout(safeToRemove, 1000)
  }, [isPresent])

  return <div />
}
```

--------------------------------

### whileInView Property

Source: https://motion.dev/docs/react-motion-component

Target or variants label to apply while the element is in view. Enables scroll-triggered animations in React.

```APIDOC
## whileInView

### Description
Target or variants to label to while the element is in view. Used for scroll-triggered animations.

### Property Type
Object | String

### Usage Example (As Target)
```jsx
<motion.div whileInView={{ opacity: 1 }} />
```

### Usage Example (As Variants)
```jsx
<motion.div whileInView="visible" />
```
```

--------------------------------

### Animate specific layout properties with Framer Motion `layout`

Source: https://motion.dev/docs/react-motion-component

The `layout` property can accept string values like `"position"` or `"size"` to limit layout animations to only those specific properties. This provides fine-grained control over which aspects of a component's layout are animated, optimizing performance and animation focus.

```jsx
<motion.img layout="position" />
```

--------------------------------

### Stop inView detection with returned function

Source: https://motion.dev/docs/inview

The inView function returns a stop function that halts viewport detection when called. Useful for cleanup or removing listeners.

```javascript
const stop = inView(element, callback)

stop()
```

--------------------------------

### Wrap a Value within a Limited Range using Motion.js

Source: https://motion.dev/docs/wrap

The `wrap` function from Motion.js takes a minimum, maximum, and a value, returning the value wrapped within that range. It's useful for cyclical operations like pagination or carousel indexes, ensuring the value always stays within `min` and `max`.

```javascript
import { wrap } from "motion";

// Example: wrapping for next/prev pagination
const numItems = 10;
const currentIndex = 9;
const nextIndex = wrap(0, numItems, currentIndex + 1);
console.log(nextIndex); // If currentIndex is 9, numItems is 10, nextIndex will be 0

// Example: Value within range is unaffected
console.log(wrap(0, 10, 5)); // 5

// Example: Value exceeding max wraps around to min
console.log(wrap(0, 10, 11)); // 1

// Example: Value falling below min wraps around to max
console.log(wrap(0, 10, -1)); // 9

// Another example from text
console.log(wrap(0, 100, 150)); // 50
```

--------------------------------

### Set a maximum boundary for glide easing in Motion

Source: https://motion.dev/docs/glide

The `max` option defines an upper boundary for the `glide` animation. Should the animated value exceed this limit, a `spring` animation will intervene to gently snap the value back to the `max` boundary.

```javascript
glide({ max: 100 })
```

--------------------------------

### Set visual duration for spring animations

Source: https://motion.dev/docs/animate

Shows how to use visualDuration to override the animation duration, specifying how long the animation takes to visually reach its target in seconds. This makes it easier to coordinate spring animations with time-based animations.

```javascript
animate(
  "section",
  { rotateX: 90 },
  { type: "spring", visualDuration: 0.5, bounce: 0.25 }
)
```

--------------------------------

### Applying nested exit animations within a React component

Source: https://motion.dev/docs/react-animate-presence

Shows how `motion` components nested within an exiting parent component can execute their own `exit` animations. The parent `motion.div` will animate out, followed by its child `motion.p` animating out before the entire component is removed.

```jsx
function Slide({ img, description }) {
  return (
    <motion.div exit={{ opacity: 0 }}>
      <img src={img.src} />
      <motion.p exit={{ y: 10 }}>{description}</motion.p>
    </motion.div>
  )
}
```

--------------------------------

### dragSnapToOrigin Property

Source: https://motion.dev/docs/react-motion-component

When enabled, the draggable element will animate back to its center/origin when released. Useful for creating snap-back behavior.

```APIDOC
## dragSnapToOrigin

### Description
If `true`, the draggable element will animate back to its center/origin when released.

### Default Value
`false`

### Property Type
Boolean

### Usage Example
```jsx
<motion.div drag dragSnapToOrigin />
```
```

--------------------------------

### Apply dragConstraints with a Ref to Another Element (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragConstraints` prop can also accept a `ref` to another DOM element, using that element's bounding box as the draggable area. This provides dynamic constraints, allowing the draggable component to move only within the boundaries of the referenced container. The `useRef` hook is used to create and pass the reference.

```jsx
const MyComponent = () => {
  const constraintsRef = useRef(null)

  return (
     <motion.div ref={constraintsRef}>
         <motion.div drag dragConstraints={constraintsRef} />
     </motion.div>
  )
}
```

--------------------------------

### Update Motion Values with attrEffect

Source: https://motion.dev/docs/attr-effect

Shows how to update motion values after they have been applied to elements using attrEffect. When progress.set() or animate() is called, the element re-renders on the next animation frame with the new attribute value.

```javascript
progress.set(1)
animate(progress, 1)
```

--------------------------------

### Stop Motion Animation and Commit Styles with stop() (JavaScript)

Source: https://motion.dev/docs/animate

The `stop()` method halts a Motion animation and commits all current animated values directly to the element's style. Crucially, an animation stopped using this method cannot be restarted.

```javascript
const animation = animate(element, { opacity: 0 })
animation.stop()
```

--------------------------------

### Animate Child Elements with Selector

Source: https://motion.dev/docs/react-use-animate

Shows how to animate child elements using CSS selectors scoped to the parent element. Selectors are automatically scoped to only match descendants of the ref element, not page-wide matches.

```javascript
animate("li", { backgroundColor: "#000" }, { ease: "linear" })
```

--------------------------------

### Controlling nested AnimatePresence exit animation propagation in React

Source: https://motion.dev/docs/react-animate-presence

Compares the default behavior of nested `AnimatePresence` components, where only the direct child's exit animation fires, with using the `propagate` prop. Setting `propagate` to `true` allows children of a nested `AnimatePresence` to also execute their exit animations when the outer `AnimatePresence` triggers unmounting.

```jsx
<AnimatePresence>
  {show ? (
    <motion.section exit={{ opacity: 0 }}>
      <AnimatePresence>
        {/*
          * When `show` becomes `false`, exit animations
          * on these children will not fire.
          */}
        {children}
      </AnimatePresence>
    </motion.section>
  ) : null}
</AnimatePresence>

<AnimatePresence>
  {show ? (
    <motion.section exit={{ opacity: 0 }}>
      <AnimatePresence propagate>
        {/*
          * When `show` becomes `false`, exit animations
          * on these children **will** fire.
          */}
        {children}
      </AnimatePresence>
    </motion.section>
  ) : null}
</AnimatePresence>
```

--------------------------------

### Jump MotionValue to New State and Reset Velocity with jump() in JavaScript

Source: https://motion.dev/docs/motion-value

Illustrates the `.jump()` method, which immediately sets a Motion Value to a new state, resets its velocity to `0`, and stops any active animations. This is useful for sudden state changes that should not be smoothly transitioned.

```javascript
animate(x, 100)

x.jump(10)
x.getVelocity() // 0
```

--------------------------------

### Tap Gesture Animation

Source: https://motion.dev/docs/react-gestures

Detect primary pointer (left click or first touch) tap events with whileTap animation. The gesture fires a tap event when pointer releases on the same component, or tapCancel if pointer moves outside. Automatically cancels if parent is draggable and pointer moves >3 pixels.

```jsx
<motion.button whileTap={{ scale: 0.9, rotate: 3 }} />
```

--------------------------------

### Use mix with progress values outside 0-1 range

Source: https://motion.dev/docs/mix

The mix function accepts progress values outside the standard 0-1 range for extrapolation. Values greater than 1 or less than 0 will extrapolate beyond the original value range, useful for easing functions or animations that overshoot.

```javascript
const mixNumber = mix(0, 100)

mixNumber(2) // 200
mixNumber(-1) // -100
```

--------------------------------

### AnimatePresence for dynamic list item animations in React

Source: https://motion.dev/docs/react-animate-presence

Explains how `AnimatePresence` can be used to animate the removal of items from a dynamically rendered list. Each `motion.li` must have a unique `key` prop for `AnimatePresence` to track its presence.

```jsx
<AnimatePresence>
  {items.map(item => (
    <motion.li key={item.id} exit={{ opacity: 1 }} layout />
  ))}
</AnimatePresence>
```

--------------------------------

### Directly Update Element Height with JavaScript

Source: https://motion.dev/docs/performance

This JavaScript line directly updates an element's `height` property. Such a change triggers a browser re-render, involving layout recalculations, painting, and compositing, which can significantly impact animation performance due to its cost.

```javascript
element.style.height = "500px"
```

--------------------------------

### Clean up resize listeners

Source: https://motion.dev/docs/resize

Remove attached resize listeners by calling the function returned by resize(). When all listeners are removed from an element, it is removed from the ResizeObserver, and when no listeners remain, the ResizeObserver is stopped.

```javascript
const stop = resize(log)
stop()
```

--------------------------------

### Tracking Scroll of a Specific Element in JavaScript

Source: https://motion.dev/docs/scroll

This snippet shows how to specify a custom container element for `scroll()` to track its scroll progress, rather than the default `window` object. This is useful for animations within specific scrollable regions of a page.

```javascript
scroll(callback, { container: document.getElementById("scroller") })
```

--------------------------------

### Override Default Transitions with Specific Hover Transitions in React Motion

Source: https://motion.dev/docs/react-animation

Demonstrates how a specific transition defined directly on an animation prop (like `whileHover`) takes precedence over a component-level or globally defined default transition. This allows for fine-grained control over individual animation states while maintaining general defaults.

```jsx
<motion.div
  animate={{ opacity: 1 }}
  whileHover={{
    opacity: 0.7,
    transition: { duration: 0.3 }
  }}
  transition={{ duration: 0.5 }}
/>
```

--------------------------------

### Transform with Clamping Disabled (JavaScript)

Source: https://motion.dev/docs/transform

By default, `transform` clamps the output to the defined output range. This snippet shows how to disable clamping using the `{ clamp: false }` option, allowing the returned function to map values infinitely beyond the input range.

```javascript
const transformer = transform([0, 100], [0, 360], { clamp: false })

const rotation = transformer(200) // 720
```

--------------------------------

### Animate MotionValue with Counter Effect in React

Source: https://motion.dev/docs/react-animation

Uses the `useMotionValue` hook to create an animated counter that increments from 0 to 100 over 5 seconds. The MotionValue is rendered directly in a motion.pre component, providing better performance than setting React state. The `animate` function controls the animation with cleanup on component unmount.

```jsx
import { useMotionValue, motion, animate } from "motion/react"

function Counter() {
  const count = useMotionValue(0)

  useEffect(() => {
    const controls = animate(count, 100, { duration: 5 })
    return () => controls.stop()
  }, [])

  return <motion.pre>{count}</motion.pre>
}
```

--------------------------------

### Add Delay Between Animation Repeats with Motion `repeatDelay`

Source: https://motion.dev/docs/animate

Sets the duration, in seconds, to wait between each animation repetition. Note that this option is not available in the `animate` mini version. Defaults to `0`.

```javascript
animate(
  element,
  { backgroundColor: "#fff" },
  { repeat: 1, repeatDelay: 1 }
)
```

--------------------------------

### Animate Scoped Element Directly

Source: https://motion.dev/docs/react-use-animate

Demonstrates animating the scoped element itself using scope.current reference. This allows direct property modifications on the element with specified animation options like duration.

```javascript
animate(scope.current, { opacity: 1 }, { duration: 1 })
```

--------------------------------

### React Item Component for Accordion Layout Animation

Source: https://motion.dev/docs/react-layout-group

Defines a React functional component `Item` that uses Framer Motion's `layout` prop to animate its layout changes. It manages its open/closed state and conditionally renders content. Clicking the item toggles its state, triggering layout animations.

```jsx
function Item({ header, content }) {
const [isOpen, setIsOpen] = useState(false)
return (
<motion.div
layout
onClick={() => setIsOpen(!isOpen)}
>
<motion.h2 layout>{header}</motion.h2>
{isOpen ? content : null}
</motion.div>
)
}
```

--------------------------------

### Handle Tap Cancel Event on Release Outside Component in React

Source: https://motion.dev/docs/react-motion-component

The `onTapCancel` callback fires when a pointer stops pressing a `motion` component but is released *outside* the component's boundaries. It receives the triggering `PointerEvent`.

```javascript
<motion.div onTapCancel={(event) => console.log(event)} />
```

--------------------------------

### Configure Margin for useInView Detection Area

Source: https://motion.dev/docs/react-use-in-view

Use the 'margin' option to expand or contract the viewport detection area. Accepts CSS margin-like values (top, right, bottom, left) to adjust when elements are considered in view.

```javascript
const isInView = useInView(ref, {
  margin: "0px 100px -50px 0px"
})
```

--------------------------------

### useTransform with Trigonometric Animation

Source: https://motion.dev/docs/react-use-transform

Uses useTime hook with a transform function to create sinusoidal animations. Calculates the Y position based on elapsed time and a specified distance parameter.

```javascript
const distance = 100
const time = useTime()
const y = useTransform(() => Math.sin(time.get() / 1000) * distance)
```

--------------------------------

### dragControls Property

Source: https://motion.dev/docs/react-motion-component

Allows programmatic control of drag gestures using the useDragControls hook. Enables initiating drag from different components than the draggable element.

```APIDOC
## dragControls

### Description
Usually, dragging is initiated by pressing down on a component and moving it. For some use-cases, for instance clicking at an arbitrary point on a video scrubber, you might want to initiate dragging from a different component. By creating a `dragControls` using the `useDragControls` hook, you can pass this into the draggable component's `dragControls` prop. It exposes a `start` method that can start dragging from pointer events on other components.

### Property Type
DragControls

### Methods
- **start(event, options)** - Starts drag gesture from a pointer event
  - **event** (PointerEvent) - Required - The pointer event
  - **options** (Object) - Optional - Configuration options
    - **snapToCursor** (boolean) - Optional - Snap to cursor position

### Usage Example
```jsx
const dragControls = useDragControls()

function startDrag(event) {
  dragControls.start(event, { snapToCursor: true })
}

return (
  <>
    <div onPointerDown={startDrag} />
    <motion.div drag="x" dragControls={dragControls} />
  </>
)
```

### Tip
When using `dragControls`, you can disable the draggable element as the initiator by setting `dragListener={false}`.
```

--------------------------------

### Animate SVG Path Drawing with Motion pathLength in React

Source: https://motion.dev/docs/react-svg-animation

This snippet illustrates how to create a 'hand-drawn' line animation for an SVG `<motion.path>` using the `pathLength` property. It animates the path from an initial state of no length (0) to its full length (1).

```jsx
<motion.path
  d={d}
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
/>
```

--------------------------------

### Define Animation Targets as a Variants Object in Motion for React

Source: https://motion.dev/docs/react-animation

This code defines a JavaScript object named `variants` containing named animation targets like `visible` and `hidden`. These named targets can then be reused and orchestrated across multiple `motion` components.

```javascript
const variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}
```

--------------------------------

### Gesture Animation Props with Variants

Source: https://motion.dev/docs/react-gestures

Reference animation variants defined in the variants prop instead of inline values. This approach allows variants to flow down through children components and promotes code reusability. The button and nested SVG path use named variants for their animations.

```jsx
<motion.button
  whileTap="tap"
  whileHover="hover"
  variants={buttonVariants}
>
  <svg>
    <motion.path variants={iconVariants} />
  </svg>
</motion.button>
```

--------------------------------

### Conditionally Render Shared Layout Elements with Motion

Source: https://motion.dev/docs/react-layout-animations

This snippet demonstrates conditional rendering of a `motion.div` with a `layoutId`. When the condition (`isSelected`) becomes true, the element appears, and if there's an existing element with the same `layoutId`, Motion automatically animates its entrance from the old element's position.

```jsx
isSelected && <motion.div layoutId="underline" />
```

--------------------------------

### onViewportLeave Callback

Source: https://motion.dev/docs/react-motion-component

Event handler that fires when an element leaves the viewport. Receives an IntersectionObserverEntry object with intersection details.

```APIDOC
## onViewportLeave Event Handler

### Description
Callback function that fires when an element leaves the viewport. Provided the `IntersectionObserverEntry` with details of the intersection event.

### Type
Function

### Parameters
- **entry** (IntersectionObserverEntry) - Required - The intersection observer entry containing intersection details

### Properties Available
- **isIntersecting** (boolean) - Whether the element is currently intersecting
- **intersectionRect** (DOMRectReadOnly) - Rectangle describing the intersection
- **boundingClientRect** (DOMRectReadOnly) - Element's bounding rectangle
- **target** (Element) - The element being observed

### Usage Example
```jsx
<motion.div onViewportLeave={(entry) => console.log(entry.intersectionRect)} />
```
```

--------------------------------

### Spring Animation - mass Property

Source: https://motion.dev/docs/react-transitions

Set the mass of the moving object in spring animations. Default is 1. Higher values create more lethargic, slower movement as if the object has more weight.

```APIDOC
## Spring Animation - mass

### Description
Represents the mass of the animated object. Higher mass values result in slower, more lethargic movement as if the object is heavier. Lower values create snappier animations.

### Property
**mass** (number) - Optional - Default: 1

### Parameters
- **mass** (number) - Optional - Default: 1 - Object mass multiplier
- **type** (string) - Required - Set to "spring"

### Request Example
```jsx
<motion.feTurbulence
  animate={{ baseFrequency: 0.5 }}
  transition={{ type: "spring", mass: 0.5 }}
/>
```

### Response
- Mass value of 0.5 creates lighter, snappier movement
- Higher mass values (e.g., 2.0+) create heavier, slower animations
- Default mass of 1 provides standard spring behavior
```

--------------------------------

### Handle Hover End Event for Motion Components in React

Source: https://motion.dev/docs/react-motion-component

The `onHoverEnd` callback is triggered when a pointer stops hovering over a `motion` component. It provides the triggering `PointerEvent` as an argument, useful for responding to hover state changes.

```javascript
<motion.div onHoverEnd={(event) => console.log(event)} />
```

--------------------------------

### Handle onDragEnd Callback Event (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `onDragEnd` callback function is invoked once when a drag gesture concludes, typically when the pointer is released. Like other drag callbacks, it provides the `PointerEvent` and an `info` object. This function is ideal for finalizing positions, saving states, or triggering post-drag animations.

```jsx
<motion.div drag onDragEnd={(event, info) => console.log(info.delta.x)} />
```

--------------------------------

### useTime with useTransform Composition

Source: https://motion.dev/docs/react-use-time

Demonstrates composing useTime with useTransform to map elapsed time (0 to 4000 milliseconds) to rotation values (0 to 360 degrees). The clamp option set to false allows the animation to continue beyond the specified range for perpetual rotation.

```JavaScript
const time = useTime()
const rotate = useTransform(
  time,
  [0, 4000], // For every 4 seconds...
  [0, 360], // ...rotate 360deg
  { clamp: false }
)
```

--------------------------------

### Enable strict mode in LazyMotion for Motion React

Source: https://motion.dev/docs/react-reduce-bundle-size

Set the `strict` prop on LazyMotion to throw an error if the full `motion` component is used anywhere within its scope. This prevents accidental preloading of all features and helps maintain the benefits of using the lightweight `m` component.

```jsx
function App() {
  return (
    <LazyMotion strict>
      <motion.div />
    </LazyMotion>
  )
}
```

--------------------------------

### Compose Multiple TransformValues for Complex CSS Transforms in JavaScript

Source: https://motion.dev/docs/transform-value

This snippet demonstrates how `transformValue` outputs can be composed. It creates a `rotate` motion value from `x` and `y`, then a `transform` motion value that combines `x`, `y`, and the derived `rotate` into a single CSS `translate3d` and `rotate` string, enabling sophisticated chained animations.

```javascript
const x = motionValue(0)
const y = motionValue(0)
const rotate = transformValue(() => x.get() + y.get())
const transform = transformValue(() => `translate3d(${x.get()}px ${y.get()}px 0) rotate(${rotate.get()}deg)`)
```

--------------------------------

### Inertia Animation - bounceStiffness Property

Source: https://motion.dev/docs/react-transitions

Control the stiffness of the spring used when bouncing against min/max constraints. Default is 500. Higher values create more sudden bounce movement.

```APIDOC
## Inertia Animation - bounceStiffness

### Description
When min or max constraints are set, this controls the stiffness of the spring animation used for the bounce effect. Higher values create more sudden, reactive bouncing, while lower values create softer, more gradual bounces.

### Property
**bounceStiffness** (number) - Optional - Default: 500

### Parameters
- **bounceStiffness** (number) - Optional - Default: 500 - Spring stiffness for bounce
- **min** (number) - Optional - Minimum boundary
- **max** (number) - Optional - Maximum boundary
- **type** (string) - Optional - Set to "inertia"

### Request Example
```jsx
<motion.div
  drag
  dragTransition={{
    min: 0,
    max: 100,
    bounceStiffness: 100
  }}
/>
```

### Response
- bounceStiffness of 100 creates softer, gradual bounces
- Default 500 provides standard bounce responsiveness
- Higher values create snappier, more energetic bounces
```

--------------------------------

### Mix complex string values

Source: https://motion.dev/docs/mix

Mix complex strings containing multiple values like CSS properties. The function intelligently parses and interpolates numeric and color components within the string, returning the mixed result in the same format.

```javascript
const mixComplex = mix("0px 0px #fff", "100px 100px #000")

mixComplex(0.5) // 50px 50px rgba(128, 128, 128, 1)
```

--------------------------------

### React Accordion Component with LayoutGroup

Source: https://motion.dev/docs/react-layout-group

Demonstrates how to wrap multiple `ToggleContent` items within Framer Motion's `LayoutGroup`. This enables coordinated layout animations between the sibling components, ensuring smooth visual transitions as their states change and affecting each other's layout.

```jsx
import { LayoutGroup } from "motion/react"
  

function Accordion() {
return (
<LayoutGroup>
<ToggleContent />
<ToggleContent />
</LayoutGroup>
)
}
```

--------------------------------

### Spring Animation - restDelta Property

Source: https://motion.dev/docs/react-transitions

Set the distance threshold for animation completion. Default is 0.01. Animation ends when distance is below this value and speed is below restSpeed.

```APIDOC
## Spring Animation - restDelta

### Description
End animation when distance is below this threshold AND speed is below restSpeed. When both conditions are met, the spring animation completes and the value is set to its final target.

### Property
**restDelta** (number) - Optional - Default: 0.01

### Parameters
- **restDelta** (number) - Optional - Default: 0.01 - Distance threshold
- **restSpeed** (number) - Optional - Speed threshold for completion
- **type** (string) - Required - Set to "spring"

### Request Example
```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', restDelta: 0.5 }}
/>
```

### Response
- Animation completes when remaining distance is below 0.5 units
- Works in conjunction with restSpeed
- Spring ends smoothly without overshooting once conditions are met
```

--------------------------------

### Pan Gesture Event Handler

Source: https://motion.dev/docs/react-gestures

Recognize pointer press and movement >3 pixels with onPan callback receiving event and pointInfo. Pan gesture ends when pointer is released. Requires touch-action CSS rule for proper touch input handling. Note: pan does not have an associated while- prop.

```jsx
<motion.div onPan={(e, pointInfo) => {}} />
```

--------------------------------

### Animate Layout within Fixed Position Containers in Motion

Source: https://motion.dev/docs/react-layout-animations

When animating layout changes for elements nested within `position: fixed` containers, the `layoutRoot` prop is essential. Applying `layoutRoot` to the fixed element ensures Motion correctly accounts for the page's scroll offset, leading to precise layout measurements and animations for its children.

```jsx
<motion.div layoutRoot style={{ position: "fixed" }} />
```

--------------------------------

### duration Control Property

Source: https://motion.dev/docs/animate

Read-only property that returns the duration of a single animation iteration, excluding delay and repeat options.

```APIDOC
## duration Control Property

### Description
Returns the duration of the animation. This is the duration of a single iteration of the animation, without delay or repeat options. It is **read-only**.

### Property
**duration** (number, read-only)

### Usage
```javascript
const animation = animate(element, { opacity: 0 })

const duration = animation.duration
```

### Returns
- **duration** (number) - Duration in seconds of a single animation iteration
```

--------------------------------

### Enable touch support with touch-action CSS

Source: https://motion.dev/docs/react-use-drag-controls

Apply touch-action: none style to the triggering element to ensure proper touch screen support. This prevents browser default touch behaviors and allows the drag gesture to work correctly on touch devices.

```javascript
<div onPointerDown={startDrag} style={{ touchAction: "none" }} />
```

--------------------------------

### Accessing component presence state with useIsPresent hook in React

Source: https://motion.dev/docs/react-animate-presence

Demonstrates the `useIsPresent` hook, which allows a child component of `AnimatePresence` to determine if it is currently mounted (`true`) or in the process of exiting (`false`), enabling conditional rendering or styling based on its presence.

```jsx
function Component() {
  const isPresent = useIsPresent()

  return isPresent ? "Here!" : "Exiting..."
}
```

--------------------------------

### Inertia Animation - bounceDamping Property

Source: https://motion.dev/docs/react-transitions

Control the damping of the spring used when bouncing against constraints. Default is 10. Setting to 0 causes indefinite oscillation at the boundary.

```APIDOC
## Inertia Animation - bounceDamping

### Description
When min or max constraints are set, this controls the damping of the spring animation used for the bounce effect. Controls how quickly oscillations decay. A value of 0 results in perpetual oscillation at the boundary.

### Property
**bounceDamping** (number) - Optional - Default: 10

### Parameters
- **bounceDamping** (number) - Optional - Default: 10 - Spring damping for bounce
- **min** (number) - Optional - Minimum boundary
- **max** (number) - Optional - Maximum boundary
- **type** (string) - Optional - Set to "inertia"

### Request Example
```jsx
<motion.div
  drag
  dragTransition={{
    min: 0,
    max: 100,
    bounceDamping: 10
  }}
/>
```

### Response
- bounceDamping of 10 creates standard bounce behavior
- Higher values create more damped, stable bounces
- Value of 0 causes indefinite oscillation
```

--------------------------------

### Handle element leaving viewport with Framer Motion `onViewportLeave`

Source: https://motion.dev/docs/react-motion-component

The `onViewportLeave` callback function is triggered when a `motion` component exits the viewport. Similar to `onViewportEnter`, it provides an `IntersectionObserverEntry` to access details about the intersection, enabling specific actions when an element becomes invisible.

```jsx
<motion.div onViewportLeave={(entry) => console.log(entry.intersectionRect)} />
```

--------------------------------

### scroll() - Options: axis

Source: https://motion.dev/docs/scroll

Specify which scroll axis to track: vertical (y) or horizontal (x). Defaults to vertical scrolling.

```APIDOC
## scroll() - axis Option

### Description
Define which scroll axis to track for the animation. By default, vertical scroll is tracked.

### Option Name
`axis`

### Type
"x" | "y"

### Default Value
`"y"`

### Usage Example
```javascript
scroll(
  (progress) => console.log(progress),
  { axis: "x" }
)
```

### Valid Values
- **"y"** - Track vertical scroll (default)
- **"x"** - Track horizontal scroll

### Use Cases
- Horizontal scroll animations
- Timeline scrubbers
- Carousel scroll tracking
```

--------------------------------

### Animate CSS Variables for Multi-Child Elements in React Motion

Source: https://motion.dev/docs/react-animation

Demonstrates animating a CSS variable like `--rotate` using Framer Motion's `initial` and `animate` props on a parent component. This allows multiple child elements to react to the animated variable through their `style` prop, enabling synchronized animations. Note that animating CSS variables can impact performance.

```jsx
<motion.ul
  initial={{ '--rotate': '0deg' }}
  animate={{ '--rotate': '360deg' }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <li style={{ transform: 'rotate(var(--rotate))' }} />
  <li style={{ transform: 'rotate(var(--rotate))' }} />
  <li style={{ transform: 'rotate(var(--rotate))' }} />
</motion.ul>
```

--------------------------------

### Delay a callback with duration in JavaScript

Source: https://motion.dev/docs/delay

Pass a callback function and duration (in seconds) to `delay` to execute the callback on the next animation frame after the specified duration. The callback fires synchronously with Motion's animation loop rather than using setTimeout.

```javascript
delay(() => console.log("one second!"), 1)
```

--------------------------------

### Pass custom data to Framer Motion dynamic variants

Source: https://motion.dev/docs/react-motion-component

The `custom` prop allows passing arbitrary data to dynamic variants, making animations more flexible and data-driven. Variants can then use this `custom` value to modify animation properties like delay, duration, or specific styles.

```jsx
const variants = {
  visible: (custom) => ({
    opacity: 1,
    transition: { delay: custom * 0.2 }
  })
}

return (
  <motion.ul animate="visible">
    <motion.li custom={0} variants={variants} />
    <motion.li custom={1} variants={variants} />
    <motion.li custom={2} variants={variants} />
  </motion.ul>
)
```

--------------------------------

### Enable dragPropagation for Nested Draggable Components (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragPropagation` prop, set to `true`, allows drag gestures to propagate to child components that are also draggable. By default, drag events are stopped at the first draggable element. Enabling this can be useful for complex nested draggable interfaces where multiple layers need to respond to a single drag action.

```jsx
<motion.div drag="x" dragPropagation />
```

--------------------------------

### Correctly Using Unique ID as Key in AnimatePresence for List Items (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

To ensure stable and correct exit animations within `AnimatePresence`, it is crucial to provide a `key` prop that uniquely identifies each component across renders. Using a stable identifier like a unique `item.id` guarantees that `AnimatePresence` can accurately track components as they enter, exit, or reorder, resolving issues caused by non-unique or changing keys.

```jsx
<AnimatePresence>
  {items.map((item) => (
    <Component key={item.id} />
  ))}
</AnimatePresence>
```

--------------------------------

### Spring Animation - restSpeed Property

Source: https://motion.dev/docs/react-transitions

Set the threshold speed for animation completion. Default is 0.1. When absolute speed drops below this value and delta is smaller than restDelta, the animation ends.

```APIDOC
## Spring Animation - restSpeed

### Description
End animation when absolute speed (in units per second) drops below this threshold value AND delta is smaller than restDelta. Works in conjunction with restDelta to determine when the spring animation has settled.

### Property
**restSpeed** (number) - Optional - Default: 0.1

### Parameters
- **restSpeed** (number) - Optional - Default: 0.1 - Speed threshold in units per second
- **restDelta** (number) - Optional - Delta threshold for completion
- **type** (string) - Required - Set to "spring"

### Request Example
```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', restSpeed: 0.5 }}
/>
```

### Response
- Animation completes when speed drops below 0.5 units per second
- Higher restSpeed values cause animations to end sooner
- Works with restDelta to provide dual completion criteria
```

--------------------------------

### Calculate Inverse Scale for Parent/Child Elements in JavaScript

Source: https://motion.dev/docs/transform-value

This snippet shows how `transformValue` can perform calculations on a `motionValue`'s output. It computes an `inverseScale` based on a `scale` motion value, then applies these to `.parent` and `.child` elements respectively, maintaining an inverse relationship between their scales.

```javascript
const scale = motionValue(1)
const inverseScale = transformValue(() => 1 / scale.get())
  
styleEffect(".parent", { scale })
styleEffect(".child", { scale: inverseScale })
```

--------------------------------

### Correct Conditional Rendering of Children within AnimatePresence for Exit Animations (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

For `AnimatePresence` to correctly handle exit animations, it must remain mounted while its children are conditionally rendered. The conditional logic should be applied to the children inside `AnimatePresence`, allowing it to detect when a child is removed and initiate the exit animation. This ensures `AnimatePresence` maintains control over the animation lifecycle.

```jsx
<AnimatePresence>
  {isVisible && <Component />}
</AnimatePresence>
```

--------------------------------

### Define Custom CSS Spring Easing Functions in Tailwind CSS Theme

Source: https://motion.dev/docs/react-tailwind

This CSS code block, intended for a Tailwind CSS `@theme` configuration, defines several custom CSS spring easing functions using the `linear()` syntax. These spring curves are generated via Motion for AI and can be made reusable as Tailwind utility classes, enabling complex spring animations without Motion in the bundle.

```css
@theme {
  --ease-spring-snappy: linear(0, 0.2375, 0.5904, 0.8358, 0.9599, 1.0061, 1.0152, 1.0116, 1.0062, 1.0025, 1.0006, 0.9999, 1);
  --ease-spring: linear(0, 0.0942, 0.2989, 0.5275, 0.73, 0.8839, 0.9858, 1.0425, 1.0655, 1.0666, 1.0558, 1.0405, 1.0255, 1.0131, 1.0043, 0.9989, 0.9962, 1);
  --ease-spring-soft: linear(0, 0.0332, 0.1241, 0.2583, 0.4207, 0.5967, 0.7729, 0.9379, 1.0826, 1.2006, 1.2883, 1.3445, 1.3701, 1.3679, 1.3423, 1.2983, 1.2415, 1.1774, 1.1113, 1.0477, 0.9904, 0.9421, 0.9047, 0.8789, 0.8648, 0.8615, 0.8677, 0.8815, 0.9009, 0.9239, 0.9485, 0.9727, 0.9952, 1.0146, 1.0303, 1.0417, 1.0487, 1.0515, 1.0506, 1.0465, 1.0401, 1.032, 1.023, 1.0138, 1.0051, 0.9974, 0.9909, 0.986, 0.9828, 0.9811, 0.9809, 0.9819, 0.984, 0.9868, 0.99, 0.9935, 0.9968, 0.9998, 1.0025, 1.0045, 1.006, 1.0069, 1.0072, 1.0069, 1.0063, 1.0054, 1.0042, 1.003, 1.0017, 1.0005, 0.9995, 0.9986, 0.998, 0.9976, 1);
}
```

--------------------------------

### useScroll Hook

Source: https://motion.dev/docs/react-use-scroll

`useScroll` is a Framer Motion hook used to create scroll-linked animations, such as progress indicators and parallax effects, by tracking scroll position and progress.

```APIDOC
## useScroll Hook

### Description
`useScroll` is a React hook provided by Framer Motion that enables the creation of scroll-linked animations. It tracks scroll position and progress, returning motion values that can be used to drive UI changes, progress indicators, or parallax effects.

### Method
(N/A - This is a React hook, not an HTTP method)

### Endpoint
(N/A - This is a React hook, not an HTTP endpoint)

### Parameters
`useScroll` accepts an optional options object as its single parameter.

#### Request Body
(N/A - Parameters are passed as an object)

### Options
- **`container`** (RefObject<HTMLElement> | HTMLElement) - Optional - Default: Viewport
  The scrollable container to track the scroll position of. By default, this is the browser viewport. By passing a `ref` to a scrollable element, that element can be used instead.
- **`target`** (RefObject<HTMLElement> | HTMLElement) - Optional - Default: Scrollable area of `container`
  `useScroll` tracks the progress of the `target` within the `container`. By default, the `target` is the scrollable area of the `container`. It can additionally be set as another element, to track its progress within the `container`.
- **`axis`** (string: "x" | "y") - Optional - Default: `"y"`
  The tracked axis for the defined `offset`.
- **`offset`** (Array<string | number>) - Optional - Default: `["start start", "end end"]`
  `offset` describes intersections, points where the `target` and `container` meet. This is an array of two intersection points.
  Each intersection point can be defined as:
    *   **Number:** A value where `0` represents the start of the axis and `1` represents the end. (e.g., `"0 0.5"`)
    *   **Names:** `"start"`, `"center"`, `"end"` as shortcuts for `0`, `0.5`, `1` respectively.
    *   **Pixels:** Pixel values like `"100px"`, `"-50px"`.
    *   **Percent:** `"0%"` to `"100%"`.
    *   **Viewport:** `"vh"` and `"vw"` units.

### Returned Values
`useScroll` returns an object containing four motion values:
- **`scrollX`** (MotionValue<number>) - The absolute scroll position on the X-axis, in pixels.
- **`scrollY`** (MotionValue<number>) - The absolute scroll position on the Y-axis, in pixels.
- **`scrollXProgress`** (MotionValue<number>) - The scroll position on the X-axis between the defined `offset`s, as a value between `0` and `1`.
- **`scrollYProgress`** (MotionValue<number>) - The scroll position on the Y-axis between the defined `offset`s, as a value between `0` and `1`.

### Request Example
```javascript
import { useScroll, useMotionValueEvent, useSpring, useTransform, motion } from "motion/react";
import { useRef, useState } from "react";

// Page scroll indicator
const PageScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  return <motion.div style={{ scaleX: scrollYProgress, originX: 0 }} />;
};

// Element scroll tracking
const ElementScroll = ({ children }) => {
  const carouselRef = useRef(null);
  const { scrollX } = useScroll({ container: carouselRef });

  useMotionValueEvent(scrollX, "change", (latest) => {
    console.log("Element scrollX: ", latest);
  });

  return (
    <div ref={carouselRef} style={{ overflowX: "scroll", width: "100%", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
};

// Tracking an element's position within the viewport
const TrackedElement = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"] // Element enters from bottom
  });

  return (
    <motion.div ref={ref} style={{ opacity: scrollYProgress, scale: scrollYProgress }}>
      <p>This element animates as it enters the viewport.</p>
    </motion.div>
  );
};

// Using useSpring with scrollYProgress
const SmoothScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return <motion.div style={{ scaleX, originX: 0 }} />;
};

// Detecting scroll direction
const ScrollDirectionDetector = () => {
  const { scrollY } = useScroll();
  const [scrollDirection, setScrollDirection] = useState("down");

  useMotionValueEvent(scrollY, "change", (current) => {
    const diff = current - (scrollY.getPrevious() || 0); // Handle initial undefined getPrevious()
    if (diff !== 0) { // Only update if scroll actually changed
      setScrollDirection(diff > 0 ? "down" : "up");
    }
  });

  return <p>Scroll Direction: {scrollDirection}</p>;
};
```

### Response
(N/A - React hooks do not have direct HTTP responses. They return reactive values.)

#### Success Response (N/A)
(N/A - See above)

#### Response Example
```javascript
// Example of returned MotionValues:
// scrollY: MotionValue<number> (e.g., current value 150)
// scrollYProgress: MotionValue<number> (e.g., current value 0.35)
// These values are reactive and update as the scroll position changes.
// They are typically used directly in 'style' props or composed with other hooks.
```
```

--------------------------------

### Pause Motion Animation with pause() (JavaScript)

Source: https://motion.dev/docs/animate

Use the `pause()` method to temporarily halt a Motion animation at its current state. The animation will remain paused until explicitly resumed with the `play()` method.

```javascript
const animation = animate(element, { opacity: 0 })
animation.pause()
```

--------------------------------

### useTransform with clamp: false for Continuous Rotation

Source: https://motion.dev/docs/react-use-transform

Uses unclamped value mapping to create continuous rotation based on scroll position. For every 100px scrolled, the element rotates another 360 degrees, creating a perpetual mapping effect.

```javascript
const { scrollY } = useScroll()
const rotate = useTransform(
  scrollY,
  [0, 100],
  [0, 360],
  { clamp: false }
)
```

--------------------------------

### Fix layout animations with mode="popLayout" using position property

Source: https://motion.dev/docs/react-animate-presence

Configure a Motion list component with proper positioning to ensure consistent child element placement during layout animations. The parent motion.ul uses position: "relative" to prevent transform from affecting child positioning, while AnimatePresence with mode="popLayout" manages entrance and exit animations for list items. This pattern ensures absolutely positioned children appear in expected locations.

```jsx
<motion.ul layout style={{ position: "relative" }}>
  <AnimatePresence mode="popLayout">
    {items.map(item => (
      <motion.li layout key={item.id} />
    ))}
  </AnimatePresence>
</motion.ul>
```

--------------------------------

### Use motion values to avoid React re-renders

Source: https://motion.dev/docs/react-motion-component

Utilize useMotionValue hook to animate values without triggering React state updates and component re-renders. Motion values automatically update the DOM at 120fps, providing optimal performance for continuous animations.

```javascript
const x = useMotionValue(0)

useEffect(() => {
  // Won't trigger a re-render!
  const timeout = setTimeout(() => x.set(100), 1000)

  return () => clearTimeout(timeout)
}, [])

return <motion.div style={{ x }} />
```

--------------------------------

### Fix Layout Animations with mode="popLayout"

Source: https://motion.dev/docs/react-animate-presence

Resolves layout animation positioning issues by ensuring the animating parent element has a position property other than 'static'. When using mode="popLayout", absolute positioning of child elements requires proper parent positioning context.

```APIDOC
## Layout Animation Configuration

### Description
Configure layout animations to work correctly with `mode="popLayout"` by setting appropriate CSS positioning on parent elements.

### Problem
When any HTML element has an active `transform`, it temporarily becomes the offset parent of its children. This causes children with `position: "absolute"` to not appear where expected when using `mode="popLayout"`.

### Solution
Ensure that the animating parent has a `position` property other than `"static"`. This maintains consistent and expected positioning during layout animations.

### Implementation

#### Component Structure
```jsx
<motion.ul layout style={{ position: "relative" }}>
  <AnimatePresence mode="popLayout">
    {items.map(item => (
      <motion.li layout key={item.id} />
    ))}
  </AnimatePresence>
</motion.ul>
```

### Key Points
- **Parent Element**: Set `position` to "relative", "absolute", "fixed", or "sticky"
- **Animation Mode**: Use `mode="popLayout"` for exit animations with absolute positioning
- **Child Elements**: Positioned children will now appear in the correct location

### Related Components
- `motion.ul` / `motion.li` - Motion components for animatable elements
- `AnimatePresence` - Component for managing enter/exit animations
- `layout` prop - Enables layout animation for element
```

--------------------------------

### Retrieve Animation Duration with Motion `animation.duration`

Source: https://motion.dev/docs/animate

Illustrates how to access the read-only `duration` property of an animation object, which represents the length of a single animation iteration without repeats or delays.

```javascript
const animation = animate(element, { opacity: 0 })

const duration = animation.duration
```

--------------------------------

### Render Animated Number with AnimateNumber Component

Source: https://motion.dev/docs/react-animation

Demonstrates the `AnimateNumber` component from Motion+ for displaying ticking counter effects. Simply pass the numeric value as a child to the component for automatic animation rendering without manual state management.

```jsx
<AnimateNumber>{value}</AnimateNumber>
```

--------------------------------

### onDirectionLock Callback

Source: https://motion.dev/docs/react-motion-component

Callback function that fires when a drag direction is determined. Useful for tracking which axis the user is dragging on.

```APIDOC
## onDirectionLock

### Description
Callback function that fires when a drag direction is determined.

### Callback Signature
```jsx
function onDirectionLock(axis) {
  // axis: "x" | "y"
}
```

### Parameters
- **axis** (string) - The detected drag direction ("x" or "y")

### Usage Example
```jsx
<motion.div
  drag
  dragDirectionLock
  onDirectionLock={axis => console.log(axis)}
/>
```
```

--------------------------------

### Detect Reduced Motion Setting in React

Source: https://motion.dev/docs/react-use-reduced-motion

This snippet demonstrates the basic usage of the `useReducedMotion` hook to check if the user's device has the Reduced Motion setting enabled. It returns a boolean value that can be used to alter UI behavior, such as animation styles or autoplay settings, for improved accessibility.

```javascript
const shouldReduceMotion = useReducedMotion()
```

--------------------------------

### Apply Motion Value to SVG Attribute with svgEffect (JavaScript)

Source: https://motion.dev/docs/svg-effect

This snippet illustrates how `svgEffect` can target SVG attributes using the `attr` prefix for properties that have both style and attribute equivalents. Here, a `motionValue` is bound to the `width` attribute of a rectangle, allowing animated width changes.

```javascript
const width = motionValue(400)

svgEffect("rect", { attrWidth: width })
```

--------------------------------

### dragListener Property

Source: https://motion.dev/docs/react-motion-component

Determines whether to trigger the drag gesture from event listeners on the draggable element. Set to false to only allow drag initiation through dragControls.

```APIDOC
## dragListener

### Description
Determines whether to trigger the drag gesture from event listeners. If passing `dragControls`, setting this to `false` will ensure dragging can only be initiated by the controls, rather than a `pointerdown` event on the draggable element.

### Property Type
Boolean
```

--------------------------------

### Use CSS Variables as Animation Targets in React Motion

Source: https://motion.dev/docs/react-animation

Illustrates how Framer Motion components can directly animate properties whose values are derived from CSS variables. Here, `backgroundColor` is animated to the value of `--action-bg`, allowing dynamic styling based on CSS custom properties.

```jsx
<motion.li animate={{ backgroundColor: "var(--action-bg)" }} />
```

--------------------------------

### Passing and accessing custom presence data with AnimatePresence in React

Source: https://motion.dev/docs/react-animate-presence

Explains how to use the `custom` prop on `AnimatePresence` to pass data to exiting child components, and then retrieve that data using the `usePresenceData` hook. This is useful for providing contextual information to exit animations, such as swipe direction.

```jsx
<AnimatePresence custom={swipeDirection}>
  <Slide key={activeSlideId}>

function Slide() {
  const isPresent = useIsPresent()
  const direction = usePresenceData()

  return (
    <motion.div exit={{ opacity: 0 }}>
      {isPresent ? "Here!" : "Exiting " + direction}
    </motion.div>
  )
}
```

--------------------------------

### inherit Property

Source: https://motion.dev/docs/react-motion-component

Control variant inheritance and propagation. Set to false to prevent a component from inheriting or propagating changes in a parent variant.

```APIDOC
## inherit Property

### Description
Set to `false` to prevent a component inheriting or propagating changes in a parent variant.

### Type
boolean

### Default
`true`

### Required
No

### Usage Example
```jsx
<motion.div animate="visible">
  <motion.span inherit={false} animate="hidden" />
</motion.div>
```
```

--------------------------------

### Animate SVG viewBox for Panning with Motion in React

Source: https://motion.dev/docs/react-svg-animation

This code demonstrates animating the `viewBox` attribute of an `<motion.svg>` component to create a panning effect. It shifts the visible area 100 pixels to the right.

```jsx
<motion.svg
  viewBox="0 0 200 200"
  animate={{ viewBox: "100 0 200 200" }} // 100px to the right
/>
```

--------------------------------

### dragPropagation Property

Source: https://motion.dev/docs/react-motion-component

Allows drag gesture propagation to child components. When enabled, drag events can be handled by both parent and child draggable elements.

```APIDOC
## dragPropagation

### Description
Allows drag gesture propagation to child components.

### Default Value
`false`

### Property Type
Boolean

### Usage Example
```jsx
<motion.div drag="x" dragPropagation />
```
```

--------------------------------

### Set Spring Animation Stiffness for Movement Sudsity in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `stiffness` property controls the rigidity of the spring in Framer Motion animations. Higher values lead to more sudden and abrupt movements, making the animation feel more rigid. The default value for `stiffness` is `1`.

```jsx
<motion.section
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', stiffness: 50 }}
/>
```

--------------------------------

### Update Motion Values to Trigger svgEffect Rerender (JavaScript)

Source: https://motion.dev/docs/svg-effect

This code demonstrates how to programmatically update `motionValue`s. Directly setting `stroke` or animating `strokeWidth` will cause the `svgEffect`-bound elements to re-render with the new values on the next animation frame.

```javascript
stroke.set("#f00")
animate(strokeWidth, 1)
```

--------------------------------

### Unsubscribe from MotionValue Events in JavaScript

Source: https://motion.dev/docs/motion-value

Demonstrates that the `.on()` method returns an unsubscribe function. Calling this returned function will remove the previously registered event listener, preventing further callbacks when the Motion Value changes.

```javascript
const unsubscribe = x.on("change", latest => console.log(latest))
```

--------------------------------

### Set rest speed threshold for spring animation termination

Source: https://motion.dev/docs/animate

Demonstrates how to configure the restSpeed parameter to control when a spring animation ends. The animation stops when absolute speed drops below this value and delta is smaller than restDelta, with a default value of 0.1.

```javascript
animate(
  ".my-element",
  { rotate: 180 },
  { type: "spring", restSpeed: 2 }
)
```

--------------------------------

### Control Keyframe Timing with transition.times in React Motion

Source: https://motion.dev/docs/react-animation

Explains how to customize the timing of individual keyframes within an animation using the `times` array in the `transition` prop. This array of progress values (between 0 and 1) defines at what point in the overall animation duration each keyframe should occur.

```jsx
<motion.circle
  cx={500}
  animate={{
    cx: [null, 100, 200],
    transition: { duration: 3, times: [0, 0.2, 1] }
  }}
/>
```

--------------------------------

### Adjust Inertia Animation Bounce Spring Stiffness in Framer Motion

Source: https://motion.dev/docs/react-transitions

When `min` or `max` constraints are active in a Framer Motion inertia animation, `bounceStiffness` controls the rigidity of the spring responsible for the bounce effect. Higher values result in more sudden and firm bounce movements. The default is `500`.

```jsx
<motion.div
  drag
  dragTransition={{
    min: 0,
    max: 100,
    bounceStiffness: 100
  }}
/>
```

--------------------------------

### layoutScroll Property

Source: https://motion.dev/docs/react-motion-component

Mark scrollable container elements to enable correct layout animation measurements within scrollable areas. Improves performance by limiting scroll offset measurements.

```APIDOC
## layoutScroll Property

### Description
For layout animations to work correctly within scrollable elements, their scroll offset needs measuring. For performance reasons, Framer Motion doesn't measure the scroll offset of every ancestor. Add the `layoutScroll` prop to elements that should be measured.

### Type
boolean

### Required
No

### Usage Example
```jsx
<motion.div layoutScroll style={{ overflow: "scroll" }}>
  <motion.div layout />
</motion.div>
```
```

--------------------------------

### Configure Animation Repetition Count in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `repeat` property specifies how many times a Framer Motion animation should execute after its initial run. Setting this value to `Infinity` will cause the animation to loop perpetually. The default value is `0`.

```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ repeat: Infinity, duration: 2 }}
/>
```

--------------------------------

### Disable Enter Animations by Setting initial={false} in React Motion

Source: https://motion.dev/docs/react-animation

Shows how to disable the initial enter animation for a `motion` component by setting `initial={false}`. This causes the element to render directly with the values defined in its `animate` prop without any preceding animation.

```jsx
<motion.div initial={false} animate={{ y: 100 }} />
```

--------------------------------

### Animated Counter with State

Source: https://motion.dev/docs/react-animate-number

Implement an interactive counter component using AnimateNumber with React state. When the increment button is clicked, the count updates and AnimateNumber smoothly animates to the new value.

```jsx
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <AnimateNumber>{count}</AnimateNumber>
    </>
  )
}
```

--------------------------------

### Inertia Animation - timeConstant Property

Source: https://motion.dev/docs/react-transitions

Control the duration of inertia deceleration. Default is 700 milliseconds. Adjusting this changes how long the deceleration takes and affects the overall feel of the animation.

```APIDOC
## Inertia Animation - timeConstant

### Description
Adjusts the time constant which controls the duration of the deceleration phase. Higher values create longer deceleration periods, while lower values create quicker stopping. Directly affects the feel of drag animations.

### Property
**timeConstant** (number) - Optional - Default: 700 - Duration in milliseconds

### Parameters
- **timeConstant** (number) - Optional - Default: 700 - Deceleration duration in ms
- **type** (string) - Optional - Set to "inertia"

### Request Example
```jsx
<motion.div
  drag
  dragTransition={{ timeConstant: 200 }}
/>
```

### Response
- timeConstant of 200ms creates quick, snappy deceleration
- Default 700ms provides smooth, natural deceleration
- Higher values create longer, more gradual stopping
```

--------------------------------

### Enable layout animations within scrollable elements with `layoutScroll`

Source: https://motion.dev/docs/react-motion-component

For `motion` components performing layout animations within scrollable parent elements, the `layoutScroll` prop is necessary. Adding this prop to the scrollable container ensures its scroll offset is correctly measured, allowing nested layout animations to function as expected.

```jsx
<motion.div layoutScroll style={{ overflow: "scroll" }}>
  <motion.div layout />
</motion.div>
```

--------------------------------

### Animate MotionValue with Automatic Termination in JavaScript

Source: https://motion.dev/docs/motion-value

This snippet illustrates animating a `motionValue` between different states. When a new `animate` call is made on the same Motion Value while another animation is active, Motion automatically terminates the existing animation to prevent conflicts and ensure smooth transitions.

```javascript
const color = motionValue("#f00")

animate(color, "#0f0")

animate(color, "#333") // Will automatically end the existing animation
```

--------------------------------

### Orchestration - repeat Property

Source: https://motion.dev/docs/react-transitions

Control the number of times an animation repeats. Default is 0 (no repeat). Set to Infinity for perpetual animation.

```APIDOC
## Orchestration - repeat

### Description
Specify how many times an animation should repeat. Default value is 0 for no repetition. Set to Infinity to create a perpetual looping animation that never stops.

### Property
**repeat** (number) - Optional - Default: 0 - Number of repetitions

### Parameters
- **repeat** (number) - Optional - Default: 0 - Number of times to repeat
- **duration** (number) - Optional - Animation duration per cycle

### Request Example
```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ repeat: Infinity, duration: 2 }}
/>
```

### Response
- repeat of 0 plays animation once (default)
- repeat of 3 plays animation 4 times total (initial + 3 repeats)
- repeat of Infinity creates continuous looping animation
- Each repeat cycle uses the specified duration
```

--------------------------------

### Use mapValue with Default Clamped Range

Source: https://motion.dev/docs/map-value

By default, mapValue clamps output values to the specified range limits. When the input exceeds the defined range, the output is constrained to the maximum value in the output range.

```JavaScript
const progress = motionValue(3)
const double = mapValue(progress, [0, 1], [0, 2])

double.get() // progress clamped to 1, outputs 2
```

--------------------------------

### Propagate Exit Animations in Nested AnimatePresence Components (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

The `propagate` prop, when set to `true` on a nested `AnimatePresence`, ensures that its children's exit animations are triggered even when the parent `AnimatePresence` exits. This allows for coordinated exit animations across multiple levels of `AnimatePresence` components, providing more complex animation sequences.

```jsx
<AnimatePresence>
  {show ? (
    <motion.section exit={{ opacity: 0 }}>
      <AnimatePresence propagate>
        {/* This exit prop will now fire when show is false */}
        <motion.div exit={{ x: -100 }} />
      </AnimatePresence>
    </motion.section>
  ) : null}
</AnimatePresence>
```

--------------------------------

### Drag Gesture with Animation

Source: https://motion.dev/docs/react-gestures

Apply pointer movement to x and/or y axis with drag prop and whileDrag animation. The component scales to 1.2 and changes background color while being dragged. Useful for creating interactive draggable elements with visual feedback.

```jsx
<motion.div drag whileDrag={{ scale: 1.2, backgroundColor: "#f00" }} />
```

--------------------------------

### dragElastic Property

Source: https://motion.dev/docs/react-motion-component

Controls the degree of movement allowed outside constraints. Value of 0 means no movement outside constraints, 1 allows full movement. Can be set per constraint direction.

```APIDOC
## dragElastic

### Description
The degree of movement allowed outside constraints. `0` = no movement, `1` = full movement. Can also be set as `false` to disable movement. By passing an object of `top`/`right`/`bottom`/`left`, individual values can be set per constraint. Any missing values will be set to `0`.

### Default Value
`0.5`

### Property Type
Number | Boolean | Object

### Parameters (Object Format)
- **top** (number) - Optional - Elastic value for top constraint
- **right** (number) - Optional - Elastic value for right constraint
- **bottom** (number) - Optional - Elastic value for bottom constraint
- **left** (number) - Optional - Elastic value for left constraint

### Usage Example
```jsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  dragElastic={0.2}
/>
```
```

--------------------------------

### Animate SVG Attributes with Motion in React

Source: https://motion.dev/docs/react-svg-animation

This snippet illustrates animating direct SVG attributes, like `cx` (center x-coordinate), using Motion. It animates the circle's `cx` attribute from 0 to 50.

```jsx
<motion.circle
  cx={0}
  animate={{ cx: 50 }}
/>
```

--------------------------------

### Inertia Animation - modifyTarget Property

Source: https://motion.dev/docs/react-transitions

Provide a function to modify the automatically-calculated inertia target. Useful for snap-to-grid functionality or custom target adjustments.

```APIDOC
## Inertia Animation - modifyTarget

### Description
A function that receives the automatically-calculated target value and returns a modified value. Enables snap-to-grid, snap-to-value, or other custom target modifications.

### Property
**modifyTarget** (function) - Optional - Function to modify calculated target

### Parameters
- **modifyTarget** (function) - Optional - Receives target number, returns modified number
- **type** (string) - Optional - Set to "inertia"

### Request Example
```jsx
<motion.div
  drag
  dragTransition={{
    power: 0,
    modifyTarget: target => Math.round(target / 50) * 50
  }}
/>
```

### Response
- Calculated target is snapped to nearest 50 pixel increment
- Function receives the auto-calculated target value
- Returned value becomes the final animation target
```

--------------------------------

### dragConstraints Property

Source: https://motion.dev/docs/react-motion-component

Applies constraints on the draggable area using pixel values or a ref to another element's bounding box. Constrains movement within specified boundaries.

```APIDOC
## dragConstraints

### Description
Applies constraints on the draggable area. Can be set as an object of optional `top`, `left`, `right`, and `bottom` values measured in pixels, or as a ref to another element to use its bounding box as the draggable constraints.

### Property Type
Object | Ref

### Parameters
- **top** (number) - Optional - Top constraint in pixels
- **left** (number) - Optional - Left constraint in pixels
- **right** (number) - Optional - Right constraint in pixels
- **bottom** (number) - Optional - Bottom constraint in pixels
- **ref** (RefObject) - Optional - Reference to element for bounding box constraints

### Usage Example (Object)
```jsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 300 }}
/>
```

### Usage Example (Ref)
```jsx
const MyComponent = () => {
  const constraintsRef = useRef(null)

  return (
     <motion.div ref={constraintsRef}>
         <motion.div drag dragConstraints={constraintsRef} />
     </motion.div>
  )
}
```
```

--------------------------------

### Conditionally Animate with Opacity or Transform using Framer `useReducedMotion` in React

Source: https://motion.dev/docs/react-accessibility

Implement conditional animation logic in a React component to switch between `transform` and `opacity` animations based on the `useReducedMotion` hook's value. This approach allows components to mimic platform-specific accessibility behaviors, such as fading content instead of moving it when reduced motion is preferred.

```jsx
function Sidebar({ isOpen }) {
  const shouldReduceMotion = useReducedMotion()
  let animate

  if (isOpen) {
    animate = shouldReduceMotion ? { opacity: 1 } : { x: 0 }
  } else {
    animate = shouldReduceMotion
      ? { opacity: 0 }
      : { x: "-100%" }
  }

  return <motion.div animate={animate} />
}
```

--------------------------------

### Workaround for Stretched Border Animation React

Source: https://motion.dev/docs/react-layout-animations

Provides a solution for border stretching during layout animations by replacing the border with a parent element using padding. This approach avoids layout recalculations triggered by animating the border property, maintaining performance benefits while preventing visual distortion.

```javascript
<motion.div layout style={{ borderRadius: 10, padding: 5 }}>
  <motion.div layout style={{ borderRadius: 5 }} />
</motion.div>
```

--------------------------------

### Use mapValue with Unclamped Range

Source: https://motion.dev/docs/map-value

Disable clamping by passing the { clamp: false } option to allow values outside the specified range. This enables extrapolation beyond the defined output range limits.

```JavaScript
const progress = motionValue(3)
const double = mapValue(progress, [0, 1], [0, 2], { clamp: false })

double.get() // 6
```

--------------------------------

### Animate Motion Component While Dragging in React

Source: https://motion.dev/docs/react-motion-component

The `whileDrag` prop specifies an animation state or variant label to activate while a drag gesture is active. It can directly define animation targets or refer to a predefined variant, and requires the `drag` prop to be enabled.

```javascript
// As target
<motion.div drag whileDrag={{ scale: 0.9 }} />
```

```javascript
// As variants
<motion.div drag whileDrag="dragging" />
```

--------------------------------

### Stagger child animations with stagger function in Motion

Source: https://motion.dev/docs/react-transitions

Uses the stagger function to apply incremental delays across child elements. The basic stagger delays each child by 0.1 seconds sequentially from first to last.

```jsx
const transition = {
  delayChildren: stagger(0.1)
}
```

--------------------------------

### Disable Initial Animations with AnimatePresence initial Prop (React/Framer Motion)

Source: https://motion.dev/docs/react-animate-presence

The `initial` prop in `AnimatePresence` allows you to control whether children animate in when the component is first rendered. Setting `initial={false}` disables these initial animations, preventing elements from animating upon their first appearance within the `AnimatePresence` component.

```jsx
<AnimatePresence initial={false}>
  <Slide key={activeItem.id} />
</AnimatePresence>
```

--------------------------------

### Adjust Spring Animation Mass for Movement Lethargy in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `mass` property represents the perceived mass of the animated object in Framer Motion's spring animations. Higher values result in more lethargic and slower movements, impacting the animation's responsiveness. The default value for `mass` is `1`.

```jsx
<motion.feTurbulence
  animate={{ baseFrequency: 0.5 }}
  transition={{ type: "spring", mass: 0.5 }}
/>
```

--------------------------------

### Override Spring Duration with visualDuration in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `visualDuration` property in Framer Motion lets you set the time, in seconds, for a spring animation to visually reach its target, overriding the default `duration`. This allows the primary transition to complete before the 'bouncy' effect, simplifying visual coordination and editing of spring animations.

```jsx
<motion.div
  animate={{ rotateX: 90 }}
  transition={{
    type: "spring",
    visualDuration: 0.5,
    bounce: 0.25
  }}
/>
```

--------------------------------

### Spring Animation - damping Property

Source: https://motion.dev/docs/react-transitions

Control the strength of opposing force in spring animations. Default value is 10. Setting to 0 causes indefinite oscillation, while higher values reduce bouncing.

```APIDOC
## Spring Animation - damping

### Description
Strength of opposing force that resists spring motion. Controls how quickly oscillations decay. A value of 0 results in perpetual oscillation, while higher values create more damped movement.

### Property
**damping** (number) - Optional - Default: 10

### Parameters
- **damping** (number) - Optional - Default: 10 - Opposing force strength
- **type** (string) - Required - Set to "spring"

### Request Example
```jsx
<motion.a
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', damping: 300 }}
/>
```

### Response
- Higher damping values (e.g., 300) create smoother, less bouncy animations
- Default value of 10 provides moderate damping
- Value of 0 causes indefinite oscillation
```

--------------------------------

### Inertia Animation - power Property

Source: https://motion.dev/docs/react-transitions

Control the power of inertia deceleration. Default is 0.8. Higher values calculate a further target, resulting in longer deceleration distances.

```APIDOC
## Inertia Animation - power

### Description
Higher power values result in a further calculated target, causing the animation to travel greater distances during deceleration. Lower values reduce the travel distance and create quicker stopping.

### Property
**power** (number) - Optional - Default: 0.8

### Parameters
- **power** (number) - Optional - Default: 0.8 - Power multiplier (0-1)
- **type** (string) - Optional - Set to "inertia"

### Request Example
```jsx
<motion.div
  drag
  dragTransition={{ power: 0.2 }}
/>
```

### Response
- Power value of 0.2 calculates a closer target, shorter deceleration
- Default power of 0.8 provides standard inertia behavior
- Higher values (closer to 1) create longer deceleration distances
```

--------------------------------

### Ticker with Custom Velocity

Source: https://motion.dev/docs/react-ticker

Control the animation speed and direction of the Ticker by setting the velocity prop in pixels per second. Positive values scroll forward, negative values reverse direction, and 0 stops the animation.

```jsx
<Ticker items={items} velocity={100} />
```

```jsx
<Ticker items={items} velocity={-100} />
```

```jsx
<Ticker items={items} velocity={0} />
```

--------------------------------

### Configure Spring Animation Termination Speed with restSpeed in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `restSpeed` property in Framer Motion dictates the absolute speed threshold (in units per second) below which a spring animation can conclude. For termination to occur, the `delta` must also be smaller than `restDelta`. The default value is `0.1`.

```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', restSpeed: 0.5 }}
/>
```

--------------------------------

### Configure Automatic Reduced Motion with Framer MotionConfig in React

Source: https://motion.dev/docs/react-accessibility

Configure all Framer Motion components in a React application to automatically adapt to the user's 'Reduced Motion' setting. By setting `reducedMotion='user'` on `MotionConfig`, transform and layout animations are disabled while other animations like opacity are preserved.

```jsx
import { MotionConfig } from "framer-motion"

export function App({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
```

--------------------------------

### Stop Event Propagation with Capture Props

Source: https://motion.dev/docs/react-gestures

Prevent pointer events from propagating to parent motion components using onPointerDownCapture with stopPropagation(). Child button prevents parent whileTap animation from firing by stopping the pointer event at the capture phase.

```jsx
<motion.div whileTap={{ scale: 2 }}>
  <button onPointerDownCapture={e => e.stopPropagation()} />
</motion.div>
```

--------------------------------

### Cancel Motion Animation with cancel() (JavaScript)

Source: https://motion.dev/docs/animate

The `cancel()` method stops a Motion animation and reverts the animated element to its initial state. This undoes any visual changes caused by the animation.

```javascript
const animation = animate(element, { opacity: 0 })
animation.cancel()
```

--------------------------------

### React TabRow Component with Scoped LayoutGroup ID

Source: https://motion.dev/docs/react-layout-group

Extends the `TabRow` component by wrapping its tabs with `LayoutGroup` and providing a unique `id` prop. This scopes the `layoutId` within each `LayoutGroup` instance, allowing multiple independent `TabRow`s on the same page to use the same `layoutId` without conflict.

```jsx
function TabRow({ id, items }) {
  return (
    <LayoutGroup id={id}>
      {items.map(item => <Tab {...item} />)}
    </LayoutGroup>
}
```

--------------------------------

### Configure dragElastic for Movement Outside Constraints (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragElastic` prop controls the degree of movement allowed outside of defined `dragConstraints`. A value of `0` prevents any movement beyond constraints, while `1` allows full movement. It defaults to `0.5` and can also be an object for individual `top`/`right`/`bottom`/`left` elasticity values, with missing values defaulting to `0`.

```jsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  dragElastic={0.2}
/>
```

--------------------------------

### Pass MotionValue to SVG Attributes and Styles in React

Source: https://motion.dev/docs/react-svg-animation

This code demonstrates how to use `useMotionValue` to create animatable values that can be passed to both SVG attributes (like `cx`) and style properties (like `opacity`). Motion values allow for performant updates without re-renders.

```jsx
const cx = useMotionValue(100)
const opacity = useMotionValue(1)

return <motion.rect cx={cx} style={{ opacity }} />
```

--------------------------------

### Adjust Drag Elasticity Beyond Constraints (React)

Source: https://motion.dev/docs/react-drag

Control the 'tug' effect when a draggable element is pulled beyond its defined `dragConstraints` using the `dragElastic` prop. A value of `0` means no movement past the boundary, while `1` allows full movement, and intermediate values create an elastic bounce-back effect.

```jsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  dragElastic={0.1}
/>
```

--------------------------------

### Enable Layout Animation within Scrollable Elements in Motion

Source: https://motion.dev/docs/react-layout-animations

To ensure accurate layout animations inside a scrollable container, the `layoutScroll` prop must be added to the scrollable `motion.div`. This prop allows Motion to correctly factor in the element's scroll offset when calculating positions for animation.

```jsx
<motion.div layoutScroll style={{ overflow: "scroll" }} />
```

--------------------------------

### Observe Page Scroll Values with useMotionValueEvent

Source: https://motion.dev/docs/react-use-scroll

This snippet illustrates how to monitor the absolute vertical page scroll position in pixels using `scrollY` from `useScroll`. It uses `useMotionValueEvent` to log the `latest` scroll value to the console whenever it changes, useful for debugging or triggering effects based on exact pixel positions.

```jsx
const { scrollY } = useScroll()

useMotionValueEvent(scrollY, "change", (latest) => {
  console.log("Page scroll: ", latest)
})
```

--------------------------------

### Use 'changeTarget' to modify glide's calculated animation target in Motion

Source: https://motion.dev/docs/glide

The `changeTarget` option allows you to intercept and modify the target value automatically calculated by the `glide` animation. This is useful for snapping the animation to specific increments, such as rounding the target to the nearest 100.

```javascript
const roundTo = 100

glide({
  changeTarget: (target) => Math.ceil(target / roundTo) * roundTo
})
```

--------------------------------

### Detect Reduced Motion Preference with Framer `useReducedMotion` Hook in React

Source: https://motion.dev/docs/react-accessibility

Use the `useReducedMotion` hook from Framer Motion in a React component to programmatically detect if the user has enabled the 'Reduced Motion' setting on their operating system. This hook returns a simple boolean (`true` if reduced motion is enabled, `false` otherwise) for manual animation control.

```jsx
import { useReducedMotion } from "framer-motion"

// In your component
const shouldReduceMotion = useReducedMotion()
```

--------------------------------

### Customize Drag Momentum Physics (React)

Source: https://motion.dev/docs/react-drag

Modify the physical properties of the inertia animation that occurs when a draggable element is released using the `dragTransition` prop. This allows for creating a custom 'heavier' or 'bouncier' feel by adjusting parameters like `bounceStiffness` and `bounceDamping`.

```jsx
<motion.div
  drag
  dragTransition={{
    bounceStiffness: 600,
    bounceDamping: 10
  }}
/>
```

--------------------------------

### Customize Inertia Animation Target with modifyTarget Function in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `modifyTarget` property is a function that receives the automatically calculated target of an inertia animation and allows you to return a modified one. This is highly useful for implementing custom behaviors like snapping the animation's target to a grid.

```jsx
<motion.div
  drag
  // dragTransition always type: inertia
  dragTransition={{
    power: 0,
    // Snap calculated target to nearest 50 pixels
    modifyTarget: target => Math.round(target / 50) * 50
  }}
/>
```

--------------------------------

### SVG Filter Animation with Variants

Source: https://motion.dev/docs/react-gestures

Animate SVG filter elements using parent while- props and child variants, since filters don't receive events. Parent motion.svg has whileHover animation that triggers variants on nested feGaussianBlur element to animate stdDeviation property.

```jsx
const MyComponent = () => {
  return (
    <motion.svg whileHover="hover">
      <filter id="blur">
        <motion.feGaussianBlur
          stdDeviation={0}
          variants={{ hover: { stdDeviation: 2 } }}
        />
      </filter>
    </motion.svg>
  )
}
```

--------------------------------

### Animate SVG X and Y attributes in React

Source: https://motion.dev/docs/react-animation

For SVG components, use attrX and attrY to animate SVG-specific x and y attributes instead of the standard transform properties.

```jsx
<motion.circle attrX={0} attrY={0} />
```

--------------------------------

### Apply Scale Correction to Nested Elements React

Source: https://motion.dev/docs/react-layout-animations

Demonstrates how to prevent visual distortion of child elements during layout animations by applying the layout prop to both parent and child motion components. This technique corrects scale-related distortions that occur naturally when animating with transform: scale().

```javascript
<motion.section layout>
  <motion.img layout />
</motion.section>
```

--------------------------------

### Override SVG transformBox Property (JavaScript)

Source: https://motion.dev/docs/svg-effect

This snippet demonstrates how to explicitly set the `transformBox` property using a `motionValue`. This allows developers to override the default `fill-box` behavior of `svgEffect` for SVG transform origins.

```javascript
svgEffect("path", { transformBox: motionValue("view-box") })
```

--------------------------------

### Constrain Dragging to Another Component's Bounding Box (React)

Source: https://motion.dev/docs/react-drag

For dynamic constraints, pass a `ref` to another component via the `dragConstraints` prop. The draggable element will then be contained within the bounding box of the referenced component, automatically adapting to its size and position.

```jsx
import { motion } from "motion/react"
import { useRef } from "react"

export function DragContainer() {
  const constraintsRef = useRef(null)

  return (
    <motion.div ref={constraintsRef} style={{ width: 300, height: 200 }}>
      <motion.div drag dragConstraints={constraintsRef} />
    </motion.div>
  )
}
```

--------------------------------

### React Accordion Component Without LayoutGroup

Source: https://motion.dev/docs/react-layout-group

Illustrates an `Accordion` component rendering multiple `ToggleContent` items. Without `LayoutGroup`, sibling components are unaware of each other's layout changes, which can lead to uncoordinated animations or visual glitches when their state updates.

```jsx
function Accordion() {
return (
<>
<ToggleContent />
<ToggleContent />
</>
)
}
```

--------------------------------

### Handle onDirectionLock Callback Event (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `onDirectionLock` callback function is triggered when `dragDirectionLock` is enabled and the drag direction (x or y) has been determined. It provides the locked axis as an argument (e.g., 'x' or 'y'). This callback is useful for reacting to the moment the drag behavior becomes locked to a single axis, potentially adjusting UI or feedback.

```jsx
<motion.div
  drag
  dragDirectionLock
  onDirectionLock={axis => console.log(axis)}
/>
```

--------------------------------

### Control Spring Animation Damping Strength in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `damping` property defines the strength of the opposing force in a Framer Motion spring animation. A higher value reduces oscillation, making the animation settle faster, while setting it to `0` will cause indefinite oscillation. Its default value is `10`.

```jsx
<motion.a
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', damping: 300 }}
/>
```

--------------------------------

### Vertical Ticker with Y-Axis Animation

Source: https://motion.dev/docs/react-ticker

Configure the Ticker component to animate vertically by setting the axis prop to 'y'. Items will be laid out and animated along the vertical axis instead of the default horizontal direction.

```jsx
<Ticker items={items} axis="y" />
```

--------------------------------

### Animate SVG viewBox for Zooming with Motion in React

Source: https://motion.dev/docs/react-svg-animation

This snippet shows how to animate the `viewBox` attribute to achieve a zoom-out effect. By expanding the `viewBox` dimensions, the SVG content appears smaller within the same display area.

```jsx
<motion.svg
  viewBox="0 0 200 200"
  animate={{ viewBox: "-100 -100 300 300" }} // Zoom out
/>
```

--------------------------------

### Cancel svgEffect Listener (JavaScript)

Source: https://motion.dev/docs/svg-effect

This code shows how to stop `svgEffect` from applying further updates to an element. The `svgEffect` function returns a cleanup function, which, when called, detaches the `motionValue` listener from the element.

```javascript
const width = motionValue("0px")
const cancel = svgEffect("#progress", { width })

cancel()
```

--------------------------------

### Apply Center-Point Rotation to SVG Elements with Motion in React

Source: https://motion.dev/docs/react-svg-animation

This snippet demonstrates Motion's modified behavior for SVG transforms, making them behave like CSS transforms. An `<motion.rect>` element will rotate around its center point, unlike native SVG transforms which use the `viewBox` origin.

```jsx
<motion.rect style={{ rotate: 90 }} />
```

--------------------------------

### Set Spring Animation Termination Distance with restDelta in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `restDelta` property in Framer Motion defines the distance threshold below which a spring animation can end, provided the speed is also below `restSpeed`. Meeting both conditions allows the spring animation to gracefully conclude. Its default value is `0.01`.

```jsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ type: 'spring', restDelta: 0.5 }}
/>
```

--------------------------------

### Adjust Inertia Animation Power for Target Calculation in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `power` property for Framer Motion's inertia animations, particularly in `dragTransition`, influences the extent of the automatically calculated target. A higher `power` value results in a further calculated target, impacting the animation's reach. The default value is `0.8`.

```jsx
<motion.div
  drag
  dragTransition={{ power: 0.2 }}
/>
```

--------------------------------

### Animate SVG Path Morphing with Motion d Attribute in React

Source: https://motion.dev/docs/react-svg-animation

This code demonstrates animating the `d` attribute of an SVG `<motion.path>` to morph its shape. Motion can interpolate between paths as long as they have a similar structure (same number and type of path instructions).

```jsx
<motion.path
  d="M 0,0 l 0,10 l 10,10"
  animate={{ d: "M 0,0 l 10,0 l 10,10" }}
/>
```

--------------------------------

### Animate mask-image CSS property in React

Source: https://motion.dev/docs/react-animation

Motion can animate non-standard animatable CSS properties like mask-image that browsers normally cannot animate. This enables gradient mask animations for creative effects.

```jsx
<motion.nav
  initial={{ maskImage: "linear-gradient(to right, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)" }}
  animate={{ maskImage: "linear-gradient(to right, rgba(0,0,0,1) 90%, rgba(0,0,0,1) 100%)" }}
/>
```

--------------------------------

### Constrain Dragging with Pixel Values (React)

Source: https://motion.dev/docs/react-drag

Define fixed boundaries for a draggable `motion` component using the `dragConstraints` prop, providing an object with pixel values for `top`, `left`, `right`, and `bottom`. This restricts the element's movement within a specific area.

```jsx
<motion.div
  drag
  dragConstraints={{
    top: -50,
    left: -50,
    right: 50,
    bottom: 50
  }}
/>
```

--------------------------------

### Fix Border Radius Distortion with Style Props React

Source: https://motion.dev/docs/react-layout-animations

Shows how to correct border-radius distortion during scale animations by setting the borderRadius property via the style prop. Motion automatically corrects distortion on border-radius and box-shadow properties, but they must be explicitly set through style, animate, or other animation props.

```javascript
<motion.div layout style={{ borderRadius: 20 }} />
```

--------------------------------

### Cancel a delayed callback in JavaScript

Source: https://motion.dev/docs/delay

`delay` returns a cancellation function that prevents the callback from firing when called. Store the return value and invoke it to cancel the pending delay before the duration completes.

```javascript
const cancel = delay(callback, 0.25)

cancel() // callback will never fire
```

--------------------------------

### dragMomentum Property

Source: https://motion.dev/docs/react-motion-component

Controls whether momentum from the pan gesture is applied to the component when dragging finishes. Enabled by default.

```APIDOC
## dragMomentum

### Description
Apply momentum from the pan gesture to the component when dragging finishes. Set to `true` by default.

### Default Value
`true`

### Property Type
Boolean

### Usage Example
```jsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  dragMomentum={false}
/>
```
```

--------------------------------

### Lock Dragging to Initial Axis and Log Event (React)

Source: https://motion.dev/docs/react-drag

Enable `dragDirectionLock` to confine an element's movement to the first axis it's dragged on, preventing diagonal movement once an initial direction is established. The `onDirectionLock` callback provides feedback on which axis was locked.

```jsx
<motion.div
  drag="x"
  dragDirectionLock
  onDirectionLock={axis => console.log(`Locked to ${axis} axis`)}
/>
```

--------------------------------

### Track Scroll Position of a Specific Element (Container)

Source: https://motion.dev/docs/react-use-scroll

This snippet demonstrates how to track the scroll position of a custom scrollable element instead of the default browser viewport. By passing a `ref` to the `container` option of `useScroll`, the hook will monitor the scroll within that specific DOM element, useful for carousels or custom scroll areas.

```jsx
const carouselRef = useRef(null)
const { scrollX } = useScroll({
  container: carouselRef
})

return (
  <div ref={carouselRef} style={{ overflow: "scroll" }}>
    {children}
  </div>
)
```

--------------------------------

### Typewriter with no typing speed variance

Source: https://motion.dev/docs/react-typewriter

By default, `Typewriter` introduces natural variance in typing speed. This snippet shows how to disable this feature by setting the `variance` prop to `0`, resulting in a consistent typing speed for every character.

```jsx
<Typewriter variance={0}>Hello world!</Typewriter>
```

--------------------------------

### Disable automatic drag with dragListener prop

Source: https://motion.dev/docs/react-use-drag-controls

Set dragListener={false} prop on motion component to prevent automatic drag initiation on pointerdown events. This allows exclusive control of drag sessions through the controls object.

```javascript
<motion.div
  drag
  dragListener={false}
  dragControls={controls}
/>
```

--------------------------------

### Restore Native SVG Transform Behavior with transformBox in Motion React

Source: https://motion.dev/docs/react-svg-animation

This code illustrates how to override Motion's default transform behavior for SVGs by explicitly setting `transformBox: "view-box"`. This causes the `<motion.rect>` to rotate relative to the SVG `viewBox` origin, mirroring native SVG transform behavior.

```jsx
<motion.rect style={{ rotate: 90, transformBox: "view-box" }} />
```

--------------------------------

### Disable Drag Momentum on Release (React)

Source: https://motion.dev/docs/react-drag

By default, draggable elements exhibit momentum when released, creating a realistic, physical feel. To disable this inertia animation and make the element stop immediately, set the `dragMomentum` prop to `false`.

```jsx
<motion.div drag dragMomentum={false} />
```

--------------------------------

### Cancel active press gesture

Source: https://motion.dev/docs/press

The press function returns a cancel function that stops all active event handlers for that gesture. Call it to cancel the press gesture.

```javascript
const cancelPress = press(element, callback)

cancelPress()
```

--------------------------------

### Manually stop or cancel drag gesture

Source: https://motion.dev/docs/react-use-drag-controls

Use controls.stop() to end drag gesture normally and trigger onDragEnd callback, or controls.cancel() to end gesture without calling the callback. Drag automatically stops on pointerup event.

```javascript
controls.stop()
// or
controls.cancel()
```

--------------------------------

### Disable dragMomentum for Dragging (React/JSX)

Source: https://motion.dev/docs/react-motion-component

The `dragMomentum` prop, enabled by default, applies momentum from the pan gesture to the component after dragging ends, causing it to continue moving briefly. Setting it to `false` disables this behavior, making the element stop immediately upon release. This provides more precise control over the element's final resting position.

```jsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  dragMomentum={false}
/>
```

--------------------------------

### Set Inertia Animation Deceleration Duration with timeConstant in Framer Motion

Source: https://motion.dev/docs/react-transitions

The `timeConstant` property for Framer Motion's inertia animations modifies the duration over which the animation decelerates. Adjusting this value changes the feel of the deceleration, making it longer or shorter. The default value is `700`.

```jsx
<motion.div
  drag
  dragTransition={{ timeConstant: 200 }}
/>
```

--------------------------------

### dragDirectionLock Property

Source: https://motion.dev/docs/react-motion-component

Locks drag direction into the soonest detected direction. Useful for preventing accidental multi-directional dragging.

```APIDOC
## dragDirectionLock

### Description
Locks drag direction into the soonest detected direction. For example, if the component is moved more on the `x` axis than `y` axis before the drag gesture kicks in, it will **only** drag on the `x` axis for the remainder of the gesture.

### Default Value
`false`

### Property Type
Boolean

### Usage Example
```jsx
<motion.div drag dragDirectionLock />
```
```

--------------------------------

### Disable Autoplay Video based on Framer `useReducedMotion` Hook in React

Source: https://motion.dev/docs/react-accessibility

Control the autoplay behavior of a video element in a React component by using the boolean returned from `useReducedMotion`. This allows for disabling auto-playing videos for users who have enabled the 'Reduced Motion' setting, improving accessibility.

```jsx
function BackgroundVideo() {
  const shouldReduceMotion = useReducedMotion()

  return <video autoplay={!shouldReduceMotion} />
}
```

--------------------------------

### Lock Dragging to a Single Axis (React)

Source: https://motion.dev/docs/react-drag

To restrict a `motion` component's dragging movement to either the horizontal or vertical axis, set the `drag` prop to 'x' or 'y'. This is useful for controlled, directional movement.

```jsx
<motion.div drag="x" />
```

--------------------------------

### Cancel Active Hover Event Handlers with Motion's hover

Source: https://motion.dev/docs/hover

The `hover` function returns a cleanup function that, when invoked, will remove all associated event listeners and stop the hover detection. This is useful for programmatically disabling hover effects or for cleanup when an element is removed from the DOM.

```javascript
const cancelHover = hover(element, callback)

cancelHover()
```