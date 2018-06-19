import * as vscode from 'vscode';
import * as stripAnsi from 'strip-ansi';
import * as Bromise from 'bluebird';
import { spawn } from 'child_process';
import { encodeFilePath } from './ava-test-resolver'

let outputChannel: vscode.OutputChannel;
export function runTests(args) {
	const cwd = args && args.cwd || vscode.workspace.workspaceFolders[0].uri.path;
	const file = args && args.file;
	const hashedfile = encodeFilePath(file)
	const label = args && file && args.label;
	
	if (!outputChannel)
	 	outputChannel = vscode.window.createOutputChannel('AVA');

	const cmd = label ? `ava ${file} --match "${label}" --tap | ${__dirname}/../ava-test-runner "${hashedfile}" "${label}"`// | ${__dirname}/../ava-test-reporter
	: `ava --tap ${file||''} | ${__dirname}/../ava-test-runner ${hashedfile || 'ALL'} | ${__dirname}/../ava-test-reporter`;
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
			
				