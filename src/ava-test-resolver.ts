import { exec } from 'child_process';
import * as fs from 'fs';
import { join, sep } from 'path';
import * as globby from 'globby';
import * as tapOut from 'tap-out';
import * as Bromise from 'bluebird';
import * as AvaFiles from 'ava/lib/ava-files';
import { Readable } from 'stream';
import { AvaTest } from './ava-test';

export const encodeFilePath = (path: string) => {
	const parts = path.split(sep);
	return parts.join('__slash__')
}

export const getAllTestFiles = (cwd: string, files?: string[]): Thenable<string[]> => {
	return Bromise.resolve(files || globby(['**/*'], { cwd, ignore: ['node_modules/**'] })).then(
		(candidateFiles: string[]) => {
			const avafileMatcher = new AvaFiles({ cwd });
			return candidateFiles
				.filter(filePath => avafileMatcher.isTest(filePath))
				.map(path => path.replace(new RegExp(`^${cwd}`), ''));
		}
	)
}

export const getTestFromFile = (cwd: string, file: string, prefix: string): Bromise<AvaTest[]> => {
	return Bromise.fromCallback((callback: (err?: Error|null, data?: Object)=>any) => {
		const cmd = `${join(__dirname, '..', 'ava-test-resolver')} ${cwd}/${file}`;
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				console.error(error.message);
				return callback(error);
			}
			try {
				const testData = JSON.parse(stdout);
				callback(null, testData);
			} catch (err) {
				console.error(`Problem while parsing json: ${err.message}`);
				return callback(err);
			}
		})
	}).then(
		tests => tests.map(([testLabel, line, type]: [string, number, string]) => {
			return new AvaTest(testLabel, cwd, file, line, type);
		})
	)
}

export const getTestResultForFile = (cwd: string, file?: string) => {
	const resultPath = `/tmp/vscode-ava/tests-${encodeFilePath(cwd)}-${file ? encodeFilePath(file) : 'ALL'}-exec.tap`;
	return Bromise.fromCallback(callback => {
		if (!fs.existsSync(resultPath))
			return callback(null, null);
		return fs.readFile(resultPath, callback);
	}).then((fileContent?: string) => {
		if (!fileContent) return null;
		return Bromise.fromCallback(callback => {
			const parser = tapOut(callback);
			try {
				const stream = new Readable();
				stream.pipe(parser);
				stream.push(fileContent.toString());
				stream.push(null);
			} catch (err) {
				console.error(err);
				return callback(err);
			}
		}).catch(console.error);

	})

}