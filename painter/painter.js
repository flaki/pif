let spritename = ''

let painttool = 'flip'

let painting = false
let paintmode = 1

let paintcolor = 'white'

let zoom
const ZOOM_LEVELS = [null, 2, 8, 16, 32]

const PAL_PICO8 = `black,#20337b,#7e2553,#008331,#ab5236,#454545,#c2c3c7,#fff1e8,#ff004d,#ffa300,#ffe727,#00e232,#29adff,#83769c,#ff77a8,#ffccaa`.split(',')

const POP = document.querySelector('.pop')
const canvas = document.querySelector('.artboard canvas')
canvas.width = 8
canvas.height = 8

const ctx = canvas.getContext('2d')
console.log(ctx)

//canvas.addEventListener('click', plot)

//canvas.addEventListener('mousedown', paintstart)
//canvas.addEventListener('mouseup', paintend)
//  canvas.addEventListener('mousemove', paint)

canvas.addEventListener('pointerdown', paintstart)
canvas.addEventListener('pointerup', paintend)
  canvas.addEventListener('pointermove', paint)


// paint tool setting
Array.from(document.querySelectorAll('[data-set-tool]')).forEach(btn => btn.addEventListener('click', setPaintTool))
setPaintTool({target: document.querySelector('[data-set-tool="flip"]')})

// paint color setting
Array.from(document.querySelectorAll('[data-set-color]')).forEach(btn => btn.addEventListener('click', setPaintColor))

// drawing tools/modes
Array.from(document.querySelectorAll('[data-resize]')).forEach(btn => btn.addEventListener('click', resizeCanvas))
Array.from(document.querySelectorAll('[data-scroll]')).forEach(btn => btn.addEventListener('click', scrollCanvas))

// editor actions
Array.from(document.querySelectorAll('[data-action]')).forEach(btn => btn.addEventListener('click', exec))


// set zoom
changeZoom()


// set palette
setPalette(PAL_PICO8)
paintcolor = '#fff1e8'

// load last saved sprite
loadSprite()




function plot(e) {
  const coords = canvasCoords(e)

  paintstart(e)
  if (paintmode) {
    ctx.fillRect(coords.x, coords.y, 1,1)
  } else {
    ctx.clearRect(coords.x, coords.y, 1,1)
  }
  paintend()
}

function paintstart(e) {
  const coords = canvasCoords(e)
  if (isNaN(coords.x) || isNaN(coords.y)) return

  const px = ctx.getImageData(coords.x,coords.y,1,1).data
  painting = true;

  if (painttool === 'flip') {
    paintmode = (px[3] === 0)
  }

  ctx.fillStyle = paintcolor

  paint(e)
}
function paintend() { painting = false; }
function paint(e) {
  if (painting) {
    const coords = canvasCoords(e)
    if (isNaN(coords.x) || isNaN(coords.y)) return

    if (paintmode) {
      ctx.fillRect(coords.x, coords.y, 1,1)
    } else {
      ctx.clearRect(coords.x, coords.y, 1,1)
    }

    spriteChanged()
  }
}

function touch(e) {
  console.log(e)
}

function canvasCoords(e) {
  let xOrigin = e.clientX - e.target.offsetLeft,
      yOrigin = e.clientY - e.target.offsetTop,
      xRatio = e.target.offsetWidth / canvas.width,
      yRatio = e.target.offsetHeight / canvas.height

  if (zoom) {
    xOrigin -= (e.target.offsetWidth - canvas.width*zoom) / 2
    yOrigin -= (e.target.offsetHeight - canvas.height*zoom) / 2
    xRatio = yRatio = zoom
  }

  const coords = {
    x: Math.floor(xOrigin / xRatio),
    y: Math.floor(yOrigin / yRatio)
  }

  if (coords.x < 0 || coords.x >= canvas.width) coords.x = NaN
  if (coords.y < 0 || coords.y >= canvas.height) coords.y = NaN

  return coords
}

function setPaintTool(e) {
  painttool = (e.target.dataset.setTool || 'flip')
  if (painttool === 'erase') paintmode = false;
  if (painttool === 'paint') paintmode = true;

  let current = document.querySelector('.tool-palette button.current')
  if (current) current.classList.remove('current')
  e.target.classList.add('current')
}

function setPaintColor(e) {
  paintcolor = (e.target.dataset.setColor || 'white')
}
//TODO:palettes
//gamebuino palette: https://gamebuino.com/creations/color-palettes
//pico8 palette: https://ztiromoritz.github.io/pico-8-spick/palette_numbers.png
//dawnbringer (cats&coins) palette: http://pixeljoint.com/forum/forum_posts.asp?TID=12795

function resizeCanvas(e) {
  let cd = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height)

  const axis = e.target.dataset.resize[0]
  const dir = e.target.dataset.resize[1] === '-' ? -1 : 1

  switch(axis) {
    case 'w':
      ctx.canvas.dataset[axis] = (ctx.canvas.width += dir)
      break

    case 'h':
      ctx.canvas.dataset[axis] = (ctx.canvas.height += dir)
      break
  }

  ctx.canvas.style = `--cw: ${ctx.canvas.dataset.w}; --ch: ${ctx.canvas.dataset.h}`
  ctx.putImageData(cd, 0,0)

  popup(`${ctx.canvas.width}x${ctx.canvas.height}`, 900)
  spriteChanged()
}

function scrollCanvas(e) {
  let cd = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height)

  const axis = e.target.dataset.scroll[0]
  const dir = e.target.dataset.scroll[1] === '-' ? -1 : 1

  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

  ctx.putImageData(cd, axis === 'x' ? dir : 0, axis === 'y' ? dir: 0)
  ctx.putImageData(cd, axis === 'x' ? dir-dir*ctx.canvas.width : 0, axis === 'y' ? dir-dir*ctx.canvas.height: 0)

  spriteChanged()
}

let popuptimer
function popup(text, delay) {
  POP.textContent = text
  POP.classList.add('show')

  POP.classList.remove('fade')

  setTimeout(() => {
    POP.classList.add('fade')
  }, delay)

  clearTimeout(popuptimer)
  popuptimer = setTimeout(() => {
    POP.classList.remove('fade')
    POP.classList.remove('show')
  }, 2000)
}

// TODO: stitch sprites together?
function imageData() {
  const imagedata = ctx.getImageData(0,0,canvas.width,canvas.height),
        pif = new PixelData(imagedata)

  return { imagedata, pif }
}
function exportpif() {
  let sprite = imageData().pif
  spritename = prompt('Sprite name?', spritename)||'sprite'
  sprite.id = spritename
  return sprite.pif
}

function exec(e) {
  switch(e.target.dataset.action) {
    case 'resize':
      document.body.dataset.currently= document.body.dataset.currently ? '' : 'sizing'
      break

    case 'export':
      let sprite = exportpif()
      tmp = document.createElement('textarea')
      document.body.appendChild(tmp)
      tmp.value = sprite
      console.log(sprite)
      tmp.select()
      document.execCommand('copy')
      popup('copied!',1000)
      break

    case 'zoom':
      changeZoom()
      break
  }
}

function changeZoom() {
  let zlevel = ZOOM_LEVELS.indexOf(zoom)
  zlevel = zlevel === -1 || zlevel === ZOOM_LEVELS.length-1 ? 0 : zlevel+1

  zoom = ZOOM_LEVELS[zlevel]
  console.log(zoom)

  if (zoom === null) {
    delete document.body.dataset.zoom
  } else {
    document.body.dataset.zoom = `${zoom}x`
  }
}

function setPalette(pal) {
  const toolbar = document.querySelector('.color-palette')
  toolbar.innerHTML = ''

  pal.forEach(c => {
    let b = document.createElement('button')
    b.dataset.setColor=c
    b.style.backgroundColor=c
    b.addEventListener('click', setPaintColor)
    toolbar.appendChild(b)
  })
}

function spriteChanged() {
  const id = imageData()
  const serialized = JSON.stringify({
    width: id.imagedata.width,
    height: id.imagedata.height,
    data: Array.from(id.imagedata.data),
    pif: id.pif.pif
  })

  localStorage.setItem('last', serialized)
  // save also separately
  if (spritename) localStorage.setItem('saved-'+spritename, serialized)
}
function loadSprite(name) {
  const storage = localStorage.getItem(name ? 'saved-'+spritename : 'last')
  if (!storage) return

  const id = JSON.parse(storage)
  canvas.width = id.width
  canvas. height = id.height
  ctx.putImageData(new ImageData(new Uint8ClampedArray(id.data), id.width,id.height), 0,0)
}
