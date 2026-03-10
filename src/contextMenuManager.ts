import { readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

import vscode from 'vscode';
import { localize } from 'vscode-nls-i18n';

import getExtensionConfig from './config';
import { isDirectory } from './utils/fs';
import { logger } from './utils/logger';
import { open } from './utils/open';

const DYNAMIC_COMMAND_PREFIX = 'openInExternalApp.contextMenu.';

interface DynamicMenuEntry {
    commandId: string;
    title: string;
    extensionNames: string[];
    appTitle: string;
}

function sanitizeTitle(title: string): string {
    return title.replaceAll(/[^\w-]/g, '_');
}

function generateWhenClause(extensionNames: string[], isEditorContext: boolean): string | null {
    const hasAll = extensionNames.includes('__ALL__');
    const hasFolder = extensionNames.includes('__FOLDER__');
    const fileExts = extensionNames.filter(
        (n) => n !== '__FOLDER__' && n !== '__ALL__' && n !== '*',
    );
    const hasWildcard = extensionNames.includes('*');

    if (hasAll) {
        return 'isFileSystemResource';
    }

    const conditions: string[] = [];

    if (fileExts.length > 0) {
        const extConditions = fileExts.map((ext) => `resourceExtname == .${ext}`);
        if (extConditions.length === 1) {
            conditions.push(`isFileSystemResource && ${extConditions[0]}`);
        } else {
            conditions.push(`isFileSystemResource && (${extConditions.join(' || ')})`);
        }
    }

    if (hasWildcard) {
        conditions.push('isFileSystemResource && !explorerResourceIsFolder && resourceExtname == ');
    }

    if (hasFolder && !isEditorContext) {
        conditions.push('explorerResourceIsFolder');
    }

    if (conditions.length === 0) return null;
    return conditions.join(' || ');
}

function extractDynamicEntries(config: ExtensionConfigItem[]): DynamicMenuEntry[] {
    const entryMap = new Map<string, DynamicMenuEntry>();

    for (const configItem of config) {
        const { extensionName, apps } = configItem;
        if (!apps || typeof apps === 'string') continue;

        for (const app of apps) {
            if (!app.showInContextMenu || !app.title) continue;

            const sanitized = sanitizeTitle(app.title);
            const commandId = `${DYNAMIC_COMMAND_PREFIX}${sanitized}`;

            const extNames = Array.isArray(extensionName) ? [...extensionName] : [extensionName];

            if (entryMap.has(commandId)) {
                const existing = entryMap.get(commandId)!;
                for (const ext of extNames) {
                    if (!existing.extensionNames.includes(ext)) {
                        existing.extensionNames.push(ext);
                    }
                }
            } else {
                entryMap.set(commandId, {
                    commandId,
                    title: app.title,
                    extensionNames: extNames,
                    appTitle: app.title,
                });
            }
        }
    }

    return Array.from(entryMap.values());
}

function collectAllExtensionNames(config: ExtensionConfigItem[]): string[] {
    const allNames = new Set<string>();
    for (const configItem of config) {
        const { extensionName } = configItem;
        if (Array.isArray(extensionName)) {
            for (const n of extensionName) allNames.add(n);
        } else {
            allNames.add(extensionName);
        }
    }
    return Array.from(allNames);
}

function updatePackageJson(
    extensionPath: string,
    entries: DynamicMenuEntry[],
    config: ExtensionConfigItem[],
): boolean {
    const packageJsonPath = join(extensionPath, 'package.json');
    const content = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);

    // Filter out existing dynamic entries
    const staticCommands = (packageJson.contributes.commands || []).filter(
        (cmd: any) => !cmd.command.startsWith(DYNAMIC_COMMAND_PREFIX),
    );
    const staticExplorerMenu = (packageJson.contributes.menus['explorer/context'] || []).filter(
        (entry: any) => !(entry.command || '').startsWith(DYNAMIC_COMMAND_PREFIX),
    );
    const staticEditorMenu = (packageJson.contributes.menus['editor/title/context'] || []).filter(
        (entry: any) => !(entry.command || '').startsWith(DYNAMIC_COMMAND_PREFIX),
    );

    // Update when clause for the static "Open in External App" entries
    const allExtNames = collectAllExtensionNames(config);
    const staticExplorerWhen =
        allExtNames.length > 0 ? generateWhenClause(allExtNames, false) : 'false';
    const staticEditorWhen =
        allExtNames.length > 0
            ? generateWhenClause(
                  allExtNames.filter((n) => n !== '__FOLDER__'),
                  true,
              )
            : 'false';

    for (const entry of staticExplorerMenu) {
        if (entry.command === 'openInExternalApp.open') {
            entry.when = staticExplorerWhen ?? 'false';
        }
    }
    for (const entry of staticEditorMenu) {
        if (entry.command === 'openInExternalApp.open') {
            entry.when = staticEditorWhen ?? 'false';
        }
    }

    // Generate new dynamic entries
    const dynamicCommands = entries.map((entry) => ({
        command: entry.commandId,
        title: entry.title,
    }));

    const dynamicExplorerMenu: any[] = [];
    const dynamicEditorMenu: any[] = [];

    for (const entry of entries) {
        const explorerWhen = generateWhenClause(entry.extensionNames, false);
        if (explorerWhen) {
            dynamicExplorerMenu.push({
                command: entry.commandId,
                when: explorerWhen,
                group: 'navigation@10',
            });
        }

        const editorExtNames = entry.extensionNames.filter((n) => n !== '__FOLDER__');
        if (editorExtNames.length > 0) {
            const editorWhen = generateWhenClause(editorExtNames, true);
            if (editorWhen) {
                dynamicEditorMenu.push({
                    command: entry.commandId,
                    when: editorWhen,
                    group: 'navigation@10',
                });
            }
        }
    }

    // Merge
    packageJson.contributes.commands = [...staticCommands, ...dynamicCommands];
    packageJson.contributes.menus['explorer/context'] = [
        ...staticExplorerMenu,
        ...dynamicExplorerMenu,
    ];
    packageJson.contributes.menus['editor/title/context'] = [
        ...staticEditorMenu,
        ...dynamicEditorMenu,
    ];

    const newContent = `${JSON.stringify(packageJson, null, 4)}\n`;
    if (newContent === content) return false;

    writeFileSync(packageJsonPath, newContent, 'utf8');
    return true;
}

function findAppByTitle(
    config: ExtensionConfigItem[],
    appTitle: string,
    filePath: string,
    isDir: boolean,
): ExternalAppConfig | undefined {
    const ext = extname(filePath);
    const extensionName = ext && ext !== '.' ? ext.slice(1) : null;

    // Try to find a config item that matches the file type and has the app
    for (const configItem of config) {
        const { apps, extensionName: configExtName } = configItem;
        if (typeof apps === 'string') continue;

        const matchedApp = apps.find((app) => app.title === appTitle);
        if (!matchedApp) continue;

        const configExtNames = Array.isArray(configExtName) ? configExtName : [configExtName];

        let matches = false;
        if (configExtNames.includes('__ALL__')) {
            matches = true;
        } else if (isDir) {
            matches = configExtNames.includes('__FOLDER__');
        } else if (extensionName) {
            matches = configExtNames.includes(extensionName);
        } else {
            matches = configExtNames.includes('*');
        }

        if (matches) return matchedApp;
    }

    // Fallback: use the first config item that has the app with this title
    for (const configItem of config) {
        const { apps } = configItem;
        if (typeof apps === 'string') continue;

        const matchedApp = apps.find((app) => app.title === appTitle);
        if (matchedApp) return matchedApp;
    }

    return undefined;
}

async function openByAppTitle(uri: vscode.Uri, appTitle: string): Promise<void> {
    const config = getExtensionConfig();
    const filePath = uri.fsPath;
    const isDir = await isDirectory(filePath);
    const matchedApp = findAppByTitle(config, appTitle, filePath, isDir);

    if (matchedApp) {
        await open(filePath, matchedApp);
        return;
    }

    const reload = await vscode.window.showWarningMessage(
        localize('msg.contextMenu.appNotFound', appTitle),
        localize('msg.contextMenu.reload'),
    );
    if (reload) {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
}

export function registerDynamicCommands(context: vscode.ExtensionContext): void {
    const packageJsonPath = join(context.extensionPath, 'package.json');
    let packageJson: any;
    try {
        packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    } catch {
        return;
    }

    const commands: any[] = packageJson.contributes?.commands || [];
    const dynamicCommands = commands.filter((cmd: any) =>
        cmd.command.startsWith(DYNAMIC_COMMAND_PREFIX),
    );

    for (const cmd of dynamicCommands) {
        const appTitle = cmd.title;
        const disposable = vscode.commands.registerCommand(cmd.command, async (uri: vscode.Uri) => {
            uri ??= vscode.window.activeTextEditor?.document.uri as vscode.Uri;
            if (!uri) return;
            await openByAppTitle(uri, appTitle);
        });
        context.subscriptions.push(disposable);
    }

    if (dynamicCommands.length > 0) {
        logger.info(`registered ${dynamicCommands.length} dynamic context menu command(s)`);
    }
}

export async function syncContextMenu(context: vscode.ExtensionContext): Promise<void> {
    const config = getExtensionConfig();
    const entries = extractDynamicEntries(config);

    try {
        const changed = updatePackageJson(context.extensionPath, entries, config);
        if (changed) {
            logger.info('package.json updated with new context menu entries');
            const reload = await vscode.window.showInformationMessage(
                localize('msg.contextMenu.reloadRequired'),
                localize('msg.contextMenu.reload'),
            );
            if (reload) {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        }
    } catch (error: any) {
        logger.info(`failed to update package.json for context menu: ${error.message}`);
        vscode.window.showErrorMessage(`Failed to update context menu: ${error.message}`);
    }
}
