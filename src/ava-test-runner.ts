import * as vscode from 'vscode';
import * as stripAnsi from 'strip-ansi';
import * as Bromise from 'bluebird';
import { spawn } from 'child_process';
import { encodeFilePath } from './ava-test-resolver'

let outputChannel: vscode.OutputChannel;

interface TestArgs {
	cwd?: string
	file?: string
	label?: string
}
export function runTests(args: TestArgs) {

	if (!args || !args.cwd) {
		const workspaces = vscode.workspace.workspaceFolders
		if (!workspaces){
			return vscode.window.showInformationMessage('No workspace folder to run tests for.')
		}
		if (workspaces.length === 1) {
			_runTests({ cwd: workspaces[0].uri.path })
		} else if (vscode.workspace.workspaceFolders) {
			vscode.window.showQuickPick(
				vscode.workspace.workspaceFolders.map(w => w.name),
				{ placeHolder: 'Please select a root folder to run tests for' })
				.then(workspaceName => {
					if (workspaceName) {
						const workspace: vscode.WorkspaceFolder | undefined = workspaces.find((w: vscode.WorkspaceFolder) => w.name === workspaceName)
						if (workspace) {
							_runTests({cwd: workspace.uri.path} )
						}
					}
				})
		}
	} else _runTests(args);
}
export function _runTests(args: TestArgs) {
	const cwd = args && args.cwd;
	const file = args && args.file;
	const hashedcwd = cwd && encodeFilePath(cwd)
	const hashedfile = file && encodeFilePath(file)
	const label = args && file && args.label;

	if (!outputChannel)
		outputChannel = vscode.window.createOutputChannel('AVA');

	const cmd = label ? `ava ${file} --match "${label}" --tap | ${__dirname}/../ava-test-runner "${hashedcwd}" "${hashedfile}" "${label}" | ${__dirname}/../ava-test-reporter --no-recap`
		: `ava --tap ${file || ''} | ${__dirname}/../ava-test-runner "${hashedcwd}" ${hashedfile || 'ALL'} | ${__dirname}/../ava-test-reporter`;
	return Bromise.fromCallback(callback => {
		const ava = spawn('sh', ['-c', cmd], { cwd })
		ava.stdout.on('data', data => {
			outputChannel.append(stripAnsi(data.toString()));
		});
		ava.stderr.on('data', data => {
			console.error(data.toString());
		});
		ava.on('close', callback);
		outputChannel.show();
	})
}

// new vscode.ShellExecution(`ava --tap | ava-test-runner ALL`,
// { env: { PATH: `${__dirname}/..:${process.env.PATH}` } }),

