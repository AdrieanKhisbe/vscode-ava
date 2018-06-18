import * as vscode from 'vscode';
import { getAllTestFiles } from './ava-test-resolver'
import { basename } from 'path';


function getTestTasks() {
	const cwd = vscode.workspace.workspaceFolders[0]; // §TODO get current
	return getAllTestFiles(cwd.uri.path).then(testFiles => {
		return [
			new vscode.Task({ type: 'ava', name: 'run all' },
				cwd,
				'run all',
				'ava',
				new vscode.ShellExecution(`ava --tap | ava-test-runner ALL`,
					{ env: { PATH: `${__dirname}/..:${process.env.PATH}` } }),
				[]),
			...testFiles.map(tf => new vscode.Task({ type: 'ava', name: `run ${basename(tf)}` },
				cwd,
				`run ${basename(tf)}`,
				'ava',
				new vscode.ShellExecution(`ava --tap ${tf} | ava-test-runner ${basename(tf)}`,
					{ env: { PATH: `${__dirname}/..:${process.env.PATH}` } }),
				[]))
		]
	})

	//§TODO: watch option
}


export const AvaTestTaskProvider = () => getTestTasks().then(testTasks => ({
	provideTasks: () => {
		console.log(testTasks)
		return testTasks;
	},
	resolveTask(_task: vscode.Task): vscode.Task | undefined {
		return undefined;
	}
}));