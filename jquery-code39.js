/*
Copyright (c) 2017 Nathan Weir

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function($) {
    // 'dataString' is the data to be encoded in code39
    $.fn.code39 = function(dataString) {
        // The char table for which code39 bars to draw for each of the 42 possible characters, as well
        // as the start/end delimeter code character of "*".
        //
        //	b = narrow black
        //	B = wide black
        //	w = narrow white
        //	W = wide white
        var charTable = {
            "0": "bwbWBwBwb",
            "1": "BwbWbwbwB",
            "2": "bwBWbwbwB",
            "3": "BwBWbwbwb",
            "4": "bwbWBwbwB",
            "5": "BwbWBwbwb",
            "6": "bwBWBwbwb",
            "7": "bwbWbwBwB",
            "8": "BwbWbwBwb",
            "9": "bwBWbwBwb",
            "A": "BwbwbWbwB",
            "B": "bwBwbWbwB",
            "C": "BwBwbWbwb",
            "D": "bwbwBWbwB",
            "E": "BwbwBWbwb",
            "F": "bwBwBWbwb",
            "G": "bwbwbWBwB",
            "H": "BwbwbWBwb",
            "I": "bwBwbWBwb",
            "J": "bwbwBWBwb",
            "K": "BwbwbwbWB",
            "L": "bwBwbwbWB",
            "M": "BwBwbwbWb",
            "N": "bwbwBwbWB",
            "O": "BwbwBwbWb",
            "P": "bwBwBwbWb",
            "Q": "bwbwbwBWB",
            "R": "BwbwbwBWb",
            "S": "bwBwbwBWb",
            "T": "bwbwBwBWb",
            "U": "BWbwbwbwB",
            "V": "bWBwbwbwB",
            "W": "BWBwbwbwb",
            "X": "bWbwBwbwB",
            "Y": "BWbwBwbwb",
            "Z": "bWBwBwbwb",
            "-": "bWbwbwBwB",
            ".": "BWbwbwBwb",
            " ": "bWBwbwBwb",
            "$": "bWbWbWbwb",
            "/": "bWbWbwbWb",
            "+": "bWbwbWbWb",
            "%": "bwbWbWbWb",
            "*": "bWbwBwBwb"
        };

        // I'm using module (kinda global) level fields here. Go ahead, crucify me.

        // Width/height of the canvas
        var cWidth, cHeight;
        // Needs a better name - the index (from the left) in 
        var leftIndex = 0;

        // The width, in pixels, of narrow & wide columns drawn onto this canvas.
        // Should be rounded to the nearest int when set, depending on the size of the canvas.
        var narrowWidth = 0;
        var wideWidth = 0;

        // The # of pixels from the left at which the drawing functions are pointing; this is
        // where the next drawing operation will begin drawing a column. Updated whenever drawing
        // occurs.
        var curPixelIndex = 0;

        // Clear the drawing area by overwriting it with a white rectangle
        var clearCanvas = function(context) {
            context.fillStyle = "white";
            context.fillRect(0, 0, cWidth, cHeight);
        };

        // Draw the black/white bars for the given character
        var drawCode = function(context, codeChar) {
            // Get the sequence of wide, narrow, black, and white bar chars for this char
            // Will be a sequence of B, b, W, & w, from the charTable

            // Fail if 
            if (!charTable.hasOwnProperty(codeChar)) {
                throw new Error("Unsupported character given to code39 writer: " + codeChar);
                return;
            }

            var charBarSequence = charTable[codeChar];

            // Draw a bar for each bar type character, advancing the curPixelIndex appropriately
            for (var i = 0; i < charBarSequence.length; i++) {
                drawBar(context, charBarSequence[i]);
            };
        };

        // Draw the correct style of bar at the currentPixelIndex
        var drawBar = function(context, typeChar) {
            var fillCode = ""; // Black or white, set below
            var fillWidth = 0; // The val of narrowWidth or wideWidth above, but set below

            switch (typeChar) {
                case "b":
                    fillWidth = narrowWidth;
                    fillCode = "black";
                    break;
                case "B":
                    fillWidth = wideWidth;
                    fillCode = "black";
                    break;
                case "w":
                    fillWidth = narrowWidth;
                    fillCode = "white";
                    break;
                case "W":
                    fillWidth = wideWidth;
                    fillCode = "white";
                    break;
                default:
                    throw new Error("Invalid typeChar given to drawBar: " + typeChar);
                    break;
            }

            context.fillStyle = fillCode;
            context.fillRect(curPixelIndex, 0, fillWidth, cHeight);

            // Advance the curPixelIndex
            curPixelIndex += fillWidth;
        }

        // Draw the code for a "*", the start and end code, meant to be placed at the beginning and
        // end of the entire sequence.
        var drawDelimeterCode = function(context) {
            // Just a silly wrapper around drawCode()
            drawCode(context, "*");
        };

        // Get the canvas and it's 2d context
        // TODO: Put a check here to make sure 'this' is a jQuery result with a canvas at position '0'
        var canvas = this.get(0);
        var context = canvas.getContext('2d');

        // Set the width/height module-level fields
        cWidth = this.width();
        cHeight = this.height();

        // Set the widths to which the narrow/wide bar fields will be drawn
        //
        // The bar sequence for each character is described by the 9 character sequence
        // given for that character in the charTable at the top of this document.
        // Three of these chars are guaranteed to be "wide", and the other six "narrow".
        // By definition, wide chars yield bars drawn twice as large as the narrow bars.
        // So overall a data character will be drawn with 6+3*2 = 12 narrow bars, if you
        // imagine a wide bar is two narrows smushed together.
        //
        // The barcode begins and ends with a "*" code printed. Furthermore, each data code
        // is separated by a single narrow whitespace bar ('w').
        // We enforce that all bars are drawn (or at least, attempted to be) onto the canvas.
        // Thus, the overall number of small-bar's worth of columns printed is
        // = (12 narrows per char) * (#chars to print, including "*"s) + (#chars-1, for seperator 'w's)
        // =          12           *       [dataString length + 2]     +   [dataString length + 2 - 1]
        var narrowBarCount = 12 * (dataString.length + 2) + (dataString.length + 2 - 1) * 2;

        // How many narrow bars we can fit in the image
        narrowWidth = Math.round(cWidth / narrowBarCount);
        // The definition of a wide bar.
        wideWidth = narrowWidth * 2;

        // Setup is complete, so draw one * code as the start sequence, then all of the dataString
        // chars, and then a final * code as the end sequence.
        clearCanvas(context);
        drawDelimeterCode(context);
        drawBar(context, "w");

        for (var i = 0; i < dataString.length; i++) {
            drawCode(context, dataString[i]);

            if (i < dataString.length - 1) {
                drawBar(context, "w");
            }
        };

        drawBar(context, "w");
        drawDelimeterCode(context);
    };
})(jQuery);
