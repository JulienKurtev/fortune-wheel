(function () {
  /* 
    Table of Contents

    I.   Setup ----------------------------------------
         1. DOM Elements ------------------------------
         2. Constants ---------------------------------
         3. State -------------------------------------
    II.  Sequence & Random ----------------------------
         1. getRandomNumberWithExclude ----------------
         2. generateWinSequence -----------------------
    III. Rendering ------------------------------------
         1. createSectorLabels ------------------------
    IV.  Spin Engine ----------------------------------
         1. spinWheel ---------------------------------
    V.   Prize Flow -----------------------------------
         1. handlePrize -------------------------------
         2. handleNormalResult ------------------------
         3. Free Spins --------------------------------
    VI.  UI -------------------------------------------
         1. showPopup ---------------------------------
    VII. Init -----------------------------------------
         1. Event Listeners ---------------------------
         2. Initial Render ----------------------------
*/

  /* ------------------------------------------------------------ *\
	I.   Setup
  \* ------------------------------------------------------------ */

  // DOM Elements
  const wheel = document.getElementById("wheel-wrapper");
  const startBtn = document.getElementById("startBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");
  const popupBtn = document.getElementById("popupBtn");
  const sectorsOverlay = document.getElementById("sectorsOverlay");

  // Variables

  const TOTAL_SECTORS = 18;
  const DEGREE_PER_SECTOR = 360 / TOTAL_SECTORS;

  const prizes = [
    100,
    20,
    50,
    30,
    10,
    80,
    40,
    15,
    70,
    "FreeSpins",
    60,
    35,
    90,
    45,
    85,
    55,
    75,
    65,
  ];

  let currentRotation = 0,
    isSpinning = false,
    totalSpins = 0,
    desiredSector1 = 3,
    desiredSector2 = 7,
    isInFreeSpinMode = false,
    freeSpinWinnings = [],
    winSequence = null;

  /* ------------------------------------------------------------ *\
	II.  Sequence & Random
  \* ------------------------------------------------------------ */

  // Return a random sector index from 0 to 17 and exclude 3 and 7;
  function getRandomNumberWithExclude(excludeNumbers = [3, 7]) {
    excludeNumbers = new Set(excludeNumbers);

    let randomNumber = Math.floor(Math.random() * 18);

    while (excludeNumbers.has(randomNumber)) {
      randomNumber = Math.floor(Math.random() * 18);
    }

    return randomNumber;
  }

  // Generate 10 spin sequence
  function generateWinSequence() {
    return [
      getRandomNumberWithExclude(),
      desiredSector1,
      desiredSector2,
      getRandomNumberWithExclude(),
      desiredSector1,
      getRandomNumberWithExclude(),
      desiredSector1,
      getRandomNumberWithExclude(),
      desiredSector2,
      getRandomNumberWithExclude(),
    ];
  }

  /* ------------------------------------------------------------ *\
	III. Rendering
  \* ------------------------------------------------------------ */

  // Create and positions the 18 prize sectors around the wheel
  function createSectorLabels() {
    for (let i = 0; i < TOTAL_SECTORS; i++) {
      const label = document.createElement("div");
      label.className = "sector-label";

      const prize = prizes[i];

      if (prize === "FreeSpins") {
        label.classList.add("freespins");
        label.innerHTML = `<div class="sector-prize">FREE<br>SPINS</div>`;
      } else {
        label.innerHTML = `<div class="sector-prize">${prize}лв</div>`;
      }

      //Start from top 12 o'clock
      const angle = i * DEGREE_PER_SECTOR - 90;

      label.style.left = "50%";
      label.style.top = "50%";
      label.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translate(200px) rotate(90deg)`;

      sectorsOverlay.appendChild(label);
    }
  }

  /* ------------------------------------------------------------ *\
	IV.  Spin Engine
  \* ------------------------------------------------------------ */

  // Spins the wheel to the next planned sector in winSequence, then announce the prize after 5s.
  function spinWheel() {
    if (isSpinning) return;

    isSpinning = true;
    startBtn.disabled = true;

    // After 10 spins, restart the cycle nad generate a new sequence.
    if (totalSpins === 10) {
      totalSpins = 0;
      winSequence = generateWinSequence();
    }

    const winningSector = winSequence[totalSpins];

    // Align sector to the arrow
    const sectorCenterAngle = winningSector * DEGREE_PER_SECTOR;

    // Make full 5 spins before stop
    const targetRotation = 360 * 5 - sectorCenterAngle;

    const baseRotation = currentRotation - (currentRotation % 360);
    currentRotation = baseRotation + targetRotation + 360;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    // Show results when finish
    setTimeout(() => {
      isSpinning = false;
      totalSpins++;

      const prize = prizes[winningSector];

      handlePrize(prize);
    }, 5000);
  }

  /* ------------------------------------------------------------ *\
	V.   Prize Flow
  \* ------------------------------------------------------------ */

  // Show results when landed on a prize
  function handleNormalResult(prize) {
    showPopup("Поздравления!", `Спечелихте: ${prize}лв`, () => {
      startBtn.disabled = false;
    });
  }

  // Handle each free spin
  function handleFreeSpinResult(prize) {
    freeSpinWinnings.push(prize);

    if (freeSpinWinnings.length < 3) {
      setTimeout(() => spinWheel(), 1000);
      return;
    }

    finishFreeSpins();
  }

  // End free spins and sum the total then show the results
  function finishFreeSpins() {
    const total = freeSpinWinnings.reduce((a, b) => a + b, 0);

    isInFreeSpinMode = false;

    showPopup("FREE SPINS ЗАВЪРШЕНИ!", `Общо спечелихте: ${total}лв!`, () => {
      freeSpinWinnings = [];
      startBtn.disabled = false;
    });
  }

  // Start 3 free spins
  function startFreeSpins() {
    isInFreeSpinMode = true;
    freeSpinWinnings = [];
    setTimeout(() => {
      spinWheel();
    }, 500);
  }

  // Handle Prize depending if it's normal spin or free spin
  function handlePrize(prize) {
    if (prize === "FreeSpins" && !isInFreeSpinMode) {
      showPopup("FREE SPINS!", "Получавате 3 безплатни завъртания!", () =>
        startFreeSpins()
      );
      return;
    }

    if (isInFreeSpinMode) {
      handleFreeSpinResult(prize);
      return;
    }

    handleNormalResult(prize);
  }

  /* ------------------------------------------------------------ *\
	VI.  UI
  \* ------------------------------------------------------------ */

  // Show popup and fill it with data
  function showPopup(title, message, callback) {
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popupOverlay.classList.add("active");

    popupBtn.onclick = () => {
      popupOverlay.classList.remove("active");
      if (callback) callback();
    };
  }

  /* ------------------------------------------------------------ *\
	VII. Init
  \* ------------------------------------------------------------ */

  // Initialize sequence once (after functions exist)
  winSequence = generateWinSequence();

  startBtn.addEventListener("click", () => {
    spinWheel();
  });

  createSectorLabels();
})();
