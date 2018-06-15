export class AvaTest {
	constructor(public label: string, public path: string, public line: number){
	}

}

export class AvaTestFile {
	constructor(public label: string, public path: string, public tests: AvaTest[]){}
}