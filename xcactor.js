// Collision Type
const CT_CIRCLE = 1;
const CT_RECT = 2;

// Draw Type
const DT_CIRCLE = 1;
const DT_RECT = 2;
const DT_TRIANGLE = 3;
const DT_ROCK = 4;
const DT_TEXT = 5;

const MAX_ALARMS = 10;


class Actor {
    constructor(x, y, w = 20, h = 20) {
        // positon
        this.x = x;
        this.y = y;

        this.w = w;
        this.h = h;

        // RPG
        this.energy = 0;
        this.shield = 0;
        this.value = 0;

        //forces
        this.forceX = 0;
        this.forceY = 0;
        this.force = 0;
        this.forceAngle = 0;

        this.friction = 0;
        this.gravity = 0;
        this.gravityDirection = 270;

        //Visuals
        this.rotationAngle = 0;
        this.rotationForce = 0;
        this.rotationFriction = 0;

        this.color = color(255, 0, 255);
        this.fillColor = this.color;
        this.depth = 0;
        this.visible = true;

        this.sizeInc = 0;
        this.sizeFriction = 0.01;

        this.vertex = [];

        this.life = 0;
        this.needDie = false;

        this.collitionType = CT_CIRCLE;
        this.drawType = DT_CIRCLE;

        // Behaviours
        this.bounce = false;
        this.wrap = false;
        this.alarms = [];

        for (let i = 0; i < MAX_ALARMS; i++) {
            this.alarms[i] = null;
        }

        // Callbacks
        this.onDraw = null;
        this.onUpdate = this.empty;
        this.onDestroy = this.empty;

        // Texts
        this.text = "";
        this.textSize = 12;
        this.textAlignH = LEFT;
        this.textAlignV = CENTER;

        // System
        this.tag = -1;
        this.persistent = false;
        this.ghost = false;
        this.mng = null;
    }

    empty(actor) {}

    updateMe() {
        this.onUpdate(this);

        if (this.force != 0) {
            this.forceX += cos(this.forceAngle) * this.force;
            this.forceY += sin(this.forceAngle) * this.force;
            this.force = 0;
        }

        if (this.forceX != 0) {
            this.x += this.forceX;
            this.forceX = this.consumeForce(this.forceX, this.friction);
        }

        if (this.bounce) {
            this.bounceX();
        }

        if (this.wrap) {
            this.wrapX();
        }


        if (this.forceY != 0) {
            this.y += this.forceY;
            this.forceY = this.consumeForce(this.forceY, this.friction);
        }

        if (this.bounce) {
            this.bounceY();
        }

        if (this.wrap) {
            this.wrapY();
        }

        if (this.rotationForce != 0) {
            this.rotationAngle += this.rotationForce;
            this.rotationForce = this.consumeForce(this.rotationForce, this.rotationFriction);
        }

        if (this.sizeInc != 0) {
            this.w += this.sizeInc;
            this.sizeInc = this.consumeForce(this.sizeInc, this.sizeFriction);
        }

        if (this.life > 0) {
            this.life -= 1;
            if (this.life <= 0) {
                this.needDie = true;
            }
        }

        // Alarms
        for (let i = 0; i < MAX_ALARMS; i++) {
            if (this.alarms[i] != null) {
                this.alarms[i].timerCount--;
                if (this.alarms[i].timerCount <= 0) {
                    let call = this.alarms[i].callBack;
                    this.alarmReset(i);
                    call(this);
                }
            }
        }
    }

    wrapX() {
        switch (this.collitionType) {
            case CT_CIRCLE:
                if (this.x - this.w > this.mng.width) {
                    this.x = -this.w;
                }
                if (this.x < -this.w) {
                    this.x = this.mng.width + this.w;
                }
                break;
            case CT_RECT:
                break;
        }
    }

    wrapY() {
        switch (this.collitionType) {
            case CT_CIRCLE:
                if (this.y - this.w > this.mng.height) {
                    this.y = -this.w;
                }
                if (this.y < -this.w) {
                    this.y = this.mng.height + this.w - 1;
                }
                break;
            case CT_RECT:
                break;
        }
    }

    bounceX() {
        switch (this.collitionType) {
            case CT_CIRCLE:
                if (this.x < this.w) {
                    this.force = -this.force;
                    this.forceX = -this.forceX;
                } else {
                    if (this.x + this.w > this.mng.width) {
                        this.force = -this.force;
                        this.forceX = -this.forceX;
                    }
                }
        }
    }

    bounceY() {
        switch (this.collitionType) {
            case CT_CIRCLE:
                if (this.y < this.w) {
                    this.forceY = -this.forceY;
                    this.force = -this.force;
                } else {
                    if (this.y + this.w > this.mng.height) {
                        this.forceY = -this.forceY;
                        this.force = -this.force;
                    }
                }
        }

    }

    consumeForce(force, friction) {
        if (force != 0 && friction != 0) {
            if (force > 0) {
                force -= friction;
                if (force < 0) force = 0;
            } else {
                force += friction;
                if (force > 0) force = 0;
            }
        }
        return force;
    }

    drawMe() {
        push();
        stroke(this.color);
        fill(this.fillColor);

        translate(this.x, this.y);
        switch (this.drawType) {
            case DT_CIRCLE:
                ellipseMode(CENTER);
                ellipse(0, 0, this.w);
                break;
            case DT_RECT:
                rotate(this.rotationAngle);
                rect(0, 0, this.w, this.h);
                break;
            case DT_TRIANGLE:
                rotate(this.rotationAngle);
                let x1, y1, x2, y2, x3, y3;
                x1 = cos(0) * this.w;
                y1 = sin(0) * this.w;

                x2 = cos(-(90 + 45)) * this.w;
                y2 = sin(-(90 + 45)) * this.w;

                x3 = cos(-(270 - 45)) * this.w;
                y3 = sin(-(270 - 45)) * this.w;
                triangle(x1, y1, x2, y2, x3, y3);
                break;
            case DT_ROCK:
                rotate(this.rotationAngle);
                strokeWeight(5);
                for (let i = 0; i < this.vertex.length; i++) {
                    let v = this.vertex[i];
                    if (i > 0) {
                        let va = this.vertex[i - 1];
                        line(v.x, v.y, va.x, va.y);
                    }
                }
                if (this.vertex.length > 0) {
                    let v1 = this.vertex[0];
                    let v2 = this.vertex[this.vertex.length - 1];
                    line(v1.x, v1.y, v2.x, v2.y);
                }
                break;
            case DT_TEXT:
                textAlign(this.textAlignH, this.textAlignV);
                textSize(this.textSize);
                text(this.text, this.x, this.y);
                break;
        }

        translate(0, 0);
        pop();
    }

    contains(x, y) {
        switch (this.collitionType) {
            case CT_CIRCLE:
                if (dist(x, y, this.x, this.y) < this.r) {
                    return true;
                } else
                    return false;
                break;
        }
    }
    intersects(other) {
        if (other.ghost || this.ghost) {
            return false;
        }
        if (other == this) {
            return false;
        }
        switch (this.collitionType) {
            case CT_CIRCLE:
                let d = dist(this.x, this.y, other.x, other.y);
                return (d < this.w + other.w);
                break;
            case CT_RECT:
                if (this.x + this.w < other.x) return false;
                if (this.y + this.h < other.y) return false;

                if (other.x + other.w < this.x) return false;
                if (other.y + other.h < this.y) return false;

                return true;
                break;
        }
        return false;
    }
    alarmSet(number, t, c) {
        this.alarms[number] = { timerStart: t, timerCount: t, callBack: c };
    }
    alarmReset(number) {
        this.alarms[number] = null;
    }
    alarmIsSet(number) {
        return (this.alarms[number] != null);
    }

}

class Manager {
    constructor(width, height) {
        this.actors = [];
        this.sounds = [];
        this.width = width;
        this.height = height;


        angleMode(DEGREES);
        colorMode(HSB, 255);
        textFont("Courier New");
    }

    addActor(actor) {
        actor.mng = this;
        this.actors.push(actor);
        this.sortByDepth();
    }

    newBasic(x, y, w = 20, h = 20, tag = 0) {
        let n = arguments.length;
        let tmp;
        if (n == 1) {
            tag = x;
        }
        tmp = new Actor(x, y, w, h);
        tmp.tag = tag;
        this.addActor(tmp);
        return tmp;
    }

    newRock(x, y, w) {
        let rock = this.newBasic(x, y, w, w);
        rock.vertex = [];
        let numv = 360 / random(12, 21);
        for (let a = 0; a < 360; a += numv) {
            let r = random(rock.w * 0.6, rock.w);
            let x1 = cos(a) * r;
            let y1 = sin(a) * r;
            rock.drawType = DT_ROCK;
            rock.vertex.push({ x: x1, y: y1 });
        }
        return rock;
    }

    newText(text, x, y, textSize = 12, col = 'white') {
        let txt = this.newBasic(x, y);
        txt.fillColor = col;
        txt.color = col;
        txt.drawType = DT_TEXT;
        txt.text = text;
        txt.textSize = textSize;
        txt.tag = 0;
        return txt;
    }

    clearAll() {
        for (var i = this.actors.length - 1; i >= 0; i--) {

            if (!this.actors[i].persistent) {

                this.actors.splice(i, 1);
            }

        }
    }

    sortByDepth() {
        return;
        this.actors.sort((a, b) => {
            var d1 = a.depth;
            var d2 = b.depth;
            if (d1 < d2) return -1;
            if (d1 > d2) return 1;
            return 0;
        });
    }

    updateAll(callback = null) {
        for (let actor of this.actors) {
            actor.updateMe();
            if (actor.needDie) {
                actor.onDestroy(actor);
                this.actors.splice(this.actors.indexOf(actor), 1);
                this.sortByDepth();
            }
        }
        for (let snd of this.sounds) {
            if (!snd.update()) {
                this.sounds.splice(this.sounds.indexOf(snd), 1);
            }
        }
    }

    drawAll(callback = null) {
        for (let actor of this.actors) {
            if (actor.visible) {
                if (actor.onDraw != null)
                    actor.onDraw(actor);
                else {
                    actor.drawMe();
                }
            }
        }
    }

    tagExists(tag) {
        let exits = false;
        for (let actor of this.actors) {
            if (actor.tag == tag) {
                exits = true;
                break;
            }
        }
        return exits;
    }

    tagCount(tag) {
        let c = 0;
        for (let actor of this.actors) {
            if (actor.tag == tag) {
                c++;
            }
        }
        return c;
    }

    collideWith(ac, tag = -1) {
        let result = [];
        for (let actor of this.actors) {
            if (tag != -1) {
                if (actor.tag != tag) {
                    continue;
                }
            }
            if (ac != actor) {
                if (ac.intersects(actor)) {
                    result.push(actor);
                }
            }
        }
        return result;
    }

    addToXY(dx, dy, tag = -1) {
        let result = [];
        for (let actor of this.actors) {
            if (tag != -1) {
                if (actor.tag != tag) {
                    continue;
                }
            }
            actor.x += dx;
            actor.y += dy;
        }
        return result;
    }

    makeRPattern(left, right, qtde) {
        let patter = [];
        for (let i = 0; i < qtde; i++) {
            patter.push(random(left, right));
        }
        return patter;
    }

    makeLPattern(from, to, step) {
        let patter = [];
        if (from < to) {
            while (from < to) {
                patter.push(from);
                from += step;
            }
        } else {
            while (from > to) {
                patter.push(from);
                from -= step;
            }
        }
        return patter;
    }

    playSound(pattern, wave = "sine", delay = 1, vol = 0.5) {
        let snd = new Sound(pattern, wave, delay, vol);
        this.sounds.push(snd);
        snd.play();
    }

}

class Sound {
    constructor(pattern, wave, delay, vol) {
        this.pattern = pattern;
        this.pos = -1;
        this.delay = delay;
        this.vol = vol;
        this.delayCount = 0;
        this.osc = new p5.Oscillator(wave);
    }
    play() {
        this.pos = 0;
        this.osc.amp(this.vol);
        this.osc.start();
    }
    update() {
        if (this.pos != -1) {
            this.delayCount -= 1;
            if (this.delayCount <= 0) {
                if (this.pos >= this.pattern.length) {
                    this.pos = -1;
                    this.osc.amp(0);
                    this.osc.stop(0);
                    return false;
                }

                this.osc.freq(this.pattern[this.pos]);
                this.delayCount = this.delay;
                this.pos++;
            }
            return true;
        }
        return true;
    }


}