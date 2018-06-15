console.log('LOAD')
import * as vscode from 'vscode';
import { AvaNodeProvider } from './ava-outline';
export function activate(context: vscode.ExtensionContext) {
    console.log('activate')

    const avaTreeProvider = new AvaNodeProvider();
    const cwd = '/Users/abecchis/git/aws-slack-codepipeline-watch'
    vscode.window.registerTreeDataProvider('ava.test-tree', avaTreeProvider);
    vscode.commands.registerCommand('ava.test-tree.refresh', () => avaTreeProvider.refresh());
    console.log('registred')

}
export function deactivate() { };