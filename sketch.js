let pageState;
let faSolid, faRegular;
let pos0, pos1, pos2, pos3, pos4, pos5;
let dmButtonPosX, notificationButtonPosX, menuButtonPosX;

let dmButtonPosY = 40;
let notificationButtonPosY = 40;
let menuButtonPosY = 40;

//for the feed
let images = [];
let scrollOffset = 0;
let lastTouchY = 0;
const imageWidth = 300;
const imageHeight = 300; // Adjust as needed
const spacing = 200; // Space between images
let standardWidth;
let settingsMode = false;
let lastTap = 0;

let profileReg;
let postReg;

let settingsDisplayMode = "original"; // "original", "tabs", or "cmtabs"

//for the settings
let settingsData;
let tabBasedSettingsData;

let tabsCategory;

let currentSettingsCategory = null;
let activeTabCategory = null;

let allLeafSettings = [];
let promptedSetting;

let isScrolling = false;
let initialTouchY = 0;

let trainingStartTime;
let countdownDuration = 30; // seconds
let trainingComplete = false;

// Global variables for experiment phases and conditions
let phase;
const ExperimentPhase = {
  GROUP: "group",
  INSTRUCTIONS: "instructions",
  BEFORE_CONDITION: "beforecondition",
  TRAINING: "training",
  BEFORE_TRIAL: "beforetrial",
  TRIAL: "trial",
  FINISHED: "finished",
  EXIT: "exit",
};

const randomUsernames = [
  "real.nightmare23",
  "eagle_eyes_56",
  "jazz_hands_42",
  "the_legend_1234",
  "r4nd0m_t_h0ughts",
  "happy_days89",
  "xoxo.queen_22",
  "blackout_787",
  "mango_smoothie8",
  "streetart_maven",
  "official.rebel",
  "choco_latte_10",
  "timeless_wanderer",
  "glowinup1",
  "lost_in.2025",
];

const PAGES = {
  HOME: "home",
  EXPLORE: "explore",
  POST: "post",
  REELS: "reels",
  PROFILE: "profile",
  NOTIFICATIONS: "notifications",
  DMS: "dms",
  ORIGINALSETTINGS: "originalsettings",
};

let rawSettingsByTab = {
  home: null,
  explore: null,
  post: null,
  reels: null,
  profile: null,
  notifications: null,
  dms: null,
};

let settingSets = {
  set_a: [
    { name: "Family Center", depth: 1 },
    { name: "Saved", depth: 1 },
    { name: "Ad preferences", depth: 2 },
    { name: "Private account", depth: 2 },
    { name: "Who can add you to group chats", depth: 4 },
    { name: "Two-factor authentication", depth: 3 },
  ],
  set_b: [
    { name: "Blocked", depth: 1 },
    { name: "Log out", depth: 1 },
    { name: "Allow GIF comments", depth: 2 },
    { name: "Upload at highest quality", depth: 2 },
    { name: "Transfer a copy of your information", depth: 3 },
    { name: "Snooze suggested posts in feed", depth: 3 },
  ],
  set_c: [
    { name: "Privacy Center", depth: 1 },
    { name: "Archive", depth: 1 },
    { name: "Pause all notifications", depth: 2 },
    { name: "Recent searches", depth: 2 },
    { name: "Change password", depth: 3 },
    {
      name: "Control political content from accounts you don't follow",
      depth: 3,
    },
  ],
};

//experiment setup
let participantID;
let userGroup = 3;
let originalSet;
let tabsSet;
let tabsCMSet;
let conditionOrder = [];
let numReps = 1;
let currentRep = 0;
let currentCond = 0;
let currentSettingIndex = 0;
let currentSettingName;
let initialTaskTime;

let database;
let ref;

function preload() {
  // Load FontAwesome font from CDN
  faSolid = loadFont("fa-solid-900.ttf");
  faRegular = loadFont("fa-regular-400.ttf");
  settingsData = loadJSON("ig-settings.json", processSettings);

  //load images for posts
  for (let i = 1; i <= 2; i++) {
    let filename = `sample-images/${String(i).padStart(3, "0")}.jpg`;
    images.push(loadImage(filename));
  }

  profileReg = loadImage("profile-regular.jpg");
  postReg = loadImage("post-regular.jpg");
  reelsReg = loadImage("reels-reg-min.jpg");
  exploreReg = loadImage("explore-reg-min.jpg");
  notifReg = loadImage("notif-reg.jpg");
  dmsReg = loadImage("dms-reg.jpg");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  createCanvas(windowWidth, windowHeight);

  participantID = floor(random(9999));

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBFgTFFgadepQ-qdEB_T0oQ3GhqjT5AG5Y",
    authDomain: "social-media-45607.firebaseapp.com",
    databaseURL: "https://social-media-45607-default-rtdb.firebaseio.com",
    projectId: "social-media-45607",
    storageBucket: "social-media-45607.firebasestorage.app",
    messagingSenderId: "278464187025",
    appId: "1:278464187025:web:cc903987141b8e6161cd30",
  };
  firebase.initializeApp(config);
  database = firebase.database();
  ref = database.ref("pilot-" + participantID);

  textSize(50);

  phase = ExperimentPhase.GROUP;
  background(255);

  textAlign(CENTER, CENTER);
  pageState = PAGES.HOME; // Start on the home screen
  standardWidth = width * 0.9; // Standardized width (90% of screen width)
}

function draw() {
  switch (phase) {
    case ExperimentPhase.GROUP:
      drawGroupSelection();
      break;
    case ExperimentPhase.INSTRUCTIONS:
      drawInstructions();
      break;

    case ExperimentPhase.BEFORE_CONDITION:
      drawBeforeCondition();
      break;
    case ExperimentPhase.TRAINING:
      drawTraining(); //In training, users will get 30 seconds to freely explore
      break;
    case ExperimentPhase.BEFORE_TRIAL:
      drawBeforeTrial();
      break;

    case ExperimentPhase.TRIAL:
      drawTrial();
      //If participant can't find in 90 second, move on to next trial
      // Check trial timeout: 90 seconds per trial
      if (millis() - initialTaskTime >= 90000) {
        sendTrialData();
        nextTrial();
      }
      break;

    case ExperimentPhase.FINISHED:
      drawFinished();
      break;

    case ExperimentPhase.EXIT:
      noLoop();
      break;
  }
}

function drawGroupSelection() {
  background(255);

  rectMode(CENTER);

  let rectWidth = width / 1.5;
  let rectHeight = 150;

  let topY = height / 4;
  let midY = height / 2;
  let botY = (3 * height) / 4;

  fill(0);

  rect(width / 2, topY, rectWidth, rectHeight);
  rect(width / 2, midY, rectWidth, rectHeight);
  rect(width / 2, botY, rectWidth, rectHeight);

  fill(255);
  noStroke();

  text("Group 1", width / 2, topY);
  text("Group 2", width / 2, midY);
  text("Group 3", width / 2, botY);

  rectMode(CORNER);
}

function selectGroup(mx, my) {
  let rectWidth = width / 1.5;
  let rectHeight = 150;
  let halfHeight = rectHeight / 2;

  let topY = height / 4;
  let midY = height / 2;
  let botY = (3 * height) / 4;

  let leftBoundary = width / 2 - rectWidth / 2;
  let rightBoundary = width / 2 + rectWidth / 2;

  if (mx >= leftBoundary && mx <= rightBoundary) {
    if (my >= topY - halfHeight && my <= topY + halfHeight) {
      userGroup = 1;
      console.log("Selected Group:", userGroup);
      phase = ExperimentPhase.INSTRUCTIONS;
    } else if (my >= midY - halfHeight && my <= midY + halfHeight) {
      userGroup = 2;
      console.log("Selected Group:", userGroup);
      phase = ExperimentPhase.INSTRUCTIONS;
    } else if (my >= botY - halfHeight && my <= botY + halfHeight) {
      userGroup = 3;
      console.log("Selected Group:", userGroup);
      phase = ExperimentPhase.INSTRUCTIONS;
    } else {
    }
  } else {
  }
}

function resetScreen() {
  pageState = PAGES.HOME;
  settingsData.scrollOffset = 0;
  if (tabsCategory && tabsCategory.children) {
    settingsMode = false;
    for (let child of tabsCategory.children) {
      child.scrollOffset = 0;
    }
  }
}

function drawTraining() {
  background(255);
  showCurrentScreen();
  drawBottomNav();
  drawTrainingReminder();
}

function drawTrainingReminder() {
  textAlign(CENTER, BOTTOM);
  textFont("Arial");
  rectMode(CENTER);
  rect(width / 2, height, width, 80);
  rectMode(CORNER);
  textSize(17);
  fill(200);

  let elapsed = floor((millis() - trainingStartTime) / 1000);
  let countdown = countdownDuration - elapsed;

  // If the countdown has reached 0, you can stop it or do something else
  if (countdown < 0) {
    countdown = 0;
    trainingComplete = true;
    rect(width / 2, height, width, 80);
    text("Tap anywhere to begin your first task.", 0, height, width);
    // Optionally, perform an action when the timer is up
  }

  if (settingsDisplayMode === "original" && trainingComplete === false) {
    text(
      "Tap Profile (bottom right) and Menu (top right) and explore! You have " +
        countdown +
        " seconds left.",
      0,
      height,
      width
    );
  }
  //if "tabs" or "cmtabs"
  else if (settingsDisplayMode !== "original" && trainingComplete === false) {
    text(
      "Double tap the bottom or top icons and explore! You have " +
        countdown +
        " seconds left.",
      0,
      height,
      width
    );
  }
}

function drawTrial() {
  background(255);
  showCurrentScreen();
  drawBottomNav();
  drawTaskReminder();
}

function drawInstructions() {
  background(255);
  textAlign(CENTER, CENTER);

  fill(0);
  textSize(25);
  text(
    "Instructions\n\nIn the next tasks, you will be prompted with the name of a setting. Your task will be to find it as fast as you can using a certain setting navigation technique and tap on it.\n\nTap to continue",
    0,
    height / 2,
    width
  );
}

function drawFinished() {
  background(255);
  textAlign(CENTER, CENTER);

  fill(0);
  textSize(25);
  text(
    "The study has finished. Thank you for your participation.",
    0,
    height / 2,
    width
  );
}

function drawBeforeCondition() {
  background(255);
  textAlign(CENTER, CENTER);
  textSize(25);
  fill(0);
  // Show the current condition's name and a short message.
  if (settingsDisplayMode === "original") {
    text(
      "Condition:\n\nIn the next tasks, you will use nested settings. Go to the Profile tab and then tap the menu icon on the top right. You will first have the chance to freely explore this form of settings navigation for 30 seconds.\n\nTap to continue",
      0,
      height / 2,
      width
    );
  } else if (settingsDisplayMode === "tabs") {
    text(
      "Condition:\n\nIn the next tasks, you will use tabs settings. To access settings, double tap on any of the bottom or top navigation bar icons. You will be able to scroll through them. You will first have the chance to freely explore this form of settings navigation for 30 seconds.\n\nTap to continue",
      0,
      height / 2,
      width
    );
  } else if (settingsDisplayMode === "cmtabs") {
    text(
      "Condition:\n\nIn the next tasks, you will use tabs commandmap settings. To access settings, double tap on any of the bottom or top navigation bar icons. You will see them all display on each tab. You will first have the chance to freely explore this form of settings navigation for 30 seconds.\n\nTap to continue",
      0,
      height / 2,
      width
    );
  }
}

function drawBeforeTrial() {
  background(255);
  textAlign(CENTER, CENTER);
  textSize(25);

  fill(0);
  text(
    'Find the setting "' +
      currentSettingName +
      '" as fast as you can and tap on it.\nTap to continue',
    0,
    height / 2,
    width
  );
}

function sendTrialData() {
  let trialTime = millis() - initialTaskTime;

  let data = {
    userGroup: userGroup,
    condition: settingsDisplayMode,
    currentRep: currentRep,
    currentSettingIndex: currentSettingIndex,
    currentSettingName: currentSettingName,
    taskCompletionTime: trialTime,
  };
  ref.push(data); //send data to database like this
}

function nextTrial() {
  console.log("going to next trial");

  let condChangeFlag = false;

  //if this is not the last setting of the set
  if (currentSettingIndex < 5) {
    currentSettingIndex++;
  }
  //if this is the last setting of the set
  else if (currentSettingIndex === 5) {
    currentSettingIndex = 0;

    //if this is not the last repetition
    if (currentRep < numReps - 1) {
      currentRep++;
    }
    //if this is the last repetition
    else if (currentRep === numReps - 1) {
      //if this is not the last condition
      if (currentCond < conditionOrder.length - 1) {
        currentCond++;
        condChangeFlag = true; //change to true since it's a new technique.
        trainingComplete = false;
      }

      //if this is the last condition
      else if (currentCond === conditionOrder.length - 1) {
        //this is the end of the experiment.
        phase = ExperimentPhase.FINISHED;
        console.log("Experiment Finished");
        return;
      }
    }
  }

  let conditionName = conditionOrder[currentCond];
  settingsDisplayMode = conditionName;
  currentSettingName = getSetFromCondition(conditionName)[currentSettingIndex]
    .name;

  // Log the current experiment status:
  console.log(
    "Current Condition: " +
      currentCond +
      "\nRep: " +
      currentRep +
      "\nSetting Index: " +
      currentSettingIndex +
      "\nSetting: " +
      currentSettingName
  );

  resetScreen();

  //if condition has change
  if (condChangeFlag === true) {
    phase = ExperimentPhase.BEFORE_CONDITION;
    console.log("cond change flag is " + condChangeFlag);

    //condChangeFlag = false; //not needed since this is local to function
    return;
  }
  // Prepare for the next trial.
  phase = ExperimentPhase.BEFORE_TRIAL;
}

function drawTaskReminder() {
  textAlign(CENTER, BOTTOM);
  textFont("Arial");
  rectMode(CENTER);
  rect(width / 2, height, width, 80);
  rectMode(CORNER);
  textSize(17);
  fill(200);
  text('Find "' + currentSettingName + '"', 0, height, width);
}

function drawHomeTopNav() {
  fill(255);
  rect(0, 0, width, 80); // Top nav bar
  fill(0);

  textAlign(LEFT, CENTER);
  textFont("Arial");
  textSize(25);
  textStyle(BOLD);
  if (pageState === PAGES.NOTIFICATIONS) {
    text("Notifications", 20, 40);
  } else if (pageState === PAGES.DMS) {
    text("Direct Messages", 20, 40);
  } else {
    text("Home", 20, 40);
  }
  textStyle(NORMAL);

  // DM and Notification buttons (only on Home page)
  textFont(faRegular);
  textSize(20);
  textAlign(CENTER, CENTER);

  dmButtonPosX = width - 30; // DM button (right)
  notificationButtonPosX = width - 80; // Notification button (left of DM)

  text("\uf4ad", dmButtonPosX, dmButtonPosY); // DM icon (envelope)
  text("\uf004", notificationButtonPosX, notificationButtonPosY); // Notification icon (heart)
}

function drawProfileTopNav() {
  fill(255);
  rect(0, 0, width, 80); // Top nav bar
  fill(0);

  textAlign(LEFT, CENTER);
  textFont("Arial");
  textSize(25);
  textStyle(BOLD);
  if (pageState === PAGES.ORIGINALSETTINGS) {
    text("Settings and activity", 20, 40);
  } else {
    text("Profile", 20, 40);
  }
  textStyle(NORMAL);

  // DM and Notification buttons (only on Home page)
  textFont(faRegular);
  textSize(20);
  textAlign(CENTER, CENTER);

  menuButtonPosX = width - 30; // Menu button (right)

  if (settingsDisplayMode === "original") {
    text("\uf0c9", menuButtonPosX, 40); // Menu icon (bars)
  }
}

function drawBottomNav() {
  // Draw top navigation bar
  fill(255);

  rect(0, height - 80, width, 80); // Bottom nav bar

  fill(0);
  textFont(faRegular);
  textSize(20);
  textAlign(CENTER, CENTER);

  // Compute positions for 5 icons:
  let n = 5; // number of icons
  // Positions will be at: (2*i+1)/(2*n) * width for i = 0,...,4
  pos0 = (width * (2 * 0 + 1)) / (2 * n); // width*1/10  -> 10%
  pos1 = (width * (2 * 1 + 1)) / (2 * n); // width*3/10  -> 30%
  pos2 = (width * (2 * 2 + 1)) / (2 * n); // width*5/10  -> 50%
  pos3 = (width * (2 * 3 + 1)) / (2 * n); // width*7/10  -> 70%
  pos4 = (width * (2 * 4 + 1)) / (2 * n); // width*9/10  -> 90%

  // Draw icons at these positions, use faSolid for the selected page
  textFont(pageState === PAGES.HOME ? faSolid : faRegular);
  text("\uf015", pos0, height - 55); // Home icon
  textFont(pageState === PAGES.EXPLORE ? faSolid : faRegular);
  text("\uf002", pos1, height - 55); // Explore icon (magnifying glass)
  textFont(pageState === PAGES.POST ? faSolid : faRegular);
  text("\uf0fe", pos2, height - 55); // Post icon (square plus)
  textFont(pageState === PAGES.REELS ? faSolid : faRegular);
  text("\uf144", pos3, height - 55); // Reels icon (clapperboard)
  textFont(pageState === PAGES.PROFILE ? faSolid : faRegular);
  text("\uf007", pos4, height - 55); // Profile icon (user)
}

function showCurrentScreen() {
  fill(0);
  textSize(20);
  textFont("Arial");
  textAlign(CENTER, CENTER);

  if (settingsMode) {
    drawSettingsTabs();
    if (
      pageState === PAGES.HOME ||
      pageState === PAGES.NOTIFICATIONS ||
      pageState === PAGES.DMS
    ) {
      drawHomeTopNav();
    }
  } else {
    // Display the appropriate screen title based on the current pageState
    if (pageState === PAGES.HOME) {
      // Draw Top Nav Bar only if on Home Page
      settingsMode ? drawHomeSettings() : drawFeed();
      drawHomeTopNav();
    } else if (pageState === PAGES.EXPLORE) {
      settingsMode ? drawExploreSettings() : drawExplore();
    } else if (pageState === PAGES.POST) {
      settingsMode ? drawPostSettings() : drawPost();
    } else if (pageState === PAGES.REELS) {
      settingsMode ? drawReelsSettings() : drawReels();
    } else if (pageState === PAGES.PROFILE) {
      settingsMode ? drawProfileSettings() : drawProfile();
      drawProfileTopNav();
    } else if (pageState === PAGES.NOTIFICATIONS) {
      settingsMode ? drawNotificationSettings() : drawNotification();
      drawHomeTopNav();
    } else if (pageState === PAGES.DMS) {
      settingsMode ? drawDMsSettings() : drawDMs();
      drawHomeTopNav();
    } else if (pageState === PAGES.ORIGINALSETTINGS) {
      drawOriginalSettings();
    }
  }
}
function drawFeed() {
  let y = 200 + scrollOffset; // Start below the top bar

  for (let img of images) {
    let aspectRatio = img.height / img.width; // Preserve aspect ratio
    let imgHeight = standardWidth * aspectRatio; // Calculate height dynamically
    let imgX = width / 2 - standardWidth / 2; // Center horizontally

    if (y > -imgHeight && y < height) {
      // Only draw visible images

      // Draw username circle
      drawUsernameCircle(y, img, imgX);
      imageMode(CORNER);

      image(img, imgX, y, standardWidth, imgHeight);

      drawPostInteractionBar(y, imgHeight, 122, 21);
    }

    y += imgHeight + spacing; // Move to next image position
  }
}

function drawUsernameCircle(y, img, imgX) {
  // Select a random username from the list
  const randomUsername = randomUsernames[4];

  // Calculate the y-position for the circle, which should be just above the image with some spacing
  const circleY = y - 40; // Adjust this value to fine-tune vertical spacing

  // Draw the circle with the username
  fill(0);
  noStroke();
  ellipse(imgX + 30, circleY, 30, 30); // Circle aligned to the left side of the image
  fill(0);
  textSize(20);
  textAlign(LEFT, CENTER);
  textFont("Arial");
  text(randomUsername, imgX + 60, circleY); // Display the username beside the circle
}

function drawPostInteractionBar(y, imgHeight, heartCount, commentCount) {
  let iconSize = 30;
  let padding = 20;

  textSize(20);
  textAlign(LEFT, CENTER); // Align text to center of icons

  // Draw Heart Icon
  textFont(faRegular);
  text("\uf004", 30, y + imgHeight + padding); // Heart Icon (Unicode f004)
  textFont("Arial");

  textSize(20);
  text(heartCount, 55, y + imgHeight + padding + 5); // Display the heart count next to the icon

  // Draw Comment Icon
  textSize(20);
  textFont(faRegular);
  text("\uf075", 110, y + imgHeight + padding); // Comment Icon (Unicode f075)
  textFont("Arial");

  textSize(20);
  text(commentCount, 135, y + imgHeight + padding + 5); // Display the comment count next to the icon

  textFont(faRegular);

  // Draw Share Icon (Paper Plane)
  textSize(20);
  text("\uf1d8", 190, y + imgHeight + padding); // Paper Plane Icon (Unicode f1d8)

  // Draw Save Icon (Bookmark)
  textSize(20);
  text("\uf02e", width - 50, y + imgHeight + padding); // Bookmark Icon (Unicode f02e)
}

function drawHomeSettings() {
  text("🏠 Home Settings", width / 2, height / 2);
}

function drawExploreSettings() {
  text("🏠 Explore Settings", width / 2, height / 2);
}

function drawPostSettings() {
  text("🏠 Post Settings", width / 2, height / 2);
}

function drawReelsSettings() {
  text("🏠 Reels Settings", width / 2, height / 2);
}

function drawProfileSettings() {
  text("🏠 Profile Settings", width / 2, height / 2);
}

function drawNotificationSettings() {
  text("🏠 Notifications Settings", width / 2, height / 2);
}

function drawDMsSettings() {
  text("🏠 DMs Settings", width / 2, height / 2);
}

function drawExplore() {
  //text("🏠 Explore", width / 2, height / 2);
  let aspectRatio = exploreReg.width / exploreReg.height; // Calculate the aspect ratio of the image

  let newWidth = width; // Full width of the canvas
  let newHeight = newWidth / aspectRatio; // Proportional height

  // Draw the image starting from the top of the page
  imageMode(CORNER); // Set image mode to CORNER so the image starts at (0, 0)
  image(exploreReg, 0, 0, newWidth, newHeight); // Position image at (0, 0), and scale it to fit the width
}

function drawPost() {
  //text("🏠 Post", width / 2, height / 2);
  let aspectRatio = postReg.width / postReg.height; // Calculate the aspect ratio of the image

  let newWidth = width; // Full width of the canvas
  let newHeight = newWidth / aspectRatio; // Proportional height

  // Draw the image starting from the top of the page
  imageMode(CORNER); // Set image mode to CORNER so the image starts at (0, 0)
  image(postReg, 0, 0, newWidth, newHeight); // Position image at (0, 0), and scale it to fit the width
}

function drawReels() {
  //text("🏠 Reels", width / 2, height / 2);
  let aspectRatio = reelsReg.width / reelsReg.height; // Calculate the aspect ratio of the image

  let newWidth = width; // Full width of the canvas
  let newHeight = newWidth / aspectRatio; // Proportional height

  // Draw the image starting from the top of the page
  imageMode(CORNER); // Set image mode to CORNER so the image starts at (0, 0)
  image(reelsReg, 0, 0, newWidth, newHeight); // Position image at (0, 0), and scale it to fit the width
}

function drawProfile() {
  //text("🏠 Profile", width / 2, height / 2);
  let aspectRatio = profileReg.width / profileReg.height; // Calculate the aspect ratio of the image

  let newWidth = width; // Full width of the canvas
  let newHeight = newWidth / aspectRatio; // Proportional height

  // Draw the image starting from the top of the page
  imageMode(CORNER); // Set image mode to CORNER so the image starts at (0, 0)
  image(profileReg, 0, 0, newWidth, newHeight); // Position image at (0, 0), and scale it to fit the width
}

function drawNotification() {
  //text("🏠 Notifications", width / 2, height / 2);
  let aspectRatio = notifReg.width / notifReg.height; // Calculate the aspect ratio of the image

  let newWidth = width; // Full width of the canvas
  let newHeight = newWidth / aspectRatio; // Proportional height

  // Draw the image starting from the top of the page
  imageMode(CORNER); // Set image mode to CORNER so the image starts at (0, 0)
  image(notifReg, 0, 40, newWidth, newHeight); // Position image at (0, 0), and scale it to fit the width
}

function drawDMs() {
  //text("🏠 DMs", width / 2, height / 2);
  let aspectRatio = dmsReg.width / dmsReg.height; // Calculate the aspect ratio of the image

  let newWidth = width; // Full width of the canvas
  let newHeight = newWidth / aspectRatio; // Proportional height

  // Draw the image starting from the top of the page
  imageMode(CORNER); // Set image mode to CORNER so the image starts at (0, 0)
  image(dmsReg, 0, 75, newWidth, newHeight); // Position image at (0, 0), and scale it to fit the width
}

function drawOriginalSettings() {
  //text("Original settings", width / 2, height / 2);

  //let y = 100;
  let y = 100 + currentSettingsCategory.scrollOffset;
  let x = 20;
  let maxWidth = width - 100;

  let currentCategory = currentSettingsCategory || settingsData;

  //draw the items for the current category (or root if null)
  for (let child of currentCategory.children) {
    y = child.draw(x * child.depth, y, maxWidth, settingsDisplayMode);
  }

  fill(255);
  rect(0, 0, width, 80); // Top nav bar

  fill(0);
  textAlign(LEFT, CENTER);

  textFont(faRegular);
  textSize(14);
  text("\uf104", 20, 50); //back arrow left-arrow
  textAlign(CENTER, CENTER);
  textFont("Arial");
  textStyle(BOLD);

  text(currentCategory.name, width / 2, 50);
}

// Trigger fullscreen when the user touches the screen
function touchStarted() {
  if (touches.length > 0) {
    initialTouchY = touches[0].y; // Record starting position
    isScrolling = false; // Reset the scrolling flag
    lastTouchY = touches[0].y;
  }
  return false;
}

function touchMoved() {
  // If there is an active touch...
  if (touches.length > 0) {
    let touchY = touches[0].y;
    let deltaY = touchY - lastTouchY;

    // Mark as scrolling if moved more than a threshold (e.g., 5 pixels)
    if (abs(touchY - initialTouchY) > 5) {
      isScrolling = true;
    }

    // Use a switch based on settingsDisplayMode.
    switch (settingsDisplayMode) {
      case "tabs":
        // Update the scroll offset for the current tab
        activeTabCategory.scrollOffset += deltaY;
        break;
      case "original":
        // In original mode, the settings page is identified by pageState === PAGES.ORIGINALSETTINGS.
        if (pageState === PAGES.ORIGINALSETTINGS && currentSettingsCategory) {
          currentSettingsCategory.scrollOffset += deltaY;
        }
        break;
      default:
        break;
    }

    lastTouchY = touchY; // Update the last touch position
    return false; // Prevent default behavior (browser scrolling)
  }

  // If not in settings mode (for example, feed scrolling), use your existing feed logic.
  if (touches.length > 0) {
    let touchY = touches[0].y;
    let deltaY = touchY - lastTouchY;
    scrollOffset += deltaY;
    scrollOffset = constrain(
      scrollOffset,
      -((imageHeight + spacing) * images.length - height + 200),
      0
    );
    lastTouchY = touchY;
    return false;
  }
  return false;
}

function touchEnded() {
  // if (!fullscreen()) {
  //   let elem = document.documentElement; // Target the entire HTML document for fullscreen
  //   if (elem.requestFullscreen) {
  //     elem.requestFullscreen();
  //   } else if (elem.webkitRequestFullscreen) {
  //     // Safari-specific method
  //     elem.webkitRequestFullscreen();
  //   }
  // }

  let tx, ty;
  if (touches.length > 0) {
    tx = touches[0].x;
    ty = touches[0].y;
  } else {
    tx = mouseX;
    ty = mouseY;
  }

  switch (phase) {
    case ExperimentPhase.GROUP:
      selectGroup(tx, ty);

      if (userGroup === 1) {
        originalSet = settingSets.set_a;
        tabsSet = settingSets.set_b;
        tabsCMSet = settingSets.set_c;
        conditionOrder = ["original", "tabs", "cmtabs"];
      } else if (userGroup === 2) {
        originalSet = settingSets.set_b;
        tabsSet = settingSets.set_c;
        tabsCMSet = settingSets.set_a;
        conditionOrder = ["tabs", "cmtabs", "original"];
      } else if (userGroup === 3) {
        originalSet = settingSets.set_c;
        tabsSet = settingSets.set_a;
        tabsCMSet = settingSets.set_b;
        conditionOrder = ["cmtabs", "original", "tabs"];
      }

      //thinking through the whole experiment
      // for (let cond = 0; cond < 3; cond++) {
      //   for (let rep = 0; rep < numReps; rep++) {
      //     for (let settingIndex = 0; settingIndex < 6; settingIndex++) {}
      //   }
      // }

      //set display mode based on current settings condition
      let conditionName = conditionOrder[currentCond];
      settingsDisplayMode = conditionName;
      currentSettingName = getSetFromCondition(conditionName)[
        currentSettingIndex
      ].name;
      break;
    case ExperimentPhase.INSTRUCTIONS:
      phase = ExperimentPhase.BEFORE_CONDITION;
      break;

    case ExperimentPhase.BEFORE_CONDITION:
      trainingStartTime = millis(); // Record when the countdown starts
      phase = ExperimentPhase.TRAINING;
      break;
    case ExperimentPhase.TRAINING:
      if (trainingComplete === true) {
        resetScreen();
        phase = ExperimentPhase.BEFORE_TRIAL;
      }
      break;
    case ExperimentPhase.BEFORE_TRIAL:
      phase = ExperimentPhase.TRIAL;
      initialTaskTime = millis();
      break;

    case ExperimentPhase.TRIAL:
      break;

    case ExperimentPhase.FINISHED:
      break;

    case ExperimentPhase.EXIT:
      break;
  }

  //Check which icon was clicked
  if (ty > height - 80) {
    // Check each icon's region
    if (tx > pos0 - 40 && tx < pos0 + 40) {
      // Home icon area
      pageState = PAGES.HOME;
    } else if (tx > pos1 - 40 && tx < pos1 + 40) {
      // Explore icon area
      pageState = PAGES.EXPLORE;
    } else if (tx > pos2 - 40 && tx < pos2 + 40) {
      // Post icon area
      pageState = PAGES.POST;
    } else if (tx > pos3 - 40 && tx < pos3 + 40) {
      // Reels icon area
      pageState = PAGES.REELS;
    } else if (tx > pos4 - 40 && tx < pos4 + 40) {
      // Profile icon area
      pageState = PAGES.PROFILE;
    }
  }

  dmButtonPosX = width - 30; // DM button (right)
  notificationButtonPosX = width - 80; // Notification button (left of DM)
  menuButtonPosX = width - 30; // Menu button (right)

  //Check which top nav home icon was clicked
  if (
    (pageState === PAGES.HOME && 20 < ty && ty < 60) ||
    (pageState === PAGES.NOTIFICATIONS && 20 < ty && ty < 60) ||
    (pageState === PAGES.DMS && 20 < ty && ty < 60)
  ) {
    if (tx > dmButtonPosX - 20 && tx < dmButtonPosX + 20) {
      pageState = PAGES.DMS;
    } else if (
      tx > notificationButtonPosX - 20 &&
      tx < notificationButtonPosX + 20
    ) {
      pageState = PAGES.NOTIFICATIONS;
    }
  }

  if (
    pageState === PAGES.PROFILE &&
    tx > menuButtonPosX - 20 &&
    tx < menuButtonPosX + 20 &&
    ty > 20 &&
    ty < 60 &&
    settingsDisplayMode === "original"
  ) {
    currentSettingsCategory = settingsData; //reset back to root of settings
    pageState = PAGES.ORIGINALSETTINGS;
    return false; // Exit early so further touch handling doesn't occur.
  }

  if (isScrolling) {
    isScrolling = false; // reset for next touch
    return false; // cancel tap behavior
  }

  switch (settingsDisplayMode) {
    case "original": {
      // For original mode, use currentSettingsCategory (or settingsData if null)
      let currentCategory = currentSettingsCategory || settingsData;

      // First, check for the back arrow tap.
      if (ty > 30 && ty < 60 && tx < 45) {
        // If we're at the root, go back to PROFILE
        if (currentSettingsCategory.parent === null) {
          pageState = PAGES.PROFILE;
          settingsData.scrollOffset = 0;
        } else {
          currentSettingsCategory = currentSettingsCategory.parent;
        }
      }

      // Now, prevent any further hit detection if the touch is in the top bar (y = 0 to y = 60).
      if (ty >= 0 && ty <= 80) {
        return; // Ignore hits in the top bar entirely, except for the back button area already handled
      }
      // Then iterate over the children to check for taps.
      for (let child of currentCategory.children) {
        if (child.isHit(tx, ty)) {
          console.log("Original mode hit detected on " + child.name);
          if (child instanceof SettingCategory) {
            // When opening a new child, reset its scroll offset
            child.scrollOffset = 0;
            currentSettingsCategory = child;
          } else {
            child.handleTap(tx, ty, settingsDisplayMode);
          }
        }
      }
      break;
    }
    case "tabs": {
      //Double tap for tabs mode
      let currentTime = millis();
      let tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        // Adjust the threshold if needed
        handleDoubleTap();
      }
      lastTap = currentTime;

      // Prevent any further hit detection if the touch is in the bottom bar (y = 0 to y = 80).
      if (ty <= height && ty >= height - 80) {
        return; // Ignore hits in the top bar entirely, except for the back button area already handled
      }
      // Then iterate over the children to check for taps.
      // For tabs mode, get the active tab category from your tab-based settings structure.
      if (activeTabCategory) {
        // Iterate over the children of the active tab to check for hits.
        for (let child of activeTabCategory.children) {
          if (child.isHit(tx, ty)) {
            console.log("Tabs mode hit detected on " + child.name);
            // For example, you could call a method on the child to handle the tap.
            child.handleTap(tx, ty, settingsDisplayMode);
          }
        }
      } else {
        console.log("Active tab category not found for " + pageState);
      }
      break;
    }
    case "cmtabs": {
      //Double tap for tabs mode
      let currentTime = millis();
      let tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        // Adjust the threshold if needed
        handleDoubleTap();
      }
      lastTap = currentTime;

      // Prevent any further hit detection if the touch is in the bottom bar (y = 0 to y = 80).
      if (ty <= height && ty >= height - 80) {
        return; // Ignore hits in the top bar entirely, except for the back button area already handled
      }
      // Then iterate over the children to check for taps.
      // For tabs mode, get the active tab category from your tab-based settings structure.
      if (activeTabCategory) {
        // Iterate over the children of the active tab to check for hits.
        for (let child of activeTabCategory.children) {
          if (child.isHit(tx, ty)) {
            console.log("Tabs mode hit detected on " + child.name);
            // For example, you could call a method on the child to handle the tap.
            child.handleTap(tx, ty, settingsDisplayMode);
          }
        }
      } else {
        console.log("Active tab category not found for " + pageState);
      }
      break;
    }
    default:
      // No action if no display mode is set.
      break;
  }

  //for the feed
  if (touches.length > 0) {
    lastTouchY = touches[0].y;
  }

  return false; // Prevent default behavior (no zooming)
}

function handleDoubleTap() {
  let tx = touches.length > 0 ? touches[0].x : mouseX;
  let ty = touches.length > 0 ? touches[0].y : mouseY;
  console.log("Double tap detected at: ", tx, ty);

  if (ty > height - 80) {
    if (pageState == PAGES.HOME && tx > pos0 - 40 && tx < pos0 + 40) {
      settingsMode = !settingsMode;
    } else if (pageState == PAGES.EXPLORE && tx > pos1 - 40 && tx < pos1 + 40) {
      settingsMode = !settingsMode;
    } else if (pageState == PAGES.POST && tx > pos2 - 40 && tx < pos2 + 40) {
      settingsMode = !settingsMode;
    } else if (pageState == PAGES.REELS && tx > pos3 - 40 && tx < pos3 + 40) {
      settingsMode = !settingsMode;
    } else if (pageState == PAGES.PROFILE && tx > pos4 - 40 && tx < pos4 + 40) {
      settingsMode = !settingsMode;
    }
  }

  dmButtonPosX = width - 30; // DM button (right)
  notificationButtonPosX = width - 80; // Notification button (left of DM)

  //Check which top nav home iccon was clicked
  if (
    (pageState === PAGES.HOME && 20 < ty && ty < 60) ||
    (pageState === PAGES.NOTIFICATIONS && 20 < ty && ty < 60) ||
    (pageState === PAGES.DMS && 20 < ty && ty < 60)
  ) {
    if (tx > dmButtonPosX - 20 && tx < dmButtonPosX + 20) {
      settingsMode = !settingsMode;
    } else if (
      tx > notificationButtonPosX - 20 &&
      tx < notificationButtonPosX + 20
    ) {
      settingsMode = !settingsMode;
    }
  }
}

/* full screening will change the size of the canvas */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/* prevents the mobile browser from processing some default
 * touch events, like swiping left for "back" or scrolling the page.
 */
// document.ontouchmove = function (event) {
//   event.preventDefault();
// };

document.addEventListener(
  "touchmove",
  function (event) {
    event.preventDefault();
  },
  { passive: false }
);

function processSettings(data) {
  //For original settings: settingsData = data.Settings.items;
  settingsData = processCategory("Settings", data.Settings);
  currentSettingsCategory = settingsData;

  //For tabs settings, create class instances
  tabBasedSettingsData = processNewCategory();

  return settingsData;
}

function processCategory(name, data) {
  let item = createSetting(
    name,
    data.type,
    data.newCategory,
    data.subtitle || "", // Use the value if available or an empty string
    data.defaultState || "", // Same for defaultState
    data.options || [] // Pass the options array
  );

  //if item is a category
  if (item instanceof SettingCategory) {
    //iterate through items in this category
    for (let key in data.items) {
      let itemData = data.items[key];

      if (itemData.type === "category") {
        let subCategory = processCategory(key, itemData); //recursive call
        item.addChild(subCategory);
      }
      //if item is a leaf
      else {
        let subLeaf = createSetting(
          key,
          itemData.type,
          itemData.newCategory,
          itemData.subtitle || "",
          itemData.defaultState || "",
          itemData.options || []
        );
        item.addChild(subLeaf);
        allLeafSettings.push(subLeaf); //add leaf instance to flat list
      }
    }
  }
  return item;
}

//process newCategory for tabs into class instances as regular categories
function processNewCategory() {
  let rootCategory = new SettingCategory("tabs", "", "");

  // Create seven child categories (tabs)
  let homeCategory = new SettingCategory("home", "", "");
  let exploreCategory = new SettingCategory("explore", "", "");
  let postCategory = new SettingCategory("post", "", "");
  let reelsCategory = new SettingCategory("reels", "", "");
  let profileCategory = new SettingCategory("profile", "", "");
  let notificationsCategory = new SettingCategory("notifications", "", "");
  let dmsCategory = new SettingCategory("dms", "", "");

  // Then, for each tab, filter the root's items by newCategory.
  rawSettingsByTab.home = filterSettingsByTab(settingsData, "home");
  rawSettingsByTab.explore = filterSettingsByTab(settingsData, "explore");
  rawSettingsByTab.post = filterSettingsByTab(settingsData, "post");
  rawSettingsByTab.reels = filterSettingsByTab(settingsData, "reels");
  rawSettingsByTab.profile = filterSettingsByTab(settingsData, "profile");
  rawSettingsByTab.notifications = filterSettingsByTab(
    settingsData,
    "notifications"
  );
  rawSettingsByTab.dms = filterSettingsByTab(settingsData, "dms");

  // Process each category by adding the corresponding leaves from the settings data
  homeCategory = processTab("home", rawSettingsByTab.home, homeCategory);
  exploreCategory = processTab(
    "explore",
    rawSettingsByTab.explore,
    exploreCategory
  );
  postCategory = processTab("post", rawSettingsByTab.post, postCategory);
  reelsCategory = processTab("reels", rawSettingsByTab.reels, reelsCategory);
  profileCategory = processTab(
    "profile",
    rawSettingsByTab.profile,
    profileCategory
  );
  notificationsCategory = processTab(
    "notifications",
    rawSettingsByTab.notifications,
    notificationsCategory
  );
  dmsCategory = processTab("dms", rawSettingsByTab.dms, dmsCategory);

  // Add all child categories to the root "tabs" category
  rootCategory.addChild(homeCategory);
  rootCategory.addChild(exploreCategory);
  rootCategory.addChild(postCategory);
  rootCategory.addChild(reelsCategory);
  rootCategory.addChild(profileCategory);
  rootCategory.addChild(notificationsCategory);
  rootCategory.addChild(dmsCategory);

  return rootCategory;
}

function processTab(tabName, tabData, categoryInstance) {
  // Loop through the list of settings for the given tab and add them as leaves
  tabData.forEach((itemData) => {
    let leaf = createSetting(
      itemData.name,
      itemData.type,
      itemData.newCategory,
      itemData.subtitle || "",
      itemData.defaultState || "",
      itemData.options || []
    );
    categoryInstance.addChild(leaf);
  });

  return categoryInstance;
}

function filterSettingsByTab(item, tabName) {
  // Create a copy of the structure or simply flatten the items that match
  let results = [];

  function traverse(currentItem) {
    if (
      currentItem.newCategory &&
      currentItem.newCategory.split(",").includes(tabName) &&
      currentItem.type != "category"
    ) {
      results.push(currentItem);
    }
    if (currentItem.children) {
      for (let child of currentItem.children) {
        traverse(child);
      }
    }
  }

  traverse(item);
  return results;
}

function drawSettingsTabs() {
  background(255);
  fill(0);
  textAlign(LEFT, CENTER);

  // Get the root 'tabs' category
  tabsCategory = tabBasedSettingsData;

  // Get the active tab's category by using the pageState (e.g., "home", "explore")
  activeTabCategory = tabsCategory.getChild(pageState);

  // Get the leaf items (settings) for the active tab
  let items = activeTabCategory.children; // These are the leaf nodes under the selected tab

  let y = 100 + activeTabCategory.scrollOffset; // starting y coordinate for the settings list
  let x = 20;
  let maxWidth = width - 40;

  // Loop through each leaf item and draw it
  if (settingsDisplayMode === "tabs") {
    for (let item of items) {
      y = item.draw(x, y, maxWidth, "tabs");
    }
  } else if (settingsDisplayMode === "cmtabs") {
    //first, we calculate the regular height
    items = items.filter((item) => item.type !== "description");

    const tabLayouts = {
      home: {
        colNum: 3,
        ratio: 0.3,
        col1start: 0,
        col2start: 11,
        col3start: 22,
      },
      explore: { colNum: 2, ratio: 0.41, col1start: 0, col2start: 10 },
      post: {
        colNum: 3,
        ratio: 0.3,
        col1start: 0,
        col2start: 14,
        col3start: 29,
      },
      reels: { colNum: 2, ratio: 0.43, col1start: 0, col2start: 9 },
      profile: {
        colNum: 4,
        ratio: 0.21,
        col1start: 0,
        col2start: 29,
        col3start: 51,
        col4start: 73,
      },
      notifications: {
        colNum: 4,
        ratio: 0.145,
        col1start: 0,
        col2start: 12,
        col3start: 24,
        col4start: 36,
      },
      dms: { colNum: 2, ratio: 0.34, col1start: 0, col2start: 8 },
    };

    let layout = tabLayouts[pageState];

    if (
      pageState === PAGES.HOME ||
      pageState === PAGES.NOTIFICATIONS ||
      pageState === PAGES.DMS
    ) {
      y = 80;
    } else {
      y = 0;
    }
    ratio = layout.ratio;
    push();
    translate(x, y);
    scale(ratio);
    let adjustedMaxWidth = maxWidth / ratio;

    let colNum = layout.colNum;
    let col1start = layout.col1start;
    let col2start = layout.col2start;
    let col3start = layout.col3start || 0;
    let col4start = layout.col4start || 0;
    let col5start = layout.col5start || 0;
    let colX = 0;
    let colWidth = adjustedMaxWidth / colNum;
    initialY = 0;
    currentY = initialY;

    for (let i = 0; i < items.length; i++) {
      if (colNum == 2) {
        if (i >= col1start && i < col2start) {
          currentY = items[i].drawCM(colX, currentY, colWidth, "tabs");
        } else if (i == col2start) {
          currentY = initialY;
          currentY = items[i].drawCM(
            colX + colWidth,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i > col2start) {
          currentY = items[i].drawCM(
            colX + colWidth,
            currentY,
            colWidth,
            "tabs"
          );
        }
      } else if (colNum == 3) {
        if (i >= col1start && i < col2start) {
          currentY = items[i].drawCM(colX, currentY, colWidth, "tabs");
        } else if (i == col2start) {
          currentY = initialY;
          currentY = items[i].drawCM(
            colX + colWidth,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i > col2start && i < col3start) {
          currentY = items[i].drawCM(
            colX + colWidth,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i == col3start) {
          currentY = initialY;
          currentY = items[i].drawCM(
            colX + colWidth * 2,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i > col3start) {
          currentY = items[i].drawCM(
            colX + colWidth * 2,
            currentY,
            colWidth,
            "tabs"
          );
        }
      } else if (colNum == 4) {
        if (i >= col1start && i < col2start) {
          currentY = items[i].drawCM(colX, currentY, colWidth, "tabs");
        } else if (i == col2start) {
          currentY = initialY;
          currentY = items[i].drawCM(
            colX + colWidth,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i > col2start && i < col3start) {
          currentY = items[i].drawCM(
            colX + colWidth,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i == col3start) {
          currentY = initialY;
          currentY = items[i].drawCM(
            colX + colWidth * 2,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i > col3start && i < col4start) {
          currentY = items[i].drawCM(
            colX + colWidth * 2,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i == col4start) {
          currentY = initialY;
          currentY = items[i].drawCM(
            colX + colWidth * 3,
            currentY,
            colWidth,
            "tabs"
          );
        } else if (i > col4start) {
          currentY = items[i].drawCM(
            colX + colWidth * 3,
            currentY,
            colWidth,
            "tabs"
          );
        }
      }
    }
    pop();

    // //then, we draw commandmap version proportional to the height
    // for (let item of items) {
    //   y = item.drawCM(x, y, maxWidth, "tabs", totalRegularHeight);
    // }
  }
}

class SettingBase {
  constructor(name, newCategory, subtitle = "") {
    this.name = name;
    this.newCategory = newCategory;
    this.subtitle = subtitle;
    this.parent = null;
    this.depth = 0;
    this.hitX = 0;
    this.hitY = 0;
    this.hitW = 0;
    this.hitH = 0;
  }

  setHitBox(x, y, w, h) {
    this.hitX = x;
    this.hitY = y;
    this.hitW = w;
    this.hitH = h;
  }

  isHit(tx, ty) {
    return (
      tx >= this.hitX &&
      tx <= this.hitX + this.hitW &&
      ty >= this.hitY &&
      ty <= this.hitY + this.hitH
    );
  }

  draw(x, y, maxWidth, mode) {
    let boxHeight = 40;

    if (this.type === "heading") {
      stroke("#F2F3F4");
      strokeWeight(5);
      line(0, y - 5, width, y - 5);
      noStroke();

      textSize(12);
      textStyle(BOLD);
      textAlign(LEFT, CENTER);
      text(this.name, x, y + 20, maxWidth);
    } else {
      textSize(16);
      textStyle(NORMAL);
      textAlign(LEFT, CENTER);
      text(this.name, x, y + 20, maxWidth);
    }

    // Initialize subtitle height
    let subtitleHeight = 0;
    let lineHeight = textAscent() + textDescent(); // Get the height of a single line

    if (this.subtitle) {
      textSize(12);
      textStyle(ITALIC);
      textAlign(LEFT, TOP); // Set alignment to top for text wrapping

      // Initialize variables for wrapped lines
      let words = this.subtitle.split(" ");
      let currentLine = "";
      let lines = [];

      // Wrap the text by checking the width
      for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + " ";
        if (textWidth(testLine) < maxWidth) {
          currentLine = testLine; // Add the word to the current line
        } else {
          lines.push(currentLine); // Push the completed line
          currentLine = words[i] + " "; // Start a new line with the current word
        }
      }

      // Push the last line if it exists
      if (currentLine !== "") {
        lines.push(currentLine);
      }

      // Calculate the height required to fit the wrapped subtitle
      for (let i = 0; i < lines.length; i++) {
        subtitleHeight += lineHeight; // Increase the height by one line
        text(lines[i], x, y + 40 + i * lineHeight, maxWidth); // Draw each line
      }

      boxHeight = 40 + subtitleHeight; // Increase box height to fit the subtitle
    }

    // Draw the yellow hit detection rectangle for debugging
    fill(255, 204, 0, 20);
    rect(x, y, width, boxHeight);
    fill(0, 0, 0);

    // Set the hitbox based on the updated box height
    this.setHitBox(x, y, width, boxHeight);

    return y + boxHeight + 10; // Advance y for the next item
  }

  handleTap(tx, ty, mode) {}
}

class SettingLeaf extends SettingBase {
  //need to add options array here
  constructor(
    name,
    type,
    newCategory,
    subtitle = "",
    defaultState = "",
    options = []
  ) {
    super(name, newCategory, subtitle);
    this.type = type;
    this.defaultState = defaultState;
    this.options = options;
  }

  draw(x, y, maxWidth, mode) {
    let boxHeight = 40;
    textFont("Arial");

    if (this.type === "heading") {
      stroke("#F2F3F4");
      strokeWeight(5);
      line(0, y - 5, width, y - 5);
      noStroke();

      textSize(12);
      textStyle(BOLD);
      textAlign(LEFT, CENTER);
      text(this.name, x, y + 20, maxWidth);
    } else if (this.type === "description") {
      let descriptionHeight = 0;
      let lineHeight = textAscent() + textDescent(); // Get the height of a single line
      lineHeight = lineHeight / 1.7; //decrease line size
      textStyle(NORMAL);

      textFont("Arial");
      textSize(12);
      //textStyle(ITALIC);
      textAlign(LEFT, TOP); // Set alignment to top for text wrapping

      // Initialize variables for wrapped lines
      let words = this.name.split(" ");
      let currentLine = "";
      let lines = [];

      // Wrap the text by checking the width
      for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + " ";
        if (textWidth(testLine) < maxWidth) {
          currentLine = testLine; // Add the word to the current line
        } else {
          lines.push(currentLine); // Push the completed line
          currentLine = words[i] + " "; // Start a new line with the current word
        }
      }

      // Push the last line if it exists
      if (currentLine !== "") {
        lines.push(currentLine);
      }

      // Calculate the height required to fit the wrapped description
      for (let i = 0; i < lines.length; i++) {
        descriptionHeight += lineHeight; // Increase the height by one line
        text(lines[i], x, y + 40 + i * lineHeight, maxWidth); // Draw each line
      }
      boxHeight += descriptionHeight; // Increase box height to fit the subtitle
    } else {
      textSize(16);
      textStyle(NORMAL);
      textAlign(LEFT, CENTER);
      text(this.name, x, y + 20, maxWidth);
    }

    let optionsHeight = 0;

    //Add UI element
    if (this.type === "toggle") {
      textSize(30);

      textFont(faRegular);
      text(
        this.defaultState === "on" ? "\uf205" : "\uf204",
        x + width - 70,
        y + 18
      );
      textFont("Arial");
    } else if (this.type === "single-choice") {
      textSize(15);
      fill(50);

      // If options exist, display them one under the other
      if (this.options && this.options.length > 0) {
        let optionY = y + 50; // Starting y position for options
        for (let i = 0; i < this.options.length; i++) {
          textFont("Arial");
          textSize(15);

          text(this.options[i], x, optionY); // Draw each option one under the other
          optionY += 40; // Increment y for the next option
          textSize(25);

          textFont(faRegular);

          text(
            this.defaultState === this.options[i] ? "\uf192" : "\uf111",
            x + width - 70,
            optionY - 40
          );
        }

        optionsHeight = optionY - y - 50;
        boxHeight += optionsHeight;
      }
    }

    // Initialize subtitle height
    let subtitleHeight = 0;
    let lineHeight = textAscent() + textDescent(); // Get the height of a single line
    lineHeight = lineHeight / 1.7; //decrease line size

    if (this.subtitle) {
      textFont("Arial");

      textSize(12);
      textStyle(ITALIC);
      textAlign(LEFT, TOP); // Set alignment to top for text wrapping

      // Initialize variables for wrapped lines
      let words = this.subtitle.split(" ");
      let currentLine = "";
      let lines = [];

      // Wrap the text by checking the width
      for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + words[i] + " ";
        if (textWidth(testLine) < maxWidth) {
          currentLine = testLine; // Add the word to the current line
        } else {
          lines.push(currentLine); // Push the completed line
          currentLine = words[i] + " "; // Start a new line with the current word
        }
      }

      // Push the last line if it exists
      if (currentLine !== "") {
        lines.push(currentLine);
      }

      // Calculate the height required to fit the wrapped subtitle
      for (let i = 0; i < lines.length; i++) {
        subtitleHeight += lineHeight; // Increase the height by one line
        text(lines[i], x, y + 40 + optionsHeight + i * lineHeight, maxWidth); // Draw each line
      }

      boxHeight += subtitleHeight; // Increase box height to fit the subtitle
    }

    // Draw the yellow hit detection rectangle for debugging
    fill(255, 204, 0, 20);
    rect(x, y, width, boxHeight);
    fill(0, 0, 0);

    // Set the hitbox based on the updated box height
    this.setHitBox(x, y, width, boxHeight);

    return y + boxHeight + 10; // Advance y for the next item
  }

  //draw and calculate height of regular as pre-req for commandmap version
  calcRegularHeight(x, y, maxWidth, mode) {
    let boxHeight = 40;
    textFont("Arial");

    if (this.type === "heading") {
      stroke("#F2F3F4");
      strokeWeight(5);
      line(0, y - 5, width, y - 5);
      noStroke();

      textSize(12);
      textStyle(BOLD);
      textAlign(LEFT, CENTER);
      text(this.name, x, y + 20, maxWidth);
    } else if (this.type === "description") {
      boxHeight = -30; //remove if description
      //skip drawing descriptions
    } else {
      textSize(16);
      textStyle(NORMAL);
      textAlign(LEFT, CENTER);
      text(this.name, x, y + 20, maxWidth);
    }

    let optionsHeight = 0;

    //Add UI element
    if (this.type === "toggle") {
      textSize(30);

      textFont(faRegular);
      text(
        this.defaultState === "on" ? "\uf205" : "\uf204",
        x + width - 70,
        y + 18
      );
      textFont("Arial");
    } else if (this.type === "single-choice") {
      textSize(15);
      fill(50);

      // If options exist, display them one under the other
      if (this.options && this.options.length > 0) {
        let optionY = y + 50; // Starting y position for options
        for (let i = 0; i < this.options.length; i++) {
          textFont("Arial");
          textSize(15);

          text(this.options[i], x, optionY); // Draw each option one under the other
          optionY += 40; // Increment y for the next option
          textSize(25);

          textFont(faRegular);

          text(
            this.defaultState === this.options[i] ? "\uf192" : "\uf111",
            x + width - 70,
            optionY - 40
          );
        }

        optionsHeight = optionY - y - 50;
        boxHeight += optionsHeight;
      }
    }

    if (this.subtitle) {
      //skip drawing subtitle
    }

    //       // Draw the yellow hit detection rectangle for debugging
    //       fill(255, 204, 0, 20);
    //       rect(x, y, width, boxHeight);
    //       fill(0, 0, 0);

    //       // Set the hitbox based on the updated box height
    //       this.setHitBox(x, y, width, boxHeight);

    return y + boxHeight + 10; // Advance y for the next item
  }

  drawCM(x, y, maxWidth, mode) {
    let boxHeight = 40 * 2;
    textFont("Arial");

    if (this.type === "heading") {
      stroke("#F2F3F4");
      strokeWeight(5);
      //line(0, y - 5, width, y - 5);
      noStroke();

      textSize(17 * 2);
      textStyle(BOLD);
      textAlign(LEFT, CENTER);
      text(this.name, x, y + 20 * 2, width);
    } else if (this.type === "description") {
      boxHeight = -30 * 2; //remove if description
      //skip drawing descriptions
    } else {
      textSize(17 * 2);
      textStyle(NORMAL);
      textAlign(LEFT, CENTER);
      if (this.type === "toggle") {
        text(this.name, x, y + 40, width - 80);
      } else {
        text(this.name, x, y + 40, width);
      }
    }

    let optionsHeight = 0;

    //Add UI element
    if (this.type === "toggle") {
      textSize(30 * 2);

      textFont(faRegular);
      text(
        this.defaultState === "on" ? "\uf205" : "\uf204",
        x + width - 75 * 1.5,
        y + 18 * 2
      );
      textFont("Arial");
    } else if (this.type === "single-choice") {
      textSize(20 * 2);
      fill(50);

      // If options exist, display them one under the other
      if (this.options && this.options.length > 0) {
        let optionY = y + 60 * 2; // Starting y position for options
        for (let i = 0; i < this.options.length; i++) {
          textFont("Arial");
          textSize(17 * 2);

          text(this.options[i], x, optionY, width - 80); // Draw each option one under the other
          optionY += 40 * 2; // Increment y for the next option
          textSize(25 * 2);

          textFont(faRegular);

          text(
            this.defaultState === this.options[i] ? "\uf192" : "\uf111",
            x + width - 75 * 1.2,
            optionY - 40 * 2
          );
        }

        optionsHeight = optionY - y - 50 * 2;
        boxHeight += optionsHeight;
      }
    }

    if (this.subtitle) {
      //skip drawing subtitle
    }

    // Draw the yellow hit detection rectangle for debugging
    fill(255, 204, 0, 20);
    rect(x, y, width, boxHeight);
    fill(0, 0, 0);

    // // Set the hitbox based on the updated box height
    // this.setHitBox(x, y, width, boxHeight);

    //Store Hitboxes in Global Coordinates
    let globalHitX = 20 + x * ratio;
    let globalHitY = 0 + y * ratio;
    let globalHitW = maxWidth * ratio;
    let globalHitH = boxHeight * ratio;

    if (
      pageState === PAGES.HOME ||
      pageState === PAGES.NOTIFICATIONS ||
      pageState === PAGES.DMS
    ) {
      globalHitY += 80;
    } else {
    }

    this.setHitBox(globalHitX, globalHitY, globalHitW, globalHitH);

    return y + boxHeight + 10; // Advance y for the next item
  }

  handleTap(tx, ty, mode) {
    if (this.name === currentSettingName && phase === ExperimentPhase.TRIAL) {
      sendTrialData();
      nextTrial();
    }
  }
}

class SettingCategory extends SettingBase {
  constructor(name, newCategory, subtitle = "") {
    super(name, newCategory, subtitle);
    this.type = "category";
    this.children = [];
    this.scrollOffset = 0;
  }

  addChild(child) {
    child.parent = this;
    child.depth = this.depth + 1;
    if (child instanceof SettingBase) {
      this.children.push(child);
    }
  }

  getChild(name) {
    return this.children.find((child) => child.name === name);
  }

  draw(x, y, maxWidth, mode) {
    textSize(16);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    text(this.name, x, y + 20, maxWidth);
    let boxHeight = 40;

    //in original mode, draw right-arrow to show you can drill down
    if (mode === "original") {
      textFont(faRegular);
      text("\uf105", x + width - 50, y + 20);
      textFont("Arial");
    }

    ////yellow hit detection rectangles to debug
    fill(255, 204, 0, 20);
    rect(x, y, width, boxHeight);
    fill(0, 0, 0);

    this.setHitBox(x, y, width, boxHeight);

    return y + 50;

    //can add a drawChildren function to draw all of the in the page
  }

  handleTap(tx, ty, mode) {
    // In original mode, if the header is hit, navigate into the category.
    if (mode === "original" && this.isHit(tx, ty)) {
      currentSettingsCategory = this;
    }
    // You might also want to loop through children in some cases.
  }
}

function createSetting(
  name,
  type,
  newCategory,
  subtitle = "",
  defaultState = "",
  options = []
) {
  if (type === "category") {
    return new SettingCategory(name, newCategory, subtitle);
  } else {
    return new SettingLeaf(
      name,
      type,
      newCategory,
      subtitle,
      defaultState,
      options
    );
  }
}

function getRandomLeafSetting() {
  if (allLeafSettings.length > 0) {
    // p5.js random() returns a random element from the array.
    let leaf = random(allLeafSettings);
    promptedSetting = leaf;
    console.log("Random leaf setting: " + leaf.name);
    return leaf;
  } else {
    console.log("No leaf settings available.");
    return null;
  }
}

function getSetFromCondition(name) {
  if (name === "original") {
    return originalSet;
  } else if (name === "tabs") {
    return tabsSet;
  } else if (name === "cmtabs") {
    return tabsCMSet;
  }
}
