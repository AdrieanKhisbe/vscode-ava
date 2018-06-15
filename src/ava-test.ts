export class AvaTest {
	constructor(public label: string, public path: string, public line: number, public type: string){
	}

}

export class AvaTestFile {
	constructor(public label: string, public path: string, public tests: AvaTest[]){}
}