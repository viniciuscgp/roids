function padZero(s, n) {
    let str = "" + s;
    while (str.length < n)
        str = "0" + str;

    return str;

}

function drawTextLeft(tx, x, y, size, color = "white") {
    noStroke();
    fill(color);
    textSize(size);
    textAlign(LEFT, CENTER);
    text(tx, x, y);
}

function drawTextCenter(tx, y, size, color = "white") {
    noStroke();
    fill(color);
    textSize(size);
    textAlign(LEFT, CENTER);
    let cx = ((windowWidth - 5) - textWidth(tx)) / 2;
    text(tx, cx, y);
    return cx;
}