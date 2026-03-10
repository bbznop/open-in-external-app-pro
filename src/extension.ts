import vscode from 'vscode';
import { init } from 'vscode-nls-i18n';

import commands from './commands';
import { registerDynamicCommands, syncContextMenu } from './contextMenuManager';
import { logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext): void {
    init(context.extensionPath);

    logger.info(`language: ${vscode.env.language}`);
    const { remoteName } = vscode.env;
    if (remoteName) {
        logger.info(`active extension in ${remoteName} remote environment`);
    }

    commands.forEach((command) => {
        context.subscriptions.push(
            vscode.commands.registerCommand(command.identifier!, command.handler),
        );
    });

    // Register command handlers for dynamic context menu items already in package.json
    registerDynamicCommands(context);

    // Check if package.json needs to be updated based on current config
    syncContextMenu(context);

    // Listen for configuration changes to re-sync context menu
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('openInExternalApp.openMapper')) {
                syncContextMenu(context);
            }
        }),
    );
}

export function deactivate(): void {
    logger.dispose();
}
