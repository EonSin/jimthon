// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { isDeepStrictEqual } from 'util';
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('jimthon MATLAB syntax converter for Python is now active.');
	const disposable = vscode.commands.registerCommand('jimthon.convert', function () {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;
			const line = selection.active.line;
			const word = document.lineAt(line).text;
			const endIdx = document.lineAt(line).range.end.character;
			
			const squareIdx = word.indexOf('[');
			const forIdx = word.indexOf('for');
			const equalsIdx = word.indexOf('=');
			const firstColonIdx = word.indexOf(':');
			const alreadyUsingNP = word.includes('np.');
			const alreadyUsingRange = word.includes('range(');
			
			let output:string[] = [];
			let proc:string = word;
			let inStr:string = '';
			let minAIdx = -1;
			
			// replace for .... =       --->  for ..... in
			if (!alreadyUsingNP && !alreadyUsingRange && forIdx !== -1 && equalsIdx > forIdx && equalsIdx !== -1) {// && (squareIdx===-1 || squareIdx > equalsIdx)) {
				const spaceBefore = (proc.charAt(equalsIdx-1)===' ');
				const spaceAfter = (proc.charAt(equalsIdx+1)===' ');
				if (spaceBefore && spaceAfter) {
					inStr = 'in';
				} else if (spaceBefore) {
					inStr	= 'in ';
				} else if (spaceAfter) {
					inStr = ' in';
				} else {
					inStr = ' in ';
				}
				output = [proc.substring(0, equalsIdx), inStr, proc.substring(equalsIdx+1)];
				proc = output.join('');
				output = [];
				minAIdx = equalsIdx + inStr.length -1;
			}

			let i:number; // iteration

			let tsquareIdx = proc.indexOf('[');
			let tsquare2Idx = proc.indexOf(']');
			let tcolonIdx = proc.indexOf(':');
			let tsemicolonIdx = proc.indexOf(';');
			let tendIdx = proc.length;
			let usedNP = false;
			let doNothing = true;
			
			if (alreadyUsingNP || alreadyUsingRange) {} // just dont do anything
			else if (tsquareIdx===-1 || (forIdx !== -1 && tsquareIdx < forIdx) || (tsquare2Idx!==-1 && tsquare2Idx < tcolonIdx) || (tsquareIdx!==-1 && tcolonIdx !==-1 && tsquareIdx > tcolonIdx)) { // no []
				if (tcolonIdx!==-1) { // got :
					// simple range replacement
					let idxA:number;
					let idxB:number;
					let idxBEnd = -1;
					let idxH:number;
					let careStr:string = '';
					let cendIdx:number;
					
					let parenCt = 0;
					let brackCt = 0;
					for (i=tcolonIdx-1; i>=minAIdx; i--) {
						if (i===minAIdx) {
							let j:number;
							for (j=i+1; j<=tcolonIdx-1; j++) {
								if (proc.charAt(j) !== ' ') {
									break;
								}
							}
							idxA = j;
							// idxA = i+1;
							output.push(proc.substring(0, idxA));
							careStr = proc.substring(idxA);
							cendIdx = careStr.length;
							break;
						}

						const cchar = proc.charAt(i);
						if (cchar===')') {
							parenCt += 1;
						} else if (cchar==='(') {
							parenCt -= 1;
						}
						else if (cchar===']') {
							brackCt += 1;
						}
						else if (cchar==='[') {
							brackCt -= 1;
						}
						if ((parenCt < 0 || brackCt < 0) || (parenCt===0 && brackCt===0 && cchar==='=')) {
							idxA = i+1;
							output.push(proc.substring(0, idxA));
							careStr = proc.substring(idxA);
							cendIdx = careStr.length;
							break;
						}
						}

					let c1colonIdx = careStr.indexOf(':');
					let c2colonIdx = careStr.substring(c1colonIdx+1).indexOf(':');
					if (c2colonIdx !== -1) {
						c2colonIdx = c2colonIdx + c1colonIdx+1;
						idxH = c1colonIdx+1;
						for (i=c2colonIdx+1; i<cendIdx!; i++) {
							if (careStr.charAt(i) !== ' ') {
								idxB = i;
								break;
							}
						}
					} else {
						idxH = -1;
						for (i=c1colonIdx+1; i<cendIdx!; i++) {
							if (careStr.charAt(i) !== ' ') {
								idxB = i;
								break;
							}
						}
					}

					parenCt = 0;
					brackCt = 0;
					for (i=idxB!+1; i<cendIdx!; i++) {
						const cchar = careStr.charAt(i);
						if (cchar==='(') {
							parenCt += 1;
						} else if (cchar===')') {
							parenCt -= 1;
						}
						else if (cchar==='[') {
							brackCt += 1;
						}
						else if (cchar===']') {
							brackCt -= 1;
						}
						
						if (parenCt < 0 || brackCt < 0) {
							idxBEnd = i;
							break;
						} else if (cchar==='#') {
							let j:number;
							for (j=i-1; j>=idxB!+1; j--) {
								if (careStr.charAt(j)===' ') {
									idxBEnd = j;
								} else {
									idxBEnd = j+1;
									break;
								}
							}
						}
						// if ([')', ' ', ']'].includes(careStr.charAt(i))) {
						// 	idxBEnd = i;
						// 	break;
						// }
					}
					
					output.push('range(',
											careStr.substring(0, c1colonIdx).trim(),
											', ');

					if (idxH! !== -1){
						if (idxBEnd !== -1) {
							output.push(careStr.substring(idxB!, idxBEnd).trim(),
													', ',
													careStr.substring(idxH!, c2colonIdx).trim(),
													')',
													careStr.substring(idxBEnd));
							if (careStr.substring(idxBEnd).length===0) {
								output.push(':');
							}
						}
						else {
							output.push(careStr.substring(idxB!).trim(),
													', ',
													careStr.substring(idxH!, c2colonIdx).trim(),
													')');
							if (inStr.length>0) {
								output.push(':');
							}
						}
					}
					else {
						if (idxBEnd !== -1) {
							output.push(careStr.substring(idxB!, idxBEnd).trim(),
													')',
													careStr.substring(idxBEnd));
							if (careStr.substring(idxBEnd).length===0) {
								output.push(':');
							}
						}
						else {
							output.push(careStr.substring(idxB!).trim(),
													')');
							if (inStr.length>0) {
								output.push(':');
							}
						}
					}

					doNothing = false;
				}
				else { //no :, no []
					// nothing to do. just add a semicolon
				}
			}
			else { // got square brackets.
				if (tcolonIdx!==-1) { // got [], got :
					if (tcolonIdx < tsquare2Idx) {
						// np.arange replacement of square bracket like [a:h:b] -> np.arange(a, b, h)
						let idxA:number;
						let idxB:number;
						let idxH:number;
						let careStr:string = '';
						let cendIdx:number;
						
						output.push(proc.substring(0, tsquareIdx), 'np.arange(');

						for (i=tsquareIdx+1; i<=tendIdx; i++) {
							if (proc.charAt(i) !== ' ') {
								idxA = i;
								careStr = proc.substring(idxA, tsquare2Idx);
								cendIdx = careStr.length;
								break;
							}
						}
						let c1colonIdx = careStr.indexOf(':');
						let c2colonIdx = careStr.substring(c1colonIdx+1).indexOf(':');
						if (c2colonIdx !== -1) {
							c2colonIdx = c2colonIdx + c1colonIdx+1;
							idxH = c1colonIdx+1;
							for (i=c2colonIdx+1; i<cendIdx!; i++) {
								if (careStr.charAt(i) !== ' ') {
									idxB = i;
									break;
								}
							}
						} else {
							idxH = -1;
							for (i=c1colonIdx+1; i<cendIdx!; i++) {
								if (careStr.charAt(i) !== ' ') {
									idxB = i;
									break;
								}
							}
						}
						
						output.push(careStr.substring(0, c1colonIdx).trim(),
												', ',
												careStr.substring(idxB!, cendIdx!).trim());

						if (idxH! !== -1) {
							output.push(', ',
													careStr.substring(idxH!, c2colonIdx).trim());
						}
						output.push(')',
												proc.substring(tsquare2Idx+1));

						doNothing = false;
						usedNP = true;
					}
					else {
						// [...]..:  <-- this should never happen. just add a semicolon
					}
				}

				// np.array replacement between square bracket. ex: [1 3 aaaa 341] -> np.array([1, 3, aaaa, 341])
				// want to avoid dealing with matrices defined by ";"
				else if(tsemicolonIdx === -1) { // got [], no :
					output.push(proc.substring(0, tsquareIdx), 'np.array([');
					let onSpace = true;
					for (i=tsquareIdx+1; i<tsquare2Idx; i++) {
						let cchar = proc.charAt(i);
						if (onSpace) {
							if (cchar !== ' ') {
								onSpace = false;
								output.push(cchar);
							}
						} else {
							if (cchar === ' ') {
								onSpace = true;
								output.push(', ');
							} else {
								output.push(cchar);
							}
						}
					}
					output.push('])', proc.substring(tsquare2Idx+1));
					usedNP = true;
					doNothing = false;
				}
			}


			if (!doNothing) {
				proc = output.join('');
				output = [];
				// set edits
				editor.edit(editBuilder => {
					editBuilder.replace(document.lineAt(line).range, proc);
				});

				// move cursor to EOL
				const position = selection.active;
				var newPosition = position.with(position.line, proc.length);
				var newSelection = new vscode.Selection(newPosition, newPosition);
				editor.selection = newSelection;

				if (usedNP) {
					// NOT IMPLEMENTED: will be bad if user has docstring at the top
					// search for "import numpy as np" at the top of screen
					// add the line "import numpy as np" at the top
				}
				
				// show some completion message
				vscode.window.showInformationMessage('jimthon: MATLAB syntax converted.');
			}
			// no appropriate lines to convert. add a semicolon like usual.
			else {
				const position = editor.selection.active;
				editor.edit(editBuilder => {
					editBuilder.insert(position, ';');
				});
				// vscode.window.showInformationMessage('nothing was converted.');
			}
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
