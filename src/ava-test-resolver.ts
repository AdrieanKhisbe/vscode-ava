import { exec } from 'child_process';
import * as path from 'path';
import * as globby from 'globby'
import * as AvaFiles from 'ava/lib/ava-files';
import { AvaTest } from './ava-test'
import * as Bromise from 'bluebird';

export const getAllTestFiles = (cwd: string, files: string[] | undefined) => {
	return Bromise.resolve(files || globby(['**/*'], { cwd, ignore: ['node_modules/**'] })).then(
		(candidateFiles: string[]) => {
			const avafileMatcher = new AvaFiles({ cwd });
			return candidateFiles.filter(filePath => avafileMatcher.isTest(filePath))
		}
	).catch(console.log)
}

export const getTestFromFile = (cwd: string, file: string): AvaTest[] => {
	return Bromise.fromCallback(callback => {
		const cmd = `${path.join(__dirname, '..', 'ava-test-resolver')} ${cwd}/${file}`;
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				console.error(error.message)
				return callback(error);
			}
			try {
				const testData = JSON.parse(stdout);
				callback(null, testData);
			} catch (err) {
				console.error(`Problem while parsing json: ${err.message}`);
				return callback(err)
			}
		})
	}).then(
		tests => tests.map(([testLabel, index])=> new AvaTest(testLabel, `${cwd}/${file}`, index))
	)
}