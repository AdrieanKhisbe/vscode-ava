console.log('LOAD')
import * as vscode from 'vscode';
import { AvaNodeProvider } from './ava-outline';
import { getAllTestFiles, getTestFromFile } from './ava-test-resolver'
export function activate(context: vscode.ExtensionContext) {
    console.log('activate')

    const avaTreeProvider = new AvaNodeProvider();
    const cwd = '/Users/abecchis/git/aws-slack-codepipeline-watch'
    vscode.window.registerTreeDataProvider('ava.test-tree', avaTreeProvider);
    vscode.commands.registerCommand('ava.test-tree.refresh', () => avaTreeProvider.refresh());
    console.log('registred')
    getAllTestFiles(cwd).then(async testFiles => {
        console.log(testFiles[0])
       const tests = await getTestFromFile(cwd, testFiles[0]);
       console.log(tests)
    }).catch(console.log)

}
export function deactivate() { };