# Oasis Browser

Oasis Browser is a free, open-source Electron browser and AI workspace.

It combines a lightweight browser interface with built-in applications, experiments, games, media tools, and AI features.

The goal of Oasis is simple: **build a browser that can become more than just a browser.**

## What's Included

Oasis currently includes:

* **The Lobby** - An AI chatroom where multiple AI personalities interact with each other and the user in a shared virtual room.
* **Mystic Realm** - A collection of tarot, astrology, numerology, dreams, and other interactive tools.
* **Maze Madness** - An experimental browser-based game.
* **Media / TV** - Built-in media functionality and experimental interfaces.
* **AI-assisted browser control** - Experimental AI interaction with the browser.
* **Custom wallpapers and interface components**
* Additional experimental applications and features.

Oasis is designed to be modular, so new applications and experiments can be added over time.

## Project Structure

```text
Oasis-Browser/
│
├── apps/
│   ├── lobby/
│   ├── mystic-realm/
│   └── maze-madness/
│
├── css/
├── js/
├── wallpapers/
│
├── browser.html
├── index.html
├── main.js
├── preload.js
├── tv.html
└── package.json
```

## Running Oasis

Oasis is built with Electron.

To work with the source code, clone the repository and install the required dependencies:

```bash
npm install
```

Then start the application:

```bash
npm start
```

The exact development setup may change as Oasis continues to evolve.

## Windows Release

Prebuilt Windows installers are available through the **Releases** section of this repository.

If you simply want to use Oasis rather than develop it, downloading the latest release is the easiest option.

## Open Source

Oasis is intentionally open source.

You are welcome to:

* Use it
* Modify it
* Fork it
* Experiment with it
* Add applications
* Create new themes
* Add games
* Improve existing features
* Connect additional AI systems
* Create your own version of Oasis

If you build something interesting, **share it with the community.**

Your version may inspire the next version of Oasis.

## Contributions

Pull requests and improvements are welcome.

You don't have to completely understand the entire project before experimenting with it. Oasis is intended to be something people can take apart, learn from, modify, and rebuild.

Ideas, bug fixes, new applications, interface improvements, documentation, and experimental features are all welcome.

## AI Compatibility

Oasis is being developed with experimentation in mind.

The project may support different AI backends and local AI systems as development continues. The goal is to avoid unnecessarily locking Oasis to a single AI provider.

Local AI experimentation, including OpenAI-compatible local endpoints, is part of the project's direction.

## Project Philosophy

Oasis is an experiment in what happens when a browser becomes a place for more than browsing.

Instead of treating every application as a separate window or website, Oasis brings different tools and experiences together into one environment.

Some parts are polished.

Some parts are experimental.

Some parts may change completely.

That's intentional.

## License

MIT License

You are free to use, modify, distribute, and build upon Oasis Browser according to the terms of the MIT License.

## Community

If you fork Oasis, create an application for it, improve an existing feature, or take the project in a completely different direction, share what you made.

**Oasis is not meant to stay exactly the way it is today.**

Build something with it.
