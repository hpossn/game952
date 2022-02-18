const suiteSize = 13;

class Context {
    deck = [];
    players = [];
    kitty = undefined;
    hand = undefined;
    score = new Score();
    rounds = [];

    passes = 0;

    addDeck(deck) {
        this.deck = deck;
    }

    addKitty(kitty) {
        this.kitty = kitty;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    getPlayer(playerName) {
        return this.players.find(p => p.getName().toUpperCase() === playerName.toUpperCase());
    }

    addCurrentHand(hand) {
        this.hand = hand;
    }

    newRound() {
        this.rounds.push(new Round());
    }

    getCurrentRound() {
        return this.rounds[this.rounds.length - 1];
    }

    getScore() {
        return this.score;
    }
}

class Kitty {
    cards = [];

    addCard(card) {
        this.cards.push(card);
    }

    removeCard(cardName) {
        var index = this.cards.findIndex(c => c.getName().toUpperCase() === cardName.toUpperCase());
        if (index > -1) {
            let removedCard = this.cards.splice(index, 1)[0];
            return removedCard;
        }

        return undefined;
    }

    getCards() {
        return this.cards;
    }
}

class Deck {
    constructor() {
        this._createCards();
    }

    shuffle(n = 3) {
        for (let qnt = 0; qnt < n; qnt++) {
            for (let i = 0; i < this.cards.length; i++) {
                let newIndex = Math.floor(Math.random() * this.cards.length);
                let currentValue = this.cards[i];
                this.cards[i] = this.cards[newIndex];
                this.cards[newIndex] = currentValue;
            }
        }
    }

    pop() {
        return this.cards.pop();
    }

    distributeCards(players) {
        let playersCount = players.length;

        for (let i = 0; i < this.cards.length; i++) {
            players[i % playersCount].addCard(this.cards[i]);
        }
    }

    _createCards() {
        var suites = ['D', 'C', 'H', 'S'];
        this.cards = suites.flatMap(s => {
            let suiteCards = [];
            for (let i = 1; i <= suiteSize; i++) {
                suiteCards.push(new Card(i, s));
            }
            return suiteCards;
        });
    }
}

class Card {
    constructor(rank, suite) {
        this.rank = rank;
        this.suite = suite;
        this.covered = false;
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

    getWeight(refSuit, trump) {
        let baseWeight = this.rank == 1 ? 14 : this.rank; // A should be worth more

        if (this.isTrump(trump)) {
            // increase more for the bowers
            if (this.rank == 11) {
                if (this.getSuite().toUpperCase() == trump.toUpperCase()) { // right bower
                    return baseWeight + 40;
                } else { // left bower
                    return baseWeight + 30;
                }
            } else {
                return baseWeight + 20;
            }
        } else if (this.suite.toUpperCase() == refSuit.toUpperCase()) {
            return baseWeight;
        } else {
            return 0; // if the card doesn't follow suit, it doesn't have a value
        }
    }

    isTrump(trump) {
        if (this.suite.toUpperCase() == trump.toUpperCase()) {
            return true;
        }

        if (this.rank == 11 && this.getMirrorSuite().toUpperCase() == trump.toUpperCase()) {
            return true;
        }

        return false;
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

    cover() {
        this.covered = true;
    }

    flip() {
        this.covered = false;
    }

    isCovered() {
        return this.covered;
    }
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

    clearCards() {
        this.cards = [];
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

    chooseTrump(ctx) {
        if (this.automatic) {
            // create custom logic to choose trump
            const cardSuit = this.cards[0].getSuite();
            window.dispatchEvent(new CustomEvent('evt_trump_chosen', { detail: { automatic: true, cardSuit: cardSuit, context: ctx } }));
        } else {
            screen.showMessage("Choose trump");
            window.dispatchEvent(new CustomEvent('evt_choose_trump', { detail: { context: ctx } }));
        }
    }

    playCard(trump, played, ctx) {
        if (this.automatic) {
            // create a smarter logic here

            let chosenCard = undefined;

            if (played.length == 0) {
                chosenCard = this.cards.pop();
            } else {
                // if there's another card on the table, we have to follow suite
                let cardToFollow = played[0];
                let cardIndex = this.cards.findIndex(c => cardToFollow.getSuite() == c.getSuite());

                // if we don't have one of the same suite, we can throw another one
                // TODO: we need to check if trump has been broken
                if (cardIndex == -1) {
                    chosenCard = this.cards.pop();
                } else {
                    chosenCard = this.cards.splice(cardIndex, 1)[0];
                }
            }
            window.dispatchEvent(new CustomEvent('evt_card_played', { detail: { context: ctx, played: chosenCard, playerName: this.getName() } }));
        } else {
            window.dispatchEvent(new CustomEvent('evt_let_player_choose_card', { detail: { context: ctx, playerName: this.getName() } }));
        }
    }

    passTo(transfers, ctx) {
        let received = [];

        if (this.automatic) {

            [...transfers].forEach(transfer => {
                let to = transfer[0];
                let qnt = transfer[1];

                let send = [];
                for (let i = 0; i < qnt; i++) {
                    // TODO: should get the lowest card
                    send.push(this.getCards().pop());
                }

                let r = to.giveHighest(send);
                received.push(...r);

            });

            this.cards.push([...received]);
        } else {
            this.countTransfer = transfers.length;

            window.dispatchEvent(new CustomEvent('evt_choose_card_to_pass', { detail: { context: ctx, player: this, transfers: transfers } }));
        }
    }

    giveHighest(cards) {
        let send = [];
        [...cards].forEach(card => {
            let suit = card.getSuite();

            let highest = undefined;
            for (let each of this.getCards().filter(c => c.getSuite() == suit)) {
                if (highest == undefined) {
                    highest = each;
                } else {
                    if (each.getRank() == 1 || each.getRank() > highest.getRank()) {
                        highest = each;
                    }
                }
            }

            let i = this.getCards().indexOf(highest);

            send.push(this.getCards().splice(i, 1)[0]);
        });

        this.getCards().push(...cards);
        return send;
    }
}

class Round {
    handWinners = [];
    trumpBroken = false;
    order = [];

    addHandWinner(handWinner) {
        this.handWinners.push(handWinner);
    }

    setTrumpBroken() {
        this.trumpBroken = true;
    }

    getRoundWinner() {
        return null;
    }

    isDone() {
        return this.handWinners.length == 16;
    }

    getHandWinners() {
        return this.handWinners;
    }

    setOrder(order) {
        this.order = order;
    }
}

class Hand {
    players = {};
    order = {};
    constructor(orderSeed, players) {

        if (orderSeed != undefined && players != undefined) {
            [...players].forEach((p, index) => {
                this.order[orderSeed[index]] = p.getName();
                this.players[p.getName()] = p;
            })
        }
    }

    played = [];

    start(playerName = undefined) {

        if (playerName == undefined) {
            this.currentPlayer = this.players[this.order[9]];
            // this.currentPlayer = this.players['p1'];
        } else {
            this.currentPlayer = this.players[playerName];
        }
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    playCard(playerName, card) {
        let player = this.players[playerName];
        this.played.push({ player: player, card: card, order: this.played.length + 1 });

        if (this.played.length < 3) {
            this.nextPlayer();
        } else {
            // TODO end hand
        };
    }

    nextPlayer() {
        let playerName = this.currentPlayer.getName();
        switch (playerName) {
            case "p1":
                this.currentPlayer = this.players["p2"];
                break;
            case "p2":
                this.currentPlayer = this.players["p3"];
                break;
            case "p3":
                this.currentPlayer = this.players["p1"];
        }
    }

    isHandDone() {
        return this.played.length === 3;
    }

    setTrump(trump) {
        this.trump = trump;
    }

    getPlayedCards() {
        let cards = this.played.flatMap(e => e.card);
        return cards;
    }

    getWinner() {
        var bestPlay = this.played[0];
        const refSuit = bestPlay.card.getSuite();

        for (let i = 1; i < 3; i++) {
            const current = this.played[i];

            const bestCardWeight = bestPlay.card.getWeight(refSuit, this.trump);
            const currentCardWeight = current.card.getWeight(refSuit, this.trump);

            if (bestCardWeight - currentCardWeight < 0) {
                bestPlay = current;
            }
        }

        return bestPlay;
    }

    newHand() {
        let newHand = new Hand(undefined, undefined);
        newHand.order = Object.create(this.order);
        newHand.players = Object.create(this.players);
        newHand.trump = this.trump;
        return newHand;
    }
}

class Score {
    scores = {};

    constructor() {
        this.scores['p1'] = 25;
        this.scores['p2'] = 25;
        this.scores['p3'] = 25;
    }

    addScore(playerName, offset) {
        let current = this.scores[playerName];
        this.scores[playerName] = current + offset;
    }

    getScore() {
        let s = [];
        for (let score in this.scores) {
            s.push(this.scores[score]);
        }

        return s;
    }

    isGameFinished() {
        let scores = this.getScore();
        for (let s of scores) {
            if (s <= 0) {
                return true;
            }
        }

        return false;
    }

    getWinner() {
        let score = this.getScore();
        for (let i = 0; i < 3; i++) {
            if (score[i] <= 0) {
                return `p${i + i}`;
            }
        }
    }

    calculateScore(order, handWinners) {
        let points = { p1: 0, p2: 0, p3: 0 };
        handWinners.forEach(r => {
            points[r.player.getName()] += 1;
        });


        // reduce the points based on what the player was supposed to get in kitties.
        // e.g. they were supposed to get 5 and got 3, they have -2 points in this round
        for (let i = 0; i < 3; i++) {
            let o = order[i];
            points[`p${i + 1}`] = o - points[`p${i + 1}`];
        }

        let finalPoints = [];
        for (let p in points) {
            finalPoints.push(points[p]);
        }

        return finalPoints;
    }
}