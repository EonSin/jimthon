"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('"jimthon" is now active.');
    const disposable = vscode.commands.registerCommand('jimthon.convert', function () {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            const line = selection.active.line;
            const word = document.lineAt(line).text;
            const endIdx = document.lineAt(line).range.end.character;
            const equalsIdx = word.indexOf('=');
            const firstColonIdx = word.indexOf(':');
            if (word.includes('for') && (equalsIdx !== -1) && (firstColonIdx !== -1) && !word.includes(']') && (word.charAt(endIdx - 1) !== ':')) {
                let secondColonIdx = word.substring(firstColonIdx + 1).indexOf(':');
                if (secondColonIdx !== -1) {
                    secondColonIdx = secondColonIdx + firstColonIdx + 1;
                }
                const spaceBefore = (word.charAt(equalsIdx - 1) === ' ');
                const spaceAfter = (word.charAt(equalsIdx + 1) === ' ');
                let inStr;
                if (spaceBefore && spaceAfter) {
                    inStr = 'in';
                }
                else if (spaceBefore) {
                    inStr = 'in ';
                }
                else if (spaceAfter) {
                    inStr = ' in';
                }
                else {
                    inStr = ' in ';
                }
                let idxA;
                let idxB;
                let idxBEnd = -1;
                let idxH;
                var i;
                for (i = firstColonIdx - 1; i >= 0; i--) {
                    if (['(', ' ', '='].includes(word.charAt(i))) {
                        idxA = i + 1;
                        break;
                    }
                }
                if (secondColonIdx !== -1) {
                    idxH = firstColonIdx + 1;
                    for (i = secondColonIdx + 1; i < endIdx; i++) {
                        if (word.charAt(i) !== ' ') {
                            idxB = i;
                            break;
                        }
                    }
                }
                else {
                    idxH = -1;
                    for (i = firstColonIdx + 1; i < endIdx; i++) {
                        if (word.charAt(i) !== ' ') {
                            idxB = i;
                            break;
                        }
                    }
                }
                for (i = idxB + 1; i < endIdx; i++) {
                    if ([')', ' '].includes(word.charAt(i))) {
                        idxBEnd = i;
                        break;
                    }
                }
                let converted;
                if (idxH !== -1) {
                    if (idxBEnd !== -1) {
                        converted = [word.substring(0, equalsIdx),
                            inStr,
                            word.substring(equalsIdx + 1, idxA),
                            'range(',
                            word.substring(idxA, firstColonIdx).trim(),
                            ', ',
                            word.substring(idxB, idxBEnd).trim(),
                            ', ',
                            word.substring(idxH, secondColonIdx).trim(),
                            ')',
                            word.substring(idxBEnd).trim(),
                            ':'].join('');
                    }
                    else {
                        converted = [word.substring(0, equalsIdx),
                            inStr,
                            word.substring(equalsIdx + 1, idxA),
                            'range(',
                            word.substring(idxA, firstColonIdx).trim(),
                            ', ',
                            word.substring(idxB).trim(),
                            ', ',
                            word.substring(idxH, secondColonIdx).trim(),
                            '):'].join('');
                    }
                }
                else {
                    if (idxBEnd !== -1) {
                        converted = [word.substring(0, equalsIdx),
                            inStr,
                            word.substring(equalsIdx + 1, idxA),
                            'range(',
                            word.substring(idxA, firstColonIdx).trim(),
                            ', ',
                            word.substring(idxB, idxBEnd).trim(),
                            ')',
                            word.substring(idxBEnd).trim(),
                            ':'].join('');
                    }
                    else {
                        converted = [word.substring(0, equalsIdx),
                            inStr,
                            word.substring(equalsIdx + 1, idxA),
                            'range(',
                            word.substring(idxA, firstColonIdx).trim(),
                            ', ',
                            word.substring(idxB).trim(),
                            '):'].join('');
                    }
                }
                // set edits
                editor.edit(editBuilder => {
                    editBuilder.replace(document.lineAt(line).range, converted);
                });
                // move cursor to EOL
                const position = selection.active;
                var newPosition = position.with(position.line, converted.length);
                var newSelection = new vscode.Selection(newPosition, newPosition);
                editor.selection = newSelection;
                // show some completion message
                vscode.window.showInformationMessage('ran the conversion code, for loop!');
            }
            // no appropriate lines to convert. add a semicolon like usual.
            else {
                const position = editor.selection.active;
                editor.edit(editBuilder => {
                    editBuilder.insert(position, ';');
                });
                vscode.window.showInformationMessage('nothing converted.');
            }
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map