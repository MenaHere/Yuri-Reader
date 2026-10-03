<!-- SPDX-License-Identifier: Apache-2.0 -->
# Yuri-Reader Flatpak

This is a project-owned, signed Flatpak remote hosted on Github Page (not Flathub). 
If you prefer flatpak, add it once, then install the app:

```bash
flatpak --user remote-add --if-not-exists yurireader \
  https://menahere.github.io/Yuri-Reader/yurireader.flatpakrepo
flatpak --user install yurireader com.mena.yurireader
```

Run it:

```bash
flatpak run com.mena.yurireader
```
