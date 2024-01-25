let framebuffer = new Uint8ClampedArray(0);
let fb_width = 400;
let fb_height = 400;
let kill = false;

const decay_rate = 3.4;

function map_xy(x, y) { // Return framebuffer index for pixel
    return (x + y * fb_width) * 4;
}

function map_index (index) { // Find X,Y for index on framebuffer
    let y_unfloored = Math.floor(index / 4) / fb_width; // Optimization variable. Reduces operations
    let y = Math.floor(y_unfloored);
    let x = Math.round((y_unfloored - y) * fb_width);
    
    return {x: x, y: y};
}

function brightness_operation(operation) {
    let result;
    framebuffer.map(pixel => {
        result = operation(pixel);
        if(result >= 0 && result <= 255)
            return result;
        return pixel;
    })
}

function draw_point(x, y, r, g, b) {
    let index = map_xy(x, y);
    framebuffer[index + 0] = r;
    framebuffer[index + 1] = g;
    framebuffer[index + 2] = b;
}

function set_resolution(width, height){
    fb_width = width;
    fb_height = height;
    framebuffer = new Uint8ClampedArray(width * height * 4);
}

function decay_light() {
    brightness_operation(pixel => pixel -= decay_rate);
}

let time, frametime;
let track_frametime = function() {
    let _time = performance.now();
    frametime = _time - time;
    time = _time;
}

let objects = [];
let rect = function(x, y, w, h, surface) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.surface = surface;
    this.type = "rect";
}
rect.prototype.collides = function(x, y) {
    if(x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h)
        return true;
    else
        return false;
}
function draw_rect(x, y, w, h, surface) {
    objects.push(new rect(x, y, w, h, surface));
}
function draw_background(r, g, b) {
    for(let i = 0; i < framebuffer.length; i+=4) {
        framebuffer[i + 0] = r;
        framebuffer[i + 1] = g;
        framebuffer[i + 2] = b;        
        framebuffer[i + 3] = 255; // Set alpha channel to 255
    }
}

const light_quality = 1000;
const rad = Math.PI * 2;
function emit_light(x, y, r, g, b, luminosity, offset) {
    let dir_x, dir_y, tmp_x, tmp_y, tmp_lum, index;
    let _r = r;
    let _g = g;
    let _b = b;
    for(let i = 0; i < rad; i+=rad/light_quality) {
        dir_x = Math.cos(i + offset);
        dir_y = Math.sin(i + offset);
        tmp_x = x;
        tmp_y = y;
        tmp_lum = luminosity;
        while(tmp_x >= 0 && tmp_x <= fb_width && tmp_y >= 0 && tmp_y <= fb_height && tmp_lum > 0) {
            index = map_xy(Math.floor(tmp_x), Math.floor(tmp_y));
            framebuffer[index + 0] += _r * tmp_lum;
            framebuffer[index + 1] += _g * tmp_lum;
            framebuffer[index + 2] += _b * tmp_lum;
            tmp_x += dir_x;
            tmp_y += dir_y;
            tmp_lum -= 0.001; // Decay
            for(let j = 0; j < objects.length; j++) {
                if(objects[j].collides(tmp_x, tmp_y)) {
                    this.dir_x = dir_x;
                    this.dir_y = dir_y;
                    this.tmp_x = tmp_x;
                    this.tmp_y = tmp_y;
                    this.tmp_lum = tmp_lum;
                    this.index = index;
                    objects[j].surface(this, objects[j]);
                    dir_x = this.dir_x;
                    dir_y = this.dir_y;
                    tmp_x = this.tmp_x;
                    tmp_y = this.tmp_y;
                    tmp_lum = this.tmp_lum;
                    index = this.index;
                }
            }
        }
    }
}

function kill_draw() {
    kill = true;
}

function clear_objects(){
    objects = [];
}

function canvas_2d_draw_fps(ctx) {
    track_frametime();
    ctx.fillStyle = "white";
    ctx.fillText(Math.round(1000/frametime), 30, 30);
}

let image_data = false;

function init_2d_canvas() {
    image_data = ctx.createImageData(fb_width, fb_height);
    framebuffer = image_data.data;
    draw_background(0,0,0);
}

function canvas_2d_draw(ctx) {
    if(!kill) {
        // Swap image data with framebuffer
        // for(let i = 0; i < image_data.data.length; i++)
        //     image_data.data[i] = framebuffer[i];

        ctx.putImageData(image_data, 0, 0);
    }
}