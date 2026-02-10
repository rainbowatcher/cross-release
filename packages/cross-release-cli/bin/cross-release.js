#!/usr/bin/env node

"use strict"

const App = await import("../dist/app.mjs")
const app = new App.default()
void app.run()
