import * as vscode from 'vscode';
import { AvaNodeProvider } from './ava-outline';
import { AvaTestTaskProvider } from './ava-test-provider';
import {runTests} from './ava-test-runner';

export function activate(context: vscode.ExtensionContext) {

    const avaTreeProvider = new AvaNodeProvider();
    vscode.window.registerTreeDataProvider('ava.test-tree', avaTreeProvider);
    vscode.commands.registerCommand('ava.test-tree.refresh', () => avaTreeProvider.refresh());
    vscode.commands.registerCommand('ava.test-tree.openSelection', item => avaTreeProvider.openSelection(item));
    vscode.commands.registerCommand('ava.test-tree.run-tests', args => avaTreeProvider.runTests(args.item));

    vscode.commands.registerCommand('ava.test-runner.run', runTests);

    return AvaTestTaskProvider().then(
        taskProvider => vscode.workspace.registerTaskProvider('ava', taskProvider)
    );
}
export function deactivate() { };