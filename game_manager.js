function startGame() {
    endGame();
    this.context = new Context();

    // Deck setup
    let deck = new Deck();
    deck.shuffle();
    this.context.addDeck(deck);

    createPlayers();
    distributeCards();

    // visual rendering
    displayKittyDeck();
    displayPlayerDeck();
    screen.displayTrumps();

    startHand();
}

function startHand() {
    this.context.newRound();
    let order = defineOrder();
    this.context.getCurrentRound().setOrder(order);
    let hand = new Hand(order, this.context.players);
    this.context.addCurrentHand(hand);

    screen.addScores(this.context.score.getScore());

    hand.start();
    starter = hand.getCurrentPlayer();

    //For the game dynamics, we first need to pass cards around
    // Choosing trump is the next step
    // starter.chooseTrump();

    // only after trump is chosen, the initial player can check the kitty
    starter.chooseTrump(this.context);
}

function defineOrder() {
    let order = Math.floor(Math.random() * 3);

    switch (order) {
        case 0:
            return [9, 5, 2];
        case 1:
            return [2, 9, 5];
        default:
            return [5, 2, 9];
    }
}

function endGame() {
    this.context = undefined;
    screen.clearCards("player_deck");

    clearKitty();

    screen.clearCards("play_card_1");
    screen.clearCards("play_card_2");
    screen.clearCards("play_card_3");

    screen.disableDoneChoosingKittyButton();

    screen.hideTrumps();

    screen.removeScores();
}

function clearKitty() {
    screen.clearCards("kitty_1");
    screen.clearCards("kitty_2");
    screen.clearCards("kitty_3");
    screen.clearCards("kitty_4");
}

function distributeCards() {
    // first, sends 4 cards to the kitty
    let kitty = new Kitty();
    this.context.addKitty(kitty);

    for (let i = 0; i < 4; i++) {
        let card = this.context.deck.pop();
        card.cover();
        kitty.addCard(card);
    }

    this.context.deck.distributeCards(this.context.players);
}

function createPlayers() {
    this.context.addPlayer(new Player("p1", false));
    this.context.addPlayer(new Player("p2", true));
    this.context.addPlayer(new Player("p3", true));
}

function displayKittyDeck(reveal = false) {
    let kitty = this.context.kitty;
    let cards = kitty.getCards();

    [...cards].forEach((card, i) => {
        if (reveal) {
            card.flip();
        }
        screen.displayCard(`kitty_${i + 1}`, card);
    });
}

function displayPlayerDeck() {
    let p1 = this.context.getPlayer("p1");
    let cards = p1.getCards();

    screen.displayMultipleCards("player_deck", cards);
}

// event handlers

function doneChoosingKitty(e) {
    clearKitty();
    screen.showMessage("Play card");
    screen.disableDoneChoosingKittyButton();
    let hand = this.context.hand;
    currentPlayer = hand.getCurrentPlayer();
    currentPlayer.playCard(hand.trump, hand.getPlayedCards(), this.context);
}

window.addEventListener("evt_choose_trump", (evt) => {
    screen.makeTrumpClickable((e) => {
        const name = e.currentTarget.id;
        const suite = name[name.length - 1];
        evt.detail.context.hand.setTrump(suite);
        screen.markChosenTrump(name);
        window.dispatchEvent(new CustomEvent('evt_choose_from_kitty', { detail: { context: evt.detail.context } }));
        window.dispatchEvent(new CustomEvent('evt_trump_chosen', { detail: { context: evt.detail.context } }));
    });
});

window.addEventListener("evt_let_player_choose_card", evt => {
    screen.makePlayerCardsChooseable((e) => {
        let cardName = getCardNameFromEvent(e);
        let player = context.getPlayer("p1");
        let removedCard = player.removeCard(cardName);
        screen.clearCards("player_deck");
        displayPlayerDeck();
        let ctx = evt.detail.context;
        window.dispatchEvent(new CustomEvent('evt_card_played', { detail: { context: ctx, played: removedCard, playerName: player.getName() } }));
    });
});


window.addEventListener("evt_next_hand", e => {
    setTimeout(() => {
        screen.clearCards("play_card_1");
        screen.clearCards("play_card_2");
        screen.clearCards("play_card_3");

        let ctx = e.detail.context;
        let previousHand = ctx.hand;
        let hand = previousHand.newHand();
        this.context.addCurrentHand(hand);

        let previousWinner = e.detail.lastWinner.player.getName();
        hand.start(previousWinner);
        starter = hand.getCurrentPlayer();
        starter.playCard(hand.trump, hand.getPlayedCards(), ctx);
    }, 1000);
});

window.addEventListener("evt_card_played", e => {
    let ctx = e.detail.context;
    let hand = ctx.hand;
    let playedCard = e.detail.played;
    let playerName = e.detail.playerName;
    let order = ctx.hand.getPlayedCards().length;
    hand.playCard(playerName, playedCard);

    screen.displayCard(`play_card_${order + 1}`, playedCard);

    ///////////// delete here
    let calculatedScore = [-2, 1, 1];
    window.dispatchEvent(new CustomEvent("evt_start_new_round", { detail: { context: ctx, score: calculatedScore } }));

    /// uncomment below - actual code

    // if (hand.isHandDone()) {
    //     let winner = hand.getWinner();
    //     screen.showMessage("Hand winner: " + winner.player.getName() + " | card: " + winner.card.getName());
    //     let round = ctx.getCurrentRound();
    //     round.addHandWinner(winner);

    //     screen.markWinnerCard(winner.order, winner.card.getName());
    //     if (round.isDone()) {
    //         let calculatedScore = ctx.getScore().calculateScore(round.order, round.getHandWinners());
    //         ctx.getScore().addScore("p1", calculatedScore[0]);
    //         ctx.getScore().addScore("p2", calculatedScore[1]);
    //         ctx.getScore().addScore("p3", calculatedScore[2]);

    //         screen.addScores(ctx.getScore().getScore());

    //         if (ctx.getScore().isGameFinished()) {
    //             window.dispatchEvent(new CustomEvent("evt_game_finished", { detail: { context: ctx } }));
    //         } else {
    //             window.dispatchEvent(new CustomEvent("evt_start_new_round", { detail: { context: ctx, score: calculatedScore } }));
    //         }
    //     } else {
    //         window.dispatchEvent(new CustomEvent("evt_next_hand", { detail: { context: ctx, lastWinner: winner } }));
    //     }
    // } else {
    //     // let the other players play
    //     let currentPlayer = hand.getCurrentPlayer();
    //     currentPlayer.playCard(hand.trump, hand.getPlayedCards(), ctx);
    // }
});

window.addEventListener("evt_start_new_round", e => {
    setTimeout(() => {
        let context = e.detail.context;

        context.players.forEach(p => {
            p.clearCards();
        });

        // Deck setup
        let deck = new Deck();
        deck.shuffle();
        context.addDeck(deck);

        screen.clearCards("player_deck");

        clearKitty();

        screen.clearCards("play_card_1");
        screen.clearCards("play_card_2");
        screen.clearCards("play_card_3");
        screen.hideTrumps();
        screen.disableDoneChoosingKittyButton();

        distributeCards();
        displayPlayerDeck();
        screen.displayTrumps();

        let newOrder = getNewOrder(context.getCurrentRound().order);
        context.newRound();
        context.getCurrentRound().setOrder(newOrder);
        let hand = new Hand(newOrder, context.players);
        context.addCurrentHand(hand);

        // pass cards if necessary
        window.dispatchEvent(new CustomEvent("evt_pass_cards", { detail: { context: context, score: e.detail.score } }));
    }, 1000);
});

window.addEventListener("evt_pass_cards", e => {
    let context = e.detail.context;
    let hand = context.hand;
    let scores = e.detail.score;

    let players = context.players;

    // from, to, qnt
    let transfers = calculateTransfers(scores);
    context.passes += transfers['p1'].length;
    context.passes += transfers['p2'].length;
    context.passes += transfers['p3'].length;

    for (let p in transfers) {
        let t = transfers[p];
        if (t.length > 0) {
            let player = context.getPlayer(p);

            let transfer = [];

            t.forEach(each => {
                transfer.push([context.getPlayer(each[0]), each[1]]);
            })

            player.passTo(transfer, context);
        }
    }
});

function getNewOrder(order) {
    let p1 = order[0];
    let p2 = order[1];
    let p3 = order[2];

    order[0] = p3;
    order[1] = p1;
    order[2] = p2;

    return order;
}

function calculateTransfers(scores) {
    let transfers = { p1: [], p2: [], p3: [] };

    for (let i = 0; i < 3; i++) {
        let score = scores[i];

        // < 0 means passing cards
        if (score < 0) {

            // Check everybody else that is positive
            for (let j = 0; j < 3; j++) {
                if (j == i) {
                    continue;
                }

                // means we've already passed all for that player
                if (score == 0) {
                    continue;
                }

                let otherScore = scores[j];

                // we're only passing cards to the loosers
                if (otherScore <= 0) {
                    continue;
                }

                let qnt = Math.min(otherScore, Math.abs(score));

                transfers[`p${i + 1}`].push([`p${j + 1}`, qnt]);

                scores[j] = otherScore - qnt;
                scores[i] = score + qnt;
                score = scores[i];
            }
        }
    }

    return transfers;
}

window.addEventListener("evt_game_finished", e => {
    setTimeout(() => {
        alert("winner: " + e.detail.context.getScore().getWinner());
    }, 2000);
});

window.addEventListener("evt_trump_chosen", e => {

    // trump chosen by automatic player
    if (e.detail['automatic']) {
        const suit = e.detail.cardSuit;
        e.detail.context.hand.setTrump(suit);
        screen.markChosenTrump('trump_suite_' + suit.toLowerCase());
        doneChoosingKitty(e);
    } else { // trump chosen by real player
        screen.enableDoneChoosingKittyButton();
    }
});

window.addEventListener("evt_choose_from_kitty", evt => {
    clearKitty();
    displayKittyDeck(reveal = true);
    screen.showMessage("Choose cards from kitty");

    let playerCardChosenCallback = (e) => {
        let context = evt.detail.context;
        let kitty = context.kitty;

        if (kitty.getCards().length === 4) {
            return;
        }

        let cardId = e.currentTarget.id;
        let cardName = cardId.split('_')[2];
        let player = context.getPlayer("p1");
        let removedCard = player.removeCard(cardName);
        kitty.addCard(removedCard);

        for (let i = 1; i <= 4; i++) {
            if (!screen.hasCard(`kitty_${i}`)) {
                screen.displayCard(`kitty_${i}`, removedCard);
                break;
            }
        }

        screen.clearCards("player_deck");
        displayPlayerDeck();
        screen.makeKittyChooseable(kittyCardChosenCallback);
        screen.makePlayerCardsChooseable(playerCardChosenCallback);

        if (kitty.getCards().length < 4) {
            screen.disableDoneChoosingKittyButton();
        } else {
            screen.enableDoneChoosingKittyButton();
        }
    };

    screen.makePlayerCardsChooseable(playerCardChosenCallback);

    let kittyCardChosenCallback = (e) => {
        let context = evt.detail.context;
        let kitty = context.kitty;

        // the user will have to make space available in the kitty first
        // so they'll only be able to send cards to the kitty, if they take from it first

        // get card name and find it in kitty
        let cardName = getCardNameFromEvent(e);
        let removedCard = kitty.removeCard(cardName);
        let cardId = e.currentTarget.id;
        screen.removeCard(cardId);
        let player = context.getPlayer("p1");
        player.addCard(removedCard);

        screen.clearCards("player_deck");
        displayPlayerDeck();
        screen.makeKittyChooseable(kittyCardChosenCallback);
        screen.makePlayerCardsChooseable(playerCardChosenCallback);

        if (kitty.getCards().length < 4) {
            screen.disableDoneChoosingKittyButton();
        } else {
            screen.enableDoneChoosingKittyButton();
        }
    };

    screen.makeKittyChooseable(kittyCardChosenCallback);
});

window.addEventListener('evt_choose_card_to_pass', e => {
    let transfers = e.detail.transfers;

    let currentTransfer = transfers[0];

    screen.showMessage(`Pass ${currentTransfer[1]} card(s) to Player ${currentTransfer[0].getName().toUpperCase()}`);

    screen.makePlayerCardsChooseable(evt => {
        screen.selectPlayerCard(evt.currentTarget.id);

        let count = screen.countSelectedCards();
        if (count == currentTransfer[1]) {
            screen.enablePassCardButton(passCardToPlayer, e);
        } else {
            screen.disablePassCardButton();
        }
    });
});

function passCardToPlayer(e) {
    let transfer = e.detail.transfers.shift();
    let destination = transfer[0];
    let origin = e.detail.player;

    let cardNames = screen.getSelectedCards();
    let cards = [];
    for (let cardName of cardNames) {
        let card = origin.removeCard(cardName);
        cards.push(card);
    }

    let highest = destination.giveHighest(cards);

    for (let c of highest) {
        origin.addCard(c);
    }

    screen.clearCards("player_deck");

    cards = origin.getCards();
    screen.displayMultipleCards("player_deck", cards);

    screen.disablePassCardButton();

    if (e.detail.transfers.length > 0) {
        window.dispatchEvent(new CustomEvent("evt_choose_card_to_pass", { detail: e.detail }))
    } else {
        let hand = e.detail.context.hand;

        hand.start();
        let starter = hand.getCurrentPlayer();

        // only after trump is chosen, the initial player can check the kitty
        starter.chooseTrump(this.context);
    }
}

function getCardNameFromEvent(e) {
    let cardId = e.currentTarget.id;
    return cardName = cardId.split('_')[2];
}