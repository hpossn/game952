const suiteSize = 13;

var game = undefined;

function startGame() {
    let deck = createDeck();
    shuffle(deck);

    let p1 = new Player("p1", false); // only human
    let p2 = new Player("p2", true);
    let p3 = new Player("p3", true);
    let kitty = [];

    clearScreen();

    let gameOrder = makeGameOrder();

    startRound(deck, kitty, gameOrder, p1, p2, p3);
}

function startRound(deck, kitty, gameOrder, ...players) {
    distributeCards(deck, kitty, players[0], players[1], players[2]);

    players.forEach(p => {
        addCardsToScreen(p.getName(), p.getCards());
    });

    addCardsToScreen("kitty", kitty);

    // The player to start the game will choose highest from kitty
    gameOrder.forEach((order, playerIndex) => addOrderToScreen(order, playerIndex));
    let startPlayer = players[gameOrder.indexOf(Math.max(...gameOrder))];

    var eventManager = new Reactor();

    game = {
        p1: players[0],
        p2: players[1],
        p3: players[2],
        kitty: kitty,
        gamePlay: new Game(),
        gameOrder: gameOrder,
        eventManager: eventManager
    };

    eventManager.registerEvent('next_play');
    eventManager.addEventListener('next_play', nextPlay);

    chooseFromKitty(startPlayer, kitty);
}

function nextPlay(previousPlayer) {
    if (game.gamePlay.handSize() < 3) {
        var nextPlayer = getNextPlayer(previousPlayer);

        document.getElementById(previousPlayer.getName() + '_cards').classList.remove('current_player');
        document.getElementById(nextPlayer.getName() + '_cards').classList.add('current_player');

        if (nextPlayer.isComputer()) {
            computerPlay(nextPlayer);
        }
    } else {
        winner = game.gamePlay.calculateHand();
        wmanager.showHandWinner(winner);
    }
}

function finishChoosingFromKitty() {
    startHand();
}

function startHand() {
    document.getElementById('btn_finish_choosing_kitty').disabled = true;
    removeCurrentListeners();
    document.getElementById('kitty').remove();

    addListenerForCardPlay(game.p1);

    var starterPlayer = getNextPlayer();

    // visual cue for current player
    document.getElementById(starterPlayer.getName() + '_cards').classList.add('current_player');

    var trump = chooseTrump(starterPlayer.getCards());
    game.gamePlay.newRound(trump);
    wmanager.showTrump(trump.getSuite());

    if (starterPlayer.isComputer()) {
        // play as a computer
        // we'll have to change the logic here
        computerPlay(starterPlayer);
    }
}

function chooseTrump(cards) {
    return cards[0];
}

function computerPlay(player) {
    var card = player.getCards()[0];
    playCard(player, card.getName());
}

function addListenerForCardPlay(player) {
    var cardsList = document.getElementById(player.getName() + "_cards");
    [...cardsList.children].forEach(c => {
        playCardHandler = function (event) {
            cardName = event.target.innerText;
            playCard(player, cardName);
        }
        c.addEventListener('click', playCardHandler);
    });
}

function playCard(player, cardName) {
    removedCard = player.removeCard(cardName);
    game.gamePlay.playHand(player.getName(), removedCard);

    removeCardsFromScreen(player.getName(), [removedCard]);
    addCardsToScreen('board', [removedCard]);
    game.eventManager.dispatchEvent('next_play', player);
}

function removeCurrentListeners() {
    // Removing the click listeners we currently have, as the action will be different

    ['p1', 'p2', 'p3', 'kitty'].forEach(p => {
        var cardsListElements = document.getElementById(p + "_cards").children;
        [...cardsListElements].forEach(child => child.replaceWith(child.cloneNode(true))); // for now, replacing the object because the current callbacks dont have name
    });
}

function getNextPlayer(previousPlayer = undefined) {
    let order = game.gameOrder;
    if (previousPlayer === undefined) {
        let index = order.indexOf(Math.max(...order));
        switch (index) {
            case 0:
                return game.p1;
            case 1:
                return game.p2;
            case 2:
                return game.p3;
        }
    } else {
        playerIndex = (Number(previousPlayer.getName()[1]) - 1);
        playerOrder = order[playerIndex];
        nextPlayerIndex = undefined;
        switch (playerOrder) {
            case 2:
                nextPlayerIndex = order.indexOf(9);
                break;
            case 5:
                nextPlayerIndex = order.indexOf(2);
                break;
            case 9:
                nextPlayerIndex = order.indexOf(5);
                break;
        }
        switch (nextPlayerIndex) {
            case 0:
                return game.p1;
            case 1:
                return game.p2;
            case 2:
                return game.p3;
        }

    }
}

function chooseFromKitty(player, kitty) {
    if (player.isComputer()) {
        // TODO:
        // we can do some fancy logic here to choose the best cards from kitty
        // as of now, let's not choose none
    }

    var data = {
        'player': player,
        'kitty': kitty
    };

    // make kitty chooseable
    var kittiesCardElements = document.getElementById("kitty" + "_cards");
    [...kittiesCardElements.children].forEach(c => {
        c.addEventListener("click", {
            handleEvent: function (event) {
                cardFromKittyToPlayerEventListener(event, data);
            }
        });
    });

    // make player cards chooseable
    var playerCardElements = document.getElementById(player.getName() + "_cards");
    [...playerCardElements.children].forEach(c => {
        c.addEventListener("click", {
            handleEvent: function (event) {
                cardFromPlayerToKittyEventListener(event, data);
            }
        });
    });

    document.getElementById('btn_finish_choosing_kitty').disabled = false;
}

function cardFromPlayerToKittyEventListener(event, data) {
    var player = data['player'];
    var kitty = data['kitty'];

    // remove from the player
    var cardName = event.target.innerText;
    var card = removeCardFromPlayer(player, cardName);

    // adds to the kitty
    kitty.push(card);

    var clickListenerContext = {
        'data': data,
        'callback': cardFromKittyToPlayerEventListener
    };

    addCardsToScreen("kitty", [card], clickListenerContext);
}

function cardFromKittyToPlayerEventListener(event, data) {
    var player = data['player'];
    var kitty = data['kitty'];

    // remove from the kitty
    var cardName = event.target.innerText;
    var kittyCard = removeCardFromKitty(kitty, cardName);

    // adds to the player
    player.addCard(kittyCard);
    var clickListenerContext = {
        'data': data,
        'callback': cardFromPlayerToKittyEventListener
    };
    addCardsToScreen(player.getName(), [kittyCard], clickListenerContext);
}

function addCardToPlayer(player, card) {
    player.addCard(card);
    var clickListenerContext = {
        'data': {
            'player': player
        },
        'callback': cardFromPlayerToKittyEventListener
    };
    addCardsToScreen(player.getName(), [card], clickListenerContext);
}

function removeCardFromPlayer(player, cardName) {
    var card = player.removeCard(cardName);
    removeCardsFromScreen(player.getName(), [card]);
    return card;
}

function removeCardFromKitty(kitty, cardName) {
    let index = kitty.findIndex(c => c.getName().toUpperCase() === cardName.toUpperCase());
    if (index < 0) {
        return undefined;
    }

    var card = kitty.splice(index, 1)[0];
    removeCardsFromScreen("kitty", [card]);
    return card;
}

function makeGameOrder() {
    let starter = Math.floor(Math.random() * 3);

    switch (starter) {
        case 0:
            return [9, 5, 2];
        case 1:
            return [2, 9, 5];
        default:
            return [5, 2, 9];
    }
}

function createDeck() {
    var suites = ['D', 'C', 'H', 'S'];

    var deck = suites.flatMap(s => {
        let suiteCards = [];
        for (let i = 1; i <= suiteSize; i++) {
            suiteCards.push(new Card(i, s));
        }
        return suiteCards;
    });

    return deck;
}

function shuffle(deck, n = 3) {
    for (qnt = 0; qnt < n; qnt++) {
        for (let i = 0; i < deck.length; i++) {
            let newIndex = Math.floor(Math.random() * deck.length);
            let currentValue = deck[i];
            deck[i] = deck[newIndex];
            deck[newIndex] = currentValue;
        }
    }
}

function printDeck(deck) {
    console.log("Deck")

    deck.forEach(c => {
        console.log(c.getName())
    });
}

function distributeCards(deck, kitty, ...players) {
    let kittySize = 4;

    for (let i = 0; i < kittySize; i++) {
        kitty.push(deck.pop());
    }

    let playersCount = players.length;

    for (let i = 0; i < deck.length; i++) {
        players[i % playersCount].addCard(deck[i]);
    }
}

// If we need to pass an event listener, we can add it passing an object in the format
// { data: object, callback: function }. The function should accept the event and the data

function addCardsToScreen(name, cards, clickListenerContext = undefined) {
    var cardsList = document.getElementById(name + "_cards");

    cards.forEach(c => {
        let liEl = document.createElement("li");
        liEl.id = c.getName();
        liEl.setAttribute("class", "regular_card");
        liEl.appendChild(document.createTextNode(c.getName()));
        if (clickListenerContext) {
            liEl.addEventListener('click', {
                handleEvent: function (event) {
                    let data = clickListenerContext['data'];
                    let cb = clickListenerContext['callback'];
                    cb(event, data);
                }
            })
        }
        cardsList.append(liEl);
    });
}

function removeCardsFromScreen(name, cards) {
    var cardsList = document.getElementById(name + "_cards");
    var children = cardsList.children;
    cards.forEach(cardToBeRemoved => children.namedItem(cardToBeRemoved.getName()).remove());
}

function addOrderToScreen(order, playerIndex) {
    let playerName = 'p' + (playerIndex + 1);
    document.getElementById(`${playerName}_position`).innerText = `(${order})`;
}

function clearScreen() {
    var p1cards = document.getElementById("p1_cards");
    p1cards.innerHTML = '';
    p1cards.classList.remove('current_player');

    var p2cards = document.getElementById("p2_cards");
    p2cards.innerHTML = '';
    p2cards.classList.remove('current_player');

    var p3cards = document.getElementById("p3_cards");
    p3cards.innerHTML = '';
    p3cards.classList.remove('current_player');

    kitty = document.getElementById("kitty_cards");
    if (kitty) {
        kitty.innerHTML = '';
    } else {
        kitty = document.createElement('div');
        kitty.classList.add('kitty');
        kitty.id = 'kitty';
        kitty.innerHTML = 'Kitty<ul id="kitty_cards"></ul>';
        container = document.getElementById("container");
        container.insertBefore(kitty, document.getElementById('p3_player').nextSibling);
    }

    document.getElementById("p1_position").innerText = '';
    document.getElementById("p2_position").innerText = '';
    document.getElementById("p3_position").innerText = '';

    var p3cards = document.getElementById("board_cards");
    p3cards.innerHTML = '';

    document.getElementById('btn_finish_choosing_kitty').disabled = true;
    document.getElementById('hand_winner').innerHTML = '';
    document.getElementById('trump').innerHTML = '';
}

class Player {
    constructor(name, automatic) {
        this.name = name;
        this.cards = [];
        this.automatic = automatic;
    }

    getName() {
        return this.name;
    }

    addCard(card) {
        this.cards.push(card);
    }

    getCards() {
        return this.cards;
    }

    removeCard(cardName) {
        var index = this.cards.findIndex(c => c.getName().toUpperCase() === cardName.toUpperCase());
        if (index > -1) {
            let removedCard = this.cards.splice(index, 1)[0];
            return removedCard;
        }

        return undefined;
    }

    isComputer() {
        return this.automatic;
    }
}

class Card {
    constructor(rank, suite) {
        this.rank = rank;
        this.suite = suite;
    }

    getName() {
        switch (this.rank) {
            case 1:
                return 'A' + this.suite;
            case 13:
                return 'K' + this.suite;
            case 12:
                return 'Q' + this.suite;
            case 11:
                return 'J' + this.suite;
            default: return this.rank + this.suite;
        }
    }

    getSuite() {
        return this.suite;
    }

    getRank() {
        return this.rank;
    }

    getMirrorSuite() {
        switch (this.suite) {
            case 'H':
                return 'D';
            case 'D':
                return 'H';
            case 'C':
                return 'S';
            case 'S':
                return 'C';
        }
    }
}


//-------------- Event engine

function Event(name) {
    this.name = name;
    this.callbacks = [];
    this.registerCallback = function (callback) {
        this.callbacks.push(callback);
    }
}

function Reactor() {
    this.events = {};
    this.registerEvent = function (eventName) {
        var event = new Event(eventName);
        this.events[eventName] = event;
    };
    this.dispatchEvent = function (eventName, eventArgs) {
        this.events[eventName].callbacks.forEach(cb => cb(eventArgs));
    }
    this.addEventListener = function (eventName, cb) {
        this.events[eventName].registerCallback(cb);
    }
}