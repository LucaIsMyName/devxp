# DevXp

**This App is in beta and won't work as expected on your machine**

`DevXp` is an al-in-one app for development utilities like DNS, ping, prettifiying, converting data-formts or strings, generating CSS custom property/library themes, ...

## To-Do and Bugs

### `devxp`

- harmonize light and dark-them colors (blue-600 for light blue-700 for dark!)
- make a settings UI (`<Modal />` or `<SidedDrawer />`)
  - theme: light, dark, system
  - font-size: sm, md, lg
  - display/hide `beta` apps
  - introduce dark/light toggle

### `layout`

- `<Sidebar />`: use `<Swiper />` for slider of microapps (normal scrolling on desktop, with arrows and swipe on mobile and table)

### `partials`

- `<MdToHtml />`: Fix parsing og MD file
- `<DndWrapper />` & `<DndItem />`: implemenet generic drag'n'drop components
- `<Modal />`: implement more size options
- 

### microapps

- `<WebReader />`: Change markup: title Tag small, h1 big (fallback: h1 or title)
- `<Prettifier />`: Use `<CodeEditorLayout />` instead of diy 
- `<InAppBrowser />`: Fix re-rendering and general UX/UI problems like:
  - defensive design for tabs
  - back/forward works over multiple tabs, why?!?!
- `<EmailBuilder />`: implement
  - state and local storage
  - `<Input />` not working!
  - Drag and Drop from `<EmailBuilder />` Sidebar in the UI of the mail, not via Click!
  - make `<TwoColumns />` insertable for different elements
  - 