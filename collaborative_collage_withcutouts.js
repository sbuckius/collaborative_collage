let db;
let userImages = [];
let placedImages = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  imageMode(CENTER);

  const firebaseConfig = {
  apiKey: "AIzaSyChN3xlOre5zW47yFQaxEUO1mIA9RmeYdU",
  authDomain: "collaborative-collage.firebaseapp.com",
  databaseURL: "https://collaborative-collage-default-rtdb.firebaseio.com",
  projectId: "collaborative-collage",
  storageBucket: "collaborative-collage.firebasestorage.app",
  messagingSenderId: "421708474364",
  appId: "1:421708474364:web:8848205cda1c321c727479",
  measurementId: "G-50TWKSRQ9W"
};
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();

  db.ref("collage").on("child_added", (data) => {
    const imgData = data.val();
    loadImage(imgData.url, (img) => {
      placedImages.push({ img, x: imgData.x, y: imgData.y, w: imgData.w, h: imgData.h });
    });
  });

  select("#clearBtn").mousePressed(() => {
    if (confirm("Are you sure you want to clear the entire collage?")) {
      db.ref("collage").remove();
      placedImages = [];
    }
  });

  select("#saveBtn").mousePressed(() => {
    saveCanvas("collage", "png");
  });

  select("#upload").changed(() => {
    let file = select('#upload').elt.files[0];
    if (file && file.type === "image/png") {
      let reader = new FileReader();
      reader.onload = (e) => {
        loadImage(e.target.result, (img) => {
          let processed = cutOutRandomParts(img, 15, 60); // num blobs, average size
          userImages.push(processed);
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a PNG image.");
    }
  });
}

function draw() {
  background(255);

  for (let imgObj of placedImages) {
    image(imgObj.img, imgObj.x, imgObj.y, imgObj.w, imgObj.h);
  }

  if (userImages.length > 0 && !mouseIsPressed) {
    let img = userImages[userImages.length - 1];
    image(img, mouseX, mouseY, 100, 100);
  }
}

function mousePressed() {
  if (userImages.length === 0) return;

  let img = userImages[userImages.length - 1];
  let x = mouseX;
  let y = mouseY;
  let w = 300;
  let h = 300;

  placedImages.push({ img, x, y, w, h });

  db.ref("collage").push({
    url: img.canvas.toDataURL(),
    x, y, w, h
  });
}

// --- Random Organic Mask Functionality ---

function cutOutRandomParts(img, numBlobs = 5, blobSize = 300) {
  let mask = createGraphics(img.width, img.height);
  mask.clear();

  for (let i = 0; i < numBlobs; i++) {
    let cx = random(img.width);
    let cy = random(img.height);
    let r = random(blobSize * 0.5, blobSize * 1.5);
    drawBlobbyMask(mask, cx, cy, r);
  }

  img.mask(mask);
  return img;
}

function drawBlobbyMask(pg, x, y, radius) {
  pg.noStroke();
  pg.fill(0);
  pg.beginShape();
  let noiseScale = 0.5;
  for (let a = 0; a < TWO_PI; a += 0.1) {
    let offset = noise(x * noiseScale + cos(a), y * noiseScale + sin(a));
    let r = radius * 0.5 + offset * radius;
    let sx = x + cos(a) * r;
    let sy = y + sin(a) * r;
    pg.vertex(sx, sy);
  }
  pg.endShape(CLOSE);
}
