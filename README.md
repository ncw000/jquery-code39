jquery-code39
=============
>A jQuery plugin that draws an arbitrarily long code39 barcode onto an HTML canvas.

Install
-------
It's just a .js, don't be silly. Include the source and go to town!

Usage
-----
Jqeury-code39 provides a code39 function to be called on the result of a jQuery query on an html canvas, like so:

```HTML
<canvas id="myCanvas"/>
```
```Javascript
$("#myCanvas").code39("12345");
```
    
This will draw the code39 barcode onto 'myCanvas', sized appropriately.
