<div align="center">

# Open in External App Pro

Open files with external applications in VSCode, with context menu support.

[English](./README.md) | [中文](./README.zh-CN.md)

[![Version](https://img.shields.io/visual-studio-marketplace/v/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items/bbznop.open-in-external-app-pro/changelog) [![Installs](https://img.shields.io/visual-studio-marketplace/i/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items?itemName=bbznop.open-in-external-app-pro) [![Downloads](https://img.shields.io/visual-studio-marketplace/d/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items?itemName=bbznop.open-in-external-app-pro) [![Rating Star](https://img.shields.io/visual-studio-marketplace/stars/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items?itemName=bbznop.open-in-external-app-pro&ssr=false#review-details)

</div>

## Motivation

VSCode is an excellent editor, but sometimes you want to use an external application for certain files. For example, editing markdown in [Typora](https://www.typora.io/), opening `.psd` files in Photoshop, or previewing `.html` in a browser.

With this extension, just right-click a file and select **Open in External App** to open it with the configured application. You can also configure apps to appear **directly in the context menu** for one-click access.

## Features

- Open files with system default application or configured external apps
- **Context Menu Integration**: Show configured apps directly in the right-click context menu
- **Folder Support**: Open folders in external applications (e.g., Explorer, Finder)
- **Non-ASCII Path Support**: Full support for Chinese and other Unicode file paths
- **Shell Commands**: Run custom shell commands with variable placeholders
- **WSL Support**: Automatic path conversion between WSL and Windows
- **Multi-app Support**: Configure multiple apps per file type with quick pick selection

## Installation

1. Open the **Extensions** view (`Ctrl+Shift+X`)
2. Search for `open-in-external-app-pro`
3. Click **Install**

## Configuration

### Basic Usage

Configure `openInExternalApp.openMapper` in your `settings.json`:

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "html",
      "apps": [
        {
          "title": "Chrome",
          "openCommand": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        },
        {
          "title": "Firefox",
          "openCommand": "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
          "args": ["-private-window"]
        }
      ]
    },
    {
      "extensionName": "md",
      "apps": [
        {
          "title": "Typora",
          "openCommand": "typora"
        }
      ]
    }
  ]
}
```

### Context Menu Integration (`showInContextMenu`)

By default, configured apps appear in a quick pick dropdown when you click **Open in External App**. You can make specific apps appear **directly in the right-click context menu** by setting `showInContextMenu: true`:

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": ["html", "htm"],
      "apps": [
        {
          "title": "Chrome",
          "openCommand": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "showInContextMenu": true
        },
        {
          "title": "Firefox",
          "openCommand": "C:\\Program Files\\Mozilla Firefox\\firefox.exe"
        }
      ]
    },
    {
      "extensionName": "md",
      "apps": [
        {
          "title": "Typora",
          "openCommand": "typora",
          "showInContextMenu": true
        }
      ]
    },
    {
      "extensionName": ["css", "json"],
      "apps": [
        {
          "title": "Notepad",
          "openCommand": "notepad",
          "showInContextMenu": true
        }
      ]
    },
    {
      "extensionName": "__FOLDER__",
      "apps": [
        {
          "title": "Explorer",
          "openCommand": "explorer",
          "showInContextMenu": true
        }
      ]
    },
    {
      "extensionName": "__ALL__",
      "apps": [
        {
          "title": "Reveal in Explorer",
          "shellCommand": "explorer /select,\"${file}\"",
          "showInContextMenu": true
        }
      ]
    }
  ]
}
```

With this configuration:

- Right-clicking an `.html` file shows **Chrome** directly in the context menu
- Right-clicking a `.md` file shows **Typora** directly in the context menu
- Right-clicking a folder shows **Explorer** directly in the context menu
- **Reveal in Explorer** appears for all files (`__ALL__`)
- Apps without `showInContextMenu: true` (like Firefox) still appear in the quick pick dropdown

> After changing `showInContextMenu` settings, a window reload is required for the changes to take effect. The extension will prompt you automatically.

### Special Extension Names

| Extension Name    | Description                                  |
| ----------------- | -------------------------------------------- |
| `"html"`          | Match files with `.html` extension           |
| `["html", "htm"]` | Match files with `.html` or `.htm` extension |
| `"__ALL__"`       | Match all files (shared config)              |
| `"__FOLDER__"`    | Match folders only                           |
| `"*"`             | Match files without extension                |

### Shell Commands

You can use shell commands with [variable placeholders](https://code.visualstudio.com/docs/editor/variables-reference#_predefined-variables):

```jsonc
{
  "extensionName": "ts",
  "apps": [
    {
      "title": "Run TS",
      "shellCommand": "ts-node ${file}"
    }
  ]
}
```

Additional variables: `${cursorLineNumber}`, `${cursorColumnNumber}`

### Shell Environment Variables

```jsonc
{
  "extensionName": "ts",
  "apps": [
    {
      "title": "Run TS",
      "shellCommand": "ts-node ${file}",
      "shellEnv": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

Platform-specific environment variables:

```jsonc
{
  "shellEnv": {
    "windows": { "PLATFORM": "Windows" },
    "linux": { "PLATFORM": "GNU/Linux" },
    "osx": { "PLATFORM": "macOS" }
  }
}
```

### Electron Apps

For apps built with Electron (e.g., Typora), use `isElectronApp: true`:

```jsonc
{
  "extensionName": "md",
  "apps": [
    {
      "title": "Typora",
      "isElectronApp": true
    }
  ]
}
```

### WSL Support

When using VSCode in WSL remote mode, paths are automatically converted to Windows format. To use WSL-native apps, set `wslConvertWindowsPath: false`:

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "pdf",
      "apps": [
        {
          "title": "Evince (WSL)",
          "shellCommand": "evince ${file}",
          "wslConvertWindowsPath": false
        }
      ]
    }
  ]
}
```

### Keyboard Shortcuts

Assign a keyboard shortcut for a specific config item:

`keybindings.json`:

```jsonc
{
  "key": "cmd+k cmd+o",
  "command": "openInExternalApp.open",
  "args": {
    "configItemId": "my-id"
  }
}
```

`settings.json`:

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "",
      "id": "my-id",
      "apps": ""
    }
  ]
}
```

## App Configuration Options

| Option                  | Type       | Default    | Description                                            |
| ----------------------- | ---------- | ---------- | ------------------------------------------------------ |
| `title`                 | `string`   | _required_ | Display name for the app                               |
| `openCommand`           | `string`   | -          | Path or command to the application                     |
| `shellCommand`          | `string`   | -          | Shell command to execute (supports variables)          |
| `args`                  | `string[]` | `[]`       | Arguments passed to the application                    |
| `isElectronApp`         | `boolean`  | `false`    | Use VSCode API to open (for Electron apps)             |
| `shellEnv`              | `object`   | -          | Additional environment variables for shell commands    |
| `wslConvertWindowsPath` | `boolean`  | `true`     | Convert WSL path to Windows path                       |
| `showInContextMenu`     | `boolean`  | `false`    | Show this app directly in the right-click context menu |

## License

[MIT](./LICENSE)
