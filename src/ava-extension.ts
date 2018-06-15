import * as vscode from 'vscode';
import { AvaNodeProvider } from './ava-outline';
export function activate(context: vscode.ExtensionContext) {
  
    const avaTreeProvider = new AvaNodeProvider();
    vscode.window.registerTreeDataProvider('ava.test-tree', avaTreeProvider);
    vscode.commands.registerCommand('ava.test-tree.refresh', () => avaTreeProvider.refresh());
    vscode.commands.registerCommand('ava.test-tree.openSelection', item => avaTreeProvider.openSelection(item));
    console.log('registered')
}
export function deactivate() { };