<div align="center">

# Open in External App Pro

在 VSCode 中使用外部应用打开文件，支持右键菜单直接集成。

[English](./README.md) | [中文](./README.zh-CN.md)

[![Version](https://img.shields.io/visual-studio-marketplace/v/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items/bbznop.open-in-external-app-pro/changelog) [![Installs](https://img.shields.io/visual-studio-marketplace/i/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items?itemName=bbznop.open-in-external-app-pro) [![Downloads](https://img.shields.io/visual-studio-marketplace/d/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items?itemName=bbznop.open-in-external-app-pro) [![Rating Star](https://img.shields.io/visual-studio-marketplace/stars/bbznop.open-in-external-app-pro)](https://marketplace.visualstudio.com/items?itemName=bbznop.open-in-external-app-pro&ssr=false#review-details)

</div>

## 功能介绍

VSCode 是一个优秀的编辑器，但有时候你需要用外部应用处理某些文件。例如用 [Typora](https://www.typora.io/) 编辑 Markdown，用 Photoshop 打开 `.psd` 文件，或用浏览器预览 `.html` 文件。

使用本扩展，只需右键文件并选择 **Open in External App** 即可用配置的应用打开。你还可以将常用应用**直接显示在右键菜单**中，实现一键打开。

## 特性

- 使用系统默认应用或配置的外部应用打开文件
- **右键菜单集成**：将配置的应用直接显示在右键菜单中
- **文件夹支持**：在外部应用中打开文件夹（如资源管理器、Finder）
- **非 ASCII 路径支持**：完整支持中文及其他 Unicode 文件路径
- **Shell 命令**：运行自定义 Shell 命令，支持变量占位符
- **WSL 支持**：自动进行 WSL 和 Windows 路径转换
- **多应用支持**：每种文件类型可配置多个应用，通过快速选择菜单选择

## 安装

1. 打开 **扩展** 视图 (`Ctrl+Shift+X`)
2. 搜索 `open-in-external-app-pro`
3. 点击 **安装**

## 配置

### 基本用法

在 `settings.json` 中配置 `openInExternalApp.openMapper`：

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

### 右键菜单集成 (`showInContextMenu`)

默认情况下，配置的应用会在点击 **Open in External App** 后显示在快速选择下拉菜单中。你可以通过设置 `showInContextMenu: true` 将特定应用**直接显示在右键菜单**中：

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
          "title": "在资源管理器中显示",
          "shellCommand": "explorer /select,\"${file}\"",
          "showInContextMenu": true
        }
      ]
    }
  ]
}
```

配置效果：

- 右键 `.html` 文件时，**Chrome** 直接显示在菜单中
- 右键 `.md` 文件时，**Typora** 直接显示在菜单中
- 右键文件夹时，**Explorer** 直接显示在菜单中
- **在资源管理器中显示** 对所有文件生效（`__ALL__`）
- 未设置 `showInContextMenu: true` 的应用（如 Firefox）仍在快速选择下拉菜单中显示

> 修改 `showInContextMenu` 设置后，需要重新加载窗口才能生效。扩展会自动提示你重新加载。

### 特殊扩展名

| 扩展名            | 说明                                |
| ----------------- | ----------------------------------- |
| `"html"`          | 匹配 `.html` 扩展名的文件           |
| `["html", "htm"]` | 匹配 `.html` 或 `.htm` 扩展名的文件 |
| `"__ALL__"`       | 匹配所有文件（共享配置）            |
| `"__FOLDER__"`    | 仅匹配文件夹                        |
| `"*"`             | 匹配无扩展名的文件                  |

### Shell 命令

你可以使用带有[变量占位符](https://code.visualstudio.com/docs/editor/variables-reference#_predefined-variables)的 Shell 命令：

```jsonc
{
  "extensionName": "ts",
  "apps": [
    {
      "title": "运行 TS",
      "shellCommand": "ts-node ${file}"
    }
  ]
}
```

额外变量：`${cursorLineNumber}`、`${cursorColumnNumber}`

### Shell 环境变量

```jsonc
{
  "extensionName": "ts",
  "apps": [
    {
      "title": "运行 TS",
      "shellCommand": "ts-node ${file}",
      "shellEnv": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

按平台设置环境变量：

```jsonc
{
  "shellEnv": {
    "windows": { "PLATFORM": "Windows" },
    "linux": { "PLATFORM": "GNU/Linux" },
    "osx": { "PLATFORM": "macOS" }
  }
}
```

### Electron 应用

对于基于 Electron 的应用（如 Typora），使用 `isElectronApp: true`：

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

### WSL 支持

在 WSL 远程模式下使用 VSCode 时，路径会自动转换为 Windows 格式。如果需要使用 WSL 原生应用，设置 `wslConvertWindowsPath: false`：

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

### 快捷键绑定

为特定配置项分配快捷键：

`keybindings.json`：

```jsonc
{
  "key": "cmd+k cmd+o",
  "command": "openInExternalApp.open",
  "args": {
    "configItemId": "my-id"
  }
}
```

`settings.json`：

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

## 应用配置项

| 选项                    | 类型       | 默认值  | 说明                                         |
| ----------------------- | ---------- | ------- | -------------------------------------------- |
| `title`                 | `string`   | _必填_  | 应用的显示名称                               |
| `openCommand`           | `string`   | -       | 应用的路径或命令                             |
| `shellCommand`          | `string`   | -       | 要执行的 Shell 命令（支持变量）              |
| `args`                  | `string[]` | `[]`    | 传递给应用的参数                             |
| `isElectronApp`         | `boolean`  | `false` | 使用 VSCode API 打开（适用于 Electron 应用） |
| `shellEnv`              | `object`   | -       | Shell 命令的额外环境变量                     |
| `wslConvertWindowsPath` | `boolean`  | `true`  | 将 WSL 路径转换为 Windows 路径               |
| `showInContextMenu`     | `boolean`  | `false` | 将此应用直接显示在右键菜单中                 |

## 许可证

[MIT](./LICENSE)
