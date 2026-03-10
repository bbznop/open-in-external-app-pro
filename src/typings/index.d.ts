declare module 'wsl-path';

interface CommandModule {
    identifier: string;
    handler: (...args: any[]) => any;
}

interface PlatformVariables {
    windows?: NodeJS.ProcessEnv;
    linux?: NodeJS.ProcessEnv;
    osx?: NodeJS.ProcessEnv;
}

interface ExternalAppConfig {
    title: string;
    openCommand?: string;
    args?: string[];
    isElectronApp?: boolean;
    shellCommand?: string;
    shellEnv?: NodeJS.ProcessEnv | PlatformVariables;
    /**
     * Whether to convert WSL path to Windows path when running in WSL remote mode.
     * Only applies when vscode.env.remoteName === 'wsl'.
     * @default true - Convert to Windows path (e.g., /home/user/file -> C:\Users\user\file)
     * @example false - Keep WSL native path for WSL applications like evince
     */
    wslConvertWindowsPath?: boolean;
    /**
     * When true, this app will appear directly in the right-click context menu
     * instead of only in the quick pick submenu.
     * Requires VS Code reload after changing.
     * @default false
     */
    showInContextMenu?: boolean;
}

interface ExtensionConfigItem {
    id: string;
    extensionName: string | string[];
    apps: ExternalAppConfig[] | string;
}
