const TAG_SHIP = 1;
const TAG_FIRE = 2;
const TAG_SHOT = 3;
const TAG_ROCK = 4;
const TAG_STAR = 5;
const TAG_TEXT = 6;
const TAG_EXPL = 7;
const TAG_MENU = 8;
const TAG_CTRL = 9;

const ST_MENU = 1;
const ST_PLAY = 2;
const ST_OVER = 3;
const ST_CREDITS = 4;

let mng;
let ww;
let wh;
let ship;
let canFire;
let hudScore;
let score;
let hi;
let level;
let state;
let lives;
let ctrl;

function setup() {
    ww = windowWidth - 5;
    wh = windowHeight - 5;
    hi = 0;
    createCanvas(ww, wh);
    mng = new Manager(ww, wh);

    ctrl = mng.newBasic(TAG_CTRL);
    ctrl.onDraw = ctrlDraw;
    ctrl.persistent = true;
    score = 0;
    hi = 0;
    menu();
}

function menu() {
    mng.clearAll();
    makeStars();
    makeRocks(6);
    state = ST_MENU;
}

function draw() {
    background(0);
    mng.updateAll();
    mng.drawAll();
}

function gameStart() {
    mng.clearAll();
    makeShip();
    makeStars();
    score = 0;
    level = 1;
    lives = 3;
    state = ST_PLAY;
    makeNewAttack();
}

function ctrlDraw(actor) {

    if (state == ST_MENU) {
        textStyle(BOLD);
        drawTextLeft("HI", 20, 30, 25, "white");
        drawTextLeft(padZero(hi, 4), 60, 30, 25, "yellow");
        let str = "  o i d s";
        let cx = drawTextCenter(str, wh / 2 - (wh * 0.1), 40, "white");
        drawTextLeft("R", cx, wh / 2 - (wh * 0.1), 60, "red");

        drawTextCenter("Twitter @viniciuscg", wh - 30, 18, "brown");

        if (keyIsDown(90)) {
            gameStart();
        }
    }

    if (state == ST_PLAY) {
        drawTextLeft("SCORE", 20, 30, 25, "white");
        drawTextLeft(padZero(score, 4), 110, 30, 25, "yellow");
        drawTextLeft("LIVES", 180, 30, 25, "white");
        drawTextLeft(lives, 270, 30, 25, "yellow");
    }

    if (state == ST_OVER) {
        drawTextCenter("G A M E", wh / 2 - textWidth("A"), 32, "orange");
        drawTextCenter("O V E R", wh / 2 + textWidth("AA"), 32, "orange");
    }

}

function ctrlNewShip(actor) {
    lives--;
    if (lives > 0) {
        makeShip();
    } else {
        ctrl.alarmSet(1, 60 * 1, ctrlGameOver);
    }
}

function ctrlGameOver(actor) {
    mng.clearAll();
    makeStars();
    state = ST_OVER;
    ctrl.alarmSet(2, 60 * 7, ctrlMenu);
}

function ctrlMenu(actor) {
    menu();
}

function ctrlAttack(actor) {
    let n = round(level * 2);
    level += 0.5;
    makeRocks(n);
    shipFlash();
}

function makeNewAttack() {
    ctrl.alarmSet(4, 60, ctrlAttack);
}

function debug() {
    textSize(20);
    fill("yellow");
    text(mng.actors.length, 280, wh - 30);
}

function shipUpdate(actor) {
    let col = actor.mng.collideWith(actor, TAG_ROCK);
    if (col.length > 0) {
        rock = col[0];
        for (let i = 0; i < 3; i++) {
            makeExplosion(actor.x + random(-8, 8), actor.y + random(-4, 4), actor.color);
        }

        soundShipExplode();
        ctrl.alarmSet(0, 90, ctrlNewShip);
        actor.needDie = true;
    }

    actor.mng.addToXY(-actor.forceX / 2, -actor.forceY / 2, TAG_STAR);
    if (keyIsDown(LEFT_ARROW)) {
        actor.rotationAngle -= 3;
    }

    if (keyIsDown(RIGHT_ARROW)) {
        actor.rotationAngle += 3;
    }

    if (keyIsDown(UP_ARROW)) {
        actor.forceAngle = actor.rotationAngle;
        actor.force = 0.1;

        makeFire(actor.x, actor.y, actor.rotationAngle - 180);

        soundEngine();
    }

    if (keyIsDown(90)) {
        if (canFire <= 0) {
            if (!mng.tagCount(TAG_FIRE) < 3) {
                makeShot(actor.x, actor.y, actor.rotationAngle);
                canFire = 15;
                soundShot();
            }
        }
    }
    canFire -= 1;
}

function shotUpdate(actor) {
    let col = actor.mng.collideWith(actor, TAG_ROCK);
    if (col.length > 0) {
        rock = col[0];
        rock.shield -= 1;
        soundRockHit();
        if (rock.shield <= 0) {
            score += rock.energy * 25;
            if (score > hi) hi = score;
            rock.needDie = true;
            rock.energy--;
            if (rock.energy > 0) {
                soundRockParts();
                let n = Math.round(random(2, 3));
                for (let i = 0; i < n; i++) {
                    r = makeRock(rock.x, rock.y, rock.w / n, rock.color);
                    r.energy = rock.energy;
                    r.shield = r.energy;
                }
            } else {
                makeExplosion(rock.x, rock.y, rock.color);
                soundRockExplode();
                if (mng.tagCount(TAG_ROCK) == 1) {
                    makeNewAttack();
                }
            }
        } else {
            rock.forceX += actor.forceX / 4;
            rock.forceY += actor.forceY / 4;
            rock.rotationForce += random(-2, 2);

        }
        actor.needDie = true;
    }
}

function makeRocks(n) {
    var border = ww * 0.98;
    for (let i = 0; i < n; i++) {
        let x = random(border, ww - border);
        let y = random(border, wh - border);
        let cl = color(random(0, 255), random(0, 255), 180);
        let rock = makeRock(x, y, 30, cl);
        rock.energy = 2;
    }
}

function makeRock(x, y, size, color) {
    let rock = mng.newRock(x, y, size, size);
    rock.tag = TAG_ROCK;
    rock.wrap = true;
    rock.forceAngle = random(0, 360);
    rock.force = random(1, 3);
    rock.rotationForce = random(1, 3);
    rock.shield = 3;
    rock.fillColor = color;
    rock.color = rock.fillColor;
    return rock;
}

function makeExplosion(x, y, cl) {
    let n = 20;
    let expl;
    for (let i = 0; i < n; i++) {
        expl = mng.newBasic(x + random(-10, 10), y + random(-10, 10), 4);
        expl.tag = TAG_EXPL;
        expl.forceAngle = random(0, 360);
        expl.force = 3;
        expl.life = random(5, 15);
        expl.color = cl;
        expl.fillColor = expl.color;
    }

}

function makeFire(x, y, a) {
    let fire = mng.newBasic(x, y, 10);
    fire.tag = TAG_FIRE;
    fire.force = 3;
    fire.forceAngle = a + random(-15, 15);
    fire.sizeInc = -0.4;
    fire.life = random(5, 10);
    fire.color = color(120, 0, 120);
}

function makeShot(x, y, a) {
    let shot = mng.newBasic(x, y, 6);
    shot.tag = TAG_SHOT;
    shot.forceAngle = a;
    shot.force = 6;
    shot.life = random(60, 60);
    shot.color = color(0, 100, 255);
    shot.fillColor = shot.color;
    shot.onUpdate = shotUpdate;
}

function makeShip() {
    ship = mng.newBasic(ww / 2, wh / 2, 20, 20);
    ship.tag = TAG_SHIP;
    ship.drawType = DT_TRIANGLE;
    ship.friction = 0.01;
    ship.wrap = true;
    ship.fillColor = color('yellow');
    canFire = 0;
    ship.onUpdate = shipUpdate;
    shipFlash();
}

function shipFlash() {
    ship.alarmSet(0, 10, flash);
    ship.alarmSet(1, 120, flashStop);
    ship.ghost = true;
}

function flash(actor) {
    actor.visible = !actor.visible;
    actor.alarmSet(0, 10, flash);
}

function flashStop(actor) {
    actor.alarmReset(0);
    actor.ghost = false;
    actor.visible = true;
}

function makeStars() {
    let borderX = ww * 0.99;
    let borderY = wh * 0.99;
    let size;
    let star;
    for (let i = 0; i < 30; i++) {
        size = round(random(1, 3));
        star = mng.newBasic(random(borderX, ww - borderX), random(borderY, wh - borderY), size, size);
        star.color = color(250, 0, map(size, 1, 3, 10, 255));
        star.fillColor = star.color;
        star.tag = TAG_STAR;
        star.wrap = true;
        star.forceAngle = 270
        star.force = -size / 4;
        canFire = 0;
    }
}

function soundEngine() {
    mng.playSound(mng.makeRPattern(100, 80, 1), 'triangle', 1, 0.1);
}

function soundShipExplode() {
    mng.playSound(mng.makeLPattern(200, 0, 5), 'sine', 2, 0.1);
    mng.playSound(mng.makeRPattern(400, 200, 10), 'triangle', 2, 0.1);
}

function soundRockExplode() {
    mng.playSound(mng.makeLPattern(50, 20, 4), 'sawtooth', 2, 0.2);
}

function soundRockHit() {
    mng.playSound(mng.makeRPattern(100, 50, 5), 'sawtooth', 0.1, 0.2);
}

function soundRockParts() {
    let pat1 = mng.makeRPattern(200, 100, 10);
    let pat2 = mng.makeRPattern(500, 300, 5);
    pat1.push(...pat2);
    mng.playSound(pat1, 'sawtooth', 1, 0.2);
}


function soundShot() {
    mng.playSound(mng.makeLPattern(400, 0, 80), 'sine', 2, 0.1);
}


function mousePressed() {
    if (state == ST_MENU)
        gameStart();
    else
        ctrl.alarmSet(1, 60 * 1, ctrlGameOver);
}

function keyPressed() {
    if (keyCode == 49) soundEngine();
    if (keyCode == 50) soundShipExplode();
    if (keyCode == 51) soundRockExplode();
    if (keyCode == 52) soundShot();
    if (keyCode == 53) soundRockHit();
    if (keyCode == 54) soundRockParts();

}