var screen = {
    displayCard: (ownerName, card) => {
        let cardEl = _getBaseCardEl(ownerName, card);
        let ownerEl = document.getElementById(ownerName);
        ownerEl.appendChild(cardEl);
    },
    displayMultipleCards: (ownerName, cards) => {
        let ownerEl = document.getElementById(ownerName);
        let positionOffset = 40;

        [...cards].forEach((card, i) => {
            let cardEl = _getBaseCardEl(ownerName, card);

            cardEl.style.left = positionOffset * i + "px";
            cardEl.style.position = "absolute";
            ownerEl.appendChild(cardEl);
        });
    },
    hasCard: (ownerName) => {
        let ownerEl = document.getElementById(ownerName);
        return ownerEl.childElementCount > 0;
    },
    clearCards: (ownerName) => {
        let ownerEl = document.getElementById(ownerName);
        ownerEl.innerHTML = '';
    },
    removeCard: (cardName) => {
        let cardEl = document.getElementById(cardName);
        cardEl.remove();
    },
    displayTrumps: () => {
        let trumpEl = document.getElementById("trump_row");
        trumpEl.classList.remove("invisible");
    },
    hideTrumps: () => {
        [...document.getElementsByClassName("chosenTrump")].forEach(e => e.classList.remove("chosenTrump"));

        let trumpEl = document.getElementById("trump_row");
        trumpEl.classList.add("invisible");
    },
    showMessage: (content) => {
        let messEl = document.getElementById("message_content");
        messEl.innerText = content;
    },
    makeTrumpClickable: (callback) => {
        let trumpsEls = document.getElementsByClassName("trump_suite");
        [...trumpsEls].forEach(t => {
            t.classList.add("trump_suite_clickable");
            t.addEventListener('click', callback);
        });
    },
    markChosenTrump: (trumpId) => {
        // remove clickable effect
        let trumpsEls = document.getElementsByClassName("trump_suite");
        [...trumpsEls].forEach(t => {
            t.classList.remove("trump_suite_clickable");

            // removes event listener
            t.replaceWith(t.cloneNode(true));
        });

        // shows chosen trump effect
        let trumpEl = document.getElementById(trumpId);
        trumpEl.classList.add("chosenTrump");
    },
    makeKittyChooseable: (callback) => {
        let kittyEls = document.getElementsByClassName('kitty_card');
        [...kittyEls].forEach(kittyEl => {
            [...kittyEl.children].forEach(e => {
                e.classList.add("selectable-card");
                e.addEventListener('click', callback);
            });
        });
    },
    makePlayerCardsChooseable: (callback) => {
        let playerEl = document.getElementById("player_deck");
        [...playerEl.children].forEach(cardEl => {
            cardEl.classList.add("selectable-card");
            cardEl.addEventListener('click', callback);
        });
    },
    selectPlayerCard: (cardName) => {
        let cardEl = document.getElementById(cardName);

        if (cardEl.classList.contains("selectable-card")) {
            cardEl.classList.remove("selectable-card");
            cardEl.classList.add("selected-card");
        } else {
            cardEl.classList.remove("selected-card");
            cardEl.classList.add("selectable-card");
        }
    },
    countSelectedCards: () => {
        let playerEl = document.getElementById("player_deck");
        let count = 0;
        [...playerEl.children].forEach(cardEl => {
            if (cardEl.classList.contains("selected-card")) {
                count++;
            }
        });

        return count;
    },
    getSelectedCards: () => {
        let playerEl = document.getElementById("player_deck");
        let cardNames = [];
        [...playerEl.children].forEach(cardEl => {
            if (cardEl.classList.contains("selected-card")) {
                let n = cardEl.id.split('_')[2]
                cardNames.push(n);
            }
        });

        return cardNames;
    },
    enablePassCardButton: (callback, evt) => {
        let btnEl = document.getElementById("btnPassToPlayer");

        let cloneBtnEl = btnEl.cloneNode(true); // removes the current listener
        btnEl.parentNode.replaceChild(cloneBtnEl, btnEl);

        cloneBtnEl.disabled = false;
        cloneBtnEl.addEventListener("click", (e) => {
            callback(evt);
        });
    },
    disablePassCardButton: () => {
        document.getElementById("btnPassToPlayer").disabled = true;
    },
    disableStartButton: () => {
        document.getElementById("btnStartGame").disabled = true;
    },
    enableEndButton: () => {
        document.getElementById("btnEndGame").disabled = false;
    },
    disableEndButton: () => {
        document.getElementById("btnEndGame").disabled = true;
    },
    enableStartButton: () => {
        document.getElementById("btnStartGame").disabled = false;
    },
    enableDoneChoosingKittyButton: () => {
        document.getElementById("btnDoneChoosingKitty").disabled = false;
    },
    disableDoneChoosingKittyButton: () => {
        document.getElementById("btnDoneChoosingKitty").disabled = true;
    },
    markWinnerCard: (order, cardName) => {
        let cardEl = document.getElementById(`play_card_${order}_${cardName}`);
        cardEl.classList.add('winner_card');
    },
    addScores: (scores) => {
        let playersScoresEl = document.getElementById('players_scores');

        let scoreRow = document.createElement("div");
        scoreRow.classList.add("row", "score_row");

        for (let i = 0; i < 3; i++) {
            let scoreEl = document.createElement("div");
            scoreEl.classList.add("col-4");
            scoreEl.innerHTML = `<h4>${scores[i]}</h4>`;
            scoreRow.appendChild(scoreEl);
        }

        playersScoresEl.appendChild(scoreRow);
    },
    removeScores: () => {
        [...document.getElementsByClassName("score_row")].forEach(e => e.remove());
    }
}

function _calculateCardImageOffset(card) {
    if (card.isCovered()) {
        return "0px";
    }

    let suiteOffsets = {
        'H': 0,
        'D': -1950,
        'C': -3900,
        'S': -5850
    }

    let suiteOffset = suiteOffsets[card.getSuite()];
    return suiteOffset + (-150 * card.getRank()) + "px";
}

function _getBaseCardEl(ownerName, card) {
    let cardEl = document.createElement("div");
    cardEl.id = ownerName + "_" + card.getName();
    cardEl.classList.add("card");
    cardEl.style.backgroundPosition = _calculateCardImageOffset(card);
    return cardEl;
}