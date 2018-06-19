import * as vscode from 'vscode';
import * as stripAnsi from 'strip-ansi';
import * as Bromise from 'bluebird';
import { spawn } from 'child_process';

let outputChannel: vscode.OutputChannel;
export function runTests(args) {
	const cwd = args && args.cwd || vscode.workspace.workspaceFolders[0].uri.path;
	const file = args && args.file;

	if (!outputChannel)
	 	outputChannel = vscode.window.createOutputChannel('AVA');

    const cmd = `ava --tap | ${__dirname}/../ava-test-runner ${file || 'ALL'} | ${__dirname}/../ava-test-reporter`;
	console.log(cmd, cwd)
	return Bromise.fromCallback(callback => {
		const ava = spawn('sh', ['-c', cmd], {cwd})
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
			
				