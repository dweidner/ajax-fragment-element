# `<ajax-fragment>`

A custom element to enable partial page updates via AJAX.

**[Demo](https://dweidner.github.io/ajax-fragment-element/demo.html)**

## Examples

```html
  <ajax-fragment>
  </ajax-fragment>
```

- Use the `target` attribute to reference another fragment in the same document.

## Installation

Choose one of the following options:

1. Install via [npm](https://www.npmjs.com/package/@dweidner/ajax-fragment-element): `npm install @dweidner/ajax-fragment-element`
1. [Download the source manually from GitHub](https://github.com/dweidner/ajax-fragment-element/tags) into your project.
1. Skip this step and use the script directly via a 3rd party CDN (not recommended for production use)

## Usage

Make sure you include the `<script>` in your project (choose one of these):

```html
<!-- Host yourself -->
<script type="module" src="opt-in.js"></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<script type="module" src="https://www.unpkg.com/@dweidner/ajax-fragment-element@1.0.0"></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<script type="module" src="https://esm.sh/@dweidner/ajax-fragment-element@1.0.0"></script>
```

## Features

- Load 
- Remember a users decision for future requests
