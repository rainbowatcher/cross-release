#!/usr/bin/env node

"use strict"

const App = await import("../dist/app.js")
const app = new App.default()
void app.run()
