import { basename, join } from 'path';

export class AvaTest {
	file: string
	absolutePath: string
	constructor(public label: string, public avaFullTitle: string, public cwd: string,
		public path: string, public line: number, public type: string,
		public status?: boolean, public timestamp?: Date) {
		this.file = basename(path)
		this.absolutePath = join(cwd, path)
	}

	get special() {
		return ['after', 'afterEach', 'before', 'beforeEach'].indexOf(this.type) !== -1
	}
	get iconStatus() {
		if (this.special) return 'special';
		if (this.status === undefined)
			return 'pending'
		return this.status ? 'passed' : 'failed'
	}
	public getDescription() {
		if (this.special) {
			return `<${this.type}>` + (this.label ? `: ${this.label}` : '')
		}
		return this.label || '<anonymous test>'
	}
}
export class AvaTestFile {
	file: String
	absolutePath: string
	constructor(public label: string, public cwd: string, public path: string, public tests: AvaTest[]) {
		this.file = basename(path);
		this.absolutePath = join(cwd, path);
	}
	public getDescription() {
		return this.file;
	}

	get iconStatus() {
		const tests = this.tests.filter(t => !t.special);
		if (tests.some(t => t.status === undefined)) return 'pending';
		return tests.some(t => !t.status) ? 'failed' : 'passed';
	}
}

export class AvaTestFolder {
	absolutePath: string
	constructor(public folderName: string, public cwd: string, public path: string, public content: Array<AvaTestFile|AvaTestFolder>) {
		this.absolutePath = join(cwd, path);
	}
	public getDescription() {
		return this.folderName;
	}

	get iconStatus() {
	   // §TODO implement
	   return 'pending'	
	}
}

