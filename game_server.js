class Game {

    currentHand = [];
    round = [];

    newRound(trump) {
        this.trump = trump;
    }

    playHand(playerName, cardPlayed) {
        this.currentHand.push({ name: playerName, card: cardPlayed });
    }

    handSize() {
        return this.currentHand.length;
    }

    calculateHand() {
        var bestCard = undefined;
        var bestCardPlayer = undefined;

        // the first card laid will determine suit
        for (var current of this.currentHand) {
            var currentCard = current['card'];
            if (bestCard == undefined) {
                bestCard = currentCard;
                bestCardPlayer = current['name'];
                continue;
            }

            // Treats the case where there's at least one trump
            if (this.isTrump(currentCard) || this.isTrump(bestCard)) {
                if (this.isTrump(currentCard)) {
                    if (this.isTrump(bestCard)) {// If both are trump, we check the bowers
                        if (currentCard.getRank() === 11) {
                            if (bestCard.getRank() === 11) { // If both are bowers, the bower of best suite wins
                                if (bestCard.getSuite() === this.trump.getSuite()) {
                                    continue;
                                } else {
                                    bestCard = currentCard;
                                    bestCardPlayer = current['name'];
                                }
                            } else {
                                bestCard = currentCard;
                                bestCardPlayer = current['name'];
                            }
                        }
                    } else {
                        bestCard = currentCard; // If only current is trump, it's better
                        bestCardPlayer = current['name'];
                        continue;
                    }
                } else { // current is not trump, but the previous is
                    continue;
                }
            }

            // first card laid determines suite to be followed
            if (currentCard.getSuite() !== bestCard.getSuite()) {
                continue;
            }

            // that's the A
            if (bestCard.getRank() === 1) {
                continue;
            }

            if (currentCard.getRank() === 1) {
                bestCard = currentCard;
                bestCardPlayer = current['name'];
                continue;
            }

            if (currentCard.getRank() > bestCard.getRank()) {
                bestCard = currentCard;
                bestCardPlayer = current['name'];
            }
        }

        this.currentHand = [];
        this.round.push(bestCardPlayer);
        return bestCardPlayer;
    }

    isTrump(card) {
        return card.getSuite() === this.trump.getSuite() ||
            (card.getRank() === 11 && card.getSuite() === this.trump.getMirrorSuite());
    }
}