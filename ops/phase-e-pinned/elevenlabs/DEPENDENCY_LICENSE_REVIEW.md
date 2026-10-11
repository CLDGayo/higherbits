# Dependency & License Review: ElevenLabs-crawled

- Upstream Repository: `https://github.com/elevenlabs/ui`
- Revision: `23c31bd3088814215a8b5d0bfb56b327cad1a578`
- License: MIT License (confirmed in `LICENSE.md`, SHA-256 `ad3f66b8568970d067e3bd47b690ad013945a61f972559743946a3a6558dc828`)
- Dependencies:
  - `audio-player`: React, lucide-react, custom audio controls
  - `bar-visualizer`: HTML5 AudioContext, MediaStream API
  - `live-waveform`: HTML5 AudioContext, MediaStream API
  - `orb`: `@react-three/fiber`, `@react-three/drei`, `three` (heavy 3D WebGL runtime)
  - `response`: React, Tailwind CSS
  - `shimmering-text`: `motion/react`
  - `voice-picker`: React, lucide-react
  - `waveform`: React, canvas/audio scrubbing
- Status: Permissive license passes; hold applied due to runtime prerequisites and pending demo/preview pipeline assets.
