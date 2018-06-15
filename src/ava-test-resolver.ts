import * as mock from 'mock-require';
import * as path from 'path';
import * as globby from 'globby'
import * as AvaFiles from 'ava/lib/ava-files';

export const getAllTestFiles = async (cwd: String, files: String[]|undefined) => {
	const candidateFiles = files || await globby(['**/*'], {cwd, ignore: ['node_modules/**']})
	const avafileMatcher = new AvaFiles({cwd});
	return candidateFiles.filter(filePath => avafileMatcher.isTest(filePath))
}