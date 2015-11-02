var koa = require('koa');
koaBody   = require('koa-body');

var fs = require('fs');
var app = koa();

var PixelData = require('./lib.js');

var bitmaps;

var currentBitmapId = 'dino_top';

function currentBitmap(update) {
  for (var i=0; i<bitmaps.length; ++i) {
    if (bitmaps[i].id === currentBitmapId) {
      if (update instanceof PixelData) {
        bitmaps[i] = update;
      }

      return bitmaps[i];
    }
  }

  return null;
}

reset();



app.use(koaBody({formidable:{uploadDir: __dirname}}));

app.use(function *() {
  console.log(this.path);

  // No favicon
  if (this.path === '/favicon.ico') {
    this.status = 404;
    return;
  }

  // No favicon
  if (this.path === '/lib.js') {
    this.type = 'text/javascript';
    this.body = fs.readFileSync('lib.js').toString();
    return;
  }

  // Set current image and reload
  if (this.path.substr(0,5) === '/set/') {
    currentBitmapId = this.path.substr(5);
    reset();
  }

  // Update bitmap
  if (this.path === '/reset') {
    this.type = "text/plain";
    this.body = "OK";

    reset();
    return;
  }

  // Update bitmap
  if (this.path === '/update' && this.is('application/json')) {
    this.type = "text/plain";
    this.body = "OK";

    // TODO: multiple bitmap handling
    currentBitmap(new PixelData(this.request.body));

    console.log(currentBitmap().pif);
    return;
  }

  // Reload UI
  ui = fs.readFileSync('ui.html').toString();


  // Serve up-to-date bitmap string
  // TODO: multiple bitmap_id handling
  if (this.path === '/get') {
    this.type = 'application/json';
    this.body = JSON.stringify(currentBitmap().serialize());
    return;
  }

  // Serve UI
  this.type = 'text/html';
  this.body = ui
    .replace(/\{\/\*BITMAP\*\/\}/g, JSON.stringify(currentBitmap().serialize()) );

  console.log(currentBitmap().pif);
});

app.listen(80);




function reset() {
  bitmaps = [ new PixelData( fs.readFileSync('./sprites/' +currentBitmapId+ '.txt').toString() ) ];
}

function clear() {

}