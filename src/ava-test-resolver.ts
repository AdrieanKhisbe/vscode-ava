import { exec } from 'child_process';
import * as path from 'path';
import * as globby from 'globby'
import * as AvaFiles from 'ava/lib/ava-files';
import { AvaTest } from './ava-test'
import * as Bromise from 'bluebird';

export const getAllTestFiles = (cwd: String, files: String[] | undefined) => {
	return Bromise.resolve(files || globby(['**/*'], { cwd, ignore: ['node_modules/**'] })).then(
		(candidateFiles: String[]) => {
			const avafileMatcher = new AvaFiles({ cwd });
			console.log('yooo')
			return candidateFiles.filter(filePath => avafileMatcher.isTest(filePath))
		}
	).catch(console.log)
}

export const getTestFromFile = (cwd: String, file: String): AvaTest[] => {
	return Bromise.fromCallback(callback => {
		const cmd = `${path.join(__dirname, '..', 'ava-test-resolver')} ${cwd}/${file}`;
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				console.log(error.message)
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
		tests => tests.map(([testLabel, index])=> new AvaTest(testLabel, index))
	)
}