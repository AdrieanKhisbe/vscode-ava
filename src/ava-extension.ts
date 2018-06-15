console.log('LOAD')
import * as vscode from 'vscode';
import {AvaNodeProvider} from './ava-outline';
import {getAllTestFiles} from './ava-test-resolver'
export function activate(context: vscode.ExtensionContext) {
    console.log('activate')
   
    const avaTreeProvider = new AvaNodeProvider();

    vscode.window.registerTreeDataProvider('ava.test-tree', avaTreeProvider);
    vscode.commands.registerCommand('ava.test-tree.refresh', () => avaTreeProvider.refresh());
    console.log('registred')
getAllTestFiles('/Users/abecchis/git/aws-slack-codepipeline-watch').then(console.log).catch(console.log)

  }
export function deactivate() { };