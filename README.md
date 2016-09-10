EFG-lite
==============================
A very simple, bare-bones graph editor. Obviously based on / inspired by [this](http://bl.ocks.org/mbostock/929623) D3 example.

Use it [here](https://rawgit.com/alex-r-bigelow/efg-lite/master/index.html).

## Current abilities:
  - Create and connect nodes (TODO: awkward interaction)
  - Edit node attributes
  - Reverse links
  - Save, switch, and download graphs (uses your browser's localStorage for saving graphs)

## Abilities that may come if I get around to it:
  - Delete nodes
  - Delete links
  - More download formats
  
Teaser: I'm working on a much cooler, much more general graph editing interface, so I won't be including any features beyond these basics in EFG-lite.

## Setup
It's client-side only stuff, so you can host this anywhere (Google Drive, etc). Probably the easiest way to run it is to cd into the repository and type:

    python -m SimpleHTTPServer
