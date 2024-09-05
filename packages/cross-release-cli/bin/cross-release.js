#!/usr/bin/env node

"use strict"

const App = await import("../dist/app.js")
const app = await App.default.create()
void app.run()
